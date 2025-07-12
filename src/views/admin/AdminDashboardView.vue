<template>
    <div class="admin-dashboard">
        <h2>🔧 Verwaltung</h2>
        <p>Wählen Sie einen Bereich aus, den Sie verwalten möchten.</p>
        <div class="dashboard-grid">
            <router-link to="/admin/users" class="dashboard-card">
                <h4>👥 Benutzer</h4>
                <p>App-Benutzer anlegen und Rechte verwalten.</p>
            </router-link>
            <router-link to="/admin/suppliers" class="dashboard-card">
                <h4>🚚 Anbieter</h4>
                <p>Lieferanten für das Bestellwesen pflegen.</p>
            </router-link>
            <router-link to="/admin/orders" class="dashboard-card">
                <h4>🛒 Bestellungen</h4>
                <p>Neue Bücher bestellen und Lieferungen verwalten.</p>
            </router-link>
            <router-link to="/admin/extend" class="dashboard-card">
                <h4>📅 Verlängerung</h4>
                <p>Leihfristen für ganze Buchsätze verlängern.</p>
            </router-link>
            <router-link to="/admin/id-card-layout" class="dashboard-card">
                <h4>🎨 Ausweis-Layout</h4>
                <p>Das Design der Schülerausweise anpassen.</p>
            </router-link>
            <router-link to="/admin/migration" class="dashboard-card">
                <h4>🗂️ Daten-Import</h4>
                <p>Bestehende Ausleih-Daten importieren.</p>
            </router-link>
        </div>
    </div>
</template>

<style scoped>
.dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    margin-top: 20px;
}
.dashboard-card {
    display: block;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: #fff;
    text-decoration: none;
    color: inherit;
    transition: transform 0.2s, box-shadow 0.2s;
}
.dashboard-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}
.dashboard-card h4 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #007bff;
}
.dashboard-card p {
    font-size: 14px;
    color: #6c757d;
}
</style>
