<template>
    <div class="print-view-container">
        <div class="controls-panel">
            <h1>Barcode-Druck</h1>
            <p>Diese Seite ist für den Druck von Barcode-Etiketten optimiert.</p>
            
            <!-- NEU: Auswahl für das Etiketten-Format -->
            <div class="form-group">
                <label for="label-format">Etiketten-Format auswählen:</label>
                <select id="label-format" v-model="selectedFormatId" class="input">
                    <option v-for="format in labelFormats" :key="format.id" :value="format.id">
                        {{ format.name }} ({{ format.cols }}x{{ format.rows }} - {{ format.labelWidth }}mm x {{ format.labelHeight }}mm)
                    </option>
                </select>
            </div>

            <button @click="window.print()" class="btn btn-primary print-button">🖨️ Drucken</button>
            <router-link :to="`/orders/${orderItemId}`" class="btn">Zurück zur Bestellung</router-link>
        </div>

        <div v-if="isLoading" class="loading">
            <p>🔄 Lade Barcodes...</p>
        </div>
        
        <!-- Das Layout wird jetzt dynamisch über die 'sheetStyles' gesteuert -->
        <div v-else-if="books.length > 0" class="label-sheet" :style="sheetStyles.sheet">
            <div v-for="book in books" :key="book.barcode" class="label" :style="sheetStyles.label">
                <p class="label-title">{{ book.title }}</p>
                <svg :data-barcode="book.barcode" class="barcode"></svg>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import { useRoute } from 'vue-router';
import JsBarcode from 'jsbarcode';

const route = useRoute();
const books = ref([]);
const isLoading = ref(false);
const orderItemId = ref(route.params.orderItemId);

// NEU: Vordefinierte Etiketten-Formate
const labelFormats = ref([
    { id: 'avery3474', name: 'Avery 3474', cols: 3, rows: 8, labelWidth: 70, labelHeight: 37, topMargin: 12.5, leftMargin: 5 },
    { id: 'herma4428', name: 'Herma 4428', cols: 2, rows: 4, labelWidth: 105, labelHeight: 48, topMargin: 10, leftMargin: 0 },
    { id: 'default3x7', name: 'Standard 3x7', cols: 3, rows: 7, labelWidth: 70, labelHeight: 42.3, topMargin: 15.1, leftMargin: 0 },
]);
const selectedFormatId = ref('avery3474');

// NEU: Berechnete Stile für das dynamische Layout
const sheetStyles = computed(() => {
    const format = labelFormats.value.find(f => f.id === selectedFormatId.value);
    if (!format) return { sheet: {}, label: {} };

    return {
        sheet: {
            'grid-template-columns': `repeat(${format.cols}, 1fr)`,
            'padding-top': `${format.topMargin}mm`,
            'padding-left': `${format.leftMargin}mm`,
            'padding-right': `${format.leftMargin}mm`,
        },
        label: {
            'width': `${format.labelWidth}mm`,
            'height': `${format.labelHeight}mm`,
        }
    };
});

async function fetchBarcodes() {
    isLoading.value = true;
    try {
        const response = await fetch(`/api/order-items/${orderItemId.value}/barcodes`);
        const data = await response.json();
        if (data.success) {
            books.value = data.books;
            await nextTick();
            generateAllBarcodes();
        }
    } catch (error) {
        console.error("Fehler beim Laden der Barcodes:", error);
    } finally {
        isLoading.value = false;
    }
}

function generateAllBarcodes() {
    const barcodeElements = document.querySelectorAll('.barcode');
    barcodeElements.forEach(svg => {
        const value = svg.getAttribute('data-barcode');
        if (value) {
            JsBarcode(svg, value, {
                format: "CODE128",
                displayValue: true,
                fontSize: 14,
                margin: 10,
                height: 40,
            });
        }
    });
}

onMounted(() => {
    fetchBarcodes();
});
</script>

<style scoped>
.print-view-container {
    padding: 20px;
}
.controls-panel {
    margin-bottom: 20px;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 8px;
    text-align: center;
}
.form-group {
    margin-bottom: 15px;
}
.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
}
.print-button {
    margin-right: 10px;
}
.label-sheet {
    display: grid;
    gap: 0; /* Der Abstand wird durch die Etikettengröße und Ränder gesteuert */
    background: white;
    width: 210mm; /* A4-Breite */
    height: 297mm; /* A4-Höhe */
    box-sizing: border-box;
}
.label {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 2mm;
    overflow: hidden;
    box-sizing: border-box;
}
.label-title {
    font-size: 10px;
    margin-bottom: 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
}
.barcode {
    width: 100%;
    height: auto;
}

/* Druck-spezifische Stile */
@media print {
    @page {
        size: A4;
        margin: 0;
    }
    body * {
        visibility: hidden;
    }
    .label-sheet, .label-sheet * {
        visibility: visible;
    }
    .print-view-container {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        padding: 0;
    }
    .controls-panel {
        display: none;
    }
    .label-sheet {
        margin: 0;
        border: none;
        box-shadow: none;
        page-break-inside: avoid;
    }
}
</style>
