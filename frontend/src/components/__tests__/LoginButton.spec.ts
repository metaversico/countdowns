/* @vitest-environment jsdom */
import { mount } from '@vue/test-utils'
import LoginButton from '../LoginButton.vue'
import { describe, it, expect } from 'vitest'

describe('LoginButton.vue', () => {
  it('renders a link to the twitter auth endpoint', () => {
    const wrapper = mount(LoginButton)
    const link = wrapper.find('a')
    expect(link.attributes('href')).toBe('/api/auth/twitter')
  })
})
