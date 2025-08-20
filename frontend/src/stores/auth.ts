import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import Cookies from 'js-cookie'
import type { User } from '../../../backend/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => !!user.value)

  async function fetchUser() {
    try {
      const { data } = await axios.get('/api/auth/me')
      user.value = data.user
    } catch (error) {
      user.value = null
    }
  }

  function logout() {
    user.value = null
    // The cookie is removed by the server, but we can also remove it here
    Cookies.remove('token', { path: '/' })
    // Redirect to the home page
    window.location.href = '/'
  }

  return { user, isAuthenticated, fetchUser, logout }
})
