import { Countdown } from "./types.ts";

// Open KV database once
const kv = await Deno.openKv();

const PREFIX = ["countdowns"] as const;

export async function saveCountdown(c: Countdown): Promise<void> {
  await kv.set([...PREFIX, c.id], c);
}

export async function listCountdowns(): Promise<Countdown[]> {
  const countdowns: Countdown[] = [];
  for await (const entry of kv.list<Countdown>({ prefix: PREFIX })) {
    countdowns.push(entry.value);
  }
  return countdowns;
}
