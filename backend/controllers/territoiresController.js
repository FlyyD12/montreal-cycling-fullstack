// controllers/territoiresController.js
const db = require('../config/database');

const territoiresController = {
  // Récupérer la liste des territoires pour les filtres
  async getTerritoires(req, res) {
    try {
      const { format = 'list' } = req.query;

      if (format === 'geojson') {
        // Retourner les données géométriques pour la carte
        const query = `
          SELECT 
            CODEID,
            NOM,
            ABREV,
            TYPE,
            ST_AsGeoJSON(geometry) as geometry
          FROM territoires
          ORDER BY NOM
        `;

        const [territoires] = await db.query(query);

        const features = territoires.map(t => ({
          type: "Feature",
          properties: {
            CODEID: t.CODEID,
            NOM: t.NOM,
            ABREV: t.ABREV,
            TYPE: t.TYPE
          },
          geometry: JSON.parse(t.geometry)
        }));

        res.json({
          type: "FeatureCollection",
          features
        });

      } else {
        // Format simple pour les listes déroulantes
        const query = `
          SELECT DISTINCT NOM as nom
          FROM territoires
          WHERE NOM IS NOT NULL AND NOM != ''
          ORDER BY NOM
        `;

        const [territoires] = await db.query(query);

        res.json({
          territoires: territoires.map(t => t.nom)
        });
      }

    } catch (error) {
      console.error('Erreur dans getTerritoires:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des territoires' });
    }
  },

  // Récupérer un territoire spécifique
  async getTerritoire(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          CODEID,
          NOM,
          ABREV,
          TYPE,
          COMMENT,
          ST_AsGeoJSON(geometry) as geometry
        FROM territoires
        WHERE CODEID = ?
      `;

      const [result] = await db.query(query, [id]);

      if (result.length === 0) {
        return res.status(404).json({ error: 'Territoire non trouvé' });
      }

      const territoire = result[0];

      res.json({
        type: "Feature",
        properties: {
          CODEID: territoire.CODEID,
          NOM: territoire.NOM,
          ABREV: territoire.ABREV,
          TYPE: territoire.TYPE,
          COMMENT: territoire.COMMENT
        },
        geometry: JSON.parse(territoire.geometry)
      });

    } catch (error) {
      console.error('Erreur dans getTerritoire:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération du territoire' });
    }
  }
};

module.exports = territoiresController;