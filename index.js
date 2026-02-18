// ═══════════════════════════════════════════════════════════════════════════
// ONLINE RADIO PLUGIN FOR AUDION
// ═══════════════════════════════════════════════════════════════════════════
// Stream hundreds of live radio stations grouped by region & country.
// Features: region/country browsing, genre filter, search, favorites,
//           custom station support, now-playing display.
// ═══════════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  // ══════════════════════════════════════════════════════════════════════════
  // STATION DATABASE
  // Organised as: REGIONS > countries > stations
  // Each station: { id, name, country, genre, url, backup?, logo?, bitrate? }
  // ══════════════════════════════════════════════════════════════════════════
  const REGIONS = [
    {
      id: "favorites",
      label: "⭐ Favorites",
      emoji: "⭐",
      countries: [] // populated dynamically from saved favorites
    },
    {
      id: "custom",
      label: "🔧 My Stations",
      emoji: "🔧",
      countries: [] // user-added custom stations
    },
    {
      id: "north-america",
      label: "North America",
      emoji: "🌎",
      countries: [
        {
          id: "us",
          name: "United States",
          flag: "🇺🇸",
          stations: [
            { id: "kexp",       name: "KEXP 90.3",           genre: "Indie/Alt",    bitrate: 128, url: "https://kexp-mp3-128.streamguys1.com/kexp128.mp3" },
            { id: "wnyc-am",    name: "WNYC 820 AM",         genre: "Public Radio", bitrate: 128, url: "https://fm939.wnyc.org/wnycfm.aac" },
            { id: "wnyc-fm",    name: "WNYC 93.9 FM",        genre: "Classical",    bitrate: 128, url: "https://fm939.wnyc.org/wnycfm.aac" },
            { id: "npr",        name: "NPR News",             genre: "News/Talk",    bitrate: 128, url: "https://npr-ice.streamguys1.com/live.mp3" },
            { id: "kcrw",       name: "KCRW 89.9",           genre: "Indie/World",  bitrate: 128, url: "https://kcrw.streamguys1.com/kcrw_192k_mp3_e24_internet_radio" },
            { id: "wxpn",       name: "WXPN 88.5",           genre: "Adult Alt",    bitrate: 128, url: "https://wxpn.xpn.org/xpnmp3lo" },
            { id: "wbur",       name: "WBUR 90.9 Boston",    genre: "Public Radio", bitrate: 128, url: "https://streams.wbur.org/wbur/main" },
            { id: "kqed",       name: "KQED 88.5 SF",        genre: "Public Radio", bitrate: 128, url: "https://streams.kqed.org/kqedradio" },
            { id: "wfmu",       name: "WFMU",                genre: "Freeform",     bitrate: 128, url: "https://stream0.wfmu.org/freeform-128k" },
            { id: "kusf",       name: "KUSF",                genre: "College Radio", bitrate: 128, url: "https://ice1.somafm.com/groovesalad-128-mp3" },
            { id: "soma-groove",name: "SomaFM Groove Salad", genre: "Ambient",      bitrate: 128, url: "https://ice1.somafm.com/groovesalad-128-mp3" },
            { id: "soma-jazz",  name: "SomaFM Jazz",         genre: "Jazz",         bitrate: 128, url: "https://ice1.somafm.com/somasf-128-mp3" },
            { id: "soma-indie", name: "SomaFM Indie Pop",    genre: "Indie",        bitrate: 128, url: "https://ice1.somafm.com/indiepop-128-mp3" },
            { id: "soma-lo",    name: "SomaFM Lush",         genre: "Chillout",     bitrate: 128, url: "https://ice1.somafm.com/lush-128-mp3" },
            { id: "kfjc",       name: "KFJC 89.7",           genre: "Freeform",     bitrate: 128, url: "https://netcast.kfjc.org/kfjc-128k" },
            { id: "wkcr",       name: "WKCR 89.9 Columbia",  genre: "Jazz/Classical",bitrate: 96, url: "https://www.wkcr.org/wkcr.m3u" },
            { id: "kalx",       name: "KALX 90.7 Berkeley",  genre: "Freeform",     bitrate: 128, url: "https://stream.kalx.berkeley.edu:8000/kalx-128.mp3" },
          ]
        },
        {
          id: "ca",
          name: "Canada",
          flag: "🇨🇦",
          stations: [
            { id: "cbc-r1",     name: "CBC Radio One",        genre: "Public Radio", bitrate: 128, url: "https://cbcr1-tor.akacast.akamaistream.net/7/632/451661/v1/rc.akacast.akamaistream.net/cbcr1_tor" },
            { id: "cbc-r2",     name: "CBC Radio 2",          genre: "Music",        bitrate: 128, url: "https://cbcr2-tor.akacast.akamaistream.net/7/364/451661/v1/rc.akacast.akamaistream.net/cbcr2_tor" },
            { id: "cbc-r3",     name: "CBC Radio 3",          genre: "Indie",        bitrate: 128, url: "https://cbcr3-tor.akacast.akamaistream.net/7/571/451661/v1/rc.akacast.akamaistream.net/cbcr3_tor" },
            { id: "ckua",       name: "CKUA Radio",           genre: "Eclectic",     bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/CKUAFM.mp3" },
            { id: "chsr",       name: "CHSR 97.9 UNB",        genre: "College Radio", bitrate: 96, url: "https://chsr.ca/stream" },
          ]
        },
        {
          id: "mx",
          name: "Mexico",
          flag: "🇲🇽",
          stations: [
            { id: "reactor",    name: "Reactor 105.7",        genre: "Rock/Alt",     bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/XHREAFM.mp3" },
            { id: "unam-radio", name: "Radio UNAM",           genre: "Cultural",     bitrate: 128, url: "https://radiounam.unam.mx:8000/radio_unam" },
            { id: "ibero",      name: "Ibero 90.9",           genre: "University",   bitrate: 128, url: "https://streaming.ibero.mx/ibero" },
          ]
        }
      ]
    },
    {
      id: "latin-america",
      label: "Latin America",
      emoji: "🌎",
      countries: [
        {
          id: "br",
          name: "Brazil",
          flag: "🇧🇷",
          stations: [
            { id: "cbn-br",     name: "CBN Radio",            genre: "News/Talk",    bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/CBNFM.mp3" },
            { id: "jovem-pan",  name: "Jovem Pan News",       genre: "News",         bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/JOVEMPANNEWSAM.mp3" },
            { id: "cultura-br", name: "Rádio Cultura",        genre: "Cultural",     bitrate: 128, url: "https://ice.ferncast.com/culturasp-128" },
            { id: "uol-fm",     name: "UOL Hit FM",           genre: "Pop",          bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/HIT_FMAAC.aac" },
          ]
        },
        {
          id: "ar",
          name: "Argentina",
          flag: "🇦🇷",
          stations: [
            { id: "radio-mitre",name: "Radio Mitre",          genre: "News/Talk",    bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/MITRE.mp3" },
            { id: "nacional-ar",name: "Radio Nacional",       genre: "Public Radio", bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/LRARADIONICA.mp3" },
            { id: "rock-ar",    name: "Radio con Vos",        genre: "Talk",         bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/CONEXION.mp3" },
          ]
        },
        {
          id: "co",
          name: "Colombia",
          flag: "🇨🇴",
          stations: [
            { id: "rcn-co",     name: "RCN Radio",            genre: "News",         bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/RCN.mp3" },
            { id: "blu-co",     name: "Blu Radio",            genre: "News/Talk",    bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/BLUFM.mp3" },
          ]
        }
      ]
    },
    {
      id: "europe",
      label: "Europe",
      emoji: "🌍",
      countries: [
        {
          id: "gb",
          name: "United Kingdom",
          flag: "🇬🇧",
          stations: [
            { id: "bbc-r1",     name: "BBC Radio 1",          genre: "Pop/Dance",    bitrate: 128, url: "https://stream.live.vc.bbcmedia.co.uk/bbc_radio_one" },
            { id: "bbc-r2",     name: "BBC Radio 2",          genre: "Easy/Pop",     bitrate: 128, url: "https://stream.live.vc.bbcmedia.co.uk/bbc_radio_two" },
            { id: "bbc-r3",     name: "BBC Radio 3",          genre: "Classical",    bitrate: 128, url: "https://stream.live.vc.bbcmedia.co.uk/bbc_radio_three" },
            { id: "bbc-r4",     name: "BBC Radio 4",          genre: "Talk/Drama",   bitrate: 128, url: "https://stream.live.vc.bbcmedia.co.uk/bbc_radio_fourfm" },
            { id: "bbc-r6",     name: "BBC Radio 6 Music",    genre: "Indie/Alt",    bitrate: 128, url: "https://stream.live.vc.bbcmedia.co.uk/bbc_6music" },
            { id: "bbc-world",  name: "BBC World Service",    genre: "News",         bitrate: 128, url: "https://stream.live.vc.bbcmedia.co.uk/bbc_world_service" },
            { id: "absolute",   name: "Absolute Radio",       genre: "Rock",         bitrate: 128, url: "https://icecast.thisisdax.com/AbsoluteRadioMP3" },
            { id: "nts1",       name: "NTS Radio 1",          genre: "Eclectic",     bitrate: 128, url: "https://stream-relay-geo.ntslive.net/stream" },
            { id: "nts2",       name: "NTS Radio 2",          genre: "Eclectic",     bitrate: 128, url: "https://stream-relay-geo.ntslive.net/stream2" },
            { id: "rinse",      name: "Rinse FM",             genre: "Grime/Dance",  bitrate: 128, url: "https://eu10.fastcast4u.com/proxy/rinsefm?mp=/1" },
            { id: "jazz-fm",    name: "Jazz FM",              genre: "Jazz",         bitrate: 128, url: "https://icecast.thisisdax.com/JazzFMMP3" },
          ]
        },
        {
          id: "fr",
          name: "France",
          flag: "🇫🇷",
          stations: [
            { id: "france-inter",name: "France Inter",        genre: "Public Radio", bitrate: 128, url: "https://icecast.radiofrance.fr/franceinter-midfi.mp3" },
            { id: "france-info", name: "France Info",         genre: "News",         bitrate: 128, url: "https://icecast.radiofrance.fr/franceinfo-midfi.mp3" },
            { id: "france-musique",name:"France Musique",     genre: "Classical",    bitrate: 128, url: "https://icecast.radiofrance.fr/francemusique-midfi.mp3" },
            { id: "fip",         name: "FIP",                 genre: "Eclectic",     bitrate: 128, url: "https://icecast.radiofrance.fr/fip-midfi.mp3" },
            { id: "fip-jazz",    name: "FIP Jazz",            genre: "Jazz",         bitrate: 128, url: "https://icecast.radiofrance.fr/fipjazz-midfi.mp3" },
            { id: "fip-world",   name: "FIP Monde",           genre: "World",        bitrate: 128, url: "https://icecast.radiofrance.fr/fipworld-midfi.mp3" },
            { id: "mouv",        name: "Mouv'",               genre: "Hip-Hop/R&B",  bitrate: 128, url: "https://icecast.radiofrance.fr/mouv-midfi.mp3" },
          ]
        },
        {
          id: "de",
          name: "Germany",
          flag: "🇩🇪",
          stations: [
            { id: "dw-de",      name: "DW Radio",             genre: "News",         bitrate: 128, url: "https://stream.dw.com/dw/de/live/audioStream" },
            { id: "dlf",        name: "Deutschlandfunk",      genre: "Public Radio", bitrate: 128, url: "https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3" },
            { id: "dlf-nova",   name: "DLF Nova",             genre: "Youth/Pop",    bitrate: 128, url: "https://st03.sslstream.dlf.de/dlf/03/128/mp3/stream.mp3" },
            { id: "swr3",       name: "SWR3",                 genre: "Pop",          bitrate: 128, url: "https://liveradio.swr.de/sw282p3/swr3/play.mp3" },
            { id: "bayern3",    name: "Bayern 3",             genre: "Pop",          bitrate: 128, url: "https://br-br3-live.cast.addradio.de/br/br3/live/mp3/128/stream.mp3" },
            { id: "ndr-info",   name: "NDR Info",             genre: "News",         bitrate: 128, url: "https://icecast.ndr.de/ndr/ndrinfo/hamburg/mp3/128/stream.mp3" },
            { id: "fritz",      name: "Fritz (rbb)",          genre: "Alt/Indie",    bitrate: 128, url: "https://icecast.rbb-online.de/fritz.mp3" },
            { id: "byte-fm",    name: "ByteFM",               genre: "Indie/Eclectic",bitrate:128, url: "https://www.byte.fm/stream/bytefm.m3u" },
          ]
        },
        {
          id: "nl",
          name: "Netherlands",
          flag: "🇳🇱",
          stations: [
            { id: "3fm-nl",     name: "NPO 3FM",              genre: "Pop/Alt",      bitrate: 192, url: "https://icecast.omroep.nl/3fm-bb-mp3" },
            { id: "radio1-nl",  name: "NPO Radio 1",          genre: "News/Talk",    bitrate: 128, url: "https://icecast.omroep.nl/radio1-bb-mp3" },
            { id: "concertzender",name:"Concertzender",       genre: "Classical",    bitrate: 128, url: "https://concertzender.nl/streams/mp3.m3u" },
          ]
        },
        {
          id: "se",
          name: "Sweden",
          flag: "🇸🇪",
          stations: [
            { id: "sr-p1",      name: "Sveriges Radio P1",    genre: "Talk/News",    bitrate: 192, url: "https://sverigesradio.se/topsy/direkt/132-hi.mp3" },
            { id: "sr-p2",      name: "Sveriges Radio P2",    genre: "Classical",    bitrate: 192, url: "https://sverigesradio.se/topsy/direkt/163-hi.mp3" },
            { id: "sr-p3",      name: "Sveriges Radio P3",    genre: "Pop",          bitrate: 192, url: "https://sverigesradio.se/topsy/direkt/164-hi.mp3" },
          ]
        },
        {
          id: "no",
          name: "Norway",
          flag: "🇳🇴",
          stations: [
            { id: "nrk-p1",     name: "NRK P1",              genre: "Public Radio", bitrate: 128, url: "https://lyd.nrk.no/nrk_radio_p1_ostlandssendingen_mp3_h" },
            { id: "nrk-p2",     name: "NRK P2",              genre: "Cultural",     bitrate: 128, url: "https://lyd.nrk.no/nrk_radio_p2_mp3_h" },
            { id: "nrk-p3",     name: "NRK P3",              genre: "Youth",        bitrate: 128, url: "https://lyd.nrk.no/nrk_radio_p3_mp3_h" },
          ]
        },
        {
          id: "es",
          name: "Spain",
          flag: "🇪🇸",
          stations: [
            { id: "rne1",       name: "RNE Radio Nacional",   genre: "Public Radio", bitrate: 128, url: "https://dispatcher.rndfnk.com/rne/rne1/main/mp3/high" },
            { id: "rne3",       name: "Radio 3",              genre: "Alt/Indie",    bitrate: 128, url: "https://dispatcher.rndfnk.com/rne/rne3/main/mp3/high" },
            { id: "radio-marca",name: "Radio Marca",          genre: "Sports",       bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/RADIOMARCAFM.mp3" },
          ]
        },
        {
          id: "it",
          name: "Italy",
          flag: "🇮🇹",
          stations: [
            { id: "rai1",       name: "RAI Radio 1",          genre: "Public Radio", bitrate: 128, url: "https://icestreaming.rai.it/1.mp3" },
            { id: "rai2",       name: "RAI Radio 2",          genre: "Pop",          bitrate: 128, url: "https://icestreaming.rai.it/2.mp3" },
            { id: "rai3",       name: "RAI Radio 3",          genre: "Cultural",     bitrate: 128, url: "https://icestreaming.rai.it/3.mp3" },
            { id: "radio-subasio",name:"Radio Subasio",       genre: "Italian Pop",  bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/RADIOSUBASIOFM.mp3" },
          ]
        },
        {
          id: "pl",
          name: "Poland",
          flag: "🇵🇱",
          stations: [
            { id: "polskie-r1", name: "Polskie Radio 1",      genre: "Public Radio", bitrate: 128, url: "https://stream.polskieradio.pl/pr1/mp3/128" },
            { id: "polskie-r3", name: "Polskie Radio 3",      genre: "Alt/Cultural", bitrate: 128, url: "https://stream.polskieradio.pl/pr3/mp3/128" },
            { id: "polskie-r4", name: "Polskie Radio 4",      genre: "Jazz/Classical",bitrate: 128, url: "https://stream.polskieradio.pl/pr4/mp3/128" },
          ]
        },
        {
          id: "pt",
          name: "Portugal",
          flag: "🇵🇹",
          stations: [
            { id: "antena1-pt", name: "Antena 1",             genre: "Public Radio", bitrate: 128, url: "https://streaming.rtp.pt/rtp-radio/a1fm.mp3" },
            { id: "antena3-pt", name: "Antena 3",             genre: "Rock/Alt",     bitrate: 128, url: "https://streaming.rtp.pt/rtp-radio/a3fm.mp3" },
          ]
        },
        {
          id: "at",
          name: "Austria",
          flag: "🇦🇹",
          stations: [
            { id: "orf-oe1",    name: "Ö1",                   genre: "Cultural",     bitrate: 128, url: "https://orf-live.ors-shoutcast.at/oe1-q2a" },
            { id: "orf-fm4",    name: "FM4",                  genre: "Alt/Indie",    bitrate: 128, url: "https://orf-live.ors-shoutcast.at/fm4-q2a" },
          ]
        },
        {
          id: "ch",
          name: "Switzerland",
          flag: "🇨🇭",
          stations: [
            { id: "srf1",       name: "SRF 1",                genre: "Public Radio", bitrate: 128, url: "https://livestream.srfcdn.ch/srf-1-high.mp3" },
            { id: "srf-virus",  name: "SRF Virus",            genre: "Youth/Alt",    bitrate: 128, url: "https://livestream.srfcdn.ch/srf-virus-high.mp3" },
          ]
        },
        {
          id: "ru",
          name: "Russia",
          flag: "🇷🇺",
          stations: [
            { id: "radio-mir",  name: "Radio Mir",            genre: "Pop",          bitrate: 128, url: "https://online.radiomir.fm/radiomir-128" },
            { id: "echo-msk",   name: "Эхо Москвы",          genre: "News/Talk",    bitrate: 128, url: "https://stream.echofm.online/echo" },
            { id: "nashe-radio",name: "Наше Радио",           genre: "Russian Rock", bitrate: 128, url: "https://nashe1.hostingradio.ru:18000/nashe-128.mp3" },
          ]
        },
        {
          id: "ua",
          name: "Ukraine",
          flag: "🇺🇦",
          stations: [
            { id: "nrcu",       name: "Укрaїнське Радіо",    genre: "Public Radio", bitrate: 128, url: "https://stream.nrcu.gov.ua/pub/mp3/ukr-mw.mp3" },
            { id: "radio-era",  name: "Радіо Ера",           genre: "News/Talk",    bitrate: 128, url: "https://online.radioera.com.ua/radioera" },
          ]
        },
        {
          id: "tr",
          name: "Turkey",
          flag: "🇹🇷",
          stations: [
            { id: "trt1-radio", name: "TRT Radyo 1",         genre: "Public Radio", bitrate: 128, url: "https://radio-trt1.live.trt.com.tr/master.m3u8" },
            { id: "trt-fm",     name: "TRT FM",              genre: "Pop",          bitrate: 128, url: "https://radio-trtfm.live.trt.com.tr/master.m3u8" },
            { id: "radyo-doga", name: "Radyo Doğa",          genre: "Nature/Ambient",bitrate:128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/RADYODOGA.mp3" },
          ]
        },
      ]
    },
    {
      id: "middle-east",
      label: "Middle East",
      emoji: "🌍",
      countries: [
        {
          id: "ae",
          name: "UAE",
          flag: "🇦🇪",
          stations: [
            { id: "uae-r4",     name: "UAE Radio 4",          genre: "Pop/English",  bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/UAERADIO4.mp3" },
            { id: "star-fm-ae", name: "Star FM Dubai",        genre: "Pop",          bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/STAR1025FM.mp3" },
          ]
        },
        {
          id: "il",
          name: "Israel",
          flag: "🇮🇱",
          stations: [
            { id: "kan-gimel",  name: "Kan Gimel",            genre: "Pop/Rock",     bitrate: 128, url: "https://kan103.hikapo.com/kan103/mp3.stream" },
            { id: "kan-bet",    name: "Kan Bet",              genre: "Cultural",     bitrate: 128, url: "https://radio.media.kan.org.il/kanbet" },
          ]
        },
        {
          id: "lb",
          name: "Lebanon",
          flag: "🇱🇧",
          stations: [
            { id: "virgin-lb",  name: "Virgin Radio Lebanon", genre: "Pop",          bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/VIRGIN_LEBFM.mp3" },
          ]
        },
      ]
    },
    {
      id: "africa",
      label: "Africa",
      emoji: "🌍",
      countries: [
        {
          id: "za",
          name: "South Africa",
          flag: "🇿🇦",
          stations: [
            { id: "5fm-za",     name: "5FM",                  genre: "Pop/Hip-Hop",  bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/5FMAAC.aac" },
            { id: "947-za",     name: "947",                  genre: "Pop",          bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/947AAC.aac" },
            { id: "safm",       name: "SAFM",                 genre: "Public Radio", bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/SAFMAAC.aac" },
            { id: "1485-za",    name: "1485 Izwi Lomzansi",   genre: "Zulu",         bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/1485AMFM.mp3" },
          ]
        },
        {
          id: "ng",
          name: "Nigeria",
          flag: "🇳🇬",
          stations: [
            { id: "beat99-ng",  name: "The Beat 99.9 FM",     genre: "Afrobeats",    bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/THE_BEAT_999FMAAC.aac" },
            { id: "cool-fm-ng", name: "Cool FM 96.9",         genre: "Pop/Afro",     bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/COOL_FMAAC.aac" },
          ]
        },
        {
          id: "ke",
          name: "Kenya",
          flag: "🇰🇪",
          stations: [
            { id: "capital-ke", name: "Capital FM Kenya",     genre: "Pop",          bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/CAPITAL_FMAAC.aac" },
            { id: "kiss100-ke", name: "Kiss 100 FM",          genre: "Top 40",       bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/KISS100FMAAC.aac" },
          ]
        },
        {
          id: "gh",
          name: "Ghana",
          flag: "🇬🇭",
          stations: [
            { id: "joy-gh",     name: "Joy FM",               genre: "News/Pop",     bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/JOYONLINEFM.mp3" },
          ]
        },
        {
          id: "ma",
          name: "Morocco",
          flag: "🇲🇦",
          stations: [
            { id: "medi1",      name: "Medi 1",               genre: "World/Arabic", bitrate: 128, url: "https://medi1radio.ice.infomaniak.ch/medi1radio-64.aac" },
          ]
        },
      ]
    },
    {
      id: "asia",
      label: "Asia",
      emoji: "🌏",
      countries: [
        {
          id: "jp",
          name: "Japan",
          flag: "🇯🇵",
          stations: [
            { id: "nhk-r1",     name: "NHK Radio 1",          genre: "Public Radio", bitrate: 128, url: "https://nhkworld.nhk.or.jp/en/sound/r1/main" },
            { id: "nhk-world",  name: "NHK World Radio",      genre: "International",bitrate: 128, url: "https://nhkworld.nhk.or.jp/en/sound/worldradio" },
            { id: "j-wave",     name: "J-WAVE 81.3",          genre: "Pop/Jazz",     bitrate: 128, url: "https://www.uniquestream.net/jwave/mp3" },
            { id: "inter-fm",   name: "InterFM 897",          genre: "English/Int'l",bitrate: 128, url: "https://www.uniquestream.net/interfm/mp3" },
          ]
        },
        {
          id: "kr",
          name: "South Korea",
          flag: "🇰🇷",
          stations: [
            { id: "kbs-world",  name: "KBS World Radio",      genre: "International",bitrate: 128, url: "https://worldrr.kbs.co.kr/rss/program/world_main_live.m3u" },
            { id: "mbc-fm",     name: "MBC FM4U",             genre: "K-Pop",        bitrate: 128, url: "https://bfm.media.daum.net/radioStream.m3u?channel=mbc_fm" },
          ]
        },
        {
          id: "cn",
          name: "China",
          flag: "🇨🇳",
          stations: [
            { id: "cri-en",     name: "China Radio Int'l (EN)",genre: "International",bitrate: 128, url: "https://media.rawvoice.com/clns/clns.m3u" },
            { id: "cri-music",  name: "CRI Easy FM",          genre: "Pop",          bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/EASYFM.mp3" },
          ]
        },
        {
          id: "in",
          name: "India",
          flag: "🇮🇳",
          stations: [
            { id: "akaashvani",  name: "All India Radio",     genre: "Public Radio", bitrate: 128, url: "https://air.pc.cdn.bitgravity.com/air/live/pbaudio001/playlist.m3u8" },
            { id: "radio-mirchi",name:"Radio Mirchi 98.3",   genre: "Bollywood",    bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/RADIOMIRCHI983.mp3" },
            { id: "big-fm-in",   name:"Big FM 92.7",         genre: "Bollywood",    bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/BIGFM927DELHI.mp3" },
          ]
        },
        {
          id: "id",
          name: "Indonesia",
          flag: "🇮🇩",
          stations: [
            { id: "elshinta",   name: "Elshinta",             genre: "News/Talk",    bitrate: 128, url: "https://stream.elshinta.com/audio" },
            { id: "gen-fm",     name: "Gen FM",               genre: "Pop",          bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/GENFM.mp3" },
          ]
        },
        {
          id: "ph",
          name: "Philippines",
          flag: "🇵🇭",
          stations: [
            { id: "dzbb",       name: "DZBB Super Radyo",     genre: "News",         bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/DZBB.mp3" },
            { id: "magic-ph",   name: "Magic 89.9",           genre: "Top 40",       bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/MAGIC899.mp3" },
          ]
        },
        {
          id: "sg",
          name: "Singapore",
          flag: "🇸🇬",
          stations: [
            { id: "class95-sg", name: "Class 95",             genre: "Pop",          bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/CLASS95FM.mp3" },
            { id: "money-sg",   name: "Money FM 89.3",        genre: "Business",     bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/MONEYFM893.mp3" },
          ]
        },
        {
          id: "my",
          name: "Malaysia",
          flag: "🇲🇾",
          stations: [
            { id: "hitz-my",    name: "hitz.fm",              genre: "Pop",          bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/HITZFM.mp3" },
            { id: "fly-my",     name: "Fly FM",               genre: "Pop/Dance",    bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/FLYFM.mp3" },
          ]
        },
        {
          id: "th",
          name: "Thailand",
          flag: "🇹🇭",
          stations: [
            { id: "easy-fm-th", name: "Easy FM 105.5",        genre: "Pop/English",  bitrate: 128, url: "https://stream.easyfm.fm/stream" },
            { id: "fat-th",     name: "FAT Radio",            genre: "Indie/Alt",    bitrate: 128, url: "https://stream.fatradio.co.th/live" },
          ]
        },
      ]
    },
    {
      id: "oceania",
      label: "Oceania",
      emoji: "🌏",
      countries: [
        {
          id: "au",
          name: "Australia",
          flag: "🇦🇺",
          stations: [
            { id: "triple-j",   name: "triple j",             genre: "Alt/Indie",    bitrate: 128, url: "https://live-radio01.mediahubaustralia.com/2TJW/mp3/" },
            { id: "abc-rn",     name: "ABC Radio National",   genre: "Public Radio", bitrate: 128, url: "https://live-radio01.mediahubaustralia.com/RNAW/mp3/" },
            { id: "abc-classic",name: "ABC Classic",          genre: "Classical",    bitrate: 128, url: "https://live-radio01.mediahubaustralia.com/ABCCLASSIC/mp3/" },
            { id: "abc-jazz",   name: "ABC Jazz",             genre: "Jazz",         bitrate: 128, url: "https://live-radio01.mediahubaustralia.com/JAZW/mp3/" },
            { id: "triple-r",   name: "Triple R Melbourne",   genre: "Indie/Alt",    bitrate: 128, url: "https://rrr.org.au/rrr.mp3.m3u" },
          ]
        },
        {
          id: "nz",
          name: "New Zealand",
          flag: "🇳🇿",
          stations: [
            { id: "rnz-nat",    name: "RNZ National",         genre: "Public Radio", bitrate: 128, url: "https://radionz-ice.streamguys.com/national.mp3" },
            { id: "rnz-concert",name: "RNZ Concert",          genre: "Classical",    bitrate: 128, url: "https://radionz-ice.streamguys.com/concert.mp3" },
            { id: "george-nz",  name: "George FM",            genre: "Dance/Electronic",bitrate:128,url: "https://playerservices.streamtheworld.com/api/livestream-redirect/GEORGEFM.mp3" },
          ]
        }
      ]
    },
    {
      id: "genre",
      label: "By Genre",
      emoji: "🎵",
      countries: [
        { id: "genre-jazz",      name: "Jazz",            flag: "🎷",
          stations: [
            { id: "jazz24",      name: "Jazz24",           genre: "Jazz",         bitrate: 128, url: "https://live.wostreaming.net/manifest/ppm-jazz24mp3-ibc1" },
            { id: "smooth-jazz", name: "Smooth Jazz NYC", genre: "Smooth Jazz",  bitrate: 128, url: "https://smoothjazz.cdnstream1.com/2585_128.mp3" },
            { id: "jazz-groove", name: "Jazz Groove",     genre: "Jazz",         bitrate: 128, url: "https://thejazzgroove.com/itunes.pls" },
            { id: "soma-jazz2",  name: "SomaFM Jazz",     genre: "Jazz",         bitrate: 128, url: "https://ice1.somafm.com/somasf-128-mp3" },
          ]
        },
        { id: "genre-classical", name: "Classical",       flag: "🎻",
          stations: [
            { id: "classicfm",   name: "Classic FM (UK)", genre: "Classical",    bitrate: 128, url: "https://media-ice.musicradio.com/ClassicFMMP3" },
            { id: "medici",      name: "Medici.tv Radio", genre: "Classical",    bitrate: 128, url: "https://stream.radioclassiquegeneve.ch:8000/radio-classique-64.mp3" },
            { id: "wqxr",        name: "WQXR New York",  genre: "Classical",    bitrate: 128, url: "https://wqxr-ice.streamguys1.com/wqxr-web.mp3" },
            { id: "yle-class",   name: "Yle Klassinen",  genre: "Classical",    bitrate: 192, url: "https://icecast.yle.fi/radio/ylex/mp3/128" },
          ]
        },
        { id: "genre-electronic", name: "Electronic",     flag: "🎛️",
          stations: [
            { id: "di-trance",   name: "DI.fm Trance",   genre: "Trance",       bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/DIFMTRANCE.mp3" },
            { id: "di-techno",   name: "DI.fm Techno",   genre: "Techno",       bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/DIFMTECHNO.mp3" },
            { id: "di-house",    name: "DI.fm House",    genre: "House",        bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/DIFMHOUSE.mp3" },
            { id: "soma-drone",  name: "SomaFM Drone Zone",genre: "Ambient",   bitrate: 128, url: "https://ice1.somafm.com/dronezone-128-mp3" },
            { id: "bassdrive",   name: "Bassdrive",      genre: "Drum & Bass",  bitrate: 128, url: "https://bassdrive.com/bassdrive.m3u" },
          ]
        },
        { id: "genre-hiphop", name: "Hip-Hop & R&B",      flag: "🎤",
          stations: [
            { id: "power105",    name: "Power 105.1 NY",  genre: "Hip-Hop",     bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/WWPRAMAAC.aac" },
            { id: "hot97",       name: "Hot 97",          genre: "Hip-Hop",     bitrate: 128, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/WQHTAMAAC.aac" },
            { id: "soma-break",  name: "SomaFM BAGeL Radio",genre:"Hip-Hop/Alt",bitrate: 128, url: "https://ice1.somafm.com/bagel-128-mp3" },
          ]
        },
        { id: "genre-rock", name: "Rock & Metal",          flag: "🎸",
          stations: [
            { id: "rock-radio",  name: "Rock Radio UK",   genre: "Classic Rock", bitrate: 128, url: "https://icecast.thisisdax.com/RockRadioMP3" },
            { id: "planet-rock", name: "Planet Rock",     genre: "Rock",        bitrate: 128, url: "https://icecast.thisisdax.com/PlanetRockMP3" },
            { id: "metal-radio", name: "Metal Radio DE",  genre: "Metal",       bitrate: 128, url: "https://stream.metal-radio.de/metal-radio-128.mp3" },
          ]
        },
        { id: "genre-world", name: "World & Roots",        flag: "🌐",
          stations: [
            { id: "radio-paradiso",name:"Radio Paradiso", genre: "World",       bitrate: 128, url: "https://stream.radioparadise.com/world-192" },
            { id: "fip-world2",  name: "FIP Monde",       genre: "World",       bitrate: 128, url: "https://icecast.radiofrance.fr/fipworld-midfi.mp3" },
            { id: "radio-bhangra",name:"Radio Bhangra",   genre: "Bhangra",     bitrate: 128, url: "https://stream.radioparadise.com/world-flac" },
          ]
        },
        { id: "genre-ambient", name: "Ambient & Chill",    flag: "🌊",
          stations: [
            { id: "soma-groove2",name: "SomaFM Groove Salad",genre:"Ambient",  bitrate: 128, url: "https://ice1.somafm.com/groovesalad-128-mp3" },
            { id: "soma-secret", name: "SomaFM Secret Agent",genre:"Lounge",   bitrate: 128, url: "https://ice1.somafm.com/secretagent-128-mp3" },
            { id: "relaxing",    name: "Relaxing Radio",   genre: "Ambient",    bitrate: 128, url: "https://ice1.somafm.com/lush-128-mp3" },
            { id: "radio-swiss-jazz",name:"Radio Swiss Jazz",genre:"Jazz/Chill",bitrate:128,  url: "https://stream.radioswissjazz.ch/web/mp3_128" },
          ]
        },
        { id: "genre-talk", name: "News & Talk",           flag: "📰",
          stations: [
            { id: "bbc-world2",  name: "BBC World Service", genre: "News",      bitrate: 128, url: "https://stream.live.vc.bbcmedia.co.uk/bbc_world_service" },
            { id: "dw-en",       name: "DW English",        genre: "News",      bitrate: 128, url: "https://stream.dw.com/dw/en/live/audioStream" },
            { id: "rfi-en",      name: "RFI English",       genre: "News",      bitrate: 128, url: "https://rfi-hls-live.akamaized.net/hls/live/2016264/rfi_english/master.m3u8" },
            { id: "abc-news-au", name: "ABC News Australia",genre: "News",      bitrate: 128, url: "https://live-radio01.mediahubaustralia.com/NEWSW/mp3/" },
          ]
        }
      ]
    }
  ];

  // All stations flat list (built at init)
  let ALL_STATIONS = [];
  function buildFlatList() {
    ALL_STATIONS = [];
    for (const region of REGIONS) {
      if (region.id === "favorites" || region.id === "custom") continue;
      for (const country of region.countries) {
        for (const st of country.stations) {
          ALL_STATIONS.push({ ...st, countryName: country.name, countryFlag: country.flag, regionId: region.id });
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ICONS
  // ══════════════════════════════════════════════════════════════════════════
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
    signal:  `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M1.5 8.5C5 5 9.5 3 14 3s9 2 12.5 5.5"/><path d="M5 12c2.4-2.4 5.7-3.9 9-3.9s6.6 1.5 9 3.9"/><path d="M8.5 15.5C10.1 13.9 11.9 13 14 13s3.9.9 5.5 2.5"/><circle cx="14" cy="19" r="2"/></svg>`,
    globe:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  };

  // ══════════════════════════════════════════════════════════════════════════
  // PLUGIN
  // ══════════════════════════════════════════════════════════════════════════
  const OnlineRadio = {
    name: "Online Radio",
    api: null,

    // State
    isOpen: false,
    favorites: new Set(),
    customStations: [],         // user-added stations
    nowPlaying: null,           // { station, isPlaying }
    view: "home",               // "home" | "region" | "country" | "search" | "add"
    navStack: [],               // breadcrumb stack [{ view, data, title }]
    currentRegion: null,
    currentCountry: null,
    searchResults: [],
    searchQuery: "",

    // ── Lifecycle ────────────────────────────────────────────────────────
    async init(api) {
      console.log("[OnlineRadio] Initializing...");
      this.api = api;
      buildFlatList();

      await this.loadState();

      this.injectStyles();
      this.buildPanel();
      this.createPlayerBarButton();

      // Track now playing state
      if (api.on) {
        api.on("playbackState", ({ isPlaying }) => {
          if (this.nowPlaying) {
            this.nowPlaying.isPlaying = isPlaying;
            this.updateNowPlayingBar();
          }
        });
        api.on("trackChange", ({ track }) => {
          // If track changes away from a radio station, clear now playing indicator
          if (track?.source_type !== "radio") {
            this.nowPlaying = null;
            this.updateNowPlayingBar();
          }
        });
      }

      console.log("[OnlineRadio] Ready");
    },

    start() {},
    stop() { this.close(); },
    destroy() {
      this.close();
      document.getElementById("or-styles")?.remove();
      document.getElementById("or-panel")?.remove();
      document.getElementById("or-overlay")?.remove();
      document.getElementById("or-playerbar-btn")?.remove();
      document.getElementById("or-now-bar")?.remove();
    },

    // ── Persistence ──────────────────────────────────────────────────────
    async loadState() {
      if (!this.api?.storage?.get) return;
      try {
        const favRaw = await this.api.storage.get("or-favorites");
        if (favRaw) {
          const arr = typeof favRaw === "string" ? JSON.parse(favRaw) : favRaw;
          this.favorites = new Set(arr);
        }
        const customRaw = await this.api.storage.get("or-custom");
        if (customRaw) {
          this.customStations = typeof customRaw === "string" ? JSON.parse(customRaw) : customRaw;
        }
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

    // ── Play a station ───────────────────────────────────────────────────
    async playStation(station) {
      if (!this.api?.player?.setTrack) {
        this.toast("Player control not available", true);
        return;
      }
      try {
        await this.api.player.setTrack({
          title:       station.name,
          artist:      station.genre || "Online Radio",
          album:       station.countryName ? `📻 ${station.countryFlag || ""} ${station.countryName}` : "📻 Online Radio",
          duration:    0,          // live stream, no duration
          cover_url:   station.logo || "",
          source_type: "radio",
          external_id: station.url // URL is the identifier
        });
        this.nowPlaying = { station, isPlaying: true };
        this.updateNowPlayingBar();
        this.updateAllPlayButtons();
      } catch (err) {
        console.error("[OnlineRadio] Play error:", err);
        this.toast("Could not play station. Check the stream URL.", true);
      }
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
        // Check built-in
        const builtin = ALL_STATIONS.find(s => s.id === id);
        if (builtin) { favs.push(builtin); continue; }
        // Check custom
        const custom = this.customStations.find(s => s.id === id);
        if (custom) favs.push({ ...custom, countryName: "My Stations", countryFlag: "🔧" });
      }
      return favs;
    },

    // ── Search ───────────────────────────────────────────────────────────
    search(q) {
      const query = q.toLowerCase().trim();
      if (!query) return [];
      const all = [
        ...ALL_STATIONS,
        ...this.customStations.map(s => ({ ...s, countryName: "My Stations", countryFlag: "🔧" }))
      ];
      return all.filter(s =>
        s.name.toLowerCase().includes(query) ||
        (s.genre || "").toLowerCase().includes(query) ||
        (s.countryName || "").toLowerCase().includes(query)
      ).slice(0, 40);
    },

    // ══════════════════════════════════════════════════════════════════════
    // UI
    // ══════════════════════════════════════════════════════════════════════

    injectStyles() {
      if (document.getElementById("or-styles")) return;
      const s = document.createElement("style");
      s.id = "or-styles";
      s.textContent = `
        /* ── Overlay & Panel ─── */
        #or-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.78);
          backdrop-filter: blur(6px);
          z-index: 10000; opacity: 0; visibility: hidden;
          transition: opacity 0.2s;
        }
        #or-overlay.open { opacity: 1; visibility: visible; }

        #or-panel {
          position: fixed; top: 50%; left: 50%;
          transform: translate(-50%, -50%) scale(0.96);
          width: 700px; max-width: 96vw; max-height: 88vh;
          background: var(--bg-elevated, #181818);
          border: 1px solid var(--border-color, #2e2e2e);
          border-radius: 14px; z-index: 10001;
          box-shadow: 0 28px 70px rgba(0,0,0,0.65);
          display: flex; flex-direction: column; overflow: hidden;
          opacity: 0; visibility: hidden;
          transition: all 0.22s cubic-bezier(0,0,0.2,1);
        }
        #or-panel.open {
          opacity: 1; visibility: visible;
          transform: translate(-50%, -50%) scale(1);
        }

        /* ── Header ─── */
        .or-header {
          display: flex; align-items: center; gap: 10px;
          padding: 15px 18px;
          border-bottom: 1px solid var(--border-color, #2a2a2a);
          background: var(--bg-elevated, #181818);
          flex-shrink: 0;
        }
        .or-title {
          font-size: 17px; font-weight: 700;
          color: var(--text-primary, #fff);
          flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .or-icon-btn {
          background: none; border: none;
          color: var(--text-secondary, #aaa);
          cursor: pointer; padding: 7px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s, color 0.15s;
        }
        .or-icon-btn:hover { background: var(--bg-highlight,#2a2a2a); color: #fff; }

        /* ── Search bar in header ─── */
        .or-search-wrap {
          flex: 1; display: flex; align-items: center;
          background: var(--bg-surface, #1e1e1e);
          border: 1px solid var(--border-color, #333);
          border-radius: 8px; padding: 0 12px; gap: 8px;
        }
        .or-search-wrap input {
          flex: 1; background: none; border: none; outline: none;
          color: var(--text-primary, #fff); font-size: 14px; padding: 8px 0;
        }
        .or-search-wrap input::placeholder { color: var(--text-subdued,#555); }

        /* ── Now playing bar ─── */
        #or-now-bar {
          padding: 10px 18px;
          background: linear-gradient(to right, rgba(26,98,185,0.15), rgba(26,98,185,0.05));
          border-bottom: 1px solid rgba(26,98,185,0.25);
          display: none; align-items: center; gap: 12px; flex-shrink: 0;
        }
        #or-now-bar.visible { display: flex; }
        .or-now-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #e74c3c; flex-shrink: 0;
          animation: or-pulse 1.2s ease-in-out infinite;
        }
        .or-now-dot.paused { background: #aaa; animation: none; }
        @keyframes or-pulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        .or-now-info { flex: 1; overflow: hidden; }
        .or-now-name {
          font-size: 13px; font-weight: 600;
          color: var(--text-primary, #fff);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .or-now-meta {
          font-size: 11px; color: var(--text-secondary, #888);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .or-now-live {
          font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
          padding: 2px 7px; border-radius: 10px;
          background: #e74c3c; color: #fff;
        }

        /* ── Body ─── */
        .or-body {
          flex: 1; overflow-y: auto;
          background: var(--bg-base, #111);
          overscroll-behavior-y: contain;
        }
        .or-body::-webkit-scrollbar { width: 6px; }
        .or-body::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }

        /* ── Region grid (home) ─── */
        .or-home-wrap { padding: 18px; }
        .or-region-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
          gap: 10px; margin-bottom: 18px;
        }
        .or-region-card {
          background: var(--bg-elevated, #181818);
          border: 1px solid var(--border-color, #2a2a2a);
          border-radius: 10px; padding: 14px 16px;
          cursor: pointer; transition: all 0.15s;
          display: flex; align-items: center; gap: 12px;
        }
        .or-region-card:hover {
          border-color: var(--accent-primary, #1a62b9);
          background: var(--bg-surface, #1e1e1e);
          transform: translateY(-2px);
        }
        .or-region-emoji { font-size: 26px; flex-shrink: 0; }
        .or-region-info { overflow: hidden; }
        .or-region-name {
          font-size: 14px; font-weight: 600;
          color: var(--text-primary, #fff);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .or-region-count { font-size: 12px; color: var(--text-secondary, #888); }

        /* ── Country list ─── */
        .or-country-list { padding: 12px 18px; }
        .or-country-row {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 12px; border-radius: 9px;
          cursor: pointer; transition: background 0.15s;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .or-country-row:hover { background: var(--bg-surface, #1e1e1e); }
        .or-country-flag { font-size: 22px; flex-shrink: 0; }
        .or-country-name {
          flex: 1; font-size: 15px; font-weight: 500;
          color: var(--text-primary, #fff);
        }
        .or-country-count { font-size: 12px; color: var(--text-secondary, #888); }
        .or-country-chevron { color: var(--text-subdued, #555); font-size: 18px; }

        /* ── Station list ─── */
        .or-station-list { padding: 8px 18px 24px; }
        .or-station-row {
          display: flex; align-items: center; gap: 12px;
          padding: 9px 10px; border-radius: 8px;
          cursor: pointer; transition: background 0.15s;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          position: relative;
        }
        .or-station-row:hover { background: var(--bg-surface, #1e1e1e); }
        .or-station-row.now-playing { background: rgba(26,98,185,0.08); }

        .or-play-btn {
          width: 36px; height: 36px; border-radius: 50%;
          background: var(--bg-surface, #222);
          border: 1px solid var(--border-color,#333);
          color: var(--text-primary, #fff);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0;
          transition: background 0.15s, border-color 0.15s, transform 0.1s;
        }
        .or-play-btn:hover { background: var(--accent-primary,#1a62b9); border-color: var(--accent-primary,#1a62b9); transform: scale(1.08); }
        .or-station-row.now-playing .or-play-btn {
          background: var(--accent-primary,#1a62b9);
          border-color: var(--accent-primary,#1a62b9);
        }

        .or-station-info { flex: 1; overflow: hidden; }
        .or-station-name {
          font-size: 14px; font-weight: 500;
          color: var(--text-primary, #fff);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .or-station-row.now-playing .or-station-name { color: var(--accent-primary,#1a62b9); }

        .or-station-meta {
          display: flex; align-items: center; gap: 6px;
          margin-top: 2px;
        }
        .or-genre-tag {
          font-size: 11px; padding: 2px 7px; border-radius: 10px;
          background: var(--bg-surface,#222);
          color: var(--text-secondary,#888);
          white-space: nowrap;
        }
        .or-bitrate { font-size: 11px; color: var(--text-subdued,#555); }
        .or-flag-badge { font-size: 14px; }

        .or-fav-btn {
          background: none; border: none;
          color: var(--text-subdued, #555);
          cursor: pointer; padding: 6px;
          display: flex; align-items: center;
          transition: color 0.15s, transform 0.1s;
          opacity: 0;
        }
        .or-station-row:hover .or-fav-btn { opacity: 1; }
        .or-fav-btn.faved { color: #f1c40f; opacity: 1; }
        .or-station-row .or-fav-btn.faved { opacity: 1; }
        .or-fav-btn:hover { transform: scale(1.2); color: #f1c40f; }

        /* ── Add custom station form ─── */
        .or-add-wrap { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
        .or-add-title { font-size: 16px; font-weight: 700; color: var(--text-primary,#fff); }
        .or-field { display: flex; flex-direction: column; gap: 5px; }
        .or-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-secondary,#aaa); }
        .or-input {
          padding: 10px 13px;
          background: var(--bg-surface, #1e1e1e);
          border: 1px solid var(--border-color,#333);
          border-radius: 8px; color: var(--text-primary,#fff);
          font-size: 14px; outline: none; font-family: inherit;
          transition: border-color 0.2s;
        }
        .or-input:focus { border-color: var(--accent-primary,#1a62b9); }
        .or-help { font-size: 12px; color: var(--text-subdued,#555); }
        .or-btn-primary {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 18px; background: var(--accent-primary,#1a62b9);
          color: #fff; border: none; border-radius: 8px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: filter 0.15s; align-self: flex-start;
        }
        .or-btn-primary:hover { filter: brightness(1.15); }
        .or-status { font-size: 13px; padding: 8px 12px; border-radius: 7px; display: none; }
        .or-status.ok { display: block; background: rgba(46,204,113,0.1); color: #2ecc71; }
        .or-status.err { display: block; background: rgba(231,76,60,0.1); color: #e74c3c; }

        /* ── Section header ─── */
        .or-section-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 18px 6px;
        }
        .or-section-label {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 1px; color: var(--text-secondary,#777);
        }

        /* ── Empty state ─── */
        .or-empty {
          text-align: center; padding: 50px 20px;
          color: var(--text-subdued,#555);
        }
        .or-empty-icon { font-size: 40px; margin-bottom: 12px; }
        .or-empty-title { font-size: 15px; font-weight: 600; color: var(--text-secondary,#777); margin-bottom: 6px; }
        .or-empty-sub { font-size: 13px; }

        /* ── Player bar button ─── */
        .or-playerbar-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 6px 14px; border-radius: 20px;
          border: 1px solid var(--border-color,#404040);
          background: transparent; color: #fff;
          cursor: pointer; font-size: 13px; font-weight: 600;
          transition: border-color 0.15s, background 0.15s, transform 0.1s;
        }
        .or-playerbar-btn:hover {
          background: var(--bg-highlight,#2a2a2a);
          border-color: #e74c3c; transform: scale(1.04);
        }

        /* ── Toast ─── */
        .or-toast {
          position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%);
          background: #222; color: #fff; padding: 10px 20px; border-radius: 8px;
          z-index: 10010; font-size: 13px; box-shadow: 0 4px 16px rgba(0,0,0,0.4);
          opacity: 0; transition: opacity 0.25s; pointer-events: none; white-space: nowrap;
        }
        .or-toast.err { background: #c0392b; }

        /* ── Mobile ─── */
        @media (max-width: 768px) {
          #or-panel {
            width: 100vw; height: 100vh; max-height: 100vh;
            top: 0; left: 0; transform: none;
            border-radius: 0; border: none;
          }
          #or-panel.open { transform: none; }
          .or-region-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
          .or-fav-btn { opacity: 1; }
          .or-input { font-size: 16px; }
          .or-station-row { padding: 12px 8px; }
          .or-play-btn { width: 40px; height: 40px; }
        }
      `;
      document.head.appendChild(s);
    },

    buildPanel() {
      const overlay = document.createElement("div");
      overlay.id = "or-overlay";
      overlay.onclick = () => this.close();
      document.body.appendChild(overlay);

      const panel = document.createElement("div");
      panel.id = "or-panel";
      panel.innerHTML = `
        <div class="or-header" id="or-header">
          <button class="or-icon-btn" id="or-back-btn" style="display:none">${I.back}</button>
          <div class="or-title" id="or-title">📻 Online Radio</div>
          <div class="or-search-wrap" id="or-search-wrap">
            ${I.search}
            <input type="text" id="or-search-input" placeholder="Search stations, genres, countries…">
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
      input.addEventListener("input", e => {
        clearTimeout(timer);
        const q = e.target.value.trim();
        if (!q) { this.showHome(); return; }
        timer = setTimeout(() => {
          this.searchQuery = q;
          this.showSearchResults(q);
        }, 250);
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

    // ── Navigation ───────────────────────────────────────────────────────
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
      else if (this.view === "region") this.renderRegionView(this.currentData);
      else if (this.view === "country") this.renderCountryView(this.currentData);
      else if (this.view === "search") this.showSearchResults(this.searchQuery);
    },

    // ── Home view ────────────────────────────────────────────────────────
    showHome() {
      this.view = "home";
      this.navStack = [];
      this.setHeader("📻 Online Radio", false);

      // Clear search input
      const inp = document.getElementById("or-search-input");
      if (inp) inp.value = "";

      const body = document.getElementById("or-body");
      const favStations = this.getFavoriteStations();

      let html = `<div class="or-home-wrap">`;

      // Favorites section
      if (favStations.length > 0) {
        html += `
          <div class="or-section-head">
            <span class="or-section-label">⭐ Favorites (${favStations.length})</span>
          </div>
          <div class="or-station-list" style="padding: 0 0 16px 0; margin-bottom: 8px; border-bottom: 1px solid var(--border-color,#2a2a2a);">
            ${favStations.map(s => this.renderStationRow(s, true)).join("")}
          </div>
        `;
      }

      // Custom stations section
      if (this.customStations.length > 0) {
        const enriched = this.customStations.map(s => ({ ...s, countryName: "My Stations", countryFlag: "🔧" }));
        html += `
          <div class="or-section-head">
            <span class="or-section-label">🔧 My Stations (${this.customStations.length})</span>
          </div>
          <div class="or-station-list" style="padding: 0 0 16px 0; margin-bottom: 8px; border-bottom: 1px solid var(--border-color,#2a2a2a);">
            ${enriched.map(s => this.renderStationRow(s, true)).join("")}
          </div>
        `;
      }

      // Region grid
      html += `<div class="or-section-head"><span class="or-section-label">Browse by Region</span></div>`;
      html += `<div class="or-region-grid">`;

      for (const region of REGIONS) {
        if (region.id === "favorites" || region.id === "custom") continue;
        const stationCount = region.countries.reduce((n, c) => n + c.stations.length, 0);
        const countryCount = region.countries.length;
        html += `
          <div class="or-region-card" data-region="${region.id}">
            <div class="or-region-emoji">${region.emoji}</div>
            <div class="or-region-info">
              <div class="or-region-name">${region.label}</div>
              <div class="or-region-count">${countryCount} countries · ${stationCount} stations</div>
            </div>
          </div>
        `;
      }
      html += `</div></div>`;

      body.innerHTML = html;

      // Attach region card clicks
      body.querySelectorAll("[data-region]").forEach(el => {
        el.onclick = () => {
          const region = REGIONS.find(r => r.id === el.dataset.region);
          if (region) {
            this.pushNav("region", region, `${region.emoji} ${region.label}`);
            this.renderRegionView(region);
          }
        };
      });

      this.attachStationListeners(body);
      this.updateNowPlayingBar();
    },

    // ── Region view (country list) ───────────────────────────────────────
    renderRegionView(region) {
      const body = document.getElementById("or-body");
      let html = `<div class="or-country-list">`;

      for (const country of region.countries) {
        html += `
          <div class="or-country-row" data-country="${country.id}">
            <span class="or-country-flag">${country.flag}</span>
            <span class="or-country-name">${country.name}</span>
            <span class="or-country-count">${country.stations.length} stations</span>
            <span class="or-country-chevron">›</span>
          </div>
        `;
      }
      html += `</div>`;
      body.innerHTML = html;

      body.querySelectorAll("[data-country]").forEach(el => {
        el.onclick = () => {
          const country = region.countries.find(c => c.id === el.dataset.country);
          if (country) {
            this.pushNav("country", { country, region }, `${country.flag} ${country.name}`);
            this.renderCountryView({ country, region });
          }
        };
      });
    },

    // ── Country view (station list) ──────────────────────────────────────
    renderCountryView({ country }) {
      const body = document.getElementById("or-body");
      const enriched = country.stations.map(s => ({ ...s, countryName: country.name, countryFlag: country.flag }));

      body.innerHTML = `
        <div class="or-section-head">
          <span class="or-section-label">${enriched.length} station${enriched.length !== 1 ? "s" : ""}</span>
        </div>
        <div class="or-station-list">
          ${enriched.map(s => this.renderStationRow(s)).join("")}
        </div>
      `;
      this.attachStationListeners(body);
    },

    // ── Search results ───────────────────────────────────────────────────
    showSearchResults(q) {
      this.view = "search";
      this.navStack = [];
      this.setHeader(`Search: "${q}"`, true);

      const results = this.search(q);
      const body = document.getElementById("or-body");

      if (results.length === 0) {
        body.innerHTML = `
          <div class="or-empty">
            <div class="or-empty-icon">🔍</div>
            <div class="or-empty-title">No stations found</div>
            <div class="or-empty-sub">Try searching by genre, country, or station name</div>
          </div>`;
        return;
      }

      body.innerHTML = `
        <div class="or-section-head">
          <span class="or-section-label">${results.length} result${results.length !== 1 ? "s" : ""}</span>
        </div>
        <div class="or-station-list">
          ${results.map(s => this.renderStationRow(s, true)).join("")}
        </div>
      `;
      this.attachStationListeners(body);
    },

    // ── Add custom station ───────────────────────────────────────────────
    showAddStation() {
      this.pushNav("add", null, "Add Custom Station");
      const body = document.getElementById("or-body");
      body.innerHTML = `
        <div class="or-add-wrap">
          <div class="or-add-title">${I.plus} Add a Custom Radio Station</div>
          <p style="font-size:13px; color:var(--text-secondary,#aaa); margin:0; line-height:1.6">
            Add any internet radio stream. You need a direct stream URL (ending in .mp3, .aac, .ogg, .m3u, .m3u8, etc.)
          </p>

          <div class="or-field">
            <label class="or-label">Station Name</label>
            <input class="or-input" id="or-f-name" type="text" placeholder="e.g. My Favorite Radio">
          </div>
          <div class="or-field">
            <label class="or-label">Stream URL</label>
            <input class="or-input" id="or-f-url" type="url" placeholder="https://stream.example.com/live.mp3">
            <span class="or-help">Direct audio stream URL. Supports mp3, aac, ogg, m3u, m3u8, pls</span>
          </div>
          <div class="or-field">
            <label class="or-label">Genre (optional)</label>
            <input class="or-input" id="or-f-genre" type="text" placeholder="e.g. Jazz, Rock, News">
          </div>
          <div class="or-field">
            <label class="or-label">Country (optional)</label>
            <input class="or-input" id="or-f-country" type="text" placeholder="e.g. Germany">
          </div>

          <button class="or-btn-primary" id="or-add-save">${I.plus} Add Station</button>
          <div class="or-status" id="or-add-status"></div>

          ${this.customStations.length > 0 ? `
            <div style="margin-top: 8px; border-top: 1px solid var(--border-color,#2a2a2a); padding-top: 16px;">
              <div class="or-section-label" style="margin-bottom: 10px; display:block">Your Custom Stations</div>
              ${this.customStations.map(s => `
                <div style="display:flex; align-items:center; gap:10px; padding: 8px 4px; border-bottom: 1px solid rgba(255,255,255,0.04);">
                  <span style="flex:1; font-size:14px; color:var(--text-primary,#fff)">${this.esc(s.name)}</span>
                  <span style="font-size:12px; color:var(--text-secondary,#888)">${this.esc(s.genre || "")}</span>
                  <button class="or-icon-btn or-del-custom" data-id="${s.id}" title="Delete" style="color:#e74c3c">${I.trash}</button>
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

      if (!name) { status.className = "or-status err"; status.textContent = "Please enter a station name."; return; }
      if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
        status.className = "or-status err"; status.textContent = "Please enter a valid stream URL."; return;
      }

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
      this.showAddStation(); // re-render add view
    },

    // ── Render helpers ───────────────────────────────────────────────────
    renderStationRow(station, showFlag = false) {
      const isPlaying = this.nowPlaying?.station?.id === station.id;
      const isFaved = this.favorites.has(station.id);
      const kbps = station.bitrate ? `${station.bitrate}kbps` : "";
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
              ${kbps ? `<span class="or-bitrate">${kbps}</span>` : ""}
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
      const builtin = ALL_STATIONS.find(s => s.id === id);
      if (builtin) return builtin;
      const custom = this.customStations.find(s => s.id === id);
      if (custom) return { ...custom, countryName: "My Stations", countryFlag: "🔧" };
      return null;
    },

    // ── Now playing bar ──────────────────────────────────────────────────
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
        if (dot) dot.className = `or-now-dot${this.nowPlaying.isPlaying ? "" : " paused"}`;
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

  // Register with Audion
  if (typeof Audion !== "undefined" && Audion.register) {
    Audion.register(OnlineRadio);
  } else {
    window.OnlineRadio = OnlineRadio;
    window.AudionPlugin = OnlineRadio;
  }

})();
