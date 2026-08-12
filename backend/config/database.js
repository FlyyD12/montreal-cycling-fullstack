// config/database.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'velomontreal',
  charset: 'utf8mb4',
  timezone: '+00:00',
  // Pool de connexions avec options valides pour MySQL2
  connectionLimit: 10,
  queueLimit: 0,
  // Options de connexion valides
  connectTimeout: 60000
};

// Créer le pool de connexions
const pool = mysql.createPool(dbConfig);

// Test de la connexion
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connexion à MariaDB établie avec succès');
    console.log(`📊 Base de données: ${dbConfig.database}`);
    console.log(`🏠 Serveur: ${dbConfig.host}:${dbConfig.port}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à MariaDB:', error.message);
    return false;
  }
};

// Fonction helper pour exécuter des requêtes
const query = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return [rows];
  } catch (error) {
    console.error('Erreur SQL:', error.message);
    console.error('Requête:', sql);
    console.error('Paramètres:', params);
    throw error;
  }
};

// Fonction pour les transactions
const transaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Fermeture propre du pool
const closePool = async () => {
  try {
    await pool.end();
    console.log('🔌 Pool de connexions MariaDB fermé');
  } catch (error) {
    console.error('Erreur lors de la fermeture du pool:', error.message);
  }
};

// Gestion gracieuse de l'arrêt
process.on('SIGINT', closePool);
process.on('SIGTERM', closePool);

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
  closePool
};
