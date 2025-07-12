<template>
  <div class="orders-view">
    <div class="view-header">
      <h2>🛒 Neue Bestellung aufgeben</h2>
    </div>

    <!-- Abschnitt 1: Warenkorb und Lieferant -->
    <div class="card order-cart">
      <h3>Aktuelle Bestellliste</h3>
      <div class="form-group">
        <label for="supplier">Lieferant / Händler</label>
        <input type="text" id="supplier" class="input" v-model="orderStore.supplier" placeholder="Name des Lieferanten eingeben...">
      </div>
      
      <div v-if="orderStore.items.length === 0" class="empty-cart">
        <p>Die Bestellliste ist leer. Suchen Sie nach Büchern, um sie hinzuzufügen.</p>
      </div>

      <ul v-else class="item-list">
        <li v-for="(item, index) in orderStore.items" :key="index">
          <span>
            <strong>{{ item.quantity }}x</strong> {{ item.title }}
            <em class="author-label"> ({{ item.author }})</em>
          </span>
          <button @click="orderStore.removeItem(index)" class="btn-icon-danger">
            🗑️
          </button>
        </li>
      </ul>

      <div class="cart-actions">
        <button 
          @click="submitOrder" 
          :disabled="orderStore.items.length === 0 || orderStore.isLoading" 
          class="btn btn-primary">
          <span v-if="orderStore.isLoading">Bestellung wird gesendet...</span>
          <span v-else>Bestellung abschicken & Link generieren</span>
        </button>
        <button @click="orderStore.clearOrder()" class="btn">Liste leeren</button>
      </div>
       <p v-if="orderStore.error" class="status-error">{{ orderStore.error }}</p>
    </div>

    <!-- Abschnitt 2: Buchsuche -->
    <div class="card book-search-section">
        <h3>Bücher zur Bestellung hinzufügen</h3>
        <div class="search-bar">
            <input 
                v-model="bookStore.searchTerm" 
                @keyup.enter="bookStore.searchBooks" 
                type="text" 
                placeholder="Titel, Autor oder ISBN suchen..." 
                class="input"
            />
            <button @click="bookStore.searchBooks" class="btn">Suchen</button>
        </div>

        <div v-if="bookStore.isLoading" class="loading"><p>🔄 Suche läuft...</p></div>
        <div v-else-if="bookStore.books.length > 0" class="search-results">
            <div v-for="book in bookStore.books" :key="book.id" class="search-result-item">
                <div class="book-info">
                    <strong>{{ book.title }}</strong>
                    <p>{{ book.author }} (ISBN: {{ book.isbn }})</p>
                </div>
                <div class="add-action">
                    <input type="number" v-model.number="book.quantity" min="1" class="input quantity-input">
                    <button @click="addBookToOrder(book)" class="btn btn-secondary">➕ Hinzufügen</button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Erfolgs-Modal -->
    <div v-if="showSuccessModal" class="modal-overlay" @click.self="closeSuccessModal">
        <div class="modal-content card">
            <h3>✅ Bestellung erfolgreich erstellt!</h3>
            <p>Bitte senden Sie den folgenden Link an den Händler. Dort kann er die Bestelldetails einsehen und die druckfertigen Barcode-Etiketten abrufen:</p>
            
            <div class="link-container">
                <input type="text" :value="publicOrderLink" readonly class="input link-input">
                <button @click="copyToClipboard" class="btn btn-secondary">{{ copyButtonText }}</button>
            </div>

            <div class="modal-actions">
                <button @click="closeSuccessModal" class="btn btn-primary">Schließen</button>
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
/* Stile bleiben unverändert */
.orders-view { display: flex; flex-direction: column; gap: 2rem; }
.order-cart, .book-search-section { padding: 1.5rem; }
.form-group { margin-bottom: 1rem; }
.empty-cart { text-align: center; padding: 1rem; background-color: #f8f9fa; border-radius: 6px; margin: 1rem 0; }
.item-list { list-style: none; padding: 0; margin: 1rem 0; }
.item-list li { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-bottom: 1px solid #e9ecef; }
.author-label { color: #6c757d; font-size: 0.9em; }
.btn-icon-danger { background: none; border: none; cursor: pointer; font-size: 1.2rem; padding: 0.25rem; }
.cart-actions { display: flex; gap: 1rem; margin-top: 1.5rem; flex-wrap: wrap; }
.search-result-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-bottom: 1px solid #e9ecef; gap: 1rem; }
.add-action { display: flex; align-items: center; gap: 0.5rem; }
.quantity-input { width: 70px; text-align: center; }
.status-error { color: #dc3545; margin-top: 1rem; }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,.5); display: flex; justify-content: center; align-items: center; z-index: 100; }
.modal-content { width: 100%; max-width: 600px; padding: 2rem; }
.modal-actions { margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px; }
.link-container { display: flex; gap: 0.5rem; margin-top: 1rem; }
.link-input { flex-grow: 1; background-color: #e9ecef; border: 1px solid #ced4da; }
</style>
