import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth';

export const useOrderStore = defineStore('order', () => {
    const isLoading = ref(false);
    const authStore = useAuthStore();
    const orders = ref([]);
    const currentOrder = ref(null);

    async function createOrder(orderData) {
        isLoading.value = true;
        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authStore.sessionId}`
                },
                body: JSON.stringify(orderData)
            });
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Bestellung konnte nicht erstellt werden.');
            }
            return result;
        } catch (error) {
            console.error("Fehler beim Erstellen der Bestellung:", error);
            throw error;
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchBookInfoByIsbn(isbn) {
        try {
            const response = await fetch(`/api/book-info/${isbn}`, {
                headers: { 'Authorization': `Bearer ${authStore.sessionId}` }
            });
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error);
            }
            return result;
        } catch (error) {
            console.error("Fehler beim Abrufen der Buch-Info:", error);
            throw error;
        }
    }

    async function fetchOrders() {
        isLoading.value = true;
        try {
            const response = await fetch('/api/orders', {
                 headers: { 'Authorization': `Bearer ${authStore.sessionId}` }
            });
            const data = await response.json();
            if (data.success) {
                orders.value = data.orders;
            }
        } catch (error) {
            console.error("Fehler beim Laden der Bestellungen:", error);
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchOrderById(orderId) {
        isLoading.value = true;
        currentOrder.value = null;
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                 headers: { 'Authorization': `Bearer ${authStore.sessionId}` }
            });
            const data = await response.json();
            if (data.success) {
                currentOrder.value = data.order;
            }
        } catch (error) {
            console.error("Fehler beim Laden der Bestelldetails:", error);
        } finally {
            isLoading.value = false;
        }
    }

    // NEUE FUNKTION
    async function receiveOrderItem(orderItemId) {
        isLoading.value = true;
        try {
            const result = await fetch(`/api/order-items/${orderItemId}/receive`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authStore.sessionId}` }
            });
            const data = await result.json();
            if (!data.success) {
                throw new Error(data.error);
            }
            return data;
        } catch (error) {
            console.error("Fehler bei der Lieferungsfreischaltung:", error);
            throw error;
        } finally {
            isLoading.value = false;
        }
    }

    return {
        isLoading,
        orders,
        currentOrder,
        createOrder,
        fetchBookInfoByIsbn,
        fetchOrders,
        fetchOrderById,
        receiveOrderItem // NEU
    };
});
