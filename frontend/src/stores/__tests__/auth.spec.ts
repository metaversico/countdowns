/* @vitest-environment jsdom */
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import axios from 'axios'

vi.mock('axios')

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initial state is not authenticated', () => {
    const auth = useAuthStore()
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.user).toBe(null)
  })

  it('fetches user and sets authenticated state', async () => {
    const auth = useAuthStore()
    const user = { id: '1', username: 'test' }
    vi.mocked(axios.get).mockResolvedValue({ data: { user } })

    await auth.fetchUser()

    expect(auth.isAuthenticated).toBe(true)
    expect(auth.user).toEqual(user)
  })

  it('handles failed user fetch', async () => {
    const auth = useAuthStore()
    vi.mocked(axios.get).mockRejectedValue(new Error('Failed to fetch'))

    await auth.fetchUser()

    expect(auth.isAuthenticated).toBe(false)
    expect(auth.user).toBe(null)
  })

  it('logout clears user and token', () => {
    const auth = useAuthStore()
    auth.user = { id: '1', username: 'test' } as any

    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' },
    })

    auth.logout()

    expect(auth.isAuthenticated).toBe(false)
    expect(auth.user).toBe(null)
    expect(window.location.href).toBe('/')
  })
})
