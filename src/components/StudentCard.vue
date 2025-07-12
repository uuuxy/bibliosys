<template>
  <div class="student-card">
    <div class="student-photo-area">
      <img v-if="student.photo_url" :src="student.photo_url" :alt="student.name" class="student-photo" />
      <div v-else class="photo-placeholder">👤</div>
    </div>
    <div class="student-card-body">
      <div class="student-name">{{ student.name }}</div>
      <div class="student-id">ID: {{ student.id }}</div>
      <div class="student-class">Klasse: {{ student.class }}</div>
      <div class="student-actions">
        <button @click="$emit('show-details', student)" class="action-btn details">Details</button>
        <button @click="$emit('take-photo', student)" class="action-btn photo">📷 Foto</button>
        <button @click="$emit('edit', student)" class="action-btn edit">Bearbeiten</button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  student: { type: Object, required: true }
});
const emit = defineEmits(['edit', 'take-photo']);
</script>

<style scoped>
.student-card {
  background: #fff;
  border-radius: 0.7rem;
  box-shadow: 0 2px 10px 0 rgba(0,0,0,0.06);
  padding: 1.2rem 1rem 1rem 1rem;
  margin-bottom: 1.2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.7rem;
  transition: box-shadow 0.14s, transform 0.14s;
}
.student-photo-area {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f8fb;
  border-radius: 50%;
  width: 90px;
  height: 90px;
  margin-bottom: 0.7rem;
}
.student-photo {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 50%;
  border: 2px solid #e9ecef;
}
.photo-placeholder {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  color: #adb5bd;
  background: #e9ecef;
  border-radius: 50%;
}
.student-card-body {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}
.student-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.1rem;
}
.student-id, .student-class {
  font-size: 0.97rem;
  color: #444;
}
.student-actions {
  display: flex;
  gap: 0.7rem;
  margin-top: 0.5rem;
}
.action-btn {
  background: #f6faff;
  color: #007bff;
  border: 1px solid #b6d4fe;
  border-radius: 5px;
  padding: 6px 14px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.14s, color 0.14s, border 0.14s;
}
.action-btn.details:hover {
  background: #e3f2fd;
  color: #0056b3;
}
.action-btn.photo:hover {
  background: #e3f2fd;
  color: #0056b3;
}
.action-btn.edit {
  color: #495057;
  border-color: #adb5bd;
}
.action-btn.edit:hover {
  background: #e9ecef;
  color: #222;
  border-color: #007bff;
}
</style>
