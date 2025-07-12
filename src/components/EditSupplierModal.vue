<template>
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
        <div class="modal-content card">
            <h3>Anbieter bearbeiten</h3>
            <form v-if="editableSupplier" @submit.prevent="submitUpdate">
                <div class="form-group">
                    <label>Name des Anbieters</label>
                    <input v-model="editableSupplier.name" type="text" class="input" required>
                </div>
                <div class="form-group">
                    <label>Ansprechpartner</label>
                    <input v-model="editableSupplier.contact_person" type="text" class="input">
                </div>
                <div class="form-group">
                    <label>E-Mail</label>
                    <input v-model="editableSupplier.email" type="email" class="input">
                </div>
                <div class="form-group">
                    <label>Telefon</label>
                    <input v-model="editableSupplier.phone" type="tel" class="input">
                </div>
                <div class="form-group">
                    <label>Notizen</label>
                    <textarea v-model="editableSupplier.notes" class="input"></textarea>
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
import { useSupplierStore } from '../stores/suppliers.js';

const props = defineProps({
  modelValue: Boolean,
  supplier: Object
});
const emit = defineEmits(['update:modelValue']);

const supplierStore = useSupplierStore();
const error = ref(null);
const editableSupplier = ref(null);

watch(() => props.supplier, (newSupplier) => {
    if (newSupplier) {
        editableSupplier.value = { ...newSupplier };
    }
}, { immediate: true, deep: true });

function close() {
  emit('update:modelValue', false);
}

async function submitUpdate() {
  error.value = null;
  if (!editableSupplier.value) return;

  try {
    await supplierStore.updateSupplier(props.supplier.id, editableSupplier.value);
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
