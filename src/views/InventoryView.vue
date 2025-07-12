<template>
    <div class="inventory-view">
        <h2>📖 Bestandsübersicht</h2>
        
        <!-- Bulk-Aktionsleiste -->
        <div v-if="bookStore.selectedBarcodes.length > 0" class="bulk-actions-bar card">
            <span>{{ bookStore.selectedBarcodes.length }} Bücher ausgewählt</span>
            <div class="actions">
                <button @click="handleBulkDelete" class="btn btn-danger">🗑️ Ausgewählte löschen</button>
                <button @click="bookStore.clearSelection()" class="btn">✕ Auswahl aufheben</button>
            </div>
        </div>

        <div class="filters-panel card">
            <div class="form-group">
                <label>Nach Fach filtern</label>
                <select v-model="bookStore.selectedCategoryId" @change="bookStore.searchBooks()" class="input">
                    <option :value="null">Alle Fächer</option>
                    <option v-for="category in bookStore.categories" :key="category.id" :value="category.id">
                        {{ category.name }} ({{ category.available_books }} / {{ category.total_books }})
                    </option>
                </select>
            </div>
            <div class="form-group">
                <label>Nach Titel, Autor oder Barcode suchen</label>
                <input 
                    v-model="bookStore.searchTerm"
                    @keyup.enter="bookStore.searchBooks"
                    type="text" 
                    placeholder="Suchbegriff eingeben..."
                    class="input"
                />
            </div>
        </div>

        <div v-if="bookStore.isLoading" class="loading">
            <p>🔄 Lade Bücher...</p>
        </div>
        
        <div v-else-if="bookStore.books.length > 0" class="book-grid">
            <BookCard 
                v-for="book in bookStore.books" 
                :key="book.barcode" 
                :book="book"
                @edit="openEditModal" 
            />
        </div>

        <div v-else class="no-results">
            <p>Keine Bücher für die aktuelle Auswahl gefunden.</p>
        </div>

        <!-- Das Edit-Modal wird hier benötigt, um die BookCard zu bedienen -->
        <EditBookModal v-if="selectedBook" v-model="isEditModalVisible" :book="selectedBook" />
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useBookStore } from '../stores/books.js';
import BookCard from '../components/BookCard.vue';
import EditBookModal from '../components/EditBookModal.vue';

const bookStore = useBookStore();

const selectedBook = ref(null);
const isEditModalVisible = ref(false);

onMounted(() => {
    bookStore.fetchCategories();
    bookStore.searchBooks();
});

function openEditModal(book) {
    selectedBook.value = book;
    isEditModalVisible.value = true;
}

async function handleBulkDelete() {
    if (confirm(`${bookStore.selectedBarcodes.length} Bücher wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
        try {
            await bookStore.bulkDeleteSelectedBooks();
            alert('Die ausgewählten Bücher wurden erfolgreich gelöscht.');
        } catch (error) {
            alert(`Fehler: ${error.message}`);
        }
    }
}
</script>

<style scoped>
.filters-panel {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    align-items: flex-end;
}
.form-group {
    flex-grow: 1;
}
.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
}
.book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}
.loading, .no-results {
  margin-top: 40px;
  text-align: center;
  color: #6c757d;
  font-size: 1.2em;
}
.bulk-actions-bar {
    background-color: #e3f2fd;
    border: 1px solid #007bff;
    padding: 15px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.bulk-actions-bar .actions {
    display: flex;
    gap: 10px;
}
</style>
