import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth';

export const useStudentDetailStore = defineStore('studentDetail', () => {
    const student = ref(null);
    const isLoading = ref(false);
    const authStore = useAuthStore();

    async function fetchStudentDetails(studentId) {
        isLoading.value = true;
        student.value = null;
        try {
            const response = await fetch(`/api/students/${studentId}`, {
                headers: { 'Authorization': `Bearer ${authStore.sessionId}` }
            });
            const data = await response.json();
            if (data.success) {
                student.value = data.student;
            } else {
                throw new Error(data.error || 'Schülerdetails konnten nicht geladen werden.');
            }
        } catch (error) {
            console.error("Fehler beim Laden der Schülerdetails:", error);
        } finally {
            isLoading.value = false;
        }
    }

    return {
        student,
        isLoading,
        fetchStudentDetails
    };
});
