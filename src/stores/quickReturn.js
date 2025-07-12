import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth';

export const useQuickReturnStore = defineStore('quickReturn', () => {
    const recentReturns = ref([]);
    const lastError = ref('');
    const authStore = useAuthStore();

    async function processReturn(barcode) {
        lastError.value = '';
        try {
            const response = await fetch('/api/lending/quick-return', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authStore.sessionId}`
                },
                body: JSON.stringify({ barcode })
            });
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error);
            }
            // Neueste Rückgabe oben in der Liste anzeigen
            recentReturns.value.unshift(data);
            // Liste auf 20 Einträge beschränken
            if (recentReturns.value.length > 20) {
                recentReturns.value.pop();
            }
        } catch (error) {
            lastError.value = error.message;
        }
    }

    async function undoReturn(lendingId, index) {
        try {
            const response = await fetch('/api/lending/undo-return', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authStore.sessionId}`
                },
                body: JSON.stringify({ lendingId })
            });
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error);
            }
            // Eintrag aus der lokalen Liste entfernen
            recentReturns.value.splice(index, 1);
        } catch (error) {
            alert(`Fehler beim Rückgängigmachen: ${error.message}`);
        }
    }

    return {
        recentReturns,
        lastError,
        processReturn,
        undoReturn
    };
});
