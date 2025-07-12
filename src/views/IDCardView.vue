<template>
    <div class="id-card-designer-view">
        <div class="controls-panel card">
            <h2>📇 Ausweis-Einzeldruck</h2>
            <p>Suchen Sie einen Schüler, um eine Vorschau seines Ausweises zu sehen und zu drucken.</p>
            <!-- ... (Suchleiste und Ergebnisliste bleiben unverändert) ... -->
            <router-link to="/id-cards/batch" class="btn">Zum Stapeldruck für ganze Klassen</router-link>
            <router-link to="/settings/id-card-layout" class="btn btn-secondary">Layout bearbeiten</router-link>
        </div>

        <div class="preview-panel card">
            <h3>Vorschau</h3>
            <div class="search-bar">
                <input v-model="studentStore.searchTerm" @keyup.enter="studentStore.searchStudents" type="text" placeholder="Name oder ID..." class="input" />
                <button @click="studentStore.searchStudents" class="btn btn-primary">Suchen</button>
            </div>
            <div class="search-results" v-if="studentStore.students.length > 0">
                <div v-for="student in studentStore.students" :key="student.id" class="student-result-item" @click="selectStudent(student)">
                    <span>{{ student.name }} ({{ student.id }})</span>
                </div>
            </div>
            <div v-if="selectedStudent && settingsStore.idCardLayout" class="card-wrapper">
                <StudentIDCard :student="selectedStudent" :layout="settingsStore.idCardLayout" />
                <div style="display: flex; gap: 10px;">
                  <button @click="isPhotoModalVisible = true" class="btn btn-secondary">📷 Foto aufnehmen/ändern</button>
                  <button @click="printCard" class="btn btn-primary print-btn">
                      🖨️ Ausweis drucken
                  </button>
                </div>
                <StudentPhotoModal v-if="selectedStudent" v-model="isPhotoModalVisible" :student="selectedStudent" />
            </div>
            <div v-else class="no-student-selected">
                <p>Bitte wählen Sie einen Schüler aus der Suche aus.</p>
            </div>
        </div>

        <!-- Der Druckbereich verwendet jetzt auch das dynamische Layout -->
        <div id="print-area">
            <StudentIDCard v-if="selectedStudent && settingsStore.idCardLayout" :student="selectedStudent" :layout="settingsStore.idCardLayout" />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useStudentStore } from '../stores/students.js';
import { useSettingsStore } from '../stores/settings.js'; // NEU
import StudentIDCard from '../components/StudentIDCard.vue';
import StudentPhotoModal from '../components/StudentPhotoModal.vue';

const studentStore = useStudentStore();
const settingsStore = useSettingsStore(); // NEU
const selectedStudent = ref(null);
const isPhotoModalVisible = ref(false);

onMounted(() => {
    settingsStore.fetchIdCardLayout(); // NEU: Layout beim Laden der Seite holen
});

function selectStudent(student) {
    selectedStudent.value = student;
}

function printCard() {
    // ... (Druckfunktion bleibt unverändert)
    const printContents = document.getElementById('print-area').innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
}
</script>

<style scoped>
.id-card-designer-view {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}
.search-bar {
    display: flex;
    gap: 10px;
    margin: 20px 0;
}
.search-results {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #eee;
    border-radius: 4px;
}
.student-result-item {
    padding: 10px;
    cursor: pointer;
    border-bottom: 1px solid #eee;
}
.student-result-item:hover {
    background-color: #f0f8ff;
}
.preview-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
}
.card-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
}
.print-btn {
    margin-top: 20px;
}
.no-student-selected {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #888;
}
#print-area {
    display: none;
}
@media print {
    body * {
        visibility: hidden;
    }
    #print-area, #print-area * {
        visibility: visible;
    }
    #print-area {
        position: absolute;
        left: 0;
        top: 0;
    }
}
</style>
