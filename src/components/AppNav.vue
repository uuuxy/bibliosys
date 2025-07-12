<template>
  <nav class="app-nav">
    <router-link to="/">🏠 Ausleihe</router-link>
    <router-link to="/inventory">📖 Bestand</router-link>
    <!-- Ein einziger Link für alle Admin-Funktionen -->
    <router-link v-if="authStore.user?.role === 'admin'" to="/admin">
        � Verwaltung
    </router-link>
  </nav>
</template>

<script setup>
import { useAuthStore } from '../stores/auth.js';
const authStore = useAuthStore();
</script>

<style scoped>
.app-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  background: #f8f9fa;
  padding: 10px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}
.app-nav a {
  text-decoration: none;
  color: #333;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 4px;
  transition: background 0.2s;
}
.app-nav a.router-link-exact-active {
  background: #007bff;
  color: #fff;
}
</style>
