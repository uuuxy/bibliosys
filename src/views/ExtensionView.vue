<template>
    <div class="extension-view">
        <h2>📅 Globale Verlängerung</h2>
        
        <div class="filters-panel card">
            <div class="form-group">
                <label>Nach Signatur filtern</label>
                <input v-model="filters.signature" type="text" class="input" placeholder="z.B. MAT-9 oder DEU-5...">
            </div>
            <div class="form-group">
                <label>Oder nach Fach filtern</label>
                <select v-model="filters.categoryId" class="input">
                    <option :value="null">-- Kein Fach ausgewählt --</option>
                    <option v-for="category in bookStore.categories" :key="category.id" :value="category.id">
                        {{ category.name }}
                    </option>
                </select>
            </div>
            <button @click="applyFilters" class="btn btn-primary">Filter anwenden</button>
        </div>

        <div v-if="extensionStore.isLoading" class="loading">
            <p>🔄 Lade Ausleihen...</p>
        </div>

        <div v-else-if="extensionStore.lendings.length > 0" class="results-panel card">
            <div class="bulk-actions-bar">
                <div class="selection-control">
                    <input type="checkbox" id="select-all" v-model="extensionStore.allSelected">
                    <label for="select-all">Alle auswählen ({{ extensionStore.selectedLendingIds.length }} / {{ extensionStore.lendings.length }})</label>
                </div>
                <div class="extension-control">
                    <input v-model.number="extensionDays" type="number" min="1" class="input days-input">
                    <span>Tage</span>
                    <button @click="handleExtend" class="btn btn-primary" :disabled="extensionStore.selectedLendingIds.length === 0">
                        Ausgewählte verlängern
                    </button>
                </div>
            </div>

            <table class="lendings-table">
                <thead>
                    <tr>
                        <th></th>
                        <th>Buch</th>
                        <th>Signatur</th>
                        <th>Schüler</th>
                        <th>Fällig am</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="lending in extensionStore.lendings" :key="lending.lending_id">
                        <td><input type="checkbox" :value="lending.lending_id" v-model="extensionStore.selectedLendingIds"></td>
                        <td>{{ lending.title }}</td>
                        <td>{{ lending.signature }}</td>
                        <td>{{ lending.student_name }}</td>
                        <td>{{ formatDate(lending.due_date) }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div v-else class="no-results">
            <p>Keine ausgeliehenen Bücher für die aktuelle Auswahl gefunden.</p>
        </div>
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useExtensionStore } from '../stores/extension.js';
import { useBookStore } from '../stores/books.js'; // Um Kategorien zu laden

const extensionStore = useExtensionStore();
const bookStore = useBookStore();

const filters = ref({
    signature: '',
    categoryId: null
});
const extensionDays = ref(30);

onMounted(() => {
    bookStore.fetchCategories(); // Kategorien für den Filter laden
});

function applyFilters() {
    // Nur einen Filter gleichzeitig erlauben, um die Logik einfach zu halten
    if (filters.value.signature) {
        filters.value.categoryId = null;
    }
    extensionStore.fetchLendings(filters.value);
}

async function handleExtend() {
    try {
        const message = await extensionStore.extendSelected(extensionDays.value);
        alert(message);
    } catch (error) {
        alert(`Fehler: ${error.message}`);
    }
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('de-DE');
}
</script>

<style scoped>
.filters-panel { display: flex; gap: 20px; margin-bottom: 20px; align-items: flex-end; }
.form-group { flex-grow: 1; }
.form-group label { display: block; margin-bottom: 5px; font-weight: 500; }
.results-panel { overflow-x: auto; }
.lendings-table { width: 100%; border-collapse: collapse; }
.lendings-table th, .lendings-table td { padding: 12px 15px; border-bottom: 1px solid #e0e0e0; text-align: left; }
.bulk-actions-bar { display: flex; justify-content: space-between; align-items: center; padding: 15px; background-color: #f8f9fa; border-bottom: 1px solid #dee2e6; }
.selection-control { display: flex; align-items: center; gap: 10px; }
.extension-control { display: flex; align-items: center; gap: 10px; }
.days-input { width: 80px; }
.loading, .no-results { margin-top: 40px; text-align: center; color: #6c757d; font-size: 1.2em; }
</style>
