<!-- views/HomeView.vue -->
<template>
  <div class="home">
    <div class="container-fluid p-4">
      <div class="row align-items-center home-content">
        <div class="col-md-6">
          <h1 class="heading">Pédalez vers l'avenir:<br>Itinéraires et stats vélo!</h1>
          <button class="btn btn-primary btn-en-savoir-plus" @click="goToProject">En savoir plus</button>
          <p class="mt-3">Vous avez déjà un compte ? <a href="#" class="connect-link" @click.prevent="showLogin">Connectez-vous.</a></p>
        </div>
        <div class="col-md-6">
          <div class="illustration-container">
            <img src="@/assets/ladyOnBike.jpg" alt="Illustration vélo" class="img-fluid cycling-img">
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter()
const emit = defineEmits(['login-required'])

const goToProject = () => {
  router.push('/project')
}

const showLogin = () => {
  emit('login-required')
}
</script>
