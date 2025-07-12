import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth';

export const useOrderStore = defineStore('order', () => {
    // === STATE ===
    // Die Liste der Bücher, die bestellt werden sollen (unser "Warenkorb").
    const items = ref([]); 
    // Der ausgewählte Lieferant für die aktuelle Bestellung.
    const supplier = ref('');
    // Lade- und Fehlerzustände für die UI.
    const isLoading = ref(false);
    const error = ref(null);

    // === ACTIONS ===

    /**
     * Fügt einen Artikel (Buch mit Menge) zur Bestellliste hinzu.
     * @param {object} book - Das Buch-Objekt, das hinzugefügt wird.
     * @param {number} quantity - Die gewünschte Anzahl.
     */
    function addItem(book, quantity) {
        if (quantity <= 0) return;

        // Prüfen, ob genau dieses Buch schon in der Liste ist.
        const existingItem = items.value.find(item => item.isbn === book.isbn && item.title === book.title);

        if (existingItem) {
            // Wenn ja, nur die Menge erhöhen.
            existingItem.quantity += quantity;
        } else {
            // Wenn nein, als neuen Artikel hinzufügen.
            items.value.push({ ...book, quantity });
        }
    }

    /**
     * Entfernt einen Artikel aus der Bestellliste anhand seines Index.
     * @param {number} itemIndex - Der Index des Artikels in der `items`-Liste.
     */
    function removeItem(itemIndex) {
        items.value.splice(itemIndex, 1);
    }

    /**
     * Leert die gesamte Bestellliste und setzt den Lieferanten zurück.
     */
    function clearOrder() {
        items.value = [];
        supplier.value = '';
        error.value = null;
    }

    /**
     * Sendet die komplette Bestellung an das Backend.
     * @returns {Promise<object>} Das Ergebnis der API-Anfrage.
     */
    async function submitOrder() {
        isLoading.value = true;
        error.value = null;
        const authStore = useAuthStore();

        if (items.value.length === 0) {
            error.value = "Die Bestellliste ist leer.";
            isLoading.value = false;
            return;
        }

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authStore.sessionId}`
                },
                // Das Backend erwartet ein Objekt mit `supplier` und `items`.
                body: JSON.stringify({
                    supplier: supplier.value,
                    items: items.value
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Fehler beim Senden der Bestellung.');
            }

            // Bei Erfolg die lokale Bestellliste leeren.
            clearOrder();
            return result.data; // Gibt { orderId, generatedIds } zurück

        } catch (err) {
            error.value = err.message;
            // Wir werfen den Fehler weiter, damit die aufrufende Komponente darauf reagieren kann.
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    // Gibt den State und die Actions zurück, damit sie in Komponenten verwendet werden können.
    return {
        items,
        supplier,
        isLoading,
        error,
        addItem,
        removeItem,
        clearOrder,
        submitOrder
    };
});
