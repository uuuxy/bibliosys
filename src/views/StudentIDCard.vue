<template>
    <div class="id-card">
        <div class="card-header">
            <img src="https://placehold.co/100x40/007bff/ffffff?text=BiblioSys" alt="Schul-Logo" class="school-logo">
            <h3>Schülerausweis</h3>
        </div>
        <!-- Die Richtung des Haupt-Layouts wird dynamisch gesteuert -->
        <div class="card-body" :style="{ flexDirection: layout.photoPosition === 'right' ? 'row-reverse' : 'row' }">
            <div class="student-photo">
                <img v-if="student.photo_url" :src="student.photo_url" :alt="student.name">
                <div v-else class="photo-placeholder">👤</div>
            </div>
            <div class="student-details">
                <!-- Die Felder werden nur angezeigt, wenn sie im Layout als 'visible' markiert sind -->
                <div v-for="field in visibleFields" :key="field.key" class="detail-item">
                    <label>{{ field.label }}</label>
                    <span>{{ student[field.key] }}</span>
                </div>
            </div>
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
    layout: { type: Object, required: true }
});

// Berechnete Eigenschaft, die nur die sichtbaren Felder zurückgibt
const visibleFields = computed(() => {
    // Sicherheitsprüfung, falls layout oder fields nicht definiert sind
    if (!props.layout || !props.layout.fields) {
        return [];
    }
    return props.layout.fields.filter(f => f.visible);
});
</script>

<style scoped>
.id-card { width: 320px; height: 200px; border: 1px solid #ccc; border-radius: 12px; background-color: #fff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; flex-direction: column; box-shadow: 0 4px 8px rgba(0,0,0,0.1); color: #333; }
.card-header { display: flex; justify-content: space-between; align-items: center; padding: 10px; background-color: #007bff; color: white; border-radius: 12px 12px 0 0; }
.card-header h3 { margin: 0; font-size: 16px; }
.school-logo { height: 25px; width: auto; }
.card-body { display: flex; padding: 15px; gap: 15px; flex-grow: 1; }
.student-photo { width: 90px; height: 110px; border: 2px solid #eee; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.student-photo img { width: 100%; height: 100%; object-fit: cover; }
.photo-placeholder { font-size: 60px; color: #ccc; }
.student-details { display: flex; flex-direction: column; justify-content: center; gap: 8px; width: 100%; }
.detail-item { font-size: 12px; }
.detail-item label { display: block; font-weight: 600; color: #555; font-size: 10px; }
.card-footer { text-align: center; font-size: 10px; padding: 8px; background-color: #f8f9fa; border-top: 1px solid #eee; border-radius: 0 0 12px 12px; }
</style>
