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
