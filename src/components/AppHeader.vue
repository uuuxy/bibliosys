<template>
  <header class="app-header">
    <div class="header-left">
      <h1>📚 BiblioSys 50k</h1>
    </div>
    <div class="header-right" v-if="authStore.isLoggedIn">
      <span class="user-info">
        👤 {{ authStore.user?.fullName }} ({{ authStore.user?.role }})
      </span>
      <button @click="handleLogout" class="logout-btn">🚪 Abmelden</button>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const authStore = useAuthStore()
const router = useRouter()

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-header {
  background-color: #343a40;
  color: white;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}
.user-info {
  font-size: 14px;
}
.logout-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
}
.logout-btn:hover {
  background-color: #c82333;
}
</style>

