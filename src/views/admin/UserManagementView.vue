<template>
    <div class="admin-view">
        <div class="view-header">
            <h2>🔧 Benutzerverwaltung</h2>
            <button @click="openAddModal" class="btn btn-primary">
                ➕ Benutzer hinzufügen
            </button>
        </div>

        <div v-if="userStore.isLoading" class="loading">
            <p>🔄 Lade Benutzer...</p>
        </div>

        <div v-else class="user-list-container card">
            <table class="user-table">
                <thead>
                    <tr>
                        <th>Vollständiger Name</th>
                        <th>Benutzername</th>
                        <th>Rolle</th>
                        <th>Status</th>
                        <th>Aktionen</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="user in userStore.users" :key="user.id">
                        <td>{{ user.full_name }}</td>
                        <td>{{ user.username }}</td>
                        <td>{{ user.role }}</td>
                        <td>
                            <span :class="['status-badge', user.is_active ? 'active' : 'inactive']">
                                {{ user.is_active ? 'Aktiv' : 'Inaktiv' }}
                            </span>
                        </td>
                        <td class="actions-cell">
                            <button @click="openEditModal(user)" class="btn btn-secondary btn-small">Bearbeiten</button>
                            <button @click="handleDelete(user)" class="btn btn-danger btn-small" :disabled="user.id === 1">Löschen</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Modals -->
        <AddUserModal v-model="isAddModalVisible" />
        <EditUserModal v-if="selectedUser" v-model="isEditModalVisible" :user="selectedUser" />
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '../../stores/user.js';
import AddUserModal from '../../components/AddUserModal.vue';
import EditUserModal from '../../components/EditUserModal.vue';

const userStore = useUserStore();

const isAddModalVisible = ref(false);
const isEditModalVisible = ref(false);
const selectedUser = ref(null);

onMounted(() => {
    userStore.fetchUsers();
});

function openAddModal() {
    isAddModalVisible.value = true;
}

function openEditModal(user) {
    selectedUser.value = user;
    isEditModalVisible.value = true;
}

async function handleDelete(user) {
    if (confirm(`Möchten Sie den Benutzer "${user.full_name}" wirklich löschen?`)) {
        try {
            await userStore.deleteUser(user.id);
            alert('Benutzer erfolgreich gelöscht.');
        } catch (error) {
            alert(`Fehler: ${error.message}`);
        }
    }
}
</script>

<style scoped>
.view-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}
.user-list-container {
    overflow-x: auto;
}
.user-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
}
.user-table th, .user-table td {
    padding: 12px 15px;
    border-bottom: 1px solid #e0e0e0;
}
.user-table th {
    background-color: #f4f6f8;
    font-weight: 600;
}
.user-table tbody tr:hover {
    background-color: #f9f9f9;
}
.status-badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    color: white;
}
.status-badge.active {
    background-color: #28a745;
}
.status-badge.inactive {
    background-color: #6c757d;
}
.actions-cell {
    display: flex;
    gap: 10px;
}
.btn-small {
    padding: 5px 10px;
    font-size: 12px;
}
</style>
