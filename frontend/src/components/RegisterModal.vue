<!-- components/RegisterModal.vue -->
<template>
  <div
    class="modal fade"
    id="registerModal"
    tabindex="-1"
    aria-labelledby="registerModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="registerModalLabel">
            <i class="bi bi-person-plus me-2"></i>
            Créer un compte
          </h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Fermer"
          ></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleRegister">
            <div class="mb-3">
              <label for="registerName" class="form-label">Nom complet</label>
              <input
                type="text"
                class="form-control"
                id="registerName"
                v-model="registerForm.name"
                :class="{ 'is-invalid': errors.name }"
                required
              />
              <div v-if="errors.name" class="invalid-feedback">
                {{ errors.name }}
              </div>
            </div>

            <div class="mb-3">
              <label for="registerEmail" class="form-label">Email</label>
              <input
                type="email"
                class="form-control"
                id="registerEmail"
                v-model="registerForm.email"
                :class="{ 'is-invalid': errors.email }"
                required
              />
              <div v-if="errors.email" class="invalid-feedback">
                {{ errors.email }}
              </div>
            </div>
            
            <div class="mb-3">
              <label for="registerPassword" class="form-label">Mot de passe</label>
              <input
                type="password"
                class="form-control"
                id="registerPassword"
                v-model="registerForm.password"
                :class="{ 'is-invalid': errors.password }"
                required
                minlength="6"
              />
              <div class="form-text">
                Le mot de passe doit contenir au moins 6 caractères.
              </div>
              <div v-if="errors.password" class="invalid-feedback">
                {{ errors.password }}
              </div>
            </div>

            <div class="mb-3">
              <label for="registerPasswordConfirm" class="form-label">Confirmer le mot de passe</label>
              <input
                type="password"
                class="form-control"
                id="registerPasswordConfirm"
                v-model="registerForm.passwordConfirm"
                :class="{ 'is-invalid': errors.passwordConfirm }"
                required
              />
              <div v-if="errors.passwordConfirm" class="invalid-feedback">
                {{ errors.passwordConfirm }}
              </div>
            </div>

            <div v-if="errors.general" class="alert alert-danger" role="alert">
              {{ errors.general }}
            </div>

            <div v-if="successMessage" class="alert alert-success" role="alert">
              {{ successMessage }}
            </div>

            <div class="d-grid">
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="loading"
              >
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                {{ loading ? 'Création...' : 'Créer le compte' }}
              </button>
            </div>
          </form>

          <hr class="my-4">
          
          <div class="text-center">
            <p class="text-muted">Déjà un compte ?</p>
            <button
              type="button"
              class="btn btn-outline-secondary"
              @click="switchToLogin"
            >
              Se connecter
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
  name: 'RegisterModal',
  emits: ['register-success', 'switch-to-login'],
  data() {
    return {
      registerForm: {
        name: '',
        email: '',
        password: '',
        passwordConfirm: ''
      },
      errors: {},
      loading: false,
      successMessage: ''
    };
  },
  methods: {
    async handleRegister() {
      this.loading = true;
      this.errors = {};
      this.successMessage = '';

      // Validation côté client
      if (!this.validateForm()) {
        this.loading = false;
        return;
      }

      try {
        const response = await dataService.register({
          name: this.registerForm.name,
          email: this.registerForm.email,
          password: this.registerForm.password
        });

        this.successMessage = 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.';
        
        // Émettre l'événement de succès
        this.$emit('register-success', response.user);

        // Attendre un peu puis passer au login
        setTimeout(() => {
          this.switchToLogin();
        }, 2000);

      } catch (error) {
        this.errors.general = error.message || 'Erreur lors de la création du compte';
      } finally {
        this.loading = false;
      }
    },

    validateForm() {
      let isValid = true;

      // Validation du nom
      if (this.registerForm.name.trim().length < 2) {
        this.errors.name = 'Le nom doit contenir au moins 2 caractères';
        isValid = false;
      }

      // Validation de l'email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.registerForm.email)) {
        this.errors.email = 'Format d\'email invalide';
        isValid = false;
      }

      // Validation du mot de passe
      if (this.registerForm.password.length < 6) {
        this.errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
        isValid = false;
      }

      // Validation de la confirmation
      if (this.registerForm.password !== this.registerForm.passwordConfirm) {
        this.errors.passwordConfirm = 'Les mots de passe ne correspondent pas';
        isValid = false;
      }

      return isValid;
    },

    switchToLogin() {
      // Fermer cette modal et ouvrir celle de connexion
      const modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
      modal.hide();
      this.$emit('switch-to-login');
    },

    resetForm() {
      this.registerForm = {
        name: '',
        email: '',
        password: '',
        passwordConfirm: ''
      };
      this.errors = {};
      this.loading = false;
      this.successMessage = '';
    }
  },
  mounted() {
    // Réinitialiser le formulaire quand la modal s'ouvre
    const modalElement = document.getElementById('registerModal');
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

.form-text {
  font-size: 0.875em;
  color: #6c757d;
}
</style>