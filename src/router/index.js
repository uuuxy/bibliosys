import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

// Allgemeine Ansichten
import HomeView from '@/views/HomeView.vue';
import LoginView from '@/views/LoginView.vue';
import StudentsView from '@/views/StudentsView.vue';
import OrdersView from '@/views/OrdersView.vue';
import PublicOrderView from '@/views/PublicOrderView.vue';

// Admin-Ansichten
import SuppliersView from '@/views/SuppliersView.vue';
import InventoryView from '@/views/InventoryView.vue';
import AdminLayout from '@/views/admin/AdminLayout.vue';
import AdminDashboardView from '@/views/admin/AdminDashboardView.vue';
import UserManagementView from '@/views/admin/UserManagementView.vue';
import ExtendLendingsView from '@/views/admin/ExtendLendingsView.vue';
import SettingsIdCard from '@/views/admin/SettingsIdCard.vue';
import OrderManagementView from '@/views/admin/OrderManagementView.vue';
import BooksView from '@/views/BooksView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Öffentliche Routen
    { path: '/login', name: 'login', component: LoginView },
    { path: '/order/:token', name: 'public-order', component: PublicOrderView },

    // Standard-Routen für angemeldete Benutzer
    { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: true } },
    { path: '/students', name: 'students', component: StudentsView, meta: { requiresAuth: true } },

    { path: '/inventory', name: 'inventory', component: InventoryView, meta: { requiresAuth: true } },
    { path: '/orders', name: 'orders', component: OrdersView, meta: { requiresAuth: true } },
    { path: '/books', name: 'books', component: BooksView, meta: { requiresAuth: true } },

    // === KORRIGIERTE & VERSCHACHTELTE ADMIN-ROUTEN ===
    {
      path: '/admin',
      component: AdminLayout, // Das Haupt-Layout für den Admin-Bereich
      meta: { requiresAuth: true, requiresAdmin: true },
      // Leitet /admin automatisch auf /admin/dashboard um
      redirect: '/admin/dashboard', 
      children: [
        {
          path: 'dashboard',
          name: 'admin-dashboard',
          component: AdminDashboardView,
        },
        {
          path: 'users',
          name: 'admin-users',
          component: UserManagementView,
        },
        {
          path: 'suppliers',
          name: 'admin-suppliers',
          component: SuppliersView,
        },
        {
          path: 'orders',
          name: 'admin-orders',
          component: OrderManagementView,
        },
        {
          path: 'id-card-layout',
          name: 'admin-id-card-layout',
          component: SettingsIdCard,
        },
        {
          path: 'extend',
          name: 'admin-extend',
          component: ExtendLendingsView,
        },
        {
          path: 'migration',
          name: 'admin-migration',
          // Ersetzen Sie AdminDashboardView durch Ihre echte Komponente
          component: AdminDashboardView, // z.B. MigrationTool
        },
      ]
    }
  ]
});

// Globale Navigations-Wache
router.beforeEach((to, from, next) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.isLoggedIn) { // Korrigiert: isLoggedIn ist im Store vorhanden
    return next({ name: 'login' });
  }

  if (to.meta.requiresAdmin && auth.user?.role !== 'admin') {
    return next({ name: 'home' });
  }

  next();
});

export default router;
