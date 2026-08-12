const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// Créer le répertoire data s'il n'existe pas
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Connexion à la base de données
const db = new sqlite3.Database('./data/comptage_velo.db', (err) => {
  if (err) {
    console.error('Erreur lors de la création de la base de données:', err.message);
    process.exit(1);
  } else {
    console.log('Base de données créée/connectée avec succès.');
  }
});

// Créer la table
const createTable = () => {
  return new Promise((resolve, reject) => {
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
        reject(err);
      } else {
        console.log('Table comptage_velo créée avec succès.');
        resolve();
      }
    });
  });
};

// Créer un index pour améliorer les performances
const createIndex = () => {
  return new Promise((resolve, reject) => {
    const query = `
      CREATE INDEX IF NOT EXISTS idx_compteur_date 
      ON comptage_velo(id_compteur, date_heure)
    `;

    db.run(query, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Index créé avec succès.');
        resolve();
      }
    });
  });
};

// Fonction pour importer un fichier CSV
const importCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      console.log(`Fichier ${filePath} non trouvé, passage au suivant.`);
      resolve(0);
      return;
    }

    const fileName = path.basename(filePath);
    console.log(`Import du fichier ${fileName}...`);

    const dataToInsert = [];
    let rowCount = 0;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Valider et nettoyer les données
        const dateHeure = row.date_heure?.trim();
        const idCompteur = parseInt(row.id_compteur);
        const nbPassages = parseInt(row.nb_passages);

        if (dateHeure && !isNaN(idCompteur) && !isNaN(nbPassages)) {
          dataToInsert.push([dateHeure, idCompteur, nbPassages]);
          rowCount++;
        }
      })
      .on('end', () => {
        if (dataToInsert.length === 0) {
          console.log(`Aucune donnée valide trouvée dans ${fileName}`);
          resolve(0);
          return;
        }

        // Insérer les données par batch pour améliorer les performances
        const query = `
          INSERT OR IGNORE INTO comptage_velo (date_heure, id_compteur, nb_passages)
          VALUES (?, ?, ?)
        `;

        db.serialize(() => {
          db.run('BEGIN TRANSACTION');

          const stmt = db.prepare(query);
          let insertedCount = 0;

          dataToInsert.forEach((row, index) => {
            stmt.run(row, function(err) {
              if (err) {
                console.error(`Erreur ligne ${index + 1}:`, err.message);
              } else if (this.changes > 0) {
                insertedCount++;
              }
            });
          });

          stmt.finalize((err) => {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
            } else {
              db.run('COMMIT', (err) => {
                if (err) {
                  reject(err);
                } else {
                  console.log(`${fileName}: ${insertedCount} nouvelles lignes insérées (${rowCount} lignes traitées)`);
                  resolve(insertedCount);
                }
              });
            }
          });
        });
      })
      .on('error', (err) => {
        console.error(`Erreur lors de la lecture de ${fileName}:`, err.message);
        reject(err);
      });
  });
};

// Fonction principale d'initialisation
const initDatabase = async () => {
  try {
    console.log('=== Initialisation de la base de données ===');
    
    // Créer la table et l'index
    await createTable();
    await createIndex();

    // Liste des fichiers CSV à importer
    const csvFiles = [
      './data/comptage_velo_2022.csv',
      './data/comptage_velo_2023.csv',
      './data/comptage_velo_2024.csv',
      './data/comptage_velo_2025.csv'
    ];

    let totalInserted = 0;

    // Importer chaque fichier CSV
    for (const file of csvFiles) {
      const inserted = await importCSV(file);
      totalInserted += inserted;
    }

    console.log(`\n=== Import terminé ===`);
    console.log(`Total: ${totalInserted} enregistrements insérés`);

    // Afficher quelques statistiques
    db.get('SELECT COUNT(*) as total FROM comptage_velo', (err, row) => {
      if (!err) {
        console.log(`Nombre total d'enregistrements en base: ${row.total}`);
      }
    });

    db.get('SELECT COUNT(DISTINCT id_compteur) as compteurs FROM comptage_velo', (err, row) => {
      if (!err) {
        console.log(`Nombre de compteurs distincts: ${row.compteurs}`);
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error.message);
    process.exit(1);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Erreur lors de la fermeture:', err.message);
      } else {
        console.log('Base de données fermée.');
      }
      process.exit(0);
    });
  }
};

// Lancer l'initialisation
initDatabase();