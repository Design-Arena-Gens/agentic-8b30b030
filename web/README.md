## Human Muse Agent

Satu alur otomatis untuk:

- menyusun konsep seni manusia berdasarkan brief singkat,
- merender ilustrasi menggunakan model OpenAI `gpt-image-1`,
- menulis caption & hashtag Instagram yang selaras dengan tone yang dipilih,
- (opsional) menerbitkan langsung ke Instagram Business/Creator lewat Graph API.

Antarmuka berjalan di Next.js App Router + Tailwind sehingga mudah dideploy ke Vercel.

## Prasyarat

- **OPENAI_API_KEY** dengan akses ke model `gpt-4.1-mini` & `gpt-image-1`.
- Opsional: kredensial Instagram Graph API
  - `INSTAGRAM_ACCESS_TOKEN`
  - `INSTAGRAM_USER_ID`
  - `INSTAGRAM_GRAPH_VERSION` (default `v20.0`)

Salin `.env.example` menjadi `.env.local` lalu isi nilai di atas sebelum menjalankan aplikasi.

```bash
cp .env.example .env.local
```

## Menjalankan Secara Lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000` lalu siapkan brief di panel kiri. Hasil render, caption, serta status upload akan muncul di panel kanan.

## Produksi / Deploy

Proyek sudah siap deploy ke Vercel. Pastikan environment di dashboard Vercel sudah terisi semua variabel di atas, kemudian jalankan:

```bash
npm run build
npm run start
```

Untuk deploy otomatis dari CLI gunakan `vercel deploy --prod` setelah login atau men-set `VERCEL_TOKEN`.

## Lisensi

MIT – gunakan, modifikasi, dan sesuaikan dengan pipeline kreatif Anda.
