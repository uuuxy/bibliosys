<template>
  <div class="books-view">
    <div v-if="bookStore.books.length > 0" class="book-grid">
      <BookCard 
        v-for="book in bookStore.books" 
        :key="book.barcode" 
        :book="book"
        @edit="openEditModal" 
      />
    </div>
    <AddBookModal v-model="isAddModalVisible" />
    <EditBookModal v-model="isEditModalVisible" :book="selectedBook" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useBookStore } from '../stores/books.js';
import BookCard from '../components/BookCard.vue';
import AddBookModal from '../components/AddBookModal.vue';
import EditBookModal from '../components/EditBookModal.vue'; // NEU

const bookStore = useBookStore();
const isAddModalVisible = ref(false);

// NEU: Refs für das Edit-Modal
const isEditModalVisible = ref(false);
const selectedBook = ref(null);

// NEU: Funktion zum Öffnen des Edit-Modals
function openEditModal(book) {
  selectedBook.value = book;
  isEditModalVisible.value = true;
}
</script>

<style scoped>
/* ... (vorhandene Stile) ... */
</style>