
<template>
  <div class="id-card">
    <div class="card-header">
      <img src="https://placehold.co/100x40/007bff/ffffff?text=BiblioSys" alt="Schul-Logo" class="school-logo">
      <h3>Schülerausweis</h3>
    </div>
    <div class="card-body" :class="{'photo-right': layout && layout.photoPosition === 'right'}">
      <template v-if="layout && layout.photoPosition === 'right'">
        <div class="student-details">
          <template v-for="field in visibleFields" :key="field.key">
            <div class="detail-item">
              <label>{{ field.label }}</label>
              <span>{{ student[field.key] }}</span>
            </div>
          </template>
        </div>
        <div class="student-photo">
          <img v-if="student.photo_url" :src="student.photo_url" :alt="student.name">
          <div v-else class="photo-placeholder">👤</div>
        </div>
      </template>
      <template v-else>
        <div class="student-photo">
          <img v-if="student.photo_url" :src="student.photo_url" :alt="student.name">
          <div v-else class="photo-placeholder">👤</div>
        </div>
        <div class="student-details">
          <template v-if="layout">
            <template v-for="field in visibleFields" :key="field.key">
              <div class="detail-item">
                <label>{{ field.label }}</label>
                <span>{{ student[field.key] }}</span>
              </div>
            </template>
          </template>
          <template v-else>
            <div class="detail-item">
              <label>Name</label>
              <span>{{ student.name }}</span>
            </div>
            <div class="detail-item">
              <label>Klasse</label>
              <span>{{ student.class }}</span>
            </div>
            <div class="detail-item">
              <label>Schüler-ID</label>
              <span>{{ student.id }}</span>
            </div>
          </template>
        </div>
      </template>
    </div>
    <div class="card-footer">
      <p>Gültig für das aktuelle Schuljahr</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
const props = defineProps({
  student: { type: Object, required: true },
  layout: { type: Object, required: false, default: null }
});

const visibleFields = computed(() => {
  if (!props.layout || !props.layout.fields) {
    // Fallback falls kein Layout übergeben wurde
    return [
      { key: 'name', label: 'Name', visible: true },
      { key: 'class', label: 'Klasse', visible: true },
      { key: 'id', label: 'Schüler-ID', visible: true }
    ];
  }
  return props.layout.fields.filter(f => f.visible);
});
</script>

<style scoped>
.id-card {
    width: 320px;
    height: 200px;
    border: 1px solid #ccc;
    border-radius: 12px;
    background-color: #fff;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    color: #333;
}
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background-color: #007bff;
    color: white;
    border-radius: 12px 12px 0 0;
}
.card-header h3 {
    margin: 0;
    font-size: 16px;
}
.school-logo {
    height: 25px;
    width: auto;
}
.card-body {
    display: flex;
    padding: 15px;
    gap: 15px;
    flex-grow: 1;
}
.photo-right {
    flex-direction: row-reverse;
}
.student-photo {
    width: 90px;
    height: 110px;
    border: 2px solid #eee;
    border-radius: 8px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}
.student-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.photo-placeholder {
    font-size: 60px;
    color: #ccc;
}
.student-details {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
    width: 100%;
}
.detail-item {
    font-size: 12px;
}
.detail-item label {
    display: block;
    font-weight: 600;
    color: #555;
    font-size: 10px;
}
.card-footer {
    text-align: center;
    font-size: 10px;
    padding: 8px;
    background-color: #f8f9fa;
    border-top: 1px solid #eee;
    border-radius: 0 0 12px 12px;
}
</style>
