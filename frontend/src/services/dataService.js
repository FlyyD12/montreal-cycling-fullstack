// services/dataService.js - Version API REST pour Livrable 3
const API_BASE_URL = process.env.VUE_APP_API_URL || 'http://localhost:8080/gti525/v1';

class DataService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper pour les requêtes avec gestion d'erreurs
  async makeRequest(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      
      const defaultOptions = {
        headers: {
          'Content-Type': 'application/json',
        },
      };

      // Ajouter le token d'authentification si disponible
      const token = localStorage.getItem('authToken');
      if (token) {
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
      }

      const finalOptions = { ...defaultOptions, ...options };
      
      const response = await fetch(url, finalOptions);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Erreur API ${endpoint}:`, error);
      throw error;
    }
  }

  // ===============================
  // COMPTEURS - T4.3 Refactorisation
  // ===============================

  // Charger la liste des compteurs avec filtres et pagination
  async loadCompteurs(params = {}) {
    const searchParams = new URLSearchParams();
    
    if (params.limite) searchParams.append('limite', params.limite);
    if (params.page) searchParams.append('page', params.page);
    if (params.implantation) searchParams.append('implantation', params.implantation);
    if (params.nom) searchParams.append('nom', params.nom);
    if (params.arrondissement) searchParams.append('arrondissement', params.arrondissement);

    const endpoint = `/compteurs${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    return await this.makeRequest(endpoint);
  }

  // Charger les détails d'un compteur spécifique
  async loadCompteur(id) {
    return await this.makeRequest(`/compteurs/${id}`);
  }

  // Charger les données de passages d'un compteur - T2.3
  async loadPassages(compteurId, params = {}) {
    const searchParams = new URLSearchParams();
    
    if (params.debut) searchParams.append('debut', params.debut);
    if (params.fin) searchParams.append('fin', params.fin);
    if (params.intervalle) searchParams.append('intervalle', params.intervalle);

    const endpoint = `/compteurs/${compteurId}/passages${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    return await this.makeRequest(endpoint);
  }

  // Compatibilité avec l'ancien format (pour StatistiquesPassagesModal)
  async loadCSV(filename) {
    // Si c'est compteurs.csv, utiliser la nouvelle API
    if (filename === 'compteurs.csv') {
      const response = await this.loadCompteurs({ limite: 1000 });
      return response.data.map(compteur => ({
        ID: compteur.ID,
        Nom: compteur.Nom,
        Statut: compteur.Statut,
        Annee_implante: compteur.Annee_implante,
        Arrondissement: compteur.Arrondissement,
        Latitude: compteur.Latitude,
        Longitude: compteur.Longitude
      }));
    }
    
    // Pour d'autres CSV, garder l'ancienne méthode pour compatibilité
    throw new Error(`Format CSV ${filename} non supporté avec les APIs REST`);
  }

  // ===============================
  // POINTS D'INTÉRÊT - T4.2
  // ===============================

  // Charger les points d'intérêt avec filtres
  async loadPointsInteret(params = {}) {
    const searchParams = new URLSearchParams();
    
    if (params.limite) searchParams.append('limite', params.limite);
    if (params.page) searchParams.append('page', params.page);
    if (params.type) searchParams.append('type', params.type);
    if (params.territoire) searchParams.append('territoire', params.territoire);
    if (params.arrondissement) searchParams.append('arrondissement', params.arrondissement);
    if (params.nom) searchParams.append('nom', params.nom);

    const endpoint = `/pointsdinteret${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    return await this.makeRequest(endpoint);
  }

  // Créer un point d'intérêt - T2.5
  async createPointInteret(pointData) {
    return await this.makeRequest('/pointsdinteret', {
      method: 'POST',
      body: JSON.stringify(pointData)
    });
  }

  // Modifier un point d'intérêt - T2.5
  async updatePointInteret(id, pointData) {
    return await this.makeRequest(`/pointsdinteret/${id}`, {
      method: 'PUT',
      body: JSON.stringify(pointData)
    });
  }

  // Supprimer un point d'intérêt - T2.5
  async deletePointInteret(id) {
    return await this.makeRequest(`/pointsdinteret/${id}`, {
      method: 'DELETE'
    });
  }

  // Compatibilité avec l'ancien format pour PointsView.vue
  async loadCSVFontaines() {
    const response = await this.loadPointsInteret({ limite: 1000 });
    return response.data.map(point => ({
      Arrondissement: point.Arrondissement,
      'Lieu repère': point.Nom,
      Nom: point.Nom,
      Adresse: point.Adresse,
      Latitude: point.Latitude,
      Longitude: point.Longitude
    }));
  }

  // ===============================
  // PISTES CYCLABLES - T4.4
  // ===============================

  // Charger les pistes cyclables - T3.1
  async loadPistes(params = {}) {
    const searchParams = new URLSearchParams();
    
    if (params.populaireDebut) searchParams.append('populaireDebut', params.populaireDebut);
    if (params.populaireFin) searchParams.append('populaireFin', params.populaireFin);

    const endpoint = `/pistes${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    return await this.makeRequest(endpoint);
  }

  // Compatibilité avec l'ancien format pour NetworkView.vue
  async loadGeoJSON(filename) {
    if (filename === 'reseau_cyclable.geojson') {
      return await this.loadPistes();
    }
    
    if (filename === 'territoires.geojson') {
      return await this.loadTerritoires({ format: 'geojson' });
    }
    
    throw new Error(`Format GeoJSON ${filename} non supporté avec les APIs REST`);
  }

  // ===============================
  // TERRITOIRES
  // ===============================

  // Charger les territoires
  async loadTerritoires(params = {}) {
    const searchParams = new URLSearchParams();
    
    if (params.format) searchParams.append('format', params.format);

    const endpoint = `/territoires${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    return await this.makeRequest(endpoint);
  }

  // ===============================
  // AUTHENTIFICATION
  // ===============================

  // Connexion
  async login(email, password) {
    try {
      const response = await fetch(`${this.baseURL.replace('/gti525/v1', '')}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur de connexion');
      }

      const data = await response.json();
      
      // Stocker le token
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return data;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    }
  }

  // Inscription
  async register(userData) {
    try {
      const response = await fetch(`${this.baseURL.replace('/gti525/v1', '')}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur d\'inscription');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      throw error;
    }
  }

  // Déconnexion
  async logout() {
    try {
      await fetch(`${this.baseURL.replace('/gti525/v1', '')}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    } finally {
      // Nettoyer le stockage local
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  }

  // Vérifier le statut de connexion
  async checkAuthStatus() {
    try {
      const response = await fetch(`${this.baseURL.replace('/gti525/v1', '')}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        // Token invalide, nettoyer le stockage
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        return null;
      }
    } catch (error) {
      console.error('Erreur de vérification auth:', error);
      return null;
    }
  }

  // Obtenir l'utilisateur connecté
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  }
}

// Exporter une instance unique
export default new DataService();