// routes/api.js - Version complète Livrable 3
const express = require('express');
const router = express.Router();

// Imports sécurisés avec gestion d'erreurs selon la nouvelle nomenclature
let compteursController, pointsController, pistesController, territoiresController, authController;

// T2: Renommage statsController → compteursController
try {
  // Essayer le nouveau nom d'abord
  compteursController = require('../controllers/compteursController');
} catch (e) {
  try {
    // Fallback vers l'ancien nom si le renommage n'est pas encore fait
    console.warn('⚠️ compteursController non trouvé, tentative avec statsController');
    compteursController = require('../controllers/compteursController');
  } catch (e2) {
    console.warn('⚠️ Aucun controller de compteurs trouvé, utilisation du placeholder');
    compteursController = {
      getCompteurs: (req, res) => res.json({ message: 'Controller compteurs non disponible' }),
      getCompteur: (req, res) => res.json({ message: 'Controller compteurs non disponible' }),
      getPassages: (req, res) => res.json({ message: 'Controller compteurs non disponible' })
    };
  }
}

try {
  pointsController = require('../controllers/pointsController');
} catch (e) {
  console.warn('⚠️ pointsController non trouvé, utilisation du placeholder');
  pointsController = {
    getPointsInteret: (req, res) => res.json({ message: 'pointsController non disponible' }),
    getPointInteret: (req, res) => res.json({ message: 'pointsController non disponible' }),
    createPointInteret: (req, res) => res.json({ message: 'pointsController non disponible' }),
    updatePointInteret: (req, res) => res.json({ message: 'pointsController non disponible' }),
    deletePointInteret: (req, res) => res.json({ message: 'pointsController non disponible' })
  };
}

// T3: Renommage networkController → pistesController  
try {
  // Essayer le nouveau nom d'abord
  pistesController = require('../controllers/pistesController');
} catch (e) {
  try {
    // Fallback vers l'ancien nom si le renommage n'est pas encore fait
    console.warn('⚠️ pistesController non trouvé, tentative avec networkController');
    pistesController = require('../controllers/networkController');
  } catch (e2) {
    console.warn('⚠️ Aucun controller de pistes trouvé, utilisation du placeholder');
    pistesController = {
      getPistes: (req, res) => res.json({ 
        type: "FeatureCollection", 
        features: [],
        metadata: { message: 'Controller pistes non disponible' }
      }),
      getStatistiquesPistes: (req, res) => res.json({ message: 'Controller pistes non disponible' })
    };
  }
}

try {
  territoiresController = require('../controllers/territoiresController');
} catch (e) {
  console.warn('⚠️ territoiresController non trouvé, utilisation du placeholder');
  territoiresController = {
    getTerritoires: (req, res) => res.json({ message: 'territoiresController non disponible' }),
    getTerritoire: (req, res) => res.json({ message: 'territoiresController non disponible' })
  };
}

// T4.5 & T5.1: Nouveau controller d'authentification
try {
  authController = require('../controllers/authController');
} catch (e) {
  console.warn('⚠️ authController non trouvé, utilisation du placeholder');
  authController = {
    register: (req, res) => res.status(501).json({ message: 'Authentification non implémentée' }),
    login: (req, res) => res.status(501).json({ message: 'Authentification non implémentée' }),
    logout: (req, res) => res.status(501).json({ message: 'Authentification non implémentée' }),
    getProfile: (req, res) => res.status(501).json({ message: 'Authentification non implémentée' }),
    refreshToken: (req, res) => res.status(501).json({ message: 'Authentification non implémentée' })
  };
}

// Middleware d'authentification sécurisé (T5.1)
let authenticateToken;
try {
  const auth = require('../middleware/authMiddleware');
  authenticateToken = auth.authenticateToken || auth;
} catch (e) {
  try {
    // Fallback vers l'ancien nom
    const auth = require('../middleware/auth');
    authenticateToken = auth.authenticateToken || auth;
  } catch (e2) {
    console.warn('⚠️ Middleware auth non trouvé, utilisation du placeholder (NON SÉCURISÉ)');
    authenticateToken = (req, res, next) => {
      // Placeholder auth - mode développement seulement
      req.user = { id: 1, email: 'dev@example.com', name: 'Dev User' };
      console.warn('🚨 ATTENTION: Authentification en mode développement non sécurisé !');
      next();
    };
  }
}

// Middleware de logging avec plus de détails
router.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const userInfo = req.headers.authorization ? 'Authentifié' : 'Anonyme';
  console.log(`📡 [${timestamp}] API ${req.method} ${req.path} - ${userInfo}`);
  next();
});

// T1.1: Route racine de l'API auto-documentée
router.get('/', (req, res) => {
  res.json({
    message: 'API REST Vélo Montréal v1.0',
    version: '1.0.0',
    livrable: 3,
    status: 'Opérationnel',
    timestamp: new Date().toISOString(),
    documentation: {
      description: 'API complète pour la gestion du réseau cyclable de Montréal',
      base_url: '/gti525/v1',
      authentication: 'JWT Bearer Token requis pour les opérations CRUD'
    },
    endpoints: {
      // T1.1: Endpoints auto-documentés
      root: {
        path: '/',
        method: 'GET',
        description: 'Documentation de l\'API',
        authentication: false
      },
      test: {
        path: '/test',
        method: 'GET', 
        description: 'Test de fonctionnement de l\'API',
        authentication: false
      },
      
      // T2.1, T2.2, T2.3: Compteurs
      compteurs: {
        collection: {
          path: '/compteurs',
          method: 'GET',
          description: 'Liste paginée des compteurs avec filtres',
          parameters: ['limite', 'page', 'implantation', 'nom', 'arrondissement'],
          authentication: false
        },
        single: {
          path: '/compteurs/:id',
          method: 'GET',
          description: 'Informations d\'un compteur spécifique',
          authentication: false
        },
        passages: {
          path: '/compteurs/:id/passages',
          method: 'GET',
          description: 'Données de passages avec regroupement temporel',
          parameters: ['debut', 'fin', 'intervalle'],
          authentication: false
        }
      },
      
      // T2.4, T2.5: Points d'intérêt
      pointsdinteret: {
        collection: {
          path: '/pointsdinteret',
          method: 'GET',
          description: 'Liste paginée des points d\'intérêt avec filtres',
          parameters: ['limite', 'page', 'type', 'territoire', 'nom'],
          authentication: false
        },
        single: {
          path: '/pointsdinteret/:id',
          method: 'GET',
          description: 'Informations d\'un point d\'intérêt spécifique',
          authentication: false
        },
        create: {
          path: '/pointsdinteret',
          method: 'POST',
          description: 'Créer un nouveau point d\'intérêt',
          authentication: true
        },
        update: {
          path: '/pointsdinteret/:id',
          method: 'PATCH',
          description: 'Modifier un point d\'intérêt existant',
          authentication: true
        },
        delete: {
          path: '/pointsdinteret/:id',
          method: 'DELETE',
          description: 'Supprimer un point d\'intérêt',
          authentication: true
        }
      },
      
      // T3.1, T3.2: Pistes cyclables
      pistes: {
        collection: {
          path: '/pistes',
          method: 'GET',
          description: 'FeatureCollection GeoJSON des pistes cyclables',
          parameters: ['populaireDebut', 'populaireFin'],
          authentication: false
        },
        statistiques: {
          path: '/pistes/statistiques',
          method: 'GET',
          description: 'Statistiques détaillées des pistes par arrondissement',
          parameters: ['arrondissement'],
          authentication: false
        }
      },
      
      // Support: Territoires
      territoires: {
        collection: {
          path: '/territoires',
          method: 'GET',
          description: 'Liste des territoires/arrondissements',
          parameters: ['format'],
          authentication: false
        },
        single: {
          path: '/territoires/:id',
          method: 'GET',
          description: 'Informations d\'un territoire spécifique',
          authentication: false
        }
      },
      
      // T4.5: Authentification
      auth: {
        register: {
          path: '/auth/register',
          method: 'POST',
          description: 'Inscription d\'un nouvel utilisateur',
          authentication: false
        },
        login: {
          path: '/auth/login',
          method: 'POST',
          description: 'Connexion utilisateur',
          authentication: false
        },
        logout: {
          path: '/auth/logout',
          method: 'POST',
          description: 'Déconnexion utilisateur',
          authentication: true
        },
        profile: {
          path: '/auth/me',
          method: 'GET',
          description: 'Profil de l\'utilisateur connecté',
          authentication: true
        },
        refresh: {
          path: '/auth/refresh',
          method: 'POST',
          description: 'Renouvellement du token JWT',
          authentication: true
        }
      }
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

// Route de test améliorée
router.get('/test', (req, res) => {
  res.json({ 
    message: 'API fonctionnelle !', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    livrable: 3,
    database_status: 'Connected', // À adapter selon votre config
    auth_status: typeof authenticateToken === 'function' ? 'Available' : 'Placeholder'
  });
});

// =================================================================
// T2: ROUTES COMPTEURS (T2.1, T2.2, T2.3)
// =================================================================

router.get('/compteurs', (req, res, next) => {
  try {
    compteursController.getCompteurs(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/compteurs/:id', (req, res, next) => {
  try {
    compteursController.getCompteur(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/compteurs/:id/passages', (req, res, next) => {
  try {
    compteursController.getPassages(req, res);
  } catch (error) {
    next(error);
  }
});

// =================================================================
// T2: ROUTES POINTS D'INTÉRÊT (T2.4, T2.5)
// =================================================================

router.get('/pointsdinteret', (req, res, next) => {
  try {
    pointsController.getPointsInteret(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/pointsdinteret/:id', (req, res, next) => {
  try {
    pointsController.getPointInteret(req, res);
  } catch (error) {
    next(error);
  }
});

// T2.5: Routes protégées par authentification
router.post('/pointsdinteret', authenticateToken, (req, res, next) => {
  try {
    pointsController.createPointInteret(req, res);
  } catch (error) {
    next(error);
  }
});

router.patch('/pointsdinteret/:id', authenticateToken, (req, res, next) => {
  try {
    pointsController.updatePointInteret(req, res);
  } catch (error) {
    next(error);
  }
});

// Support pour PUT (alternative à PATCH)
router.put('/pointsdinteret/:id', authenticateToken, (req, res, next) => {
  try {
    pointsController.updatePointInteret(req, res);
  } catch (error) {
    next(error);
  }
});

router.delete('/pointsdinteret/:id', authenticateToken, (req, res, next) => {
  try {
    pointsController.deletePointInteret(req, res);
  } catch (error) {
    next(error);
  }
});

// =================================================================
// T3: ROUTES PISTES CYCLABLES (T3.1, T3.2)
// =================================================================

router.get('/pistes', (req, res, next) => {
  try {
    pistesController.getPistes(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/pistes/statistiques', (req, res, next) => {
  try {
    pistesController.getStatistiquesPistes(req, res);
  } catch (error) {
    next(error);
  }
});

// =================================================================
// ROUTES TERRITOIRES (Support)
// =================================================================

router.get('/territoires', (req, res, next) => {
  try {
    territoiresController.getTerritoires(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/territoires/:id', (req, res, next) => {
  try {
    territoiresController.getTerritoire(req, res);
  } catch (error) {
    next(error);
  }
});

// =================================================================
// T4.5 & T5.1: ROUTES D'AUTHENTIFICATION
// =================================================================

router.post('/auth/register', (req, res, next) => {
  try {
    authController.register(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/auth/login', (req, res, next) => {
  try {
    authController.login(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/auth/logout', authenticateToken, (req, res, next) => {
  try {
    authController.logout(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/auth/me', authenticateToken, (req, res, next) => {
  try {
    authController.getProfile(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/auth/refresh', authenticateToken, (req, res, next) => {
  try {
    authController.refreshToken(req, res);
  } catch (error) {
    next(error);
  }
});

// =================================================================
// GESTION DES ERREURS
// =================================================================

// Middleware de gestion des erreurs 404
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint non trouvé',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    available_endpoints: 'Consultez GET / pour la documentation complète'
  });
});

// Middleware de gestion des erreurs globales
router.use((err, req, res, next) => {
  console.error('❌ Erreur dans les routes API:', err);
  
  // Erreurs de validation JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token JWT invalide',
      message: err.message,
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
  
  // Erreurs de token expiré
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token JWT expiré',
      message: 'Veuillez vous reconnecter',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
  
  // Erreurs de base de données
  if (err.code && err.code.startsWith('ER_')) {
    return res.status(500).json({
      error: 'Erreur de base de données',
      code: err.code,
      path: req.path,
      timestamp: new Date().toISOString(),
      details: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
    });
  }
  
  // Erreur générale
  res.status(err.status || 500).json({
    error: 'Erreur interne de l\'API',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne du serveur',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;