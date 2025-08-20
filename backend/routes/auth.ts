import { Hono, MiddlewareHandler } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import { twitter } from "hono/oauth";
import { User } from "../types.ts";
import { saveUser, getUserByProvider, getUser } from "../store.ts";

type AuthVariables = {
  user?: User;
};

const auth = new Hono<{ Variables: AuthVariables }>();

auth.use('/twitter', (c, next) => {
  return twitter({
    client_id: Deno.env.get("TWITTER_CLIENT_ID") || "",
    client_secret: Deno.env.get("TWITTER_CLIENT_SECRET") || "",
    scope: ['users.read', 'tweet.read'],
    onSuccess: async (c, token, profile) => {
      let user = await getUserByProvider("twitter", profile.id);

      if (!user) {
        const newUser: User = {
          id: crypto.randomUUID(),
          provider: "twitter",
          providerId: profile.id,
          username: profile.username,
          displayName: profile.name,
          avatarUrl: profile.profile_image_url,
          createdAt: new Date().toISOString(),
        };
        await saveUser(newUser);
        user = newUser;
      }

      const payload = {
        sub: user.id,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
      };

      const secret = Deno.env.get("JWT_SECRET") || "a-secure-secret";
      const jwt = await sign(payload, secret);

      setCookie(c, "token", jwt, {
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        path: "/",
      });

      return c.redirect("/");
    },
    onError: (c, error) => {
      console.error(error);
      return c.json({ error: "Authentication failed" }, 401);
    }
  })(c, next)
})

auth.get("/logout", (c) => {
  deleteCookie(c, "token", {
    path: "/",
  });
  return c.redirect("/");
});

export const authMiddleware: MiddlewareHandler<{ Variables: AuthVariables }> = async (c, next) => {
  const token = getCookie(c, "token");
  if (!token) {
    return await next();
  }

  try {
    const secret = Deno.env.get("JWT_SECRET") || "a-secure-secret";
    const payload = await verify(token, secret);
    const user = await getUser(payload.sub as string);
    if (user) {
      c.set("user", user);
    }
  } catch (e) {
    // Invalid token
    console.error(e);
  }

  await next();
};

auth.get("/me", authMiddleware, (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ user: null });
  }
  return c.json({ user });
});

export default auth;
