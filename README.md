# VéloFacile — Réseau cyclable de Montréal

Application web full-stack permettant d'explorer le réseau cyclable montréalais, de consulter les compteurs de vélos et de visualiser des points d'intérêt sur des cartes interactives.

> Conception et développement : **Alpha Diallo**  
> Version portfolio issue d'un projet universitaire réalisé à l'École de technologie supérieure (ÉTS).

![Aperçu visuel de VéloFacile](frontend/src/assets/ladyOnBike.jpg)

## Aperçu

VéloFacile centralise plusieurs jeux de données ouvertes de la Ville de Montréal dans une interface cartographique. Le frontend Vue consomme une API REST Express qui interroge une base MariaDB/MySQL et protège les opérations d'écriture avec une authentification JWT.

## Fonctionnalités

- Carte interactive du réseau cyclable avec Leaflet
- Filtres par arrondissement, saison et type de voie
- Consultation des compteurs et statistiques de passages
- Agrégation des passages par jour, semaine ou mois
- Localisation des fontaines et autres points d'intérêt
- Création, modification et suppression de points d'intérêt authentifiées
- Inscription, connexion et révocation de session avec JWT
- Validation des données, limitation du débit et en-têtes de sécurité

## Architecture

```text
Navigateur
   │
   ▼
Vue 3 + Leaflet + Chart.js
   │  HTTP/JSON
   ▼
Node.js + Express
   │
   ▼
MariaDB / MySQL
```

```text
.
├── frontend/                  # Interface Vue 3
│   └── src/
│       ├── components/        # Modales, formulaires et cartes
│       ├── services/          # Client de l'API REST
│       └── views/             # Pages principales
└── backend/                   # API Express
    ├── config/                # Connexion à la base de données
    ├── controllers/           # Logique métier
    ├── middleware/            # Authentification JWT
    ├── routes/                # Routes REST
    └── data/                  # Sources CSV et GeoJSON
```

## Technologies

| Couche | Technologies |
|---|---|
| Frontend | Vue 3, Vue Router, Leaflet, Chart.js, Bootstrap 5 |
| Backend | Node.js, Express, Joi, Helmet, express-rate-limit |
| Authentification | JWT, bcrypt |
| Données | MariaDB/MySQL, GeoJSON, CSV, OpenStreetMap |

## API principale

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/gti525/v1/compteurs` | Liste filtrée et paginée des compteurs |
| `GET` | `/gti525/v1/compteurs/:id/passages` | Statistiques de passages |
| `GET` | `/gti525/v1/pistes` | Réseau cyclable au format GeoJSON |
| `GET` | `/gti525/v1/territoires` | Territoires et arrondissements |
| `GET` | `/gti525/v1/pointsdinteret` | Points d'intérêt |
| `POST` | `/auth/register` | Création d'un compte |
| `POST` | `/auth/login` | Authentification |
| `POST/PUT/DELETE` | `/gti525/v1/pointsdinteret` | Gestion protégée des points d'intérêt |

## Installation locale

### Prérequis

- Node.js 18 ou une version plus récente
- npm
- MariaDB ou MySQL

### 1. Cloner le projet

```bash
git clone https://github.com/FlyyD12/montreal-cycling-fullstack.git
cd montreal-cycling-fullstack
```

### 2. Configurer et démarrer l'API

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Adaptez les variables de `.env` à votre instance MariaDB/MySQL. L'API est ensuite disponible sur `http://localhost:8080`.

### 3. Démarrer le frontend

Dans un second terminal :

```bash
cd frontend
npm install
npm run serve
```

L'interface est disponible sur `http://localhost:8081` ou sur le port indiqué par Vue CLI.

Pour utiliser une autre URL d'API, créez `frontend/.env.local` :

```env
VUE_APP_API_URL=http://localhost:8080/gti525/v1
```

## Vérifications

```bash
# Frontend
cd frontend
npm run lint
npm run build

# Backend
cd ../backend
npm test
```

## Données

Le dépôt contient des échantillons représentatifs afin de rester léger et simple à cloner. Les exports complets sont disponibles dans le portail de données ouvertes de la Ville de Montréal :

- [Compteurs cyclistes permanents](https://donnees.montreal.ca/fr/dataset/cyclistes)
- [Réseau cyclable](https://donnees.montreal.ca/dataset/pistes-cyclables)
- [Fontaines à boire extérieures](https://donnees.montreal.ca/dataset/fontaines-a-boire-eau-exterieures)

Consultez [`backend/data/README.md`](backend/data/README.md) pour le contenu exact des échantillons. Les cartes utilisent les tuiles OpenStreetMap. Les données conservent leurs conditions d'utilisation respectives; la licence MIT du dépôt couvre le code source.

## Auteur

**Alpha Diallo** — étudiant en génie logiciel à l'ÉTS  
GitHub : [@FlyyD12](https://github.com/FlyyD12)

## Licence

Le code source est distribué sous licence MIT. Consultez [LICENSE](LICENSE).
