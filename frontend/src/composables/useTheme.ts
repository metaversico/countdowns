import { ref, watch, onMounted } from 'vue'

export type Theme = 'system' | 'glamorous' | 'mainframe' | 'serious' | 'playful' | 'zen'

export const themes: Theme[] = ['system', 'glamorous', 'mainframe', 'serious', 'playful', 'zen']

const theme = ref<Theme>((localStorage.getItem('theme') as Theme) || 'system')

function applyTheme(newTheme: Theme) {
  if (newTheme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.className = prefersDark ? 'theme-mainframe' : 'theme-serious'
  } else {
    document.documentElement.className = `theme-${newTheme}`
  }
  localStorage.setItem('theme', newTheme)
  theme.value = newTheme
}

export function useTheme() {
  onMounted(() => {
    applyTheme(theme.value)

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (theme.value === 'system') {
        applyTheme('system')
      }
    })
  })

  watch(theme, (newTheme) => {
    applyTheme(newTheme)
  })

  return {
    theme,
    themes,
    setTheme: (newTheme: Theme) => {
      theme.value = newTheme
    },
  }
}
