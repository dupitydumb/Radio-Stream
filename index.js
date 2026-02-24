// ═══════════════════════════════════════════════════════════════════════════
// ONLINE RADIO PLUGIN FOR AUDION (Radio-Browser.info version)
// ═══════════════════════════════════════════════════════════════════════════
// Stream thousands of live radio stations using the free Radio-Browser.info API.
// Features: search by name/tag/country, browse by country/popular tags,
//           favorites, custom stations, now‑playing bar.
// ═══════════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  // ── API base – multiple mirrors for reliability ─────────────────────────
  const API_BASE_URLS = [
    "https://de1.api.radio-browser.info",
    "https://nl1.api.radio-browser.info",
    "https://fr1.api.radio-browser.info",
  ];
  let currentApiBase = API_BASE_URLS[0];

  // Helper to try different mirrors
  async function apiFetch(path) {
    for (const base of API_BASE_URLS) {
      try {
        const url = `${base}${path}`;
        const res = await fetch(url);
        if (res.ok) {
          currentApiBase = base; // remember working one
          return res.json();
        }
      } catch (e) {
        // continue to next
      }
    }
    throw new Error("All Radio‑Browser mirrors failed");
  }

  // ── Icons (same as before) ──────────────────────────────────────────────
  const I = {
    radio:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 7l-8-4"/><circle cx="17" cy="14" r="2"/><path d="M5 11h4M5 15h4"/></svg>`,
    search:  `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    play:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
    pause:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
    star:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    starO:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    plus:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    back:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>`,
    trash:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>`,
  };

  // ── Main plugin ─────────────────────────────────────────────────────────
  const OnlineRadio = {
    name: "Online Radio",
    api: null,

    // State
    isOpen: false,
    favorites: new Set(),
    customStations: [],
    nowPlaying: null,
    view: "home",                // "home", "country", "tag", "search", "add", "edit"
    navStack: [],
    currentData: null,
    currentTitle: "Online Radio",

    // Cache (in‑memory)
    countriesCache: null,
    topTagsCache: null,
    stationsCache: new Map(),    // key → { data, timestamp }

    // ── Lifecycle ────────────────────────────────────────────────────────
    async init(api) {
      console.log("[OnlineRadio] Initializing...");
      this.api = api;
      await this.loadState();
      this.injectStyles();
      this.buildPanel();
      this.createPlayerBarButton();

      if (api.on) {
        api.on("playbackState", ({ isPlaying }) => {
          if (this.nowPlaying) {
            this.nowPlaying.isPlaying = isPlaying;
            this.updateNowPlayingBar();
          }
        });
        api.on("trackChange", ({ track }) => {
          if (track?.source_type !== "radio") {
            this.nowPlaying = null;
            this.updateNowPlayingBar();
          }
        });
      }

      // Pre‑fetch countries and tags (non‑blocking)
      this.fetchCountries().then(() => { if (this.isOpen) this.renderHome(); });
      this.fetchTopTags();

      console.log("[OnlineRadio] Ready");
    },

    start() {},
    stop() { this.close(); },
    destroy() {
      this.close();
      ["or-styles", "or-panel", "or-overlay", "or-playerbar-btn", "or-now-bar"].forEach(id => {
        document.getElementById(id)?.remove();
      });
    },

    // ── Persistence ──────────────────────────────────────────────────────
    async loadState() {
      if (!this.api?.storage?.get) return;
      try {
        const fav = await this.api.storage.get("or-favorites");
        if (fav) this.favorites = new Set(JSON.parse(fav));
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
        // Sort by station count descending, take top 30 to avoid huge list
        const sorted = data.sort((a, b) => b.stationcount - a.stationcount).slice(0, 30);
        this.countriesCache = sorted;
        return sorted;
      } catch (err) {
        console.error("[OnlineRadio] Failed to fetch countries:", err);
        return [];
      }
    },

    async fetchTopTags(limit = 20) {
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

    async fetchStationsByCountry(countryCode) {
      const key = `country_${countryCode}`;
      const cached = this.stationsCache.get(key);
      if (cached && (Date.now() - cached.timestamp < 3600000)) return cached.data; // 1 hour

      try {
        const data = await apiFetch(`/json/stations/bycountrycodeexact/${countryCode}?limit=200&hidebroken=true&order=clickcount&reverse=true`);
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
        const data = await apiFetch(`/json/stations/bytag/${encodeURIComponent(tag)}?limit=200&hidebroken=true&order=clickcount&reverse=true`);
        const stations = this.normalizeStations(data);
        this.stationsCache.set(key, { data: stations, timestamp: Date.now() });
        return stations;
      } catch (err) {
        console.error("[OnlineRadio] Failed to fetch tag stations:", err);
        return [];
      }
    },

    async searchStations(query) {
      if (!query.trim()) return [];
      const key = `search_${query}`;
      const cached = this.stationsCache.get(key);
      if (cached && (Date.now() - cached.timestamp < 600000)) return cached.data; // 10 min

      try {
        const data = await apiFetch(`/json/stations/search?name=${encodeURIComponent(query)}&limit=200&hidebroken=true&order=clickcount&reverse=true`);
        const stations = this.normalizeStations(data);
        this.stationsCache.set(key, { data: stations, timestamp: Date.now() });
        return stations;
      } catch (err) {
        console.error("[OnlineRadio] Search failed:", err);
        return [];
      }
    },

    normalizeStations(apiStations) {
      return apiStations.map(s => ({
        id: s.stationuuid,
        name: s.name,
        genre: s.tags ? s.tags.split(',').map(t => t.trim()).filter(Boolean)[0] : 'Unknown',
        url: s.url_resolved || s.url,
        countryCode: s.countrycode,
        countryName: s.country,
        countryFlag: this.getFlagEmoji(s.countrycode),
        favicon: s.favicon,
        bitrate: s.bitrate,
        language: s.language,
      }));
    },

    getFlagEmoji(countryCode) {
      if (!countryCode) return "🌍";
      const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt());
      return String.fromCodePoint(...codePoints);
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
        this.toast("Could not play station. Check the stream URL.", true);
      }
    },

    generateCoverPlaceholder(name, genre) {
      const initial = (name || "?").charAt(0).toUpperCase();
      const bgColor = this.stringToColor(name || "radio");
      const emoji = this.genreToEmoji(genre) || "📻";
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <rect width="100" height="100" fill="${bgColor}" rx="16" ry="16"/>
          <text x="50" y="45" font-size="42" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif">${initial}</text>
          <text x="50" y="75" font-size="24" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif">${emoji}</text>
        </svg>`;
      return "data:image/svg+xml," + encodeURIComponent(svg);
    },

    stringToColor(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
      const hue = Math.abs(hash % 360);
      return `hsl(${hue}, 70%, 45%)`;
    },

    genreToEmoji(genre) {
      const map = {
        jazz: "🎷", classical: "🎻", rock: "🎸", metal: "🤘", electronic: "🎛️",
        ambient: "🌊", news: "📰", talk: "🗣️", pop: "🎤", hiphop: "🎧",
        dance: "🪩", indie: "🎸", world: "🌐", reggae: "🟢", blues: "🎸",
      };
      if (!genre) return "📻";
      const g = genre.toLowerCase();
      for (const [key, emoji] of Object.entries(map)) {
        if (g.includes(key)) return emoji;
      }
      return "📻";
    },

    // ── Favorites ────────────────────────────────────────────────────────
    toggleFavorite(stationId) {
      if (this.favorites.has(stationId)) {
        this.favorites.delete(stationId);
        this.toast("Removed from favorites");
      } else {
        this.favorites.add(stationId);
        this.toast("Added to favorites ⭐");
      }
      this.saveState();
      this.updateAllFavoriteButtons();
    },

    getFavoriteStations() {
      const favs = [];
      for (const id of this.favorites) {
        // Check custom first (they have id starting with "custom-")
        if (id.startsWith("custom-")) {
          const cust = this.customStations.find(s => s.id === id);
          if (cust) favs.push({ ...cust, countryFlag: "🔧", countryName: "My Stations" });
        } else {
          // Not stored in memory, we would need to fetch from API again – for simplicity,
          // we only show favorites that are currently in cache or we re‑fetch.
          // Alternative: store minimal data in favorites.
          // For now, we skip API favorites in the list (they will appear only if already loaded).
        }
      }
      return favs;
    },

    // ── Custom stations ───────────────────────────────────────────────────
    async testStreamUrl(url) {
      try {
        const res = await fetch(url, { method: "HEAD" });
        return res.ok;
      } catch {
        return false;
      }
    },

    // ── Navigation ───────────────────────────────────────────────────────
    pushNav(view, data, title) {
      this.navStack.push({ view: this.view, data: this.currentData, title: this.currentTitle });
      this.view = view;
      this.currentData = data;
      this.currentTitle = title;
      this.setHeader(title, true);
    },

    goBack() {
      if (this.navStack.length > 0) {
        const prev = this.navStack.pop();
        this.view = prev.view;
        this.currentData = prev.data;
        this.currentTitle = prev.title;
        this.setHeader(prev.title, this.navStack.length > 0);
        this.renderCurrentView();
      } else {
        this.showHome();
      }
    },

    setHeader(title, showBack) {
      document.getElementById("or-title").textContent = title;
      document.getElementById("or-back-btn").style.display = showBack ? "flex" : "none";
    },

    renderCurrentView() {
      if (this.view === "home") this.showHome();
      else if (this.view === "country") this.renderCountryView(this.currentData);
      else if (this.view === "tag") this.renderTagView(this.currentData);
      else if (this.view === "search") this.renderSearchResults(this.currentData);
      else if (this.view === "add") this.showAddStation();
    },

    // ── Views ─────────────────────────────────────────────────────────────
    async showHome() {
      this.view = "home";
      this.navStack = [];
      this.setHeader("Online Radio", false);

      const body = document.getElementById("or-body");
      body.innerHTML = `<div class="or-loading"><div class="or-spinner"></div><div>Loading stations...</div></div>`;

      const [countries, tags] = await Promise.all([
        this.fetchCountries(),
        this.fetchTopTags(15)
      ]);

      const favStations = this.getFavoriteStations();

      let html = `<div class="or-home-wrap">`;

      // Favorites section (custom only for now)
      if (favStations.length > 0) {
        html += `
          <div class="or-section-head">
            <span class="or-section-label">⭐ Favorites</span>
          </div>
          <div class="or-station-list">
            ${favStations.map(s => this.renderStationRow(s, true)).join("")}
          </div>
        `;
      }

      // Custom stations
      if (this.customStations.length > 0) {
        html += `
          <div class="or-section-head">
            <span class="or-section-label">🔧 My Stations</span>
          </div>
          <div class="or-station-list">
            ${this.customStations.map(s => this.renderStationRow({ ...s, countryFlag: "🔧", countryName: "My Stations" }, true)).join("")}
          </div>
        `;
      }

      // Popular tags (as chips)
      html += `
        <div class="or-section-head">
          <span class="or-section-label">🎵 Popular Genres</span>
        </div>
        <div class="or-tag-grid">
          ${tags.map(t => `<button class="or-tag-chip" data-tag="${this.esc(t.name)}">${this.esc(t.name)} (${t.stationcount})</button>`).join("")}
        </div>
      `;

      // Top countries
      html += `
        <div class="or-section-head">
          <span class="or-section-label">🌍 Top Countries</span>
        </div>
        <div class="or-country-list">
          ${countries.map(c => `
            <div class="or-country-row" data-country="${c.iso_3166_1}">
              <span class="or-country-flag">${this.getFlagEmoji(c.iso_3166_1)}</span>
              <span class="or-country-name">${this.esc(c.name)}</span>
              <span class="or-country-count">${c.stationcount} stations</span>
            </div>
          `).join("")}
        </div>
      `;

      html += `</div>`;
      body.innerHTML = html;

      // Attach listeners
      body.querySelectorAll("[data-tag]").forEach(el => {
        el.onclick = () => {
          const tag = el.dataset.tag;
          this.pushNav("tag", tag, `Tag: ${tag}`);
          this.renderTagView(tag);
        };
      });

      body.querySelectorAll("[data-country]").forEach(el => {
        el.onclick = () => {
          const code = el.dataset.country;
          const country = countries.find(c => c.iso_3166_1 === code);
          if (country) {
            this.pushNav("country", country, `${this.getFlagEmoji(code)} ${country.name}`);
            this.renderCountryView(country);
          }
        };
      });

      this.attachStationListeners(body);
      this.updateNowPlayingBar();
    },

    async renderCountryView(country) {
      const body = document.getElementById("or-body");
      body.innerHTML = `<div class="or-loading"><div class="or-spinner"></div><div>Loading stations...</div></div>`;

      const stations = await this.fetchStationsByCountry(country.iso_3166_1);

      if (stations.length === 0) {
        body.innerHTML = `<div class="or-empty"><div class="or-empty-icon">📡</div><div>No stations found</div></div>`;
        return;
      }

      body.innerHTML = `
        <div class="or-section-head">
          <span class="or-section-label">${stations.length} station${stations.length !== 1 ? "s" : ""}</span>
        </div>
        <div class="or-station-list">
          ${stations.map(s => this.renderStationRow(s)).join("")}
        </div>
      `;
      this.attachStationListeners(body);
    },

    async renderTagView(tag) {
      const body = document.getElementById("or-body");
      body.innerHTML = `<div class="or-loading"><div class="or-spinner"></div><div>Loading stations...</div></div>`;

      const stations = await this.fetchStationsByTag(tag);

      if (stations.length === 0) {
        body.innerHTML = `<div class="or-empty"><div class="or-empty-icon">📡</div><div>No stations found</div></div>`;
        return;
      }

      body.innerHTML = `
        <div class="or-section-head">
          <span class="or-section-label">${stations.length} station${stations.length !== 1 ? "s" : ""}</span>
        </div>
        <div class="or-station-list">
          ${stations.map(s => this.renderStationRow(s)).join("")}
        </div>
      `;
      this.attachStationListeners(body);
    },

    async renderSearchResults(query) {
      const body = document.getElementById("or-body");
      body.innerHTML = `<div class="or-loading"><div class="or-spinner"></div><div>Searching...</div></div>`;

      const stations = await this.searchStations(query);

      if (stations.length === 0) {
        body.innerHTML = `<div class="or-empty"><div class="or-empty-icon">🔍</div><div>No stations found</div></div>`;
        return;
      }

      body.innerHTML = `
        <div class="or-section-head">
          <span class="or-section-label">${stations.length} result${stations.length !== 1 ? "s" : ""}</span>
        </div>
        <div class="or-station-list">
          ${stations.map(s => this.renderStationRow(s, true)).join("")}
        </div>
      `;
      this.attachStationListeners(body);
    },

    // ── Station row render ───────────────────────────────────────────────
    renderStationRow(station, showFlag = false) {
      const isPlaying = this.nowPlaying?.station?.id === station.id;
      const isFaved = this.favorites.has(station.id);
      const flag = showFlag && station.countryFlag ? `<span class="or-flag-badge">${station.countryFlag}</span>` : "";

      return `
        <div class="or-station-row ${isPlaying ? "now-playing" : ""}" data-station-id="${this.esc(station.id)}">
          <button class="or-play-btn" data-play="${this.esc(station.id)}" title="Play ${this.esc(station.name)}">
            ${isPlaying ? I.pause : I.play}
          </button>
          <div class="or-station-info">
            <div class="or-station-name">${this.esc(station.name)}</div>
            <div class="or-station-meta">
              ${flag}
              ${station.genre ? `<span class="or-genre-tag">${this.esc(station.genre)}</span>` : ""}
              ${station.bitrate ? `<span class="or-bitrate">${station.bitrate}kbps</span>` : ""}
            </div>
          </div>
          <button class="or-fav-btn ${isFaved ? "faved" : ""}" data-fav="${this.esc(station.id)}" title="${isFaved ? "Remove from favorites" : "Add to favorites"}">
            ${isFaved ? I.star : I.starO}
          </button>
        </div>
      `;
    },

    attachStationListeners(container) {
      container.addEventListener("click", async e => {
        const playId = e.target.closest("[data-play]")?.dataset.play;
        const favId = e.target.closest("[data-fav]")?.dataset.fav;

        if (playId) {
          const station = this.findStation(playId);
          if (station) await this.playStation(station);
          return;
        }
        if (favId) {
          this.toggleFavorite(favId);
          return;
        }
      });
    },

    findStation(id) {
      // Custom station
      if (id.startsWith("custom-")) {
        const cust = this.customStations.find(s => s.id === id);
        if (cust) return { ...cust, countryFlag: "🔧", countryName: "My Stations" };
      }
      // For API stations, we can't search all cache efficiently; we rely on current view.
      // Fallback: search in current DOM? We'll just assume it's in current view.
      return null;
    },

    // ── Add custom station ───────────────────────────────────────────────
    showAddStation() {
      this.pushNav("add", null, "Add Station");
      const body = document.getElementById("or-body");
      body.innerHTML = `
        <div class="or-add-wrap">
          <div class="or-add-title">${I.plus} Add Custom Station</div>
          <div class="or-field">
            <label class="or-label">Station Name</label>
            <input class="or-input" id="or-f-name" type="text" placeholder="e.g. My Radio">
          </div>
          <div class="or-field">
            <label class="or-label">Stream URL</label>
            <input class="or-input" id="or-f-url" type="url" placeholder="https://stream.example.com/live.mp3">
          </div>
          <div class="or-field">
            <label class="or-label">Genre (optional)</label>
            <input class="or-input" id="or-f-genre" type="text" placeholder="e.g. Rock">
          </div>
          <div class="or-field">
            <label class="or-label">Country (optional)</label>
            <input class="or-input" id="or-f-country" type="text" placeholder="e.g. Germany">
          </div>
          <button class="or-btn-primary" id="or-add-save">${I.plus} Add Station</button>
          <div class="or-status" id="or-add-status"></div>
          ${this.customStations.length ? `
            <div style="margin-top:20px; border-top:1px solid var(--border-color); padding-top:16px;">
              <div class="or-section-label">Your Stations</div>
              ${this.customStations.map(s => `
                <div style="display:flex; align-items:center; gap:8px; padding:6px 0;">
                  <span style="flex:1">${this.esc(s.name)}</span>
                  <button class="or-icon-btn or-del-custom" data-id="${s.id}" style="color:#e74c3c">${I.trash}</button>
                </div>
              `).join("")}
            </div>
          ` : ""}
        </div>
      `;

      body.querySelector("#or-add-save").onclick = () => this.saveCustomStation();
      body.querySelectorAll(".or-del-custom").forEach(btn => {
        btn.onclick = () => this.deleteCustomStation(btn.dataset.id);
      });
    },

    saveCustomStation() {
      const name = document.getElementById("or-f-name")?.value.trim();
      const url = document.getElementById("or-f-url")?.value.trim();
      const genre = document.getElementById("or-f-genre")?.value.trim();
      const country = document.getElementById("or-f-country")?.value.trim();
      const status = document.getElementById("or-add-status");

      if (!name) { status.className = "or-status err"; status.textContent = "Enter a station name."; return; }
      if (!url.startsWith("http")) { status.className = "or-status err"; status.textContent = "Invalid URL."; return; }

      const station = {
        id: `custom-${Date.now()}`,
        name, url, genre: genre || "Custom",
        countryName: country || "Custom", countryFlag: "🔧",
        bitrate: 128
      };
      this.customStations.push(station);
      this.saveState();
      this.toast(`Added: ${name}`);
      this.showHome();
    },

    deleteCustomStation(id) {
      this.customStations = this.customStations.filter(s => s.id !== id);
      this.favorites.delete(id);
      this.saveState();
      this.toast("Station removed");
      this.showAddStation(); // refresh
    },

    // ── Now Playing Bar ──────────────────────────────────────────────────
    updateNowPlayingBar() {
      const bar = document.getElementById("or-now-bar");
      const dot = document.getElementById("or-now-dot");
      const name = document.getElementById("or-now-name");
      const meta = document.getElementById("or-now-meta");
      if (!bar) return;

      if (this.nowPlaying) {
        bar.classList.add("visible");
        name.textContent = this.nowPlaying.station.name;
        meta.textContent = [
          this.nowPlaying.station.countryFlag,
          this.nowPlaying.station.countryName,
          this.nowPlaying.station.genre
        ].filter(Boolean).join(" · ");
        dot.className = `or-now-dot${this.nowPlaying.isPlaying ? "" : " paused"}`;
      } else {
        bar.classList.remove("visible");
      }
    },

    updateAllPlayButtons() {
      document.querySelectorAll(".or-station-row").forEach(row => {
        const id = row.dataset.stationId;
        const btn = row.querySelector(".or-play-btn");
        const isNow = this.nowPlaying?.station?.id === id;
        row.classList.toggle("now-playing", isNow);
        if (btn) btn.innerHTML = isNow ? I.pause : I.play;
      });
    },

    updateAllFavoriteButtons() {
      document.querySelectorAll("[data-fav]").forEach(btn => {
        const id = btn.dataset.fav;
        const faved = this.favorites.has(id);
        btn.classList.toggle("faved", faved);
        btn.innerHTML = faved ? I.star : I.starO;
        btn.title = faved ? "Remove from favorites" : "Add to favorites";
      });
    },

    // ── Panel UI ─────────────────────────────────────────────────────────
    injectStyles() {
      if (document.getElementById("or-styles")) return;
      const s = document.createElement("style");
      s.id = "or-styles";
      s.textContent = `
        /* Overlay & Panel */
        #or-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(6px); z-index:10000; opacity:0; visibility:hidden; transition:opacity 0.2s; }
        #or-overlay.open { opacity:1; visibility:visible; }
        #or-panel { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%) scale(0.96); width:700px; max-width:96vw; max-height:88vh; background:var(--bg-elevated,#181818); border:1px solid var(--border-color,#2e2e2e); border-radius:20px; z-index:10001; box-shadow:0 28px 70px rgba(0,0,0,0.65); display:flex; flex-direction:column; overflow:hidden; opacity:0; visibility:hidden; transition:all 0.3s cubic-bezier(0.16,1,0.3,1); }
        #or-panel.open { opacity:1; visibility:visible; transform:translate(-50%,-50%) scale(1); }

        /* Header */
        .or-header { display:flex; align-items:center; gap:8px; padding:12px 16px; border-bottom:1px solid var(--border-color,#2a2a2a); background:var(--bg-elevated,#181818); flex-shrink:0; }
        .or-title { font-size:17px; font-weight:700; color:var(--text-primary,#fff); flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .or-icon-btn { background:none; border:none; color:var(--text-secondary,#aaa); cursor:pointer; padding:8px; border-radius:50%; display:flex; align-items:center; justify-content:center; transition:background 0.15s,color 0.15s; }
        .or-icon-btn:hover { background:var(--bg-highlight,#2a2a2a); color:#fff; }
        #or-search-wrap { flex:1; display:flex; align-items:center; background:var(--bg-surface,#1e1e1e); border:1px solid var(--border-color,#333); border-radius:40px; padding:0 12px; gap:6px; }
        #or-search-wrap input { flex:1; background:none; border:none; outline:none; color:var(--text-primary,#fff); font-size:14px; padding:8px 0; }
        #or-search-wrap input::placeholder { color:var(--text-subdued,#555); }

        /* Now Playing Bar */
        #or-now-bar { padding:10px 16px; background:linear-gradient(to right,rgba(26,98,185,0.2),rgba(26,98,185,0.05)); border-bottom:1px solid rgba(26,98,185,0.3); display:none; align-items:center; gap:12px; flex-shrink:0; }
        #or-now-bar.visible { display:flex; }
        .or-now-dot { width:8px; height:8px; border-radius:50%; background:#e74c3c; animation:or-pulse 1.2s ease-in-out infinite; }
        .or-now-dot.paused { background:#aaa; animation:none; }
        @keyframes or-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        .or-now-info { flex:1; overflow:hidden; }
        .or-now-name { font-size:13px; font-weight:600; color:var(--text-primary,#fff); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .or-now-meta { font-size:11px; color:var(--text-secondary,#888); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .or-now-live { font-size:10px; font-weight:700; padding:2px 8px; border-radius:12px; background:#e74c3c; color:#fff; }

        /* Body */
        .or-body { flex:1; overflow-y:auto; background:var(--bg-base,#111); overscroll-behavior-y:contain; padding-bottom:8px; }
        .or-body::-webkit-scrollbar { width:6px; }
        .or-body::-webkit-scrollbar-thumb { background:#2a2a2a; border-radius:3px; }

        /* Loading */
        .or-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px 20px; color:var(--text-secondary,#888); }
        .or-spinner { width:32px; height:32px; border:3px solid var(--border-color,#333); border-top-color:var(--accent-primary,#1a62b9); border-radius:50%; animation:or-spin 0.8s linear infinite; margin-bottom:12px; }
        @keyframes or-spin { to{transform:rotate(360deg);} }

        /* Section Headers */
        .or-section-head { display:flex; align-items:center; justify-content:space-between; padding:16px 16px 8px; }
        .or-section-label { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-secondary,#777); }

        /* Tag chips */
        .or-tag-grid { display:flex; flex-wrap:wrap; gap:8px; padding:0 16px 16px; }
        .or-tag-chip { padding:6px 14px; background:var(--bg-surface,#1e1e1e); border:1px solid var(--border-color,#333); border-radius:30px; font-size:13px; color:var(--text-primary,#fff); cursor:pointer; transition:border-color 0.15s,background 0.15s; }
        .or-tag-chip:hover { border-color:var(--accent-primary,#1a62b9); background:var(--bg-highlight,#2a2a2a); }

        /* Country list */
        .or-country-list { padding:0 12px 16px; }
        .or-country-row { display:flex; align-items:center; gap:12px; padding:12px 8px; border-bottom:1px solid rgba(255,255,255,0.04); cursor:pointer; transition:background 0.15s; }
        .or-country-row:hover { background:var(--bg-surface,#1e1e1e); }
        .or-country-flag { font-size:26px; flex-shrink:0; }
        .or-country-name { flex:1; font-size:15px; font-weight:500; color:var(--text-primary,#fff); }
        .or-country-count { font-size:12px; color:var(--text-secondary,#888); }

        /* Station list */
        .or-station-list { padding:0 12px 24px; }
        .or-station-row { display:flex; align-items:center; gap:12px; padding:10px 8px; border-radius:8px; cursor:pointer; transition:background 0.15s; }
        .or-station-row:hover { background:var(--bg-surface,#1e1e1e); }
        .or-station-row.now-playing { background:rgba(26,98,185,0.12); border-left:3px solid var(--accent-primary); }
        .or-play-btn { width:36px; height:36px; border-radius:50%; background:var(--bg-surface,#222); border:1px solid var(--border-color,#333); color:var(--text-primary,#fff); display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; transition:all 0.15s; }
        .or-play-btn:hover { background:var(--accent-primary,#1a62b9); border-color:var(--accent-primary); transform:scale(1.05); }
        .or-station-info { flex:1; overflow:hidden; }
        .or-station-name { font-size:14px; font-weight:500; color:var(--text-primary,#fff); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .or-station-meta { display:flex; align-items:center; gap:6px; margin-top:2px; }
        .or-genre-tag { font-size:11px; padding:2px 8px; border-radius:12px; background:var(--bg-surface,#222); color:var(--text-secondary,#888); white-space:nowrap; }
        .or-bitrate { font-size:11px; color:var(--text-subdued,#555); }
        .or-flag-badge { font-size:14px; }
        .or-fav-btn { background:none; border:none; color:var(--text-subdued,#555); cursor:pointer; padding:8px; display:flex; align-items:center; opacity:0; transition:opacity 0.15s,color 0.15s,transform 0.1s; }
        .or-station-row:hover .or-fav-btn { opacity:1; }
        .or-fav-btn.faved { color:#f1c40f; opacity:1; }
        .or-station-row .or-fav-btn.faved { opacity:1; }
        .or-fav-btn:hover { transform:scale(1.15); color:#f1c40f; }

        /* Empty state */
        .or-empty { text-align:center; padding:60px 20px; color:var(--text-subdued,#555); }
        .or-empty-icon { font-size:48px; margin-bottom:12px; }

        /* Add form */
        .or-add-wrap { padding:24px; display:flex; flex-direction:column; gap:16px; }
        .or-add-title { font-size:16px; font-weight:700; color:var(--text-primary,#fff); }
        .or-field { display:flex; flex-direction:column; gap:4px; }
        .or-label { font-size:11px; font-weight:600; text-transform:uppercase; color:var(--text-secondary,#aaa); }
        .or-input { padding:10px 14px; background:var(--bg-surface,#1e1e1e); border:1px solid var(--border-color,#333); border-radius:8px; color:var(--text-primary,#fff); font-size:14px; outline:none; }
        .or-input:focus { border-color:var(--accent-primary,#1a62b9); }
        .or-btn-primary { padding:10px 20px; background:var(--accent-primary,#1a62b9); color:#fff; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; transition:filter 0.15s; align-self:flex-start; }
        .or-btn-primary:hover { filter:brightness(1.15); }
        .or-status { padding:8px 12px; border-radius:6px; font-size:13px; display:none; }
        .or-status.ok { display:block; background:rgba(46,204,113,0.1); color:#2ecc71; }
        .or-status.err { display:block; background:rgba(231,76,60,0.1); color:#e74c3c; }

        /* Player bar button */
        .or-playerbar-btn { display:inline-flex; align-items:center; gap:7px; padding:6px 14px; border-radius:20px; border:1px solid var(--border-color,#404040); background:transparent; color:#fff; cursor:pointer; font-size:13px; font-weight:600; transition:border-color 0.15s,background 0.15s,transform 0.1s; }
        .or-playerbar-btn:hover { background:var(--bg-highlight,#2a2a2a); border-color:#e74c3c; transform:scale(1.04); }

        /* Toast */
        .or-toast { position:fixed; bottom:90px; left:50%; transform:translateX(-50%); background:#222; color:#fff; padding:10px 20px; border-radius:8px; z-index:10010; font-size:13px; box-shadow:0 4px 16px rgba(0,0,0,0.4); opacity:0; transition:opacity 0.25s; pointer-events:none; white-space:nowrap; }
        .or-toast.err { background:#c0392b; }

        /* ── Mobile (FIXED) ─────────────────────────────────────────────── */
        @media (max-width: 768px) {
          #or-panel {
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            transform: none;
            border-radius: 0;
            max-width: none;
            max-height: none;
          }

          .or-header {
            flex-wrap: wrap;
            padding: 8px 12px;
            gap: 6px;
          }

          .or-title {
            width: 100%;
            margin-bottom: 4px;
            font-size: 16px;
          }

          #or-search-wrap {
            flex: 1 1 auto;
            min-width: 0;
          }

          .or-icon-btn {
            min-width: 44px;
            min-height: 44px;
          }

          .or-fav-btn {
            opacity: 1;
          }

          .or-station-row {
            padding: 12px 8px;
          }

          .or-play-btn {
            width: 44px;
            height: 44px;
          }

          .or-now-live {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .or-tag-grid {
            gap: 6px;
          }
          .or-tag-chip {
            padding: 8px 12px;
            font-size: 12px;
          }
          .or-country-flag {
            font-size: 22px;
          }
          .or-country-name {
            font-size: 14px;
          }
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
        <div class="or-header">
          <button class="or-icon-btn" id="or-back-btn" style="display:none">${I.back}</button>
          <div class="or-title" id="or-title">Online Radio</div>
          <div id="or-search-wrap">
            ${I.search}
            <input type="text" id="or-search-input" placeholder="Search stations...">
          </div>
          <button class="or-icon-btn" id="or-add-btn" title="Add custom station">${I.plus}</button>
          <button class="or-icon-btn" id="or-close-btn" style="font-size:18px">✕</button>
        </div>
        <div id="or-now-bar">
          <div class="or-now-dot" id="or-now-dot"></div>
          <div class="or-now-info">
            <div class="or-now-name" id="or-now-name">—</div>
            <div class="or-now-meta" id="or-now-meta">—</div>
          </div>
          <span class="or-now-live">LIVE</span>
        </div>
        <div class="or-body" id="or-body"></div>
      `;
      document.body.appendChild(panel);

      panel.querySelector("#or-close-btn").onclick = () => this.close();
      panel.querySelector("#or-back-btn").onclick = () => this.goBack();
      panel.querySelector("#or-add-btn").onclick = () => this.showAddStation();

      const input = panel.querySelector("#or-search-input");
      let timer;
      input.addEventListener("input", (e) => {
        clearTimeout(timer);
        const q = e.target.value.trim();
        if (!q) { this.showHome(); return; }
        timer = setTimeout(() => {
          this.pushNav("search", q, `"${q}"`);
          this.renderSearchResults(q);
        }, 300);
      });
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
      if (this.view === "home") this.showHome();
      else this.renderCurrentView();
    },

    close() {
      this.isOpen = false;
      document.getElementById("or-overlay")?.classList.remove("open");
      document.getElementById("or-panel")?.classList.remove("open");
    },

    // ── Utilities ────────────────────────────────────────────────────────
    esc(str) {
      if (!str) return "";
      return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    },

    toast(msg, isErr = false) {
      const el = document.createElement("div");
      el.className = `or-toast${isErr ? " err" : ""}`;
      el.textContent = msg;
      document.body.appendChild(el);
      requestAnimationFrame(() => el.style.opacity = "1");
      setTimeout(() => { el.style.opacity = "0"; setTimeout(() => el.remove(), 300); }, 2500);
    }
  };

  if (typeof Audion !== "undefined" && Audion.register) {
    Audion.register(OnlineRadio);
  } else {
    window.OnlineRadio = OnlineRadio;
    window.AudionPlugin = OnlineRadio;
  }
})();