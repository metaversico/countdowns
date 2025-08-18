import { describe, it, expect, vi } from 'vitest'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import axios from 'axios'
import { listCountdowns, createCountdown } from '../countdowns'

const mockedAxios = axios as unknown as {
  get: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
}

describe('countdown service', () => {
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
})
