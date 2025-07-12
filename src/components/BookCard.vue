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
      <button @click="$emit('edit', book)" class="btn btn-secondary">Bearbeiten</button>
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
  background-color: #fff; border: 1px solid #dee2e6; border-radius: 8px;
  padding: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  display: flex; flex-direction: column;
}
.book-cover-container {
    height: 160px;
    background-color: #e9ecef;
    border-radius: 4px;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}
.book-cover { width: auto; height: 100%; }
.cover-placeholder { font-size: 50px; color: #adb5bd; }
h4 { margin-bottom: 10px; flex-grow: 1; }
.book-details p { font-size: 14px; margin-bottom: 5px; }
.book-actions { margin-top: 15px; display: flex; gap: 10px; }
.status { padding: 2px 6px; border-radius: 4px; color: white; font-size: 12px; }
.status.available, .status.verfügbar { background-color: #28a745; }
.status.lent, .status.ausgeliehen { background-color: #dc3545; }
.book-card { position: relative; }
.selection-checkbox {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 20px;
    height: 20px;
    z-index: 10;
}
.book-card.is-selected {
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
}
</style>
