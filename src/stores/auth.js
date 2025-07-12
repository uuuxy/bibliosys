import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
  // === FAKE LOGIN ===
  // Wir erstellen einen festen Admin-Benutzer, um den Login zu überspringen.
  const user = ref({
    id: 1,
    username: 'admin-test',
    fullName: 'Test-Admin',
    role: 'admin'
  })
  
  // Wir erstellen eine feste Session-ID für die API-Anfragen.
  const sessionId = ref('test-session-12345')
  const router = useRouter()

  // isLoggedIn ist jetzt immer 'true'.
  const isLoggedIn = computed(() => true)

  // Die login-Funktion tut nichts mehr.
  async function login(credentials) {
    console.log("Login übersprungen. Automatischer Login als Test-Admin.")
    router.push('/')
    return true
  }

  // Die logout-Funktion tut nichts mehr.
  function logout() {
    console.log("Logout-Funktion ist für den Test-Modus deaktiviert.")
    // Wir leiten nicht mehr zur Login-Seite um.
  }

  return {
    user,
    sessionId,
    isLoggedIn,
    login,
    logout,
  }
})
