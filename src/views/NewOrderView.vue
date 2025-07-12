<template>
    <div class="new-order-view">
        <h2>📝 Neue Bestellung anlegen</h2>

        <div class="order-form-grid">
            <!-- Linke Seite: Bestelldetails -->
            <div class="order-details-panel card">
                <h4>1. Bestelldaten</h4>
                <div class="form-group">
                    <label>Anbieter auswählen</label>
                    <select v-model="order.supplier_id" class="input" required>
                        <option :value="null" disabled>-- Bitte einen Anbieter wählen --</option>
                        <option v-for="supplier in supplierStore.suppliers" :key="supplier.id" :value="supplier.id">
                            {{ supplier.name }}
                        </option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Bestelldatum</label>
                    <input v-model="order.order_date" type="date" class="input" required>
                </div>
                <div class="form-group">
                    <label>Notizen zur Bestellung</label>
                    <textarea v-model="order.notes" class="input" rows="3"></textarea>
                </div>
            </div>

            <!-- Rechte Seite: Artikel hinzufügen -->
            <div class="order-items-panel card">
                <h4>2. Bücher zur Bestellung hinzufügen</h4>
                <!-- NEU: Info-Box für die ISBN -->
                <div v-if="isbnInfo" class="isbn-info-box">
                    {{ isbnInfo }}
                </div>
                <form @submit.prevent="addItem" class="add-item-form">
                    <input v-model="newItem.isbn" type="text" placeholder="ISBN (für autom. Suche)">
                    <input v-model="newItem.title" type="text" placeholder="Titel*" required>
                    <input v-model="newItem.author" type="text" placeholder="Autor">
                    <input v-model.number="newItem.quantity" type="number" min="1" placeholder="Anzahl*" required>
                    <button type="submit" class="btn btn-secondary">➕ Hinzufügen</button>
                </form>
            </div>
        </div>

        <!-- Untere Sektion: Bestellübersicht -->
        <div class="order-summary-panel card">
            <h4>3. Bestellübersicht</h4>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Titel</th>
                        <th>Autor</th>
                        <th>ISBN</th>
                        <th>Anzahl</th>
                        <th>Aktion</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(item, index) in order.items" :key="index">
                        <td>{{ item.title }}</td>
                        <td>{{ item.author }}</td>
                        <td>{{ item.isbn }}</td>
                        <td>{{ item.quantity }}</td>
                        <td>
                            <button @click="removeItem(index)" class="btn btn-danger btn-small">🗑️</button>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div v-if="order.items.length === 0" class="no-items">
                <p>Noch keine Bücher zur Bestellung hinzugefügt.</p>
            </div>
        </div>
        
        <div class="submit-order-panel">
            <button @click="submitOrder" class="btn btn-primary btn-large" :disabled="!isOrderValid || orderStore.isLoading">
                {{ orderStore.isLoading ? 'Bestellung wird erstellt...' : 'Bestellung aufgeben' }}
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useSupplierStore } from '../stores/suppliers.js';
import { useOrderStore } from '../stores/orders.js';
import { useRouter } from 'vue-router'; // NEU

const supplierStore = useSupplierStore();
const orderStore = useOrderStore();
const router = useRouter(); // NEU

const order = ref({
    supplier_id: null,
    order_date: new Date().toISOString().split('T')[0],
    notes: '',
    items: []
});

const newItem = ref({
    title: '',
    author: '',
    isbn: '',
    quantity: 1
});

onMounted(() => {
    supplierStore.fetchSuppliers();
});

const isOrderValid = computed(() => {
    return order.value.supplier_id && order.value.items.length > 0;
});

function addItem() {
    if (!newItem.value.title || !newItem.value.quantity) {
        alert('Titel und Anzahl sind erforderlich.');
        return;
    }
    order.value.items.push({ ...newItem.value });
    newItem.value = { title: '', author: '', isbn: '', quantity: 1 };
}

function removeItem(index) {
    order.value.items.splice(index, 1);
}

async function submitOrder() {
    if (!isOrderValid.value) {
        alert('Bitte wählen Sie einen Anbieter und fügen Sie mindestens ein Buch hinzu.');
        return;
    }
    try {
        const result = await orderStore.createOrder(order.value);
        alert(`Bestellung mit der ID ${result.orderId} erfolgreich erstellt!`);
        
        // NEU: Automatische Weiterleitung zur Bestellübersicht
        router.push('/admin/orders'); 

    } catch (error) {
        alert(`Fehler: ${error.message}`);
    }
}
</script>

<style scoped>
.order-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; font-weight: 500; }
.add-item-form { display: grid; grid-template-columns: 1fr 2fr 1fr 0.5fr auto; gap: 10px; }
.isbn-info-box {
    padding: 10px;
    border-radius: 4px;
    background-color: #e3f2fd;
    color: #0d47a1;
    font-size: 14px;
    margin-bottom: 15px;
    text-align: center;
}
.isbn-info-box:containing("ACHTUNG") {
    background-color: #fff3e0;
    color: #e65100;
}
.order-summary-panel { margin-bottom: 20px; }
.data-table { width: 100%; }
.no-items { text-align: center; padding: 20px; color: #6c757d; }
.submit-order-panel { text-align: right; }
.btn-large { padding: 12px 25px; font-size: 1.1em; }
</style>
