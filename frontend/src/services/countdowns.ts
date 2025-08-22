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
  userId?: string
}

export interface RateLimitError {
  error: string
  message: string
  retryAfter: number
  limit: number
  window: number
}

export class RateLimitExceededError extends Error {
  constructor(public rateLimitInfo: RateLimitError) {
    super(rateLimitInfo.message)
    this.name = 'RateLimitExceededError'
  }
}

export async function listCountdowns(): Promise<Countdown[]> {
  const res = await axios.get('/api/countdowns')
  return res.data
}

export async function createCountdown(input: CountdownInput): Promise<Countdown> {
  try {
    const res = await axios.post('/api/countdowns', input)
    return res.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      throw new RateLimitExceededError(error.response.data)
    }
    throw error
  }
}

export async function deleteCountdown(id: string): Promise<void> {
  await axios.delete(`/api/countdowns/${id}`)
}
