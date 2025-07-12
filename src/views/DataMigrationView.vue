<template>
    <div class="migration-view">
        <h2>🗂️ Daten-Migration</h2>
        
        <div class="import-panel card">
            <h4>Import von bestehenden Ausleihen</h4>
            <p class="info-text">
                Laden Sie hier Ihre Excel-Datei hoch, um bestehende Ausleih-Daten zu importieren.
                Die Datei muss ein Tabellenblatt mit dem exakten Namen <strong>Ausleihen</strong> enthalten.
            </p>
            <p class="info-text">
                Die benötigten Spalten sind: <strong>student_id</strong>, <strong>book_barcode</strong>, und <strong>due_date</strong> (im Format JJJJ-MM-TT).
            </p>

            <div class="form-group">
                <label for="file-upload" class="file-upload-label">
                    {{ selectedFile ? selectedFile.name : 'Excel-Datei auswählen...' }}
                </label>
                <input id="file-upload" type="file" @change="handleFileChange" accept=".xlsx, .xls" class="file-input">
            </div>

            <div class="modal-actions">
                <button @click="submitImport" class="btn btn-primary btn-large" :disabled="!selectedFile || migrationStore.isLoading">
                    {{ migrationStore.isLoading ? 'Importiere...' : 'Import starten' }}
                </button>
            </div>

            <div v-if="migrationStore.lastResult" :class="['feedback', migrationStore.lastResult.success ? 'success' : 'error']">
                {{ migrationStore.lastResult.message }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useMigrationStore } from '../stores/migration.js';

const migrationStore = useMigrationStore();
const selectedFile = ref(null);

function handleFileChange(event) {
    selectedFile.value = event.target.files[0] || null;
    if(migrationStore.lastResult) {
        migrationStore.lastResult = null;
    }
}

async function submitImport() {
    if (!selectedFile.value) return;
    try {
        await migrationStore.importLendings(selectedFile.value);
    } catch (error) {
        // Fehler wird bereits im Store behandelt und in lastResult gespeichert
    }
}
</script>

<style scoped>
.import-panel {
    max-width: 700px;
    margin: 20px auto;
}
.info-text { font-size: 14px; color: #666; margin-bottom: 10px; line-height: 1.5; }
.form-group { margin: 20px 0; }
.file-input { display: none; }
.file-upload-label {
    display: block;
    padding: 20px;
    border: 2px dashed #ccc;
    border-radius: 6px;
    text-align: center;
    cursor: pointer;
    background-color: #f9f9f9;
}
.file-upload-label:hover { border-color: #007bff; }
.modal-actions { text-align: center; }
.btn-large { padding: 12px 25px; font-size: 1.1em; }
.feedback {
    margin-top: 20px;
    padding: 15px;
    border-radius: 4px;
    text-align: center;
    font-weight: bold;
}
.feedback.success { background-color: #d4edda; color: #155724; }
.feedback.error { background-color: #f8d7da; color: #721c24; }
</style>
