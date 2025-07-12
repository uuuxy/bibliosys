<template>
  <div class="students-view">
    <div class="view-header">
        <h2>👥 Schüler verwalten</h2>
        <div class="header-actions">
            <!-- NEUER BUTTON -->
            <button @click="isImportModalVisible = true" class="btn">
                ⬆️ Schüler importieren
            </button>
            <button @click="isAddModalVisible = true" class="btn btn-primary">
                ➕ Schüler hinzufügen
            </button>
        </div>
    </div>
    
    <!-- ... (Suchleiste und Grid bleiben unverändert) ... -->
    <div class="search-bar">
      <input v-model="studentStore.searchTerm" @keyup.enter="studentStore.searchStudents" type="text" placeholder="Name oder ID..." class="input"/>
      <button @click="studentStore.searchStudents" class="btn btn-primary">Suchen</button>
    </div>

    <div v-if="studentStore.isLoading" class="loading"><p>🔄 Suche läuft...</p></div>
    <div v-else-if="studentStore.students.length > 0" class="student-grid">
      <StudentCard 
        v-for="student in studentStore.students" 
        :key="student.id" 
        :student="student"
        @edit="openEditModal"
        @take-photo="openPhotoModal"
        @show-details="openDetailModal"
      />
    </div>
    <div v-else-if="studentStore.searchTerm" class="no-results"><p>Keine Schüler gefunden für "{{ studentStore.searchTerm }}".</p></div>

    <!-- Modals -->
    <AddStudentModal v-model="isAddModalVisible" />
    <EditStudentModal v-if="selectedStudent" v-model="isEditModalVisible" :student="selectedStudent" />
    <!-- NEUES MODAL -->
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
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-actions {
    display: flex;
    gap: 10px;
}
.search-bar {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}
.student-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}
.loading, .no-results {
  margin-top: 20px;
  text-align: center;
  color: #6c757d;
}
</style>
