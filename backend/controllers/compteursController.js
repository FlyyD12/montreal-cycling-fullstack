// controllers/compteursController.js - Version complète pour Livrable 3
const db = require('../config/database');

const compteursController = {
  // T2.1: Collection des compteurs avec pagination et filtres
  async getCompteurs(req, res) {
    try {
      const { 
        limite = 20, 
        page = 1, 
        implantation, 
        nom,
        arrondissement 
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limite);
      let whereConditions = [];
      let params = [];

      // Filtres
      if (implantation) {
        whereConditions.push('Annee_implante >= ?');
        params.push(parseInt(implantation));
      }
      
      if (nom) {
        whereConditions.push('Nom LIKE ?');
        params.push(`%${nom}%`);
      }

      if (arrondissement) {
        whereConditions.push('Arrondissement = ?');
        params.push(arrondissement);
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Requête pour le total
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM compteurs 
        ${whereClause}
      `;
      
      const [countResult] = await db.query(countQuery, params);
      const total = countResult[0].total;

      // Requête pour les données paginées
      const dataQuery = `
        SELECT 
          ID,
          Ancien_ID,
          Nom,
          Statut,
          Latitude,
          Longitude,
          Annee_implante,
          Arrondissement
        FROM compteurs 
        ${whereClause}
        ORDER BY ID
        LIMIT ? OFFSET ?
      `;

      const [compteurs] = await db.query(dataQuery, [...params, parseInt(limite), offset]);

      res.json({
        data: compteurs,
        pagination: {
          page: parseInt(page),
          limite: parseInt(limite),
          total,
          totalPages: Math.ceil(total / parseInt(limite))
        },
        filters: {
          implantation,
          nom,
          arrondissement
        }
      });

    } catch (error) {
      console.error('Erreur dans getCompteurs:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la récupération des compteurs',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // T2.2: Compteur unique par ID
  async getCompteur(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          ID,
          Ancien_ID,
          Nom,
          Statut,
          Latitude,
          Longitude,
          Annee_implante,
          Arrondissement
        FROM compteurs 
        WHERE ID = ?
      `;

      const [result] = await db.query(query, [id]);

      if (result.length === 0) {
        return res.status(404).json({ 
          error: 'Compteur non trouvé',
          compteur_id: id
        });
      }

      // Ajouter quelques statistiques de base
      const statsQuery = `
        SELECT 
          COUNT(*) as total_mesures,
          MIN(date_heure) as premiere_mesure,
          MAX(date_heure) as derniere_mesure,
          SUM(nb_passages) as total_passages
        FROM comptage_velo 
        WHERE id_compteur = ?
      `;

      const [stats] = await db.query(statsQuery, [id]);

      res.json({
        ...result[0],
        statistiques: stats[0] || {
          total_mesures: 0,
          premiere_mesure: null,
          derniere_mesure: null,
          total_passages: 0
        }
      });

    } catch (error) {
      console.error('Erreur dans getCompteur:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la récupération du compteur',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // T2.3: Données de passages d'un compteur avec regroupement
  async getPassages(req, res) {
    try {
      const { id } = req.params;
      const { debut, fin, intervalle = 'day' } = req.query;

      // Vérifier que le compteur existe
      const compteurQuery = 'SELECT ID, Nom FROM compteurs WHERE ID = ?';
      const [compteurResult] = await db.query(compteurQuery, [id]);
      
      if (compteurResult.length === 0) {
        return res.status(404).json({ 
          error: 'Compteur non trouvé',
          compteur_id: id
        });
      }

      let whereConditions = ['id_compteur = ?'];
      let params = [id];

      // Filtres de dates
      if (debut) {
        whereConditions.push('date_heure >= ?');
        params.push(debut);
      }
      
      if (fin) {
        whereConditions.push('date_heure <= ?');
        params.push(fin);
      }

      // Groupement selon l'intervalle demandé
      let dateFormat;
      let orderBy;
      switch (intervalle) {
        case 'week':
          dateFormat = "DATE_FORMAT(date_heure, '%Y-%u')";
          orderBy = "YEAR(date_heure), WEEK(date_heure)";
          break;
        case 'month':
          dateFormat = "DATE_FORMAT(date_heure, '%Y-%m')";
          orderBy = "YEAR(date_heure), MONTH(date_heure)";
          break;
        case 'year':
          dateFormat = "YEAR(date_heure)";
          orderBy = "YEAR(date_heure)";
          break;
        default: // 'day'
          dateFormat = "DATE(date_heure)";
          orderBy = "DATE(date_heure)";
      }

      const query = `
        SELECT 
          ${dateFormat} as periode,
          SUM(nb_passages) as total_passages,
          COUNT(*) as nb_mesures,
          AVG(nb_passages) as moyenne_passages,
          MIN(nb_passages) as min_passages,
          MAX(nb_passages) as max_passages
        FROM comptage_velo 
        WHERE ${whereConditions.join(' AND ')}
        GROUP BY ${dateFormat}
        ORDER BY ${orderBy}
      `;

      const [passages] = await db.query(query, params);

      // Statistiques globales pour la période
      const statsQuery = `
        SELECT 
          SUM(nb_passages) as total_periode,
          COUNT(*) as total_mesures,
          AVG(nb_passages) as moyenne_periode
        FROM comptage_velo 
        WHERE ${whereConditions.join(' AND ')}
      `;

      const [statsGlobales] = await db.query(statsQuery, params);

      res.json({
        compteur: compteurResult[0],
        periode: { debut, fin },
        intervalle,
        statistiques_globales: statsGlobales[0] || {
          total_periode: 0,
          total_mesures: 0,
          moyenne_periode: 0
        },
        data: passages
      });

    } catch (error) {
      console.error('Erreur dans getPassages:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la récupération des passages',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = compteursController;