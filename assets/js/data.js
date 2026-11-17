/* =====================================================================
   Alaksa Wedding — site data (edit this file to update content)

   WA        WhatsApp number in international format, no "+" or spaces.
   STORIES   one entry per wedding / session. Opens as a pop-up and can be
             shared as a link: alaksawedding.com/#cerita-<id>
   PHOTOS    every photo in the "Karya" grid. `story` links it to a story,
             `cat` must be one of the CATEGORIES keys.
   FEATURED  photo ids shown in the big "Sedang tayang" slider (max ~4).
   TESTIMONIALS  leave empty to hide the section; add real quotes only.
   ===================================================================== */
window.ALAKSA = {
  WA: '6285947748579',

  CATEGORIES: {
    engagement: 'Engagement',
    resepsi: 'Resepsi',
    detail: 'Detail'
  },

  STORIES: {
    az: {
      title: 'A & Z',
      kicker: 'Engagement & Resepsi · Makassar',
      text: 'Pagi yang cerah di The Saigon, lalu malam resepsi dengan backdrop inisial mereka. Kami mengikuti A & Z dari sesi santai berdua sampai pelaminan — penuh tawa, sedikit usil, dan tetap hangat.',
      meta: [['Lokasi', 'The Saigon, Makassar'], ['Sesi', 'Engagement · Resepsi'], ['Tahun', '2026']]
    },
    pelaminan: {
      title: 'Menuju Pelaminan',
      kicker: 'Resepsi · Makassar',
      text: 'Langkah pengantin diantar keluarga menuju pelaminan. Kami memotret dari balik bunga dan tamu, supaya rasanya seperti berada di sana.',
      meta: [['Lokasi', 'Ballroom, Makassar'], ['Sesi', 'Resepsi'], ['Gaya', 'Hitam putih dokumenter']]
    }
  },

  PHOTOS: [
    { id: 'az-pelaminan',   src: 'az-pelaminan.jpg',   story: 'az',        cat: 'resepsi',    title: 'Diam di tengah keramaian', alt: 'Pasangan pengantin berdiri tenang di depan backdrop inisial AZ, tamu bergerak kabur di sekitar' },
    { id: 'az-berjalan',    src: 'az-berjalan.jpg',    story: 'az',        cat: 'engagement', title: 'Senyum yang sama',          alt: 'Pasangan bergandengan tangan berjalan, pengantin wanita membawa buket pink' },
    { id: 'pengantin-pria', src: 'resepsi-langkah-pengantin-pria.jpg', story: 'pelaminan', cat: 'resepsi', title: 'Diantar keluarga', alt: 'Pengantin pria membawa buket diantar ibu dan kerabat, hitam putih' },
    { id: 'az-jendela',     src: 'az-jendela-saigon.jpg', story: 'az',     cat: 'engagement', title: 'Di balik kaca',             alt: 'Pasangan menempelkan wajah di kaca jendela The Saigon sambil melambai' },
    { id: 'pengantin-wanita', src: 'resepsi-pengantin-wanita.jpg', story: 'pelaminan', cat: 'resepsi', title: 'Haru menuju pelaminan', alt: 'Pengantin wanita diantar dua pendamping sambil tersenyum haru, hitam putih' },
    { id: 'az-cincin',      src: 'az-cincin.jpg',      story: 'az',        cat: 'detail',     title: 'Cincin di antara bunga',    alt: 'Cincin emas di atas kotak beludru dikelilingi bunga' },
    { id: 'az-pintu',       src: 'az-pintu-saigon.jpg', story: 'az',       cat: 'engagement', title: 'Pintu yang terbuka',        alt: 'Pasangan mengintip dari pintu kaca hitam sambil tersenyum' },
    { id: 'az-bros',        src: 'az-detail-bros.jpg', story: 'az',        cat: 'detail',     title: 'Bros, dalam gerak',         alt: 'Detail bros emas di busana pengantin dengan efek gerak' }
  ],

  FEATURED: ['az-pelaminan', 'pengantin-wanita', 'az-berjalan'],

  TESTIMONIALS: [
    // { quote: 'Tulis testimoni asli di sini.', name: 'Nama Pasangan', event: 'Resepsi · Gowa 2026' }
  ]
};
