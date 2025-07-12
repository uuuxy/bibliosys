<template>
  <div class="orders-root">
    <div class="orders-header">
      <h2>🛒 Neue Bestellung aufgeben</h2>
    </div>
    <div class="orders-content">
      <div class="orders-col">
        <div class="orders-card">
          <div class="orders-card-body">
            <h3 class="orders-card-title">Aktuelle Bestellliste</h3>
            <div class="orders-form-group">
              <label for="supplier">Lieferant / Händler</label>
              <input type="text" id="supplier" v-model="orderStore.supplier" placeholder="Name des Lieferanten eingeben..." class="orders-input">
            </div>
            <div v-if="orderStore.items.length === 0" class="orders-empty-list">Die Bestellliste ist leer. Suchen Sie nach Büchern, um sie hinzuzufügen.</div>
            <ul v-else class="orders-list">
              <li v-for="(item, index) in orderStore.items" :key="index" class="orders-list-item">
                <span>
                  <strong>{{ item.quantity }}x</strong> {{ item.title }}
                  <em class="orders-list-author"> ({{ item.author }})</em>
                </span>
                <button @click="orderStore.removeItem(index)" class="orders-remove-btn">🗑️</button>
              </li>
            </ul>
            <div class="orders-actions">
              <button 
                @click="submitOrder" 
                :disabled="orderStore.items.length === 0 || orderStore.isLoading" 
                class="orders-submit-btn">
                <span v-if="orderStore.isLoading">Bestellung wird gesendet...</span>
                <span v-else>Bestellung abschicken & Link generieren</span>
              </button>
              <button @click="orderStore.clearOrder()" class="orders-clear-btn">Liste leeren</button>
            </div>
            <p v-if="orderStore.error" class="orders-error">{{ orderStore.error }}</p>
          </div>
        </div>
      </div>
      <div class="orders-col">
        <div class="orders-card">
          <div class="orders-card-body">
            <h3 class="orders-card-title">Bücher zur Bestellung hinzufügen</h3>
            <div class="orders-form-group orders-search-group">
              <input 
                v-model="bookStore.searchTerm" 
                @keyup.enter="bookStore.searchBooks" 
                type="text" 
                placeholder="Titel, Autor oder ISBN suchen..." 
                class="orders-input"
              />
              <button @click="bookStore.searchBooks" class="orders-search-btn">Suchen</button>
            </div>
            <div v-if="bookStore.isLoading" class="orders-info">🔄 Suche läuft...</div>
            <div v-else-if="bookStore.books.length > 0" class="orders-search-list">
              <div v-for="book in bookStore.books" :key="book.id" class="orders-search-list-item">
                <div>
                  <strong>{{ book.title }}</strong>
                  <div class="orders-search-author">{{ book.author }} (ISBN: {{ book.isbn }})</div>
                </div>
                <div class="orders-search-actions">
                  <input type="number" v-model.number="book.quantity" min="1" class="orders-qty-input" />
                  <button @click="addBookToOrder(book)" class="orders-add-btn">➕ Hinzufügen</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Erfolgs-Modal -->
    <div v-if="showSuccessModal" class="orders-modal-overlay" @click.self="closeSuccessModal">
      <div class="orders-modal">
        <div class="orders-modal-header">
          <h5>✅ Bestellung erfolgreich erstellt!</h5>
          <button type="button" class="orders-modal-close" @click="closeSuccessModal">×</button>
        </div>
        <div class="orders-modal-body">
          <p>Bitte senden Sie den folgenden Link an den Händler. Dort kann er die Bestelldetails einsehen und die druckfertigen Barcode-Etiketten abrufen:</p>
          <div class="orders-modal-link-group">
            <input type="text" :value="publicOrderLink" readonly class="orders-modal-link-input">
            <button @click="copyToClipboard" class="orders-modal-link-btn">{{ copyButtonText }}</button>
          </div>
        </div>
        <div class="orders-modal-footer">
          <button @click="closeSuccessModal" class="orders-modal-close-btn">Schließen</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
// KORRIGIERT: Pfade verwenden jetzt den '@'-Alias
import { useBookStore } from '@/stores/books';
import { useOrderStore } from '@/stores/orderStore';

const bookStore = useBookStore();
const orderStore = useOrderStore();

const showSuccessModal = ref(false);
const lastOrderResult = ref(null);
const copyButtonText = ref('Kopieren');

const publicOrderLink = computed(() => {
    if (!lastOrderResult.value || !lastOrderResult.value.publicToken) {
        return '';
    }
    return `${window.location.origin}/order/${lastOrderResult.value.publicToken}`;
});

function addBookToOrder(book) {
  const quantity = book.quantity || 1;
  orderStore.addItem(book, quantity);
  book.quantity = 1;
}

async function submitOrder() {
    try {
        const result = await orderStore.submitOrder();
        if (result) {
            lastOrderResult.value = result;
            showSuccessModal.value = true;
            bookStore.books = [];
            bookStore.searchTerm = '';
        }
    } catch (err) {
        console.error("Fehler beim Abschicken der Bestellung in der View:", err);
    }
}

function copyToClipboard() {
    navigator.clipboard.writeText(publicOrderLink.value).then(() => {
        copyButtonText.value = 'Kopiert!';
        setTimeout(() => {
            copyButtonText.value = 'Kopieren';
        }, 2000);
    });
}

function closeSuccessModal() {
    showSuccessModal.value = false;
    lastOrderResult.value = null;
}
</script>

<style scoped>
.orders-root {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2.5rem 1rem 1.5rem 1rem;
}
.orders-header {
  margin-bottom: 2.2rem;
}
.orders-content {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
}
.orders-col {
  flex: 1 1 350px;
  min-width: 320px;
  max-width: 600px;
  display: flex;
}
.orders-card {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.07);
  padding: 1.5rem 1.2rem 1.2rem 1.2rem;
  width: 100%;
  display: flex;
  flex-direction: column;
}
.orders-card-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1.1rem;
}
.orders-card-body {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}
.orders-form-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-bottom: 1rem;
}
.orders-input {
  padding: 0.6rem 0.8rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 1rem;
  background: #f9f9f9;
  transition: border 0.15s;
}
.orders-input:focus {
  border-color: #007bff;
  outline: none;
}
.orders-empty-list {
  background: #f8f9fa;
  color: #888;
  border-radius: 6px;
  padding: 1rem;
  text-align: center;
  font-size: 1rem;
}
.orders-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem 0;
}
.orders-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.7rem 0.5rem;
  border-bottom: 1px solid #eee;
}
.orders-list-item:last-child {
  border-bottom: none;
}
.orders-list-author {
  color: #6c757d;
  font-size: 0.97em;
}
.orders-remove-btn {
  background: #f8d7da;
  color: #dc3545;
  border: none;
  border-radius: 5px;
  padding: 6px 14px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.14s;
}
.orders-remove-btn:hover {
  background: #dc3545;
  color: #fff;
}
.orders-actions {
  display: flex;
  gap: 0.7rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}
.orders-submit-btn {
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 10px 18px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.orders-submit-btn:disabled {
  background: #b6d4fe;
  color: #fff;
  cursor: not-allowed;
}
.orders-submit-btn:hover:not(:disabled) {
  background: #0056b3;
}
.orders-clear-btn {
  background: #f6faff;
  color: #007bff;
  border: 1px solid #b6d4fe;
  border-radius: 6px;
  padding: 10px 18px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border 0.15s;
}
.orders-clear-btn:hover {
  background: #e3f2fd;
  color: #0056b3;
}
.orders-error {
  color: #dc3545;
  margin-top: 0.7rem;
  font-size: 1rem;
}
.orders-search-group {
  flex-direction: row;
  gap: 0.7rem;
  align-items: center;
}
.orders-search-btn {
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.orders-search-btn:hover {
  background: #0056b3;
}
.orders-info {
  background: #e3f2fd;
  color: #0d47a1;
  border-radius: 6px;
  padding: 1rem;
  text-align: center;
  font-size: 1rem;
}
.orders-search-list {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}
.orders-search-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.7rem 0.5rem;
  border-bottom: 1px solid #eee;
  background: #f9f9f9;
  border-radius: 6px;
}
.orders-search-author {
  color: #6c757d;
  font-size: 0.97em;
}
.orders-search-actions {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}
.orders-qty-input {
  width: 70px;
  padding: 0.4rem 0.6rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 1rem;
  background: #fff;
}
.orders-add-btn {
  background: #28a745;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.orders-add-btn:hover {
  background: #218838;
}
/* Modal Styles */
.orders-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.orders-modal {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 2px 16px 0 rgba(0,0,0,0.13);
  padding: 2rem 2rem 1.5rem 2rem;
  max-width: 420px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}
.orders-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.orders-modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #888;
  cursor: pointer;
  padding: 0 0.5rem;
  line-height: 1;
}
.orders-modal-close:hover {
  color: #dc3545;
}
.orders-modal-body {
  font-size: 1rem;
}
.orders-modal-link-group {
  display: flex;
  gap: 0.7rem;
  align-items: center;
  margin-top: 1rem;
}
.orders-modal-link-input {
  flex: 1 1 auto;
  padding: 0.6rem 0.8rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 1rem;
  background: #f9f9f9;
}
.orders-modal-link-btn {
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.orders-modal-link-btn:hover {
  background: #0056b3;
}
.orders-modal-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.2rem;
}
.orders-modal-close-btn {
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.7rem 1.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.orders-modal-close-btn:hover {
  background: #0056b3;
}
</style>
