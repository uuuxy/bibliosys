import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth';

export const useUserStore = defineStore('user', () => {
    // === STATE ===
    const users = ref([]);
    const isLoading = ref(false);

    const authStore = useAuthStore();

    // Helper function for authenticated API calls
    async function fetchWithAuth(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authStore.sessionId}`,
            ...options.headers,
        };
        const response = await fetch(url, { ...options, headers });
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Ein Fehler ist aufgetreten.');
        }
        return data;
    }

    // === ACTIONS ===
    async function fetchUsers() {
        isLoading.value = true;
        try {
            const data = await fetchWithAuth('/api/users');
            users.value = data.users || [];
        } catch (error) {
            console.error("Fehler beim Laden der Benutzer:", error);
            users.value = [];
        } finally {
            isLoading.value = false;
        }
    }

    async function addUser(userData) {
        // Das Passwort wird nur beim Erstellen gesendet
        const data = await fetchWithAuth('/api/users', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        await fetchUsers(); // Liste aktualisieren
        return data;
    }

    async function updateUser(userId, userData) {
        const data = await fetchWithAuth(`/api/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
        await fetchUsers(); // Liste aktualisieren
        return data;
    }

    async function deleteUser(userId) {
        const data = await fetchWithAuth(`/api/users/${userId}`, {
            method: 'DELETE',
        });
        await fetchUsers(); // Liste aktualisieren
        return data;
    }

    return {
        users,
        isLoading,
        fetchUsers,
        addUser,
        updateUser,
        deleteUser,
    };
});
