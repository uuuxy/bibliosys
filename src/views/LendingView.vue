<template>
    <div class="lending-view">
        <!-- NEU: Buttons zum Umschalten des Modus -->
        <div class="mode-switcher">
            <button 
                @click="currentMode = 'universal'" 
                class="btn" 
                :class="{ 'btn-primary': currentMode === 'universal', 'btn-secondary': currentMode !== 'universal' }">
                🔍 Universal-Suche & Ausleihe
            </button>
            <button 
                @click="currentMode = 'quick_return'" 
                class="btn" 
                :class="{ 'btn-primary': currentMode === 'quick_return', 'btn-secondary': currentMode !== 'quick_return' }">
                ⚡ Schnellrückgabe
            </button>
        </div>

        <!-- Modus 1: Universal-Suche (der bisherige Code) -->
        <div v-if="currentMode === 'universal'">
            <div class="search-panel card">
                <p>Scannen oder suchen Sie einen Schüler oder ein Buch.</p>
                <div class="search-bar">
                    <input 
                        v-model="lendingStore.searchTerm"
                        @keyup.enter="lendingStore.performSearch"
                        type="text" 
                        placeholder="Barcode, Schüler-ID oder Name..."
                        class="input scanner-input"
                        autofocus
                    />
                    <button @click="lendingStore.performSearch" class="btn btn-primary">Suchen</button>
                </div>
            </div>
            <div class="result-panel">
                <!-- ... (Die komplette Ergebnis-Anzeige bleibt hier unverändert) ... -->
            </div>
        </div>

        <!-- Modus 2: Schnellrückgabe (der Code aus der alten QuickReturnView) -->
        <div v-if="currentMode === 'quick_return'">
             <div class="scanner-panel card">
                <p>Scannen Sie die Barcodes der zurückgegebenen Bücher. Jeder Scan wird sofort verarbeitet.</p>
                <div class="scanner-input-group">
                    <input
                        ref="scannerInputRef"
                        v-model="returnScannerCode"
                        @keyup.enter="handleReturnScan"
                        placeholder="Barcode für Rückgabe scannen..."
                        class="input scanner-input"
                        autofocus
                    >
                </div>
                <p v-if="returnStore.lastError" class="status-error">
                    Fehler: {{ returnStore.lastError }}
                </p>
            </div>

            <div class="history-panel card">
                <h4>Zuletzt zurückgenommen</h4>
                <ul class="return-list">
                    <li v-for="(item, index) in returnStore.recentReturns" :key="item.lending_id">
                        <span class="book-title"><strong>{{ item.book_title }}</strong></span>
                        <span class="details">Gehörte: {{ item.student_name }}</span>
                        <span class="details">Bearbeitet von: {{ item.librarian_name }}</span>
                        <button @click="returnStore.undoReturn(item.lending_id, index)" class="btn btn-secondary btn-small">
                            Rückgängig
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useLendingStore } from '../stores/lending.js';
import { useQuickReturnStore } from '../stores/quickReturn.js'; // NEU

const lendingStore = useLendingStore();
const returnStore = useQuickReturnStore(); // NEU

const currentMode = ref('universal'); // Startmodus

// Logik für die Schnellrückgabe
const scannerInputRef = ref(null);
const returnScannerCode = ref('');

async function handleReturnScan() {
    if (!returnScannerCode.value) return;
    await returnStore.processReturn(returnScannerCode.value);
    returnScannerCode.value = ''; // Feld für nächsten Scan leeren
}

// ... (der Rest des Skripts für die Universal-Suche bleibt unverändert)
function selectStudent(student) {
    lendingStore.selectStudentFromList(student);
}
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('de-DE');
}
</script>

<style scoped>
.mode-switcher {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-bottom: 20px;
}
.search-panel, .scanner-panel { margin-bottom: 20px; text-align: center; }
.search-bar, .scanner-input-group { display: flex; gap: 10px; margin-top: 15px; max-width: 600px; margin-left: auto; margin-right: auto;}
.scanner-input { font-size: 1.2em; text-align: center; }
/* ... (alle anderen Stile aus LendingView und QuickReturnView bleiben hier) ... */
.status-error { color: #dc3545; font-weight: bold; margin-top: 10px; }
.history-panel { margin-top: 20px; }
.return-list { list-style: none; padding: 0; }
.return-list li {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr auto;
    gap: 15px;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid #eee;
}
.return-list li:last-child { border-bottom: none; }
.details { font-size: 0.9em; color: #6c757d; }
</style>
