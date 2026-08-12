// controllers/pointsController.js - Version complète pour Livrable 3
const db = require('../config/database');

const pointsController = {
  // T2.4: Collection des points d'intérêt avec filtres et pagination
  async getPointsInteret(req, res) {
    try {
      const { 
        limite = 20, 
        page = 1, 
        type, 
        territoire,
        nom,
        arrondissement 
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limite);

      // Construction de la requête avec jointure potentielle pour d'autres types
      let query = `
        SELECT 
          ID,
          Arrondissement,
          'Fontaine à boire' as Type,
          COALESCE(Nom_parc_lieu, 'Fontaine') as Nom,
          COALESCE(Intersection, '-') as Adresse,
          Latitude,
          Longitude,
          Etat,
          Date_installation,
          Remarque
        FROM fontaines
      `;

      let whereConditions = [];
      let params = [];

      // Filtres dynamiques
      if (territoire || arrondissement) {
        const arr = territoire || arrondissement;
        whereConditions.push('Arrondissement = ?');
        params.push(arr);
      }

      if (nom) {
        whereConditions.push('(Nom_parc_lieu LIKE ? OR Intersection LIKE ?)');
        params.push(`%${nom}%`, `%${nom}%`);
      }

      if (type && type === 'Fontaine à boire') {
        // Déjà filtré par la table fontaines
      } else if (type && type !== 'Fontaine à boire') {
        // Pour l'instant, on ne gère que les fontaines
        whereConditions.push('1 = 0'); // Aucun résultat
      }

      // Application des conditions WHERE
      if (whereConditions.length > 0) {
        query += ' WHERE ' + whereConditions.join(' AND ');
      }

      // Compter le total pour la pagination
      const countQuery = query.replace(
        'SELECT ID, Arrondissement, \'Fontaine à boire\' as Type, COALESCE(Nom_parc_lieu, \'Fontaine\') as Nom, COALESCE(Intersection, \'-\') as Adresse, Latitude, Longitude, Etat, Date_installation, Remarque',
        'SELECT COUNT(*) as total'
      );

      const [countResult] = await db.query(countQuery, params);
      const total = countResult[0].total;

      // Ajouter la pagination et l'ordre
      query += ' ORDER BY Arrondissement, Nom_parc_lieu LIMIT ? OFFSET ?';
      params.push(parseInt(limite), offset);

      const [points] = await db.query(query, params);

      // Statistiques par type et arrondissement
      const statsQuery = `
        SELECT 
          Arrondissement,
          COUNT(*) as count,
          COUNT(CASE WHEN Etat = 'Fonctionnelle' THEN 1 END) as fonctionnelles,
          COUNT(CASE WHEN Latitude IS NOT NULL AND Longitude IS NOT NULL THEN 1 END) as avec_coordonnees
        FROM fontaines
        ${whereConditions.length > 0 ? 'WHERE ' + whereConditions.slice(0, -2).join(' AND ') : ''}
        GROUP BY Arrondissement
        ORDER BY count DESC
      `;

      let statsParams = params.slice(0, -2); // Enlever limite et offset
      if (nom) {
        statsParams = statsParams.slice(0, -2); // Enlever aussi les paramètres de nom
      }

      const [statistiques] = await db.query(statsQuery, statsParams);

      res.json({
        data: points,
        pagination: {
          page: parseInt(page),
          limite: parseInt(limite),
          total,
          totalPages: Math.ceil(total / parseInt(limite))
        },
        filters: {
          type,
          territoire: territoire || arrondissement,
          nom
        },
        statistiques: statistiques.slice(0, 10) // Top 10 arrondissements
      });

    } catch (error) {
      console.error('Erreur dans getPointsInteret:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la récupération des points d\'intérêt',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Point d'intérêt unique
  async getPointInteret(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          ID,
          Arrondissement,
          'Fontaine à boire' as Type,
          COALESCE(Nom_parc_lieu, 'Fontaine') as Nom,
          COALESCE(Intersection, '-') as Adresse,
          Latitude,
          Longitude,
          Etat,
          Date_installation,
          Remarque,
          Precision_localisation,
          X,
          Y
        FROM fontaines
        WHERE ID = ?
      `;

      const [result] = await db.query(query, [id]);

      if (result.length === 0) {
        return res.status(404).json({ 
          error: 'Point d\'intérêt non trouvé',
          point_id: id
        });
      }

      res.json(result[0]);

    } catch (error) {
      console.error('Erreur dans getPointInteret:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la récupération du point d\'intérêt',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // T2.5: Créer un point d'intérêt
  async createPointInteret(req, res) {
    try {
      const {
        arrondissement,
        type,
        nom,
        adresse,
        latitude,
        longitude,
        etat,
        remarque
      } = req.body;

      // Validation des champs requis
      if (!arrondissement || !type || !nom) {
        return res.status(400).json({ 
          error: 'Les champs arrondissement, type et nom sont requis',
          required_fields: ['arrondissement', 'type', 'nom']
        });
      }

      // Validation du type (pour l'instant, seulement fontaines)
      if (type !== 'Fontaine à boire') {
        return res.status(400).json({ 
          error: 'Seul le type "Fontaine à boire" est supporté actuellement',
          supported_types: ['Fontaine à boire']
        });
      }

      // Validation des coordonnées si fournies
      if (latitude !== undefined && latitude !== null) {
        if (latitude < 45.4 || latitude > 45.7) {
          return res.status(400).json({
            error: 'Latitude invalide pour la région de Montréal (doit être entre 45.4 et 45.7)'
          });
        }
      }

      if (longitude !== undefined && longitude !== null) {
        if (longitude < -74.0 || longitude > -73.4) {
          return res.status(400).json({
            error: 'Longitude invalide pour la région de Montréal (doit être entre -74.0 et -73.4)'
          });
        }
      }

      // Insertion dans la base de données
      const insertQuery = `
        INSERT INTO fontaines (
          Arrondissement,
          Nom_parc_lieu,
          Intersection,
          Latitude,
          Longitude,
          Etat,
          Remarque,
          Date_installation,
          geometry
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ${
          latitude && longitude 
            ? 'ST_PointFromText(CONCAT(\'POINT(\', ?, \' \', ?, \')\'), 4326)'
            : 'NULL'
        })
      `;

      let params = [
        arrondissement,
        nom,
        adresse || null,
        latitude || null,
        longitude || null,
        etat || null,
        remarque || null
      ];

      if (latitude && longitude) {
        params.push(longitude, latitude);
      }

      const [result] = await db.query(insertQuery, params);

      // Récupérer le point créé
      const [newPoint] = await db.query(`
        SELECT 
          ID,
          Arrondissement,
          'Fontaine à boire' as Type,
          Nom_parc_lieu as Nom,
          Intersection as Adresse,
          Latitude,
          Longitude,
          Etat,
          Remarque
        FROM fontaines 
        WHERE ID = ?
      `, [result.insertId]);

      res.status(201).json({
        message: 'Point d\'intérêt créé avec succès',
        id: result.insertId,
        point: newPoint[0],
        created_by: req.user ? req.user.email : 'unknown'
      });

    } catch (error) {
      console.error('Erreur dans createPointInteret:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          error: 'Un point d\'intérêt avec ces caractéristiques existe déjà'
        });
      }

      res.status(500).json({ 
        error: 'Erreur lors de la création du point d\'intérêt',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // T2.5: Modifier un point d'intérêt
  async updatePointInteret(req, res) {
    try {
      const { id } = req.params;
      const {
        arrondissement,
        nom,
        adresse,
        latitude,
        longitude,
        etat,
        remarque
      } = req.body;

      // Vérifier que le point existe
      const checkQuery = 'SELECT ID, Nom_parc_lieu FROM fontaines WHERE ID = ?';
      const [existing] = await db.query(checkQuery, [id]);

      if (existing.length === 0) {
        return res.status(404).json({ 
          error: 'Point d\'intérêt non trouvé',
          point_id: id
        });
      }

      // Construction dynamique de la requête UPDATE
      let updates = [];
      let params = [];

      if (arrondissement !== undefined) {
        updates.push('Arrondissement = ?');
        params.push(arrondissement);
      }
      if (nom !== undefined) {
        updates.push('Nom_parc_lieu = ?');
        params.push(nom);
      }
      if (adresse !== undefined) {
        updates.push('Intersection = ?');
        params.push(adresse);
      }
      if (latitude !== undefined) {
        // Validation de la latitude
        if (latitude !== null && (latitude < 45.4 || latitude > 45.7)) {
          return res.status(400).json({
            error: 'Latitude invalide pour la région de Montréal'
          });
        }
        updates.push('Latitude = ?');
        params.push(latitude);
      }
      if (longitude !== undefined) {
        // Validation de la longitude
        if (longitude !== null && (longitude < -74.0 || longitude > -73.4)) {
          return res.status(400).json({
            error: 'Longitude invalide pour la région de Montréal'
          });
        }
        updates.push('Longitude = ?');
        params.push(longitude);
      }
      if (etat !== undefined) {
        updates.push('Etat = ?');
        params.push(etat);
      }
      if (remarque !== undefined) {
        updates.push('Remarque = ?');
        params.push(remarque);
      }

      // Mettre à jour la géométrie si latitude ET longitude sont fournis
      if (latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null) {
        updates.push('geometry = ST_PointFromText(CONCAT(\'POINT(\', ?, \' \', ?, \')\'), 4326)');
        params.push(longitude, latitude);
      }

      if (updates.length === 0) {
        return res.status(400).json({ 
          error: 'Aucune donnée à mettre à jour',
          provided_fields: Object.keys(req.body)
        });
      }

      params.push(id);
      const updateQuery = `UPDATE fontaines SET ${updates.join(', ')} WHERE ID = ?`;

      await db.query(updateQuery, params);

      // Récupérer le point mis à jour
      const [updatedPoint] = await db.query(`
        SELECT 
          ID,
          Arrondissement,
          'Fontaine à boire' as Type,
          Nom_parc_lieu as Nom,
          Intersection as Adresse,
          Latitude,
          Longitude,
          Etat,
          Remarque
        FROM fontaines 
        WHERE ID = ?
      `, [id]);

      res.json({
        message: 'Point d\'intérêt mis à jour avec succès',
        point: updatedPoint[0],
        updated_fields: updates.length,
        updated_by: req.user ? req.user.email : 'unknown'
      });

    } catch (error) {
      console.error('Erreur dans updatePointInteret:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la mise à jour du point d\'intérêt',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // T2.5: Supprimer un point d'intérêt
  async deletePointInteret(req, res) {
    try {
      const { id } = req.params;

      // Vérifier que le point existe et récupérer ses infos
      const checkQuery = 'SELECT ID, Nom_parc_lieu, Arrondissement FROM fontaines WHERE ID = ?';
      const [existing] = await db.query(checkQuery, [id]);

      if (existing.length === 0) {
        return res.status(404).json({ 
          error: 'Point d\'intérêt non trouvé',
          point_id: id
        });
      }

      const pointInfo = existing[0];

      // Supprimer le point
      const deleteQuery = 'DELETE FROM fontaines WHERE ID = ?';
      const [result] = await db.query(deleteQuery, [id]);

      res.json({
        message: 'Point d\'intérêt supprimé avec succès',
        deleted_point: {
          id: pointInfo.ID,
          nom: pointInfo.Nom_parc_lieu,
          arrondissement: pointInfo.Arrondissement
        },
        deleted_by: req.user ? req.user.email : 'unknown',
        affected_rows: result.affectedRows
      });

    } catch (error) {
      console.error('Erreur dans deletePointInteret:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la suppression du point d\'intérêt',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = pointsController;