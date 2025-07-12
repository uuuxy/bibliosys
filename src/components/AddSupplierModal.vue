<template>
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
        <div class="modal-content card">
            <h3>Neuen Anbieter hinzufügen</h3>
            <form @submit.prevent="submitSupplier">
                <div class="form-group">
                    <label>Name des Anbieters</label>
                    <input v-model="newSupplier.name" type="text" class="input" required>
                </div>
                <div class="form-group">
                    <label>Ansprechpartner</label>
                    <input v-model="newSupplier.contact_person" type="text" class="input">
                </div>
                <div class="form-group">
                    <label>E-Mail</label>
                    <input v-model="newSupplier.email" type="email" class="input">
                </div>
                <div class="form-group">
                    <label>Telefon</label>
                    <input v-model="newSupplier.phone" type="tel" class="input">
                </div>
                <div class="form-group">
                    <label>Notizen</label>
                    <textarea v-model="newSupplier.notes" class="input"></textarea>
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
import { useSupplierStore } from '../stores/suppliers.js';

defineProps({ modelValue: Boolean });
const emit = defineEmits(['update:modelValue']);

const supplierStore = useSupplierStore();
const error = ref(null);

const newSupplier = ref({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    notes: ''
});

function close() {
    emit('update:modelValue', false);
}

async function submitSupplier() {
    error.value = null;
    try {
        await supplierStore.addSupplier(newSupplier.value);
        close();
    } catch (err) {
        error.value = err.message;
    }
}
</script>

<style scoped>
.modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,.5);display:flex;justify-content:center;align-items:center;z-index:100}
.modal-content{width:100%;max-width:500px}
.form-group{margin-bottom:15px}
.modal-actions{margin-top:20px;display:flex;justify-content:flex-end;gap:10px}
.status-error{color:#dc3545;font-size:14px}
</style>
