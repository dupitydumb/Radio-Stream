# Online Radio Plugin for Audion

**Stream hundreds of live radio stations from around the world.**

Browse by region and country, filter by genre, search across all stations, save favorites, and add your own custom streams — all from inside Audion.

---

## Features

- **160+ curated stations** across 40+ countries, hand-picked to have reliable public streams
- **Browse by region**: North America, Latin America, Europe, Middle East, Africa, Asia, Oceania
- **Browse by genre**: Jazz, Classical, Electronic, Hip-Hop, Rock, World, Ambient, News
- **Global search** across all station names, genres, and countries
- **Favorites** — star any station and it appears at the top of the home screen
- **Now Playing bar** — live indicator with animated dot showing what's streaming
- **Custom stations** — add any internet radio stream URL (mp3, aac, ogg, m3u, m3u8, pls)
- Fully mobile-responsive

---

## Installation

1. Open Audion → **Settings → Plugins**
2. Click **Open Plugin Folder**
3. Copy the `online-radio` folder into the plugins directory
4. Restart Audion or click **Reload Plugins**
5. Enable the plugin

---

## Usage

1. Click **Radio** in the player bar menu
2. Browse by region/country, or use the search bar
3. Click the **▶ play button** next to any station to start streaming
4. Click the **⭐ star** to add a station to your favorites
5. Click **+** to add your own custom radio stream URL

---

## Station Coverage

| Region | Countries | Stations |
|--------|-----------|---------|
| North America | USA, Canada, Mexico | 25+ |
| Latin America | Brazil, Argentina, Colombia | 10+ |
| Europe | UK, France, Germany, Netherlands, Spain, Italy, Sweden, Norway, Poland, Portugal, Austria, Switzerland, Russia, Ukraine, Turkey | 60+ |
| Middle East | UAE, Israel, Lebanon | 5+ |
| Africa | South Africa, Nigeria, Kenya, Ghana, Morocco | 10+ |
| Asia | Japan, South Korea, China, India, Indonesia, Philippines, Singapore, Malaysia, Thailand | 20+ |
| Oceania | Australia, New Zealand | 10+ |
| By Genre | Jazz, Classical, Electronic, Hip-Hop, Rock, World, Ambient, News | 30+ |

---

## Adding Custom Stations

Click the **+** button in the top-right corner of the radio panel. You need:
- A **station name**
- A **direct stream URL** — this must be a direct audio stream, not a website. Examples:
  - `https://stream.example.com/live.mp3`
  - `https://icecast.example.com/radio-128k`
  - `https://example.com/stream.m3u8`

You can find stream URLs by:
- Checking the station's website source for `audio` or `source` tags
- Looking for `.m3u`, `.pls`, or `.m3u8` playlist files
- Using sites like radio-browser.info or icecast-directory.org

---

## How Live Radio Streaming Works

Unlike regular tracks, radio streams are infinite/live — they have no duration and the URL is used directly. The plugin calls `api.player.setTrack()` with the stream URL as the track path and `source_type: "radio"`. No stream resolver is needed because the URL is the direct stream endpoint.

The now-playing indicator listens to `playbackState` and `trackChange` events from the Audion API to stay in sync with the player.
