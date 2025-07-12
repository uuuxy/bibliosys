<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="close">
    <div class="modal-content card">
      <h3>Neues Buch hinzufügen</h3>
      <form @submit.prevent="submitBook">
        <div class="form-group">
          <label>Titel</label>
          <input v-model="newBook.title" type="text" class="input" required>
        </div>
        <div class="form-group">
          <label>Autor</label>
          <input v-model="newBook.author" type="text" class="input" required>
        </div>
        <div class="form-group">
          <label>ISBN</label>
          <input v-model="newBook.isbn" type="text" class="input">
        </div>
        <div class="form-group">
          <label>Signatur (z.B. MAT-001)</label>
          <input v-model="newBook.signature" type="text" class="input">
        </div>
         <p v-if="error" class="status-error">{{ error }}</p>
        <div class="modal-actions">
          <button type="button" @click="close" class="btn">Abbrechen</button>
          <button type="submit" class="btn btn-primary">Speichern</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useBookStore } from '../stores/books.js'

// Definiert, dass die Komponente von außen gesteuert werden kann (über v-model)
defineProps({
  modelValue: Boolean
})
const emit = defineEmits(['update:modelValue'])

const bookStore = useBookStore()
const error = ref(null)

// Daten für das neue Buch
const newBook = ref({
  title: '',
  author: '',
  isbn: '',
  signature: '' // NEU
})

function close() {
  emit('update:modelValue', false)
}

async function submitBook() {
  error.value = null
  try {
    await bookStore.addBook(newBook.value)
    close() // Modal nach Erfolg schließen
  } catch (err) {
    error.value = err.message
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal-content {
  width: 100%;
  max-width: 500px;
}
.form-group {
  margin-bottom: 15px;
}
.modal-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.status-error {
  color: #dc3545;
  font-size: 14px;
}
</style>