import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth';

export const useSupplierStore = defineStore('supplier', () => {
    const suppliers = ref([]);
    const isLoading = ref(false);
    const authStore = useAuthStore();

    async function fetchWithAuth(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authStore.sessionId}`,
            ...options.headers,
        };
        const response = await fetch(url, { ...options, headers });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Ein Fehler ist aufgetreten.');
        }
        return data;
    }

    async function fetchSuppliers() {
        isLoading.value = true;
        try {
            const data = await fetchWithAuth('/api/suppliers');
            suppliers.value = data.suppliers || [];
        } catch (error) {
            console.error("Fehler beim Laden der Anbieter:", error);
            suppliers.value = [];
        } finally {
            isLoading.value = false;
        }
    }

    async function addSupplier(supplierData) {
        await fetchWithAuth('/api/suppliers', {
            method: 'POST',
            body: JSON.stringify(supplierData),
        });
        await fetchSuppliers(); // Liste aktualisieren
    }

    async function updateSupplier(supplierId, supplierData) {
        await fetchWithAuth(`/api/suppliers/${supplierId}`, {
            method: 'PUT',
            body: JSON.stringify(supplierData),
        });
        await fetchSuppliers(); // Liste aktualisieren
    }

    async function deleteSupplier(supplierId) {
        await fetchWithAuth(`/api/suppliers/${supplierId}`, {
            method: 'DELETE',
        });
        await fetchSuppliers(); // Liste aktualisieren
    }

    return {
        suppliers,
        isLoading,
        fetchSuppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,
    };
});
