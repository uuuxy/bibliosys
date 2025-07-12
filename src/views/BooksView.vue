<template>
  <div class="container py-3">
    <div v-if="bookStore.books.length > 0" class="row g-3">
      <div class="col-12 col-sm-6 col-md-4 col-lg-3" v-for="book in bookStore.books" :key="book.barcode">
        <BookCard :book="book" @edit="openEditModal" />
      </div>
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
/* Bootstrap übernimmt das Grid und die Abstände */
</style>