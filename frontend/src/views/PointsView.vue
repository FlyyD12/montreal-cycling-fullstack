<!-- views/PointsView.vue -->

<template>
  <div class="points-page">
    <div class="container-fluid">
      <div class="row">
        <!-- Filtre à gauche -->
        <div class="col-md-3 filter-section p-4">
          <h6>Arrondissement :</h6>
          <!-- Mini-carte Leaflet -->
          <div id="districtMap" class="map-container mb-3"></div>

          <select class="form-select mb-4" v-model="selectedDistrict" @change="loadPointsData">
            <option value="">Tous</option>
            <option
              v-for="district in districts"
              :key="district"
              :value="district"
            >
              {{ district }}
            </option>
          </select>

          <h4>Type de lieu :</h4>
          <select class="form-select mb-4" v-model="selectedType" @change="loadPointsData">
            <option value="">Tous</option>
            <option
              v-for="type in poiTypes"
              :key="type"
              :value="type"
            >
              {{ type }}
            </option>
          </select>

          <!-- Bouton d'ajout pour utilisateurs connectés -->
          <div v-if="isAuthenticated" class="mb-4">
            <button 
              class="btn btn-success w-100"
              data-bs-toggle="modal"
              data-bs-target="#pointFormModal"
              @click="openAddForm"
            >
              <i class="bi bi-plus-circle me-2"></i>
              Ajouter un point
            </button>
          </div>
        </div>

        <!-- Liste + pagination à droite -->
        <div class="col-md-9 data-section p-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>Points d'intérêt</h2>
            <div v-if="loading" class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Chargement...</span>
            </div>
          </div>

          <div v-if="error" class="alert alert-danger" role="alert">
            {{ error }}
          </div>

          <table class="table table-hover">
            <thead>
              <tr>
                <th @click="sortBy('Arrondissement')" class="sortable-header">
                  Arrondissement
                  <i v-if="sortKey==='Arrondissement'" :class="sortDirection==='asc'?'bi bi-caret-up-fill':'bi bi-caret-down-fill'"></i>
                </th>
                <th @click="sortBy('Type')" class="sortable-header">
                  Type
                  <i v-if="sortKey==='Type'" :class="sortDirection==='asc'?'bi bi-caret-up-fill':'bi bi-caret-down-fill'"></i>
                </th>
                <th @click="sortBy('Nom')" class="sortable-header">
                  Nom du lieu
                  <i v-if="sortKey==='Nom'" :class="sortDirection==='asc'?'bi bi-caret-up-fill':'bi bi-caret-down-fill'"></i>
                </th>
                <th @click="sortBy('Adresse')" class="sortable-header">
                  Adresse
                  <i v-if="sortKey==='Adresse'" :class="sortDirection==='asc'?'bi bi-caret-up-fill':'bi bi-caret-down-fill'"></i>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="pois.length === 0 && !loading">
                <td colspan="5" class="text-center text-muted py-4">
                  Aucun point d'intérêt trouvé
                </td>
              </tr>
              <tr
                v-for="poi in pois"
                :key="poi.ID"
              >
                <td>{{ poi.Arrondissement }}</td>
                <td>{{ poi.Type }}</td>
                <td>{{ poi.Nom }}</td>
                <td>{{ poi.Adresse }}</td>
                <td>
                  <!-- Modifier - seulement si connecté -->
                  <button 
                    v-if="isAuthenticated"
                    class="btn btn-sm btn-primary me-1"
                    data-bs-toggle="modal"
                    data-bs-target="#pointFormModal"
                    @click="openEditForm(poi)"
                    title="Modifier"
                  >
                    <i class="bi bi-pencil"></i>
                  </button>
                  
                  <!-- Carte -->
                  <button
                    class="btn btn-sm btn-info me-1"
                    data-bs-toggle="modal"
                    data-bs-target="#pointsMapModal"
                    @click="openPointsMap(poi)"
                    title="Voir sur la carte"
                  >
                    <i class="bi bi-geo-alt"></i>
                  </button>
                  
                  <!-- Supprimer - seulement si connecté -->
                  <button 
                    v-if="isAuthenticated"
                    class="btn btn-sm btn-danger"
                    @click="confirmDelete(poi)"
                    title="Supprimer"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination -->
          <div class="pagination-container d-flex justify-content-between align-items-center mt-4">
            <div>
              <small class="text-muted">
                Affichage {{ startIndex }}-{{ endIndex }} de {{ totalItems }} résultats
              </small>
            </div>
            <nav>
              <ul class="pagination mb-0">
                <li class="page-item" :class="{ disabled: currentPage === 1 }">
                  <button class="page-link" @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">
                    &lt;
                  </button>
                </li>
                <li
                  v-for="page in pageNumbers"
                  :key="page"
                  class="page-item"
                  :class="{ active: page === currentPage, disabled: page === '...' }"
                >
                  <button
                    v-if="page !== '...'"
                    class="page-link"
                    @click="goToPage(page)"
                  >{{ page }}</button>
                  <span v-else class="page-link">…</span>
                </li>
                <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                  <button class="page-link" @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages">
                    &gt;
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Modale Map des POI -->
    <PointsMapModal
      id="pointsMapModal"
      :pois="allPois"
      :activePoi="selectedPoi"
    />

    <!-- Modale de formulaire d'ajout/modification -->
    <PointFormModal
      :point="editingPoint"
      @point-saved="handlePointSaved"
    />
  </div>
</template>

<script>
import PointsMapModal from '@/components/PointsMapModal.vue'
import PointFormModal from '@/components/PointFormModal.vue'
import dataService from '@/services/dataService'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default {
  name: 'PointsView',
  components: { 
    PointsMapModal,
    PointFormModal
  },
  data() {
    return {
      pois: [],
      allPois: [], // Pour la carte
      districts: [],
      poiTypes: ['Fontaine à boire', 'Atelier réparation'],
      selectedDistrict: '',
      selectedType: '',
      sortKey: 'Arrondissement',
      sortDirection: 'asc',
      itemsPerPage: 20,
      currentPage: 1,
      totalItems: 0,
      totalPages: 0,
      selectedPoi: null,
      editingPoint: null,
      districtMap: null,
      territoryLayer: null,
      loading: false,
      error: null
    }
  },
  computed: {
    isAuthenticated() {
      return dataService.isAuthenticated();
    },
    startIndex() {
      return (this.currentPage - 1) * this.itemsPerPage + 1;
    },
    endIndex() {
      return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
    },
    pageNumbers() {
      const total = this.totalPages;
      const current = this.currentPage;
      const delta = 2;
      let range = [];
      
      for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
        range.push(i);
      }
      
      if (range[0] > 1) {
        if (range[0] > 2) range.unshift('...');
        range.unshift(1);
      }
      
      if (range[range.length-1] < total) {
        if (range[range.length-1] < total - 1) range.push('...');
        range.push(total);
      }
      
      return range;
    }
  },
  methods: {
    async loadPointsData() {
      this.loading = true;
      this.error = null;
      
      try {
        const params = {
          limite: this.itemsPerPage,
          page: this.currentPage
        };
        
        if (this.selectedDistrict) {
          params.arrondissement = this.selectedDistrict;
        }
        
        if (this.selectedType) {
          params.type = this.selectedType;
        }
        
        const response = await dataService.loadPointsInteret(params);
        
        this.pois = response.data;
        this.totalItems = response.pagination.total;
        this.totalPages = response.pagination.totalPages;
        
        // Charger tous les POI pour la carte (sans pagination)
        if (!this.allPois.length) {
          const allResponse = await dataService.loadPointsInteret({ limite: 1000 });
          this.allPois = allResponse.data;
        }
        
      } catch (error) {
        console.error('Erreur lors du chargement des points:', error);
        this.error = 'Erreur lors du chargement des points d\'intérêt';
      } finally {
        this.loading = false;
      }
    },
    
    async loadTerritories() {
      try {
        const response = await dataService.loadTerritoires({ format: 'geojson' });
        this.districts = response.features.map(f => f.properties.NOM).sort();
        this.initDistrictMap(response);
      } catch (error) {
        console.error('Erreur lors du chargement des territoires:', error);
      }
    },
    
    initDistrictMap(geoData) {
      this.districtMap = L.map('districtMap', { zoomControl: false, attributionControl: false })
        .setView([45.5300, -73.6773], 9);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.districtMap);
      
      this.territoryLayer = L.geoJSON(geoData, {
        style: () => ({
          color: '#006d5b',
          weight: 1,
          fillColor: '#c0e6e0',
          fillOpacity: 0.3
        }),
        onEachFeature: (feature, layer) => {
          layer.on('click', () => {
            this.selectedDistrict = feature.properties.NOM;
            this.currentPage = 1;
            this.loadPointsData();
          });
        }
      }).addTo(this.districtMap);
    },
    
    sortBy(key) {
      if (this.sortKey === key) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortKey = key;
        this.sortDirection = 'asc';
      }
      // Le tri sera géré côté serveur dans une version future
      // Pour maintenant, on recharge les données
      this.currentPage = 1;
      this.loadPointsData();
    },
    
    goToPage(page) {
      if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
        this.currentPage = page;
        this.loadPointsData();
      }
    },
    
    openPointsMap(poi) {
      this.selectedPoi = poi;
    },
    
    openAddForm() {
      this.editingPoint = null;
    },
    
    openEditForm(poi) {
      this.editingPoint = poi;
    },
    
    async confirmDelete(poi) {
      if (!this.isAuthenticated) {
        alert('Vous devez être connecté pour supprimer un point d\'intérêt');
        return;
      }
      
      if (confirm(`Êtes-vous sûr de vouloir supprimer "${poi.Nom}" ?`)) {
        try {
          await dataService.deletePointInteret(poi.ID);
          this.loadPointsData(); // Recharger la liste
          alert('Point d\'intérêt supprimé avec succès');
        } catch (error) {
          console.error('Erreur lors de la suppression:', error);
          alert('Erreur lors de la suppression: ' + error.message);
        }
      }
    },
    
    handlePointSaved(event) {
      // Recharger les données après ajout/modification
      this.loadPointsData();
      
      // Message de succès
      const action = event.action === 'created' ? 'ajouté' : 'modifié';
      alert(`Point d'intérêt ${action} avec succès !`);
    }
  },
  
  watch: {
    selectedDistrict() {
      this.currentPage = 1;
      this.updateDistrictMapStyle();
    },
    selectedType() {
      this.currentPage = 1;
    }
  },
  
  updateDistrictMapStyle() {
    if (this.territoryLayer) {
      this.territoryLayer.eachLayer(layer => {
        const isActive = layer.feature.properties.NOM === this.selectedDistrict;
        layer.setStyle({
          fillColor: isActive ? '#00a896' : '#c0e6e0',
          fillOpacity: isActive ? 0.5 : 0.3
        });
      });
    }
  },
  
  async mounted() {
    await this.loadTerritories();
    await this.loadPointsData();
  }
}
</script>

<style scoped>
.map-container {
  height: 200px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.filter-section {
  background-color: var(--color-background);
}

.sortable-header {
  cursor: pointer;
  user-select: none;
}

.sortable-header:hover {
  background-color: #e9ecef;
}

.pagination-container .page-link {
  color: var(--color-primary);
}

.pagination-container .page-item.active .page-link {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.pagination-container .page-item.disabled .page-link {
  cursor: not-allowed;
}

.btn-success {
  background-color: #28a745;
  border-color: #28a745;
}

.spinner-border {
  width: 1.5rem;
  height: 1.5rem;
}
</style>