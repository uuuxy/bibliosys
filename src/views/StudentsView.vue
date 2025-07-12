<template>
  <div class="container py-3">
    <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
      <h2 class="mb-0">👥 Schüler verwalten</h2>
      <div class="d-flex gap-2">
        <button @click="isImportModalVisible = true" class="btn btn-outline-secondary">⬆️ Import</button>
        <button @click="isAddModalVisible = true" class="btn btn-success">➕ Schüler hinzufügen</button>
      </div>
    </div>
    <div class="row mb-3 g-2 align-items-center">
      <div class="col-12 col-md-6">
        <input v-model="studentStore.searchTerm" @keyup.enter="studentStore.searchStudents" type="text" placeholder="Name oder ID..." class="form-control"/>
      </div>
      <div class="col-auto">
        <button @click="studentStore.searchStudents" class="btn btn-primary">Suchen</button>
      </div>
    </div>
    <div v-if="studentStore.isLoading" class="alert alert-info text-center">🔄 Suche läuft...</div>
    <div v-else-if="studentStore.students.length > 0" class="row g-3">
      <div class="col-12 col-sm-6 col-md-4 col-lg-3" v-for="student in studentStore.students" :key="student.id">
        <StudentCard :student="student" @edit="openEditModal" @take-photo="openPhotoModal" @show-details="openDetailModal" />
      </div>
    </div>
    <div v-else-if="studentStore.searchTerm" class="alert alert-warning text-center">Keine Schüler gefunden für "{{ studentStore.searchTerm }}".</div>
    <AddStudentModal v-model="isAddModalVisible" />
    <EditStudentModal v-if="selectedStudent" v-model="isEditModalVisible" :student="selectedStudent" />
    <StudentImportModal v-model="isImportModalVisible" />
    <StudentPhotoModal v-if="selectedStudent" v-model="isPhotoModalVisible" :student="selectedStudent" />
    <StudentDetailModal v-model="isDetailModalVisible" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useStudentStore } from '../stores/students.js';
import StudentCard from '../components/StudentCard.vue';
import AddStudentModal from '../components/AddStudentModal.vue';
import EditStudentModal from '../components/EditStudentModal.vue';
import StudentImportModal from '../components/StudentImportModal.vue';
import StudentPhotoModal from '../components/StudentPhotoModal.vue';
import { useStudentDetailStore } from '../stores/studentDetail.js';
import StudentDetailModal from '../components/StudentDetailModal.vue';

const studentStore = useStudentStore();
const detailStore = useStudentDetailStore();
const isAddModalVisible = ref(false);
const isEditModalVisible = ref(false);
const isImportModalVisible = ref(false);
const isPhotoModalVisible = ref(false);
const isDetailModalVisible = ref(false);
const selectedStudent = ref(null);

function openEditModal(student) {
  selectedStudent.value = student;
  isEditModalVisible.value = true;
}

function openPhotoModal(student) {
  selectedStudent.value = student;
  isPhotoModalVisible.value = true;
}

function openDetailModal(student) {
  detailStore.fetchStudentDetails(student.id);
  isDetailModalVisible.value = true;
}
</script>

<style scoped>
/* Bootstrap übernimmt das Layout */
</style>
