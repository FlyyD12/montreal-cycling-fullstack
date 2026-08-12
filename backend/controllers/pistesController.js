// controllers/pistesController.js - Version complète pour Livrable 3
const db = require('../config/database');

const pistesController = {
  // T3.1 et T3.2: Pistes cyclables avec logique de popularité avancée
  async getPistes(req, res) {
    try {
      const { populaireDebut, populaireFin } = req.query;

      console.log('🚴 Requête pistes:', { populaireDebut, populaireFin });

      // Si des paramètres de popularité sont fournis, calculer les arrondissements populaires
      if (populaireDebut && populaireFin) {
        return await this.getPistesPopulaires(req, res, populaireDebut, populaireFin);
      }

      // Requête normale pour toutes les pistes
      return await this.getToutesPistes(req, res);

    } catch (error) {
      console.error('Erreur dans getPistes:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la récupération des pistes cyclables',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },
  
  // T3.2: Logique des pistes les plus populaires
  async getPistesPopulaires(req, res, populaireDebut, populaireFin) {
    try {
      console.log('📊 Calcul de popularité pour:', { populaireDebut, populaireFin });

      // Étape 1: Calculer la popularité des arrondissements
      const populariteQuery = `
        SELECT 
          c.Arrondissement,
          SUM(cv.nb_passages) as total_passages,
          COUNT(DISTINCT c.ID) as nb_compteurs,
          (SUM(cv.nb_passages) / COUNT(DISTINCT c.ID)) as popularite,
          MIN(cv.date_heure) as premiere_mesure,
          MAX(cv.date_heure) as derniere_mesure
        FROM compteurs c
        JOIN comptage_velo cv ON c.ID = cv.id_compteur
        WHERE cv.date_heure >= ? AND cv.date_heure <= ?
        AND c.Arrondissement IS NOT NULL
        GROUP BY c.Arrondissement
        HAVING nb_compteurs > 0
        ORDER BY popularite DESC
        LIMIT 3
      `;

      const [popularites] = await db.query(populariteQuery, [populaireDebut, populaireFin]);
      
      console.log('🏆 Top 3 arrondissements populaires:', popularites.map(p => ({
        nom: p.Arrondissement,
        popularite: Math.round(p.popularite)
      })));

      if (popularites.length === 0) {
        console.warn('⚠️ Aucune donnée de popularité trouvée pour la période');
        return res.json({
          type: "FeatureCollection",
          metadata: {
            populaire: true,
            periode: { debut: populaireDebut, fin: populaireFin },
            message: "Aucune donnée de comptage trouvée pour cette période",
            arrondissementsPopulaires: []
          },
          features: []
        });
      }

      // Étape 2: Récupérer les pistes de ces arrondissements populaires
      const arrondissementsPopulaires = popularites.map(p => p.Arrondissement);
      const placeholders = arrondissementsPopulaires.map(() => '?').join(',');
      
      const pistesQuery = `
        SELECT 
          ID_CYCL,
          ID_TRC,
          AFFICHEUR_DYNAMIQUE,
          AVANCEMENT_CODE,
          AVANCEMENT_DESC,
          COMPTEUR_CYLISTE,
          LONGUEUR,
          NBR_VOIE,
          NOM_ARR_VILLE_CODE,
          NOM_ARR_VILLE_DESC,
          PROTEGE_4S,
          REV_AVANCEMENT_CODE,
          REV_AVANCEMENT_DESC,
          ROUTE_VERTE,
          SAISONS4,
          SAS_VELO,
          SEPARATEUR_CODE,
          SEPARATEUR_DESC,
          TYPE_VOIE_CODE,
          TYPE_VOIE_DESC,
          TYPE_VOIE2_CODE,
          TYPE_VOIE2_DESC,
          VILLE_MTL,
          ST_AsGeoJSON(geometry) as geometry
        FROM reseau_cyclable
        WHERE NOM_ARR_VILLE_DESC IN (${placeholders})
        AND geometry IS NOT NULL
        ORDER BY NOM_ARR_VILLE_DESC, LONGUEUR DESC
      `;
      
      const [pistes] = await db.query(pistesQuery, arrondissementsPopulaires);

      console.log(`🛣️ ${pistes.length} pistes trouvées dans les arrondissements populaires`);

      // Statistiques détaillées par arrondissement
      const statsQuery = `
        SELECT 
          rc.NOM_ARR_VILLE_DESC as arrondissement,
          COUNT(DISTINCT rc.ID_CYCL) as nb_pistes,
          SUM(rc.LONGUEUR) as longueur_totale,
          COUNT(CASE WHEN rc.TYPE_VOIE_CODE IN ('4','5','6') THEN 1 END) as pistes_protegees,
          COUNT(CASE WHEN rc.SAISONS4 = 'Oui' THEN 1 END) as pistes_4_saisons,
          COUNT(CASE WHEN rc.REV_AVANCEMENT_CODE IN ('EV','PE','TR') THEN 1 END) as pistes_rev
        FROM reseau_cyclable rc
        WHERE rc.NOM_ARR_VILLE_DESC IN (${placeholders})
        GROUP BY rc.NOM_ARR_VILLE_DESC
        ORDER BY longueur_totale DESC
      `;

      const [statsDetaillees] = await db.query(statsQuery, arrondissementsPopulaires);

      // Construire la réponse GeoJSON
      const features = pistes.map(piste => ({
        type: "Feature",
        properties: {
          ID_CYCL: piste.ID_CYCL,
          ID_TRC: piste.ID_TRC,
          AFFICHEUR_DYNAMIQUE: piste.AFFICHEUR_DYNAMIQUE,
          AVANCEMENT_CODE: piste.AVANCEMENT_CODE,
          AVANCEMENT_DESC: piste.AVANCEMENT_DESC,
          COMPTEUR_CYLISTE: piste.COMPTEUR_CYLISTE,
          LONGUEUR: piste.LONGUEUR,
          NBR_VOIE: piste.NBR_VOIE,
          NOM_ARR_VILLE_CODE: piste.NOM_ARR_VILLE_CODE,
          NOM_ARR_VILLE_DESC: piste.NOM_ARR_VILLE_DESC,
          PROTEGE_4S: piste.PROTEGE_4S,
          REV_AVANCEMENT_CODE: piste.REV_AVANCEMENT_CODE,
          REV_AVANCEMENT_DESC: piste.REV_AVANCEMENT_DESC,
          ROUTE_VERTE: piste.ROUTE_VERTE,
          SAISONS4: piste.SAISONS4,
          SAS_VELO: piste.SAS_VELO,
          SEPARATEUR_CODE: piste.SEPARATEUR_CODE,
          SEPARATEUR_DESC: piste.SEPARATEUR_DESC,
          TYPE_VOIE_CODE: piste.TYPE_VOIE_CODE,
          TYPE_VOIE_DESC: piste.TYPE_VOIE_DESC,
          TYPE_VOIE2_CODE: piste.TYPE_VOIE2_CODE,
          TYPE_VOIE2_DESC: piste.TYPE_VOIE2_DESC,
          VILLE_MTL: piste.VILLE_MTL,
          // Ajout d'information de popularité
          POPULAIRE: true
        },
        geometry: JSON.parse(piste.geometry)
      }));

      res.json({
        type: "FeatureCollection",
        metadata: {
          populaire: true,
          periode: { debut: populaireDebut, fin: populaireFin },
          total_pistes: features.length,
          arrondissementsPopulaires: popularites.map(p => ({
            nom: p.Arrondissement,
            popularite: parseFloat(p.popularite.toFixed(2)),
            totalPassages: p.total_passages,
            nbCompteurs: p.nb_compteurs,
            premiereMesure: p.premiere_mesure,
            derniereMesure: p.derniere_mesure
          })),
          statistiquesDetaillees: statsDetaillees.map(s => ({
            arrondissement: s.arrondissement,
            nbPistes: s.nb_pistes,
            longueurTotale: Math.round(s.longueur_totale),
            pistesProtegees: s.pistes_protegees,
            pistes4Saisons: s.pistes_4_saisons,
            pistesREV: s.pistes_rev
          }))
        },
        features
      });

    } catch (error) {
      console.error('Erreur dans getPistesPopulaires:', error);
      throw error;
    }
  },

  // Récupération de toutes les pistes (requête normale)
  async getToutesPistes(req, res) {
    try {
      const query = `
        SELECT 
          ID_CYCL,
          ID_TRC,
          AFFICHEUR_DYNAMIQUE,
          AVANCEMENT_CODE,
          AVANCEMENT_DESC,
          COMPTEUR_CYLISTE,
          LONGUEUR,
          NBR_VOIE,
          NOM_ARR_VILLE_CODE,
          NOM_ARR_VILLE_DESC,
          PROTEGE_4S,
          REV_AVANCEMENT_CODE,
          REV_AVANCEMENT_DESC,
          ROUTE_VERTE,
          SAISONS4,
          SAS_VELO,
          SEPARATEUR_CODE,
          SEPARATEUR_DESC,
          TYPE_VOIE_CODE,
          TYPE_VOIE_DESC,
          TYPE_VOIE2_CODE,
          TYPE_VOIE2_DESC,
          VILLE_MTL,
          ST_AsGeoJSON(geometry) as geometry
        FROM reseau_cyclable
        WHERE geometry IS NOT NULL
        ORDER BY NOM_ARR_VILLE_DESC, LONGUEUR DESC
      `;

      const [pistes] = await db.query(query);

      // Statistiques globales
      const statsQuery = `
        SELECT 
          COUNT(*) as total_pistes,
          SUM(LONGUEUR) as longueur_totale,
          COUNT(CASE WHEN TYPE_VOIE_CODE IN ('4','5','6') THEN 1 END) as pistes_protegees,
          COUNT(CASE WHEN TYPE_VOIE_CODE IN ('1','3','8','9') THEN 1 END) as voies_partagees,
          COUNT(CASE WHEN SAISONS4 = 'Oui' THEN 1 END) as pistes_4_saisons,
          COUNT(CASE WHEN REV_AVANCEMENT_CODE IN ('EV','PE','TR') THEN 1 END) as pistes_rev,
          COUNT(CASE WHEN ROUTE_VERTE = 'Oui' THEN 1 END) as route_verte,
          COUNT(DISTINCT NOM_ARR_VILLE_DESC) as nb_arrondissements
        FROM reseau_cyclable
        WHERE geometry IS NOT NULL
      `;

      const [statsGlobales] = await db.query(statsQuery);

      console.log(`🚴 ${pistes.length} pistes chargées (mode normal)`);

      const features = pistes.map(piste => ({
        type: "Feature",
        properties: {
          ID_CYCL: piste.ID_CYCL,
          ID_TRC: piste.ID_TRC,
          AFFICHEUR_DYNAMIQUE: piste.AFFICHEUR_DYNAMIQUE,
          AVANCEMENT_CODE: piste.AVANCEMENT_CODE,
          AVANCEMENT_DESC: piste.AVANCEMENT_DESC,
          COMPTEUR_CYLISTE: piste.COMPTEUR_CYLISTE,
          LONGUEUR: piste.LONGUEUR,
          NBR_VOIE: piste.NBR_VOIE,
          NOM_ARR_VILLE_CODE: piste.NOM_ARR_VILLE_CODE,
          NOM_ARR_VILLE_DESC: piste.NOM_ARR_VILLE_DESC,
          PROTEGE_4S: piste.PROTEGE_4S,
          REV_AVANCEMENT_CODE: piste.REV_AVANCEMENT_CODE,
          REV_AVANCEMENT_DESC: piste.REV_AVANCEMENT_DESC,
          ROUTE_VERTE: piste.ROUTE_VERTE,
          SAISONS4: piste.SAISONS4,
          SAS_VELO: piste.SAS_VELO,
          SEPARATEUR_CODE: piste.SEPARATEUR_CODE,
          SEPARATEUR_DESC: piste.SEPARATEUR_DESC,
          TYPE_VOIE_CODE: piste.TYPE_VOIE_CODE,
          TYPE_VOIE_DESC: piste.TYPE_VOIE_DESC,
          TYPE_VOIE2_CODE: piste.TYPE_VOIE2_CODE,
          TYPE_VOIE2_DESC: piste.TYPE_VOIE2_DESC,
          VILLE_MTL: piste.VILLE_MTL,
          POPULAIRE: false
        },
        geometry: JSON.parse(piste.geometry)
      }));

      res.json({
        type: "FeatureCollection",
        metadata: {
          populaire: false,
          total: features.length,
          statistiques: statsGlobales[0] ? {
            totalPistes: statsGlobales[0].total_pistes,
            longueurTotale: Math.round(statsGlobales[0].longueur_totale),
            pistesProtegees: statsGlobales[0].pistes_protegees,
            voiesPartagees: statsGlobales[0].voies_partagees,
            pistes4Saisons: statsGlobales[0].pistes_4_saisons,
            pistesREV: statsGlobales[0].pistes_rev,
            routeVerte: statsGlobales[0].route_verte,
            nbArrondissements: statsGlobales[0].nb_arrondissements
          } : {}
        },
        features
      });

    } catch (error) {
      console.error('Erreur dans getToutesPistes:', error);
      throw error;
    }
  },

  // Endpoint supplémentaire : Statistiques détaillées des pistes
  async getStatistiquesPistes(req, res) {
    try {
      const { arrondissement } = req.query;

      let whereClause = '';
      let params = [];

      if (arrondissement) {
        whereClause = 'WHERE NOM_ARR_VILLE_DESC = ?';
        params.push(arrondissement);
      }

      const query = `
        SELECT 
          NOM_ARR_VILLE_DESC as arrondissement,
          COUNT(*) as nb_pistes,
          SUM(LONGUEUR) as longueur_totale,
          AVG(LONGUEUR) as longueur_moyenne,
          COUNT(CASE WHEN TYPE_VOIE_CODE IN ('4','5','6') THEN 1 END) as pistes_protegees,
          COUNT(CASE WHEN TYPE_VOIE_CODE IN ('1','3','8','9') THEN 1 END) as voies_partagees,
          COUNT(CASE WHEN TYPE_VOIE_CODE = '7' THEN 1 END) as sentiers_polyvalents,
          COUNT(CASE WHEN SAISONS4 = 'Oui' THEN 1 END) as pistes_4_saisons,
          COUNT(CASE WHEN REV_AVANCEMENT_CODE IN ('EV','PE','TR') THEN 1 END) as pistes_rev,
          COUNT(CASE WHEN ROUTE_VERTE = 'Oui' THEN 1 END) as route_verte,
          COUNT(CASE WHEN COMPTEUR_CYLISTE = 'Oui' THEN 1 END) as avec_compteur
        FROM reseau_cyclable
        ${whereClause}
        GROUP BY NOM_ARR_VILLE_DESC
        ORDER BY longueur_totale DESC
      `;

      const [statistiques] = await db.query(query, params);

      res.json({
        arrondissement_filtre: arrondissement || null,
        statistiques: statistiques.map(s => ({
          arrondissement: s.arrondissement,
          nbPistes: s.nb_pistes,
          longueurTotale: Math.round(s.longueur_totale),
          longueurMoyenne: Math.round(s.longueur_moyenne),
          pistesProtegees: s.pistes_protegees,
          voiesPartagees: s.voies_partagees,
          sentiersPolyvalents: s.sentiers_polyvalents,
          pistes4Saisons: s.pistes_4_saisons,
          pistesREV: s.pistes_rev,
          routeVerte: s.route_verte,
          avecCompteur: s.avec_compteur,
          // Pourcentages
          pourcentageProtegee: Math.round((s.pistes_protegees / s.nb_pistes) * 100),
          pourcentage4Saisons: Math.round((s.pistes_4_saisons / s.nb_pistes) * 100)
        }))
      });

    } catch (error) {
      console.error('Erreur dans getStatistiquesPistes:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la récupération des statistiques',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = pistesController;