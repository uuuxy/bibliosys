
<template>
  <div class="admin-dashboard-root">
    <div class="admin-dashboard-header">
      <div class="admin-dashboard-title">🔧 Verwaltung</div>
      <div class="admin-dashboard-sub">Wählen Sie einen Bereich aus, den Sie verwalten möchten.</div>
    </div>
    <div class="admin-dashboard-grid">
      <div v-for="card in cards" :key="card.to" class="admin-dashboard-cell">
        <router-link :to="card.to" class="admin-tile">
          <div class="admin-tile-body">
            <span class="admin-tile-icon">{{ card.icon }}</span>
            <div class="admin-tile-title">{{ card.title }}</div>
            <div class="admin-tile-desc">{{ card.desc }}</div>
          </div>
        </router-link>
      </div>
    </div>
  
/* Horizontale, scrollbare Kachelreihe */
.admin-tile-row {
  gap: 1.2rem;
  scrollbar-color: #b6d4fe #f6faff;
  scrollbar-width: thin;
}
.admin-tile-row::-webkit-scrollbar {
  height: 0.7rem;
}
.admin-tile-row::-webkit-scrollbar-thumb {
  background: #b6d4fe;
  border-radius: 1rem;
}
  </div>
</template>

<script setup>
const cards = [
  { to: '/admin/users', icon: '👥', title: 'Benutzer', desc: 'App-Benutzer anlegen und Rechte verwalten.' },
  { to: '/admin/suppliers', icon: '🚚', title: 'Anbieter', desc: 'Lieferanten für das Bestellwesen pflegen.' },
  { to: '/admin/orders', icon: '🛒', title: 'Bestellungen', desc: 'Neue Bücher bestellen und Lieferungen verwalten.' },
  { to: '/inventory-check', icon: '📦', title: 'Inventur', desc: 'Bücher scannen und Inventurbericht erhalten.' },
  { to: '/admin/extend', icon: '📅', title: 'Verlängerung', desc: 'Leihfristen für ganze Buchsätze verlängern.' },
  { to: '/admin/id-card-layout', icon: '🎨', title: 'Ausweis-Layout', desc: 'Das Design der Schülerausweise anpassen.' },
  { to: '/admin/migration', icon: '🗂️', title: 'Daten-Import', desc: 'Bestehende Ausleih-Daten importieren.' },
];
</script>
<style scoped>
/* Admin Dashboard Layout ohne Bootstrap */
.admin-dashboard-root {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2.5rem 1rem 1.5rem 1rem;
}
.admin-dashboard-header {
  text-align: center;
  margin-bottom: 2.2rem;
}
.admin-dashboard-title {
  font-size: 2.1rem;
  font-weight: bold;
  letter-spacing: 1px;
  margin-bottom: 0.3rem;
}
.admin-dashboard-sub {
  color: #6c757d;
  font-size: 1.08rem;
}
.admin-dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 1.5rem;
}
.admin-dashboard-cell {
  display: flex;
  align-items: stretch;
  justify-content: center;
}
.admin-tile {
  display: block;
  background: #fff;
  border-radius: 0.8rem;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.06);
  transition: box-shadow 0.14s, transform 0.14s, background 0.14s;
  min-height: 120px;
  width: 100%;
  padding: 0;
  border: none;
  outline: none;
}
.admin-tile:hover {
  box-shadow: 0 6px 24px 0 rgba(0,123,255,0.11);
  background: #f6faff;
  transform: translateY(-3px) scale(1.01);
  text-decoration: none;
}
.admin-tile-body {
  padding: 1.1rem 0.7rem 1rem 0.7rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
}
.admin-tile-icon {
  font-size: 1.5rem;
  line-height: 1;
  background: #e9f0fa;
  border-radius: 50%;
  width: 2.3rem;
  height: 2.3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px 0 rgba(0,0,0,0.05);
  margin-bottom: 0.4rem;
}
.admin-tile-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: #222;
  margin-bottom: 0.1rem;
}
.admin-tile-desc {
  font-size: 0.93rem;
  color: #6c757d;
}
</style>
