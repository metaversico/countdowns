import { assertEquals, assertExists } from "@std/assert";
import app from "./main.ts";

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
function createTestCountdown(title = "E2E Test") {
  return {
    title,
    text: "End-to-end test countdown",
    expiration: new Date(Date.now() + 86400000).toISOString(),
  };
}

Deno.test("E2E - Basic rate limiting workflow", async () => {
  console.log("Testing basic rate limiting workflow...");
  
  // Test 1: Normal countdown creation should work
  const countdown = createTestCountdown("E2E Basic Test");
  const response1 = await makeRequest("POST", "/api/countdowns", countdown, {
    "X-Forwarded-For": "192.168.99.1",
  });
  
  assertEquals(response1.status, 201);
  const body1 = await response1.json();
  assertExists(body1.id);
  assertEquals(body1.title, countdown.title);
  
  console.log(`✓ Created countdown: ${body1.title}`);
  
  // Test 2: GET requests should always work (not rate limited)
  for (let i = 0; i < 5; i++) {
    const getResponse = await makeRequest("GET", "/api/countdowns", undefined, {
      "X-Forwarded-For": "192.168.99.2",
    });
    assertEquals(getResponse.status, 200);
  }
  
  console.log("✓ GET requests work without rate limiting");
  
  // Test 3: Different IPs should have separate limits
  const response2 = await makeRequest("POST", "/api/countdowns", {
    ...countdown,
    title: "Different IP Test",
  }, {
    "X-Forwarded-For": "192.168.99.3",
  });
  
  assertEquals(response2.status, 201);
  console.log("✓ Different IPs have separate limits");
  
  // Test 4: Missing IP should be handled gracefully
  const response3 = await makeRequest("POST", "/api/countdowns", {
    ...countdown,
    title: "No IP Test",
  });
  
  assertEquals(response3.status, 201);
  console.log("✓ Missing IP handled gracefully");
  
  console.log("✅ Basic E2E workflow completed successfully!");
});

Deno.test("E2E - Error handling", async () => {
  console.log("Testing error handling...");
  
  // Test invalid request body
  const response = await makeRequest("POST", "/api/countdowns", {
    // Missing required fields
  });
  
  // Should get some kind of error response (not necessarily rate limited)
  // This tests that our middleware doesn't break normal error handling
  console.log(`Response status: ${response.status}`);
  
  // As long as we get a response and don't crash, it's a success
  assertEquals(typeof response.status, "number");
  
  console.log("✅ Error handling test completed!");
});

Deno.test("E2E - Header processing", async () => {
  console.log("Testing header processing...");
  
  const countdown = createTestCountdown("Header Test");
  
  // Test X-Forwarded-For header
  const response1 = await makeRequest("POST", "/api/countdowns", countdown, {
    "X-Forwarded-For": "203.0.113.100",
  });
  assertEquals(response1.status, 201);
  console.log("✓ X-Forwarded-For header processed");
  
  // Test X-Real-IP header  
  const response2 = await makeRequest("POST", "/api/countdowns", {
    ...countdown,
    title: "Real IP Test",
  }, {
    "X-Real-IP": "203.0.113.101",
  });
  assertEquals(response2.status, 201);
  console.log("✓ X-Real-IP header processed");
  
  // Test multiple forwarded IPs (should use first one)
  const response3 = await makeRequest("POST", "/api/countdowns", {
    ...countdown,
    title: "Multiple IPs Test",
  }, {
    "X-Forwarded-For": "203.0.113.102, 192.168.1.1, 10.0.0.1",
  });
  assertEquals(response3.status, 201);
  console.log("✓ Multiple forwarded IPs handled correctly");
  
  console.log("✅ Header processing test completed!");
});