import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth';

export const useBookStore = defineStore('books', () => {
    const books = ref([]);
    const isLoading = ref(false);
    const searchTerm = ref('');
    const categories = ref([]);
    const selectedCategoryId = ref(null);
    const selectedBarcodes = ref([]); // NEU: Für die Auswahl

    const authStore = useAuthStore();

    // Helper für authentifizierte Anfragen
    async function fetchWithAuth(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authStore.sessionId}`,
            ...options.headers,
        };
        const response = await fetch(url, { ...options, headers });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Ein Fehler ist aufgetreten.');
        }
        return data;
    }

    async function fetchCategories() {
        try {
            const data = await fetchWithAuth('/api/categories');
            categories.value = data.categories;
        } catch (error) { console.error("Fehler beim Laden der Kategorien:", error); }
    }

    async function searchBooks() {
        isLoading.value = true;
        try {
            let url = `/api/books/search/${encodeURIComponent(searchTerm.value || ' ')}`;
            const params = new URLSearchParams();
            if (selectedCategoryId.value) {
                params.append('categoryId', selectedCategoryId.value);
            }
            if (params.toString()) {
                url += `?${params.toString()}`;
            }
            const data = await fetchWithAuth(url);
            books.value = data.books || [];
        } catch (error) {
            console.error("Fehler bei der Buchsuche:", error);
            books.value = [];
        } finally {
            isLoading.value = false;
        }
    }

    // ... (addBook, updateBook, deleteBook, fetchBookCover bleiben hier)

    // NEUE FUNKTIONEN für Bulk-Operationen
    function toggleSelection(barcode) {
        const index = selectedBarcodes.value.indexOf(barcode);
        if (index > -1) {
            selectedBarcodes.value.splice(index, 1);
        } else {
            selectedBarcodes.value.push(barcode);
        }
    }

    function clearSelection() {
        selectedBarcodes.value = [];
    }
    
    async function bulkDeleteSelectedBooks() {
        if (selectedBarcodes.value.length === 0) return;
        
        await fetchWithAuth('/api/books/batch', {
            method: 'DELETE',
            body: JSON.stringify({ barcodes: selectedBarcodes.value })
        });
        
        // Nach dem Löschen die Ansicht aktualisieren
        clearSelection();
        await searchBooks();
    }


    return {
        books, isLoading, searchTerm, categories, selectedCategoryId, selectedBarcodes,
        searchBooks, fetchCategories, toggleSelection, clearSelection, bulkDeleteSelectedBooks,
        // ... (andere Aktionen wie addBook etc. hier zurückgeben)
    };
});
