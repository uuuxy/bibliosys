
<template>
  <div class="app-container">
    <header v-if="auth.isLoggedIn" class="app-header">
      <div class="header-inner">
        <div class="brand">📚 BiblioSys 50k</div>
        <nav class="main-nav">
          <RouterLink to="/">🏠 Ausleihe</RouterLink>
          <RouterLink to="/books">📚 Bücher</RouterLink>
          <RouterLink to="/students">👥 Schüler</RouterLink>
          <RouterLink to="/orders">🛒 Bestellungen</RouterLink>
          <RouterLink to="/inventory">📖 Bestand</RouterLink>
          <RouterLink v-if="auth.user?.role === 'admin'" to="/admin">⚙️ Verwaltung</RouterLink>
        </nav>
        <div class="user-menu" v-if="auth.user">
          <span class="username">Hallo, {{ auth.user.username }}</span>
          <button @click="auth.logout" class="logout-btn">Logout</button>
        </div>
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
.app-container {
  min-height: 100vh;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
}
.app-header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  margin-bottom: 24px;
  padding: 0;
}
.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
}
.brand {
  font-size: 1.5rem;
  font-weight: bold;
  letter-spacing: 1px;
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
  transition: all 0.2s;
}
.main-nav a.router-link-exact-active {
  color: #007bff;
  border-bottom-color: #007bff;
}
.main-nav a:hover {
  color: #007bff;
}
.user-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.username {
  color: #6c757d;
}
.logout-btn {
  background: none;
  border: 1px solid #adb5bd;
  color: #495057;
  border-radius: 4px;
  padding: 6px 14px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.logout-btn:hover {
  background: #f6faff;
  color: #007bff;
  border-color: #007bff;
}
.main-content {
  flex: 1 1 auto;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 0 1.5rem 2.5rem 1.5rem;
}
</style>
