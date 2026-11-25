/**
 * TrendKhoj India - LocalStorage Management Module
 * Handles favorites, search query history, user-imported datasets, and custom user outlines.
 * Completely private to the user's browser with zero cloud tracking.
 */

(function (window) {
  'use strict';

  const STORAGE_KEYS = {
    FAVORITES: 'trendkhoj_favorites_v1',
    SEARCH_HISTORY: 'trendkhoj_search_history_v1',
    CUSTOM_DATASET: 'trendkhoj_custom_dataset_v1',
    SAVED_OUTLINES: 'trendkhoj_saved_outlines_v1',
    VIEW_MODE: 'trendkhoj_view_mode_v1'
  };

  const Storage = {
    // -------------------------------------------------------------
    // FAVORITES
    // -------------------------------------------------------------
    getFavorites() {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.FAVORITES);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        console.warn('TrendKhoj: Unable to read favorites from localStorage', e);
        return [];
      }
    },

    isFavorite(topicId) {
      const favs = this.getFavorites();
      return favs.some(item => item.id === topicId);
    },

    toggleFavorite(topic) {
      if (!topic || !topic.id) return false;
      const favs = this.getFavorites();
      const index = favs.findIndex(item => item.id === topic.id);
      let isSaved = false;

      if (index > -1) {
        favs.splice(index, 1);
        isSaved = false;
      } else {
        favs.unshift({
          id: topic.id,
          title: topic.title,
          category: topic.category,
          searchVolume: topic.searchVolume,
          sourceName: topic.sourceName,
          sourceUrl: topic.sourceUrl,
          timestamp: topic.timestamp,
          status: topic.status,
          savedAt: new Date().toISOString()
        });
        isSaved = true;
      }

      try {
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favs));
      } catch (e) {
        console.error('TrendKhoj: Unable to save favorites', e);
      }
      return isSaved;
    },

    clearFavorites() {
      try {
        localStorage.removeItem(STORAGE_KEYS.FAVORITES);
        return true;
      } catch (e) {
        return false;
      }
    },

    // -------------------------------------------------------------
    // SEARCH HISTORY
    // -------------------------------------------------------------
    getSearchHistory() {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    },

    addSearchQuery(query) {
      if (!query || typeof query !== 'string') return;
      const clean = query.trim();
      if (clean.length < 2) return;

      let history = this.getSearchHistory();
      // Deduplicate case-insensitively
      history = history.filter(item => item.toLowerCase() !== clean.toLowerCase());
      // Insert at head
      history.unshift(clean);
      // Keep up to 10 recent searches
      if (history.length > 10) history = history.slice(0, 10);

      try {
        localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(history));
      } catch (e) {
        console.warn('TrendKhoj: Unable to write search history', e);
      }
    },

    removeSearchQuery(query) {
      let history = this.getSearchHistory();
      history = history.filter(item => item !== query);
      try {
        localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(history));
      } catch (e) {}
    },

    clearSearchHistory() {
      try {
        localStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
        return true;
      } catch (e) {
        return false;
      }
    },

    // -------------------------------------------------------------
    // CUSTOM / IMPORTED DATASETS
    // -------------------------------------------------------------
    getStoredDataset() {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_DATASET);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    saveStoredDataset(dataset, originName, timestamp) {
      try {
        const payload = {
          items: dataset,
          originName: originName || 'User Imported Data',
          importedAt: timestamp || new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEYS.CUSTOM_DATASET, JSON.stringify(payload));
        return true;
      } catch (e) {
        console.error('TrendKhoj: Unable to save custom dataset to localStorage', e);
        return false;
      }
    },

    clearStoredDataset() {
      try {
        localStorage.removeItem(STORAGE_KEYS.CUSTOM_DATASET);
        return true;
      } catch (e) {
        return false;
      }
    },

    // -------------------------------------------------------------
    // SAVED TOPIC OUTLINES
    // -------------------------------------------------------------
    getSavedOutline(topicId) {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.SAVED_OUTLINES);
        const outlines = raw ? JSON.parse(raw) : {};
        return outlines[topicId] || null;
      } catch (e) {
        return null;
      }
    },

    saveOutline(topicId, outlineText, lang) {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.SAVED_OUTLINES);
        const outlines = raw ? JSON.parse(raw) : {};
        outlines[topicId] = {
          content: outlineText,
          lang: lang || 'en',
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEYS.SAVED_OUTLINES, JSON.stringify(outlines));
        return true;
      } catch (e) {
        return false;
      }
    },

    // -------------------------------------------------------------
    // PREFERRED VIEW MODE (table / cards)
    // -------------------------------------------------------------
    getViewMode() {
      try {
        return localStorage.getItem(STORAGE_KEYS.VIEW_MODE) || 'auto';
      } catch (e) {
        return 'auto';
      }
    },

    setViewMode(mode) {
      try {
        localStorage.setItem(STORAGE_KEYS.VIEW_MODE, mode);
      } catch (e) {}
    }
  };

  window.TrendKhojStorage = Storage;
})(window);
