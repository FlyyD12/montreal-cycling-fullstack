<!-- components/PointFormModal.vue -->
<template>
  <div
    class="modal fade"
    id="pointFormModal"
    tabindex="-1"
    aria-labelledby="pointFormModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="pointFormModalLabel">
            <i class="bi bi-geo-alt-fill me-2"></i>
            {{ isEditing ? 'Modifier' : 'Ajouter' }} un point d'intérêt
          </h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Fermer"
          ></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleSubmit">
            <div class="row">
              <!-- Colonne gauche -->
              <div class="col-md-6">
                <div class="mb-3">
                  <label for="pointType" class="form-label">Type de lieu *</label>
                  <select
                    class="form-select"
                    id="pointType"
                    v-model="form.type"
                    :class="{ 'is-invalid': errors.type }"
                    required
                  >
                    <option value="">Sélectionner un type</option>
                    <option value="Fontaine à boire">Fontaine à boire</option>
                    <option value="Atelier réparation">Atelier réparation</option>
                  </select>
                  <div v-if="errors.type" class="invalid-feedback">
                    {{ errors.type }}
                  </div>
                </div>

                <div class="mb-3">
                  <label for="pointName" class="form-label">Nom du lieu *</label>
                  <input
                    type="text"
                    class="form-control"
                    id="pointName"
                    v-model="form.nom"
                    :class="{ 'is-invalid': errors.nom }"
                    placeholder="Ex: Fontaine du parc Lafontaine"
                    required
                  />
                  <div v-if="errors.nom" class="invalid-feedback">
                    {{ errors.nom }}
                  </div>
                </div>

                <div class="mb-3">
                  <label for="pointArrondissement" class="form-label">Arrondissement *</label>
                  <select
                    class="form-select"
                    id="pointArrondissement"
                    v-model="form.arrondissement"
                    :class="{ 'is-invalid': errors.arrondissement }"
                    required
                  >
                    <option value="">Sélectionner un arrondissement</option>
                    <option v-for="arr in arrondissements" :key="arr" :value="arr">
                      {{ arr }}
                    </option>
                  </select>
                  <div v-if="errors.arrondissement" class="invalid-feedback">
                    {{ errors.arrondissement }}
                  </div>
                </div>

                <div class="mb-3">
                  <label for="pointAdresse" class="form-label">Adresse</label>
                  <input
                    type="text"
                    class="form-control"
                    id="pointAdresse"
                    v-model="form.adresse"
                    placeholder="Ex: Intersection rue Rachel / Papineau"
                  />
                </div>
              </div>

              <!-- Colonne droite -->
              <div class="col-md-6">
                <div class="mb-3">
                  <label for="pointLatitude" class="form-label">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    class="form-control"
                    id="pointLatitude"
                    v-model.number="form.latitude"
                    :class="{ 'is-invalid': errors.latitude }"
                    placeholder="Ex: 45.5200"
                  />
                  <div v-if="errors.latitude" class="invalid-feedback">
                    {{ errors.latitude }}
                  </div>
                </div>

                <div class="mb-3">
                  <label for="pointLongitude" class="form-label">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    class="form-control"
                    id="pointLongitude"
                    v-model.number="form.longitude"
                    :class="{ 'is-invalid': errors.longitude }"
                    placeholder="Ex: -73.5800"
                  />
                  <div v-if="errors.longitude" class="invalid-feedback">
                    {{ errors.longitude }}
                  </div>
                </div>

                <div class="mb-3" v-if="form.type === 'Fontaine à boire'">
                  <label for="pointEtat" class="form-label">État</label>
                  <select
                    class="form-select"
                    id="pointEtat"
                    v-model="form.etat"
                  >
                    <option value="">Non spécifié</option>
                    <option value="Fonctionnelle">Fonctionnelle</option>
                    <option value="Hors service">Hors service</option>
                    <option value="En maintenance">En maintenance</option>
                  </select>
                </div>

                <div class="mb-3">
                  <label for="pointRemarque" class="form-label">Remarque</label>
                  <textarea
                    class="form-control"
                    id="pointRemarque"
                    v-model="form.remarque"
                    rows="3"
                    placeholder="Informations supplémentaires..."
                  ></textarea>
                </div>
              </div>
            </div>

            <div v-if="errors.general" class="alert alert-danger" role="alert">
              {{ errors.general }}
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Annuler
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="loading"
              >
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                {{ loading ? 'Enregistrement...' : (isEditing ? 'Modifier' : 'Ajouter') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import dataService from '@/services/dataService';

export default {
  name: 'PointFormModal',
  props: {
    point: {
      type: Object,
      default: null
    }
  },
  emits: ['point-saved'],
  data() {
    return {
      form: {
        type: 'Fontaine à boire',
        nom: '',
        arrondissement: '',
        adresse: '',
        latitude: null,
        longitude: null,
        etat: '',
        remarque: ''
      },
      arrondissements: [
        'Ahuntsic-Cartierville',
        'Anjou',
        'Côte-des-Neiges–Notre-Dame-de-Grâce',
        'Lachine',
        'LaSalle',
        'Le Plateau-Mont-Royal',
        'Le Sud-Ouest',
        'L\'Île-Bizard–Sainte-Geneviève',
        'Mercier–Hochelaga-Maisonneuve',
        'Montréal-Nord',
        'Outremont',
        'Pierrefonds-Roxboro',
        'Rivière-des-Prairies–Pointe-aux-Trembles',
        'Rosemont–La Petite-Patrie',
        'Saint-Laurent',
        'Saint-Léonard',
        'Verdun',
        'Ville-Marie',
        'Villeray–Saint-Michel–Parc-Extension'
      ],
      errors: {},
      loading: false
    };
  },
  computed: {
    isEditing() {
      return !!this.point;
    }
  },
  watch: {
    point: {
      handler(newPoint) {
        if (newPoint) {
          this.form = {
            type: newPoint.Type || 'Fontaine à boire',
            nom: newPoint.Nom || '',
            arrondissement: newPoint.Arrondissement || '',
            adresse: newPoint.Adresse || '',
            latitude: newPoint.Latitude || null,
            longitude: newPoint.Longitude || null,
            etat: newPoint.Etat || '',
            remarque: newPoint.Remarque || ''
          };
        } else {
          this.resetForm();
        }
      },
      deep: true,
      immediate: true
    }
  },
  methods: {
    async handleSubmit() {
      this.loading = true;
      this.errors = {};

      if (!this.validateForm()) {
        this.loading = false;
        return;
      }

      try {
        let response;
        
        if (this.isEditing) {
          response = await dataService.updatePointInteret(this.point.ID, this.form);
        } else {
          response = await dataService.createPointInteret(this.form);
        }

        // Émettre l'événement de succès
        this.$emit('point-saved', {
          action: this.isEditing ? 'updated' : 'created',
          point: this.form,
          response
        });

        // Fermer la modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('pointFormModal'));
        modal.hide();

        // Réinitialiser le formulaire
        this.resetForm();

      } catch (error) {
        this.errors.general = error.message || 'Erreur lors de l\'enregistrement';
      } finally {
        this.loading = false;
      }
    },

    validateForm() {
      let isValid = true;

      // Validation des champs requis
      if (!this.form.type) {
        this.errors.type = 'Le type est requis';
        isValid = false;
      }

      if (!this.form.nom.trim()) {
        this.errors.nom = 'Le nom est requis';
        isValid = false;
      }

      if (!this.form.arrondissement) {
        this.errors.arrondissement = 'L\'arrondissement est requis';
        isValid = false;
      }

      // Validation des coordonnées si fournies
      if (this.form.latitude !== null && this.form.latitude !== '') {
        if (this.form.latitude < 45.4 || this.form.latitude > 45.7) {
          this.errors.latitude = 'Latitude invalide pour Montréal (45.4 - 45.7)';
          isValid = false;
        }
      }

      if (this.form.longitude !== null && this.form.longitude !== '') {
        if (this.form.longitude < -74.0 || this.form.longitude > -73.4) {
          this.errors.longitude = 'Longitude invalide pour Montréal (-74.0 - -73.4)';
          isValid = false;
        }
      }

      return isValid;
    },

    resetForm() {
      this.form = {
        type: 'Fontaine à boire',
        nom: '',
        arrondissement: '',
        adresse: '',
        latitude: null,
        longitude: null,
        etat: '',
        remarque: ''
      };
      this.errors = {};
      this.loading = false;
    }
  },
  mounted() {
    // Réinitialiser le formulaire quand la modal s'ouvre
    const modalElement = document.getElementById('pointFormModal');
    modalElement.addEventListener('shown.bs.modal', () => {
      if (!this.point) {
        this.resetForm();
      }
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

.form-label {
  font-weight: 600;
}

.required-field::after {
  content: " *";
  color: #dc3545;
}
</style>