import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth';

export const useLendingStore = defineStore('lending', () => {
    const searchResult = ref(null);
    const resultType = ref(''); // 'student_details', 'student_list', 'book_details'
    const isLoading = ref(false);
    const searchTerm = ref('');
    const authStore = useAuthStore();

    async function performSearch() {
        if (!searchTerm.value) return;
        
        isLoading.value = true;
        searchResult.value = null;
        resultType.value = '';

        try {
            const response = await fetch(`/api/universal-search/${encodeURIComponent(searchTerm.value)}`, {
                headers: { 'Authorization': `Bearer ${authStore.sessionId}` }
            });
            const data = await response.json();

            if (data.success) {
                searchResult.value = data.data;
                resultType.value = data.type;
            } else {
                throw new Error(data.error || 'Suche fehlgeschlagen.');
            }
        } catch (error) {
            console.error("Fehler bei der Universal-Suche:", error);
            searchResult.value = { error: error.message };
            resultType.value = 'error';
        } finally {
            isLoading.value = false;
        }
    }
    
    // Funktion, um die Details eines Schülers aus einer Liste zu laden
    function selectStudentFromList(student) {
        searchResult.value = student;
        resultType.value = 'student_details';
    }

    return {
        searchResult,
        resultType,
        isLoading,
        searchTerm,
        performSearch,
        selectStudentFromList
    };
});
