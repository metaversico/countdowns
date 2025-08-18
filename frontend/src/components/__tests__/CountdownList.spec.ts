/* @vitest-environment jsdom */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import CountdownList from '../CountdownList.vue'

describe('CountdownList', () => {
  it('renders items', () => {
    const wrapper = mount(CountdownList, {
      props: { items: [{ id: '1', title: 'Test', expiration: '2030-01-01T00:00:00Z' }] }
    })
    expect(wrapper.text()).toContain('Test')
  })
})
