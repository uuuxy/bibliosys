<template>
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
        <div class="modal-content card">
            <h3>Benutzer bearbeiten</h3>
            <form v-if="editableUser" @submit.prevent="submitUpdate">
                <div class="form-group">
                    <label>Vollständiger Name</label>
                    <input v-model="editableUser.full_name" type="text" class="input" required>
                </div>
                <div class="form-group">
                    <label>Benutzername</label>
                    <input :value="editableUser.username" type="text" class="input" disabled>
                </div>
                <div class="form-group">
                    <label>Rolle</label>
                    <select v-model="editableUser.role" class="input" required>
                        <option value="librarian">Bibliothekar</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                 <div class="form-group">
                    <label>Status</label>
                    <select v-model="editableUser.is_active" class="input" required>
                        <option :value="1">Aktiv</option>
                        <option :value="0">Inaktiv</option>
                    </select>
                </div>
                <p v-if="error" class="status-error">{{ error }}</p>
                <div class="modal-actions">
                    <button type="button" @click="close" class="btn">Abbrechen</button>
                    <button type="submit" class="btn btn-primary">Änderungen speichern</button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useUserStore } from '../stores/user.js';

const props = defineProps({
  modelValue: Boolean,
  user: Object
});
const emit = defineEmits(['update:modelValue']);

const userStore = useUserStore();
const error = ref(null);
const editableUser = ref(null);

watch(() => props.user, (newUser) => {
    if (newUser) {
        editableUser.value = { ...newUser };
    }
}, { immediate: true, deep: true });

function close() {
  emit('update:modelValue', false);
}

async function submitUpdate() {
  error.value = null;
  if (!editableUser.value) return;

  try {
    // Nur die veränderbaren Felder senden
    const { full_name, role, is_active } = editableUser.value;
    await userStore.updateUser(props.user.id, { full_name, role, is_active });
    close();
  } catch (err) {
    error.value = err.message;
  }
}
</script>

<style scoped>
.modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,.5);display:flex;justify-content:center;align-items:center;z-index:100}.modal-content{width:100%;max-width:500px}.form-group{margin-bottom:15px}.modal-actions{margin-top:20px;display:flex;justify-content:flex-end;gap:10px}.status-error{color:#dc3545;font-size:14px}
</style>
