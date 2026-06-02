export type Theme = 'light' | 'dark' | 'system'

export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return

  const html = document.documentElement
  const actualTheme = theme === 'system' ? getSystemTheme() : theme

  if (actualTheme === 'dark') {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }

  localStorage.setItem('theme', theme)
}

export function getStoredTheme(): Theme {
  if (typeof localStorage === 'undefined') return 'system'
  return (localStorage.getItem('theme') as Theme) || 'system'
}

export function initializeTheme() {
  const theme = getStoredTheme()
  applyTheme(theme)

  // Listen for system theme changes
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const currentTheme = getStoredTheme()
      if (currentTheme === 'system') {
        applyTheme('system')
      }
    })
  }
}
