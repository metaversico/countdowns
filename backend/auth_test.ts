import app from "./main.ts";
import { assertEquals, assert } from "@std/assert";
import { sign } from "hono/jwt";
import { User, Countdown } from "./types.ts";
import { saveUser, saveCountdown } from "./store.ts";

const secret = Deno.env.get("JWT_SECRET") || "a-secure-secret";

async function createTestUser(): Promise<{ user: User, token: string }> {
  const user: User = {
    id: crypto.randomUUID(),
    provider: "twitter",
    providerId: "12345",
    username: "testuser",
    displayName: "Test User",
    avatarUrl: "https://example.com/avatar.png",
    createdAt: new Date().toISOString(),
  };
  await saveUser(user);

  const payload = {
    sub: user.id,
    exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
  };
  const token = await sign(payload, secret);

  return { user, token };
}

Deno.test("auth flow", async (t) => {
  await t.step("unauthenticated user", async () => {
    const res = await app.request("/api/auth/me");
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.user, null);
  });

  await t.step("authenticated user", async () => {
    const { user, token } = await createTestUser();
    const res = await app.request("/api/auth/me", {
      headers: {
        Cookie: `token=${token}`,
      },
    });
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.user.id, user.id);
  });

  await t.step("create countdown as authenticated user", async () => {
    const { user, token } = await createTestUser();
    const expiration = new Date(Date.now() + 60_000).toISOString();
    const res = await app.request("/api/countdowns", {
      method: "POST",
      body: JSON.stringify({ title: "My Countdown", expiration }),
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${token}`,
      },
    });
    assertEquals(res.status, 201);
    const countdown = await res.json();
    assertEquals(countdown.userId, user.id);
  });

  await t.step("delete own countdown", async () => {
    const { user, token } = await createTestUser();
    const countdown: Countdown = {
      id: crypto.randomUUID(),
      title: "To Be Deleted",
      expiration: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      userId: user.id,
    };
    await saveCountdown(countdown);

    const res = await app.request(`/api/countdowns/${countdown.id}`, {
      method: "DELETE",
      headers: {
        Cookie: `token=${token}`,
      },
    });
    assertEquals(res.status, 200);
  });

  await t.step("cannot delete another user's countdown", async () => {
    const { token: attackerToken } = await createTestUser();
    const { user: owner } = await createTestUser();

    const countdown: Countdown = {
      id: crypto.randomUUID(),
      title: "Protected Countdown",
      expiration: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      userId: owner.id,
    };
    await saveCountdown(countdown);

    const res = await app.request(`/api/countdowns/${countdown.id}`, {
      method: "DELETE",
      headers: {
        Cookie: `attackerToken=${attackerToken}`,
      },
    });
    assertEquals(res.status, 401);
  });
});
