<template>
    <div class="suppliers-view">
        <div class="view-header">
            <h2>🚚 Anbieter & Lieferanten</h2>
            <button @click="openAddModal" class="btn btn-primary">
                ➕ Anbieter hinzufügen
            </button>
        </div>

        <div v-if="supplierStore.isLoading" class="loading">
            <p>🔄 Lade Anbieter...</p>
        </div>

        <div v-else class="suppliers-list-container card">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Ansprechpartner</th>
                        <th>E-Mail</th>
                        <th>Telefon</th>
                        <th>Aktionen</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="supplier in supplierStore.suppliers" :key="supplier.id">
                        <td>{{ supplier.name }}</td>
                        <td>{{ supplier.contact_person }}</td>
                        <td>{{ supplier.email }}</td>
                        <td>{{ supplier.phone }}</td>
                        <td class="actions-cell">
                            <button @click="openEditModal(supplier)" class="btn btn-secondary btn-small">Bearbeiten</button>
                            <button @click="handleDelete(supplier)" class="btn btn-danger btn-small">Löschen</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Modals -->
        <AddSupplierModal v-model="isAddModalVisible" />
        <EditSupplierModal v-if="selectedSupplier" v-model="isEditModalVisible" :supplier="selectedSupplier" />
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useSupplierStore } from '../stores/suppliers.js';
import AddSupplierModal from '../components/AddSupplierModal.vue';
import EditSupplierModal from '../components/EditSupplierModal.vue';

const supplierStore = useSupplierStore();

const isAddModalVisible = ref(false);
const isEditModalVisible = ref(false);
const selectedSupplier = ref(null);

onMounted(() => {
    supplierStore.fetchSuppliers();
});

function openAddModal() {
    isAddModalVisible.value = true;
}

function openEditModal(supplier) {
    selectedSupplier.value = supplier;
    isEditModalVisible.value = true;
}

async function handleDelete(supplier) {
    if (confirm(`Möchten Sie den Anbieter "${supplier.name}" wirklich löschen?`)) {
        try {
            await supplierStore.deleteSupplier(supplier.id);
            alert('Anbieter erfolgreich gelöscht.');
        } catch (error) {
            alert(`Fehler: ${error.message}`);
        }
    }
}
</script>

<style scoped>
.view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.suppliers-list-container { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; text-align: left; }
.data-table th, .data-table td { padding: 12px 15px; border-bottom: 1px solid #e0e0e0; }
.data-table th { background-color: #f4f6f8; font-weight: 600; }
.data-table tbody tr:hover { background-color: #f9f9f9; }
.actions-cell { display: flex; gap: 10px; }
.btn-small { padding: 5px 10px; font-size: 12px; }
.loading { text-align: center; padding: 40px; }
</style>
