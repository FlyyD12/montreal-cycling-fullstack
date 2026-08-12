<template>
  <div
    class="modal fade"
    id="statsMapModal"
    tabindex="-1"
    aria-labelledby="statsMapModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="statsMapModalLabel">
            Carte des compteurs
          </h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Fermer"
          ></button>
        </div>
        <div class="modal-body p-0">
          <div id="statsMap" style="height:600px; width:100%;"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { onMounted, watch } from 'vue'

// Imports des icônes placées dans src/assets/markers
import blueIconUrl from '@/assets/markers/marker-icon-blue.png'
import redIconUrl from '@/assets/markers/marker-icon-red.png'
import shadowIconUrl from '@/assets/markers/marker-shadow.png'

// eslint-disable-next-line no-undef
const props = defineProps({
  counters: { type: Array, required: true },
  activeId: { type: [String, Number], default: null }
})

let map, layerGroup

// Création des icônes Leaflet
const defaultIcon = L.icon({
  iconUrl:   blueIconUrl,
  shadowUrl: shadowIconUrl,
  iconSize:   [25, 41],
  iconAnchor: [12, 41],
  popupAnchor:[1, -34]
})
const activeIcon = L.icon({
  iconUrl:   redIconUrl,
  shadowUrl: shadowIconUrl,
  iconSize:   [25, 41],
  iconAnchor: [12, 41],
  popupAnchor:[1, -34]
})

function updateMarkers() {
  layerGroup.clearLayers()
  props.counters.forEach(c => {
    const { Latitude: lat, Longitude: lng, ID, Nom } = c
    if (typeof lat === 'number' && typeof lng === 'number') {
      L.marker([lat, lng], {
        icon: String(ID) === String(props.activeId)
              ? activeIcon
              : defaultIcon
      })
      .bindPopup(`${Nom} (${ID})`)
      .addTo(layerGroup)
    }
  })
}

onMounted(() => {
  map = L.map('statsMap').setView([45.5017, -73.5673], 12)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)

  layerGroup = L.layerGroup().addTo(map)
  updateMarkers()

  // Quand la modale est affichée, invalider la taille et recentrer
  const modalEl = document.getElementById('statsMapModal')
  modalEl.addEventListener('shown.bs.modal', () => {
    setTimeout(() => {
      map.invalidateSize()
      const active = props.counters.find(c => String(c.ID) === String(props.activeId))
      const lat = active?.Latitude, lng = active?.Longitude
      if (typeof lat === 'number' && typeof lng === 'number') {
        map.setView([lat, lng], map.getZoom())
      }
    }, 100)
  })
})

watch(
  () => [props.counters, props.activeId],
  () => updateMarkers(),
  { deep: true }
)
</script>

<style scoped>
/*.filter-section {  }*/
</style>
