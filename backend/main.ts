import { Hono } from "hono";
import countdown from "./routes/countdowns.ts";
import auth, { authMiddleware } from "./routes/auth.ts";

const app = new Hono();

app.use("*", authMiddleware);

app.route("/api/auth", auth);
app.route("/api/countdowns", countdown);

app.get("/", (c) => c.text("Countdown API"));

export default app;

if (import.meta.main) {
  Deno.serve(app.fetch);
}
