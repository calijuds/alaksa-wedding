# Alaksa Wedding

Website fotografi & video pernikahan Alaksa Wedding (Makassar & Gowa).
Static site: HTML, CSS dan JavaScript murni, tanpa build step, siap di-deploy ke Vercel.

## Jalankan di komputer

```bash
python3 -m http.server 5173
```

Lalu buka http://localhost:5173

## Mengubah konten

| Yang diubah | File |
|---|---|
| Foto karya, cerita (pop-up), slider utama, testimoni, nomor WhatsApp | `assets/js/data.js` |
| Teks halaman, paket & harga, layanan | `index.html` |
| Warna, font, ukuran | `assets/css/style.css` (bagian `:root`) |
| Efek partikel di hero (bentuk, jumlah partikel) | `assets/js/story.js` (bagian `CFG`) |

Foto disimpan di `assets/img/`, versi kecil untuk grid di `assets/img/thumb/` (lebar maks. 900px).
Membuat thumbnail di macOS:

```bash
sips -Z 900 assets/img/nama-foto.jpg --out assets/img/thumb/nama-foto.jpg
```

Setelah mengubah CSS/JS, naikkan angka `?v=` di tag `<link>` / `<script>` pada `index.html` supaya browser memuat versi baru.

## Deploy ke Vercel

1. Push repo ini ke GitHub.
2. Di vercel.com → **Add New → Project** → pilih repo `alaksa-wedding`.
3. Framework preset: **Other**. Tidak perlu build command. Klik **Deploy**.
4. (Opsional) Tambahkan domain sendiri di **Settings → Domains**.
