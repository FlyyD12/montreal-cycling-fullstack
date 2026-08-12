const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

console.log('🚀 === DÉBUT DE L\'INITIALISATION ===');
console.log('📁 Répertoire courant:', process.cwd());

// Créer le répertoire data s'il n'existe pas
const dataDir = path.join(__dirname, '../data');
console.log('📂 Chemin du dossier data:', dataDir);

if (!fs.existsSync(dataDir)) {
  console.log('📁 Création du dossier data...');
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✅ Dossier data créé');
} else {
  console.log('✅ Dossier data existe déjà');
}

// Chemin de la base de données
const dbPath = path.join(dataDir, 'comptage_velo.db');
console.log('💾 Chemin de la base:', dbPath);

// Supprimer l'ancienne base si elle existe (pour un fresh start)
if (fs.existsSync(dbPath)) {
  console.log('🗑️  Suppression de l\'ancienne base...');
  fs.unlinkSync(dbPath);
}

// Connexion à la base de données
console.log('🔌 Connexion à la base de données...');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erreur lors de la création de la base de données:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Base de données créée/connectée avec succès.');
  }
});

// Créer la table
const createTable = () => {
  return new Promise((resolve, reject) => {
    console.log('📋 Création de la table...');
    const query = `
      CREATE TABLE IF NOT EXISTS comptage_velo (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date_heure TEXT NOT NULL,
        id_compteur INTEGER NOT NULL,
        nb_passages INTEGER NOT NULL,
        UNIQUE(date_heure, id_compteur)
      )
    `;

    db.run(query, (err) => {
      if (err) {
        console.error('❌ Erreur création table:', err.message);
        reject(err);
      } else {
        console.log('✅ Table comptage_velo créée avec succès.');
        resolve();
      }
    });
  });
};

// Créer un index pour améliorer les performances
const createIndex = () => {
  return new Promise((resolve, reject) => {
    console.log('🔍 Création de l\'index...');
    const query = `
      CREATE INDEX IF NOT EXISTS idx_compteur_date 
      ON comptage_velo(id_compteur, date_heure)
    `;

    db.run(query, (err) => {
      if (err) {
        console.error('❌ Erreur création index:', err.message);
        reject(err);
      } else {
        console.log('✅ Index créé avec succès.');
        resolve();
      }
    });
  });
};

// Fonction pour importer un fichier CSV
const importCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const fileName = path.basename(filePath);
    console.log(`\n📥 Tentative d'import du fichier: ${fileName}`);
    console.log(`🔍 Chemin complet: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Fichier ${fileName} non trouvé, passage au suivant.`);
      resolve(0);
      return;
    }

    // Vérifier la taille du fichier
    const stats = fs.statSync(filePath);
    console.log(`📊 Taille du fichier: ${stats.size} bytes`);

    const dataToInsert = [];
    let rowCount = 0;
    let validRows = 0;
    let invalidRows = 0;

    console.log(`🔄 Lecture du fichier ${fileName}...`);

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('headers', (headers) => {
        console.log(`📋 En-têtes trouvés: ${headers.join(', ')}`);
      })
      .on('data', (row) => {
        rowCount++;
        
        // Log des premières lignes pour debugging
        if (rowCount <= 3) {
          console.log(`   Ligne ${rowCount}:`, row);
        }

        // Valider et nettoyer les données
        const dateHeure = row.date_heure?.trim();
        const idCompteur = parseInt(row.id_compteur);
        const nbPassages = parseInt(row.nb_passages);

        if (dateHeure && !isNaN(idCompteur) && !isNaN(nbPassages)) {
          dataToInsert.push([dateHeure, idCompteur, nbPassages]);
          validRows++;
        } else {
          invalidRows++;
          if (invalidRows <= 5) {
            console.log(`⚠️  Ligne invalide ${rowCount}:`, {dateHeure, idCompteur, nbPassages});
          }
        }
      })
      .on('end', () => {
        console.log(`📊 Lecture terminée:`);
        console.log(`   - Total lignes lues: ${rowCount}`);
        console.log(`   - Lignes valides: ${validRows}`);
        console.log(`   - Lignes invalides: ${invalidRows}`);

        if (dataToInsert.length === 0) {
          console.log(`❌ Aucune donnée valide trouvée dans ${fileName}`);
          resolve(0);
          return;
        }

        // Insérer les données par batch
        console.log(`💾 Insertion de ${dataToInsert.length} enregistrements...`);
        const query = `
          INSERT OR IGNORE INTO comptage_velo (date_heure, id_compteur, nb_passages)
          VALUES (?, ?, ?)
        `;

        db.serialize(() => {
          db.run('BEGIN TRANSACTION');

          const stmt = db.prepare(query);
          let insertedCount = 0;
          let processedCount = 0;

          dataToInsert.forEach((row, index) => {
            stmt.run(row, function(err) {
              processedCount++;
              
              if (err) {
                console.error(`❌ Erreur ligne ${index + 1}:`, err.message);
              } else if (this.changes > 0) {
                insertedCount++;
              }

              // Progress indicator
              if (processedCount % 10000 === 0) {
                console.log(`   📈 Traité: ${processedCount}/${dataToInsert.length}`);
              }

              // Quand toutes les lignes sont traitées
              if (processedCount === dataToInsert.length) {
                stmt.finalize((err) => {
                  if (err) {
                    console.error('❌ Erreur finalisation:', err.message);
                    db.run('ROLLBACK');
                    reject(err);
                  } else {
                    db.run('COMMIT', (err) => {
                      if (err) {
                        console.error('❌ Erreur commit:', err.message);
                        reject(err);
                      } else {
                        console.log(`✅ ${fileName}: ${insertedCount} nouvelles lignes insérées`);
                        resolve(insertedCount);
                      }
                    });
                  }
                });
              }
            });
          });
        });
      })
      .on('error', (err) => {
        console.error(`❌ Erreur lors de la lecture de ${fileName}:`, err.message);
        reject(err);
      });
  });
};

// Fonction principale d'initialisation
const initDatabase = async () => {
  try {
    console.log('\n🔧 === PHASE 1: CRÉATION DE LA STRUCTURE ===');
    
    // Créer la table et l'index
    await createTable();
    await createIndex();

    console.log('\n📦 === PHASE 2: IMPORT DES DONNÉES ===');

    // Liste des fichiers CSV à importer
    const csvFiles = [
      path.join(dataDir, 'comptage_velo_2022.csv'),
      path.join(dataDir, 'comptage_velo_2023.csv'),
      path.join(dataDir, 'comptage_velo_2024.csv'),
      path.join(dataDir, 'comptage_velo_2025.csv')
    ];

    console.log('🔍 Fichiers à traiter:');
    csvFiles.forEach(file => {
      console.log(`   ${fs.existsSync(file) ? '✅' : '❌'} ${path.basename(file)}`);
    });

    let totalInserted = 0;

    // Importer chaque fichier CSV
    for (const file of csvFiles) {
      const inserted = await importCSV(file);
      totalInserted += inserted;
    }

    console.log(`\n🎉 === RÉSUMÉ FINAL ===`);
    console.log(`📊 Total enregistrements insérés: ${totalInserted}`);

    // Afficher quelques statistiques
    await new Promise((resolve) => {
      db.get('SELECT COUNT(*) as total FROM comptage_velo', (err, row) => {
        if (!err) {
          console.log(`📈 Nombre total d'enregistrements en base: ${row.total}`);
        }
        resolve();
      });
    });

    await new Promise((resolve) => {
      db.get('SELECT COUNT(DISTINCT id_compteur) as compteurs FROM comptage_velo', (err, row) => {
        if (!err) {
          console.log(`🏷️  Nombre de compteurs distincts: ${row.compteurs}`);
        }
        resolve();
      });
    });

    console.log('🎯 Base de données prête à l\'utilisation !');

  } catch (error) {
    console.error('💥 Erreur lors de l\'initialisation:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('❌ Erreur lors de la fermeture:', err.message);
      } else {
        console.log('🔌 Connexion à la base de données fermée.');
      }
      console.log('🏁 === FIN DU PROCESSUS ===');
      process.exit(0);
    });
  }
};

// Lancer l'initialisation
initDatabase();