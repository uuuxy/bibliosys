<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <nav>
        <RouterLink to="/admin/dashboard">Dashboard</RouterLink>
        <RouterLink to="/admin/users">Benutzer</RouterLink>
        <RouterLink to="/admin/suppliers">Lieferanten</RouterLink>
        <RouterLink to="/admin/orders">Bestellungen</RouterLink>
        <RouterLink to="/admin/id-card-layout">Ausweis-Layout</RouterLink>
        <!-- Fügen Sie hier weitere Admin-Links hinzu -->
      </nav>
    </aside>
    <main class="admin-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterView, RouterLink } from 'vue-router';
</script>

<style scoped>
.admin-layout {
  display: flex;
  height: calc(100vh - 60px); /* Höhe abzüglich der Haupt-Header-Höhe */
}
.admin-sidebar {
  width: 220px;
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-right: 1px solid #dee2e6;
  flex-shrink: 0;
}
.admin-sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.admin-sidebar a {
  text-decoration: none;
  color: #495057;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  transition: background-color 0.2s;
}
.admin-sidebar a:hover {
  background-color: #e9ecef;
}
.admin-sidebar a.router-link-exact-active {
  background-color: #0d6efd;
  color: white;
  font-weight: 500;
}
.admin-content {
  flex-grow: 1;
  padding: 2rem;
  overflow-y: auto;
}
</style>
