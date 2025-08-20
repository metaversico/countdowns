/* @vitest-environment jsdom */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import CountdownForm from '../CountdownForm.vue'
import * as service from '../../services/countdowns'

describe('CountdownForm', () => {
  it('submits new countdown', async () => {
    const mockCountdown = { 
      id: '1', 
      title: 'Demo', 
      expiration: '2030-01-01T00:00',
      createdAt: '2024-01-01T00:00:00Z' 
    }
    const mock = vi.spyOn(service, 'createCountdown').mockResolvedValue(mockCountdown)
    const wrapper = mount(CountdownForm)

    await wrapper.find('input[placeholder="What are you counting down to?"]').setValue('Demo')
    await wrapper.find('input[type="datetime-local"]').setValue('2030-01-01T00:00')

    await wrapper.find('form').trigger('submit.prevent')

    expect(mock).toHaveBeenCalledWith({ 
      title: 'Demo', 
      expiration: '2030-01-01T00:00',
      text: undefined,
      imageUrl: undefined,
      ctaUrl: undefined,
      theme: 'glamorous',
      socialAccounts: undefined
    })
    expect(wrapper.emitted()).toHaveProperty('created')
  })
})
