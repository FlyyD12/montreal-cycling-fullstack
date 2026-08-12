// middleware/auth.js
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware d'authentification JWT - T5.1
const authenticateToken = async (req, res, next) => {
  try {
    // Récupérer le token depuis l'en-tête Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Token d\'accès requis',
        message: 'Veuillez vous connecter pour accéder à cette ressource'
      });
    }

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérifier que le token existe toujours en base (pour la révocation)
    const tokenQuery = `
      SELECT at.id, at.user_id, u.email, u.name 
      FROM auth_tokens at
      JOIN users u ON at.user_id = u.id
      WHERE at.token_hash = SHA2(?, 256) 
      AND at.expires_at > NOW()
    `;
    
    const [tokenResult] = await db.query(tokenQuery, [token]);
    
    if (tokenResult.length === 0) {
      return res.status(401).json({ 
        error: 'Token invalide ou expiré',
        message: 'Veuillez vous reconnecter'
      });
    }

    // Ajouter les informations utilisateur à la requête
    req.user = {
      id: decoded.userId,
      email: tokenResult[0].email,
      name: tokenResult[0].name
    };

    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token invalide',
        message: 'Format de token incorrect'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expiré',
        message: 'Votre session a expiré, veuillez vous reconnecter'
      });
    }

    console.error('Erreur d\'authentification:', error);
    return res.status(500).json({ 
      error: 'Erreur interne du serveur' 
    });
  }
};

// Middleware optionnel - ajoute l'utilisateur si le token est présent mais ne rejette pas
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const tokenQuery = `
        SELECT u.id, u.email, u.name 
        FROM auth_tokens at
        JOIN users u ON at.user_id = u.id
        WHERE at.token_hash = SHA2(?, 256) 
        AND at.expires_at > NOW()
      `;
      
      const [tokenResult] = await db.query(tokenQuery, [token]);
      
      if (tokenResult.length > 0) {
        req.user = tokenResult[0];
      }
    }
    
    next();
  } catch (error) {
    // En cas d'erreur, on continue sans utilisateur
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};