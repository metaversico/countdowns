/* @vitest-environment jsdom */
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, it, expect, vi } from 'vitest'
import CountdownForm from '../CountdownForm.vue'
import * as service from '../../services/countdowns'

describe('CountdownForm', () => {
  it('submits new countdown with expired content', async () => {
    const mockCountdown = {
      id: '1',
      title: 'Demo',
      expiration: '2030-01-01T00:00',
      createdAt: '2024-01-01T00:00:00Z'
    }
    const mock = vi.spyOn(service, 'createCountdown').mockResolvedValue(mockCountdown)
    const wrapper = mount(CountdownForm, {
      global: {
        plugins: [createPinia()],
      },
    })

    await wrapper.find('input[placeholder="What are you counting down to?"]').setValue('Demo')
    await wrapper.find('input[type="datetime-local"]').setValue('2030-01-01T00:00')

    // Check that expired fields are initially hidden
    expect(wrapper.find('#expiredText').exists()).toBe(false)

    // Click the toggle to show the expired fields
    await wrapper.find('button.advanced-options-toggle').trigger('click')
    expect(wrapper.find('#expiredText').exists()).toBe(true)

    // Fill in the expired content fields
    await wrapper.find('#expiredText').setValue('Expired Text')
    await wrapper.find('#expiredImageUrl').setValue('http://example.com/expired.jpg')
    await wrapper.find('#expiredCtaUrl').setValue('http://example.com/expired-cta')


    await wrapper.find('form').trigger('submit.prevent')

    expect(mock).toHaveBeenCalledWith({
      title: 'Demo',
      expiration: '2030-01-01T00:00',
      text: undefined,
      imageUrl: undefined,
      ctaUrl: undefined,
      theme: 'glamorous',
      socialAccounts: undefined,
      expiredText: 'Expired Text',
      expiredImageUrl: 'http://example.com/expired.jpg',
      expiredCtaUrl: 'http://example.com/expired-cta',
    })
    expect(wrapper.emitted()).toHaveProperty('created')
  })
})
