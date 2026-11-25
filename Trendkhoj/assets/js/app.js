/**
 * TrendKhoj India - Main Application Logic
 * Coordinates dataset state, search, category & time filters,
 * sorting, responsive views, modal controllers, and user interactions.
 */

(function () {
  'use strict';

  // -------------------------------------------------------------
  // STATE MANAGEMENT
  // -------------------------------------------------------------
  const state = {
    allTopics: [],
    filteredTopics: [],
    activeCategory: 'All',
    activeTimeFilter: 'all', // '4h', '24h', '48h', '7d', 'all'
    activeSort: 'volume-desc',
    searchQuery: '',
    viewMode: 'table', // 'table' or 'cards'
    showFavoritesOnly: false,
    activeTopicModal: null,
    activeOutlineLang: 'en',
    datasetMetadata: {
      isDemo: true,
      name: 'Curated Indian Trends (Demo Dataset)',
      importedAt: null
    }
  };

  // DOM Elements cache
  const DOM = {};

  // -------------------------------------------------------------
  // INITIALIZATION
  // -------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', initApp);

  function initApp() {
    cacheDOMElements();
    loadDataset();
    setupEventListeners();
    setupViewMode();
    renderSearchHistory();
    applyFiltersAndRender();
  }

  function cacheDOMElements() {
    DOM.searchInput = document.getElementById('search-topics-input');
    DOM.searchClearBtn = document.getElementById('search-clear-btn');
    DOM.searchHistoryContainer = document.getElementById('search-history-chips');
    DOM.clearHistoryBtn = document.getElementById('btn-clear-history');

    DOM.categoriesContainer = document.getElementById('categories-container');
    DOM.timeFilterButtons = document.querySelectorAll('[data-time-filter]');
    DOM.sortSelect = document.getElementById('sort-select');
    DOM.viewTableBtn = document.getElementById('view-mode-table');
    DOM.viewCardBtn = document.getElementById('view-mode-cards');

    DOM.tableContainer = document.getElementById('table-view-container');
    DOM.cardContainer = document.getElementById('card-view-container');
    DOM.tableBody = document.getElementById('trend-table-tbody');
    DOM.cardGrid = document.getElementById('trend-card-grid');
    DOM.emptyState = document.getElementById('empty-state-view');

    DOM.dataOriginBadge = document.getElementById('data-origin-badge');
    DOM.dataTimestampInfo = document.getElementById('data-timestamp-info');
    DOM.resetDatasetBtn = document.getElementById('btn-reset-demo-dataset');
    DOM.btnExportCsv = document.getElementById('btn-export-csv');

    DOM.favoritesNavBtn = document.getElementById('nav-favorites-btn');
    DOM.favCountBadge = document.getElementById('nav-fav-count');

    // Modals
    DOM.explorerModal = document.getElementById('modal-topic-explorer');
    DOM.csvModal = document.getElementById('modal-csv-import');
    DOM.rssModal = document.getElementById('modal-rss-import');
    DOM.toastContainer = document.getElementById('toast-container');
  }

  // -------------------------------------------------------------
  // DATASET LOADING & METADATA
  // -------------------------------------------------------------
  function loadDataset() {
    const custom = window.TrendKhojStorage.getStoredDataset();
    if (custom && Array.isArray(custom.items) && custom.items.length > 0) {
      state.allTopics = custom.items;
      state.datasetMetadata = {
        isDemo: false,
        name: custom.originName || 'User Imported Data',
        importedAt: custom.importedAt
      };
    } else {
      state.allTopics = Array.isArray(window.TRENDKHOJ_DEMO_DATA) ? [...window.TRENDKHOJ_DEMO_DATA] : [];
      state.datasetMetadata = {
        isDemo: true,
        name: 'Curated Indian Trends (Demo Dataset)',
        importedAt: null
      };
    }
    updateDataStatusBanner();
    updateFavoritesBadge();
  }

  function updateDataStatusBanner() {
    if (!DOM.dataOriginBadge) return;

    if (state.datasetMetadata.isDemo) {
      DOM.dataOriginBadge.className = 'dataset-pill demo';
      DOM.dataOriginBadge.innerHTML = '⚠️ DEMO DATASET (Illustrative Only)';
      DOM.dataTimestampInfo.innerHTML = `<strong>Note:</strong> Not live data. Purely illustrative for layout testing.`;
      if (DOM.resetDatasetBtn) DOM.resetDatasetBtn.style.display = 'none';
    } else {
      DOM.dataOriginBadge.className = 'dataset-pill live';
      DOM.dataOriginBadge.innerHTML = `📁 ${state.datasetMetadata.name}`;
      const timeStr = state.datasetMetadata.importedAt 
        ? new Date(state.datasetMetadata.importedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
        : 'Imported by user';
      DOM.dataTimestampInfo.innerHTML = `<span>Last imported: <strong>${timeStr}</strong> (${state.allTopics.length} topics)</span>`;
      if (DOM.resetDatasetBtn) DOM.resetDatasetBtn.style.display = 'inline-flex';
    }
  }

  // -------------------------------------------------------------
  // FILTERING & SORTING ENGINE
  // -------------------------------------------------------------
  function applyFiltersAndRender() {
    let list = [...state.allTopics];

    // 1. Favorites only filter
    if (state.showFavoritesOnly) {
      const favs = window.TrendKhojStorage.getFavorites();
      const favIds = new Set(favs.map(f => f.id));
      list = list.filter(item => favIds.has(item.id));
    }

    // 2. Category filter
    if (state.activeCategory && state.activeCategory !== 'All') {
      list = list.filter(item => (item.category || '').toLowerCase() === state.activeCategory.toLowerCase());
    }

    // 3. Time filter (relative to now)
    if (state.activeTimeFilter !== 'all') {
      const now = Date.now();
      const hoursMap = {
        '4h': 4,
        '24h': 24,
        '48h': 48,
        '7d': 168
      };
      const maxAgeMs = (hoursMap[state.activeTimeFilter] || 24) * 3600 * 1000;

      list = list.filter(item => {
        if (!item.timestamp) return false; // omit items with no supplied timestamp
        const itemTime = new Date(item.timestamp).getTime();
        return (now - itemTime) <= maxAgeMs && (now - itemTime) >= 0;
      });
    }

    // 4. Search Query filter
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      list = list.filter(item => {
        const titleMatch = (item.title || '').toLowerCase().includes(q);
        const catMatch = (item.category || '').toLowerCase().includes(q);
        const summaryMatch = (item.summary || '').toLowerCase().includes(q);
        const kwMatch = Array.isArray(item.relatedKeywords) 
          ? item.relatedKeywords.some(k => k.toLowerCase().includes(q))
          : false;
        return titleMatch || catMatch || summaryMatch || kwMatch;
      });
    }

    // 5. Sorting
    list.sort((a, b) => {
      switch (state.activeSort) {
        case 'volume-desc': {
          const volA = parseVolumeNumber(a.searchVolume);
          const volB = parseVolumeNumber(b.searchVolume);
          return volB - volA;
        }
        case 'volume-asc': {
          const volA = parseVolumeNumber(a.searchVolume);
          const volB = parseVolumeNumber(b.searchVolume);
          return volA - volB;
        }
        case 'title-asc':
          return (a.title || '').localeCompare(b.title || '');
        case 'title-desc':
          return (b.title || '').localeCompare(a.title || '');
        case 'recent': {
          const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return tB - tA;
        }
        default:
          return 0;
      }
    });

    state.filteredTopics = list;
    updateCategoryCounts();
    renderTopicList();
  }

  function parseVolumeNumber(volStr) {
    if (!volStr || typeof volStr !== 'string') return -1;
    let clean = volStr.toUpperCase().replace(/[^0-9KM+]/g, '');
    let multiplier = 1;
    if (clean.includes('K')) {
      multiplier = 1000;
      clean = clean.replace('K', '');
    } else if (clean.includes('M')) {
      multiplier = 1000000;
      clean = clean.replace('M', '');
    }
    const num = parseFloat(clean);
    return isNaN(num) ? -1 : num * multiplier;
  }

  function updateCategoryCounts() {
    const categories = ['All', 'Cricket', 'Education', 'Jobs', 'Technology', 'Entertainment', 'Automobile', 'Government'];
    categories.forEach(cat => {
      const badge = document.querySelector(`[data-cat-badge="${cat}"]`);
      if (badge) {
        if (cat === 'All') {
          badge.textContent = state.allTopics.length;
        } else {
          const count = state.allTopics.filter(t => (t.category || '').toLowerCase() === cat.toLowerCase()).length;
          badge.textContent = count;
        }
      }
    });
  }

  // -------------------------------------------------------------
  // RENDERING ENGINE: TABLE & CARDS
  // -------------------------------------------------------------
  function renderTopicList() {
    const items = state.filteredTopics;

    if (items.length === 0) {
      DOM.tableContainer.style.display = 'none';
      DOM.cardContainer.style.display = 'none';
      DOM.emptyState.style.display = 'block';
      return;
    }

    DOM.emptyState.style.display = 'none';

    if (state.viewMode === 'table') {
      DOM.tableContainer.style.display = 'block';
      DOM.cardContainer.style.display = 'none';
      renderTableView(items);
    } else {
      DOM.tableContainer.style.display = 'none';
      DOM.cardContainer.style.display = 'block';
      renderCardView(items);
    }
  }

  function renderTableView(items) {
    DOM.tableBody.innerHTML = '';
    const fragment = document.createDocumentFragment();

    items.forEach((topic, index) => {
      const tr = document.createElement('tr');
      const isFav = window.TrendKhojStorage.isFavorite(topic.id);

      // Volume display
      const volumeHtml = topic.searchVolume
        ? `<span class="volume-badge">📈 ${escapeHtml(topic.searchVolume)}</span>`
        : `<span class="volume-badge not-provided" title="Search volume was not provided in this dataset">Not Reported</span>`;

      // Status badge
      const statusHtml = topic.status
        ? `<span class="status-badge ${topic.status.toLowerCase() === 'active' ? 'active' : 'ended'}">${escapeHtml(topic.status)}</span>`
        : `<span class="status-badge unspecified">N/A</span>`;

      // Formatted timestamp
      const timeHtml = topic.timestamp
        ? formatTimeAgo(topic.timestamp)
        : '<span class="text-muted" title="Source did not provide timestamp">—</span>';

      const catClass = (topic.category || 'general').toLowerCase();

      tr.innerHTML = `
        <td class="col-rank">${index + 1}</td>
        <td class="col-topic">
          <a href="javascript:void(0)" class="topic-title-link" data-explore-id="${escapeHtml(topic.id)}">
            ${escapeHtml(topic.title)}
          </a>
          <p class="topic-summary-inline">${escapeHtml(topic.summary || '')}</p>
        </td>
        <td class="col-category">
          <span class="cat-tag ${catClass}">${escapeHtml(topic.category || 'General')}</span>
        </td>
        <td class="col-volume">${volumeHtml}</td>
        <td class="col-status">${statusHtml}</td>
        <td class="col-source">
          <a href="${escapeHtml(topic.sourceUrl || '#')}" target="_blank" rel="noopener noreferrer" class="source-link" title="Open official source">
            ${escapeHtml(topic.sourceName || 'Source')} ↗
          </a>
        </td>
        <td class="col-time">${timeHtml}</td>
        <td class="col-actions">
          <div class="action-btn-group">
            <button type="button" class="action-icon-btn ${isFav ? 'active-favorite' : ''}" data-fav-id="${escapeHtml(topic.id)}" title="${isFav ? 'Remove from saved' : 'Save topic'}">
              ${isFav ? '★' : '☆'}
            </button>
            <button type="button" class="action-icon-btn" data-share-id="${escapeHtml(topic.id)}" title="Share on WhatsApp or copy link">
              🔗
            </button>
            <button type="button" class="action-icon-btn" data-explore-id="${escapeHtml(topic.id)}" title="Analyze & Write Editorial Outline">
              ✍️
            </button>
          </div>
        </td>
      `;

      fragment.appendChild(tr);
    });

    DOM.tableBody.appendChild(fragment);
  }

  function renderCardView(items) {
    DOM.cardGrid.innerHTML = '';
    const fragment = document.createDocumentFragment();

    items.forEach((topic, index) => {
      const card = document.createElement('div');
      card.className = 'topic-card';
      const isFav = window.TrendKhojStorage.isFavorite(topic.id);
      const catClass = (topic.category || 'general').toLowerCase();

      // Check if image banner applies (Cricket or Education)
      let imageBannerHtml = '';
      if (catClass === 'cricket') {
        imageBannerHtml = `
          <div class="card-image-banner">
            <img 
              src="assets/images/cricket-category.jpg" 
              alt="Professional cricket stadium and players in action - ${escapeHtml(topic.title)}" 
              class="card-topic-img"
              loading="lazy"
              onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80';"
            >
            <div class="card-image-overlay" aria-hidden="true"></div>
            <span class="card-image-chip">🏏 Cricket Match & Squads</span>
          </div>
        `;
      } else if (catClass === 'education') {
        imageBannerHtml = `
          <div class="card-image-banner">
            <img 
              src="assets/images/education-category.jpg" 
              alt="University students studying with books and laptops - ${escapeHtml(topic.title)}" 
              class="card-topic-img"
              loading="lazy"
              onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80';"
            >
            <div class="card-image-overlay" aria-hidden="true"></div>
            <span class="card-image-chip">📚 Academic & Exams</span>
          </div>
        `;
      }

      const volumeHtml = topic.searchVolume
        ? `<span class="volume-badge">📈 ${escapeHtml(topic.searchVolume)}</span>`
        : `<span class="volume-badge not-provided">Volume: Not Reported</span>`;

      const timeHtml = topic.timestamp
        ? formatTimeAgo(topic.timestamp)
        : 'Time not reported';

      card.innerHTML = `
        ${imageBannerHtml}
        <div class="card-header-row">
          <span class="cat-tag ${catClass}">${escapeHtml(topic.category || 'General')}</span>
          <span class="text-muted" style="font-size:0.75rem; font-weight:700;">#${index + 1}</span>
        </div>
        <h3 class="card-title" data-explore-id="${escapeHtml(topic.id)}">
          ${escapeHtml(topic.title)}
        </h3>
        <p class="card-summary">${escapeHtml(topic.summary || '')}</p>
        <div class="card-metadata-row">
          <div>${volumeHtml}</div>
          <span class="text-muted">${timeHtml}</span>
        </div>
        <div class="card-footer-actions">
          <a href="${escapeHtml(topic.sourceUrl || '#')}" target="_blank" rel="noopener noreferrer" class="source-link" style="font-size:0.75rem;">
            🏛 ${escapeHtml(topic.sourceName || 'Source')} ↗
          </a>
          <div class="action-btn-group">
            <button type="button" class="action-icon-btn ${isFav ? 'active-favorite' : ''}" data-fav-id="${escapeHtml(topic.id)}" title="${isFav ? 'Remove from saved' : 'Save topic'}">
              ${isFav ? '★' : '☆'}
            </button>
            <button type="button" class="action-icon-btn" data-share-id="${escapeHtml(topic.id)}" title="Share topic">
              🔗
            </button>
            <button type="button" class="btn-nav-primary" style="font-size:0.75rem; padding: 0.35rem 0.65rem;" data-explore-id="${escapeHtml(topic.id)}">
              Analyze ✍️
            </button>
          </div>
        </div>
      `;

      fragment.appendChild(card);
    });

    DOM.cardGrid.appendChild(fragment);
  }

  // -------------------------------------------------------------
  // TOPIC EXPLORER MODAL CONTROLLER
  // -------------------------------------------------------------
  function openTopicExplorer(topicId) {
    const topic = state.allTopics.find(t => t.id === topicId) 
      || window.TrendKhojStorage.getFavorites().find(t => t.id === topicId);

    if (!topic) {
      showToast('Topic details not found.', 'error');
      return;
    }

    state.activeTopicModal = topic;

    // Fill Modal Header & Hero Info
    document.getElementById('explorer-topic-title').textContent = topic.title;
    document.getElementById('explorer-cat-tag').textContent = topic.category || 'General';
    document.getElementById('explorer-cat-tag').className = `cat-tag ${(topic.category || 'general').toLowerCase()}`;

    // Render Category Image Banner (for Cricket & Education)
    const bannerContainer = document.getElementById('explorer-image-banner-container');
    const catLower = (topic.category || '').toLowerCase();
    if (bannerContainer) {
      if (catLower === 'cricket') {
        bannerContainer.style.display = 'block';
        bannerContainer.innerHTML = `
          <div class="explorer-image-banner">
            <img 
              src="assets/images/cricket-category.jpg" 
              alt="Professional cricket stadium and pitch under floodlights" 
              class="explorer-banner-img"
              onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80';"
            >
            <div class="explorer-banner-overlay" aria-hidden="true"></div>
            <div class="explorer-banner-caption">
              <span>🏏 <strong>Cricket Trend Focus:</strong> Real-time match curiosities, squad buzz & BCCI updates</span>
            </div>
          </div>
        `;
      } else if (catLower === 'education') {
        bannerContainer.style.display = 'block';
        bannerContainer.innerHTML = `
          <div class="explorer-image-banner">
            <img 
              src="assets/images/education-category.jpg" 
              alt="University students studying with books and laptops in library" 
              class="explorer-banner-img"
              onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80';"
            >
            <div class="explorer-banner-overlay" aria-hidden="true"></div>
            <div class="explorer-banner-caption">
              <span>📚 <strong>Education & Exams Focus:</strong> Competitive exams, syllabus updates & academic notices</span>
            </div>
          </div>
        `;
      } else {
        bannerContainer.style.display = 'none';
        bannerContainer.innerHTML = '';
      }
    }

    // Fill metadata grid
    document.getElementById('explorer-volume-val').textContent = topic.searchVolume || 'Not provided by source';
    document.getElementById('explorer-status-val').textContent = topic.status || 'Unspecified';
    document.getElementById('explorer-time-val').textContent = topic.timestamp 
      ? new Date(topic.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
      : 'Not provided by source';
    document.getElementById('explorer-origin-val').textContent = topic.dataOrigin || 'TrendKhoj Core';

    // Source link
    const srcLink = document.getElementById('explorer-source-link');
    srcLink.href = topic.sourceUrl || '#';
    srcLink.textContent = `${topic.sourceName || 'Official Source'} ↗`;

    // Google Trends Official explore URL
    const googleTrendsUrl = `https://trends.google.com/trends/explore?geo=IN&q=${encodeURIComponent(topic.title)}`;
    document.getElementById('explorer-google-trends-btn').href = googleTrendsUrl;

    // Google News search link
    const googleNewsUrl = `https://news.google.com/search?q=${encodeURIComponent(topic.title)}&hl=en-IN&gl=IN&ceid=IN%3Aen`;
    document.getElementById('explorer-google-news-btn').href = googleNewsUrl;

    // Render Outline tab
    updateOutlineView();

    // Render Headlines & Social media tab
    renderHeadlinesAndSocial(topic);

    // Show modal
    DOM.explorerModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function updateOutlineView() {
    if (!state.activeTopicModal) return;
    const topic = state.activeTopicModal;

    // Check if user has a custom saved outline for this topic
    const saved = window.TrendKhojStorage.getSavedOutline(topic.id);
    const textarea = document.getElementById('explorer-outline-textarea');

    if (saved && saved.content) {
      textarea.value = saved.content;
      showToast('Loaded your previously saved outline notes.', 'info');
    } else {
      const generated = window.TrendKhojTemplates.generateOutline(topic, state.activeOutlineLang);
      textarea.value = generated;
    }
  }

  function renderHeadlinesAndSocial(topic) {
    const headlineContainer = document.getElementById('explorer-headlines-container');
    const socialContainer = document.getElementById('explorer-social-container');

    // Headlines
    const headlines = window.TrendKhojTemplates.generateHeadlines(topic);
    headlineContainer.innerHTML = '';
    headlines.forEach(hl => {
      const card = document.createElement('div');
      card.className = 'template-card';
      card.innerHTML = `
        <div class="template-header">
          <span class="template-title"><span class="badge-country">${escapeHtml(hl.badge)}</span> ${escapeHtml(hl.type)}</span>
          <button type="button" class="btn-sm-action copy-text-btn" data-copy-val="${escapeHtml(hl.text)}">📋 Copy</button>
        </div>
        <div class="template-content">${escapeHtml(hl.text)}</div>
      `;
      headlineContainer.appendChild(card);
    });

    // Social Captions
    const socialPosts = window.TrendKhojTemplates.generateSocialCaptions(topic);
    socialContainer.innerHTML = '';
    socialPosts.forEach(post => {
      const card = document.createElement('div');
      card.className = 'template-card';
      card.innerHTML = `
        <div class="template-header">
          <span class="template-title">${escapeHtml(post.icon)} ${escapeHtml(post.platform)}</span>
          <button type="button" class="btn-sm-action copy-text-btn" data-copy-val="${escapeHtml(post.content)}">📋 Copy</button>
        </div>
        <div class="template-content">${escapeHtml(post.content)}</div>
      `;
      socialContainer.appendChild(card);
    });
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => modal.classList.remove('open'));
    document.body.style.overflow = '';
  }

  // -------------------------------------------------------------
  // SHARING HANDLERS
  // -------------------------------------------------------------
  function handleShareTopic(topicId) {
    const topic = state.allTopics.find(t => t.id === topicId)
      || window.TrendKhojStorage.getFavorites().find(t => t.id === topicId);
    if (!topic) return;

    const shareTitle = `TrendKhoj India: ${topic.title}`;
    const shareText = `🇮🇳 Trending in India: "${topic.title}" (${topic.category}). Verified research via TrendKhoj India.`;
    const shareUrl = window.location.origin + window.location.pathname;

    // Check if Web Share API is available on mobile/supported browsers
    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl
      }).catch(() => {
        fallbackWhatsAppShare(topic, shareUrl);
      });
    } else {
      fallbackWhatsAppShare(topic, shareUrl);
    }
  }

  function fallbackWhatsAppShare(topic, shareUrl) {
    const waText = encodeURIComponent(
      `*🇮🇳 TrendKhoj India Trending Topic*\n\n` +
      `📌 *Topic:* ${topic.title}\n` +
      `📂 *Category:* ${topic.category}\n` +
      (topic.searchVolume ? `📈 *Search Interest:* ${topic.searchVolume}\n` : '') +
      `🏛 *Source:* ${topic.sourceName || 'Official Source'}\n\n` +
      `🔗 Discover more: ${shareUrl}`
    );
    const waUrl = `https://api.whatsapp.com/send?text=${waText}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }

  // -------------------------------------------------------------
  // CSV EXPORT ENGINE
  // -------------------------------------------------------------
  function exportFilteredCSV() {
    const items = state.filteredTopics;
    if (items.length === 0) {
      showToast('No topics currently match your filter to export.', 'error');
      return;
    }

    const headers = ['Topic Title', 'Category', 'Search Volume', 'Source Name', 'Source URL', 'Timestamp (ISO)', 'Status', 'Data Origin'];
    const rows = items.map(item => [
      `"${(item.title || '').replace(/"/g, '""')}"`,
      `"${(item.category || '').replace(/"/g, '""')}"`,
      `"${(item.searchVolume || 'Not Reported').replace(/"/g, '""')}"`,
      `"${(item.sourceName || '').replace(/"/g, '""')}"`,
      `"${(item.sourceUrl || '').replace(/"/g, '""')}"`,
      `"${(item.timestamp || '').replace(/"/g, '""')}"`,
      `"${(item.status || 'Active').replace(/"/g, '""')}"`,
      `"${(item.dataOrigin || 'TrendKhoj Core').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `trendkhoj-india-export-${state.activeCategory.toLowerCase()}-${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported ${items.length} topics to CSV successfully.`, 'success');
  }

  // -------------------------------------------------------------
  // EVENT LISTENERS SETUP
  // -------------------------------------------------------------
  function setupEventListeners() {
    // 1. Search input & debouncing
    let debounceTimer;
    DOM.searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const val = e.target.value.trim();
      DOM.searchClearBtn.style.display = val ? 'flex' : 'none';

      debounceTimer = setTimeout(() => {
        state.searchQuery = val;
        applyFiltersAndRender();
      }, 200);
    });

    DOM.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = e.target.value.trim();
        if (val) {
          window.TrendKhojStorage.addSearchQuery(val);
          renderSearchHistory();
        }
      }
    });

    DOM.searchClearBtn.addEventListener('click', () => {
      DOM.searchInput.value = '';
      DOM.searchClearBtn.style.display = 'none';
      state.searchQuery = '';
      applyFiltersAndRender();
      DOM.searchInput.focus();
    });

    if (DOM.clearHistoryBtn) {
      DOM.clearHistoryBtn.addEventListener('click', () => {
        window.TrendKhojStorage.clearSearchHistory();
        renderSearchHistory();
        showToast('Search history cleared.', 'info');
      });
    }

    // 2. Category Buttons
    if (DOM.categoriesContainer) {
      DOM.categoriesContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.cat-btn');
        if (!btn) return;
        const cat = btn.getAttribute('data-cat');
        state.activeCategory = cat;

        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyFiltersAndRender();
      });
    }

    // 3. Time Filter Buttons
    DOM.timeFilterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.timeFilterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeTimeFilter = btn.getAttribute('data-time-filter');
        applyFiltersAndRender();
      });
    });

    // 4. Sort select
    DOM.sortSelect.addEventListener('change', (e) => {
      state.activeSort = e.target.value;
      applyFiltersAndRender();
    });

    // 5. View Mode Toggle
    DOM.viewTableBtn.addEventListener('click', () => setViewMode('table'));
    DOM.viewCardBtn.addEventListener('click', () => setViewMode('cards'));

    // 6. Reset Dataset
    if (DOM.resetDatasetBtn) {
      DOM.resetDatasetBtn.addEventListener('click', () => {
        if (confirm('Revert back to original TrendKhoj Demo Dataset?')) {
          window.TrendKhojStorage.clearStoredDataset();
          loadDataset();
          applyFiltersAndRender();
          showToast('Restored default demo dataset.', 'info');
        }
      });
    }

    // 7. Export CSV Button
    if (DOM.btnExportCsv) {
      DOM.btnExportCsv.addEventListener('click', exportFilteredCSV);
    }

    // 8. Favorites Navigation Toggle
    if (DOM.favoritesNavBtn) {
      DOM.favoritesNavBtn.addEventListener('click', (e) => {
        e.preventDefault();
        state.showFavoritesOnly = !state.showFavoritesOnly;
        if (state.showFavoritesOnly) {
          DOM.favoritesNavBtn.classList.add('active');
          showToast('Displaying your saved favorite topics only.', 'info');
        } else {
          DOM.favoritesNavBtn.classList.remove('active');
          showToast('Displaying all topics.', 'info');
        }
        applyFiltersAndRender();
      });
    }

    // 9. Delegated clicks inside table and card grid
    document.addEventListener('click', (e) => {
      // Category spotlight action button ("View Cricket Topics" or "View Education Topics")
      const spotlightBtn = e.target.closest('[data-filter-category]');
      if (spotlightBtn) {
        const cat = spotlightBtn.getAttribute('data-filter-category');
        if (cat) {
          state.activeCategory = cat;
          document.querySelectorAll('.cat-btn').forEach(b => {
            if (b.getAttribute('data-cat') === cat) {
              b.classList.add('active');
            } else {
              b.classList.remove('active');
            }
          });
          applyFiltersAndRender();
          const target = document.querySelector('.controls-section');
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
          }
          showToast(`Filtered by ${cat} topics.`, 'info');
        }
        return;
      }

      // Open topic explorer
      const exploreTarget = e.target.closest('[data-explore-id]');
      if (exploreTarget) {
        const id = exploreTarget.getAttribute('data-explore-id');
        openTopicExplorer(id);
        return;
      }

      // Toggle favorite
      const favTarget = e.target.closest('[data-fav-id]');
      if (favTarget) {
        const id = favTarget.getAttribute('data-fav-id');
        const topic = state.allTopics.find(t => t.id === id);
        if (topic) {
          const isSaved = window.TrendKhojStorage.toggleFavorite(topic);
          updateFavoritesBadge();
          applyFiltersAndRender();
          showToast(isSaved ? 'Topic added to your Saved list.' : 'Topic removed from Saved list.', isSaved ? 'success' : 'info');
        }
        return;
      }

      // Share topic
      const shareTarget = e.target.closest('[data-share-id]');
      if (shareTarget) {
        const id = shareTarget.getAttribute('data-share-id');
        handleShareTopic(id);
        return;
      }

      // Generic Copy button
      const copyBtn = e.target.closest('.copy-text-btn');
      if (copyBtn) {
        const text = copyBtn.getAttribute('data-copy-val');
        if (text) {
          copyToClipboard(text, () => {
            const oldText = copyBtn.textContent;
            copyBtn.textContent = '✓ Copied!';
            showToast('Copied to clipboard!', 'success');
            setTimeout(() => { copyBtn.textContent = oldText; }, 2000);
          });
        }
        return;
      }

      // Modal close button
      if (e.target.closest('.modal-close-btn') || e.target.classList.contains('modal-overlay')) {
        closeAllModals();
      }
    });

    // 10. Topic Explorer Tabs
    document.querySelectorAll('.tab-btn[data-tab-target]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab-target');
        const container = btn.closest('.modal-card');
        container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        container.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const pane = document.getElementById(targetId);
        if (pane) pane.classList.add('active');
      });
    });

    // 11. Outline Language Switcher
    const langSelect = document.getElementById('outline-lang-select');
    if (langSelect) {
      langSelect.addEventListener('change', (e) => {
        state.activeOutlineLang = e.target.value;
        updateOutlineView();
      });
    }

    // 12. Save Custom Outline Button
    const btnSaveOutline = document.getElementById('btn-save-custom-outline');
    if (btnSaveOutline) {
      btnSaveOutline.addEventListener('click', () => {
        if (!state.activeTopicModal) return;
        const val = document.getElementById('explorer-outline-textarea').value;
        window.TrendKhojStorage.saveOutline(state.activeTopicModal.id, val, state.activeOutlineLang);
        showToast('Your custom outline notes have been saved locally.', 'success');
      });
    }

    // 13. Copy Outline Button
    const btnCopyOutline = document.getElementById('btn-copy-outline');
    if (btnCopyOutline) {
      btnCopyOutline.addEventListener('click', () => {
        const val = document.getElementById('explorer-outline-textarea').value;
        copyToClipboard(val, () => {
          showToast('Article outline copied to clipboard!', 'success');
        });
      });
    }

    // 14. Import Modals triggers
    const navImportCsvBtn = document.getElementById('nav-import-csv-btn');
    if (navImportCsvBtn) {
      navImportCsvBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openCSVModal();
      });
    }

    const navImportRssBtn = document.getElementById('nav-import-rss-btn');
    if (navImportRssBtn) {
      navImportRssBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openRSSModal();
      });
    }

    // Mobile nav hamburger
    const mobileBtn = document.getElementById('mobile-menu-toggle');
    const navLinks = document.getElementById('nav-links-menu');
    if (mobileBtn && navLinks) {
      mobileBtn.addEventListener('click', () => {
        navLinks.classList.toggle('mobile-open');
      });
    }

    // Setup CSV Importer listeners
    setupCSVImporterEvents();

    // Setup RSS Importer listeners
    setupRSSImporterEvents();
  }

  // -------------------------------------------------------------
  // CSV IMPORTER WORKFLOW
  // -------------------------------------------------------------
  let currentCSVInspection = null;
  let currentCSVFileName = 'data.csv';

  function openCSVModal() {
    DOM.csvModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    resetCSVModalView();
  }

  function resetCSVModalView() {
    document.getElementById('csv-step-upload').style.display = 'block';
    document.getElementById('csv-step-mapping').style.display = 'none';
    document.getElementById('csv-file-input').value = '';
    currentCSVInspection = null;
  }

  function setupCSVImporterEvents() {
    const fileInput = document.getElementById('csv-file-input');
    const dropzone = document.getElementById('csv-dropzone');
    const btnSampleDownload = document.getElementById('btn-download-sample-csv');
    const btnApplyImport = document.getElementById('btn-apply-csv-import');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          processSelectedCSVFile(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          processSelectedCSVFile(e.target.files[0]);
        }
      });
    }

    if (btnSampleDownload) {
      btnSampleDownload.addEventListener('click', (e) => {
        e.preventDefault();
        window.open('sample-trends.csv', '_blank');
      });
    }

    if (btnApplyImport) {
      btnApplyImport.addEventListener('click', () => {
        if (!currentCSVInspection) return;

        const mapping = {
          titleIndex: parseInt(document.getElementById('map-col-title').value, 10),
          categoryIndex: parseInt(document.getElementById('map-col-cat').value, 10),
          volumeIndex: parseInt(document.getElementById('map-col-vol').value, 10),
          sourceNameIndex: parseInt(document.getElementById('map-col-source-name').value, 10),
          sourceUrlIndex: parseInt(document.getElementById('map-col-source-url').value, 10),
          timestampIndex: parseInt(document.getElementById('map-col-time').value, 10),
          statusIndex: parseInt(document.getElementById('map-col-status').value, 10)
        };

        if (mapping.titleIndex === -1) {
          showToast('Please map the Topic Title column (required).', 'error');
          return;
        }

        const result = window.TrendKhojImporters.processMappedCSV(
          currentCSVInspection.rawRows,
          mapping,
          currentCSVFileName
        );

        if (result.validCount === 0) {
          showToast('No valid rows found to import. Check column mappings.', 'error');
          return;
        }

        // Save imported topics to storage
        const importTime = new Date().toISOString();
        window.TrendKhojStorage.saveStoredDataset(result.items, `CSV (${currentCSVFileName})`, importTime);

        // Update state
        state.allTopics = result.items;
        state.datasetMetadata = {
          isDemo: false,
          name: `Imported CSV: ${currentCSVFileName}`,
          importedAt: importTime
        };

        updateDataStatusBanner();
        applyFiltersAndRender();
        closeAllModals();

        showToast(`Successfully imported ${result.validCount} topics (${result.errorCount} skipped).`, 'success');
      });
    }
  }

  function processSelectedCSVFile(file) {
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      showToast('Please select a valid .csv file.', 'error');
      return;
    }

    currentCSVFileName = file.name;
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const text = e.target.result;
        currentCSVInspection = window.TrendKhojImporters.inspectCSV(text);
        renderCSVMappingUI(currentCSVInspection);
      } catch (err) {
        showToast(`CSV Parse Error: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
  }

  function renderCSVMappingUI(inspection) {
    document.getElementById('csv-step-upload').style.display = 'none';
    document.getElementById('csv-step-mapping').style.display = 'block';
    document.getElementById('csv-filename-display').textContent = currentCSVFileName;
    document.getElementById('csv-rowcount-display').textContent = `${inspection.totalDataRows} rows detected`;

    const headers = inspection.headers;
    const selects = [
      { id: 'map-col-title', selected: inspection.detectedMapping.titleIndex },
      { id: 'map-col-cat', selected: inspection.detectedMapping.categoryIndex },
      { id: 'map-col-vol', selected: inspection.detectedMapping.volumeIndex },
      { id: 'map-col-source-name', selected: inspection.detectedMapping.sourceNameIndex },
      { id: 'map-col-source-url', selected: inspection.detectedMapping.sourceUrlIndex },
      { id: 'map-col-time', selected: inspection.detectedMapping.timestampIndex },
      { id: 'map-col-status', selected: inspection.detectedMapping.statusIndex }
    ];

    selects.forEach(({ id, selected }) => {
      const sel = document.getElementById(id);
      if (!sel) return;
      sel.innerHTML = '<option value="-1">-- Not Provided / Skip --</option>';
      headers.forEach((h, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = `Col ${idx + 1}: ${h}`;
        if (idx === selected) opt.selected = true;
        sel.appendChild(opt);
      });
    });
  }

  // -------------------------------------------------------------
  // RSS / ATOM IMPORTER WORKFLOW
  // -------------------------------------------------------------
  function openRSSModal() {
    DOM.rssModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function setupRSSImporterEvents() {
    const btnFetchRss = document.getElementById('btn-fetch-rss');
    const btnParseXml = document.getElementById('btn-parse-manual-xml');

    if (btnFetchRss) {
      btnFetchRss.addEventListener('click', async () => {
        const urlInput = document.getElementById('rss-feed-url').value.trim();
        const proxyMode = document.getElementById('rss-proxy-select').value;
        const statusElem = document.getElementById('rss-fetch-status');

        if (!urlInput) {
          showToast('Please enter an RSS Feed URL.', 'error');
          return;
        }

        statusElem.style.display = 'block';
        statusElem.textContent = 'Fetching feed through proxy, please wait...';
        btnFetchRss.disabled = true;

        try {
          const result = await window.TrendKhojImporters.fetchRemoteRSS(urlInput, proxyMode);
          applyRSSResult(result, `RSS Feed: ${urlInput}`);
        } catch (err) {
          statusElem.style.display = 'block';
          statusElem.innerHTML = `<span style="color:#DC2626;">⚠️ ${err.message}</span>`;
          showToast('Feed fetch failed. Try Safe Manual Paste tab.', 'error');
        } finally {
          btnFetchRss.disabled = false;
        }
      });
    }

    if (btnParseXml) {
      btnParseXml.addEventListener('click', () => {
        const rawXml = document.getElementById('rss-manual-textarea').value.trim();
        if (!rawXml) {
          showToast('Please paste valid RSS / Atom XML content into the box.', 'error');
          return;
        }

        try {
          const result = window.TrendKhojImporters.parseRSSXML(rawXml, 'Pasted XML');
          applyRSSResult(result, 'Safe Manual RSS Paste');
        } catch (err) {
          showToast(`XML Parse Error: ${err.message}`, 'error');
        }
      });
    }
  }

  function applyRSSResult(result, originLabel) {
    if (!result || result.items.length === 0) {
      showToast('No topics found in the feed.', 'error');
      return;
    }

    const importTime = new Date().toISOString();
    window.TrendKhojStorage.saveStoredDataset(result.items, originLabel, importTime);

    state.allTopics = result.items;
    state.datasetMetadata = {
      isDemo: false,
      name: originLabel,
      importedAt: importTime
    };

    updateDataStatusBanner();
    applyFiltersAndRender();
    closeAllModals();
    showToast(`Successfully imported ${result.items.length} topics from RSS feed!`, 'success');
  }

  // -------------------------------------------------------------
  // VIEW MODE PREFERENCE
  // -------------------------------------------------------------
  function setupViewMode() {
    const saved = window.TrendKhojStorage.getViewMode();
    if (saved === 'cards' || (saved === 'auto' && window.innerWidth < 768)) {
      setViewMode('cards', false);
    } else {
      setViewMode('table', false);
    }
  }

  function setViewMode(mode, save = true) {
    state.viewMode = mode;
    if (save) window.TrendKhojStorage.setViewMode(mode);

    if (mode === 'table') {
      DOM.viewTableBtn.classList.add('active');
      DOM.viewCardBtn.classList.remove('active');
    } else {
      DOM.viewTableBtn.classList.remove('active');
      DOM.viewCardBtn.classList.add('active');
    }

    renderTopicList();
  }

  // -------------------------------------------------------------
  // SEARCH HISTORY RENDERING
  // -------------------------------------------------------------
  function renderSearchHistory() {
    if (!DOM.searchHistoryContainer) return;
    const history = window.TrendKhojStorage.getSearchHistory();

    if (history.length === 0) {
      DOM.searchHistoryContainer.innerHTML = '';
      if (DOM.clearHistoryBtn) DOM.clearHistoryBtn.style.display = 'none';
      return;
    }

    if (DOM.clearHistoryBtn) DOM.clearHistoryBtn.style.display = 'inline';

    let html = '<span class="search-history-label">Recent:</span>';
    history.forEach(q => {
      html += `
        <span class="history-chip">
          <span class="chip-query" style="cursor:pointer;" data-chip-search="${escapeHtml(q)}">${escapeHtml(q)}</span>
          <span class="history-chip-remove" data-chip-remove="${escapeHtml(q)}" title="Remove query">✕</span>
        </span>
      `;
    });

    DOM.searchHistoryContainer.innerHTML = html;

    // Attach chip click listeners
    DOM.searchHistoryContainer.querySelectorAll('[data-chip-search]').forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.getAttribute('data-chip-search');
        DOM.searchInput.value = query;
        DOM.searchClearBtn.style.display = 'flex';
        state.searchQuery = query;
        applyFiltersAndRender();
      });
    });

    DOM.searchHistoryContainer.querySelectorAll('[data-chip-remove]').forEach(removeBtn => {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const query = removeBtn.getAttribute('data-chip-remove');
        window.TrendKhojStorage.removeSearchQuery(query);
        renderSearchHistory();
      });
    });
  }

  function updateFavoritesBadge() {
    if (!DOM.favCountBadge) return;
    const count = window.TrendKhojStorage.getFavorites().length;
    DOM.favCountBadge.textContent = count;
    DOM.favCountBadge.style.display = count > 0 ? 'inline-flex' : 'none';
  }

  // -------------------------------------------------------------
  // UTILITY HELPERS
  // -------------------------------------------------------------
  function formatTimeAgo(isoString) {
    if (!isoString) return '—';
    const time = new Date(isoString).getTime();
    if (isNaN(time)) return '—';

    const diffSec = Math.floor((Date.now() - time) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    const days = Math.floor(diffSec / 86400);
    if (days < 7) return `${days}d ago`;

    return new Date(time).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function copyToClipboard(text, callback) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(callback).catch(() => fallbackCopy(text, callback));
    } else {
      fallbackCopy(text, callback);
    }
  }

  function fallbackCopy(text, callback) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      if (callback) callback();
    } catch (e) {
      showToast('Could not copy automatically. Please copy manually.', 'error');
    }
    document.body.removeChild(ta);
  }

  function showToast(message, type = 'info') {
    if (!DOM.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : (type === 'error' ? '⚠️' : 'ℹ️');
    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;

    DOM.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3500);
  }

  window.showTrendKhojToast = showToast;
})();
