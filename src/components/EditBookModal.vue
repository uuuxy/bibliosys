<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="close">
    <div class="modal-content card">
      <h3>Buch bearbeiten</h3>
      <form v-if="editableBook" @submit.prevent="submitUpdate">
        <!-- ... (Titel, Autor Felder) ... -->
        <div class="form-group">
          <label>Titel</label>
          <input v-model="editableBook.title" type="text" class="input" required>
        </div>
        <div class="form-group">
          <label>Autor</label>
          <input v-model="editableBook.author" type="text" class="input" required>
        </div>
        
        <!-- ISBN-Feld mit neuem Button -->
        <div class="form-group">
          <label>ISBN</label>
          <div class="input-with-button">
            <input v-model="editableBook.isbn" type="text" class="input">
            <button 
              type="button" 
              @click="handleFetchCover" 
              class="btn btn-secondary" 
              :disabled="!editableBook.isbn || isFetchingCover">
                {{ isFetchingCover ? 'Sucht...' : 'Cover suchen' }}
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>Signatur</label>
          <input v-model="editableBook.signature" type="text" class="input">
        </div>

        <!-- NEU: Cover-Vorschau -->
        <div v-if="editableBook.cover_url" class="cover-preview-wrapper">
            <img :src="editableBook.cover_url" alt="Buch-Cover" class="cover-preview"/>
        </div>

        <p v-if="error" class="status-error">{{ error }}</p>
        <div class="modal-actions">
          <button type="button" @click="close" class="btn">Abbrechen</button>
          <button type="submit" class="btn btn-primary">Änderungen speichern</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useBookStore } from '../stores/books.js';

const props = defineProps({
  modelValue: Boolean,
  book: Object
});
const emit = defineEmits(['update:modelValue']);

const bookStore = useBookStore();
const error = ref(null);
const editableBook = ref(null);
const isFetchingCover = ref(false); // NEU

watch(() => props.book, (newBook) => {
  if (newBook) {
    editableBook.value = { ...newBook };
  }
}, { immediate: true, deep: true });

// NEUE FUNKTION
async function handleFetchCover() {
    if (!editableBook.value?.barcode) return;
    isFetchingCover.value = true;
    error.value = null;
    try {
        const result = await bookStore.fetchBookCover(editableBook.value.barcode);
        // Die URL im Formular direkt aktualisieren
        if (editableBook.value) {
            editableBook.value.cover_url = `${result.coverUrl}?t=${new Date().getTime()}`;
        }
    } catch (err) {
        error.value = err.message;
    } finally {
        isFetchingCover.value = false;
    }
}

function close() { emit('update:modelValue', false); }

async function submitUpdate() {
  // ... (unveränderte Funktion)
}
</script>

<style scoped>
.modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,.5);display:flex;justify-content:center;align-items:center;z-index:100}
.modal-content{width:100%;max-width:500px}
.form-group{margin-bottom:15px}
.modal-actions{margin-top:20px;display:flex;justify-content:flex-end;gap:10px}
.status-error{color:#dc3545;font-size:14px}
.input-with-button { display: flex; gap: 10px; }
.input-with-button .input { flex-grow: 1; }
.cover-preview-wrapper { text-align: center; margin-bottom: 15px; }
.cover-preview { max-height: 150px; border-radius: 4px; border: 1px solid #ddd; }
</style>
