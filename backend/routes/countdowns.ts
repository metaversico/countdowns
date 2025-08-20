import { Hono } from "hono";
import { Countdown, CountdownInput, User } from "../types.ts";
import { saveCountdown, listCountdowns, getCountdown, deleteCountdown } from "../store.ts";

type AuthVariables = {
  user?: User;
};

const countdown = new Hono<{ Variables: AuthVariables }>();

// List all countdowns
countdown.get("/", async (c) => {
  const all = await listCountdowns();
  return c.json(all);
});

// Create a new countdown
countdown.post("/", async (c) => {
  const user = c.get("user");
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
    userId: user?.id,
  };
  await saveCountdown(countdown);
  return c.json(countdown, 201);
});

// Delete a countdown
countdown.delete("/:id", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const countdown = await getCountdown(id);

  if (!countdown) {
    return c.json({ error: "Not Found" }, 404);
  }

  if (countdown.userId !== user.id) {
    return c.json({ error: "Forbidden" }, 403);
  }

  await deleteCountdown(id);
  return c.json({ message: "Countdown deleted" });
});

export default countdown;
