
<template>
  <div class="home-view">
    <h1>📚 Ausleihe & Universal-Suche</h1>
    <div class="search-bar">
      <input v-model="searchTerm" @keyup.enter="handleSearch" type="text" placeholder="Schülername, ID oder Buch-Barcode..." class="input" />
      <button @click="handleSearch" class="btn btn-primary">Suchen</button>
    </div>
    <div v-if="isLoading" class="loading"><p>🔄 Suche läuft...</p></div>
    <div v-if="error" class="status-error">{{ error }}</div>
    <div v-if="result">
      <div v-if="result.type === 'student_details'">
        <h3>👤 Schülerdetails</h3>
        <pre>{{ result.data }}</pre>
      </div>
      <div v-else-if="result.type === 'book_details'">
        <h3>📖 Buchdetails</h3>
        <pre>{{ result.data }}</pre>
      </div>
      <div v-else-if="result.type === 'student_list'">
        <h3>👥 Schülerliste</h3>
        <ul>
          <li v-for="student in result.data" :key="student.id">{{ student.full_name }} ({{ student.id }})</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth.js'

const searchTerm = ref('')
const isLoading = ref(false)
const error = ref(null)
const result = ref(null)
const authStore = useAuthStore()

async function handleSearch() {
  if (!searchTerm.value) return
  isLoading.value = true
  error.value = null
  result.value = null
  try {
    const res = await fetch(`/api/universal-search/${encodeURIComponent(searchTerm.value)}`, {
      headers: { 'Authorization': `Bearer ${authStore.sessionId}` }
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error || 'Nichts gefunden')
    result.value = data
  } catch (e) {
    error.value = e.message
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.home-view {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem 1rem;
}
.search-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background: #007bff;
  color: #fff;
  cursor: pointer;
}
.btn-primary {
  background: #007bff;
}
.loading {
  color: #007bff;
}
.status-error {
  color: #dc3545;
  margin-top: 1rem;
}
</style>
