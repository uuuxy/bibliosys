<template>
    <div class="print-view-container">
        <div class="controls-panel">
            <h1>Ausweis-Stapeldruck</h1>
            <p>Wählen Sie eine Klasse aus, um die Ausweise für alle Schüler dieser Klasse zu drucken.</p>
            
            <div class="form-group">
                <label for="class-select">Klasse auswählen:</label>
                <select id="class-select" v-model="selectedClass" @change="loadStudents" class="input">
                    <option :value="null">-- Bitte Klasse wählen --</option>
                    <option v-for="className in idCardStore.classes" :key="className" :value="className">
                        {{ className }}
                    </option>
                </select>
            </div>

            <button @click="window.print()" class="btn btn-primary print-button" :disabled="idCardStore.studentsOfClass.length === 0">
                🖨️ Alle {{ idCardStore.studentsOfClass.length }} Ausweise drucken
            </button>
            <router-link to="/id-cards" class="btn">Zurück zum Einzeldruck</router-link>
        </div>

        <div v-if="idCardStore.isLoading" class="loading">
            <p>🔄 Lade Schüler...</p>
        </div>
        
        <!-- NEU: Das Layout wird jetzt für jede Karte verwendet -->
        <div v-if="idCardStore.studentsOfClass.length > 0 && settingsStore.idCardLayout" class="id-card-sheet">
            <StudentIDCard 
                v-for="student in idCardStore.studentsOfClass" 
                :key="student.id" 
                :student="student"
                :layout="settingsStore.idCardLayout"
            />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useIdCardStore } from '../stores/idCard.js';
import { useSettingsStore } from '../stores/settings.js'; // NEU
import StudentIDCard from '../components/StudentIDCard.vue';

const idCardStore = useIdCardStore();
const settingsStore = useSettingsStore(); // NEU
const selectedClass = ref(null);

onMounted(() => {
    idCardStore.fetchClasses();
    settingsStore.fetchIdCardLayout(); // NEU
});

function loadStudents() {
    idCardStore.fetchStudentsByClass(selectedClass.value);
}
</script>

<style scoped>
.print-view-container { padding: 20px; }
.controls-panel { margin-bottom: 20px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; text-align: center; }
.form-group { margin-bottom: 15px; max-width: 400px; margin-left: auto; margin-right: auto; }
.form-group label { display: block; margin-bottom: 5px; font-weight: 500; }
.print-button { margin-right: 10px; }
.id-card-sheet {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 15px;
    background: white;
}

/* Druck-spezifische Stile */
@media print {
    body * { visibility: hidden; }
    .id-card-sheet, .id-card-sheet * { visibility: visible; }
    .print-view-container { position: absolute; left: 0; top: 0; width: 100%; padding: 0; }
    .controls-panel { display: none; }
    .id-card-sheet {
        display: flex;
        flex-wrap: wrap;
        gap: 5mm;
        margin: 5mm;
    }
    .id-card {
        page-break-inside: avoid;
    }
}
</style>
