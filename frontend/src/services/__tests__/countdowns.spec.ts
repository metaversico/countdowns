import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    isAxiosError: vi.fn(),
  },
}))

import axios from 'axios'
import { listCountdowns, createCountdown, RateLimitExceededError } from '../countdowns'

const mockedAxios = axios as unknown as {
  get: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
  isAxiosError: ReturnType<typeof vi.fn>
}

describe('countdown service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists countdowns', async () => {
    mockedAxios.get.mockResolvedValue({ data: [{ id: '1', title: 'Test', expiration: '2030-01-01' }] })
    const result = await listCountdowns()
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/countdowns')
    expect(result).toHaveLength(1)
  })

  it('creates countdown', async () => {
    const input = { title: 'Demo', expiration: '2030-01-01' }
    mockedAxios.post.mockResolvedValue({ data: { id: '2', ...input } })
    const result = await createCountdown(input)
    expect(mockedAxios.post).toHaveBeenCalledWith('/api/countdowns', input)
    expect(result.id).toBe('2')
  })

  it('handles rate limit exceeded error', async () => {
    const input = { title: 'Demo', expiration: '2030-01-01' }
    const rateLimitResponse = {
      error: 'Rate limit exceeded',
      message: 'Maximum 10 countdowns per 180 seconds. Try again in 120 seconds.',
      retryAfter: 120,
      limit: 10,
      window: 180,
    }

    const error = {
      response: {
        status: 429,
        data: rateLimitResponse,
      },
    }

    mockedAxios.post.mockRejectedValue(error)
    mockedAxios.isAxiosError.mockReturnValue(true)

    await expect(createCountdown(input)).rejects.toThrow(RateLimitExceededError)
    
    try {
      await createCountdown(input)
    } catch (err) {
      expect(err).toBeInstanceOf(RateLimitExceededError)
      if (err instanceof RateLimitExceededError) {
        expect(err.rateLimitInfo).toEqual(rateLimitResponse)
        expect(err.message).toBe(rateLimitResponse.message)
      }
    }
  })

  it('handles other axios errors normally', async () => {
    const input = { title: 'Demo', expiration: '2030-01-01' }
    const error = {
      response: {
        status: 500,
        data: { error: 'Internal Server Error' },
      },
    }

    mockedAxios.post.mockRejectedValue(error)
    mockedAxios.isAxiosError.mockReturnValue(true)

    await expect(createCountdown(input)).rejects.toThrow()
  })

  it('handles non-axios errors', async () => {
    const input = { title: 'Demo', expiration: '2030-01-01' }
    const error = new Error('Network error')

    mockedAxios.post.mockRejectedValue(error)
    mockedAxios.isAxiosError.mockReturnValue(false)

    await expect(createCountdown(input)).rejects.toThrow('Network error')
  })
})
