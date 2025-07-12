import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

export const useStudentStore = defineStore('students', () => {
  const students = ref([])
  const isLoading = ref(false)
  const searchTerm = ref('')

  async function searchStudents() {
    if (!searchTerm.value) {
      students.value = []
      return
    }

    const authStore = useAuthStore()
    isLoading.value = true
    students.value = []

    try {
      const response = await fetch(`http://localhost:3000/api/students/search/${searchTerm.value}`, {
        headers: {
          'Authorization': `Bearer ${authStore.sessionId}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Fehler bei der Schülersuche')
      }

      const data = await response.json()
      students.value = data.students || []

    } catch (error) {
      console.error(error)
      students.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function addStudent(studentData) {
    const authStore = useAuthStore();
    try {
      const response = await fetch('http://localhost:3000/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.sessionId}`
        },
        body: JSON.stringify(studentData)
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Schüler konnte nicht erstellt werden.');
      }
      // Optional: Die Liste aktualisieren, um den neuen Schüler anzuzeigen
      await searchStudents();
      return result;
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Schülers:', error);
      throw error;
    }
  }

  async function deleteStudent(studentId) {
    const authStore = useAuthStore();
    try {
      const response = await fetch(`http://localhost:3000/api/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authStore.sessionId}`
        }
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Schüler konnte nicht gelöscht werden.');
      }
      
      // Schüler aus der lokalen Liste entfernen
      const index = students.value.findIndex(s => s.id === studentId);
      if (index !== -1) {
        students.value.splice(index, 1);
      }
      return true;

    } catch (error) {
      console.error('Fehler beim Löschen des Schülers:', error);
      throw error;
    }
  }

  async function updateStudent(studentId, studentData) {
    const authStore = useAuthStore();
    try {
      const response = await fetch(`http://localhost:3000/api/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.sessionId}`
        },
        body: JSON.stringify(studentData)
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Schülerdaten konnten nicht aktualisiert werden.');
      }
      // Optional: Die Liste aktualisieren, um die Änderungen anzuzeigen
      await searchStudents();
      return result;
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Schülerdaten:', error);
      throw error;
    }
  }

  async function importStudents(file) {
    const authStore = useAuthStore();
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/students/import', {
        method: 'POST',
        headers: {
          // 'Content-Type': 'multipart/form-data' wird vom Browser automatisch gesetzt
          'Authorization': `Bearer ${authStore.sessionId}`
        },
        body: formData
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Import fehlgeschlagen.');
      }
      // Nach dem Import die Liste aktualisieren
      await searchStudents(); 
      return result;
    } catch (error) {
      console.error('Fehler beim Schüler-Import:', error);
      throw error;
    }
  }

  async function uploadStudentPhoto(studentId, photoBlob) {
    const authStore = useAuthStore();
    const formData = new FormData();
    formData.append('photo', photoBlob, `${studentId}.png`);

    try {
      const response = await fetch(`/api/students/${studentId}/photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authStore.sessionId}`
        },
        body: formData
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Foto-Upload fehlgeschlagen.');
      }
      // Update the photo URL for the student in the local list
      const student = students.value.find(s => s.id === studentId);
      if (student) {
        // Add a timestamp to the URL to bypass browser cache
        student.photo_url = `${result.photoUrl}?t=${new Date().getTime()}`;
      }
      return result;
    } catch (error) {
      console.error('Fehler beim Foto-Upload:', error);
      throw error;
    }
  }

  return {
    students,
    isLoading,
    searchTerm,
    searchStudents,
    addStudent,
    deleteStudent,
    updateStudent,
    importStudents,
    uploadStudentPhoto
  }
})