import { Hono } from "hono";
import countdown from "./routes/countdowns.ts";

const app = new Hono();

app.route("/api/countdowns", countdown);

app.get("/", (c) => c.text("Countdown API"));

export default app;

if (import.meta.main) {
  Deno.serve(app.fetch);
}
