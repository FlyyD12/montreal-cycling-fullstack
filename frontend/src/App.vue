<!-- views/App.vue -->

<template>
  <div id="app">
    <div class="page-wrapper">
      <header>
        <nav class="navbar navbar-expand-lg navbar-light">
          <div class="container-fluid">
            <RouterLink to="/" class="navbar-brand">
              <svg class="bike-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="#00a896">
                <path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5.1 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2l-2.2-2.3zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z"></path>
              </svg>
              VéloFacile
            </RouterLink>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
              <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
              <ul class="navbar-nav">
                <li class="nav-item">
                  <RouterLink to="/network" class="nav-link">Réseau cyclable</RouterLink>
                </li>
                <li class="nav-item">
                  <RouterLink to="/stats" class="nav-link">Statistiques</RouterLink>
                </li>
                <li class="nav-item">
                  <RouterLink to="/points" class="nav-link">Points d'intérêt</RouterLink>
                </li>
              </ul>
              <div class="ms-auto">
                <!-- Boutons si non connecté -->
                <template v-if="!isAuthenticated">
                  <button 
                    class="btn btn-outline-primary me-2"
                    data-bs-toggle="modal"
                    data-bs-target="#loginModal"
                  >
                    Se connecter
                  </button>
                  <button 
                    class="btn btn-primary"
                    data-bs-toggle="modal"
                    data-bs-target="#registerModal"
                  >
                    S'inscrire
                  </button>
                </template>
                
                <!-- Menu utilisateur si connecté -->
                <template v-else>
                  <div class="dropdown">
                    <button 
                      class="btn btn-outline-primary dropdown-toggle" 
                      type="button" 
                      id="userDropdown" 
                      data-bs-toggle="dropdown"
                    >
                      <i class="bi bi-person-circle me-1"></i>
                      {{ currentUser?.name || 'Utilisateur' }}
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                      <li>
                        <span class="dropdown-item-text">
                          <small class="text-muted">{{ currentUser?.email }}</small>
                        </span>
                      </li>
                      <li><hr class="dropdown-divider"></li>
                      <li>
                        <button class="dropdown-item" @click="handleLogout">
                          <i class="bi bi-box-arrow-right me-2"></i>
                          Se déconnecter
                        </button>
                      </li>
                    </ul>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </nav>
      </header>
      
      <main>
        <RouterView @login-required="showLoginModal" />
      </main>
      
      <footer class="mt-5 py-3">
        <div class="container-fluid">
          <p>© 2025–2026 Alpha Diallo — VéloFacile</p>
        </div>
      </footer>
    </div>

    <!-- Modales d'authentification -->
    <LoginModal 
      @login-success="handleLoginSuccess"
      @switch-to-register="showRegisterModal"
    />
    <RegisterModal 
      @register-success="handleRegisterSuccess"
      @switch-to-login="showLoginModal"
    />
  </div>
</template>

<script>
import { RouterLink, RouterView } from 'vue-router';
import LoginModal from '@/components/LoginModal.vue';
import RegisterModal from '@/components/RegisterModal.vue';
import dataService from '@/services/dataService';

export default {
  name: 'App',
  components: {
    RouterLink,
    RouterView,
    LoginModal,
    RegisterModal
  },
  data() {
    return {
      currentUser: null,
      isAuthenticated: false
    };
  },
  methods: {
    async checkAuthStatus() {
      try {
        const authStatus = await dataService.checkAuthStatus();
        if (authStatus && authStatus.authenticated) {
          this.currentUser = authStatus.user;
          this.isAuthenticated = true;
        } else {
          this.currentUser = null;
          this.isAuthenticated = false;
        }
      } catch (error) {
        console.error('Erreur vérification auth:', error);
        this.currentUser = null;
        this.isAuthenticated = false;
      }
    },

    handleLoginSuccess(user) {
  this.currentUser = user; // Utilisez la variable
  this.isAuthenticated = true;
  this.showNotification('Connexion réussie !', 'success');
},

handleRegisterSuccess() { // Supprimez le paramètre user si non utilisé
  this.showNotification('Compte créé avec succès ! Vous pouvez maintenant vous connecter.', 'success');
},

    async handleLogout() {
      try {
        await dataService.logout();
        this.currentUser = null;
        this.isAuthenticated = false;
        
        // Rediriger vers la page d'accueil
        if (this.$route.path !== '/') {
          this.$router.push('/');
        }
        
        this.showNotification('Déconnexion réussie', 'info');
      } catch (error) {
        console.error('Erreur déconnexion:', error);
        this.showNotification('Erreur lors de la déconnexion', 'error');
      }
    },

    showLoginModal() {
      const modal = new bootstrap.Modal(document.getElementById('loginModal'));
      modal.show();
    },

    showRegisterModal() {
      const modal = new bootstrap.Modal(document.getElementById('registerModal'));
      modal.show();
    },

    showNotification(message, type = 'info') {
      // Créer une notification toast simple
      const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
      
      const toast = document.createElement('div');
      toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'primary'} border-0`;
      toast.setAttribute('role', 'alert');
      toast.innerHTML = `
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      `;
      
      toastContainer.appendChild(toast);
      
      const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
      bsToast.show();
      
      // Nettoyer après disparition
      toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
      });
    },

    createToastContainer() {
      const container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container position-fixed top-0 end-0 p-3';
      container.style.zIndex = '1055';
      document.body.appendChild(container);
      return container;
    }
  },

  async mounted() {
    // Vérifier le statut d'authentification au démarrage
    await this.checkAuthStatus();
    
    // Écouter les changements d'authentification
    window.addEventListener('storage', (e) => {
      if (e.key === 'authToken') {
        this.checkAuthStatus();
      }
    });
  }
};
</script>

<style>
/* Styles globaux pour l'application */
.navbar-brand {
  display: flex;
  align-items: center;
  font-weight: bold;
  color: var(--color-primary) !important;
}

.bike-logo {
  margin-right: 0.5rem;
}

.dropdown-item-text {
  padding: 0.25rem 1rem;
}

.toast-container {
  z-index: 1055;
}

/* Styles pour les boutons d'authentification */
.btn-outline-primary {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.btn-outline-primary:hover {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.btn-primary {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

/* Animation pour les transitions */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
