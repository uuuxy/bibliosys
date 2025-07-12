import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth';

export const useMigrationStore = defineStore('migration', () => {
    const isLoading = ref(false);
    const lastResult = ref(null);
    const authStore = useAuthStore();

    async function importLendings(file) {
        isLoading.value = true;
        lastResult.value = null;
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/lending/import', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authStore.sessionId}`
                },
                body: formData
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Import fehlgeschlagen.');
            }
            
            lastResult.value = result;
            return result;

        } catch (error) {
            console.error('Fehler beim Ausleihen-Import:', error);
            lastResult.value = { success: false, message: error.message };
            throw error;
        } finally {
            isLoading.value = false;
        }
    }

    return {
        isLoading,
        lastResult,
        importLendings,
    };
});
