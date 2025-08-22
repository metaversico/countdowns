import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useToast } from '../useToast'

// Mock setTimeout to not auto-remove toasts in tests
vi.stubGlobal('setTimeout', vi.fn((callback: Function, delay: number) => {
  // Don't auto-call for testing
  return 1
}))

describe('useToast', () => {
  let toast: ReturnType<typeof useToast>

  beforeEach(() => {
    toast = useToast()
    // Clear any existing toasts
    toast.toasts.value = []
  })

  it('adds success toast', () => {
    toast.success('Test success message', 0) // No auto-removal
    
    expect(toast.toasts.value).toHaveLength(1)
    expect(toast.toasts.value[0]).toMatchObject({
      message: 'Test success message',
      type: 'success'
    })
  })

  it('adds error toast', () => {
    toast.error('Test error message', 0) // No auto-removal
    
    expect(toast.toasts.value).toHaveLength(1)
    expect(toast.toasts.value[0]).toMatchObject({
      message: 'Test error message',
      type: 'error'
    })
  })

  it('adds info toast', () => {
    toast.info('Test info message', 0) // No auto-removal
    
    expect(toast.toasts.value).toHaveLength(1)
    expect(toast.toasts.value[0]).toMatchObject({
      message: 'Test info message',
      type: 'info'
    })
  })

  it('adds warning toast', () => {
    toast.warning('Test warning message', 0) // No auto-removal
    
    expect(toast.toasts.value).toHaveLength(1)
    expect(toast.toasts.value[0]).toMatchObject({
      message: 'Test warning message',
      type: 'warning'
    })
  })

  it('can remove toast by id', () => {
    const id = toast.addToast('Test message', 'info', 0) // No auto-removal
    expect(toast.toasts.value).toHaveLength(1)
    
    toast.removeToast(id)
    expect(toast.toasts.value).toHaveLength(0)
  })

  it('generates unique ids for toasts', () => {
    toast.addToast('Message 1', 'info', 0)
    toast.addToast('Message 2', 'info', 0)
    
    expect(toast.toasts.value).toHaveLength(2)
    expect(toast.toasts.value[0].id).not.toBe(toast.toasts.value[1].id)
  })
})