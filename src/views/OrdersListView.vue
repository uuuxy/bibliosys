<template>
    <div class="orders-list-view">
        <div class="view-header">
            <h2>🛒 Bestellübersicht</h2>
            <router-link to="/orders/new" class="btn btn-primary">
                ➕ Neue Bestellung
            </router-link>
        </div>

        <div v-if="orderStore.isLoading" class="loading">
            <p>🔄 Lade Bestellungen...</p>
        </div>

        <div v-else class="orders-list-container card">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Bestell-ID</th>
                        <th>Anbieter</th>
                        <th>Bestelldatum</th>
                        <th>Status</th>
                        <th>Aktionen</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="order in orderStore.orders" :key="order.id">
                        <td>#{{ order.id }}</td>
                        <td>{{ order.supplier_name || 'N/A' }}</td>
                        <td>{{ formatDate(order.order_date) }}</td>
                        <td>
                            <span :class="['status-badge', order.status]">{{ order.status }}</span>
                        </td>
                        <td class="actions-cell">
                            <router-link :to="`/orders/${order.id}`" class="btn btn-secondary btn-small">
                                Details
                            </router-link>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useOrderStore } from '../stores/orders.js';

const orderStore = useOrderStore();

onMounted(() => {
    orderStore.fetchOrders();
});

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('de-DE');
}
</script>

<style scoped>
.view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.orders-list-container { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; text-align: left; }
.data-table th, .data-table td { padding: 12px 15px; border-bottom: 1px solid #e0e0e0; }
.data-table th { background-color: #f4f6f8; font-weight: 600; }
.data-table tbody tr:hover { background-color: #f9f9f9; }
.actions-cell { display: flex; gap: 10px; }
.btn-small { padding: 5px 10px; font-size: 12px; }
.loading { text-align: center; padding: 40px; }
.status-badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    color: white;
    text-transform: capitalize;
}
.status-badge.ordered { background-color: #007bff; }
.status-badge.delivered { background-color: #28a745; }
.status-badge.pending { background-color: #ffc107; color: #333; }
.status-badge.cancelled { background-color: #6c757d; }
</style>
