import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
  // === STATE ===
  // Wir laden jetzt den kompletten Benutzer und die Session aus dem Speicher
  const user = ref(JSON.parse(localStorage.getItem('user')) || null)
  const sessionId = ref(localStorage.getItem('sessionId') || null)
  const router = useRouter() // Router-Instanz für die Weiterleitung

  // === GETTERS ===
  const isLoggedIn = computed(() => !!user.value && !!sessionId.value)

  // === ACTIONS ===
  async function login(credentials) {
    try {
      // KORREKTUR: Die URL ist jetzt relativ, um den Vite-Proxy zu nutzen.
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Login fehlgeschlagen')
      }

      // Bei Erfolg: Zustand im Store aktualisieren
      user.value = data.user
      sessionId.value = data.sessionId

      // Benutzer und Session im lokalen Speicher sichern
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('sessionId', data.sessionId)
      
      // Automatisch zur Startseite weiterleiten
      router.push('/') 

    } catch (error) {
      console.error('Login-Fehler:', error)
      // Bei Fehler alles zurücksetzen
      user.value = null
      sessionId.value = null
      localStorage.removeItem('user')
      localStorage.removeItem('sessionId')
      throw error 
    }
  }

  function logout() {
    // Hier muss dem Server nichts mitgeteilt werden, da die Sessions bei uns einfach sind.
    user.value = null
    sessionId.value = null
    localStorage.removeItem('user')
    localStorage.removeItem('sessionId')
    // Automatisch zur Login-Seite weiterleiten
    router.push('/login')
  }

  return {
    user,
    sessionId,
    isLoggedIn,
    login,
    logout,
  }
})
