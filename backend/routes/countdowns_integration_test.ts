import { assertEquals, assertExists } from "@std/assert";
import app from "../main.ts";

// Test helper to make requests to the app
async function makeRequest(
  method: string,
  url: string,
  body?: any,
  headers: Record<string, string> = {}
) {
  const request = new Request(`http://localhost${url}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return await app.fetch(request);
}

// Helper to create a test countdown
function createTestCountdown() {
  return {
    title: "Test Countdown",
    text: "This is a test countdown",
    expiration: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
  };
}

Deno.test("Rate limiting integration - allows requests under limit", async () => {
  const countdown = createTestCountdown();
  
  // Make 5 requests (under the limit of 10)
  for (let i = 0; i < 5; i++) {
    const response = await makeRequest("POST", "/api/countdowns", countdown, {
      "X-Forwarded-For": "192.168.1.100", // Simulate specific IP
    });
    
    assertEquals(response.status, 201);
    const body = await response.json();
    assertExists(body.id);
    assertEquals(body.title, countdown.title);
  }
});

Deno.test("Rate limiting integration - blocks requests over limit", async () => {
  const countdown = createTestCountdown();
  const clientIP = "192.168.2.101";
  
  // Make 10 requests (at the limit)
  for (let i = 0; i < 10; i++) {
    const response = await makeRequest("POST", "/api/countdowns", countdown, {
      "X-Forwarded-For": clientIP,
    });
    assertEquals(response.status, 201);
  }
  
  // The 11th request should be rate limited
  const response = await makeRequest("POST", "/api/countdowns", countdown, {
    "X-Forwarded-For": clientIP,
  });
  
  assertEquals(response.status, 429);
  const body = await response.json();
  assertEquals(body.error, "Rate limit exceeded");
  assertEquals(body.limit, 10);
  assertEquals(body.window, 180);
  assertExists(body.retryAfter);
});

Deno.test("Rate limiting integration - different IPs have separate limits", async () => {
  const countdown = createTestCountdown();
  
  // IP1 makes 10 requests
  for (let i = 0; i < 10; i++) {
    const response = await makeRequest("POST", "/api/countdowns", countdown, {
      "X-Forwarded-For": "192.168.3.102",
    });
    assertEquals(response.status, 201);
  }
  
  // IP2 should still be able to make requests
  const response = await makeRequest("POST", "/api/countdowns", countdown, {
    "X-Forwarded-For": "192.168.3.103",
  });
  assertEquals(response.status, 201);
});

Deno.test("Rate limiting integration - GET requests are not rate limited", async () => {
  // Make many GET requests to ensure they're not rate limited
  for (let i = 0; i < 15; i++) {
    const response = await makeRequest("GET", "/api/countdowns", undefined, {
      "X-Forwarded-For": "192.168.1.104",
    });
    assertEquals(response.status, 200);
  }
});

Deno.test("Rate limiting integration - handles missing IP gracefully", async () => {
  const countdown = createTestCountdown();
  
  // Make request without IP headers
  const response = await makeRequest("POST", "/api/countdowns", countdown);
  assertEquals(response.status, 201);
  
  const body = await response.json();
  assertExists(body.id);
});

Deno.test("Rate limiting integration - respects X-Real-IP header", async () => {
  const countdown = createTestCountdown();
  const clientIP = "203.0.113.20";
  
  // Make 10 requests using X-Real-IP
  for (let i = 0; i < 10; i++) {
    const response = await makeRequest("POST", "/api/countdowns", countdown, {
      "X-Real-IP": clientIP,
    });
    assertEquals(response.status, 201);
  }
  
  // The 11th request should be rate limited
  const response = await makeRequest("POST", "/api/countdowns", countdown, {
    "X-Real-IP": clientIP,
  });
  
  assertEquals(response.status, 429);
});

Deno.test("Rate limiting integration - handles concurrent requests correctly", async () => {
  const countdown = createTestCountdown();
  const clientIP = "192.168.5.105";
  
  // Make 12 concurrent requests
  const promises = [];
  for (let i = 0; i < 12; i++) {
    promises.push(
      makeRequest("POST", "/api/countdowns", countdown, {
        "X-Forwarded-For": clientIP,
      })
    );
  }
  
  const responses = await Promise.all(promises);
  
  // Count successful and rate-limited responses
  let successCount = 0;
  let rateLimitedCount = 0;
  
  for (const response of responses) {
    if (response.status === 201) {
      successCount++;
    } else if (response.status === 429) {
      rateLimitedCount++;
    }
  }
  
  // Should have exactly 10 successful requests and 2 rate-limited
  assertEquals(successCount, 10);
  assertEquals(rateLimitedCount, 2);
});

Deno.test("Rate limiting integration - error response format", async () => {
  const countdown = createTestCountdown();
  const clientIP = "192.168.6.106";
  
  // Exceed the rate limit
  for (let i = 0; i < 10; i++) {
    await makeRequest("POST", "/api/countdowns", countdown, {
      "X-Forwarded-For": clientIP,
    });
  }
  
  const response = await makeRequest("POST", "/api/countdowns", countdown, {
    "X-Forwarded-For": clientIP,
  });
  
  assertEquals(response.status, 429);
  const body = await response.json();
  
  // Verify response format matches specification
  assertEquals(body.error, "Rate limit exceeded");
  assertExists(body.message);
  assertExists(body.retryAfter);
  assertEquals(body.limit, 10);
  assertEquals(body.window, 180);
  
  // Verify message contains useful information
  assertEquals(typeof body.message, "string");
  assertEquals(typeof body.retryAfter, "number");
  assertEquals(body.retryAfter > 0, true);
  assertEquals(body.retryAfter <= 180, true); // Should be within the window
});