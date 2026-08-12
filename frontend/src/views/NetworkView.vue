<!-- views/NetworkView.vue -->

<template>
  <div class="network-page">
    <div class="container-fluid">
      <div class="row">
        <!-- Colonne de gauche : mini‑carte + select -->
        <div class="col-md-3 filter-section p-4">
          <h4>Arrondissement :</h4>
          <div id="districtMap" class="map-container mb-3"></div>
          <select class="form-select mb-4" v-model="selectedDistrict">
            <option value="">Tous</option>
            <option v-for="d in districts" :key="d" :value="d">{{ d }}</option>
          </select>

          <h4>Type du réseau :</h4>
          <div class="network-type-options mb-4">
            <div
              class="network-type-option"
              :class="{ selected: selectedNetworkType==='Saisonnier' }"
              @click="toggleSeasonal"
            >
              Saisonnier
            </div>
            <div
              class="network-type-option"
              :class="{ selected: selectedNetworkType==='4 saisons' }"
              @click="toggleFourSeasons"
            >
              4 saisons
            </div>
          </div>

          <h4>Type de voie :</h4>
          <div class="form-check mb-2">
            <input
              class="form-check-input"
              type="checkbox"
              id="protectedLanes"
              v-model="filterProtected"
              @change="showPaths"
            />
            <label class="form-check-label" for="protectedLanes">
              Voies protégées
            </label>
          </div>
          <div class="form-check mb-4">
            <input
              class="form-check-input"
              type="checkbox"
              id="sharedLanes"
              v-model="filterShared"
              @change="showPaths"
            />
            <label class="form-check-label" for="sharedLanes">
              Voies partagées
            </label>
          </div>

          <!-- T4.4: Période pour pistes populaires -->
          <h4>Pistes populaires :</h4>
          <div class="form-check mb-2">
            <input
              class="form-check-input"
              type="checkbox"
              id="showPopular"
              v-model="showPopularPistes"
              @change="togglePopularPistes"
            />
            <label class="form-check-label" for="showPopular">
              Afficher les pistes populaires
            </label>
          </div>
          
          <div v-if="showPopularPistes" class="date-range mb-4">
            <div class="date-input mb-2">
              <label>De :</label>
              <input 
                type="date" 
                class="form-control" 
                v-model="dateFrom" 
                @change="loadPopularPistes"
              />
            </div>
            <div class="date-input">
              <label>À :</label>
              <input 
                type="date" 
                class="form-control" 
                v-model="dateTo" 
                @change="loadPopularPistes"
              />
            </div>
          </div>
        </div>

        <!-- Colonne de droite : grande carte + stats + légende -->
        <div class="col-md-9 map-section p-4">
          <h2>Pistes et voies cyclables</h2>

          <!-- Indicateur de chargement -->
          <div v-if="loading" class="text-center mb-3">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Chargement...</span>
            </div>
            <p class="mt-2">{{ loadingMessage }}</p>
          </div>

          <!-- Alerte pour pistes populaires -->
          <div v-if="showPopularPistes && populariteData" class="alert alert-info mb-3">
            <h6><i class="bi bi-star-fill me-2"></i>Pistes populaires activées</h6>
            <p class="mb-1">
              <strong>Période :</strong> {{ formatDate(dateFrom) }} - {{ formatDate(dateTo) }}
            </p>
            <p class="mb-0" v-if="populariteData.arrondissementsPopulaires">
              <strong>Top 3 arrondissements :</strong>
              <span v-for="(arr, index) in populariteData.arrondissementsPopulaires" :key="index">
                {{ arr.nom }} ({{ Math.round(arr.popularite) }} passages/compteur){{ index < populariteData.arrondissementsPopulaires.length - 1 ? ', ' : '' }}
              </span>
            </p>
          </div>

          <div class="position-relative mb-3">
            <div id="cycleMap" class="cycle-map"></div>
            <button class="info-btn" @click="openModal">i</button>
          </div>

          <!-- Section des détails avec arrondissements populaires -->
          <div class="network-details mt-3 p-3 bg-light rounded">
            <h4>Détails :</h4>
            <div class="row">
              <div class="col-md-6">
                <p><strong>Nombre de pistes :</strong> {{ networkStats.count }}</p>
                <p><strong>Nombre de Km :</strong> {{ networkStats.length }}</p>
                <p v-if="showPopularPistes" class="text-info">
                  <i class="bi bi-info-circle"></i> Mode pistes populaires actif
                </p>
              </div>
              
              <!-- Nouveau : Affichage des arrondissements populaires -->
              <div v-if="showPopularPistes && populariteData?.statistiquesDetaillees" class="col-md-6">
                <h5 class="text-primary">Arrondissements populaires :</h5>
                <div v-for="arr in populariteData.statistiquesDetaillees" :key="arr.arrondissement" class="mb-2">
                  <div class="d-flex justify-content-between">
                    <span class="fw-bold">{{ arr.arrondissement }}</span>
                    <span class="badge bg-primary">{{ arr.nbPistes }} pistes</span>
                  </div>
                  <small class="text-muted">{{ (arr.longueurTotale / 1000).toFixed(1) }} km total</small>
                </div>
              </div>
            </div>
          </div>

          <!-- Légende "modal" -->
          <div v-if="showModal" class="modal-overlay">
            <div class="modal-content p-4 rounded shadow-sm">
              <button class="btn round-close-btn" @click="closeModal">×</button>
              <h4 class="bold-title">Légende</h4>
              <div class="separator-top legend-content">
                <div class="legend-label">
                  <div><span class="legend-rev"></span> REV</div>
                  <div><span class="legend-shared-route"></span> Voie partagée</div>
                  <div><span class="legend-protected-route"></span> Voie protégée</div>
                  <div><span class="legend-polyvalent-path"></span> Sentier polyvalent</div>
                  <div v-if="showPopularPistes"><span class="legend-popular"></span> Zone populaire</div>
                </div>
                <div>
                  <h5 class="bold-title">Le REV</h5>
                  <p>Pistes protégées reliant divers points d'intérêt sur l'île de Montréal.</p>
                  <h5 class="bold-title">Voie partagée</h5>
                  <p>Pistes délimitées ou rues partagées.</p>
                  <h5 class="bold-title">Voie protégée</h5>
                  <p>Voie distincte, séparée physiquement.</p>
                  <h5 class="bold-title">Sentier polyvalent</h5>
                  <p>Chemin hors chaussée, piétons & cyclistes.</p>
                  <div v-if="showPopularPistes">
                    <h5 class="bold-title">Zones populaires</h5>
                    <p>Pistes situées dans les 3 arrondissements les plus fréquentés.</p>
                  </div>
                </div>
              </div>
              <div class="separator-end">
                <button class="btn btn-primary mt-3" @click="closeModal">Fermer</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import dataService from '@/services/dataService'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { onMounted, ref, watch } from 'vue'

export default {
  name: 'NetworkView',
  setup() {
    const districts = ref([])
    const selectedDistrict = ref('')
    const selectedNetworkType = ref('Saisonnier')
    const filterProtected = ref(false)
    const filterShared = ref(false)
    const showPopularPistes = ref(false)
    const dateFrom = ref('2023-06-01')
    const dateTo = ref('2023-08-31')
    const showModal = ref(false)
    const loading = ref(false)
    const loadingMessage = ref('')
    const networkStats = ref({ count: 0, length: 0 })
    const populariteData = ref(null)

    let mapDistrict, territoryLayer, mapMain, layerGroup
    let territoriesGeo, cycleNetwork

    async function loadData() {
      try {
        loading.value = true
        loadingMessage.value = 'Chargement des territoires...'

        // Charger les territoires pour la mini-carte et les filtres
        territoriesGeo = await dataService.loadTerritoires({ format: 'geojson' })
        districts.value = territoriesGeo.features
          .map(f => f.properties.NOM)
          .sort()

        loadingMessage.value = 'Chargement des pistes cyclables...'
        
        // Charger les pistes (version normale au début)
        await loadNormalPistes()
        
        loadingMessage.value = 'Initialisation des cartes...'
        initMaps()
        
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      } finally {
        loading.value = false
        loadingMessage.value = ''
      }
    }

    async function loadNormalPistes() {
      try {
        const pistesData = await dataService.loadPistes()
        
        // Adapter au format attendu (comme l'ancien GeoJSON)
        cycleNetwork = pistesData
        populariteData.value = null
        
        calcStats(cycleNetwork.features)
        console.log('✅ Pistes normales chargées:', cycleNetwork.features.length)
      } catch (error) {
        console.error('Erreur lors du chargement des pistes:', error)
        throw error
      }
    }

    async function loadPopularPistes() {
      if (!showPopularPistes.value || !dateFrom.value || !dateTo.value) return
      
      try {
        loading.value = true
        loadingMessage.value = 'Chargement des pistes populaires...'
        
        console.log('🔄 Chargement avec dates:', { dateFrom: dateFrom.value, dateTo: dateTo.value })
        
        const pistesData = await dataService.loadPistes({
          populaireDebut: dateFrom.value,
          populaireFin: dateTo.value
        })
        
        console.log('📦 Données reçues:', pistesData.metadata)
        
        // Adapter au format attendu
        cycleNetwork = pistesData
        populariteData.value = pistesData.metadata
        
        calcStats(cycleNetwork.features)
        
        if (mapMain && layerGroup) {
          showPaths()
        }
        
        console.log('✅ Pistes populaires chargées:', cycleNetwork.features.length)
      } catch (error) {
        console.error('Erreur lors du chargement des pistes populaires:', error)
      } finally {
        loading.value = false
        loadingMessage.value = ''
      }
    }

    function calcStats(feats) {
      networkStats.value.count = feats.length
      let sum = 0
      feats.forEach(f => {
        const Lg = parseFloat(f.properties.LONGUEUR)
        if (!isNaN(Lg)) sum += Lg
      })
      networkStats.value.length = (sum / 1000).toFixed(2)
    }

    function initMaps() {
      // Mini-carte des arrondissements (identique à l'ancien)
      mapDistrict = L.map('districtMap').setView([45.5017, -73.5673], 9)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(mapDistrict)
      
      territoryLayer = L.geoJSON(territoriesGeo, {
        style: styleDistrict,
        onEachFeature: (feat, layer) =>
          layer.on('click', () => selectedDistrict.value = feat.properties.NOM)
      }).addTo(mapDistrict)

      // Carte principale (identique à l'ancien)
      mapMain = L.map('cycleMap').setView([45.5017, -73.5673], 11)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(mapMain)
      layerGroup = L.layerGroup().addTo(mapMain)
      showPaths()
    }

    function styleDistrict(f) {
      const act = f.properties.NOM === selectedDistrict.value
      return {
        color: '#006d5b',
        weight: act ? 2 : 1,
        fillColor: act ? '#00a896' : '#c0e6e0',
        fillOpacity: act ? 0.5 : 0.2
      }
    }

    function showPaths() {
      if (!layerGroup || !cycleNetwork) return
      
      layerGroup.clearLayers()
      let feats = cycleNetwork.features

      if (selectedDistrict.value) {
        feats = feats.filter(f =>
          f.properties.NOM_ARR_VILLE_DESC === selectedDistrict.value
        )
      }
      calcStats(feats)

      feats.forEach(f => {
        const p = f.properties
        let color = ''
        let weight = 2.5
        
        const onlyShowProtected = filterProtected.value && !filterShared.value
        const onlyShowShared = filterShared.value && !filterProtected.value

        // Logique de couleur identique à l'ancien
        if (['EV','PE','TR'].includes(p.REV_AVANCEMENT_CODE)) {
          color = '#2AC7DD'
        }
        else if (p.AVANCEMENT_CODE === 'E' && ['1','3','8','9'].includes(p.TYPE_VOIE_CODE)) {
          color = '#84CA4B'
        }
        else if (p.AVANCEMENT_CODE === 'E' && ['4','5','6'].includes(p.TYPE_VOIE_CODE)) {
          color = '#025D29'
        }
        else if (p.AVANCEMENT_CODE === 'E' && p.TYPE_VOIE_CODE === '7') {
          color = '#B958D9'
        } else return

        if (selectedNetworkType.value === '4 saisons' && p.SAISONS4 !== 'Oui') return

        if (onlyShowProtected && color !== '#025D29') return
        if (onlyShowShared && color !== '#84CA4B') return

        // Mise en évidence des pistes populaires
        if (showPopularPistes.value && p.POPULAIRE) {
          weight = 4
          // Changer la couleur pour les pistes populaires
          color = '#FFD700'
        }

        // Dessiner exactement comme l'ancien
        const latlngs = f.geometry.coordinates.map(c => [c[1], c[0]])
        const polyline = L.polyline(latlngs, { color, weight })
        
        // Popup amélioré
        polyline.bindPopup(`
          <strong>${p.NOM_ARR_VILLE_DESC}</strong><br>
          Type: ${p.TYPE_VOIE_DESC}<br>
          Longueur: ${Math.round(p.LONGUEUR)}m<br>
          ${p.SAISONS4 === 'Oui' ? '4 saisons ✅' : 'Saisonnier'}<br>
          ${showPopularPistes.value && p.POPULAIRE ? '<span class="text-warning">⭐ Zone populaire</span>' : ''}
        `)
        
        polyline.addTo(layerGroup)
      })
    }

    async function togglePopularPistes() {
      if (showPopularPistes.value) {
        await loadPopularPistes()
      } else {
        await loadNormalPistes()
        if (mapMain && layerGroup) {
          showPaths()
        }
      }
    }

    function formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString('fr-CA')
    }

    // Fonctions identiques à l'ancien
    const toggleSeasonal = () => { 
      selectedNetworkType.value = 'Saisonnier'; 
      showPaths() 
    }
    const toggleFourSeasons = () => { 
      selectedNetworkType.value = '4 saisons'; 
      showPaths() 
    }

    const openModal = () => showModal.value = true
    const closeModal = () => showModal.value = false

    // Watcher identique à l'ancien
    watch(selectedDistrict, () => {
      territoryLayer.eachLayer(l => {
        const nom = l.feature.properties.NOM
        l.setStyle({
          fillColor: nom === selectedDistrict.value ? '#00a896' : '#c0e6e0',
          fillOpacity: nom === selectedDistrict.value ? 0.5 : 0.2
        })
      })
      showPaths()
    })

    onMounted(loadData)

    return {
      districts,
      selectedDistrict,
      selectedNetworkType,
      filterProtected,
      filterShared,
      showPopularPistes,
      dateFrom,
      dateTo,
      showModal,
      loading,
      loadingMessage,
      networkStats,
      populariteData,
      openModal,
      closeModal,
      toggleSeasonal,
      toggleFourSeasons,
      togglePopularPistes,
      showPaths,
      formatDate,
      loadPopularPistes
    }
  }
}
</script>

<style scoped>
.map-container {
  height: 220px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.cycle-map {
  height: 500px;
  width: 100%;
  border-radius: 5px;
}

.filter-section {
  background-color: var(--color-background);
}

.network-type-options {
  display: flex;
  gap: 10px;
}

.network-type-option {
  flex: 1;
  padding: 8px;
  text-align: center;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.network-type-option.selected {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.info-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  border-radius: 50%;
  background-color: var(--color-primary);
  width: 36px;
  height: 36px;
  font-weight: bold;
  font-size: 20px;
  z-index: 1001;
  color: white;
  border: none;
  cursor: pointer;
}

.round-close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  border-radius: 50%;
  background-color: var(--color-background);
  width: 36px;
  height: 36px;
  font-size: 12px;
  color: #555;
  z-index: 1001;
  border: none;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  max-width: 800px;
  width: 100%;
  background-color: var(--color-background);
  color: var(--color-primary);
}

.separator-top {
  border-top: 2px solid rgb(0,0,0);
  margin-top: 1rem;
  padding-top: 1rem;
}

.separator-end {
  border-top: 2px solid rgb(0,0,0);
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
}

.bold-title {
  color: var(--color-primary);
  font-weight: bold;
}

.legend-rev,
.legend-shared-route,
.legend-protected-route,
.legend-polyvalent-path,
.legend-popular {
  display: inline-block;
  width: 100px;
  height: 20px;
  vertical-align: middle;
  margin-right: 8px;
}

.legend-rev             { background-color: #2AC7DD; }
.legend-shared-route    { background-color: #84CA4B; }
.legend-protected-route { background-color: #025D29; }
.legend-polyvalent-path { background-color: #B958D9; }
.legend-popular         { background-color: #FFD700; }

.legend-label {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.legend-content {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
  padding-top: 1rem;
}

.alert-info {
  border-left: 4px solid #0dcaf0;
}

.spinner-border {
  width: 1.5rem;
  height: 1.5rem;
}

.badge {
  font-size: 0.75em;
}

.text-muted {
  color: #6c757d !important;
}
</style>