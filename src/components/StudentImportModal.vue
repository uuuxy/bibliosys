<template>
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
        <div class="modal-content card">
            <h3>Schüler aus XLSX importieren</h3>
            <p class="info-text">
                Bitte laden Sie eine Excel-Datei (.xlsx) hoch. Die Spalten müssen die Überschriften <strong>id</strong>, <strong>name</strong> und <strong>class</strong> haben.
            </p>

            <div class="form-group">
                <label for="file-upload" class="file-upload-label">
                    {{ selectedFile ? selectedFile.name : 'Datei auswählen...' }}
                </label>
                <input id="file-upload" type="file" @change="handleFileChange" accept=".xlsx, .xls" class="file-input">
            </div>

            <div v-if="isLoading" class="loading">
                <p>🔄 Importiere Daten, bitte warten...</p>
            </div>

            <div v-if="feedbackMessage" :class="['feedback', { 'success': isSuccess, 'error': !isSuccess }]">
                {{ feedbackMessage }}
            </div>

            <div class="modal-actions">
                <button type="button" @click="close" class="btn">Abbrechen</button>
                <button @click="submitImport" class="btn btn-primary" :disabled="!selectedFile || isLoading">
                    {{ isLoading ? 'Importiere...' : 'Import starten' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useStudentStore } from '../stores/students.js';

defineProps({ modelValue: Boolean });
const emit = defineEmits(['update:modelValue']);

const studentStore = useStudentStore();
const selectedFile = ref(null);
const isLoading = ref(false);
const feedbackMessage = ref('');
const isSuccess = ref(false);

function handleFileChange(event) {
    selectedFile.value = event.target.files[0] || null;
    feedbackMessage.value = '';
}

function close() {
    emit('update:modelValue', false);
    // Reset state on close
    selectedFile.value = null;
    feedbackMessage.value = '';
    isLoading.value = false;
}

async function submitImport() {
    if (!selectedFile.value) return;

    isLoading.value = true;
    feedbackMessage.value = '';
    isSuccess.value = false;

    try {
        const result = await studentStore.importStudents(selectedFile.value);
        feedbackMessage.value = result.message;
        isSuccess.value = true;
    } catch (err) {
        feedbackMessage.value = err.message;
        isSuccess.value = false;
    } finally {
        isLoading.value = false;
    }
}
</script>

<style scoped>
.modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,.5);display:flex;justify-content:center;align-items:center;z-index:100}
.modal-content{width:100%;max-width:500px}
.form-group{margin-bottom:15px}
.modal-actions{margin-top:20px;display:flex;justify-content:flex-end;gap:10px}
.info-text { font-size: 14px; color: #666; margin-bottom: 20px; line-height: 1.5; }
.file-input { display: none; }
.file-upload-label {
    display: block;
    padding: 12px;
    border: 2px dashed #ccc;
    border-radius: 6px;
    text-align: center;
    cursor: pointer;
    background-color: #f9f9f9;
}
.file-upload-label:hover {
    border-color: #007bff;
    background-color: #f1f1f1;
}
.feedback {
    margin-top: 15px;
    padding: 10px;
    border-radius: 4px;
    text-align: center;
}
.feedback.success { background-color: #d4edda; color: #155724; }
.feedback.error { background-color: #f8d7da; color: #721c24; }
</style>
