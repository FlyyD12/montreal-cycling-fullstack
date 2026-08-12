// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation des données d'inscription
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email valide requis'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Le nom doit contenir au moins 2 caractères')
];

// Validation des données de connexion
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email valide requis'),
  body('password')
    .notEmpty()
    .withMessage('Mot de passe requis')
];

// T4.5: Inscription locale
router.post('/register', registerValidation, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { email, password, name } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUserQuery = 'SELECT id FROM users WHERE email = ?';
    const [existingUser] = await db.query(existingUserQuery, [email]);

    if (existingUser.length > 0) {
      return res.status(409).json({
        error: 'Cet email est déjà utilisé'
      });
    }

    // Hasher le mot de passe
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Créer l'utilisateur
    const createUserQuery = `
      INSERT INTO users (email, password_hash, name) 
      VALUES (?, ?, ?)
    `;
    
    const [result] = await db.query(createUserQuery, [email, passwordHash, name]);

    res.status(201).json({
      message: 'Compte créé avec succès',
      user: {
        id: result.insertId,
        email,
        name
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// T4.5: Connexion locale
router.post('/login', loginValidation, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Trouver l'utilisateur
    const userQuery = 'SELECT id, email, password_hash, name FROM users WHERE email = ?';
    const [users] = await db.query(userQuery, [email]);

    if (users.length === 0) {
      return res.status(401).json({
        error: 'Email ou mot de passe incorrect'
      });
    }

    const user = users[0];

    // Vérifier le mot de passe
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({
        error: 'Email ou mot de passe incorrect'
      });
    }

    // T5.1: Générer le token JWT
    const payload = {
      userId: user.id,
      email: user.email
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '24h'
    });

    // Stocker le token en base pour la révocation
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // 24h par défaut

    const storeTokenQuery = `
      INSERT INTO auth_tokens (user_id, token_hash, expires_at) 
      VALUES (?, SHA2(?, 256), ?)
    `;
    
    await db.query(storeTokenQuery, [user.id, token, tokenExpiry]);

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Déconnexion (révocation du token)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // Supprimer le token de la base
    const deleteTokenQuery = 'DELETE FROM auth_tokens WHERE token_hash = SHA2(?, 256)';
    await db.query(deleteTokenQuery, [token]);

    res.json({ message: 'Déconnexion réussie' });

  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Vérification du statut de connexion
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: req.user,
    authenticated: true
  });
});

// Nettoyage des tokens expirés (à appeler périodiquement)
router.delete('/cleanup', authenticateToken, async (req, res) => {
  try {
    const cleanupQuery = 'DELETE FROM auth_tokens WHERE expires_at < NOW()';
    const [result] = await db.query(cleanupQuery);
    
    res.json({
      message: 'Nettoyage effectué',
      tokensDeleted: result.affectedRows
    });
  } catch (error) {
    console.error('Erreur lors du nettoyage:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;
