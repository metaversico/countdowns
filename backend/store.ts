import { Countdown, User } from "./types.ts";

// Open KV database once
const kv = await Deno.openKv();

const COUNTDOWN_PREFIX = ["countdowns"] as const;
const USER_PREFIX = ["users"] as const;
const USER_BY_PROVIDER_PREFIX = ["users_by_provider"] as const;

export async function saveCountdown(c: Countdown): Promise<void> {
  await kv.set([...COUNTDOWN_PREFIX, c.id], c);
}

export async function listCountdowns(): Promise<Countdown[]> {
  const countdowns: Countdown[] = [];
  for await (const entry of kv.list<Countdown>({ prefix: COUNTDOWN_PREFIX })) {
    countdowns.push(entry.value);
  }
  return countdowns;
}

export async function getCountdown(id: string): Promise<Countdown | null> {
  const res = await kv.get<Countdown>([...COUNTDOWN_PREFIX, id]);
  return res.value;
}

export async function deleteCountdown(id: string): Promise<void> {
  await kv.delete([...COUNTDOWN_PREFIX, id]);
}

export async function saveUser(u: User): Promise<void> {
  await kv.atomic()
    .set([...USER_PREFIX, u.id], u)
    .set([...USER_BY_PROVIDER_PREFIX, u.provider, u.providerId], u)
    .commit();
}

export async function getUser(id: string): Promise<User | null> {
  const res = await kv.get<User>([...USER_PREFIX, id]);
  return res.value;
}

export async function getUserByProvider(provider: string, providerId: string): Promise<User | null> {
  const res = await kv.get<User>([...USER_BY_PROVIDER_PREFIX, provider, providerId]);
  return res.value;
}
