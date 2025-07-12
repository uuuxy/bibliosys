<template>
  <header class="bg-primary text-white py-3 mb-4 shadow-sm">
    <div class="container d-flex justify-content-between align-items-center">
      <h1 class="h4 mb-0">📚 BiblioSys 50k</h1>
      <div v-if="authStore.isLoggedIn" class="d-flex align-items-center gap-3">
        <span class="user-info small">
          👤 {{ authStore.user?.fullName }} ({{ authStore.user?.role }})
        </span>
        <button @click="handleLogout" class="btn btn-light btn-sm">🚪 Abmelden</button>
      </div>
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
/* Bootstrap übernimmt das Layout */
</style>

