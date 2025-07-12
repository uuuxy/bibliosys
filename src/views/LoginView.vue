<template>
  <div class="login-root">
    <div class="login-card">
      <h1 class="login-title">📚 BiblioSys 50k - Login</h1>
      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">Benutzername</label>
          <input v-model="username" type="text" id="username" required autofocus>
        </div>
        <div class="form-group">
          <label for="password">Passwort</label>
          <input v-model="password" type="password" id="password" required>
        </div>
        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
        <button type="submit" class="login-btn">Anmelden</button>
      </form>
      <div class="login-demo-info">
        Demo-Logins: admin/admin, user1/user1
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
.login-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
}
.login-card {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 2px 16px 0 rgba(0,0,0,0.07);
  padding: 2.5rem 2rem 2rem 2rem;
  max-width: 400px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.login-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  text-align: center;
}
.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.form-group label {
  font-weight: 500;
  color: #333;
  font-size: 1rem;
}
.form-group input {
  padding: 0.6rem 0.8rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 1rem;
  background: #f9f9f9;
  transition: border 0.15s;
}
.form-group input:focus {
  border-color: #007bff;
  outline: none;
}
.error-msg {
  background: #f8d7da;
  color: #721c24;
  border-radius: 6px;
  padding: 0.7rem 1rem;
  text-align: center;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}
.login-btn {
  width: 100%;
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.7rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.login-btn:hover {
  background: #0056b3;
}
.login-demo-info {
  margin-top: 1.5rem;
  text-align: center;
  color: #6c757d;
  font-size: 0.95rem;
}
</style>