<template>
    <div class="inventory-view">
        <h2>📋 Inventurmodus</h2>

        <div v-if="!inventoryStore.report" class="scanner-panel card">
            <h4>1. Barcodes erfassen</h4>
            <p>Scannen oder fügen Sie alle Barcodes der zu prüfenden Bücher in das Textfeld ein. Ein Barcode pro Zeile.</p>
            <textarea 
                v-model="scannedBarcodesText"
                rows="15"
                class="input barcode-textarea"
                placeholder="B-12345&#10;B-67890&#10;B-ABCDE&#10;..."
            ></textarea>
            <button 
                @click="startCheck" 
                class="btn btn-primary btn-large" 
                :disabled="scannedBarcodesText.trim() === '' || inventoryStore.isLoading">
                {{ inventoryStore.isLoading ? 'Prüfung läuft...' : `Prüfung für ${barcodeCount} Bücher starten` }}
            </button>
        </div>

        <div v-else class="report-panel">
            <div class="view-header">
                <h3>Inventurbericht</h3>
                <button @click="inventoryStore.clearReport()" class="btn">Neue Inventur starten</button>
            </div>

            <!-- Fehlende Bücher -->
            <div class="report-section card missing">
                <h4>❌ Fehlende Bücher ({{ report.missing_in_reality.length }})</h4>
                <p>Diese Bücher sind laut System verfügbar, wurden aber nicht gescannt.</p>
                <ul>
                    <li v-for="book in report.missing_in_reality" :key="book.barcode">
                        <strong>{{ book.title }}</strong> ({{ book.barcode }})
                    </li>
                </ul>
            </div>

            <!-- Unerwartet gefundene Bücher -->
            <div class="report-section card unexpected">
                <h4>⚠️ Unerwartet gefundene Bücher ({{ report.found_unexpectedly.length }})</h4>
                <p>Diese Bücher wurden gescannt, sind im System aber als '{{ report.found_unexpectedly[0]?.status }}' markiert.</p>
                <ul>
                    <li v-for="book in report.found_unexpectedly" :key="book.barcode">
                        <strong>{{ book.title }}</strong> ({{ book.barcode }}) - Status: {{ book.status }}
                    </li>
                </ul>
            </div>
            
            <!-- Unbekannte Barcodes -->
            <div v-if="report.unknown_barcodes.length > 0" class="report-section card unknown">
                <h4>❓ Unbekannte Barcodes ({{ report.unknown_barcodes.length }})</h4>
                <p>Diese gescannten Barcodes existieren nicht in der Datenbank.</p>
                <ul>
                    <li v-for="barcode in report.unknown_barcodes" :key="barcode">{{ barcode }}</li>
                </ul>
            </div>

            <!-- Korrekt gefundene Bücher -->
            <div class="report-section card correct">
                <h4>✅ Korrekt gefundene Bücher ({{ report.found_correctly.length }})</h4>
                <p>Diese Bücher wurden korrekt im Bestand erfasst.</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useInventoryStore } from '../stores/inventory.js';

const inventoryStore = useInventoryStore();
const scannedBarcodesText = ref('');

const report = computed(() => inventoryStore.report);
const barcodeCount = computed(() => {
    return scannedBarcodesText.value.trim().split('\n').filter(b => b).length;
});

function startCheck() {
    const barcodes = scannedBarcodesText.value.trim().split('\n').filter(b => b);
    if (barcodes.length > 0) {
        inventoryStore.checkInventory(barcodes);
    }
}
</script>

<style scoped>
.view-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}
.scanner-panel {
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
}
.barcode-textarea {
    width: 100%;
    margin: 15px 0;
    font-family: monospace;
    font-size: 1.1em;
}
.btn-large {
    padding: 12px 25px;
    font-size: 1.1em;
}
.report-panel {
    display: grid;
    gap: 20px;
}
.report-section {
    padding: 20px;
}
.report-section h4 {
    margin-top: 0;
    margin-bottom: 10px;
}
.report-section ul {
    padding-left: 20px;
    max-height: 200px;
    overflow-y: auto;
}
.card.missing { border-left: 5px solid #dc3545; }
.card.unexpected { border-left: 5px solid #ffc107; }
.card.unknown { border-left: 5px solid #6c757d; }
.card.correct { border-left: 5px solid #28a745; }
</style>
