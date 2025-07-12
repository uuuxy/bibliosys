
<template>
  <div class="app-container">
    <header v-if="auth.isLoggedIn" class="app-header">
      <nav class="main-nav">
        <RouterLink to="/">🏠 Ausleihe</RouterLink>
        <RouterLink to="/books">📚 Bücher</RouterLink>
        <RouterLink to="/students">👥 Schüler</RouterLink>
        <RouterLink to="/orders">🛒 Bestellungen</RouterLink>
        <RouterLink to="/inventory">📖 Bestand</RouterLink>
        <RouterLink v-if="auth.user?.role === 'admin'" to="/admin">� Verwaltung</RouterLink>
      </nav>
      <div class="user-menu">
        <span>Hallo, {{ auth.user.username }}</span>
        <button @click="auth.logout" class="btn btn-secondary">Logout</button>
      </div>
    </header>

    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router';
import { useAuthStore } from './stores/auth';
const auth = useAuthStore();
</script>

<style scoped>
/* Stile bleiben unverändert */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #fff;
  border-bottom: 1px solid #dee2e6;
}
.main-nav {
  display: flex;
  gap: 1.5rem;
}
.main-nav a {
  text-decoration: none;
  color: #495057;
  font-weight: 500;
  padding: 0.5rem 0;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease-in-out;
}
.main-nav a:hover {
  color: #007bff;
}
.main-nav a.router-link-exact-active {
  color: #007bff;
  border-bottom-color: #007bff;
}
.user-menu {
    display: flex;
    align-items: center;
    gap: 1rem;
}
</style>
