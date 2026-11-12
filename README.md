# Studi Kasus 5 — Clinic Management System (NestJS)

Backend REST API untuk administrasi klinik: **pasien, dokter, departemen, janji temu, dan rekam medis (catatan kunjungan)**, dengan aturan bisnis jadwal, alur status janji temu, dan transaksi saat mencatat kunjungan. Seluruh data adalah data fiktif.

## Teknologi

| Komponen | Pilihan |
|----------|---------|
| Framework | NestJS (TypeScript, ES Module) |
| Database | PostgreSQL |
| ORM | TypeORM (driver `pg`) |
| Validasi | `class-validator` + `class-transformer` (`ValidationPipe` global) |
| Konfigurasi | `@nestjs/config` + `Joi` (file `.env`) |
| Pengujian | Postman Collection (Collection Runner) |

## Dokumen yang diserahkan

| Dokumen | Lokasi |
|---------|--------|
| Source code | `src/` |
| **ERD** (entitas, atribut, PK, FK, relasi) | [`docs/ERD.md`](docs/ERD.md) |
| **API Specification** (Markdown) | [`docs/API-Specification.md`](docs/API-Specification.md) |
| **Postman Collection** (bisa diimpor) | [`docs/Clinic-Management.postman_collection.json`](docs/Clinic-Management.postman_collection.json) |
| Penjelasan skenario Postman | [`docs/Postman-Collection.md`](docs/Postman-Collection.md) |
| API Specification (OpenAPI, opsional) | [`docs/openapi.json`](docs/openapi.json) |

## Instalasi

Prasyarat: **Node.js ≥ 20**, npm, dan **PostgreSQL** yang sedang berjalan.

1. Pasang dependency:

   ```bash
   npm install
   ```

   Jika project dibuat dari nol, paket yang dipakai kode ini:

   ```bash
   npm install @nestjs/config @nestjs/typeorm @nestjs/mapped-types typeorm pg joi class-validator class-transformer
   ```

2. Buat database kosong di PostgreSQL:

   ```bash
   psql -U postgres -c "CREATE DATABASE clinic_db;"
   ```

   Tabel dibuat otomatis saat aplikasi pertama kali dijalankan (lihat bagian *Migrasi database*).

3. (Opsional) Lihat isi database dengan **DBeaver**: *Database → New Database Connection → PostgreSQL*, isi Host `localhost`, Port `5432`, Database `clinic_db`, serta Username dan Password sesuai `.env`. Setelah aplikasi berjalan, tabel muncul di *Databases → clinic_db → Schemas → public → Tables*.

> Kode memakai impor berakhiran `.js` dan `await` di `main.ts`, jadi project harus berupa **ES Module** (`"type": "module"` di `package.json`, `module`/`moduleResolution` bertipe `nodenext` di `tsconfig.json`).

## Konfigurasi environment

Buat file `.env` di root project:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=isi_password_anda
DB_DATABASE=clinic_db
```

| Variabel | Default | Keterangan |
|----------|---------|------------|
| `PORT` | `3000` | Port HTTP server |
| `NODE_ENV` | `development` | `development` / `staging` / `production` |
| `DB_HOST` | — (wajib) | Host PostgreSQL |
| `DB_PORT` | `5432` | Port PostgreSQL |
| `DB_USERNAME` | — (wajib) | User PostgreSQL |
| `DB_PASSWORD` | — (wajib) | Password PostgreSQL (rahasia) |
| `DB_DATABASE` | — (wajib) | Nama database |

Variabel wajib divalidasi dengan Joi: server berhenti dengan pesan jelas jika ada yang kosong. File `.env` jangan di-commit ke Git (tambahkan ke `.gitignore`); sertakan contohnya sebagai `.env.example` tanpa password asli.

## Migrasi database

Aplikasi ini menggunakan **sinkronisasi skema TypeORM**: saat dijalankan dengan `NODE_ENV=development`, kelima tabel (`departemen`, `dokter`, `pasien`, `janji_temu`, `rekam_medis`) beserta foreign key dan constraint dibuat otomatis dari entity di `src/**/entities/`. Database-nya harus sudah ada (langkah 2 di atas); tabel tidak perlu dibuat manual.

Catatan:

- Karena sinkronisasi aktif, perubahan entity (misalnya kolom dihapus) langsung mengubah tabel saat server dijalankan ulang, dan data pada kolom yang dihapus ikut hilang.
- Pada `staging`/`production` sinkronisasi **mati**. Untuk lingkungan tersebut gunakan migrasi TypeORM atau SQL ilustrasi di [`docs/ERD.md`](docs/ERD.md).

Cek hasilnya:

```bash
psql -U postgres -d clinic_db -c "\dt"
```

## Menjalankan aplikasi

```bash
npm run start:dev      # development (auto-reload)
```
```bash
npm run build && npm run start:prod   # produksi
```

Setelah berjalan, API ada di `http://localhost:3000`. Cek dengan membuka `http://localhost:3000/`:

```json
{ "success": true, "message": "Data berhasil diambil", "statusCode": 200,
  "data": { "nama": "API Clinic Management System", "versi": "1.0.0", "status": "berjalan" } }
```

## Pengujian

### Postman

1. Jalankan aplikasi (`npm run start:dev`).
2. Impor `postman/Clinic-Management.postman_collection.json` ke Postman. Variabel `baseUrl` default `http://localhost:3000`; ubah sesuai `PORT` di `.env` bila berbeda.
3. Jalankan seluruh collection dengan **Collection Runner** (urutan default, jangan diacak).

Collection berisi **73 request** dalam 9 folder: CRUD semua entitas, pembuatan dan pengambilan data beserta relasinya, update dan delete, input tidak valid (400), ID tidak ditemukan (404), dan konflik data/relasi/aturan bisnis (409). Setiap request punya *test script* otomatis. Data uji dibersihkan di folder terakhir sehingga collection bisa dijalankan berulang kali (collection ini menulis ke database di `.env`, lalu menghapus data ujinya sendiri). Rincian skenario ada di [`postman/Postman-Collection.md`](postman/Postman-Collection.md).

## Struktur proyek

```
src/
├── app.module.ts            # ConfigModule + TypeORM + semua modul fitur
├── main.ts                  # ValidationPipe global + interceptor response
├── common/utils/            # pembuat nomor rekam medis & kode janji temu
├── interceptors/            # pembungkus response sukses
├── middleware/              # pencatat log request
├── departemen/  dokter/  pasien/  janji-temu/  rekam-medis/
│   ├── entities/            # entity TypeORM + relasi
│   ├── dto/                 # DTO + aturan validasi
│   ├── *.controller.ts      # routing HTTP, status code
│   ├── *.service.ts         # logika bisnis, akses database
│   └── *.module.ts
docs/        # ERD, API Specification, OpenAPI
postman/     # Postman Collection
```

## Alur request hingga database

Contoh `POST /rekam-medis`:

1. **Request** masuk ke `RekamMedisController.create()`; middleware mencatat log.
2. `ValidationPipe` memvalidasi body terhadap `CreateRekamMedisDto` (`janjiTemuId` UUID, `catatanKunjungan` wajib, properti asing ditolak). Gagal → **400** sebelum menyentuh service.
3. `RekamMedisService.create()` memeriksa janji temu ada (404 jika tidak), statusnya `DIKONFIRMASI` atau `SELESAI` (409 jika bukan), dan belum punya rekam medis (409 jika sudah).
4. Service membuka **transaksi database** (`DataSource.transaction`): menyimpan rekam medis lalu mengubah status janji temu menjadi `SELESAI`.
5. Jika salah satu langkah gagal, transaksi di-**rollback**: tidak ada data yang setengah tersimpan.
6. Sukses → rekam medis dimuat ulang beserta `janjiTemu`, `pasien`, dan `dokter`, lalu dikembalikan dengan **201** dalam bentuk `{ success, message, statusCode, data }` (dibungkus interceptor).

Error dari service berupa `NotFoundException` (404), `BadRequestException` (400), atau `ConflictException` (409), yang dirender Nest menjadi `{ message, error, statusCode }`.

## Keputusan desain

- **`janji_temu` sebagai tabel penghubung** antara pasien dan dokter (hubungan many-to-many), membawa data tambahan: jadwal, keluhan, dan status.
- **`rekam_medis.janji_temu_id` bersifat UNIQUE** sehingga satu janji temu paling banyak punya satu catatan kunjungan, dijaga langsung oleh database.
- **Status janji temu dibatasi alur**: `TERJADWAL → DIKONFIRMASI → SELESAI`, atau `DIBATALKAN` (wajib alasan). Perpindahan lain ditolak 409.
- **Jadwal bentrok dicegah**: dokter atau pasien tidak boleh punya dua janji aktif di jam yang sama; jadwal harus di masa depan; dokter harus berstatus aktif.
- **Pembuatan rekam medis memakai transaksi** agar rekam medis dan perubahan status janji selalu berhasil atau gagal bersamaan.
- **`ON DELETE RESTRICT`** pada semua relasi mencegah data yatim; service memeriksa lebih dulu sehingga pesan error ramah (409).
- **Rekam medis hanya memuat catatan kunjungan dan tindakan umum**, tanpa diagnosis klinis, resep, atau data vital, sesuai batasan tugas.
- **ID berupa UUID**, nomor rekam medis (`RM-YYYYMMDD-XXXX`) dan kode janji temu (`JT-YYYYMMDD-XXXXX`) dibuat otomatis oleh sistem.
- **`PATCH` untuk update sebagian**: DTO update dibuat dengan `PartialType`, sehingga hanya field yang dikirim yang berubah.
- **Konfigurasi sensitif lewat environment variable** (`.env`), divalidasi Joi saat start.