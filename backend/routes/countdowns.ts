import { Hono } from "hono";
import { Countdown, CountdownInput } from "../types.ts";
import { saveCountdown, listCountdowns } from "../store.ts";

const countdown = new Hono();

// List all countdowns
countdown.get("/", async (c) => {
  const all = await listCountdowns();
  return c.json(all);
});

// Create a new countdown
countdown.post("/", async (c) => {
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
    expiredText: body.expiredText ?? "",
    expiredImageUrl: body.expiredImageUrl ?? "",
    expiredCtaUrl: body.expiredCtaUrl ?? "",
  };
  await saveCountdown(countdown);
  return c.json(countdown, 201);
});

export default countdown;
