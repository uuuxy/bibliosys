<template>
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
        <div class="modal-content card">
            <div v-if="detailStore.isLoading" class="loading">
                <p>🔄 Lade Details...</p>
            </div>
            <div v-else-if="detailStore.student">
                <h3>Details für {{ detailStore.student.name }}</h3>
                <div class="student-details-grid">
                    <div class="student-info">
                        <img v-if="detailStore.student.photo_url" :src="detailStore.student.photo_url" class="student-photo">
                        <div v-else class="photo-placeholder">👤</div>
                        <p><strong>Klasse:</strong> {{ detailStore.student.class }}</p>
                        <p><strong>ID:</strong> {{ detailStore.student.id }}</p>
                    </div>
                    <div class="borrowed-books">
                        <h4>Ausgeliehene Bücher ({{ detailStore.student.borrowed_books.length }})</h4>
                        <ul v-if="detailStore.student.borrowed_books.length > 0" class="book-list">
                            <li v-for="book in detailStore.student.borrowed_books" :key="book.barcode" :class="{ overdue: book.is_overdue }">
                                <img v-if="book.cover_url" :src="book.cover_url" class="book-cover">
                                <div v-else class="book-cover-placeholder">📚</div>
                                <div class="book-info">
                                    <span>{{ book.title }}</span>
                                    <small>Fällig am: {{ formatDate(book.due_date) }}</small>
                                </div>
                                <span v-if="book.is_overdue" class="overdue-badge">Überfällig</span>
                            </li>
                        </ul>
                        <p v-else>Keine Bücher ausgeliehen.</p>
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <button @click="close" class="btn">Schließen</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useStudentDetailStore } from '../stores/studentDetail.js';

const props = defineProps({ modelValue: Boolean });
const emit = defineEmits(['update:modelValue']);
const detailStore = useStudentDetailStore();

function close() {
    emit('update:modelValue', false);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('de-DE');
}
</script>

<style scoped>
.modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,.5);display:flex;justify-content:center;align-items:center;z-index:100}
.modal-content{width:100%;max-width:800px;}
.student-details-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 20px; }
.student-photo { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; margin-bottom: 10px; }
.photo-placeholder { width: 120px; height: 120px; border-radius: 50%; background-color: #e9ecef; display: flex; align-items: center; justify-content: center; font-size: 60px; color: #adb5bd; margin-bottom: 10px; }
.book-list { list-style: none; padding: 0; max-height: 300px; overflow-y: auto; }
.book-list li { display: flex; align-items: center; gap: 15px; padding: 10px; border-radius: 6px; margin-bottom: 5px; }
.book-list li.overdue { background-color: #f8d7da; border-left: 4px solid #dc3545; }
.book-cover { width: 40px; height: 55px; object-fit: cover; border-radius: 4px; flex-shrink: 0; }
.book-cover-placeholder { width: 40px; height: 55px; background-color: #e9ecef; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #adb5bd; border-radius: 4px; flex-shrink: 0; }
.book-info { display: flex; flex-direction: column; flex-grow: 1; }
.book-info small { font-size: 12px; color: #6c757d; }
.overdue-badge { background-color: #dc3545; color: white; padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; }
.modal-actions{margin-top:20px;display:flex;justify-content:flex-end;gap:10px}
</style>
