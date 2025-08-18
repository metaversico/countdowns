import app from "./main.ts";
import { assert, assertEquals } from "https://deno.land/std@0.204.0/assert/mod.ts";

Deno.test("create and list countdown", async () => {
  const expiration = new Date(Date.now() + 60_000).toISOString();
  let res = await app.request("/api/countdowns", {
    method: "POST",
    body: JSON.stringify({ title: "Demo", expiration }),
    headers: { "Content-Type": "application/json" },
  });
  assertEquals(res.status, 201);
  const created = await res.json();

  res = await app.request("/api/countdowns");
  const list = await res.json();
  assert(list.some((c: { id: string }) => c.id === created.id));
});
