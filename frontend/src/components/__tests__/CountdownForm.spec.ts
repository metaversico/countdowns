/* @vitest-environment jsdom */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import CountdownForm from '../CountdownForm.vue'
import * as service from '../../services/countdowns'

describe('CountdownForm', () => {
  it('submits new countdown', async () => {
    const mock = vi.spyOn(service, 'createCountdown').mockResolvedValue({ id: '1', title: 'Demo', expiration: '2030-01-01' })
    const wrapper = mount(CountdownForm)

    await wrapper.find('input[placeholder="Title"]').setValue('Demo')
    await wrapper.find('input[type="datetime-local"]').setValue('2030-01-01T00:00')

    await wrapper.find('form').trigger('submit.prevent')

    expect(mock).toHaveBeenCalledWith({ title: 'Demo', expiration: '2030-01-01T00:00' })
    expect(wrapper.emitted()).toHaveProperty('created')
  })
})
