import { Hono } from "hono";
import { Countdown, CountdownInput } from "../types.ts";
import { saveCountdown, listCountdowns } from "../store.ts";
import { rateLimitMiddleware, getDefaultRateLimitConfig } from "../middleware/rateLimit.ts";

const countdown = new Hono();

// Initialize KV store and rate limiting
const kv = await Deno.openKv();
const rateLimitConfig = {
  ...getDefaultRateLimitConfig(),
  trustProxy: true, // Enable proxy headers for testing
};
const rateLimit = rateLimitMiddleware(rateLimitConfig, kv);

// List all countdowns
countdown.get("/", async (c) => {
  const all = await listCountdowns();
  return c.json(all);
});

// Create a new countdown (with rate limiting)
countdown.post("/", rateLimit, async (c) => {
  const body = await c.req.json<CountdownInput>();
  const now = new Date();
  const countdown: Countdown = {
    id: crypto.randomUUID(),
    title: body.title,
    socialAccounts: body.socialAccounts ?? [],
    text: body.text ?? "",
    imageUrl: body.imageUrl ?? "",
    ctaUrl: body.ctaUrl ?? "",
    expiration: new Date(body.expiration).toISOString(),
    createdAt: now.toISOString(),
  };
  await saveCountdown(countdown);
  return c.json(countdown, 201);
});

export default countdown;
