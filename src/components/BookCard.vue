<template>
  <div class="book-card" :class="{ 'is-selected': isSelected }">
    <!-- NEU: Checkbox zur Auswahl -->
    <input 
        type="checkbox" 
        class="selection-checkbox"
        :checked="isSelected"
        @change="toggleSelection"
    />
    
    <div class="book-cover-container">
        <img v-if="book.cover_url" :src="book.cover_url" :alt="book.title" class="book-cover">
        <div v-else class="cover-placeholder">📚</div>
    </div>

    <h4>{{ book.title }}</h4>
    <div class="book-details">
        <p><strong>Autor:</strong> {{ book.author }}</p>
        <p v-if="book.signature"><strong>Signatur:</strong> {{ book.signature }}</p>
        <p><strong>Barcode:</strong> {{ book.barcode }}</p>
        <p><strong>Status:</strong>
          <span :class="['status', book.status]">{{ book.status }}</span>
        </p>
    </div>
    <div class="book-actions">
      <button @click="$emit('edit', book)" class="edit-btn">Bearbeiten</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useBookStore } from '../stores/books.js';

const props = defineProps({ book: Object });
const emit = defineEmits(['edit']);
const bookStore = useBookStore();

const isSelected = computed(() => bookStore.selectedBarcodes.includes(props.book.barcode));

function toggleSelection() {
    bookStore.toggleSelection(props.book.barcode);
}
</script>

<style scoped>
.book-card {
  background: #fff;
  border-radius: 0.7rem;
  box-shadow: 0 2px 10px 0 rgba(0,0,0,0.06);
  padding: 1.2rem 1rem 1rem 1rem;
  margin-bottom: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  transition: box-shadow 0.14s, transform 0.14s;
}
.book-card.is-selected {
  box-shadow: 0 4px 18px 0 rgba(0,123,255,0.13);
  border: 1.5px solid #007bff;
}
.book-cover-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.7rem;
}
.book-cover {
  width: 60px;
  height: 85px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 1px 4px 0 rgba(0,0,0,0.07);
}
.cover-placeholder {
  width: 60px;
  height: 85px;
  background: #e9ecef;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #adb5bd;
}
h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.2rem 0;
}
.book-details {
  font-size: 0.97rem;
  color: #444;
  margin-bottom: 0.5rem;
}
.status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.92em;
  color: #fff;
  background: #007bff;
  margin-left: 0.3em;
}
.status.available { background: #28a745; }
.status.borrowed { background: #fd7e14; }
.status.lost { background: #dc3545; }
.book-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
}
.edit-btn {
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 6px 16px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.14s;
}
.edit-btn:hover {
  background: #0056b3;
}
.selection-checkbox {
  margin-bottom: 0.5rem;
}
</style>
