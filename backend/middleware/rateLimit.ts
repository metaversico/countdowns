import { Context, Next } from "hono";

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  trustProxy: boolean; // Whether to trust proxy headers
  enabled: boolean; // Whether rate limiting is enabled
}

export interface RateLimitRecord {
  ip: string;
  window: number; // Unix timestamp of window start
  count: number;
  firstRequest: number; // Timestamp of first request in window
  lastRequest: number; // Timestamp of most recent request
}

// Extract client IP from request context
export function extractClientIP(ctx: Context, config: RateLimitConfig): string {
  if (!config.trustProxy) {
    return ctx.env?.remoteAddr?.hostname || "unknown";
  }

  // Check X-Forwarded-For header (comma-separated list, first is original client)
  const xForwardedFor = ctx.req.header("X-Forwarded-For");
  if (xForwardedFor) {
    const firstIP = xForwardedFor.split(",")[0]?.trim();
    if (firstIP) {
      return firstIP;
    }
  }

  // Check X-Real-IP header
  const xRealIP = ctx.req.header("X-Real-IP");
  if (xRealIP) {
    return xRealIP.trim();
  }

  // Fallback to remote address
  return ctx.env?.remoteAddr?.hostname || "unknown";
}

// Create rate limiting middleware
export function rateLimitMiddleware(config: RateLimitConfig, kv: Deno.Kv) {
  return async (ctx: Context, next: Next) => {
    // Skip if rate limiting is disabled
    if (!config.enabled) {
      await next();
      return;
    }

    const ip = extractClientIP(ctx, config);
    const now = Date.now();
    const windowStart = Math.floor(now / config.windowMs) * config.windowMs;

    try {
      // Get current rate limit record for this IP and window
      const key = ["rate_limit", ip, windowStart];
      
      // Use atomic operations to prevent race conditions
      let retryCount = 0;
      const maxRetries = 5;
      
      while (retryCount < maxRetries) {
        const result = await kv.get(key);
        const record = result.value as RateLimitRecord | null;

        if (!record) {
          // First request in this window - use atomic operation
          const newRecord: RateLimitRecord = {
            ip,
            window: windowStart,
            count: 1,
            firstRequest: now,
            lastRequest: now,
          };

          const atomicOp = kv.atomic()
            .check({ key, versionstamp: null })
            .set(key, newRecord, { expireIn: config.windowMs });

          const atomicResult = await atomicOp.commit();
          
          if (atomicResult.ok) {
            await next();
            return;
          }
          
          // If atomic operation failed, retry
          retryCount++;
          continue;
        }

        // Check if we're over the limit
        if (record.count >= config.maxRequests) {
          const retryAfterMs = windowStart + config.windowMs - now;
          const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

          return ctx.json({
            error: "Rate limit exceeded",
            message: `Maximum ${config.maxRequests} countdowns per ${config.windowMs / 1000} seconds. Try again in ${retryAfterSeconds} seconds.`,
            retryAfter: retryAfterSeconds,
            limit: config.maxRequests,
            window: config.windowMs / 1000,
          }, 429);
        }

        // Increment the counter atomically
        const updatedRecord: RateLimitRecord = {
          ...record,
          count: record.count + 1,
          lastRequest: now,
        };

        const atomicOp = kv.atomic()
          .check({ key, versionstamp: result.versionstamp })
          .set(key, updatedRecord, { expireIn: config.windowMs });

        const atomicResult = await atomicOp.commit();
        
        if (atomicResult.ok) {
          await next();
          return;
        }
        
        // If atomic operation failed, retry
        retryCount++;
      }
      
      // If we've exhausted retries, fail safely by allowing the request
      console.warn("Rate limiting: exhausted atomic retries, allowing request");
      await next();
    } catch (error) {
      // If KV is unavailable, log error but don't block requests
      console.error("Rate limiting KV error:", error);
      await next();
    }
  };
}

// Get default configuration from environment variables
export function getDefaultRateLimitConfig(): RateLimitConfig {
  return {
    windowMs: parseInt(Deno.env.get("RATE_LIMIT_WINDOW") || "180") * 1000, // 3 minutes
    maxRequests: parseInt(Deno.env.get("RATE_LIMIT_MAX_REQUESTS") || "10"),
    trustProxy: Deno.env.get("RATE_LIMIT_TRUST_PROXY") === "true",
    enabled: Deno.env.get("RATE_LIMIT_ENABLED") !== "false",
  };
}