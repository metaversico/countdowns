import axios from 'axios'

export interface CountdownInput {
  title: string
  expiration: string
  socialAccounts?: string[]
  text?: string
  imageUrl?: string
  ctaUrl?: string
  theme?: string
  expiredText?: string
  expiredImageUrl?: string
  expiredCtaUrl?: string
}

export interface Countdown extends CountdownInput {
  id: string
  createdAt: string
}

export async function listCountdowns(): Promise<Countdown[]> {
  const res = await axios.get('/api/countdowns')
  return res.data
}

export async function createCountdown(input: CountdownInput): Promise<Countdown> {
  const res = await axios.post('/api/countdowns', input)
  return res.data
}
