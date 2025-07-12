<template>
    <div class="order-detail-view">
        <div v-if="orderStore.isLoading && !orderStore.currentOrder" class="loading">
            <p>🔄 Lade Bestelldetails...</p>
        </div>
        <div v-else-if="orderStore.currentOrder" class="order-details">
            <div class="view-header">
                <h2>Bestellung #{{ orderStore.currentOrder.id }}</h2>
                <router-link to="/orders" class="btn">Zurück zur Übersicht</router-link>
            </div>

            <div class="order-meta card">
                <div><strong>Anbieter:</strong> {{ orderStore.currentOrder.supplier_name }}</div>
                <div><strong>Bestelldatum:</strong> {{ formatDate(orderStore.currentOrder.order_date) }}</div>
                <div><strong>Status:</strong> <span :class="['status-badge', orderStore.currentOrder.status]">{{ orderStore.currentOrder.status }}</span></div>
            </div>

            <div class="order-items-container card">
                <h4>Bestellte Artikel</h4>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Titel</th>
                            <th>Autor</th>
                            <th>ISBN</th>
                            <th>Anzahl</th>
                            <th>Status</th>
                            <th>Aktion</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in orderStore.currentOrder.items" :key="item.id">
                            <td>{{ item.title }}</td>
                            <td>{{ item.author }}</td>
                            <td>{{ item.isbn }}</td>
                            <td>{{ item.quantity }}</td>
                            <td><span :class="['status-badge', item.status]">{{ item.status }}</span></td>
                            <td>
                                <button 
                                    v-if="item.status !== 'delivered'" 
                                    @click="handleReceive(item)" 
                                    class="btn btn-primary btn-small"
                                    :disabled="orderStore.isLoading">
                                    Lieferung freischalten
                                </button>
                                <span v-else class="text-success">✔ Geliefert</span>
                                <router-link 
                                    v-if="item.status === 'delivered'"
                                    :to="`/barcodes/print/${item.id}`" 
                                    class="btn btn-secondary btn-small"
                                    target="_blank"
                                >
                                    🖨️ Barcodes
                                </router-link>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div v-else class="no-results">
            <p>Bestellung konnte nicht gefunden werden.</p>
        </div>
    </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useOrderStore } from '../stores/orders.js';

const route = useRoute();
const orderStore = useOrderStore();

onMounted(() => {
    const orderId = route.params.id;
    orderStore.fetchOrderById(orderId);
});

async function handleReceive(item) {
    if (confirm(`Möchten Sie ${item.quantity} Exemplar(e) von "${item.title}" wirklich als geliefert markieren und dem Bestand hinzufügen?`)) {
        try {
            const result = await orderStore.receiveOrderItem(item.id);
            alert(result.message);
            // Daten neu laden, um den aktualisierten Status anzuzeigen
            orderStore.fetchOrderById(route.params.id);
        } catch (error) {
            alert(`Fehler: ${error.message}`);
        }
    }
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('de-DE');
}
</script>

<style scoped>
.view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.order-meta { display: flex; gap: 30px; padding: 20px; margin-bottom: 20px; background-color: #f8f9fa; }
.data-table { width: 100%; }
.text-success { color: #28a745; font-weight: bold; }
.status-badge {
    padding: 4px 8px; border-radius: 12px; font-size: 12px;
    color: white; text-transform: capitalize;
}
.status-badge.ordered { background-color: #007bff; }
.status-badge.delivered { background-color: #28a745; }
.status-badge.partially_delivered { background-color: #fd7e14; }
.status-badge.pending { background-color: #ffc107; color: #333; }
.status-badge.cancelled { background-color: #6c757d; }
</style>
