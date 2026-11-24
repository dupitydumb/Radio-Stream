// ═══════════════════════════════════════════════════════════════════════════
// ONLINE RADIO PLUGIN FOR AUDION (Radio-Browser.info version)
// ═══════════════════════════════════════════════════════════════════════════
// Stream thousands of live radio stations using the free Radio-Browser.info API.
// Features: Segmented navigation (Explore, Countries, Genres, Favorites, Custom),
//           responsive station card grids with 1:1 artwork, live visualizer pulse,
//           bitrate badges, category filter chips, and sticky bottom mini-player.
// ═══════════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  let pluginApi = null;

  // ── API base – multiple mirrors for reliability ─────────────────────────
  const API_BASE_URLS = [
    "https://de1.api.radio-browser.info",
    "https://nl1.api.radio-browser.info",
    "https://fr1.api.radio-browser.info",
  ];
  let currentApiBase = API_BASE_URLS[0];

  // Helper to try different mirrors (uses api.fetch to bypass CORS)
  async function apiFetch(path) {
    const doFetch = (pluginApi && pluginApi.fetch) ? pluginApi.fetch.bind(pluginApi) : fetch;
    for (const base of API_BASE_URLS) {
      try {
        const url = `${base}${path}`;
        const res = await doFetch(url);
        if (res.ok) {
          currentApiBase = base;
          return res.json();
        }
      } catch (e) {
        // continue to next
      }
    }
    throw new Error("All Radio-Browser mirrors failed");
  }

  // ── Icons ───────────────────────────────────────────────────────────────
  const I = {
    radio:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 7l-8-4"/><circle cx="17" cy="14" r="2"/><path d="M5 11h4M5 15h4"/></svg>`,
    search:  `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    play:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
    pause:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
    star:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    starO:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    plus:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    back:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>`,
    trash:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>`,
    close:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    explore: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
    globe:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    music:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    refresh: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
  };

  // Popular genre discovery chips
  const CURATED_GENRES = [
    "All", "Pop", "Rock", "Jazz", "Classical", "Electronic", "News", "Talk",
    "Chillout", "Ambient", "Dance", "Hip Hop", "Indie", "Country", "Metal", "Blues"
  ];

  // ── Main plugin ─────────────────────────────────────────────────────────
  const OnlineRadio = {
    name: "Online Radio",
    api: null,

    // State
    isOpen: false,
    activeTab: "explore",        // "explore", "countries", "genres", "favorites", "custom"
    view: "explore",             // matches activeTab or "country-detail", "genre-detail", "search"
    navStack: [],
    currentData: null,
    currentTitle: "Online Radio",
    selectedGenre: "All",

    favorites: new Set(),        // Set of station IDs
    favoritesData: {},           // id -> station object for instant offline render
    customStations: [],          // array of custom station objects
    nowPlaying: null,            // { station, isPlaying }

    // Cache (in-memory)
    countriesCache: null,
    topTagsCache: null,
    popularCache: null,
    stationsCache: new Map(),    // key -> { data, timestamp }

    // ── Lifecycle ────────────────────────────────────────────────────────
    async init(api) {
      console.log("[OnlineRadio] Initializing Redesigned Radio Plugin...");
      this.api = api;
      pluginApi = api;

      // Register StreamProvider for Audion v1.5.0+
      if (api.stream?.registerProvider) {
        api.stream.registerProvider({
          id: "radio",
          name: "Online Radio",
          version: "1.5.0",
          description: "Live internet radio stream provider",
          getStream: async (url) => ({ url, format: "audio/stream" }),
          resolveByQuery: async () => null
        });
        console.log("[OnlineRadio] StreamProvider 'radio' registered for v1.5.0+");
      } else if (api.stream?.registerResolver) {
        api.stream.registerResolver("radio", async (url) => url);
      }

      await this.loadState();
      this.injectStyles();
      this.buildPanel();
      this.createPlayerBarButton();

      if (api.on) {
        api.on("playbackState", ({ isPlaying }) => {
          if (this.nowPlaying) {
            this.nowPlaying.isPlaying = isPlaying;
            this.updateNowPlayingBar();
            this.updateAllPlayButtons();
          }
        });
        api.on("trackChange", ({ track }) => {
          if (track?.source_type !== "radio") {
            this.nowPlaying = null;
            this.updateNowPlayingBar();
            this.updateAllPlayButtons();
          }
        });
      }

      // Pre-fetch basic metadata in background
      this.fetchCountries();
      this.fetchTopTags();
      this.fetchPopularStations();

      console.log("[OnlineRadio] Ready");
    },

    start() {},
    stop() { this.close(); },
    destroy() {
      this.close();
      if (this.api?.ui?.unregisterSlot) {
        this.api.ui.unregisterSlot("playerbar:menu");
      }
      if (this.api?.stream?.unregisterProvider) {
        this.api.stream.unregisterProvider("radio");
      } else if (this.api?.stream?.unregisterResolver) {
        this.api.stream.unregisterResolver("radio");
      }
      ["or-styles", "or-panel", "or-overlay", "or-playerbar-btn"].forEach(id => {
        document.getElementById(id)?.remove();
      });
    },

    // ── Persistence ──────────────────────────────────────────────────────
    async loadState() {
      if (!this.api?.storage?.get) return;
      try {
        const fav = await this.api.storage.get("or-favorites");
        if (fav) this.favorites = new Set(JSON.parse(fav));

        const favData = await this.api.storage.get("or-favorites-data");
        if (favData) this.favoritesData = JSON.parse(favData);

        const cust = await this.api.storage.get("or-custom");
        if (cust) this.customStations = JSON.parse(cust);
      } catch (e) {
        console.warn("[OnlineRadio] Load state error:", e);
      }
    },

    async saveState() {
      if (!this.api?.storage?.set) return;
      try {
        await this.api.storage.set("or-favorites", JSON.stringify([...this.favorites]));
        await this.api.storage.set("or-favorites-data", JSON.stringify(this.favoritesData));
        await this.api.storage.set("or-custom", JSON.stringify(this.customStations));
      } catch (e) {
        console.error("[OnlineRadio] Save state error:", e);
      }
    },

    // ── API Helpers ───────────────────────────────────────────────────────
    async fetchCountries() {
      if (this.countriesCache) return this.countriesCache;
      try {
        const data = await apiFetch("/json/countries");
        const sorted = data.sort((a, b) => b.stationcount - a.stationcount).slice(0, 48);
        this.countriesCache = sorted;
        return sorted;
      } catch (err) {
        console.error("[OnlineRadio] Failed to fetch countries:", err);
        return [];
      }
    },

    async fetchTopTags(limit = 32) {
      if (this.topTagsCache) return this.topTagsCache;
      try {
        const data = await apiFetch("/json/tags");
        const sorted = data.sort((a, b) => b.stationcount - a.stationcount).slice(0, limit);
        this.topTagsCache = sorted;
        return sorted;
      } catch (err) {
        console.error("[OnlineRadio] Failed to fetch tags:", err);
        return [];
      }
    },

    async fetchPopularStations(limit = 30) {
      if (this.popularCache) return this.popularCache;
      try {
        const data = await apiFetch(`/json/stations/topclick/${limit}`);
        const stations = this.normalizeStations(data);
        this.popularCache = stations;
        return stations;
      } catch (err) {
        console.error("[OnlineRadio] Failed to fetch popular stations:", err);
        return [];
      }
    },

    async fetchStationsByCountry(countryCode) {
      const key = `country_${countryCode}`;
      const cached = this.stationsCache.get(key);
      if (cached && (Date.now() - cached.timestamp < 3600000)) return cached.data;

      try {
        const data = await apiFetch(`/json/stations/bycountrycodeexact/${countryCode}?limit=120&hidebroken=true&order=clickcount&reverse=true`);
        const stations = this.normalizeStations(data);
        this.stationsCache.set(key, { data: stations, timestamp: Date.now() });
        return stations;
      } catch (err) {
        console.error("[OnlineRadio] Failed to fetch country stations:", err);
        return [];
      }
    },

    async fetchStationsByTag(tag) {
      const key = `tag_${tag}`;
      const cached = this.stationsCache.get(key);
      if (cached && (Date.now() - cached.timestamp < 3600000)) return cached.data;

      try {
        const data = await apiFetch(`/json/stations/bytag/${encodeURIComponent(tag)}?limit=120&hidebroken=true&order=clickcount&reverse=true`);
        const stations = this.normalizeStations(data);
        this.stationsCache.set(key, { data: stations, timestamp: Date.now() });
        return stations;
      } catch (err) {
        console.error("[OnlineRadio] Failed to fetch tag stations:", err);
        return [];
      }
    },

    async searchStations(query, tag = null) {
      if (!query.trim() && !tag) return [];
      const key = `search_${query}_${tag || ''}`;
      const cached = this.stationsCache.get(key);
      if (cached && (Date.now() - cached.timestamp < 600000)) return cached.data;

      try {
        let endpoint = `/json/stations/search?limit=120&hidebroken=true&order=clickcount&reverse=true`;
        if (query.trim()) endpoint += `&name=${encodeURIComponent(query.trim())}`;
        if (tag && tag !== "All") endpoint += `&tag=${encodeURIComponent(tag)}`;

        const data = await apiFetch(endpoint);
        const stations = this.normalizeStations(data);
        this.stationsCache.set(key, { data: stations, timestamp: Date.now() });
        return stations;
      } catch (err) {
        console.error("[OnlineRadio] Search failed:", err);
        return [];
      }
    },

    normalizeStations(apiStations) {
      return (apiStations || []).map(s => ({
        id: s.stationuuid,
        name: (s.name || "Unknown Station").trim(),
        genre: s.tags ? s.tags.split(',').map(t => t.trim()).filter(Boolean)[0] : 'Radio',
        url: s.url_resolved || s.url,
        countryCode: s.countrycode,
        countryName: s.country,
        countryFlag: this.getFlagEmoji(s.countrycode),
        favicon: s.favicon && s.favicon.startsWith("http") ? s.favicon : null,
        bitrate: s.bitrate ? parseInt(s.bitrate) : null,
        codec: s.codec || "MP3",
      }));
    },

    getFlagEmoji(countryCode) {
      if (!countryCode || countryCode.length !== 2) return "🌍";
      try {
        const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
        return String.fromCodePoint(...codePoints);
      } catch {
        return "🌍";
      }
    },

    // ── Artwork Placeholder Generator ────────────────────────────────────
    generateCoverPlaceholder(name, genre) {
      const initial = (name || "R").charAt(0).toUpperCase();
      const emoji = this.genreToEmoji(genre);
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#282828" />
              <stop offset="100%" stop-color="#181818" />
            </linearGradient>
          </defs>
          <rect width="160" height="160" fill="url(#grad)" rx="8" />
          <circle cx="80" cy="80" r="54" fill="#121212" opacity="0.6" />
          <text x="80" y="76" font-size="44" text-anchor="middle" fill="#ffffff" font-weight="bold" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif">${initial}</text>
          <text x="80" y="118" font-size="24" text-anchor="middle" fill="#1DB954">${emoji}</text>
        </svg>`;
      return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.trim());
    },

    genreToEmoji(genre) {
      const map = {
        jazz: "🎷", classical: "🎻", rock: "🎸", metal: "🤘", electronic: "🎛️",
        ambient: "🌊", chill: "☕", news: "📰", talk: "🗣️", pop: "🎤",
        hiphop: "🎧", rap: "🎧", dance: "🪩", indie: "🎸", world: "🌐",
        reggae: "🌴", blues: "🎺", country: "🤠", folk: "🪕",
      };
      if (!genre) return "📻";
      const g = genre.toLowerCase();
      for (const [key, emoji] of Object.entries(map)) {
        if (g.includes(key)) return emoji;
      }
      return "📻";
    },

    // ── Playback ─────────────────────────────────────────────────────────
    async playStation(station) {
      if (!this.api?.player?.setTrack) {
        this.toast("Player control not available", true);
        return;
      }
      try {
        const cover = station.favicon || this.generateCoverPlaceholder(station.name, station.genre);
        await this.api.player.setTrack({
          title:       station.name,
          artist:      station.genre || "Online Radio",
          album:       station.countryName ? `📻 ${station.countryFlag} ${station.countryName}` : "📻 Online Radio",
          duration:    0,
          cover_url:   cover,
          source_type: "radio",
          external_id: station.url
        });
        this.nowPlaying = { station, isPlaying: true };
        this.updateNowPlayingBar();
        this.updateAllPlayButtons();
      } catch (err) {
        console.error("[OnlineRadio] Play error:", err);
        this.toast("Could not play station. Check stream URL.", true);
      }
    },

    // ── Favorites ────────────────────────────────────────────────────────
    toggleFavorite(station) {
      if (!station?.id) return;
      const id = station.id;
      if (this.favorites.has(id)) {
        this.favorites.delete(id);
        delete this.favoritesData[id];
        this.toast("Removed from favorites");
      } else {
        this.favorites.add(id);
        this.favoritesData[id] = station;
        this.toast("Added to favorites ⭐");
      }
      this.saveState();
      this.updateAllFavoriteButtons();

      if (this.view === "favorites") {
        this.renderFavoritesView();
      }
    },

    getFavoriteStations() {
      const favs = [];
      // Custom stations
      for (const cust of this.customStations) {
        if (this.favorites.has(cust.id)) {
          favs.push({ ...cust, countryFlag: "🔧", countryName: "My Stations" });
        }
      }
      // Saved API stations
      for (const id of this.favorites) {
        if (!id.startsWith("custom-") && this.favoritesData[id]) {
          favs.push(this.favoritesData[id]);
        }
      }
      return favs;
    },

    // ── Navigation ───────────────────────────────────────────────────────
    switchTab(tabId) {
      if (this.activeTab === tabId && this.view === tabId) return;
      this.activeTab = tabId;
      this.view = tabId;
      this.navStack = [];
      this.setHeader(this.getTabTitle(tabId), false);
      this.updateActiveTabIndicator();
      this.renderCurrentView();
    },

    getTabTitle(tabId) {
      switch (tabId) {
        case "explore":   return "Explore Radio";
        case "countries": return "Browse Countries";
        case "genres":    return "Browse Genres";
        case "favorites": return "Favorite Stations";
        case "custom":    return "Custom Stations";
        default:          return "Online Radio";
      }
    },

    pushNav(view, data, title) {
      this.navStack.push({ view: this.view, activeTab: this.activeTab, data: this.currentData, title: this.currentTitle });
      this.view = view;
      this.currentData = data;
      this.currentTitle = title;
      this.setHeader(title, true);
    },

    goBack() {
      if (this.navStack.length > 0) {
        const prev = this.navStack.pop();
        this.view = prev.view;
        this.activeTab = prev.activeTab;
        this.currentData = prev.data;
        this.currentTitle = prev.title;
        this.setHeader(prev.title, this.navStack.length > 0);
        this.updateActiveTabIndicator();
        this.renderCurrentView();
      } else {
        this.switchTab("explore");
      }
    },

    setHeader(title, showBack) {
      const titleEl = document.getElementById("or-title");
      const backBtn = document.getElementById("or-back-btn");
      if (titleEl) titleEl.textContent = title;
      if (backBtn) backBtn.style.display = showBack ? "inline-flex" : "none";
    },

    updateActiveTabIndicator() {
      document.querySelectorAll(".or-tab").forEach(tab => {
        const isActive = tab.dataset.tab === this.activeTab;
        tab.classList.toggle("active", isActive);
        tab.setAttribute("aria-selected", isActive ? "true" : "false");
        tab.setAttribute("tabindex", isActive ? "0" : "-1");
      });
    },

    renderCurrentView() {
      if (this.view === "explore") this.renderExploreView();
      else if (this.view === "countries") this.renderCountriesView();
      else if (this.view === "genres") this.renderGenresView();
      else if (this.view === "favorites") this.renderFavoritesView();
      else if (this.view === "custom") this.renderCustomView();
      else if (this.view === "country-detail") this.renderCountryDetailView(this.currentData);
      else if (this.view === "genre-detail") this.renderGenreDetailView(this.currentData);
      else if (this.view === "search") this.renderSearchResultsView(this.currentData);
    },

    // ── Views ─────────────────────────────────────────────────────────────

    // 1. Explore View (Featured + Quick Chips + Popular Grid)
    async renderExploreView() {
      const body = document.getElementById("or-body");
      if (!body) return;
      body.innerHTML = `<div class="or-loading"><div class="or-spinner"></div><div>Loading live stations...</div></div>`;

      const [popular, countries] = await Promise.all([
        this.fetchPopularStations(36),
        this.fetchCountries()
      ]);

      let html = `<div class="or-view-wrap">`;

      // Quick Genre Chips Bar
      html += `
        <div class="or-chips-rail" role="region" aria-label="Genre filters">
          ${CURATED_GENRES.map(g => `
            <button class="or-chip ${g === this.selectedGenre ? 'active' : ''}" data-chip-genre="${this.esc(g)}">
              ${this.esc(g)}
            </button>
          `).join('')}
        </div>
      `;

      // Popular Stations Section
      html += `
        <div class="or-section-header">
          <h2 class="or-section-title">Trending Global Stations</h2>
          <span class="or-section-badge">${popular.length} live</span>
        </div>
        <div class="or-card-grid">
          ${popular.map(s => this.renderStationCard(s)).join("")}
        </div>
      `;

      // Quick Country Discovery Section
      if (countries && countries.length) {
        html += `
          <div class="or-section-header" style="margin-top: 16px;">
            <h2 class="or-section-title">Explore by Country</h2>
            <button class="or-link-btn" id="or-see-all-countries">See All (${countries.length}) →</button>
          </div>
          <div class="or-quick-countries">
            ${countries.slice(0, 12).map(c => `
              <button class="or-country-tile" data-country-code="${c.iso_3166_1}">
                <span class="or-tile-flag">${this.getFlagEmoji(c.iso_3166_1)}</span>
                <span class="or-tile-name">${this.esc(c.name)}</span>
                <span class="or-tile-count">${c.stationcount}</span>
              </button>
            `).join("")}
          </div>
        `;
      }

      html += `</div>`;
      body.innerHTML = html;

      // Event listeners
      body.querySelectorAll("[data-chip-genre]").forEach(btn => {
        btn.onclick = () => {
          const genre = btn.dataset.chipGenre;
          this.selectedGenre = genre;
          if (genre === "All") {
            this.renderExploreView();
          } else {
            this.pushNav("genre-detail", genre, `${genre} Radio`);
            this.renderGenreDetailView(genre);
          }
        };
      });

      body.querySelectorAll("[data-country-code]").forEach(btn => {
        btn.onclick = () => {
          const code = btn.dataset.countryCode;
          const country = (this.countriesCache || []).find(c => c.iso_3166_1 === code);
          if (country) {
            this.pushNav("country-detail", country, `${this.getFlagEmoji(code)} ${country.name}`);
            this.renderCountryDetailView(country);
          }
        };
      });

      const seeAllBtn = body.querySelector("#or-see-all-countries");
      if (seeAllBtn) seeAllBtn.onclick = () => this.switchTab("countries");

      this.attachCardListeners(body);
    },

    // 2. Countries View
    async renderCountriesView() {
      const body = document.getElementById("or-body");
      if (!body) return;
      body.innerHTML = `<div class="or-loading"><div class="or-spinner"></div><div>Loading countries...</div></div>`;

      const countries = await this.fetchCountries();

      let html = `
        <div class="or-view-wrap">
          <div class="or-section-header">
            <h2 class="or-section-title">Worldwide Broadcasts</h2>
            <span class="or-section-badge">${countries.length} countries</span>
          </div>
          <div class="or-country-grid">
            ${countries.map(c => `
              <div class="or-country-card" data-country-code="${c.iso_3166_1}">
                <span class="or-card-country-flag">${this.getFlagEmoji(c.iso_3166_1)}</span>
                <div class="or-card-country-info">
                  <div class="or-card-country-name">${this.esc(c.name)}</div>
                  <div class="or-card-country-sub">${c.stationcount} stations</div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
      body.innerHTML = html;

      body.querySelectorAll("[data-country-code]").forEach(el => {
        el.onclick = () => {
          const code = el.dataset.countryCode;
          const country = countries.find(c => c.iso_3166_1 === code);
          if (country) {
            this.pushNav("country-detail", country, `${this.getFlagEmoji(code)} ${country.name}`);
            this.renderCountryDetailView(country);
          }
        };
      });
    },

    // 3. Genres View
    async renderGenresView() {
      const body = document.getElementById("or-body");
      if (!body) return;
      body.innerHTML = `<div class="or-loading"><div class="or-spinner"></div><div>Loading genres...</div></div>`;

      const tags = await this.fetchTopTags(40);

      let html = `
        <div class="or-view-wrap">
          <div class="or-section-header">
            <h2 class="or-section-title">Music & Talk Genres</h2>
            <span class="or-section-badge">${tags.length} genres</span>
          </div>
          <div class="or-genres-grid">
            ${tags.map(t => `
              <button class="or-genre-card" data-genre-tag="${this.esc(t.name)}">
                <span class="or-genre-emoji">${this.genreToEmoji(t.name)}</span>
                <div class="or-genre-info">
                  <span class="or-genre-name">${this.esc(t.name)}</span>
                  <span class="or-genre-count">${t.stationcount} stations</span>
                </div>
              </button>
            `).join("")}
          </div>
        </div>
      `;
      body.innerHTML = html;

      body.querySelectorAll("[data-genre-tag]").forEach(btn => {
        btn.onclick = () => {
          const tag = btn.dataset.genreTag;
          this.pushNav("genre-detail", tag, `Genre: ${tag}`);
          this.renderGenreDetailView(tag);
        };
      });
    },

    // 4. Favorites View
    renderFavoritesView() {
      const body = document.getElementById("or-body");
      if (!body) return;

      const favs = this.getFavoriteStations();

      if (favs.length === 0) {
        body.innerHTML = `
          <div class="or-empty-state">
            <div class="or-empty-icon">⭐</div>
            <h3 class="or-empty-title">No Favorites Yet</h3>
            <p class="or-empty-sub">Star any station in Explore, Countries, or Search to build your personal lineup.</p>
            <button class="or-btn-primary" id="or-empty-explore-btn">Browse Popular Stations</button>
          </div>
        `;
        const btn = body.querySelector("#or-empty-explore-btn");
        if (btn) btn.onclick = () => this.switchTab("explore");
        return;
      }

      body.innerHTML = `
        <div class="or-view-wrap">
          <div class="or-section-header">
            <h2 class="or-section-title">Your Favorite Stations</h2>
            <span class="or-section-badge">${favs.length} saved</span>
          </div>
          <div class="or-card-grid">
            ${favs.map(s => this.renderStationCard(s)).join("")}
          </div>
        </div>
      `;
      this.attachCardListeners(body);
    },

    // 5. Custom Stations View
    renderCustomView() {
      const body = document.getElementById("or-body");
      if (!body) return;

      let html = `
        <div class="or-view-wrap">
          <div class="or-custom-form-card">
            <div class="or-form-title">${I.plus} Add Custom Stream URL</div>
            <div class="or-form-grid">
              <div class="or-field">
                <label class="or-label" for="or-f-name">Station Name *</label>
                <input class="or-input" id="or-f-name" type="text" placeholder="e.g. Chillhop Cafe Live">
              </div>
              <div class="or-field">
                <label class="or-label" for="or-f-url">Stream Audio URL *</label>
                <input class="or-input" id="or-f-url" type="url" placeholder="https://stream.example.com/live.mp3">
              </div>
              <div class="or-field">
                <label class="or-label" for="or-f-genre">Genre (optional)</label>
                <input class="or-input" id="or-f-genre" type="text" placeholder="e.g. Lo-Fi / Jazz">
              </div>
              <div class="or-field">
                <label class="or-label" for="or-f-country">Country / City (optional)</label>
                <input class="or-input" id="or-f-country" type="text" placeholder="e.g. Japan">
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:12px; margin-top:8px;">
              <button class="or-btn-primary" id="or-add-save">${I.plus} Save Station</button>
              <div class="or-status" id="or-add-status"></div>
            </div>
          </div>

          <div class="or-section-header" style="margin-top:20px;">
            <h2 class="or-section-title">My Custom Streams</h2>
            <span class="or-section-badge">${this.customStations.length} stations</span>
          </div>
      `;

      if (this.customStations.length === 0) {
        html += `
          <div class="or-empty-sub" style="padding: 24px 0; text-align: center;">
            No custom stations added yet. Paste any direct MP3, AAC, or OGG stream above.
          </div>
        `;
      } else {
        html += `
          <div class="or-card-grid">
            ${this.customStations.map(s => this.renderStationCard({ ...s, countryFlag: "🔧", countryName: "Custom" }, true)).join("")}
          </div>
        `;
      }

      html += `</div>`;
      body.innerHTML = html;

      const saveBtn = body.querySelector("#or-add-save");
      if (saveBtn) saveBtn.onclick = () => this.saveCustomStation();

      body.querySelectorAll(".or-card-del-btn").forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          this.deleteCustomStation(btn.dataset.delId);
        };
      });

      this.attachCardListeners(body);
    },

    // Sub-view: Country stations
    async renderCountryDetailView(country) {
      const body = document.getElementById("or-body");
      if (!body) return;
      body.innerHTML = `<div class="or-loading"><div class="or-spinner"></div><div>Loading stations for ${this.esc(country.name)}...</div></div>`;

      const stations = await this.fetchStationsByCountry(country.iso_3166_1);

      if (stations.length === 0) {
        body.innerHTML = `
          <div class="or-empty-state">
            <div class="or-empty-icon">📡</div>
            <h3 class="or-empty-title">No Stations Found</h3>
            <p class="or-empty-sub">We couldn't reach any active stations for this country right now.</p>
          </div>
        `;
        return;
      }

      body.innerHTML = `
        <div class="or-view-wrap">
          <div class="or-section-header">
            <h2 class="or-section-title">${this.getFlagEmoji(country.iso_3166_1)} ${this.esc(country.name)}</h2>
            <span class="or-section-badge">${stations.length} stations</span>
          </div>
          <div class="or-card-grid">
            ${stations.map(s => this.renderStationCard(s)).join("")}
          </div>
        </div>
      `;
      this.attachCardListeners(body);
    },

    // Sub-view: Genre stations
    async renderGenreDetailView(tag) {
      const body = document.getElementById("or-body");
      if (!body) return;
      body.innerHTML = `<div class="or-loading"><div class="or-spinner"></div><div>Loading ${this.esc(tag)} stations...</div></div>`;

      const stations = await this.fetchStationsByTag(tag);

      if (stations.length === 0) {
        body.innerHTML = `
          <div class="or-empty-state">
            <div class="or-empty-icon">📡</div>
            <h3 class="or-empty-title">No Stations Found</h3>
            <p class="or-empty-sub">No stations currently tagged with "${this.esc(tag)}".</p>
          </div>
        `;
        return;
      }

      body.innerHTML = `
        <div class="or-view-wrap">
          <div class="or-section-header">
            <h2 class="or-section-title">${this.genreToEmoji(tag)} ${this.esc(tag)} Stations</h2>
            <span class="or-section-badge">${stations.length} stations</span>
          </div>
          <div class="or-card-grid">
            ${stations.map(s => this.renderStationCard(s)).join("")}
          </div>
        </div>
      `;
      this.attachCardListeners(body);
    },

    // Sub-view: Search results
    async renderSearchResultsView(query) {
      const body = document.getElementById("or-body");
      if (!body) return;
      body.innerHTML = `<div class="or-loading"><div class="or-spinner"></div><div>Searching stations for "${this.esc(query)}"...</div></div>`;

      const stations = await this.searchStations(query);

      if (stations.length === 0) {
        body.innerHTML = `
          <div class="or-empty-state">
            <div class="or-empty-icon">🔍</div>
            <h3 class="or-empty-title">No Results Found</h3>
            <p class="or-empty-sub">No radio stations matched "${this.esc(query)}". Try another name or genre.</p>
          </div>
        `;
        return;
      }

      body.innerHTML = `
        <div class="or-view-wrap">
          <div class="or-section-header">
            <h2 class="or-section-title">Search Results for "${this.esc(query)}"</h2>
            <span class="or-section-badge">${stations.length} found</span>
          </div>
          <div class="or-card-grid">
            ${stations.map(s => this.renderStationCard(s)).join("")}
          </div>
        </div>
      `;
      this.attachCardListeners(body);
    },

    // ── Station Card Component (1:1 Artwork, Bitrate Badge, Pulse) ────────
    renderStationCard(station, isCustom = false) {
      const isPlaying = this.nowPlaying?.station?.id === station.id && this.nowPlaying.isPlaying;
      const isFaved = this.favorites.has(station.id);
      const artwork = station.favicon || this.generateCoverPlaceholder(station.name, station.genre);
      const bitrateLabel = station.bitrate ? `${station.bitrate}k` : (station.codec || "LIVE");

      return `
        <div class="or-card ${isPlaying ? 'now-playing' : ''}"
             data-station-id="${this.esc(station.id)}"
             data-name="${this.esc(station.name)}"
             data-url="${this.esc(station.url)}"
             data-genre="${this.esc(station.genre || '')}"
             data-country="${this.esc(station.countryName || '')}"
             data-country-flag="${this.esc(station.countryFlag || '')}"
             data-favicon="${this.esc(station.favicon || '')}"
             data-bitrate="${station.bitrate || ''}"
             data-codec="${this.esc(station.codec || 'MP3')}"
             tabindex="0"
             role="button"
             aria-label="Play ${this.esc(station.name)}">

          <div class="or-card-thumb-wrap">
            <img class="or-card-thumb"
                 src="${this.esc(artwork)}"
                 alt="${this.esc(station.name)}"
                 loading="lazy"
                 onerror="this.onerror=null; this.src='${this.generateCoverPlaceholder(station.name, station.genre)}';" />

            <!-- Bitrate Badge -->
            <span class="or-bitrate-badge">${this.esc(bitrateLabel)}</span>

            <!-- Favorite Star Button -->
            <button class="or-card-fav-btn ${isFaved ? 'faved' : ''}"
                    data-card-fav="${this.esc(station.id)}"
                    title="${isFaved ? 'Remove from favorites' : 'Add to favorites'}"
                    aria-label="${isFaved ? 'Remove from favorites' : 'Add to favorites'}">
              ${isFaved ? I.star : I.starO}
            </button>

            <!-- Delete Custom Station Button -->
            ${isCustom ? `
              <button class="or-card-del-btn" data-del-id="${this.esc(station.id)}" title="Delete station" aria-label="Delete station">
                ${I.trash}
              </button>
            ` : ''}

            <!-- Equalizer Live Pulse (when playing) -->
            ${isPlaying ? `
              <div class="or-visualizer-pulse" aria-hidden="true">
                <span class="or-v-bar"></span>
                <span class="or-v-bar"></span>
                <span class="or-v-bar"></span>
              </div>
            ` : ''}

            <!-- Play / Pause Overlay Button -->
            <div class="or-card-play-ov">
              <button class="or-card-play-action" data-card-play="${this.esc(station.id)}" aria-label="${isPlaying ? 'Pause' : 'Play'}">
                ${isPlaying ? I.pause : I.play}
              </button>
            </div>
          </div>

          <div class="or-card-info">
            <div class="or-card-name" title="${this.esc(station.name)}">${this.esc(station.name)}</div>
            <div class="or-card-meta">
              <span class="or-card-flag">${station.countryFlag || '🌍'}</span>
              <span class="or-card-genre">${this.esc(station.genre || 'Radio')}</span>
            </div>
          </div>
        </div>
      `;
    },

    // Attach click handlers to station cards
    attachCardListeners(container) {
      container.querySelectorAll(".or-card").forEach(card => {
        card.onclick = async (e) => {
          // If clicked on favorite button or delete button, let their handlers work
          if (e.target.closest("[data-card-fav]") || e.target.closest(".or-card-del-btn")) {
            return;
          }

          const station = this.extractStationFromCard(card);
          if (station) {
            await this.playStation(station);
          }
        };

        // Keyboard activation
        card.onkeydown = (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            const station = this.extractStationFromCard(card);
            if (station) this.playStation(station);
          }
        };
      });

      container.querySelectorAll("[data-card-fav]").forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const card = btn.closest(".or-card");
          if (!card) return;
          const station = this.extractStationFromCard(card);
          if (station) this.toggleFavorite(station);
        };
      });
    },

    extractStationFromCard(card) {
      if (!card) return null;
      return {
        id: card.dataset.stationId,
        name: card.dataset.name,
        url: card.dataset.url,
        genre: card.dataset.genre,
        countryName: card.dataset.country,
        countryFlag: card.dataset.countryFlag,
        favicon: card.dataset.favicon,
        bitrate: card.dataset.bitrate ? parseInt(card.dataset.bitrate) : null,
        codec: card.dataset.codec || "MP3",
      };
    },

    // ── Custom Stations Form Logic ────────────────────────────────────────
    saveCustomStation() {
      const name = document.getElementById("or-f-name")?.value.trim();
      const url = document.getElementById("or-f-url")?.value.trim();
      const genre = document.getElementById("or-f-genre")?.value.trim();
      const country = document.getElementById("or-f-country")?.value.trim();
      const status = document.getElementById("or-add-status");

      if (!name) {
        if (status) { status.className = "or-status err"; status.textContent = "Please enter a station name."; }
        return;
      }
      if (!url || !url.startsWith("http")) {
        if (status) { status.className = "or-status err"; status.textContent = "Valid stream URL required (http/https)."; }
        return;
      }

      const station = {
        id: `custom-${Date.now()}`,
        name,
        url,
        genre: genre || "Custom",
        countryName: country || "Custom",
        countryFlag: "🔧",
        bitrate: 128,
        codec: "MP3"
      };

      this.customStations.push(station);
      this.favorites.add(station.id);
      this.favoritesData[station.id] = station;
      this.saveState();

      this.toast(`Added custom station: ${name}`);
      this.renderCustomView();
    },

    deleteCustomStation(id) {
      this.customStations = this.customStations.filter(s => s.id !== id);
      this.favorites.delete(id);
      delete this.favoritesData[id];
      this.saveState();
      this.toast("Station removed");
      this.renderCustomView();
    },

    // ── Now Playing Mini-Player Bar (Sticky Bottom Dock) ──────────────────
    updateNowPlayingBar() {
      const bar = document.getElementById("or-now-bar");
      const dot = document.getElementById("or-now-dot");
      const name = document.getElementById("or-now-name");
      const meta = document.getElementById("or-now-meta");
      const thumb = document.getElementById("or-now-thumb");
      const playBtn = document.getElementById("or-now-play-btn");
      if (!bar) return;

      if (this.nowPlaying && this.nowPlaying.station) {
        bar.classList.add("visible");
        const s = this.nowPlaying.station;
        if (name) name.textContent = s.name;
        if (meta) {
          const parts = [s.countryFlag, s.countryName, s.genre, s.bitrate ? `${s.bitrate}kbps` : null].filter(Boolean);
          meta.textContent = parts.join(" · ");
        }
        if (thumb) {
          thumb.src = s.favicon || this.generateCoverPlaceholder(s.name, s.genre);
        }
        if (dot) {
          dot.className = `or-now-dot ${this.nowPlaying.isPlaying ? 'live' : 'paused'}`;
        }
        if (playBtn) {
          playBtn.innerHTML = this.nowPlaying.isPlaying ? I.pause : I.play;
        }
      } else {
        bar.classList.remove("visible");
      }
    },

    updateAllPlayButtons() {
      document.querySelectorAll(".or-card").forEach(card => {
        const id = card.dataset.stationId;
        const isNow = this.nowPlaying?.station?.id === id && this.nowPlaying.isPlaying;
        card.classList.toggle("now-playing", isNow);

        const btn = card.querySelector(".or-card-play-action");
        if (btn) btn.innerHTML = isNow ? I.pause : I.play;

        let pulse = card.querySelector(".or-visualizer-pulse");
        if (isNow && !pulse) {
          const thumbWrap = card.querySelector(".or-card-thumb-wrap");
          if (thumbWrap) {
            pulse = document.createElement("div");
            pulse.className = "or-visualizer-pulse";
            pulse.setAttribute("aria-hidden", "true");
            pulse.innerHTML = `<span class="or-v-bar"></span><span class="or-v-bar"></span><span class="or-v-bar"></span>`;
            thumbWrap.appendChild(pulse);
          }
        } else if (!isNow && pulse) {
          pulse.remove();
        }
      });
    },

    updateAllFavoriteButtons() {
      document.querySelectorAll("[data-card-fav]").forEach(btn => {
        const id = btn.dataset.cardFav;
        const faved = this.favorites.has(id);
        btn.classList.toggle("faved", faved);
        btn.innerHTML = faved ? I.star : I.starO;
        btn.title = faved ? "Remove from favorites" : "Add to favorites";
      });
    },

    // ── Panel Construction & Styles ──────────────────────────────────────
    injectStyles() {
      if (document.getElementById("or-styles")) return;
      const s = document.createElement("style");
      s.id = "or-styles";
      s.textContent = `
        /* Overlay Backdrop */
        #or-overlay {
          position: fixed; inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          z-index: 10000;
          opacity: 0; visibility: hidden;
          transition: opacity var(--transition-fast, 150ms ease);
        }
        #or-overlay.open { opacity: 1; visibility: visible; }

        /* Dialog Panel (Desktop Default) */
        #or-panel {
          position: fixed; top: 50%; left: 50%;
          transform: translate(-50%, -50%) scale(0.97);
          width: min(840px, 94vw);
          height: min(84vh, 760px);
          background: var(--bg-elevated, #181818);
          border: 1px solid var(--border-color, #404040);
          border-radius: var(--radius-lg, 12px);
          z-index: 10001;
          box-shadow: var(--shadow-lg, 0 16px 40px rgba(0, 0, 0, 0.6));
          display: flex; flex-direction: column;
          overflow: hidden;
          opacity: 0; visibility: hidden;
          color: var(--text-primary, #ffffff);
          transition: transform var(--transition-normal, 200ms ease), opacity var(--transition-normal, 200ms ease);
        }
        #or-panel.open {
          opacity: 1; visibility: visible;
          transform: translate(-50%, -50%) scale(1);
        }

        /* Accessible Focus Indicators Across All Elements */
        #or-panel *:focus-visible {
          outline: 2px solid var(--accent-primary, #1DB954);
          outline-offset: 2px;
        }

        /* Header Row */
        .or-header {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 18px;
          border-bottom: 1px solid var(--border-color, #333333);
          background: var(--bg-elevated, #181818);
          flex-shrink: 0; min-height: 54px;
        }
        .or-title {
          font-size: var(--font-size-md, 16px);
          font-weight: var(--font-weight-bold, 700);
          color: var(--text-primary, #ffffff);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .or-icon-btn {
          background: transparent; border: none;
          color: var(--text-secondary, #c8c8c8);
          cursor: pointer; min-width: 36px; min-height: 36px;
          border-radius: var(--radius-full, 9999px);
          display: inline-flex; align-items: center; justify-content: center;
          transition: background var(--transition-fast, 150ms ease), color var(--transition-fast, 150ms ease);
          flex-shrink: 0;
        }
        .or-icon-btn:hover {
          background: var(--bg-highlight, #3e3e3e);
          color: var(--text-primary, #ffffff);
        }

        /* Search input bar */
        #or-search-wrap {
          flex: 1; max-width: 380px;
          display: flex; align-items: center; gap: 8px;
          background: var(--bg-surface, #282828);
          border: 1px solid var(--border-color, #404040);
          border-radius: var(--radius-md, 8px);
          padding: 0 12px; height: 36px;
          transition: border-color var(--transition-fast, 150ms ease);
        }
        #or-search-wrap:focus-within {
          border-color: var(--accent-primary, #1DB954);
        }
        #or-search-wrap svg { color: var(--text-subdued, #8e8e8e); flex-shrink: 0; }
        #or-search-input {
          flex: 1; background: transparent; border: none; outline: none;
          color: var(--text-primary, #ffffff);
          font-size: var(--font-size-sm, 13px);
        }
        #or-search-input::placeholder { color: var(--text-subdued, #8e8e8e); }

        /* Segmented Top Tabs */
        .or-tabs-nav {
          display: flex; gap: 4px; padding: 0 18px;
          background: var(--bg-elevated, #181818);
          border-bottom: 1px solid var(--border-color, #333333);
          flex-shrink: 0; overflow-x: auto; scrollbar-width: none;
        }
        .or-tabs-nav::-webkit-scrollbar { display: none; }
        .or-tab {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 14px;
          font-size: var(--font-size-sm, 13px);
          font-weight: var(--font-weight-semibold, 600);
          color: var(--text-secondary, #c8c8c8);
          cursor: pointer; background: transparent;
          border-top: none; border-left: none; border-right: none;
          border-bottom: 2px solid transparent;
          white-space: nowrap;
          transition: color var(--transition-fast, 150ms ease), border-color var(--transition-fast, 150ms ease);
        }
        .or-tab:hover { color: var(--text-primary, #ffffff); }
        .or-tab.active {
          color: var(--text-primary, #ffffff);
          border-bottom-color: var(--accent-primary, #1DB954);
        }
        .or-tab svg { flex-shrink: 0; }

        /* Category Chips Rail */
        .or-chips-rail {
          display: flex; gap: 8px; padding: 12px 18px 4px;
          overflow-x: auto; scrollbar-width: none; flex-shrink: 0;
        }
        .or-chips-rail::-webkit-scrollbar { display: none; }
        .or-chip {
          padding: 6px 14px; border-radius: var(--radius-full, 9999px);
          font-size: var(--font-size-xs, 12px); font-weight: 500;
          border: 1px solid var(--border-color, #404040);
          background: transparent; color: var(--text-secondary, #c8c8c8);
          cursor: pointer; white-space: nowrap;
          transition: all var(--transition-fast, 150ms ease);
        }
        .or-chip:hover {
          border-color: var(--text-secondary, #c8c8c8);
          color: var(--text-primary, #ffffff);
        }
        .or-chip.active {
          background: var(--accent-primary, #1DB954);
          border-color: var(--accent-primary, #1DB954);
          color: #000000; font-weight: 700;
        }

        /* Scrollable Main Content Body */
        .or-body {
          flex: 1; overflow-y: auto; overflow-x: hidden;
          background: var(--bg-base, #121212);
          padding-bottom: calc(72px + max(12px, env(safe-area-inset-bottom, 0px)));
          scroll-padding-bottom: calc(72px + max(12px, env(safe-area-inset-bottom, 0px)));
        }
        .or-body::-webkit-scrollbar { width: 6px; }
        .or-body::-webkit-scrollbar-thumb {
          background: var(--border-color, #404040);
          border-radius: var(--radius-sm, 4px);
        }
        .or-view-wrap { padding: 4px 18px 24px; }

        /* Section Headers */
        .or-section-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 0 10px;
        }
        .or-section-title {
          font-size: var(--font-size-base, 14px);
          font-weight: var(--font-weight-bold, 700);
          color: var(--text-primary, #ffffff);
          margin: 0; letter-spacing: -0.2px;
        }
        .or-section-badge {
          font-size: var(--font-size-xs, 12px);
          color: var(--text-subdued, #8e8e8e);
        }
        .or-link-btn {
          background: none; border: none; color: var(--accent-primary, #1DB954);
          font-size: var(--font-size-xs, 12px); font-weight: 600; cursor: pointer;
        }
        .or-link-btn:hover { text-decoration: underline; }

        /* ── Responsive Card Grid ───────────────────────────────────────── */
        .or-card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(154px, 1fr));
          gap: 16px;
        }
        .or-card {
          background: var(--bg-surface, #282828);
          border: 1px solid var(--border-color, #383838);
          border-radius: var(--radius-md, 8px);
          padding: 10px; cursor: pointer;
          transition: transform var(--transition-fast, 150ms ease), border-color var(--transition-fast, 150ms ease), background var(--transition-fast, 150ms ease);
          display: flex; flex-direction: column;
          position: relative;
        }
        .or-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.2);
          background: var(--bg-highlight, #333333);
        }
        .or-card.now-playing {
          border-color: var(--accent-primary, #1DB954);
          background: var(--accent-subtle, rgba(29, 185, 84, 0.12));
        }

        /* 1:1 Aspect Artwork Thumbnail */
        .or-card-thumb-wrap {
          position: relative; width: 100%; aspect-ratio: 1 / 1;
          border-radius: var(--radius-sm, 4px); overflow: hidden;
          background: var(--bg-elevated, #181818);
          display: flex; align-items: center; justify-content: center;
        }
        .or-card-thumb {
          width: 100%; height: 100%; object-fit: cover; display: block;
        }

        /* Bitrate Badge */
        .or-bitrate-badge {
          position: absolute; top: 6px; right: 6px;
          background: rgba(0, 0, 0, 0.72);
          color: var(--text-secondary, #c8c8c8);
          font-size: 10px; font-weight: 700;
          font-variant-numeric: tabular-nums;
          padding: 2px 6px; border-radius: var(--radius-sm, 4px);
          backdrop-filter: blur(4px);
          pointer-events: none; z-index: 2;
        }

        /* Card Favorite Button */
        .or-card-fav-btn {
          position: absolute; top: 6px; left: 6px;
          width: 30px; height: 30px; border-radius: 50%;
          background: rgba(0, 0, 0, 0.65);
          color: var(--text-subdued, #8e8e8e);
          border: none; display: flex; align-items: center; justify-content: center;
          cursor: pointer; opacity: 0; z-index: 3;
          transition: opacity var(--transition-fast, 150ms ease), transform var(--transition-fast, 150ms ease), color var(--transition-fast, 150ms ease);
        }
        .or-card:hover .or-card-fav-btn,
        .or-card:focus-within .or-card-fav-btn { opacity: 1; }
        .or-card-fav-btn.faved {
          opacity: 1; color: var(--accent-warning, #ffae42);
        }
        .or-card-fav-btn:hover { transform: scale(1.15); }

        /* Card Delete Button (Custom stations) */
        .or-card-del-btn {
          position: absolute; bottom: 6px; left: 6px;
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(0, 0, 0, 0.7);
          color: var(--error-color, #f15e6c);
          border: none; display: flex; align-items: center; justify-content: center;
          cursor: pointer; z-index: 3;
          opacity: 0; transition: opacity var(--transition-fast, 150ms ease);
        }
        .or-card:hover .or-card-del-btn { opacity: 1; }

        /* Play/Pause Hover Overlay */
        .or-card-play-ov {
          position: absolute; inset: 0;
          background: rgba(0, 0, 0, 0.45);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity var(--transition-fast, 150ms ease);
          z-index: 2;
        }
        .or-card:hover .or-card-play-ov,
        .or-card:focus-within .or-card-play-ov { opacity: 1; }
        .or-card.now-playing .or-card-play-ov { opacity: 1; background: transparent; }
        .or-card.now-playing:hover .or-card-play-ov { background: rgba(0, 0, 0, 0.45); }

        .or-card-play-action {
          width: 44px; height: 44px; border-radius: 50%;
          background: var(--accent-primary, #1DB954);
          color: #000000; border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,0.4));
          transform: scale(0.9); transition: transform var(--transition-fast, 150ms ease);
        }
        .or-card-play-action:hover { transform: scale(1.08); }

        /* Live Equalizer Visualizer Pulse Indicator */
        .or-visualizer-pulse {
          position: absolute; bottom: 8px; left: 8px;
          display: flex; align-items: flex-end; gap: 3px;
          height: 16px; padding: 3px 5px; border-radius: var(--radius-sm, 4px);
          background: rgba(0, 0, 0, 0.7); z-index: 3;
        }
        .or-v-bar {
          width: 3px; background: var(--accent-primary, #1DB954);
          border-radius: 1px;
          animation: or-eq-jump 0.8s ease-in-out infinite alternate;
        }
        .or-v-bar:nth-child(1) { height: 50%; animation-delay: 0.1s; }
        .or-v-bar:nth-child(2) { height: 100%; animation-delay: 0.3s; }
        .or-v-bar:nth-child(3) { height: 35%; animation-delay: 0.2s; }
        @keyframes or-eq-jump {
          0% { height: 25%; }
          100% { height: 100%; }
        }

        /* Card Text Info */
        .or-card-info { margin-top: 8px; min-width: 0; }
        .or-card-name {
          font-size: var(--font-size-sm, 13px);
          font-weight: var(--font-weight-semibold, 600);
          color: var(--text-primary, #ffffff);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .or-card-meta {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; color: var(--text-subdued, #8e8e8e);
          margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .or-card-flag { font-size: 13px; flex-shrink: 0; }
        .or-card-genre { overflow: hidden; text-overflow: ellipsis; }

        /* Country Grid */
        .or-country-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
        }
        .or-country-card {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px;
          background: var(--bg-surface, #282828);
          border: 1px solid var(--border-color, #383838);
          border-radius: var(--radius-md, 8px);
          cursor: pointer;
          transition: background var(--transition-fast, 150ms ease), border-color var(--transition-fast, 150ms ease);
        }
        .or-country-card:hover {
          background: var(--bg-highlight, #333333);
          border-color: rgba(255, 255, 255, 0.2);
        }
        .or-card-country-flag { font-size: 26px; flex-shrink: 0; }
        .or-card-country-info { min-width: 0; }
        .or-card-country-name {
          font-size: var(--font-size-sm, 13px); font-weight: 600;
          color: var(--text-primary, #ffffff);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .or-card-country-sub { font-size: 11px; color: var(--text-subdued, #8e8e8e); margin-top: 2px; }

        /* Quick Countries Horizontal Bar in Explore */
        .or-quick-countries {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 8px;
        }
        .or-country-tile {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 10px; border-radius: var(--radius-sm, 4px);
          background: var(--bg-surface, #282828);
          border: 1px solid var(--border-color, #383838);
          cursor: pointer; color: var(--text-primary, #ffffff);
          transition: background var(--transition-fast, 150ms ease);
        }
        .or-country-tile:hover { background: var(--bg-highlight, #333333); }
        .or-tile-flag { font-size: 16px; flex-shrink: 0; }
        .or-tile-name { font-size: 12px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
        .or-tile-count { font-size: 10px; color: var(--text-subdued, #8e8e8e); }

        /* Genres Grid */
        .or-genres-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 12px;
        }
        .or-genre-card {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 16px;
          background: var(--bg-surface, #282828);
          border: 1px solid var(--border-color, #383838);
          border-radius: var(--radius-md, 8px);
          cursor: pointer; text-align: left;
          transition: background var(--transition-fast, 150ms ease), border-color var(--transition-fast, 150ms ease);
        }
        .or-genre-card:hover {
          background: var(--bg-highlight, #333333);
          border-color: rgba(255, 255, 255, 0.2);
        }
        .or-genre-emoji { font-size: 24px; flex-shrink: 0; }
        .or-genre-info { min-width: 0; }
        .or-genre-name {
          font-size: var(--font-size-sm, 13px); font-weight: 600;
          color: var(--text-primary, #ffffff); display: block;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .or-genre-count { font-size: 11px; color: var(--text-subdued, #8e8e8e); display: block; margin-top: 2px; }

        /* Custom Stations Form */
        .or-custom-form-card {
          background: var(--bg-surface, #282828);
          border: 1px solid var(--border-color, #383838);
          border-radius: var(--radius-md, 8px);
          padding: 16px 18px; margin-bottom: 12px;
        }
        .or-form-title {
          font-size: var(--font-size-sm, 13px); font-weight: 700;
          color: var(--text-primary, #ffffff); margin-bottom: 12px;
          display: flex; align-items: center; gap: 8px;
        }
        .or-form-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
        }
        .or-field { display: flex; flex-direction: column; gap: 4px; }
        .or-label {
          font-size: 11px; font-weight: 600; text-transform: uppercase;
          color: var(--text-secondary, #c8c8c8); letter-spacing: 0.3px;
        }
        .or-input {
          padding: 9px 12px;
          background: var(--bg-base, #121212);
          border: 1px solid var(--border-color, #404040);
          border-radius: var(--radius-sm, 4px);
          color: var(--text-primary, #ffffff);
          font-size: 13px; outline: none;
        }
        .or-input:focus { border-color: var(--accent-primary, #1DB954); }

        .or-btn-primary {
          padding: 9px 18px;
          background: var(--accent-primary, #1DB954);
          color: #000000; font-weight: 700; font-size: 13px;
          border: none; border-radius: var(--radius-md, 8px);
          cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
          transition: filter var(--transition-fast, 150ms ease), transform var(--transition-fast, 150ms ease);
        }
        .or-btn-primary:hover { filter: brightness(1.1); }
        .or-btn-primary:active { transform: scale(0.97); }

        .or-status { font-size: 12px; padding: 6px 10px; border-radius: var(--radius-sm, 4px); display: none; }
        .or-status.ok { display: inline-block; background: rgba(29, 185, 84, 0.15); color: var(--accent-primary, #1DB954); }
        .or-status.err { display: inline-block; background: rgba(241, 94, 108, 0.15); color: var(--error-color, #f15e6c); }

        /* Empty State */
        .or-empty-state {
          text-align: center; padding: 60px 20px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .or-empty-icon { font-size: 44px; margin-bottom: 12px; opacity: 0.8; }
        .or-empty-title { font-size: var(--font-size-md, 16px); font-weight: 700; color: var(--text-primary, #ffffff); margin-bottom: 6px; }
        .or-empty-sub { font-size: var(--font-size-sm, 13px); color: var(--text-subdued, #8e8e8e); max-width: 380px; margin-bottom: 18px; line-height: 1.5; }

        /* Loading Spinner */
        .or-loading {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 80px 20px; color: var(--text-subdued, #8e8e8e); font-size: 13px;
        }
        .or-spinner {
          width: 32px; height: 32px;
          border: 3px solid var(--border-color, #404040);
          border-top-color: var(--accent-primary, #1DB954);
          border-radius: 50%;
          animation: or-spin 0.8s linear infinite;
          margin-bottom: 12px;
        }
        @keyframes or-spin { to { transform: rotate(360deg); } }

        /* ── Sticky Bottom Mini-Player Bar ───────────────────────────────── */
        #or-now-bar {
          position: sticky; bottom: 0; left: 0; right: 0;
          order: 10; flex-shrink: 0; z-index: 10;
          display: none; align-items: center; gap: 12px;
          padding: 10px 18px;
          background: var(--bg-surface, #282828);
          border-top: 1px solid var(--border-color, #404040);
          box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.4);
        }
        #or-now-bar.visible { display: flex; }

        .or-now-dot-wrap {
          display: flex; align-items: center; gap: 6px; flex-shrink: 0;
        }
        .or-now-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--accent-primary, #1DB954);
          box-shadow: 0 0 8px var(--accent-primary, #1DB954);
          animation: or-live-pulse 1.4s ease-in-out infinite;
        }
        .or-now-dot.paused {
          background: var(--text-subdued, #8e8e8e);
          box-shadow: none; animation: none;
        }
        @keyframes or-live-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.82); opacity: 0.55; }
        }
        .or-now-live-tag {
          font-size: 10px; font-weight: 700;
          background: var(--error-color, #f15e6c);
          color: #ffffff; padding: 2px 6px; border-radius: 4px;
        }

        .or-now-thumb {
          width: 40px; height: 40px; border-radius: var(--radius-sm, 4px);
          object-fit: cover; flex-shrink: 0;
          background: var(--bg-elevated, #181818);
        }
        .or-now-info { flex: 1; min-width: 0; overflow: hidden; }
        .or-now-name {
          font-size: var(--font-size-sm, 13px); font-weight: 600;
          color: var(--text-primary, #ffffff);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .or-now-meta {
          font-size: 11px; color: var(--text-subdued, #8e8e8e);
          margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .or-now-play-btn {
          width: 38px; height: 38px; border-radius: 50%;
          background: var(--accent-primary, #1DB954);
          color: #000000; border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0;
          transition: transform var(--transition-fast, 150ms ease);
        }
        .or-now-play-btn:hover { transform: scale(1.08); }

        /* Player bar launcher button */
        .or-playerbar-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 6px 14px; border-radius: var(--radius-full, 9999px);
          border: 1px solid var(--border-color, #404040);
          background: transparent; color: var(--text-primary, #ffffff);
          cursor: pointer; font-size: 13px; font-weight: 600;
          transition: border-color var(--transition-fast, 150ms ease), background var(--transition-fast, 150ms ease);
        }
        .or-playerbar-btn:hover {
          background: var(--bg-highlight, #3e3e3e);
          border-color: var(--accent-primary, #1DB954);
        }

        /* Toast notifications */
        .or-toast {
          position: fixed; bottom: 84px; left: 50%; transform: translateX(-50%);
          background: var(--bg-surface, #282828);
          color: var(--text-primary, #ffffff);
          border: 1px solid var(--border-color, #404040);
          padding: 10px 20px; border-radius: var(--radius-md, 8px);
          z-index: 10020; font-size: 13px; font-weight: 500;
          box-shadow: var(--shadow-lg, 0 8px 24px rgba(0,0,0,0.5));
          opacity: 0; transition: opacity 0.25s ease;
          pointer-events: none; white-space: nowrap;
        }
        .or-toast.err {
          border-color: var(--error-color, #f15e6c);
          color: var(--error-color, #f15e6c);
        }

        /* ── Mobile & Responsive Reflow Specification (Issue #80) ──────── */
        @media (max-width: 768px) {
          #or-panel {
            position: fixed; inset: 0;
            width: 100vw; height: 100dvh;
            max-width: 100vw; max-height: 100dvh;
            border-radius: 0; border: none;
            transform: none !important;
          }
          #or-panel.open { transform: none !important; }

          .or-header {
            padding-top: max(8px, env(safe-area-inset-top, 0px));
            padding-left: max(12px, env(safe-area-inset-left, 0px));
            padding-right: max(12px, env(safe-area-inset-right, 0px));
          }
          .or-tabs-nav {
            padding-left: max(12px, env(safe-area-inset-left, 0px));
            padding-right: max(12px, env(safe-area-inset-right, 0px));
          }
          .or-tab {
            min-height: 44px; min-width: 68px; padding: 10px 14px;
          }
          .or-icon-btn {
            min-width: 44px; min-height: 44px;
          }
          #or-search-wrap {
            height: 44px;
          }
          #or-search-input {
            font-size: 16px;
          }
          #or-now-bar {
            padding-bottom: max(10px, env(safe-area-inset-bottom, 0px));
          }
          .or-now-play-btn {
            min-width: 44px; min-height: 44px;
          }
          .or-form-grid {
            grid-template-columns: 1fr;
          }
          .or-card-grid {
            grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
            gap: 12px;
          }
          .or-card-fav-btn {
            opacity: 1; min-width: 44px; min-height: 44px;
          }
        }

        @media (max-width: 480px) {
          .or-card-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }
          .or-view-wrap { padding: 4px 12px 24px; }
          .or-chips-rail { padding: 8px 12px 4px; }
          .or-chip { min-height: 44px; padding: 10px 14px; font-size: 13px; }
          .or-now-live-tag { display: none; }
          .or-title { font-size: 15px; }
        }

        /* Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          .or-v-bar, .or-now-dot, .or-spinner { animation: none !important; }
          #or-panel, .or-card, .or-btn-primary { transition: none !important; }
        }
      `;
      document.head.appendChild(s);
    },

    buildPanel() {
      if (document.getElementById("or-panel")) return;

      const overlay = document.createElement("div");
      overlay.id = "or-overlay";
      overlay.onclick = () => this.close();
      document.body.appendChild(overlay);

      const panel = document.createElement("div");
      panel.id = "or-panel";
      panel.innerHTML = `
        <!-- Header -->
        <div class="or-header">
          <button class="or-icon-btn" id="or-back-btn" style="display:none" title="Back" aria-label="Back">
            ${I.back}
          </button>
          <div class="or-title" id="or-title">Explore Radio</div>
          <div id="or-search-wrap">
            ${I.search}
            <input type="text" id="or-search-input" placeholder="Search stations, genres..." aria-label="Search radio stations" />
          </div>
          <button class="or-icon-btn" id="or-close-btn" title="Close" aria-label="Close">
            ${I.close}
          </button>
        </div>

        <!-- Segmented Top Tabs -->
        <nav class="or-tabs-nav" role="tablist" aria-label="Radio categories">
          <button role="tab" class="or-tab active" data-tab="explore" id="tab-explore" aria-selected="true" tabindex="0">
            ${I.explore}<span>Explore</span>
          </button>
          <button role="tab" class="or-tab" data-tab="countries" id="tab-countries" aria-selected="false" tabindex="-1">
            ${I.globe}<span>Countries</span>
          </button>
          <button role="tab" class="or-tab" data-tab="genres" id="tab-genres" aria-selected="false" tabindex="-1">
            ${I.music}<span>Genres</span>
          </button>
          <button role="tab" class="or-tab" data-tab="favorites" id="tab-favorites" aria-selected="false" tabindex="-1">
            ${I.star}<span>Favorites</span>
          </button>
          <button role="tab" class="or-tab" data-tab="custom" id="tab-custom" aria-selected="false" tabindex="-1">
            ${I.plus}<span>Custom</span>
          </button>
        </nav>

        <!-- Main Body -->
        <div class="or-body" id="or-body"></div>

        <!-- Sticky Bottom Mini-Player Bar -->
        <div id="or-now-bar" role="region" aria-label="Now Playing Bar">
          <div class="or-now-dot-wrap">
            <div class="or-now-dot" id="or-now-dot"></div>
            <span class="or-now-live-tag">LIVE</span>
          </div>
          <img class="or-now-thumb" id="or-now-thumb" src="" alt="Station Artwork" />
          <div class="or-now-info">
            <div class="or-now-name" id="or-now-name">—</div>
            <div class="or-now-meta" id="or-now-meta">—</div>
          </div>
          <button class="or-now-play-btn" id="or-now-play-btn" aria-label="Pause or Play">
            ${I.play}
          </button>
        </div>
      `;
      document.body.appendChild(panel);

      panel.querySelector("#or-close-btn").onclick = () => this.close();
      panel.querySelector("#or-back-btn").onclick = () => this.goBack();

      // Top Tab Navigation clicks
      panel.querySelectorAll(".or-tab").forEach(tab => {
        tab.onclick = () => {
          this.switchTab(tab.dataset.tab);
        };
      });

      // Search debounce input
      const searchInput = panel.querySelector("#or-search-input");
      let timer;
      searchInput.addEventListener("input", (e) => {
        clearTimeout(timer);
        const q = e.target.value.trim();
        if (!q) {
          if (this.view === "search") {
            this.switchTab(this.activeTab);
          }
          return;
        }
        timer = setTimeout(() => {
          this.pushNav("search", q, `Search: "${q}"`);
          this.renderSearchResultsView(q);
        }, 320);
      });

      // Mini-player bar play/pause toggle
      const nowPlayBtn = panel.querySelector("#or-now-play-btn");
      nowPlayBtn.onclick = () => {
        if (!this.nowPlaying) return;
        if (this.api?.player?.togglePlay) {
          this.api.player.togglePlay();
        } else if (this.api?.player?.play && this.api?.player?.pause) {
          if (this.nowPlaying.isPlaying) this.api.player.pause();
          else this.api.player.play();
        }
      };
    },

    createPlayerBarButton() {
      if (document.getElementById("or-playerbar-btn")) return;
      const btn = document.createElement("button");
      btn.id = "or-playerbar-btn";
      btn.className = "or-playerbar-btn";
      btn.innerHTML = `${I.radio}<span>Radio</span>`;
      btn.onclick = () => this.open();
      this.api?.ui?.registerSlot?.("playerbar:menu", btn);
    },

    open() {
      this.isOpen = true;
      document.getElementById("or-overlay")?.classList.add("open");
      document.getElementById("or-panel")?.classList.add("open");
      this.renderCurrentView();
      this.updateNowPlayingBar();
    },

    close() {
      this.isOpen = false;
      document.getElementById("or-overlay")?.classList.remove("open");
      document.getElementById("or-panel")?.classList.remove("open");
    },

    // ── Utilities ────────────────────────────────────────────────────────
    esc(str) {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    },

    toast(msg, isErr = false) {
      const el = document.createElement("div");
      el.className = `or-toast ${isErr ? 'err' : ''}`;
      el.textContent = msg;
      document.body.appendChild(el);
      requestAnimationFrame(() => el.style.opacity = "1");
      setTimeout(() => {
        el.style.opacity = "0";
        setTimeout(() => el.remove(), 260);
      }, 2500);
    }
  };

  if (typeof Audion !== "undefined" && Audion.register) {
    Audion.register(OnlineRadio);
  } else {
    window.OnlineRadio = OnlineRadio;
    window.AudionPlugin = OnlineRadio;
  }
})();
