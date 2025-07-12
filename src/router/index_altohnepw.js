import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import HomeView from '../views/HomeView.vue';
import LoginView from '../views/LoginView.vue';
import StudentsView from '../views/StudentsView.vue';
import OrdersView from '../views/OrdersView.vue'; 
// NEU: PublicOrderView importieren
import PublicOrderView from '../views/PublicOrderView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    // --- NEUE ÖFFENTLICHE ROUTE HINZUFÜGEN ---
    // Diese Route ist für den Händler und erfordert keinen Login.
    {
      path: '/order/:token', // Der ":token" Teil ist ein dynamischer Parameter
      name: 'public-order',
      component: PublicOrderView
    },
    // --- Geschützte Routen ---
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true }
    },
    {
      path: '/students',
      name: 'students',
      component: StudentsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/orders',
      name: 'orders',
      component: OrdersView,
      meta: { requiresAuth: true }
    }
  ]
});

router.beforeEach((to, from, next) => {
  const auth = useAuthStore();
  // Wichtig: Die Login-Seite und die neue öffentliche Seite von der Authentifizierungsprüfung ausnehmen.
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next({ name: 'login' });
  } else {
    next();
  }
});

export default router;
