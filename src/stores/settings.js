import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth';

export const useSettingsStore = defineStore('settings', () => {
    const idCardLayout = ref(null);
    const isLoading = ref(false);
    const authStore = useAuthStore();

    async function fetchIdCardLayout() {
        // Nur laden, wenn die Daten noch nicht vorhanden sind, um unnötige Anfragen zu vermeiden.
        if (idCardLayout.value) return;
        
        isLoading.value = true;
        try {
            const response = await fetch('/api/settings/id_card_layout', {
                headers: { 'Authorization': `Bearer ${authStore.sessionId}` }
            });
            const data = await response.json();
            if (data.success) {
                idCardLayout.value = data.value;
            }
        } catch (error) {
            console.error("Fehler beim Laden des Ausweis-Layouts:", error);
        } finally {
            isLoading.value = false;
        }
    }

    async function saveIdCardLayout(newLayout) {
        isLoading.value = true;
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authStore.sessionId}`
                },
                body: JSON.stringify({ key: 'id_card_layout', value: newLayout })
            });
            // Den lokalen Zustand sofort aktualisieren, damit die Änderung sichtbar ist.
            idCardLayout.value = newLayout;
        } catch (error) {
            console.error("Fehler beim Speichern des Ausweis-Layouts:", error);
            throw error;
        } finally {
            isLoading.value = false;
        }
    }

    return {
        idCardLayout,
        isLoading,
        fetchIdCardLayout,
        saveIdCardLayout
    };
});
