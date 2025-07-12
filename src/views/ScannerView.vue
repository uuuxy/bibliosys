<template>
    <div class="scanner-view card">
        <h2>📱 Universal Scanner</h2>
        <p>Erst Schülerkarte scannen, dann ein oder mehrere Bücher.</p>
        
        <div class="scanner-interface">
            <div class="scanner-input-group">
                <input
                    ref="scannerInputRef"
                    v-model="scannerCode"
                    @keyup.enter="handleScan"
                    placeholder="Barcode scannen oder eingeben..."
                    class="input scanner-input"
                    :disabled="scannerStore.isLoading"
                >
                <button @click="handleScan" class="btn btn-primary" :disabled="scannerStore.isLoading">
                    {{ scannerStore.isLoading ? '...' : 'OK' }}
                </button>
            </div>
        </div>

        <div v-if="scannerStore.activeStudent" class="session-info">
            Aktiver Schüler: <strong>{{ scannerStore.activeStudent.fullName }}</strong>
            <button @click="scannerStore.clearSession()" class="btn btn-secondary btn-small">Sitzung beenden</button>
        </div>

        <div v-if="scannerStore.lastTransaction" class="status-message status-success">
            {{ scannerStore.lastTransaction }}
        </div>
        <div v-if="scannerStore.error" class="status-message status-error">
            {{ scannerStore.error }}
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useScannerStore } from '../stores/scanner.js';

const scannerStore = useScannerStore();
const scannerCode = ref('');
const scannerInputRef = ref(null);

function handleScan() {
    if (!scannerCode.value) return;
    scannerStore.processScan(scannerCode.value);
    scannerCode.value = ''; // Input-Feld nach dem Scan leeren
}

// Setzt den Fokus beim Laden der Komponente auf das Eingabefeld
onMounted(() => {
    scannerInputRef.value?.focus();
});
</script>

<style scoped>
.scanner-interface {
    margin: 20px 0;
}
.scanner-input-group {
    display: flex;
    gap: 10px;
}
.session-info {
    margin-top: 20px;
    padding: 15px;
    background-color: #e3f2fd;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.btn-small {
    padding: 5px 10px;
    font-size: 12px;
}
</style>