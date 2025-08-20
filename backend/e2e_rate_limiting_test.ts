import { assertEquals, assertExists } from "@std/assert";
import app from "./main.ts";

// Test configuration with reduced limits for faster testing
const TEST_CONFIG = {
  RATE_LIMIT_WINDOW: "10", // 10 seconds window for testing
  RATE_LIMIT_MAX_REQUESTS: "3", // 3 requests max for testing
  RATE_LIMIT_ENABLED: "true",
  RATE_LIMIT_TRUST_PROXY: "true",
};

// Set test environment variables
for (const [key, value] of Object.entries(TEST_CONFIG)) {
  Deno.env.set(key, value);
}

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
function createTestCountdown(title = "Test Countdown") {
  return {
    title,
    text: "This is a test countdown",
    expiration: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
  };
}

// Helper to wait for a specified time
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

Deno.test("E2E Rate Limiting - Complete user workflow", async () => {
  const clientIP = "203.0.113.200";
  const countdown = createTestCountdown("E2E Test Countdown");
  
  console.log("Step 1: Create countdowns up to the limit (3 requests)");
  
  const successfulRequests = [];
  for (let i = 1; i <= 3; i++) {
    const response = await makeRequest("POST", "/api/countdowns", {
      ...countdown,
      title: `${countdown.title} ${i}`,
    }, {
      "X-Forwarded-For": clientIP,
    });
    
    assertEquals(response.status, 201, `Request ${i} should succeed`);
    const body = await response.json();
    assertExists(body.id);
    assertEquals(body.title, `${countdown.title} ${i}`);
    successfulRequests.push(body);
    
    console.log(`✓ Request ${i}: Created countdown "${body.title}" with ID ${body.id}`);
  }
  
  console.log("Step 2: Attempt to exceed the rate limit (4th request)");
  
  const rateLimitedResponse = await makeRequest("POST", "/api/countdowns", {
    ...countdown,
    title: "Should be rate limited",
  }, {
    "X-Forwarded-For": clientIP,
  });
  
  assertEquals(rateLimitedResponse.status, 429, "4th request should be rate limited");
  const rateLimitBody = await rateLimitedResponse.json();
  
  console.log(`✓ Rate limit triggered: ${rateLimitBody.message}`);
  
  // Verify rate limit response format
  assertEquals(rateLimitBody.error, "Rate limit exceeded");
  assertEquals(rateLimitBody.limit, 3);
  assertEquals(rateLimitBody.window, 10);
  assertExists(rateLimitBody.retryAfter);
  assertExists(rateLimitBody.message);
  
  console.log(`✓ Retry after: ${rateLimitBody.retryAfter} seconds`);
  
  console.log("Step 3: Verify that GET requests are not rate limited");
  
  const listResponse = await makeRequest("GET", "/api/countdowns", undefined, {
    "X-Forwarded-For": clientIP,
  });
  
  assertEquals(listResponse.status, 200, "GET requests should not be rate limited");
  const countdowns = await listResponse.json();
  
  // Should include our 3 created countdowns
  const ourCountdowns = countdowns.filter((c: any) => 
    c.title.startsWith("E2E Test Countdown")
  );
  assertEquals(ourCountdowns.length, 3, "All 3 countdowns should be listed");
  
  console.log(`✓ Listed ${ourCountdowns.length} countdowns (GET not rate limited)`);
  
  console.log("Step 4: Verify different IP can still create countdowns");
  
  const differentIPResponse = await makeRequest("POST", "/api/countdowns", {
    ...countdown,
    title: "Different IP Countdown",
  }, {
    "X-Forwarded-For": "203.0.113.201", // Different IP
  });
  
  assertEquals(differentIPResponse.status, 201, "Different IP should not be rate limited");
  const differentIPBody = await differentIPResponse.json();
  assertEquals(differentIPBody.title, "Different IP Countdown");
  
  console.log(`✓ Different IP successfully created countdown: ${differentIPBody.title}`);
  
  console.log("Step 5: Wait for rate limit window to expire and retry");
  
  const waitTime = Math.min(rateLimitBody.retryAfter * 1000 + 1000, 12000); // Wait for window + 1 second, max 12 seconds
  console.log(`Waiting ${waitTime}ms for rate limit window to expire...`);
  
  await wait(waitTime);
  
  const retryResponse = await makeRequest("POST", "/api/countdowns", {
    ...countdown,
    title: "After rate limit reset",
  }, {
    "X-Forwarded-For": clientIP,
  });
  
  assertEquals(retryResponse.status, 201, "Request should succeed after window reset");
  const retryBody = await retryResponse.json();
  assertEquals(retryBody.title, "After rate limit reset");
  
  console.log(`✓ Rate limit reset: Successfully created "${retryBody.title}"`);
  
  console.log("Step 6: Verify final state");
  
  const finalListResponse = await makeRequest("GET", "/api/countdowns");
  assertEquals(finalListResponse.status, 200);
  const finalCountdowns = await finalListResponse.json();
  
  const ourFinalCountdowns = finalCountdowns.filter((c: any) => 
    c.title.includes("E2E Test") || c.title.includes("Different IP") || c.title.includes("After rate limit")
  );
  
  // Should have 5 total: 3 original + 1 different IP + 1 after reset
  assertEquals(ourFinalCountdowns.length, 5, "Should have all 5 test countdowns");
  
  console.log(`✓ Final verification: ${ourFinalCountdowns.length} total test countdowns created`);
  console.log("✅ E2E Rate Limiting Test PASSED - All workflows verified!");
});

Deno.test("E2E Rate Limiting - Error response structure validation", async () => {
  const clientIP = "203.0.113.210";
  const countdown = createTestCountdown("Structure Test");
  
  // Create requests up to limit
  for (let i = 0; i < 3; i++) {
    await makeRequest("POST", "/api/countdowns", countdown, {
      "X-Forwarded-For": clientIP,
    });
  }
  
  // Trigger rate limit
  const response = await makeRequest("POST", "/api/countdowns", countdown, {
    "X-Forwarded-For": clientIP,
  });
  
  assertEquals(response.status, 429);
  const body = await response.json();
  
  // Validate complete error structure as specified in the RFC
  assertEquals(typeof body.error, "string");
  assertEquals(typeof body.message, "string");
  assertEquals(typeof body.retryAfter, "number");
  assertEquals(typeof body.limit, "number");
  assertEquals(typeof body.window, "number");
  
  // Validate specific values
  assertEquals(body.error, "Rate limit exceeded");
  assertEquals(body.limit, 3);
  assertEquals(body.window, 10);
  assertEquals(body.retryAfter > 0, true);
  assertEquals(body.retryAfter <= 10, true);
  
  // Validate message format
  assertEquals(body.message.includes("Maximum 3 countdowns"), true);
  assertEquals(body.message.includes("10 seconds"), true);
  assertEquals(body.message.includes("Try again"), true);
  
  console.log("✅ Error response structure validation PASSED");
});

Deno.test("E2E Rate Limiting - Concurrent requests handling", async () => {
  const clientIP = "203.0.113.220";
  const countdown = createTestCountdown("Concurrent Test");
  
  console.log("Testing concurrent request handling...");
  
  // Make 6 concurrent requests (should only allow 3)
  const promises = [];
  for (let i = 0; i < 6; i++) {
    promises.push(
      makeRequest("POST", "/api/countdowns", {
        ...countdown,
        title: `${countdown.title} ${i}`,
      }, {
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
  
  // Should have exactly 3 successful and 3 rate-limited
  assertEquals(successCount, 3, "Should have exactly 3 successful requests");
  assertEquals(rateLimitedCount, 3, "Should have exactly 3 rate-limited requests");
  
  console.log(`✓ Concurrent handling: ${successCount} successful, ${rateLimitedCount} rate-limited`);
  console.log("✅ Concurrent requests test PASSED");
});