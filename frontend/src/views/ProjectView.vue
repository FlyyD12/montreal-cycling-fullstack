<!-- views/ProjectView.vue -->

<template>
  <div class="project-page">
    <div class="container mt-4">
      <div class="row justify-content-center">
        <div class="col-lg-10">
          <div class="project-content p-4 rounded">
            <h1 class="text-center project-title mb-4">À propos du projet</h1>
            
            <div class="row mb-4">
              <div class="col-md-12">
                <p class="lead text-center project-intro">
                  Bienvenue sur cette plateforme dédiée à la mobilité durable en milieu urbain. Son objectif est de rendre les données cyclables de Montréal accessibles, pratiques et faciles à explorer.
                </p>
              </div>
            </div>

            <div class="row mb-5">
              <div class="col-md-12">
                <p class="project-description text-center">
                  Que vous soyez cycliste du quotidien, amateur de balades ou utilisateur occasionnel, notre site vous aide à planifier vos trajets, trouver des ateliers de réparation, localiser des fontaines d'eau ou encore découvrir des statistiques d'utilisation du réseau cyclable.
                </p>
              </div>
            </div>

            <div class="row mb-5">
              <div class="col-md-12 text-center">
                <img src="@/assets/cycliste-Montreal.jpg" alt="Illustration cycliste" class="img-fluid project-image">
              </div>
            </div>

            <div class="row mb-4">
              <div class="col-md-12">
                <h2 class="section-title">L'importance du vélo dans la mobilité urbaine</h2>
                <div class="importance-section p-3 rounded">
                  <p>Le vélo représente une solution essentielle pour répondre aux défis de mobilité urbaine du 21e siècle :</p>
                  <ul>
                    <li><strong>Écologique</strong> - Zéro émission, le vélo aide à réduire la pollution atmosphérique et sonore</li>
                    <li><strong>Économique</strong> - Mode de transport abordable, avec peu de frais d'entretien</li>
                    <li><strong>Santé</strong> - Activité physique quotidienne bénéfique pour la santé physique et mentale</li>
                    <li><strong>Efficacité</strong> - Souvent plus rapide que la voiture en milieu urbain congestionné</li>
                    <li><strong>Espace urbain</strong> - Nécessite moins d'infrastructure et d'espace que les véhicules motorisés</li>
                  </ul>
                  <p>En encourageant l'utilisation du vélo et en rendant les données cyclables accessibles, notre plateforme contribue à transformer la mobilité urbaine vers un modèle plus durable.</p>
                </div>
              </div>
            </div>

            <div class="row">
              <div class="col-md-12">
                <h2 class="section-title">Conception et développement</h2>
                <div class="team-section p-3 rounded">
                  <p>VéloFacile a été conçu dans un contexte universitaire à l'ÉTS et est présenté ici dans sa version portfolio.</p>
                  <div class="row justify-content-center text-center">
                    <div class="col-md-6">
                      <div class="team-member">
                        <div class="member-avatar">👨‍💻</div>
                        <h5>Alpha Diallo</h5>
                        <p>Conception et développement full-stack</p>
                      </div>
                    </div>
                  </div>
                  <p class="mt-4 text-center">Le projet met en pratique la conception d'API REST, l'authentification JWT, l'intégration de données géospatiales et la création d'interfaces cartographiques interactives.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Rien de spécifique 
</script>
