<!-- components/PointsMapModal.vue -->
<template>
  <div
    class="modal fade"
    id="pointsMapModal"
    tabindex="-1"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Carte des points d'intérêt</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
          ></button>
        </div>
        <div class="modal-body p-0">
          <div id="pointsMap" style="height:600px;"></div>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            data-bs-dismiss="modal"
          >Fermer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { onMounted } from 'vue'

export default {
  name: 'PointsMapModal',
  props: {
    pois:      { type: Array, required: true },
    activePoi: { type: Object, default: null }
  },
  setup(props) {
    let map, layerGroup

    onMounted(() => {
      const modalEl = document.getElementById('pointsMapModal')
      modalEl.addEventListener('shown.bs.modal', () => {
        if (!map) {
          map = L.map('pointsMap').setView([45.5300, -73.6773], 11)
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map)
          layerGroup = L.layerGroup().addTo(map)
        }

        // Icône bleue pour les points normaux
        const blueIcon = L.icon({
          iconUrl:    'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
          shadowUrl:  'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
          iconSize:   [25, 41],
          iconAnchor: [12, 41],
          popupAnchor:[1, -34],
          shadowSize: [41, 41]
        })

        // Icône rouge personnalisée pour le point actif
        const redIcon = L.icon({
          iconUrl: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41" width="25" height="41">
              <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.1 12.5 28.5 12.5 28.5s12.5-20.4 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="#dc3545"/>
              <circle cx="12.5" cy="12.5" r="6" fill="white"/>
              <circle cx="12.5" cy="12.5" r="3" fill="#dc3545"/>
            </svg>
          `),
          shadowUrl:  'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
          iconSize:   [25, 41],
          iconAnchor: [12, 41],
          popupAnchor:[1, -34],
          shadowSize: [41, 41]
        })

        // Vider la couche
        layerGroup.clearLayers()

        let activePoiMarker = null

        // Ajouter tous les POI
        props.pois.forEach(poi => {
          if (!poi.Latitude || !poi.Longitude) return
          const latlng = [parseFloat(poi.Latitude), parseFloat(poi.Longitude)]

          // Vérifier si c'est le POI actif
          const isActive = props.activePoi &&
            poi.Nom === props.activePoi.Nom &&
            parseFloat(poi.Latitude) === parseFloat(props.activePoi.Latitude) &&
            parseFloat(poi.Longitude) === parseFloat(props.activePoi.Longitude)

          if (isActive) {
            // POI actif avec icône rouge distincte
            activePoiMarker = L.marker(latlng, { icon: redIcon })
              .bindPopup(`<b>${poi.Nom}</b><br/>${poi.Type}<br/>${poi.Adresse}`)
              .addTo(layerGroup)
          } else {
            // Autres POI avec icône bleue
            L.marker(latlng, { icon: blueIcon })
              .bindPopup(`${poi.Nom}<br/>${poi.Type}<br/>${poi.Adresse}`)
              .addTo(layerGroup)
          }
        })

        // Ajuster la vue de la carte
        if (activePoiMarker) {
          // Si on a un POI actif, centrer sur lui avec un zoom approprié
          map.setView(activePoiMarker.getLatLng(), 15)
          // Ouvrir automatiquement le popup du POI actif
          setTimeout(() => {
            activePoiMarker.openPopup()
          }, 100)
        } else {
          // Sinon, ajuster pour voir tous les marqueurs
          const layers = layerGroup.getLayers()
          if (layers.length > 0) {
            const fg = L.featureGroup(layers)
            map.fitBounds(fg.getBounds().pad(0.1))
          }
        }

        // Redimensionner la carte après ouverture de la modale
        setTimeout(() => {
          map.invalidateSize()
        }, 150)
      })
    })
  }
}
</script>

<style scoped>
#pointsMap { width:100%; }
</style>