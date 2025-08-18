import axios from 'axios'

export interface Countdown {
  id: string
  title: string
  expiration: string
  createdAt?: string
}

export interface CountdownInput {
  title: string
  expiration: string
}

export async function listCountdowns(): Promise<Countdown[]> {
  const res = await axios.get('/api/countdowns')
  return res.data
}

export async function createCountdown(input: CountdownInput): Promise<Countdown> {
  const res = await axios.post('/api/countdowns', input)
  return res.data
}
