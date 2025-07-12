import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth';

export const useIdCardStore = defineStore('idCard', () => {
    const classes = ref([]);
    const studentsOfClass = ref([]);
    const isLoading = ref(false);
    const authStore = useAuthStore();

    async function fetchClasses() {
        try {
            const response = await fetch('/api/classes', {
                headers: { 'Authorization': `Bearer ${authStore.sessionId}` }
            });
            const data = await response.json();
            if (data.success) {
                classes.value = data.classes;
            }
        } catch (error) {
            console.error("Fehler beim Laden der Klassen:", error);
        }
    }

    async function fetchStudentsByClass(className) {
        if (!className) {
            studentsOfClass.value = [];
            return;
        }
        isLoading.value = true;
        try {
            const response = await fetch(`/api/students/class/${className}`, {
                headers: { 'Authorization': `Bearer ${authStore.sessionId}` }
            });
            const data = await response.json();
            if (data.success) {
                studentsOfClass.value = data.students;
            }
        } catch (error) {
            console.error("Fehler beim Laden der Schüler:", error);
            studentsOfClass.value = [];
        } finally {
            isLoading.value = false;
        }
    }

    return {
        classes,
        studentsOfClass,
        isLoading,
        fetchClasses,
        fetchStudentsByClass
    };
});
