<template>
    <div class="layout-designer-view">
        <h2>📇 Ausweis-Layout Designer</h2>
        <div v-if="settingsStore.isLoading && !layout" class="loading">
            <p>Lade Einstellungen...</p>
        </div>
        <div v-else-if="layout" class="designer-grid">
            <!-- Linke Spalte: Einstellungs-Panel -->
            <div class="settings-panel card">
                <h4>Layout-Optionen</h4>
                
                <div class="setting-group">
                    <h5>Fotoposition</h5>
                    <label class="radio-label"><input type="radio" v-model="layout.photoPosition" value="left"> Links</label>
                    <label class="radio-label"><input type="radio" v-model="layout.photoPosition" value="right"> Rechts</label>
                </div>

                <div class="setting-group">
                    <h5>Angezeigte Felder</h5>
                    <div v-for="field in layout.fields" :key="field.key" class="field-option">
                        <label class="checkbox-label">
                            <input type="checkbox" v-model="field.visible">
                            Feld anzeigen
                        </label>
                        <input type="text" v-model="field.label" class="input label-input" :placeholder="`Beschriftung für ${field.key}`">
                    </div>
                </div>

                <button @click="saveLayout" class="btn btn-primary" :disabled="settingsStore.isLoading">
                    {{ settingsStore.isLoading ? 'Speichere...' : 'Layout speichern' }}
                </button>
            </div>

            <!-- Rechte Spalte: Vorschau-Panel -->
            <div class="preview-panel card">
                <h4>Live-Vorschau</h4>
                <StudentIDCard :student="sampleStudent" :layout="layout" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useSettingsStore } from '../stores/settings.js';
import StudentIDCard from '../components/StudentIDCard.vue';

const settingsStore = useSettingsStore();
const layout = ref(null);

// Ein Beispiel-Schüler für die Vorschau
const sampleStudent = {
    name: 'Erika Mustermann',
    class: '10a',
    id: 'S-101',
    photo_url: 'https://placehold.co/90x110/EFEFEF/333?text=Foto'
};

onMounted(async () => {
    await settingsStore.fetchIdCardLayout();
    // Erstelle eine tiefe Kopie, damit Änderungen nicht sofort den Store beeinflussen.
    layout.value = JSON.parse(JSON.stringify(settingsStore.idCardLayout));
});

async function saveLayout() {
    try {
        await settingsStore.saveIdCardLayout(layout.value);
        alert('Layout erfolgreich gespeichert!');
    } catch (error) {
        alert('Fehler beim Speichern des Layouts.');
    }
}
</script>

<style scoped>
.designer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }
.settings-panel h4, .preview-panel h4 { margin-bottom: 20px; }
.setting-group { margin-bottom: 25px; }
.setting-group h5 { margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
.radio-label { margin-right: 15px; }
.field-option { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.checkbox-label { width: 120px; }
.label-input { font-size: 14px; padding: 5px; flex-grow: 1; }
.preview-panel { display: flex; flex-direction: column; align-items: center; }
</style>
