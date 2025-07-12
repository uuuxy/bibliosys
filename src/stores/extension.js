import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from './auth';

export const useExtensionStore = defineStore('extension', () => {
    const lendings = ref([]);
    const isLoading = ref(false);
    const selectedLendingIds = ref([]);
    const authStore = useAuthStore();

    const allSelected = computed({
        get: () => lendings.value.length > 0 && selectedLendingIds.value.length === lendings.value.length,
        set: (value) => {
            if (value) {
                selectedLendingIds.value = lendings.value.map(l => l.lending_id);
            } else {
                selectedLendingIds.value = [];
            }
        }
    });

    async function fetchLendings(filters) {
        isLoading.value = true;
        selectedLendingIds.value = [];
        try {
            const response = await fetch('/api/lending/filterable', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authStore.sessionId}`
                },
                body: JSON.stringify(filters)
            });
            const data = await response.json();
            if (data.success) {
                lendings.value = data.lendings;
            }
        } catch (error) {
            console.error("Fehler beim Laden der Ausleihen:", error);
            lendings.value = [];
        } finally {
            isLoading.value = false;
        }
    }

    async function extendSelected(days) {
        if (selectedLendingIds.value.length === 0 || !days) return;
        
        try {
            const response = await fetch('/api/lending/extend-batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authStore.sessionId}`
                },
                body: JSON.stringify({ lendingIds: selectedLendingIds.value, days })
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            
            // Nach Erfolg die Liste neu laden, um die neuen Daten zu sehen
            await fetchLendings({}); // Leerer Filter, um die aktuelle Ansicht zu aktualisieren
            return data.message;
        } catch (error) {
            console.error("Fehler bei der Verlängerung:", error);
            throw error;
        }
    }

    return {
        lendings,
        isLoading,
        selectedLendingIds,
        allSelected,
        fetchLendings,
        extendSelected
    };
});
