<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="close">
    <div class="modal-content card">
      <h3>Schüler bearbeiten</h3>
      <form v-if="editableStudent" @submit.prevent="submitUpdate">
        <div class="form-group">
          <label>Schüler-ID</label>
          <input :value="editableStudent.id" type="text" class="input" disabled>
        </div>
        <div class="form-group">
          <label>Vollständiger Name</label>
          <input v-model="editableStudent.name" type="text" class="input" required>
        </div>
        <div class="form-group">
          <label>Klasse</label>
          <input v-model="editableStudent.class" type="text" class="input" required>
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
import { useStudentStore } from '../stores/students.js';

const props = defineProps({
  modelValue: Boolean,
  student: Object
});
const emit = defineEmits(['update:modelValue']);

const studentStore = useStudentStore();
const error = ref(null);
const editableStudent = ref(null);

watch(() => props.student, (newStudent) => {
  if (newStudent) {
    editableStudent.value = { ...newStudent };
  }
}, { immediate: true, deep: true });

function close() {
  emit('update:modelValue', false);
}

async function submitUpdate() {
  error.value = null;
  if (!editableStudent.value) return;

  try {
    await studentStore.updateStudent(props.student.id, editableStudent.value);
    close();
  } catch (err) {
    error.value = err.message;
  }
}
</script>

<style scoped>
/* Stile sind identisch zu den anderen Modals */
.modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,.5);display:flex;justify-content:center;align-items:center;z-index:100}.modal-content{width:100%;max-width:500px}.form-group{margin-bottom:15px}.modal-actions{margin-top:20px;display:flex;justify-content:flex-end;gap:10px}.status-error{color:#dc3545;font-size:14px}
</style>