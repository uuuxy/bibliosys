<template>
  <div class="admin-orders-view">
    <h2>🛒 Bestellverwaltung (Admin)</h2>
    <OrdersView />
  </div>
</template>

<script setup>
import OrdersView from '../OrdersView.vue';
import { useSupplierStore } from '../../stores/suppliers.js';
import { onMounted } from 'vue';

const supplierStore = useSupplierStore();
onMounted(() => {
  supplierStore.fetchSuppliers();
});

</script>

<style scoped>
.admin-orders-view {
  max-width: 1100px;
  margin: 40px auto;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  padding: 32px 24px;
}
</style>
