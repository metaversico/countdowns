import { assertEquals, assertRejects } from "@std/assert";
import { Context } from "hono";
import { rateLimitMiddleware, extractClientIP, RateLimitConfig } from "./rateLimit.ts";

// Mock KV store for testing
class MockKV {
  private store = new Map<string, { value: any; versionstamp: string }>();
  private versionCounter = 0;

  async get(key: any[]) {
    const keyStr = JSON.stringify(key);
    const item = this.store.get(keyStr);
    return item ? { value: item.value, versionstamp: item.versionstamp } : { value: null, versionstamp: null };
  }

  async set(key: any[], value: any, options?: { expireIn?: number }) {
    const keyStr = JSON.stringify(key);
    const versionstamp = `v${++this.versionCounter}`;
    this.store.set(keyStr, { value, versionstamp });
    return { ok: true };
  }

  atomic() {
    const operations: any[] = [];
    let checks: any[] = [];
    const self = this;

    const builder = {
      check: (check: any) => {
        checks.push(check);
        return builder;
      },
      set: (key: any[], value: any, options?: any) => {
        operations.push({ type: 'set', key, value, options });
        return builder;
      },
      commit: async () => {
        // Verify all checks pass
        for (const check of checks) {
          const keyStr = JSON.stringify(check.key);
          const item = self.store.get(keyStr);
          
          if (check.versionstamp === null && item) {
            return { ok: false }; // Key should not exist but does
          }
          
          if (check.versionstamp !== null && (!item || item.versionstamp !== check.versionstamp)) {
            return { ok: false }; // Version mismatch
          }
        }

        // Execute all operations
        for (const op of operations) {
          if (op.type === 'set') {
            await self.set(op.key, op.value, op.options);
          }
        }

        return { ok: true };
      }
    };

    return builder;
  }

  clear() {
    this.store.clear();
    this.versionCounter = 0;
  }
}

// Mock context factory
function createMockContext(headers: Record<string, string> = {}, ip = "192.168.1.1"): Context {
  return {
    req: {
      header: (name: string) => headers[name],
    },
    env: {
      remoteAddr: { hostname: ip },
    },
    json: (data: any, status?: number) => new Response(JSON.stringify(data), {
      status: status || 200,
      headers: { "Content-Type": "application/json" },
    }),
  } as any;
}

const testConfig: RateLimitConfig = {
  windowMs: 180000, // 3 minutes
  maxRequests: 10,
  trustProxy: false,
  enabled: true,
};

Deno.test("extractClientIP - basic IP extraction", () => {
  const ctx = createMockContext({}, "127.0.0.1");
  const ip = extractClientIP(ctx, testConfig);
  assertEquals(ip, "127.0.0.1");
});

Deno.test("extractClientIP - X-Forwarded-For with trust proxy enabled", () => {
  const configWithProxy = { ...testConfig, trustProxy: true };
  const ctx = createMockContext({ "X-Forwarded-For": "203.0.113.1, 70.41.3.18" }, "192.168.1.1");
  const ip = extractClientIP(ctx, configWithProxy);
  assertEquals(ip, "203.0.113.1");
});

Deno.test("extractClientIP - X-Forwarded-For with trust proxy disabled", () => {
  const ctx = createMockContext({ "X-Forwarded-For": "203.0.113.1" }, "192.168.1.1");
  const ip = extractClientIP(ctx, testConfig);
  assertEquals(ip, "192.168.1.1");
});

Deno.test("extractClientIP - X-Real-IP header with trust proxy enabled", () => {
  const configWithProxy = { ...testConfig, trustProxy: true };
  const ctx = createMockContext({ "X-Real-IP": "203.0.113.5" }, "192.168.1.1");
  const ip = extractClientIP(ctx, configWithProxy);
  assertEquals(ip, "203.0.113.5");
});

Deno.test("rate limiting - allows requests under limit", async () => {
  const mockKv = new MockKV();
  const middleware = rateLimitMiddleware(testConfig, mockKv as any);
  const ctx = createMockContext();
  
  let nextCalled = false;
  const next = async () => { nextCalled = true; };
  
  await middleware(ctx, next);
  assertEquals(nextCalled, true);
});

Deno.test("rate limiting - blocks requests over limit", async () => {
  const mockKv = new MockKV();
  const middleware = rateLimitMiddleware(testConfig, mockKv as any);
  const ctx = createMockContext();
  
  // Simulate already having 10 requests in the current window
  const ip = "192.168.1.1";
  const now = Date.now();
  const windowStart = Math.floor(now / testConfig.windowMs) * testConfig.windowMs;
  
  await mockKv.set(["rate_limit", ip, windowStart], {
    ip,
    window: windowStart,
    count: 10,
    firstRequest: now - 1000,
    lastRequest: now - 100,
  });
  
  const result = await middleware(ctx, async () => {}) as Response;
  assertEquals(result instanceof Response, true);
  assertEquals(result.status, 429);
  
  const body = await result.json();
  assertEquals(body.error, "Rate limit exceeded");
  assertEquals(body.limit, 10);
  assertEquals(body.window, 180);
});

Deno.test("rate limiting - resets after window expires", async () => {
  const mockKv = new MockKV();
  const middleware = rateLimitMiddleware(testConfig, mockKv as any);
  const ctx = createMockContext();
  
  const ip = "192.168.1.1";
  const oldWindow = Math.floor(Date.now() / testConfig.windowMs) * testConfig.windowMs - testConfig.windowMs;
  
  // Set an old window with max requests
  await mockKv.set(["rate_limit", ip, oldWindow], {
    ip,
    window: oldWindow,
    count: 10,
    firstRequest: oldWindow,
    lastRequest: oldWindow + 1000,
  });
  
  let nextCalled = false;
  const next = async () => { nextCalled = true; };
  
  await middleware(ctx, next);
  assertEquals(nextCalled, true);
});

Deno.test("rate limiting - increments counter correctly", async () => {
  const mockKv = new MockKV();
  const middleware = rateLimitMiddleware(testConfig, mockKv as any);
  const ctx = createMockContext();
  
  const ip = "192.168.1.1";
  const now = Date.now();
  const windowStart = Math.floor(now / testConfig.windowMs) * testConfig.windowMs;
  
  // First request
  await middleware(ctx, async () => {});
  
  const record1 = await mockKv.get(["rate_limit", ip, windowStart]);
  assertEquals(record1.value.count, 1);
  assertEquals(record1.value.ip, ip);
  assertEquals(record1.value.window, windowStart);
  
  // Second request
  await middleware(ctx, async () => {});
  
  const record2 = await mockKv.get(["rate_limit", ip, windowStart]);
  assertEquals(record2.value.count, 2);
});

Deno.test("rate limiting - handles concurrent requests", async () => {
  const mockKv = new MockKV();
  const middleware = rateLimitMiddleware(testConfig, mockKv as any);
  
  const promises = [];
  for (let i = 0; i < 5; i++) {
    const ctx = createMockContext({}, `192.168.1.${i}`);
    promises.push(middleware(ctx, async () => {}));
  }
  
  const results = await Promise.all(promises);
  
  // All should succeed as they're from different IPs
  for (const result of results) {
    assertEquals(result, undefined); // No response means next() was called
  }
});

Deno.test("rate limiting - disabled configuration", async () => {
  const disabledConfig = { ...testConfig, enabled: false };
  const mockKv = new MockKV();
  const middleware = rateLimitMiddleware(disabledConfig, mockKv as any);
  const ctx = createMockContext();
  
  let nextCalled = false;
  const next = async () => { nextCalled = true; };
  
  await middleware(ctx, next);
  assertEquals(nextCalled, true);
});

Deno.test("rate limiting - IPv6 address handling", () => {
  const ctx = createMockContext({}, "2001:db8::1");
  const ip = extractClientIP(ctx, testConfig);
  assertEquals(ip, "2001:db8::1");
});

Deno.test("rate limiting - calculates retry-after correctly", async () => {
  const mockKv = new MockKV();
  const middleware = rateLimitMiddleware(testConfig, mockKv as any);
  const ctx = createMockContext();
  
  const ip = "192.168.1.1";
  const now = Date.now();
  const windowStart = Math.floor(now / testConfig.windowMs) * testConfig.windowMs;
  
  await mockKv.set(["rate_limit", ip, windowStart], {
    ip,
    window: windowStart,
    count: 10,
    firstRequest: windowStart,
    lastRequest: now,
  });
  
  const result = await middleware(ctx, async () => {}) as Response;
  const body = await result.json();
  
  const expectedRetryAfter = Math.ceil((windowStart + testConfig.windowMs - now) / 1000);
  assertEquals(body.retryAfter, expectedRetryAfter);
});