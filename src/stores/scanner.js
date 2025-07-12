import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

export const useScannerStore = defineStore('scanner', () => {
    // === STATE ===
    const activeStudent = ref(null);
    const lastTransaction = ref(null);
    const error = ref(null);
    const isLoading = ref(false);

    const authStore = useAuthStore();

    // === ACTIONS ===

    // Setzt die aktuelle Scanner-Sitzung zurück
    function clearSession() {
        activeStudent.value = null;
        lastTransaction.value = null;
        error.value = null;
    }

    // Verarbeitet einen gescannten Code
    async function processScan(code) {
        isLoading.value = true;
        error.value = null;
        lastTransaction.value = null;

        try {
            // Wenn kein Schüler aktiv ist, versuchen wir, den Code als Schüler-ID zu interpretieren.
            if (!activeStudent.value) {
                const res = await fetch(`http://localhost:3000/api/students/${code}`, {
                    headers: { 'Authorization': `Bearer ${authStore.sessionId}` }
                });
                const data = await res.json();
                if (!data.success) throw new Error('Kein Schüler mit dieser ID gefunden.');
                
                activeStudent.value = data.student;
                lastTransaction.value = `Schüler ${data.student.fullName} ist jetzt aktiv. Bitte Buch scannen.`;

            } else { // Wenn bereits ein Schüler aktiv ist, interpretieren wir den Code als Buch-Barcode.
                const res = await fetch(`http://localhost:3000/api/books/barcode/${code}`, {
                     headers: { 'Authorization': `Bearer ${authStore.sessionId}` }
                });
                const data = await res.json();
                if (!data.success) throw new Error('Kein Buch mit diesem Barcode gefunden.');

                const book = data.book;
                
                // Logik: Ist das Buch verfügbar -> Ausleihen. Ist es vom aktiven Schüler geliehen -> Zurückgeben.
                if (book.status === 'verfügbar') {
                    const lendRes = await fetch('http://localhost:3000/api/lending/lend', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authStore.sessionId}`
                        },
                        body: JSON.stringify({ bookBarcode: book.barcode, studentId: activeStudent.value.id })
                    });
                    const lendData = await lendRes.json();
                    if (!lendData.success) throw new Error(lendData.error);
                    lastTransaction.value = lendData.message;

                } else if (book.borrower_id === activeStudent.value.id) {
                     const returnRes = await fetch('http://localhost:3000/api/lending/return', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authStore.sessionId}`
                        },
                        body: JSON.stringify({ bookBarcode: book.barcode })
                    });
                    const returnData = await returnRes.json();
                    if (!returnData.success) throw new Error(returnData.error);
                    lastTransaction.value = returnData.message;
                    
                } else {
                    throw new Error(`Buch ist an jemand anderen ausgeliehen (${book.borrower_name}).`);
                }
            }
        } catch (err) {
            error.value = err.message;
        } finally {
            isLoading.value = false;
        }
    }

    return { activeStudent, lastTransaction, error, isLoading, processScan, clearSession };
});