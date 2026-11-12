# Studi Kasus 5 — Clinic Management System

Backend REST API untuk pengelolaan operasional klinik: **departemen, dokter, pasien, janji temu, dan rekam medis**, dengan aturan bisnis penjadwalan bebas bentrok, pembuatan kode otomatis, alur status janji temu, dan transaksi pencatatan rekam medis.

## Teknologi

| Komponen | Pilihan |
|----------|---------|
| Framework | NestJS 12 (TypeScript, ESM) |
| Database | PostgreSQL (Docker `postgres:16-alpine`) |
| ORM | TypeORM (driver `pg`) |
| Validasi | `class-validator` + `class-transformer` (`ValidationPipe` global) |
| Konfigurasi | `@nestjs/config` + `joi` (validasi skema file `.env`) |
| Interceptor & Middleware | `TransformResponseInterceptor` (format respons standar) + `LogMiddlewareMiddleware` (HTTP logger) |
| Pengujian | Vitest + Supertest, Postman (terhadap PostgreSQL) |

## Dokumen yang diserahkan

| Dokumen | Lokasi |
|---------|--------|
| Source code | `src/` |
| Konfigurasi Docker | `docker-compose.yml` |
| Kebutuhan fungsional, aturan bisnis, **ERD** | [`docs/DESAIN-DAN-ERD.md`](docs/DESAIN-DAN-ERD.md) |
| **API Specification** (Markdown) | [`docs/API-SPEC.md`](docs/API-SPEC.md) |
| **Postman Collection** | [`postman/clinic.postman_collection.json`](postman/clinic.postman_collection.json) |
| Bukti hasil pengujian Postman | [`docs/HASIL-PENGUJIAN-POSTMAN.txt`](docs/HASIL-PENGUJIAN-POSTMAN.txt) |

## Instalasi

Prasyarat: **Node.js ≥ 20**, npm, dan **PostgreSQL** (atau **Docker Desktop**) yang sedang berjalan.

1. Pasang dependency:

   ```bash
   npm install
   ```

2. Siapkan PostgreSQL. **Cara termudah: Docker Compose** (buka Docker Desktop dulu). `docker-compose.yml` membaca `.env`, jadi user, password, nama database (`db_clinic`), dan port otomatis sama dengan yang dipakai aplikasi, dan container `clinic_postgres_container` dibuat sekaligus:

   ```bash
   docker compose up -d
   ```

   Hentikan dengan `docker compose down` (data tetap tersimpan di volume `clinic_data_volume`). Tambahkan `-v` untuk menghapus data.

   > **Port bentrok?** Jika muncul `port is already allocated`, ada program/container lain yang memakai port itu. Ubah `DB_PORT` (mis. `5433`) dan/atau `PORT` (mis. `3001`) di `.env`, lalu jalankan ulang. Compose dan aplikasi otomatis mengikuti nilai di `.env`.

   *Alternatif tanpa Docker:* pakai PostgreSQL yang sudah terpasang, lalu buat databasenya: `psql -U postgres -c "CREATE DATABASE db_clinic;"`.

   Tabel dibuat otomatis saat aplikasi pertama kali dijalankan pada mode `development` (lihat bagian *Migrasi database*).

3. (Opsional) Lihat isi database dengan **DBeaver** atau **pgAdmin**: *Database → New Database Connection → PostgreSQL*, isi Host `localhost`, Port `5432` (atau sesuai `DB_PORT`), Database `db_clinic`, serta Username dan Password sesuai `.env`. Setelah aplikasi berjalan, tabel muncul di *Databases → db_clinic → Schemas → public → Tables*.

## Konfigurasi environment

Sesuaikan file `.env` di root proyek:

```env
PORT=3000
NODE_ENV=development

# Konfigurasi database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=UTSclinic12
DB_DATABASE=db_clinic
```

| Variabel | Default | Keterangan |
|----------|---------|------------|
| `PORT` | `3000` | Port HTTP server |
| `NODE_ENV` | `development` | `development` / `staging` / `production` (divalidasi dengan Joi) |
| `DB_HOST` | `localhost` | Host PostgreSQL (wajib) |
| `DB_PORT` | `5432` | Port PostgreSQL |
| `DB_USERNAME` | — | User PostgreSQL (wajib) |
| `DB_PASSWORD` | — | Password PostgreSQL (wajib) |
| `DB_DATABASE` | — | Nama database, contoh: `db_clinic` (wajib) |

## Migrasi database

Aplikasi ini menggunakan **sinkronisasi skema TypeORM** (`synchronize: configService.get('NODE_ENV') === 'development'`): saat dijalankan pada mode `development`, kelima tabel (`departemen`, `dokter`, `pasien`, `janji_temu`, `rekam_medis`) beserta tipe `enum`, indeks, foreign key, dan constraint dibuat otomatis di database `DB_DATABASE` dari entity di `src/**/entities/`. Database-nya harus sudah ada (langkah 2 di atas); tabel tidak perlu dibuat manual.

Untuk produksi (`NODE_ENV=production`), `synchronize` otomatis bernilai `false` agar skema database aman dan tidak berubah otomatis.

## Menjalankan aplikasi

```bash
npm run start:dev      # development (auto-reload)
```
```bash
npm run build && npm run start:prod   # produksi
```

Setelah berjalan:
- API Base URL: `http://localhost:3000`
- Health Check: `GET http://localhost:3000/`

## Daftar Endpoint Utama

| Modul | Method & Endpoint | Deskripsi |
|-------|-------------------|-----------|
| **Health Check** | `GET /` | Cek status server API Clinic Management System |
| **Departemen** | `GET /departemen` | Daftar seluruh departemen (urut abjad) |
| | `POST /departemen` | Tambah departemen baru |
| | `GET /departemen/:id` | Detail departemen beserta daftar dokternya |
| | `PUT /departemen/:id` | Perbarui data departemen |
| | `DELETE /departemen/:id` | Hapus departemen (ditolak jika masih memiliki dokter) |
| **Dokter** | `GET /dokter` | Daftar seluruh dokter beserta departemennya |
| | `POST /dokter` | Tambah dokter baru (validasi STR, email unik, & format No. HP) |
| | `GET /dokter/:id` | Detail dokter beserta departemennya |
| | `GET /dokter/:id/janji-temu` | Daftar riwayat janji temu milik dokter tersebut |
| | `PUT /dokter/:id` | Perbarui data atau status aktif dokter |
| | `DELETE /dokter/:id` | Hapus dokter (ditolak jika sudah memiliki janji temu) |
| **Pasien** | `GET /pasien` | Daftar seluruh pasien |
| | `POST /pasien` | Registrasi pasien baru (`nomorRekamMedis` dibuat otomatis) |
| | `GET /pasien/:id` | Detail biodata pasien |
| | `GET /pasien/:id/janji-temu` | Daftar riwayat janji temu milik pasien tersebut |
| | `PUT /pasien/:id` | Perbarui biodata pasien |
| | `DELETE /pasien/:id` | Hapus pasien (ditolak jika sudah memiliki janji temu) |
| **Janji Temu** | `GET /janji-temu` | Daftar seluruh janji temu beserta pasien & dokter |
| | `POST /janji-temu` | Buat janji temu baru (`kodeJanjiTemu` dibuat otomatis) |
| | `GET /janji-temu/:id` | Detail janji temu beserta pasien, dokter, departemen, & rekam medis |
| | `GET /janji-temu/:id/rekam-medis` | Ambil rekam medis dari janji temu tertentu |
| | `PUT /janji-temu/:id` | Perbarui jadwal/dokter/keluhan atau ubah status janji temu |
| | `DELETE /janji-temu/:id` | Hapus janji temu (ditolak jika sudah memiliki rekam medis) |
| **Rekam Medis** | `GET /rekam-medis` | Daftar seluruh rekam medis beserta detail janji temu |
| | `POST /rekam-medis` | Catat rekam medis baru & otomatis ubah status janji temu ke `SELESAI` |
| | `GET /rekam-medis/:id` | Detail rekam medis |
| | `PUT /rekam-medis/:id` | Perbarui catatan kunjungan atau tindakan pada rekam medis |
| | `DELETE /rekam-medis/:id` | Hapus rekam medis |

## Pengujian

```bash
npm test               # unit test (Vitest)
```
```bash
npm run test:e2e       # e2e test (Vitest)
```

### Postman

1. Jalankan container database (`docker compose up -d`) dan aplikasi (`npm run start:dev`).
2. Impor collection Postman ke aplikasi Postman dengan variabel `baseUrl` `http://localhost:3000` (sesuaikan dengan `PORT` di `.env`).
3. Uji seluruh endpoint secara berurutan mulai dari pembuatan `departemen`, `dokter`, `pasien`, `janji-temu`, hingga `rekam-medis`, termasuk skenario input tidak valid (**400**), ID tidak ditemukan (**404**), dan konflik aturan bisnis/relasi (**409**).

## Struktur proyek

```
src/
├── app.module.ts            # ConfigModule (Joi) + TypeORM + registrasi semua modul & middleware
├── main.ts                  # ValidationPipe global + TransformResponseInterceptor global
├── common/
│   ├── transformers/        # desimal.transformer.ts (konversi decimal PostgreSQL ke number)
│   └── utils/               # buat-kode.ts (generator otomatis kode RM- dan JT-)
├── interceptors/
│   └── transform-response/  # Pembungkus response JSON standar { success, message, statusCode, data }
├── middleware/
│   └── log-middleware/      # Pencatat log HTTP (method, URL, status, durasi, IP, user-agent)
├── departemen/  dokter/  pasien/  janji-temu/  rekam-medis/
│   ├── entities/            # Entity TypeORM + relasi tabel
│   ├── dto/                 # CreateDto & UpdateDto + dekorator class-validator
│   ├── enums/               # Enum JenisKelamin & StatusJanjiTemu (beserta aturan transisi)
│   ├── *.controller.ts      # Routing HTTP (GET, POST, PUT, DELETE) + ParseUUIDPipe
│   ├── *.service.ts         # Logika bisnis, validasi keunikan/jadwal, transaksi database
│   └── *.module.ts
docker-compose.yml           # Konfigurasi container PostgreSQL 16 Alpine
.env                         # Konfigurasi variabel lingkungan
```

## Alur request hingga database

Contoh `POST /rekam-medis`:

1. **Request** masuk melewati `LogMiddlewareMiddleware` (waktu mulai dicatat) menuju `RekamMedisController.create()`.
2. `ValidationPipe` memvalidasi body terhadap `CreateRekamMedisDto` (`janjiTemuId` harus UUID v4 valid, `catatanKunjungan` wajib diisi, properti asing ditolak oleh `forbidNonWhitelisted`). Gagal → **400** sebelum menyentuh service.
3. `RekamMedisService.create()` memeriksa keberadaan janji temu (tidak ada → **404**), memastikan status janji temu saat ini adalah `DIKONFIRMASI` atau `SELESAI` (jika masih `TERJADWAL` atau `DIBATALKAN` → **409 Conflict**), serta memastikan belum ada rekam medis untuk janji temu tersebut (jika sudah ada → **409 Conflict**).
4. Service membuka **transaksi database** (`DataSource.transaction`): menyimpan entitas `RekamMedis` baru, dan jika status janji temu sebelumnya `DIKONFIRMASI`, otomatis memperbarui status `JanjiTemu` menjadi `SELESAI`.
5. Jika terjadi kegagalan di salah satu langkah dalam transaksi, seluruh perubahan di-**rollback** sehingga data rekam medis dan status janji temu tetap konsisten.
6. Sukses → data rekam medis dimuat ulang beserta relasi `janjiTemu`, `pasien`, dan `dokter`, lalu dibungkus oleh `TransformResponseInterceptor` menjadi `{ success: true, message: "Data berhasil dibuat", statusCode: 201, data: ... }`.

Error dari service berupa `NotFoundException` (404), `BadRequestException` (400), atau `ConflictException` (409).

## Keputusan desain

- **Relasi One-to-One `janji_temu` ↔ `rekam_medis`**: Satu kunjungan janji temu menghasilkan maksimal satu catatan rekam medis (`@OneToOne` dengan `@JoinColumn` pada `janji_temu_id`).
- **Transaksi atomik saat membuat Rekam Medis**: Penyimpanan rekam medis dan perubahan status janji temu menjadi `SELESAI` dibungkus dalam `DataSource.transaction` agar tidak pernah terjadi kondisi rekam medis tercatat tetapi status janji temu masih menggantung.
- **Pencegahan bentrok jadwal dokter & pasien**: Sebelum menyimpan atau mengubah jadwal janji temu, service memvalidasi bahwa baik dokter maupun pasien tidak memiliki janji temu aktif (`TERJADWAL` / `DIKONFIRMASI`) pada waktu yang sama, didukung indeks komposit `IDX_janji_temu_dokter_jadwal`.
- **State machine status janji temu**: Perpindahan status dibatasi secara ketat melalui `TRANSISI_STATUS`: `TERJADWAL → DIKONFIRMASI / DIBATALKAN` dan `DIKONFIRMASI → SELESAI / DIBATALKAN`. Status akhir (`SELESAI`, `DIBATALKAN`) terkunci dan tidak dapat diubah lagi; pembatalan wajib menyertakan `alasanPembatalan`.
- **Pembuatan kode unik otomatis**: `nomorRekamMedis` pasien (`RM-YYYYMMDD-XXXX`) dan `kodeJanjiTemu` (`JT-YYYYMMDD-XXXXX`) di-generate otomatis oleh sistem di sisi service sehingga pengguna tidak perlu menginput manual.
- **Proteksi integritas data (`ON DELETE RESTRICT` & pengecekan relasi)**: Departemen yang masih memiliki dokter, dokter/pasien yang sudah memiliki riwayat janji temu, serta janji temu yang sudah memiliki rekam medis tidak dapat dihapus sembarangan (mengembalikan **409 Conflict**). Untuk dokter yang sudah tidak praktik, disediakan atribut `statusAktif = false`.
- **Penanganan zona waktu & tipe tanggal**: Jadwal janji temu menggunakan `timestamptz` (menyimpan waktu presisi beserta zona waktu), sedangkan `tanggal_lahir` pasien disimpan sebagai `date` di PostgreSQL dan direpresentasikan sebagai `string` (`YYYY-MM-DD`) di TypeScript agar tidak bergeser akibat konversi zona waktu UTC.
