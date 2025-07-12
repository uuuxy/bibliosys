<template>
  <div class="student-card card">
    <!-- NEU: Foto-Anzeige -->
    <div class="student-photo-container">
        <img v-if="student.photo_url" :src="student.photo_url" :alt="student.name" class="student-photo">
        <div v-else class="photo-placeholder">👤</div>
    </div>

    <h4>{{ student.name }}</h4>
    <p><strong>ID:</strong> {{ student.id }}</p>
    <p><strong>Klasse:</strong> {{ student.class }}</p>
    <div class="student-actions">
      <button @click="$emit('show-details', student)" class="btn btn-primary">Details</button>
      <button @click="$emit('take-photo', student)" class="btn btn-secondary">📷 Foto</button>
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
  text-align: center;
}
.student-photo-container {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    margin: 0 auto 15px auto;
    background-color: #e9ecef;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}
.student-photo {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.photo-placeholder {
    font-size: 40px;
    color: #adb5bd;
}
p { font-size: 14px; margin-bottom: 5px; }
.student-actions { margin-top: 15px; display: flex; justify-content: center; gap: 10px; }
</style>
