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

Deno.test("Rate limiting - basic functionality", async () => {
  const countdown = createTestCountdown();
  
  // Make a few requests (under the limit)
  for (let i = 0; i < 3; i++) {
    const response = await makeRequest("POST", "/api/countdowns", countdown, {
      "X-Forwarded-For": `192.168.100.${i}`, // Use different IPs to avoid conflicts
    });
    
    assertEquals(response.status, 201);
    const body = await response.json();
    assertExists(body.id);
    assertEquals(body.title, countdown.title);
  }
});

Deno.test("Rate limiting - GET requests not limited", async () => {
  // Make many GET requests to ensure they're not rate limited
  for (let i = 0; i < 15; i++) {
    const response = await makeRequest("GET", "/api/countdowns", undefined, {
      "X-Forwarded-For": "192.168.200.1",
    });
    assertEquals(response.status, 200);
  }
});

Deno.test("Rate limiting - respects headers", async () => {
  const countdown = createTestCountdown();
  
  // Test with X-Forwarded-For
  const response1 = await makeRequest("POST", "/api/countdowns", countdown, {
    "X-Forwarded-For": "192.168.201.1",
  });
  assertEquals(response1.status, 201);
  
  // Test with X-Real-IP
  const response2 = await makeRequest("POST", "/api/countdowns", countdown, {
    "X-Real-IP": "192.168.202.1",
  });
  assertEquals(response2.status, 201);
});

Deno.test("Rate limiting - handles missing IP", async () => {
  const countdown = createTestCountdown();
  
  // Make request without IP headers
  const response = await makeRequest("POST", "/api/countdowns", countdown);
  assertEquals(response.status, 201);
  
  const body = await response.json();
  assertExists(body.id);
});