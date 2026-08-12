// scripts/test-connection.js
const db = require('../config/database');

async function testConnection() {
  console.log('🧪 Test de connexion à MariaDB...\n');

  try {
    // Test de la connexion
    const isConnected = await db.testConnection();
    
    if (!isConnected) {
      console.log('❌ Impossible de se connecter à la base de données');
      process.exit(1);
    }

    // Test des tables principales
    console.log('\n📋 Vérification des tables...');
    
    const tables = [
      'users',
      'territoires', 
      'compteurs',
      'fontaines',
      'reseau_cyclable',
      'comptage_velo',
      'auth_tokens'
    ];

    for (const table of tables) {
      try {
        const [result] = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`✅ ${table}: ${result[0].count} enregistrements`);
      } catch (error) {
        console.log(`❌ ${table}: Table manquante ou erreur`);
        console.error(`   Erreur: ${error.message}`);
      }
    }

    // Test des données géospatiales
    console.log('\n🗺️  Test des données géospatiales...');
    
    try {
      const [geoTest] = await db.query(`
        SELECT COUNT(*) as count 
        FROM territoires 
        WHERE geometry IS NOT NULL
      `);
      console.log(`✅ Territoires avec géométrie: ${geoTest[0].count}`);
    } catch (error) {
      console.log(`❌ Erreur géospatiale territoires: ${error.message}`);
    }

    try {
      const [pisteTest] = await db.query(`
        SELECT COUNT(*) as count 
        FROM reseau_cyclable 
        WHERE geometry IS NOT NULL
      `);
      console.log(`✅ Pistes avec géométrie: ${pisteTest[0].count}`);
    } catch (error) {
      console.log(`❌ Erreur géospatiale pistes: ${error.message}`);
    }

    // Test des données récentes de comptage
    console.log('\n📊 Test des données de comptage...');
    
    try {
      const [comptageTest] = await db.query(`
        SELECT 
          COUNT(*) as total,
          MIN(date_heure) as premiere_date,
          MAX(date_heure) as derniere_date,
          COUNT(DISTINCT id_compteur) as nb_compteurs
        FROM comptage_velo
      `);
      
      const result = comptageTest[0];
      console.log(`✅ Total passages: ${result.total}`);
      console.log(`✅ Période: ${result.premiere_date} à ${result.derniere_date}`);
      console.log(`✅ Nombre de compteurs: ${result.nb_compteurs}`);
    } catch (error) {
      console.log(`❌ Erreur données comptage: ${error.message}`);
    }

    // Test d'une requête d'API typique
    console.log('\n🔧 Test requête API typique...');
    
    try {
      const [apiTest] = await db.query(`
        SELECT 
          c.ID,
          c.Nom,
          c.Arrondissement,
          COUNT(cv.id) as nb_passages_total
        FROM compteurs c
        LEFT JOIN comptage_velo cv ON c.ID = cv.id_compteur
        GROUP BY c.ID, c.Nom, c.Arrondissement
        LIMIT 5
      `);
      
      console.log(`✅ Requête API réussie, ${apiTest.length} compteurs trouvés`);
      apiTest.forEach(compteur => {
        console.log(`   - ${compteur.Nom} (${compteur.Arrondissement}): ${compteur.nb_passages_total} passages`);
      });
    } catch (error) {
      console.log(`❌ Erreur requête API: ${error.message}`);
    }

    console.log('\n🎉 Tests terminés avec succès!');
    console.log('\n💡 Pour démarrer le serveur:');
    console.log('   npm run dev');
    console.log('\n💡 API sera disponible à:');
    console.log('   http://localhost:8080/gti525/v1/');

  } catch (error) {
    console.error('💥 Erreur critique:', error.message);
    process.exit(1);
  } finally {
    await db.closePool();
  }
}

// Exécuter le test
testConnection();