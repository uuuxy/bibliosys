<template>
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
        <div class="modal-content card">
            <h3>Neuen Benutzer hinzufügen</h3>
            <form @submit.prevent="submitUser">
                <div class="form-group">
                    <label>Vollständiger Name</label>
                    <input v-model="newUser.full_name" type="text" class="input" required>
                </div>
                <div class="form-group">
                    <label>Benutzername</label>
                    <input v-model="newUser.username" type="text" class="input" required>
                </div>
                <div class="form-group">
                    <label>Passwort</label>
                    <input v-model="newUser.password" type="password" class="input" required>
                </div>
                <div class="form-group">
                    <label>Rolle</label>
                    <select v-model="newUser.role" class="input" required>
                        <option value="librarian">Bibliothekar</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <p v-if="error" class="status-error">{{ error }}</p>
                <div class="modal-actions">
                    <button type="button" @click="close" class="btn">Abbrechen</button>
                    <button type="submit" class="btn btn-primary">Speichern</button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useUserStore } from '../stores/user.js';

defineProps({ modelValue: Boolean });
const emit = defineEmits(['update:modelValue']);

const userStore = useUserStore();
const error = ref(null);

const newUser = ref({
    full_name: '',
    username: '',
    password: '',
    role: 'librarian',
});

function close() {
    emit('update:modelValue', false);
}

async function submitUser() {
    error.value = null;
    try {
        await userStore.addUser(newUser.value);
        close();
    } catch (err) {
        error.value = err.message;
    }
}
</script>

<style scoped>
.modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,.5);display:flex;justify-content:center;align-items:center;z-index:100}.modal-content{width:100%;max-width:500px}.form-group{margin-bottom:15px}.modal-actions{margin-top:20px;display:flex;justify-content:flex-end;gap:10px}.status-error{color:#dc3545;font-size:14px}
</style>
