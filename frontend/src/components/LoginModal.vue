<!-- components/LoginModal.vue -->
<template>
  <div
    class="modal fade"
    id="loginModal"
    tabindex="-1"
    aria-labelledby="loginModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="loginModalLabel">
            <i class="bi bi-person-circle me-2"></i>
            Connexion
          </h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Fermer"
          ></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleLogin">
            <div class="mb-3">
              <label for="loginEmail" class="form-label">Email</label>
              <input
                type="email"
                class="form-control"
                id="loginEmail"
                v-model="loginForm.email"
                :class="{ 'is-invalid': errors.email }"
                required
              />
              <div v-if="errors.email" class="invalid-feedback">
                {{ errors.email }}
              </div>
            </div>
            
            <div class="mb-3">
              <label for="loginPassword" class="form-label">Mot de passe</label>
              <input
                type="password"
                class="form-control"
                id="loginPassword"
                v-model="loginForm.password"
                :class="{ 'is-invalid': errors.password }"
                required
              />
              <div v-if="errors.password" class="invalid-feedback">
                {{ errors.password }}
              </div>
            </div>

            <div v-if="errors.general" class="alert alert-danger" role="alert">
              {{ errors.general }}
            </div>

            <div class="d-grid">
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="loading"
              >
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                {{ loading ? 'Connexion...' : 'Se connecter' }}
              </button>
            </div>
          </form>

          <hr class="my-4">
          
          <div class="text-center">
            <p class="text-muted">Pas encore de compte ?</p>
            <button
              type="button"
              class="btn btn-outline-secondary"
              @click="switchToRegister"
            >
              Créer un compte
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import dataService from '@/services/dataService';

export default {
  name: 'LoginModal',
  emits: ['login-success', 'switch-to-register'],
  data() {
    return {
      loginForm: {
        email: '',
        password: ''
      },
      errors: {},
      loading: false
    };
  },
  methods: {
    async handleLogin() {
      this.loading = true;
      this.errors = {};

      try {
        const response = await dataService.login(
          this.loginForm.email,
          this.loginForm.password
        );

        // Émettre l'événement de succès
        this.$emit('login-success', response.user);

        // Fermer la modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        modal.hide();

        // Réinitialiser le formulaire
        this.resetForm();

      } catch (error) {
        this.errors.general = error.message || 'Erreur de connexion';
      } finally {
        this.loading = false;
      }
    },

    switchToRegister() {
      // Fermer cette modal et ouvrir celle d'inscription
      const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
      modal.hide();
      this.$emit('switch-to-register');
    },

    resetForm() {
      this.loginForm = {
        email: '',
        password: ''
      };
      this.errors = {};
      this.loading = false;
    }
  },
  mounted() {
    // Réinitialiser le formulaire quand la modal s'ouvre
    const modalElement = document.getElementById('loginModal');
    modalElement.addEventListener('shown.bs.modal', () => {
      this.resetForm();
    });
  }
};
</script>

<style scoped>
.modal-header {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.btn-outline-secondary {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.btn-outline-secondary:hover {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}
</style>