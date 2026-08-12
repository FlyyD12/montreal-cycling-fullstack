// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import des routes
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware de sécurité
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:5173'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite chaque IP à 100 requêtes par windowMs
});
app.use(limiter);

// Middleware pour parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/gti525/v1', apiRoutes);

// Route racine pour la documentation de l'API
app.get('/', (req, res) => {
  res.json({
    message: 'API Vélo Montréal - Livrable 3',
    version: '1.0.0',
    endpoints: {
      auth: {
        login: 'POST /auth/login',
        register: 'POST /auth/register',
        logout: 'POST /auth/logout'
      },
      api: {
        root: 'GET /gti525/v1/',
        compteurs: 'GET /gti525/v1/compteurs',
        compteur: 'GET /gti525/v1/compteurs/:id',
        passages: 'GET /gti525/v1/compteurs/:id/passages',
        pointsdinteret: 'GET|POST|PUT|DELETE /gti525/v1/pointsdinteret',
        pistes: 'GET /gti525/v1/pistes',
        territoires: 'GET /gti525/v1/territoires'
      }
    }
  });
});

// Gestionnaire d'erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Route 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
    console.log(`API disponible à: http://localhost:${PORT}/gti525/v1/`);
  });
}

module.exports = app;
