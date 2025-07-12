<template>
  <div class="public-order-container">
    <div v-if="isLoading" class="status-box">
      <p>🔄 Lade Bestelldaten...</p>
    </div>
    <div v-else-if="error" class="status-box error-box">
      <h2>Fehler</h2>
      <p>{{ error }}</p>
      <p>Bitte überprüfen Sie den Link oder kontaktieren Sie die Bibliothek.</p>
    </div>
    <div v-else-if="order" class="order-details">
      <header class="print-header">
        <h1>Bestelldetails für {{ order.supplier || 'Ihre Bestellung' }}</h1>
        <p>Bestellung vom: {{ new Date(order.order_date).toLocaleDateString('de-DE') }} | Bestell-ID: {{ order.order_id }}</p>
        <div class="print-controls">
          <button @click="window.print()" class="btn btn-primary">🖨️ Drucken</button>
          <span>Layout: A4-Etiketten (3x7)</span>
        </div>
      </header>

      <div class="barcode-sheet">
        <div v-for="item in order.items" :key="item.library_barcode_id" class="label">
          <p class="label-title">{{ item.title }}</p>
          <p class="label-author">{{ item.author }}</p>
          <svg :id="`barcode-${item.library_barcode_id}`" class="barcode-svg"></svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import JsBarcode from 'jsbarcode';

// Refs für den Zustand der Komponente
const route = useRoute();
const order = ref(null);
const isLoading = ref(true);
const error = ref(null);

// Diese Funktion wird aufgerufen, wenn die Komponente geladen wird.
onMounted(async () => {
  // Holt den Token aus der URL (z.B. /order/TOKEN_HIER)
  const token = route.params.token;

  try {
    // Ruft den öffentlichen API-Endpunkt auf
    const response = await fetch(`/api/public/order/${token}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Bestellung konnte nicht geladen werden.');
    }
    
    order.value = result.data;

    // Warten, bis Vue die Elemente im DOM gerendert hat.
    await nextTick();

    // Jetzt die Barcodes generieren
    generateBarcodes();

  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
});

function generateBarcodes() {
  if (!order.value || !order.value.items) return;

  order.value.items.forEach(item => {
    const elementId = `#barcode-${item.library_barcode_id}`;
    JsBarcode(elementId, item.library_barcode_id, {
      format: 'CODE128', // Gängiges Barcode-Format
      lineColor: '#000',
      width: 2,
      height: 50,
      displayValue: true, // Zeigt den Text unter dem Barcode an
      fontSize: 14
    });
  });
}
</script>

<style scoped>
.public-order-container {
  padding: 2rem;
  background-color: #f1f3f5;
  min-height: 100vh;
}
.status-box {
  text-align: center;
  padding: 3rem;
  background-color: #fff;
  border-radius: 8px;
  max-width: 600px;
  margin: 4rem auto;
}
.error-box {
    border-left: 5px solid #dc3545;
}
.print-header {
  background-color: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.print-header h1 {
  margin-top: 0;
}
.print-controls {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.barcode-sheet {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 3 Spalten */
  gap: 0;
  background-color: #fff;
  padding: 10mm 5mm; /* Rand für A4 */
  width: 210mm; /* A4 Breite */
  min-height: 297mm; /* A4 Höhe */
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
.label {
  border: 1px dashed #ced4da; /* Gestrichelte Linie zum Ausschneiden */
  height: 38mm; /* Höhe eines Standard-Etiketts (z.B. 3x7) */
  padding: 0.5rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  overflow: hidden;
}
.label-title {
  font-size: 10px;
  font-weight: bold;
  margin: 0 0 4px 0;
}
.label-author {
  font-size: 9px;
  margin: 0 0 4px 0;
}
.barcode-svg {
  width: 100%;
  max-width: 60mm;
}

/* Druck-Stile: Versteckt alles außer der Barcode-Liste beim Drucken */
@media print {
  body, .public-order-container {
    background-color: #fff !important;
    padding: 0;
    margin: 0;
  }
  .print-header {
    display: none;
  }
  .barcode-sheet {
    box-shadow: none;
    width: 100%;
    min-height: 100%;
    padding: 0;
  }
  .label {
    border: 1px solid #000; /* Durchgezogene Linie für den Druck */
  }
}
</style>
