import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth';

export const useInventoryStore = defineStore('inventory', () => {
    const report = ref(null);
    const isLoading = ref(false);
    const authStore = useAuthStore();

    async function checkInventory(barcodes) {
        isLoading.value = true;
        report.value = null;
        try {
            const response = await fetch('/api/inventory/check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authStore.sessionId}`
                },
                body: JSON.stringify({ barcodes })
            });
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error);
            }
            report.value = data.report;
        } catch (error) {
            console.error("Fehler bei der Inventurprüfung:", error);
            report.value = { error: error.message }; // Fehler im Report speichern
        } finally {
            isLoading.value = false;
        }
    }

    function clearReport() {
        report.value = null;
    }

    return {
        report,
        isLoading,
        checkInventory,
        clearReport
    };
});
