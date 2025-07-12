<template>
  <div class="login-container">
    <div class="card login-card">
      <h1>📚 BiblioSys 50k - Login</h1>
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">Benutzername</label>
          <input v-model="username" type="text" id="username" class="input" required>
        </div>
        <div class="form-group">
          <label for="password">Passwort</label>
          <input v-model="password" type="password" id="password" class="input" required>
        </div>
        
        <p v-if="errorMsg" class="status-error">{{ errorMsg }}</p>

        <button type="submit" class="btn btn-primary btn-full">Anmelden</button>
      </form>
      <div class="demo-hint">
        <p>Demo-Logins: admin/admin, user1/user1</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

// Den Store und den Router initialisieren
const authStore = useAuthStore()
const router = useRouter()

// Refs für die Formulardaten und Fehlermeldungen
const username = ref('')
const password = ref('')
const errorMsg = ref(null)

// Diese Funktion wird beim Absenden des Formulars aufgerufen
async function handleLogin() {
  try {
    errorMsg.value = null // Fehler zurücksetzen
    
    // Die 'login'-Action aus dem authStore aufrufen
    await authStore.login({ 
      username: username.value, 
      password: password.value 
    })
    
    // Bei Erfolg: Zur Hauptseite weiterleiten
    router.push('/')

  } catch (error) {
    // Bei einem Fehler aus dem Store: Fehlermeldung setzen
    errorMsg.value = error.message
  }
}
</script>

<style scoped>
/* Stile aus der globalen style.css werden hier wiederverwendet */
.login-form {
  margin-top: 20px;
}
.status-error {
  background-color: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  text-align: center;
}
</style>