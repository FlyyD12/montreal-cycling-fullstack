<template>
  <div
    class="modal fade"
    id="statsPassagesModal"
    tabindex="-1"
    aria-labelledby="statsPassagesModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="statsPassagesModalLabel">
            Statistiques de passages : {{ counterName }}
          </h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Fermer"
          ></button>
        </div>
        <div class="modal-body">
          <div class="row">
            <!-- Graphique -->
            <div class="col-md-8">
              <canvas id="passagesChart"></canvas>
            </div>
            <!-- Contrôles -->
            <div class="col-md-4 ps-4">
              <h6>Période :</h6>
              <label>De :</label>
              <input
                type="date"
                v-model="dateFrom"
                class="form-control mb-3"
              />
              <label>À :</label>
              <input
                type="date"
                v-model="dateTo"
                class="form-control mb-4"
              />

              <h6>Intervalle :</h6>
              <div class="form-check">
                <input
                  id="int-jour"
                  class="form-check-input"
                  type="radio"
                  value="day"
                  v-model="interval"
                />
                <label class="form-check-label" for="int-jour">
                  Jour
                </label>
              </div>
              <div class="form-check">
                <input
                  id="int-semaine"
                  class="form-check-input"
                  type="radio"
                  value="week"
                  v-model="interval"
                />
                <label class="form-check-label" for="int-semaine">
                  Semaine
                </label>
              </div>
              <div class="form-check">
                <input
                  id="int-mois"
                  class="form-check-input"
                  type="radio"
                  value="month"
                  v-model="interval"
                />
                <label class="form-check-label" for="int-mois">
                  Mois
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            data-bs-dismiss="modal"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import dataService from '@/services/dataService'
import Chart from 'chart.js/auto'

const props = defineProps({
  counterId:   { type: [String, Number], required: true },
  counterName: { type: String,       required: true }
})

const dateFrom = ref('2022-01-01')
const dateTo   = ref('2022-01-31')
const interval  = ref('day')

let chartInstance = null
const rawData = ref([])

// 1) Appel API avec le paramètre `intervalle`
async function fetchData() {
  if (!props.counterId) return
  const response = await dataService.loadPassages(props.counterId, {
    debut: dateFrom.value,
    fin: dateTo.value,
    intervalle: interval.value
  })
  const arr = Array.isArray(response) ? response : response.data || []
  rawData.value = arr.map(item => {
    const periode = item.periode ?? item.date_heure ?? item.date
    const count = Number(
      item.total_passages ??
      item.nb_passages   ??
      item.count         ??
      0
    )
    return { periode, count }
  })
}

// 2) Prépare labels & valeurs directement sur les agrégats retournés
function getLabelsAndData() {
  const labels = rawData.value.map(r => {
    if (interval.value === 'day')   return r.periode.slice(0, 10)
    if (interval.value === 'week')  return r.periode       // ex: "2022-W02"
    if (interval.value === 'month') return r.periode.slice(0, 7) // "YYYY-MM"
    return r.periode
  })
  const data = rawData.value.map(r => r.count)
  return { labels, data }
}

// 3) Mise à jour du chart
function updateChart() {
  const { labels, data } = getLabelsAndData()
  chartInstance.data.labels = labels
  chartInstance.data.datasets[0].data = data
  chartInstance.update()
}

onMounted(() => {
  const modalEl = document.getElementById('statsPassagesModal')
  modalEl.addEventListener('shown.bs.modal', async () => {
    // Création du chart à la première ouverture
    if (!chartInstance) {
      const ctx = document.getElementById('passagesChart').getContext('2d')
      chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{
            label: 'Nombre de passages',
            data: [],
            backgroundColor: 'rgba(75, 192, 192, 0.6)'
          }]
        },
        options: {
          animation: false,
          scales: {
            x: {
              offset: true,
              ticks: {
                maxRotation: 45,
                minRotation: 45,
                autoSkip: true,
                autoSkipPadding: 10
              },
              grid: { display: false }
            },
            y: {
              beginAtZero: true,
              ticks: {
                // format local pour éviter les exposants
                callback: value => value.toLocaleString()
              }
            }
          },
          plugins: {
            legend: { display: false }
          }
        }
      })
    }

    // Chargement & update
    await fetchData()
    updateChart()
    setTimeout(() => chartInstance.resize(), 50)
  })
})

// Quand l'utilisateur change date ou intervalle, on recharge
watch([dateFrom, dateTo, interval], async () => {
  if (chartInstance) {
    await fetchData()
    updateChart()
  }
})
</script>

<style scoped>
/* styles hérités du global, rien de spécial ici */
</style>
