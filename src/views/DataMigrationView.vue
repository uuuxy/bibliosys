<template>
    <div class="migration-view">
        <h2>🗂️ Daten-Migration</h2>
        
        <div class="import-panel">
            <h4>Import von bestehenden Ausleihen</h4>
            <p class="info-text">
                Laden Sie hier Ihre Excel-Datei hoch, um bestehende Ausleih-Daten zu importieren.
                Die Datei muss ein Tabellenblatt mit dem exakten Namen <strong>Ausleihen</strong> enthalten.
            </p>
            <p class="info-text">
                Die benötigten Spalten sind: <strong>student_id</strong>, <strong>book_barcode</strong>, und <strong>due_date</strong> (im Format JJJJ-MM-TT).
            </p>

            <div class="import-form-group">
                <label for="file-upload" class="file-upload-label">
                    {{ selectedFile ? selectedFile.name : 'Excel-Datei auswählen...' }}
                </label>
                <input id="file-upload" type="file" @change="handleFileChange" accept=".xlsx, .xls" class="file-input">
            </div>

            <div class="import-actions">
                <button @click="submitImport" class="import-btn" :disabled="!selectedFile || migrationStore.isLoading">
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
    background: #fff;
    border-radius: 1rem;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.07);
    padding: 2rem 2rem 1.5rem 2rem;
}
.info-text { font-size: 14px; color: #666; margin-bottom: 10px; line-height: 1.5; }
.import-form-group { margin: 20px 0; }
.file-input { display: none; }
.file-upload-label {
    display: block;
    padding: 20px;
    border: 2px dashed #ccc;
    border-radius: 6px;
    text-align: center;
    cursor: pointer;
    background-color: #f9f9f9;
    font-size: 1.05rem;
    color: #495057;
    transition: border 0.15s, background 0.15s;
}
.file-upload-label:hover { border-color: #007bff; background: #f6faff; }
.import-actions { text-align: center; margin-top: 1.2rem; }
.import-btn {
    background: #007bff;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 12px 25px;
    font-size: 1.1em;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
}
.import-btn:disabled {
    background: #b6d4fe;
    color: #fff;
    cursor: not-allowed;
}
.import-btn:hover:not(:disabled) {
    background: #0056b3;
}
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
