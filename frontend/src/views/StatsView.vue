<!-- views/StatsView.vue -->

<template>
  <div class="stats-page">
    <div class="container-fluid">
      <div class="row">
        <!-- Filtre à gauche -->
        <div class="col-md-3 filter-section p-4">
          <h4>Arrondissement :</h4>
          <!-- Mini‐carte Leaflet -->
          <div id="districtMap" class="map-container mb-3"></div>

          <select class="form-select mb-4" v-model="selectedDistrict">
            <option value="">Tous</option>
            <option v-for="d in districts" :key="d" :value="d">{{ d }}</option>
          </select>

          <h4>Compteurs implantés à partir de :</h4>
          <div class="input-group mb-4">
            <input
              type="number"
              class="form-control"
              v-model.number="yearFilter"
              placeholder="Choisir l'année"
            />
            <span class="input-group-text"><i class="bi bi-calendar"></i></span>
          </div>

          <h4>Recherche :</h4>
          <div class="input-group mb-4">
            <input
              type="text"
              class="form-control"
              v-model="searchQuery"
              placeholder="Description..."
            />
            <span class="input-group-text"><i class="bi bi-search"></i></span>
          </div>
        </div>

        <!-- Tableau à droite -->
        <div class="col-md-9 data-section p-4">
          <h2 class="stats-title">Statistiques</h2>
          <div class="table-responsive">
            <table class="table table-hover stats-table">
              <thead>
                <tr>
                  <th @click="sortBy('ID')" class="sortable-header">
                    Identifiant
                    <i
                      v-if="sortKey==='ID'"
                      :class="sortDirection==='asc'?'bi bi-caret-up-fill':'bi bi-caret-down-fill'"
                    ></i>
                  </th>
                  <th @click="sortBy('Nom')" class="sortable-header">
                    Nom
                    <i
                      v-if="sortKey==='Nom'"
                      :class="sortDirection==='asc'?'bi bi-caret-up-fill':'bi bi-caret-down-fill'"
                    ></i>
                  </th>
                  <th @click="sortBy('Statut')" class="sortable-header">
                    Statut
                    <i
                      v-if="sortKey==='Statut'"
                      :class="sortDirection==='asc'?'bi bi-caret-up-fill':'bi bi-caret-down-fill'"
                    ></i>
                  </th>
                  <th @click="sortBy('Annee_implante')" class="sortable-header">
                    Année
                    <i
                      v-if="sortKey==='Annee_implante'"
                      :class="sortDirection==='asc'?'bi bi-caret-up-fill':'bi bi-caret-down-fill'"
                    ></i>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in displayedCounters" :key="c.ID">
                  <td>{{ c.ID }}</td>
                  <td>{{ c.Nom }}</td>
                  <td>{{ c.Statut }}</td>
                  <td>{{ c.Annee_implante }}</td>
                  <td class="actions-column">
                    <!-- Passages -->
                    <button
                      class="btn btn-sm btn-circle stats-btn"
                      data-bs-toggle="modal"
                      data-bs-target="#statsPassagesModal"
                      @click="openPassages(c)"
                    >
                      <i class="bi bi-graph-up"></i>
                    </button>
                    <!-- Carte -->
                    <button
                      class="btn btn-sm btn-circle map-btn"
                      data-bs-toggle="modal"
                      data-bs-target="#statsMapModal"
                      @click="openMap(c.ID)"
                    >
                      <i class="bi bi-geo-alt"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="pagination-container d-flex justify-content-center mt-4">
            <nav>
              <ul class="pagination">
                <li class="page-item">
                  <a class="page-link" href="#" @click.prevent="goToPage('first')"
                    >&lt;&lt;</a
                  >
                </li>
                <li
                  v-for="p in totalPages"
                  :key="p"
                  class="page-item"
                  :class="{ active: currentPage===p }"
                >
                  <a class="page-link" href="#" @click.prevent="goToPage(p)"
                    >{{ p }}</a
                  >
                </li>
                <li class="page-item">
                  <a class="page-link" href="#" @click.prevent="goToPage('last')"
                    >&gt;&gt;</a
                  >
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Vos modales Bootstrap T2, toujours présentes dans le DOM -->
    <StatistiquesMapModal
      :counters="filteredCounters"
      :activeId="selectedForMap"
    />
    <StatistiquesPassagesModal
      :counterId="selectedForPassages.id"
      :counterName="selectedForPassages.name"
    />
  </div>
</template>

<script setup>
import StatistiquesMapModal from '@/components/StatistiquesMapModal.vue'
import StatistiquesPassagesModal from '@/components/StatistiquesPassagesModal.vue'
import dataService from '@/services/dataService'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { computed, onMounted, ref, watch } from 'vue'

// Données et filtres
const counters         = ref([])
const districts        = ref([])
const selectedDistrict = ref('')
const yearFilter       = ref('')
const searchQuery      = ref('')
const sortKey          = ref('ID')
const sortDirection    = ref('asc')
const currentPage      = ref(1)
const itemsPerPage     = 10

// Sélection pour vos modales
const selectedForMap       = ref(null)
const selectedForPassages  = ref({ id: '', name: '' })

function openMap(id) {
  selectedForMap.value = id
}
function openPassages(counter) {
  selectedForPassages.value = {
    id:   String(counter.ID),
    name: String(counter.Nom)
  }
}

// Leaflet mini‐carte
let districtMap, territoryLayer
let geoTerritories = null

async function loadData() {
  counters.value = await dataService.loadCSV('compteurs.csv')
  const noms = counters.value.map(c => c.Arrondissement).filter(Boolean)
  districts.value = Array.from(new Set(noms)).sort()
}
async function loadTerritories() {
  geoTerritories = await dataService.loadGeoJSON('territoires.geojson')
}

function initDistrictMap() {
  districtMap = L.map('districtMap').setView([45.5300,-73.6773],9.2)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'© OpenStreetMap'
  }).addTo(districtMap)

  territoryLayer = L.geoJSON(geoTerritories, {
    style: feature => {
      const active = feature.properties.NOM === selectedDistrict.value
      return {
        color: '#006d5b',
        weight: active ? 2 : 1,
        fillColor: active ? '#00a896' : '#c0e6e0',
        fillOpacity: active ? 0.5 : 0.2
      }
    },
    onEachFeature: (feat, layer) => {
      layer.on('click', () => {
        selectedDistrict.value = feat.properties.NOM
      })
    }
  }).addTo(districtMap)
}

watch(selectedDistrict, () => {
  territoryLayer.eachLayer(layer => {
    const nom = layer.feature.properties.NOM
    layer.setStyle({
      fillColor: nom===selectedDistrict.value?'#00a896':'#c0e6e0',
      fillOpacity: nom===selectedDistrict.value?0.5:0.2
    })
  })
})

// Computed : filtrage/tri/pagination
const filteredCounters = computed(() => {
  let data = [...counters.value]
  if (selectedDistrict.value)
    data = data.filter(c => c.Arrondissement===selectedDistrict.value)
  if (yearFilter.value)
    data = data.filter(c => c.Annee_implante>=yearFilter.value)
  if (searchQuery.value) {
    const q=searchQuery.value.toLowerCase()
    data = data.filter(c => c.Nom?.toLowerCase().includes(q))
  }
  data.sort((a,b)=>{
    const A = a[sortKey.value], B = b[sortKey.value]
    if (A<B) return sortDirection.value==='asc'? -1:1
    if (A>B) return sortDirection.value==='asc'? 1:-1
    return 0
  })
  return data
})
const totalPages = computed(() =>
  Math.ceil(filteredCounters.value.length/itemsPerPage)
)
const displayedCounters = computed(()=>{
  const start=(currentPage.value-1)*itemsPerPage
  return filteredCounters.value.slice(start, start+itemsPerPage)
})

// Contrôles tableau
function sortBy(key) {
  if (sortKey.value===key) {
    sortDirection.value = sortDirection.value==='asc'?'desc':'asc'
  } else {
    sortKey.value=key
    sortDirection.value='asc'
  }
  currentPage.value=1
}
function goToPage(p) {
  if (p==='first')      currentPage.value=1
  else if (p==='last')  currentPage.value=totalPages.value
  else                  currentPage.value=p
}

// Montage
onMounted(async ()=>{
  await Promise.all([loadData(), loadTerritories()])
  initDistrictMap()
})
</script>

<style scoped>
.map-container {
  height: 220px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  
}
.filter-section {
  background-color: var(--color-background);
}
/* Conservez les styles existants pour .stats-table, pagination, etc. */
</style>
