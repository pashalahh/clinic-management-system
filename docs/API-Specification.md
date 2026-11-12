# Clinic Management System — API Specification

Dokumen ini adalah spesifikasi API untuk **Clinic Management System**: backend administrasi klinik yang dibangun dengan **NestJS**, **TypeORM**, dan **PostgreSQL**. Isinya sama persis dengan kode program (endpoint, method, validasi, status code, dan pesan error), sehingga bisa dipakai sebagai acuan oleh backend, frontend, maupun penguji.

> Seluruh data pasien dan dokter pada contoh di dokumen ini adalah **data fiktif**. Sistem ini sengaja tidak memuat diagnosis klinis, resep elektronik, maupun integrasi layanan medis.

File pendukung: `openapi.json` (format OpenAPI 3.0, bisa dibuka di Swagger Editor), `ERD.md`, `Postman-Collection.md`, dan `README.md`.

---

## 1. Gambaran Project

### Nama Project

**Clinic Management System API**

### Teknologi

- Node.js + NestJS (Module, Controller, Service)
- TypeORM (ORM) + PostgreSQL
- REST API dengan format JSON
- `class-validator` + `class-transformer` (validasi DTO)
- `@nestjs/config` + `Joi` (konfigurasi environment)
- Interceptor (pembungkus response seragam) dan Middleware (log request)

### Base URL

```text
http://localhost:3000
```

Server tidak memakai prefix global, jadi path endpoint diawali langsung dengan nama resource, misalnya `http://localhost:3000/pasien`.

### Entitas Utama

| Entitas | Tabel | Keterangan |
|---|---|---|
| Departemen | `departemen` | Bagian/poli layanan klinik |
| Dokter | `dokter` | Dokter, selalu milik satu departemen |
| Pasien | `pasien` | Data pasien fiktif |
| Janji Temu | `janji_temu` | Jadwal pasien bertemu dokter, punya status |
| Rekam Medis | `rekam_medis` | Catatan kunjungan, maksimal satu per janji temu |

### Relasi

```text
Departemen 1 ──── 0..N Dokter
Pasien     1 ──── 0..N Janji Temu
Dokter     1 ──── 0..N Janji Temu
Janji Temu 1 ──── 0..1 Rekam Medis
```

---

## 2. Konsep API

Semua request dan response memakai JSON. Untuk request yang punya body (`POST`, `PATCH`), kirim header:

```http
Content-Type: application/json
```

API ini **tidak memakai autentikasi** (tidak ada login/token) karena bukan bagian dari cakupan tugas.

### Success Response

Setiap response sukses dibungkus oleh interceptor dengan bentuk yang sama:

```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "statusCode": 200,
  "data": {}
}
```

| Field | Keterangan |
|---|---|
| `success` | Selalu `true` untuk response sukses |
| `message` | Pesan otomatis sesuai method: GET = *Data berhasil diambil*, POST = *Data berhasil dibuat*, PATCH = *Data berhasil diperbarui*, DELETE = *Data berhasil dihapus* |
| `statusCode` | Kode HTTP yang sama dengan status response |
| `data` | Isi hasil (objek, array, atau `null`) |

### Error Response

Response error memakai format bawaan NestJS (tidak dibungkus interceptor):

```json
{
  "message": "Pasien 11111111-1111-4111-8111-111111111111 tidak ditemukan",
  "error": "Not Found",
  "statusCode": 404
}
```

Untuk error validasi, `message` berupa **array** karena bisa ada beberapa kesalahan sekaligus:

```json
{
  "message": [
    "NIK harus berupa 16 digit angka",
    "Jenis kelamin harus LAKI_LAKI atau PEREMPUAN"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## 3. HTTP Status Code

| Status Code | Keterangan | Kapan terjadi di API ini |
|---|---|---|
| `200` | Request berhasil | GET, PATCH, DELETE yang berhasil |
| `201` | Data berhasil dibuat | POST yang berhasil |
| `400` | Request tidak valid | Field kosong/salah format, ID bukan UUID, field tak dikenal, atau aturan bisnis sederhana dilanggar (jadwal masa lalu, dokter nonaktif, dll.) |
| `404` | Data tidak ditemukan | ID tidak ada di database, atau data yang dirujuk (departemen/pasien/dokter/janji temu) tidak ada |
| `409` | Conflict | Data unik sudah ada (NIK, STR, email, nama departemen), jadwal bentrok, perpindahan status tidak sah, atau data masih dipakai relasi lain |
| `500` | Internal server error | Kesalahan tak terduga di server |

Catatan: validasi bentuk data (DTO) menghasilkan `400 Bad Request`, sesuai perilaku bawaan `ValidationPipe` NestJS.

---

## 4. Aturan Validasi Global

`main.ts` mengaktifkan `ValidationPipe` global dengan opsi berikut:

| Opsi | Arti |
|---|---|
| `whitelist: true` | Field yang tidak ada di DTO dibuang |
| `forbidNonWhitelisted: true` | Field yang tidak dikenal **ditolak** dengan error 400 (`property xxx should not exist`) |
| `transform: true` | Data request diubah menjadi instance DTO |
| `enableImplicitConversion: true` | Tipe data dikonversi otomatis berdasarkan tipe di DTO |

Semua parameter `:id` pada URL divalidasi dengan `ParseUUIDPipe`. ID yang bukan UUID langsung ditolak dengan `400 Validation failed (uuid is expected)` sebelum menyentuh database.

---

# 5. API Sistem

Pengecekan server.

## 5.1 Cek server hidup

Mengembalikan nama, versi, dan status aplikasi. Dipakai untuk memastikan server sudah berjalan.

### Endpoint

```http
GET /
```

### Response

**HTTP 200 OK**

```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "statusCode": 200,
  "data": {
    "nama": "API Clinic Management System",
    "versi": "1.0.0",
    "status": "berjalan"
  }
}
```

---

# 6. API Departemen

Bagian / poli layanan klinik.

## 6.1 Tambah departemen

Membuat departemen baru. Nama departemen tidak boleh sama dengan yang sudah ada.

### Endpoint

```http
POST /departemen
```

### Request Body

```json
{
  "namaDepartemen": "Poli Umum",
  "deskripsi": "Layanan pemeriksaan kesehatan umum"
}
```

| Field | Type | Required | Validasi |
|---|---|---|---|
| `namaDepartemen` | string | Yes | Wajib diisi, maksimal 50 karakter. Harus unik |
| `deskripsi` | string | No | Opsional, berupa teks |

### Response

**HTTP 201 Created**

```json
{
  "success": true,
  "message": "Data berhasil dibuat",
  "statusCode": 201,
  "data": {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "namaDepartemen": "Poli Umum",
    "deskripsi": "Layanan pemeriksaan kesehatan umum",
    "dibuatPada": "2026-11-12T03:15:30.123Z",
    "diperbaruiPada": "2026-11-12T03:15:30.123Z",
    "dihapusPada": null
  }
}
```

### Kemungkinan Error

| Status | Penyebab | Contoh `message` |
|---|---|---|
| `400` | Nama departemen kosong / lebih dari 50 karakter / ada field tak dikenal | Nama departemen harus diisi |
| `409` | Nama departemen sudah dipakai | Departemen dengan nama "Poli Umum" sudah ada |

---

## 6.2 Lihat semua departemen

Menampilkan seluruh departemen, diurutkan A-Z berdasarkan nama.

### Endpoint

```http
GET /departemen
```

### Response

**HTTP 200 OK**

```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "statusCode": 200,
  "data": [
    {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "namaDepartemen": "Poli Umum",
      "deskripsi": "Layanan pemeriksaan kesehatan umum",
      "dibuatPada": "2026-11-12T03:15:30.123Z",
      "diperbaruiPada": "2026-11-12T03:15:30.123Z",
      "dihapusPada": null
    }
  ]
}
```

---

## 6.3 Lihat satu departemen beserta dokternya

Menampilkan satu departemen lengkap dengan daftar dokter yang bertugas di dalamnya.

### Endpoint

```http
GET /departemen/:id
```

### Path Parameter

| Parameter | Type | Required | Keterangan |
|---|---|---|---|
| `id` | string (UUID) | Yes | ID departemen (UUID) |

### Response

**HTTP 200 OK**

```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "statusCode": 200,
  "data": {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "namaDepartemen": "Poli Umum",
    "deskripsi": "Layanan pemeriksaan kesehatan umum",
    "dibuatPada": "2026-11-12T03:15:30.123Z",
    "diperbaruiPada": "2026-11-12T03:15:30.123Z",
    "dihapusPada": null,
    "dokter": [
      {
        "id": "9b2d1c4e-3f6a-4d8b-a1c5-2e7f8a9b0c3d",
        "departemenId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "namaLengkap": "dr. Andini Pratama",
        "nomorStr": "STR-3301-2024-001234",
        "spesialisasi": "Dokter Umum",
        "email": "andini.pratama@klinik.example",
        "nomorTelepon": "081234567890",
        "statusAktif": true,
        "dibuatPada": "2026-11-12T03:15:30.123Z",
        "diperbaruiPada": "2026-11-12T03:15:30.123Z",
        "dihapusPada": null
      }
    ]
  }
}
```

### Kemungkinan Error

| Status | Penyebab | Contoh `message` |
|---|---|---|
| `400` | ID pada URL bukan UUID yang valid | Validation failed (uuid is expected) |
| `404` | Departemen dengan ID tersebut tidak ditemukan | Departemen 11111111-1111-4111-8111-111111111111 tidak ditemukan |

---

## 6.4 Ubah departemen

Mengubah sebagian data departemen. Kirim hanya field yang ingin diubah.

### Endpoint

```http
PATCH /departemen/:id
```

### Path Parameter

| Parameter | Type | Required | Keterangan |
|---|---|---|---|
| `id` | string (UUID) | Yes | ID departemen (UUID) |

### Request Body

```json
{
  "deskripsi": "Layanan pemeriksaan umum dan konsultasi"
}
```

| Field | Type | Required | Validasi |
|---|---|---|---|
| `namaDepartemen` | string | No | Wajib diisi, maksimal 50 karakter. Harus unik |
| `deskripsi` | string | No | Opsional, berupa teks |

> `PATCH` dipakai karena hanya field yang ingin diubah yang perlu dikirim. Field yang tidak dikirim tidak akan berubah.

### Response

**HTTP 200 OK**

```json
{
  "success": true,
  "message": "Data berhasil diperbarui",
  "statusCode": 200,
  "data": {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "namaDepartemen": "Poli Umum",
    "deskripsi": "Layanan pemeriksaan umum dan konsultasi",
    "dibuatPada": "2026-11-12T03:15:30.123Z",
    "diperbaruiPada": "2026-11-12T03:15:30.123Z",
    "dihapusPada": null,
    "dokter": [
      {
        "id": "9b2d1c4e-3f6a-4d8b-a1c5-2e7f8a9b0c3d",
        "departemenId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "namaLengkap": "dr. Andini Pratama",
        "nomorStr": "STR-3301-2024-001234",
        "spesialisasi": "Dokter Umum",
        "email": "andini.pratama@klinik.example",
        "nomorTelepon": "081234567890",
        "statusAktif": true,
        "dibuatPada": "2026-11-12T03:15:30.123Z",
        "diperbaruiPada": "2026-11-12T03:15:30.123Z",
        "dihapusPada": null
      }
    ]
  }
}
```

### Kemungkinan Error

| Status | Penyebab | Contoh `message` |
|---|---|---|
| `400` | ID pada URL bukan UUID yang valid | Validation failed (uuid is expected) |
| `400` | Data tidak valid atau ada field tak dikenal | Nama departemen maksimal 50 karakter |
| `404` | Departemen dengan ID tersebut tidak ditemukan | Departemen 11111111-1111-4111-8111-111111111111 tidak ditemukan |
| `409` | Nama baru sudah dipakai departemen lain | Departemen dengan nama "Poli Gigi" sudah ada |

---

## 6.5 Hapus departemen

Menghapus departemen. Ditolak jika departemen masih memiliki dokter.

### Endpoint

```http
DELETE /departemen/:id
```

### Path Parameter

| Parameter | Type | Required | Keterangan |
|---|---|---|---|
| `id` | string (UUID) | Yes | ID departemen (UUID) |

### Response

**HTTP 200 OK**

```json
{
  "success": true,
  "message": "Data berhasil dihapus",
  "statusCode": 200,
  "data": {
    "message": "Departemen 7c9e6679-7425-40de-944b-e07fc1f90ae7 berhasil dihapus",
    "idTerhapus": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
  }
}
```

### Kemungkinan Error

| Status | Penyebab | Contoh `message` |
|---|---|---|
| `400` | ID pada URL bukan UUID yang valid | Validation failed (uuid is expected) |
| `404` | Departemen dengan ID tersebut tidak ditemukan | Departemen 11111111-1111-4111-8111-111111111111 tidak ditemukan |
| `409` | Departemen masih memiliki dokter | Departemen tidak dapat dihapus karena masih memiliki 2 dokter |

---

# 7. API Dokter

Data dokter (selalu milik satu departemen).

## 7.1 Tambah dokter

Membuat dokter baru yang tergabung dalam satu departemen. Nomor STR dan email harus unik.

### Endpoint

```http
POST /dokter
```

### Request Body

```json
{
  "departemenId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "namaLengkap": "dr. Andini Pratama",
  "nomorStr": "STR-3301-2024-001234",
  "spesialisasi": "Dokter Umum",
  "email": "andini.pratama@klinik.example",
  "nomorTelepon": "081234567890",
  "statusAktif": true
}
```

| Field | Type | Required | Validasi |
|---|---|---|---|
| `departemenId` | string (uuid) | Yes | UUID v4 departemen yang sudah ada |
| `namaLengkap` | string | Yes | Wajib diisi, maksimal 100 karakter |
| `nomorStr` | string | Yes | Nomor STR (fiktif), maksimal 30 karakter. Harus unik |
| `spesialisasi` | string | Yes | Wajib diisi, maksimal 100 karakter |
| `email` | string (email) | Yes | Format email valid, maksimal 100 karakter. Harus unik |
| `nomorTelepon` | string | Yes | Nomor seluler Indonesia |
| `statusAktif` | boolean | No | Opsional. Jika tidak dikirim, otomatis true |

### Response

**HTTP 201 Created**

```json
{
  "success": true,
  "message": "Data berhasil dibuat",
  "statusCode": 201,
  "data": {
    "id": "9b2d1c4e-3f6a-4d8b-a1c5-2e7f8a9b0c3d",
    "departemenId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "namaLengkap": "dr. Andini Pratama",
    "nomorStr": "STR-3301-2024-001234",
    "spesialisasi": "Dokter Umum",
    "email": "andini.pratama@klinik.example",
    "nomorTelepon": "081234567890",
    "statusAktif": true,
    "dibuatPada": "2026-11-12T03:15:30.123Z",
    "diperbaruiPada": "2026-11-12T03:15:30.123Z",
    "dihapusPada": null,
    "departemen": {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "namaDepartemen": "Poli Umum",
      "deskripsi": "Layanan pemeriksaan kesehatan umum",
      "dibuatPada": "2026-11-12T03:15:30.123Z",
      "diperbaruiPada": "2026-11-12T03:15:30.123Z",
      "dihapusPada": null
    }
  }
}
```

### Kemungkinan Error

| Status | Penyebab | Contoh `message` |
|---|---|---|
| `400` | Data tidak valid (email salah format, nomor telepon salah, dst.) | Format email tidak valid |
| `404` | Departemen dengan ID tersebut tidak ditemukan | Departemen 7c9e6679-7425-40de-944b-e07fc1f90ae7 tidak ditemukan |
| `409` | Nomor STR atau email sudah terdaftar | Nomor STR STR-3301-2024-001234 sudah terdaftar |

---

## 7.2 Lihat semua dokter

Menampilkan seluruh dokter beserta departemennya, diurutkan A-Z berdasarkan nama.

### Endpoint

```http
GET /dokter
```

### Response

**HTTP 200 OK**

```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "statusCode": 200,
  "data": [
    {
      "id": "9b2d1c4e-3f6a-4d8b-a1c5-2e7f8a9b0c3d",
      "departemenId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "namaLengkap": "dr. Andini Pratama",
      "nomorStr": "STR-3301-2024-001234",
      "spesialisasi": "Dokter Umum",
      "email": "andini.pratama@klinik.example",
      "nomorTelepon": "081234567890",
      "statusAktif": true,
      "dibuatPada": "2026-11-12T03:15:30.123Z",
      "diperbaruiPada": "2026-11-12T03:15:30.123Z",
      "dihapusPada": null,
      "departemen": {
        "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "namaDepartemen": "Poli Umum",
        "deskripsi": "Layanan pemeriksaan kesehatan umum",
        "dibuatPada": "2026-11-12T03:15:30.123Z",
        "diperbaruiPada": "2026-11-12T03:15:30.123Z",
        "dihapusPada": null
      }
    }
  ]
}
```

---

## 7.3 Lihat satu dokter

Menampilkan satu dokter beserta departemennya.

### Endpoint

```http
GET /dokter/:id
```

### Path Parameter

| Parameter | Type | Required | Keterangan |
|---|---|---|---|
| `id` | string (UUID) | Yes | ID dokter (UUID) |

### Response

**HTTP 200 OK**

```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "statusCode": 200,
  "data": {
    "id": "9b2d1c4e-3f6a-4d8b-a1c5-2e7f8a9b0c3d",
    "departemenId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "namaLengkap": "dr. Andini Pratama",
    "nomorStr": "STR-3301-2024-001234",
    "spesialisasi": "Dokter Umum",
    "email": "andini.pratama@klinik.example",
    "nomorTelepon": "081234567890",
    "statusAktif": true,
    "dibuatPada": "2026-11-12T03:15:30.123Z",
    "diperbaruiPada": "2026-11-12T03:15:30.123Z",
    "dihapusPada": null,
    "departemen": {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "namaDepartemen": "Poli Umum",
      "deskripsi": "Layanan pemeriksaan kesehatan umum",
      "dibuatPada": "2026-11-12T03:15:30.123Z",
      "diperbaruiPada": "2026-11-12T03:15:30.123Z",
      "dihapusPada": null
    }
  }
}
```

### Kemungkinan Error

| Status | Penyebab | Contoh `message` |
|---|---|---|
| `400` | ID pada URL bukan UUID yang valid | Validation failed (uuid is expected) |
| `404` | Dokter dengan ID tersebut tidak ditemukan | Dokter 11111111-1111-4111-8111-111111111111 tidak ditemukan |

---

## 7.4 Lihat janji temu milik dokter

Menampilkan semua janji temu yang ditangani seorang dokter (terbaru di atas), lengkap dengan data pasien.

### Endpoint

```http
GET /dokter/:id/janji-temu
```

### Path Parameter

| Parameter | Type | Required | Keterangan |
|---|---|---|---|
| `id` | string (UUID) | Yes | ID dokter (UUID) |

### Response

**HTTP 200 OK**

```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "statusCode": 200,
  "data": [
    {
      "id": "b1a7e5d2-6c3f-4a98-8e14-5d0c9f2a7b61",
      "kodeJanjiTemu": "JT-20261112-K7Q2X",
      "pasienId": "3f2b8c1e-5d4a-4b7e-9c21-8a6f0d1e2b34",
      "dokterId": "9b2d1c4e-3f6a-4d8b-a1c5-2e7f8a9b0c3d",
      "jadwal": "2026-11-20T02:00:00.000Z",
      "keluhan": "Demam dan batuk sejak tiga hari",
      "status": "TERJADWAL",
      "alasanPembatalan": null,
      "dibuatPada": "2026-11-12T03:15:30.123Z",
      "diperbaruiPada": "2026-11-12T03:15:30.123Z",
      "pasien": {
        "id": "3f2b8c1e-5d4a-4b7e-9c21-8a6f0d1e2b34",
        "nomorRekamMedis": "RM-20261112-4821",
        "namaLengkap": "Budi Santoso",
        "nik": "3301010101900001",
        "jenisKelamin": "LAKI_LAKI",
        "tanggalLahir": "1990-01-01",
        "alamat": "Jl. Merdeka No. 10, Kota Contoh",
        "nomorTelepon": "081298765432",
        "dibuatPada": "2026-11-12T03:15:30.123Z",
        "diperbaruiPada": "2026-11-12T03:15:30.123Z"
      }
    }
  ]
}
```

### Kemungkinan Error

| Status | Penyebab | Contoh `message` |
|---|---|---|
| `400` | ID pada URL bukan UUID yang valid | Validation failed (uuid is expected) |
| `404` | Dokter dengan ID tersebut tidak ditemukan | Dokter 11111111-1111-4111-8111-111111111111 tidak ditemukan |

---

## 7.5 Ubah dokter

Mengubah sebagian data dokter. Untuk menonaktifkan dokter, kirim statusAktif = false.

### Endpoint

```http
PATCH /dokter/:id
```

### Path Parameter

| Parameter | Type | Required | Keterangan |
|---|---|---|---|
| `id` | string (UUID) | Yes | ID dokter (UUID) |

### Request Body

```json
{
  "spesialisasi": "Penyakit Dalam"
}
```

| Field | Type | Required | Validasi |
|---|---|---|---|
| `departemenId` | string (uuid) | No | UUID v4 departemen yang sudah ada |
| `namaLengkap` | string | No | Wajib diisi, maksimal 100 karakter |
| `nomorStr` | string | No | Nomor STR (fiktif), maksimal 30 karakter. Harus unik |
| `spesialisasi` | string | No | Wajib diisi, maksimal 100 karakter |
| `email` | string (email) | No | Format email valid, maksimal 100 karakter. Harus unik |
| `nomorTelepon` | string | No | Nomor seluler Indonesia |
| `statusAktif` | boolean | No | Opsional. Jika tidak dikirim, otomatis true |

> `PATCH` dipakai karena hanya field yang ingin diubah yang perlu dikirim. Field yang tidak dikirim tidak akan berubah.

### Response

**HTTP 200 OK**

```json
{
  "success": true,
  "message": "Data berhasil diperbarui",
  "statusCode": 200,
  "data": {
    "id": "9b2d1c4e-3f6a-4d8b-a1c5-2e7f8a9b0c3d",
    "departemenId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "namaLengkap": "dr. Andini Pratama",
    "nomorStr": "STR-3301-2024-001234",
    "spesialisasi": "Penyakit Dalam",
    "email": "andini.pratama@klinik.example",
    "nomorTelepon": "081234567890",
    "statusAktif": true,
    "dibuatPada": "2026-11-12T03:15:30.123Z",
    "diperbaruiPada": "2026-11-12T03:15:30.123Z",
    "dihapusPada": null,
    "departemen": {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "namaDepartemen": "Poli Umum",
      "deskripsi": "Layanan pemeriksaan kesehatan umum",
      "dibuatPada": "2026-11-12T03:15:30.123Z",
      "diperbaruiPada": "2026-11-12T03:15:30.123Z",
      "dihapusPada": null
    }
  }
}
```

### Kemungkinan Error

| Status | Penyebab | Contoh `message` |
|---|---|---|
| `400` | ID pada URL bukan UUID yang valid | Validation failed (uuid is expected) |
| `400` | Data tidak valid atau ada field tak dikenal | Format email tidak valid |
| `404` | Dokter dengan ID tersebut tidak ditemukan | Dokter 11111111-1111-4111-8111-111111111111 tidak ditemukan |
| `409` | Nomor STR atau email dipakai dokter lain | Email andini.pratama@klinik.example sudah terdaftar |

---

## 7.6 Hapus dokter

Menghapus dokter. Ditolak jika dokter masih memiliki janji temu (gunakan statusAktif = false untuk menonaktifkan).

### Endpoint

```http
DELETE /dokter/:id
```

### Path Parameter

| Parameter | Type | Required | Keterangan |
|---|---|---|---|
| `id` | string (UUID) | Yes | ID dokter (UUID) |

### Response

**HTTP 200 OK**

```json
{
  "success": true,
  "message": "Data berhasil dihapus",
  "statusCode": 200,
  "data": {
    "message": "Dokter 9b2d1c4e-3f6a-4d8b-a1c5-2e7f8a9b0c3d berhasil dihapus",
    "idTerhapus": "9b2d1c4e-3f6a-4d8b-a1c5-2e7f8a9b0c3d"
  }
}
```

### Kemungkinan Error

| Status | Penyebab | Contoh `message` |
|---|---|---|
| `400` | ID pada URL bukan UUID yang valid | Validation failed (uuid is expected) |
| `404` | Dokter dengan ID tersebut tidak ditemukan | Dokter 11111111-1111-4111-8111-111111111111 tidak ditemukan |
| `409` | Dokter masih memiliki janji temu | Dokter tidak dapat dihapus karena masih memiliki 3 janji temu. Nonaktifkan dokter dengan statusAktif = false |

---

# 8. API Pasien

Data pasien fiktif.

## 8.1 Tambah pasien

Membuat pasien baru. Nomor rekam medis (RM-YYYYMMDD-XXXX) dibuat otomatis oleh sistem.

### Endpoint

```http
POST /pasien
```

### Request Body

```json
{
  "namaLengkap": "Budi Santoso",
  "nik": "3301010101900001",
  "jenisKelamin": "LAKI_LAKI",
  "tanggalLahir": "1990-01-01",
  "alamat": "Jl. Merdeka No. 10, Kota Contoh",
  "nomorTelepon": "081298765432"
}
```

| Field | Type | Required | Validasi |
|---|---|---|---|
| `namaLengkap` | string | Yes | Wajib diisi, berupa teks, maksimal 150 karakter |
| `nik` | string | Yes | Wajib 16 digit angka (NIK fiktif). Harus unik |
| `jenisKelamin` | string | Yes | Salah satu dari LAKI_LAKI atau PEREMPUAN |
| `tanggalLahir` | string (date) | Yes | Format tanggal YYYY-MM-DD. Tidak boleh di masa depan |
| `alamat` | string | Yes | Wajib diisi, berupa teks |
| `nomorTelepon` | string | Yes | Nomor seluler Indonesia, contoh 081298765432 atau +6281298765432 |

### Response

**HTTP 201 Created**

```json
{
  "success": true,
  "message": "Data berhasil dibuat",
  "statusCode": 201,
  "data": {
    "id": "3f2b8c1e-5d4a-4b7e-9c21-8a6f0d1e2b34",
    "nomorRekamMedis": "RM-20261112-4821",
    "namaLengkap": "Budi Santoso",
    "nik": "3301010101900001",
    "jenisKelamin": "LAKI_LAKI",
    "tanggalLahir": "1990-01-01",
    "alamat": "Jl. Merdeka No. 10, Kota Contoh",
    "nomorTelepon": "081298765432",
    "dibuatPada": "2026-11-12T03:15:30.123Z",
    "diperbaruiPada": "2026-11-12T03:15:30.123Z"
  }
}
```

### Kemungkinan Error

| Status | Penyebab | Contoh `message` |
|---|---|---|
| `400` | Data yang dikirim tidak valid (field kosong, format salah, atau ada field yang tidak dikenal) | NIK harus berupa 16 digit angka |
| `400` | Tanggal lahir di masa depan | Tanggal lahir tidak boleh di masa depan |
| `409` | NIK sudah terdaftar | NIK 3301010101900001 sudah terdaftar |

---

## 8.2 Lihat semua pasien

Menampilkan seluruh pasien, yang terbaru didaftarkan berada di atas.

### Endpoint

```http
GET /pasien
```

### Response

**HTTP 200 OK**

```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "statusCode": 200,
  "data": [
    {
      "id": "3f2b8c1e-5d4a-4b7e-9c21-8a6f0d1e2b34",
      "nomorRekamMedis": "RM-20261112-4821",
      "namaLengkap": "Budi Santoso",
      "nik": "3301010101900001",
      "jenisKelamin": "LAKI_LAKI",
      "tanggalLahir": "1990-01-01",
      "alamat": "Jl. Merdeka No. 10, Kota Contoh",
      "nomorTelepon": "081298765432",
      "dibuatPada": "2026-11-12T03:15:30.123Z",
      "diperbaruiPada": "2026-11-12T03:15:30.123Z"
    }
  ]
}
```

---

## 8.3 Lihat satu pasien

Menampilkan data satu pasien.

### Endpoint

```http
GET /pasien/:id
```

### Path Parameter

| Parameter | Type | Required | Keterangan |
|---|---|---|---|
| `id` | string (UUID) | Yes | ID pasien (UUID) |

### Response

**HTTP 200 OK**

```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "statusCode": 200,
  "data": {
    "id": "3f2b8c1e-5d4a-4b7e-9c21-8a6f0d1e2b34",
    "nomorRekamMedis": "RM-20261112-4821",
    "namaLengkap": "Budi Santoso",
    "nik": "3301010101900001",
    "jenisKelamin": "LAKI_LAKI",
    "tanggalLahir": "1990-01-01",
    "alamat": "Jl. Merdeka No. 10, Kota Contoh",
    "nomorTelepon": "081298765432",
    "dibuatPada": "2026-11-12T03:15:30.123Z",
    "diperbaruiPada": "2026-11-12T03:15:30.123Z"
  }
}
```

### Kemungkinan Error

| Status | Penyebab | Contoh `message` |
|---|---|---|
| `400` | ID pada URL bukan UUID yang valid | Validation failed (uuid is expected) |
| `404` | Pasien dengan ID tersebut tidak ditemukan | Pasien 11111111-1111-4111-8111-111111111111 tidak ditemukan |

---

## 8.4 Lihat janji temu milik pasien

Menampilkan semua janji temu seorang pasien (terbaru di atas), lengkap dengan data dokter.

### Endpoint

```http
GET /pasien/:id/janji-temu
```

### Path Parameter

| Parameter | Type | Required | Keterangan |
|---|---|---|---|
| `id` | string (UUID) | Yes | ID pasien (UUID) |

### Response

**HTTP 200 OK**

```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "statusCode": 200,
  "data": [
    {
      "id": "b1a7e5d2-6c3f-4a98-8e14-5d0c9f2a7b61",
      "kodeJanjiTemu": "JT-20261112-K7Q2X",
      "pasienId": "3f2b8c1e-5d4a-4b7e-9c21-8a6f0d1e2b34",
      "dokterId": "9b2d1c4e-3f6a-4d8b-a1c5-2e7f8a9b0c3d",
      "jadwal": "2026-11-20T02:00:00.000Z",
      "keluhan": "Demam dan batuk sejak tiga hari",
      "status": "TERJADWAL",
      "alasanPembatalan": null,
      "dibuatPada": "2026-11-12T03:15:30.123Z",
      "diperbaruiPada": "2026-11-12T03:15:30.123Z",
      "dokter": {
        "id": "9b2d1c4e-3f6a-4d8b-a1c5-2e7f8a9b0c3d",
        "departemenId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "namaLengkap": "dr. Andini Pratama",
        "nomorStr": "STR-3301-2024-001234",
        "spesialisasi": "Dokter Umum",
        "email": "andini.pratama@klinik.example",
        "nomorTelepon": "081234567890",
        "statusAktif": true,
        "dibuatPada": "2026-11-12T03:15:30.123Z",
        "diperbaruiPada": "2026-11-12T03:15:30.123Z",
        "dihapusPada": null
      }
    }
  ]
}
```

### Kemungkinan Error

| Status | Penyebab | Contoh `message` |
|---|---|---|
| `400` | ID pada URL bukan UUID yang valid | Validation failed (uuid is expected) |
| `404` | Pasien dengan ID tersebut tidak ditemukan | Pasien 11111111-1111-4111-8111-111111111111 tidak ditemukan |

---

## 8.5 Ubah pasien

Mengubah sebagian data pasien. Kirim hanya field yang ingin diubah.

### Endpoint

```http
PATCH /pasien/:id
```

### Path Parameter

| Parameter | Type | Required | Keterangan |
|---|---|---|---|
| `id` | string (UUID) | Yes | ID pasien (UUID) |

### Request Body

```json
{
  "alamat": "Jl. Melati No. 5, Kota Contoh"
}
```

| Field | Type | Required | Validasi |
|---|---|---|---|
| `namaLengkap` | string | No | Wajib diisi, berupa teks, maksimal 150 karakter |
| `nik` | string | No | Wajib 16 digit angka (NIK fiktif). Harus unik |
| `jenisKelamin` | string | No | Salah satu dari LAKI_LAKI atau PEREMPUAN |
| `tanggalLahir` | string (date) | No | Format tanggal YYYY-MM-DD. Tidak boleh di masa depan |
| `alamat` | string | No | Wajib diisi, berupa teks |
| `nomorTelepon` | string | No | Nomor seluler Indonesia, contoh 081298765432 atau +6281298765432 |

> `PATCH` dipakai karena hanya field yang ingin diubah yang perlu dikirim. Field yang tidak dikirim tidak akan berubah.

### Response

**HTTP 200 OK**

```json
{
  "success": true,
  "message": "Data berhasil diperbarui",
  "statusCode": 200,
  "data": {
    "id": "3f2b8c1e-5d4a-4b7e-9c21-8a6f0d1e2b34",
    "nomorRekamMedis": "RM-20261112-4821",
    "namaLengkap": "Budi Santoso",
    "nik": "3301010101900001",
    "jenisKelamin": "LAKI_LAKI",
    "tanggalLahir": "1990-01-01",
    "alamat": "Jl. Melati No. 5, Kota Contoh",
    "nomorTelepon": "081298765432",
    "dibuatPada": "2026-11-12T03:15:30.123Z",
    "diperbaruiPada": "2026-11-12T03:15:30.123Z"
  }
}
```

### Kemungkinan Error

| Status | Penyebab | Contoh `message` |
|---|---|---|
| `400` | ID pada URL bukan UUID yang valid | Validation failed (uuid is expected) |
| `400` | Data yang dikirim tidak valid (field kosong, format salah, atau ada field yang tidak dikenal) | NIK harus berupa 16 digit angka |
| `404` | Pasien dengan ID tersebut tidak ditemukan | Pasien 11111111-1111-4111-8111-111111111111 tidak ditemukan |
| `409` | NIK baru sudah dipakai pasien lain | NIK 3301010101900002 sudah terdaftar |

---

## 8.6 Hapus pasien

Menghapus pasien. Ditolak jika pasien masih memiliki janji temu.

### Endpoint

```http
DELETE /pasien/:id
```

### Path Parameter

| Parameter | Type | Required | Keterangan |
|---|---|---|---|
| `id` | string (UUID) | Yes | ID pasien (UUID) |

### Response

**HTTP 200 OK**

```json
{
  "success": true,
  "message": "Data berhasil dihapus",
  "statusCode": 200,
  "data": {
    "message": "Pasien 3f2b8c1e-5d4a-4b7e-9c21-8a6f0d1e2b34 berhasil dihapus",
    "idTerhapus": "3f2b8c1e-5d4a-4b7e-9c21-8a6f0d1e2b34"
  }
}
```

### Kemungkinan Error

| Status | Penyebab | Contoh `message` |
|---|---|---|
| `400` | ID pada URL bukan UUID yang valid | Validation failed (uuid is expected) |
| `404` | Pasien dengan ID tersebut tidak ditemukan | Pasien 11111111-1111-4111-8111-111111111111 tidak ditemukan |
| `409` | Pasien masih memiliki janji temu | Pasien tidak dapat dihapus karena masih memiliki 1 janji temu |

---

# 9. API Janji Temu

Jadwal pertemuan pasien dengan dokter + status.

## 9.1 Buat janji temu

Membuat janji temu antara pasien dan dokter. Status awal selalu TERJADWAL dan kode janji (JT-YYYYMMDD-XXXXX) dibuat otomatis.

### Endpoint

```http
POST /janji-temu
```

### Request Body

```json
{
  "pasienId": "3f2b8c1e-5d4a-4b7e-9c21-8a6f0d1e2b34",
  "dokterId": "9b2d1c4e-3f6a-4d8b-a1c5-2e7f8a9b0c3d",
  "jadwal": "2026-11-20T09:00:00+07:00",
  "keluhan": "Demam dan batuk sejak tiga hari"
}
```

| Field | Type | Required | Validasi |
|---|---|---|---|
| `pasienId` | string (uuid) | Yes | UUID v4 pasien yang sudah ada |
| `dokterId` | string (uuid) | Yes | UUID v4 dokter yang sudah ada dan berstatus aktif |
| `jadwal` | string (date-time) | Yes | Tanggal & jam format ISO 8601, harus di masa depan |
| `keluhan` | string | Yes | Wajib diisi, maksimal 500 karakter |

### Response

**HTTP 201 Created**

```json
{
  "success": true,
  "message": "Data berhasil dibuat",
  "statusCode": 201,
  "data": {
    "id": "b1a7e5d2-6c3f-4a98-8e14-5d0c9f2a7b61",
    "kodeJanjiTemu": "JT-20261112-K7Q2X",
    "pasienId": "3f2b8c1e-5d4a-4b7e-9c21-8a6f0d1e2b34",
    "dokterId": "9b2d1c4e-3f6a-4d8b-a1c5-2e7f8a9b0c3d",
    "jadwal": "2026-11-20T02:00:00.000Z",
    "keluhan": "Demam dan batuk sejak tiga hari",
    "status": "TERJADWAL",
    "alasanPembatalan": null,
    "dibuatPada": "2026-11-12T03:15:30.123Z",
    "diperbaruiPada": "2026-11-12T03:15:30.123Z",
    "pasien": {
      "id": "3f2b8c1e-5d4a-4b7e-9c21-8a6f0d1e2b34",
      "nomorRekamMedis": "RM-20261112-4821",
      "namaLengkap": "Budi Santoso",
      "nik": "3301010101900001",
      "jenisKelamin": "LAKI_LAKI",
      "tanggalLahir": "1990-01-01",
      "alamat": "Jl. Merdeka No. 10, Kota Contoh",
      "nomorTelepon": "081298765432",
      "dibuatPada": "2026-11-12T03:15:30.123Z",
      "diperbaruiPada": "2026-11-12T03:15:30.123Z"
    },
    "dokter": {
      "id": "9b2d1c4e-3f6a-4d8b-a1c5-2e7f8a9b0c3d",
      "departemenId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "namaLengkap": "dr. Andini Pratama",
      "nomorStr": "STR-3301-2024-001234",
      "spesialisasi": "Dokter Umum",
      "email": "andini.pratama@klinik.example",
      "nomorTelepon": "081234567890",
      "statusAktif": true,
      "dibuatPada": "2026-11-12T03:15:30.123Z",
      "diperbaruiPada": "2026-11-12T03:15:30.123Z",
      "dihapusPada": null,
      "departemen": {
        "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "namaDepartemen": "Poli Umum",
        "deskripsi": "Layanan pemeriksaan kesehatan umum",
        "dibuatPada": "2026-11-12T03:15:30.123Z",
        "diperbaruiPada": "2026-11-12T03:15:30.123Z",
        "dihapusPada": null
      }
    },
    "rekamMedis": null
  }
}
```

### Kemungkinan Error

| Status | Penyebab | Contoh `message` |
|---|---|---|
| `400` | Data tidak valid / jadwal sudah lewat / dokter sedang tidak aktif | Jadwal janji temu harus di masa depan |
| `404` | Pasien atau dokter tidak ditemukan | Pasien 11111111-1111-4111-8111-111111111111 tidak ditemukan |
| `409` | Dokter atau pasien sudah punya janji aktif di jadwal yang sama | Dokter sudah memiliki janji temu pada jadwal tersebut |

---

## 9.2 Lihat semua janji temu

Menampilkan seluruh janji temu beserta pasien dan dokter, diurutkan dari jadwal paling awal.

### Endpoint

```http
GET /janji-temu
```

### Response

**HTTP 200 OK**

```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "statusCode": 200,
  "data": [
    {
      "id": "b1a7e5d2-6c3f-4a98-8e14-5d0c9f2a7b61",
      "kodeJanjiTemu": "JT-20261112-K7Q2X",
      "pasienId": "3f2b8c1e-5d4a-4b7e-9c21-8a6f0d1e2b34",
      "dokterId": "9b2d1c4e-3f6a-4d8b-a1c5-2e7f8a9b0c3d",
      "jadwal": "2026-11-20T02:00:00.000Z",
      "keluhan": "Demam dan batuk sejak tiga hari",
      "status": "TERJADWAL",
      "alasanPembatalan": null,
      "dibuatPada": "2026-11-12T03:15:30.123Z",
      "diperbaruiPada": "2026-11-12T03:15:30.123Z",
      "pasien": {
        "id": "3f2b8c1e-5d4a-4b7e-9c21-8a6f0d1e2b34",
        "nomorRekamMedis": "RM-20261112-4821",
        "namaLengkap": "Budi Santoso",
        "nik": "3301010101900001",
        "jenisKelamin": "LAKI_LAKI",
        "tanggalLahir": "1990-01-01",
        "alamat": "Jl. Merdeka No. 10, Kota Contoh",
        "nomorTelepon": "081298765432",
        "dibuatPada": "2026-11-12T03:15:30.123Z",
        "diperbaruiPada": "2026-11-12T03:15:30.123Z"
      },
      "dokter": {
        "id": "9b2d1c4e-3f6a-4d8b-a1c5-2e7f8a9b0c3d",
        "departemenId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "namaLengkap": "dr. Andini Pratama",
        "nomorStr": "STR-3301-2024-001234",
        "spesialisasi": "Dokter Umum",
        "email": "andini.pratama@klinik.example",
        "nomorTelepon": "081234567890",
        "statusAktif": true,
        "dibuatPada": "2026-11-12T03:15:30.123Z",
        "diperbaruiPada": "2026-11-12T03:15:30.123Z",
        "dihapusPada": null
      }
    }
  ]
}
```

---

## 9.3 Lihat satu janji temu

Menampilkan detail janji temu: pasien, dokter (beserta departemen), dan rekam medis bila sudah ada.

### Endpoint

```http
GET /janji-temu/:id
```

### Path Parameter

| Parameter | Type | Required | Keterangan |
|---|---|---|---|
| `id` | string (UUID) | Yes | ID janji temu (UUID) |

### Response

**HTTP 200 OK**

```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "statusCode": 200,
  "data": {
    "id": "b1a7e5d2-6c3f-4a98-8e14-5d0c9f2a7b61",
    "kodeJanjiTemu": "JT-20261112-K7Q2X",
    "pasienId": "3f2b8c1e-5d4a-4b7e-9c21-8a6f0d1e2b34",
    "dokterId": "9b2d1c4e-3f6a-4d8b-a1c5-2e7f8a9b0c3d",
    "jadwal": "2026-11-20T02:00:00.000Z",
    "keluhan": "Demam dan batuk sejak tiga hari",
    "status": "TERJADWAL",
    "alasanPembatalan": null,
    "dibuatPada": "2026-11-12T03:15:30.123Z",
    "diperbaruiPada": "2026-11-12T03:15:30.123Z",
    "pasien": {
      "id": "3f2b8c1e-5d4a-4b7e-9c21-8a6f0d1e2b34",
      "nomorRekamMedis": "RM-20261112-4821",
      "namaLengkap": "Budi Santoso",
      "nik": "3301010101900001",
      "jenisKelamin": "LAKI_LAKI",
      "tanggalLahir": "1990-01-01",
      "alamat": "Jl. Merdeka No. 10, Kota Contoh",
      "nomorTelepon": "081298765432",
      "dibuatPada": "2026-11-12T03:15:30.123Z",
      "diperbaruiPada": "2026-11-12T03:15:30.123Z"
    },
    "dokter": {
      "id": "9b2d1c4e-3f6a-4d8b-a1c5-2e7f8a9b0c3d",
      "departemenId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "namaLengkap": "dr. Andini Pratama",
      "nomorStr": "STR-3301-2024-001234",
      "spesialisasi": "Dokter Umum",
      "email": "andini.pratama@klinik.example",
      "nomorTelepon": "081234567890",
      "statusAktif": true,
      "dibuatPada": "2026-11-12T03:15:30.123Z",
      "diperbaruiPada": "2026-11-12T03:15:30.123Z",
      "dihapusPada": null,
      "departemen": {
        "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "namaDepartemen": "Poli Umum",
        "deskripsi": "Layanan pemeriksaan kesehatan umum",
        "dibuatPada": "2026-11-12T03:15:30.123Z",
        "diperbaruiPada": "2026-11-12T03:15:30.123Z",
        "dihapusPada": null
      }
    },
    "rekamMedis": null
  }
}
```

### Kemungkinan Error

| Status | Penyebab | Contoh `message` |
|---|---|---|
| `400` | ID pada URL bukan UUID yang valid | Validation failed (uuid is expected) |
| `404` | Janji temu dengan ID tersebut tidak ditemukan | Janji temu 11111111-1111-4111-8111-111111111111 tidak ditemukan |

---

## 9.4 Lihat rekam medis dari sebuah janji temu

Menampilkan catatan kunjungan milik janji temu tersebut.

### Endpoint

```http
GET /janji-temu/:id/rekam-medis
```

### Path Parameter

| Parameter | Type | Required | Keterangan |
|---|---|---|---|
| `id` | string (UUID) | Yes | ID janji temu (UUID) |

### Response

**HTTP 200 OK**

```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "statusCode": 200,
  "data": {
    "id": "e4c8a2f6-1b5d-4e73-b9a0-6f3d8c1e5a27",
    "janjiTemuId": "b1a7e5d2-6c3f-4a98-8e14-5d0c9f2a7b61",
    "catatanKunjungan": "Pasien datang dengan keluhan demam dan batuk. Disarankan istirahat cukup dan banyak minum air putih.",
    "tindakan": "Observasi dan edukasi istirahat cukup",
    "dibuatPada": "2026-11-12T03:15:30.123Z",
    "diperbaruiPada": "2026-11-12T03:15:30.123Z"
  }
}
```

### Kemungkinan Error

| Status | Penyebab | Contoh `message` |
|---|---|---|
| `400` | ID pada URL bukan UUID yang valid | Validation failed (uuid is expected) |
| `404` | Janji temu tidak ada, atau belum memiliki rekam medis | Janji temu b1a7e5d2-6c3f-4a98-8e14-5d0c9f2a7b61 belum memiliki rekam medis |

---

## 9.5 Ubah janji temu / ubah status

Satu endpoint untuk dua kebutuhan: (1) mengubah dokter, jadwal, atau keluhan; (2) mengubah status (TERJADWAL → DIKONFIRMASI → SELESAI, atau DIBATALKAN). Pasien tidak bisa diganti.

### Endpoint

```http
PATCH /janji-temu/:id
```

### Path Parameter

| Parameter | Type | Required | Keterangan |
|---|---|---|---|
| `id` | string (UUID) | Yes | ID janji temu (UUID) |

### Request Body

```json
{
  "status": "DIKONFIRMASI"
}
```

| Field | Type | Required | Validasi |
|---|---|---|---|
| `dokterId` | string (uuid) | No | UUID v4 dokter yang sudah ada dan berstatus aktif |
| `jadwal` | string (date-time) | No | Tanggal & jam format ISO 8601, harus di masa depan |
| `keluhan` | string | No | Wajib diisi, maksimal 500 karakter |
| `status` | string | No | Status baru. Hanya boleh berpindah sesuai aturan (lihat tabel transisi status) |
| `alasanPembatalan` | string | No | Wajib diisi jika status diubah menjadi DIBATALKAN |

> `PATCH` dipakai karena hanya field yang ingin diubah yang perlu dikirim. Field yang tidak dikirim tidak akan berubah.

### Response

**HTTP 200 OK**

```json
{
  "success": true,
  "message": "Data berhasil diperbarui",
  "statusCode": 200,
  "data": {
    "id": "b1a7e5d2-6c3f-4a98-8e14-5d0c9f2a7b61",
    "kodeJanjiTemu": "JT-20261112-K7Q2X",
    "pasienId": "3f2b8c1e-5d4a-4b7e-9c21-8a6f0d1e2b34",
    "dokterId": "9b2d1c4e-3f6a-4d8b-a1c5-2e7f8a9b0c3d",
    "jadwal": "2026-11-20T02:00:00.000Z",
    "keluhan": "Demam dan batuk sejak tiga hari",
    "status": "DIKONFIRMASI",
    "alasanPembatalan": null,
    "dibuatPada": "2026-11-12T03:15:30.123Z",
    "diperbaruiPada": "2026-11-12T03:15:30.123Z",
    "pasien": {
      "id": "3f2b8c1e-5d4a-4b7e-9c21-8a6f0d1e2b34",
      "nomorRekamMedis": "RM-20261112-4821",
      "namaLengkap": "Budi Santoso",
      "nik": "3301010101900001",
      "jenisKelamin": "LAKI_LAKI",
      "tanggalLahir": "1990-01-01",
      "alamat": "Jl. Merdeka No. 10, Kota Contoh",
      "nomorTelepon": "081298765432",
      "dibuatPada": "2026-11-12T03:15:30.123Z",
      "diperbaruiPada": "2026-11-12T03:15:30.123Z"
    },
    "dokter": {
      "id": "9b2d1c4e-3f6a-4d8b-a1c5-2e7f8a9b0c3d",
      "departemenId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "namaLengkap": "dr. Andini Pratama",
      "nomorStr": "STR-3301-2024-001234",
      "spesialisasi": "Dokter Umum",
      "email": "andini.pratama@klinik.example",
      "nomorTelepon": "081234567890",
      "statusAktif": true,
      "dibuatPada": "2026-11-12T03:15:30.123Z",
      "diperbaruiPada": "2026-11-12T03:15:30.123Z",
      "dihapusPada": null,
      "departemen": {
        "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "namaDepartemen": "Poli Umum",
        "deskripsi": "Layanan pemeriksaan kesehatan umum",
        "dibuatPada": "2026-11-12T03:15:30.123Z",
        "diperbaruiPada": "2026-11-12T03:15:30.123Z",
        "dihapusPada": null
      }
    },
    "rekamMedis": null
  }
}
```

### Kemungkinan Error

| Status | Penyebab | Contoh `message` |
|---|---|---|
| `400` | ID pada URL bukan UUID yang valid | Validation failed (uuid is expected) |
| `400` | Data tidak valid / jadwal lewat / dokter nonaktif / pembatalan tanpa alasan / mengirim pasienId | Alasan pembatalan wajib diisi jika status DIBATALKAN |
| `404` | Janji temu dengan ID tersebut tidak ditemukan | Janji temu 11111111-1111-4111-8111-111111111111 tidak ditemukan |
| `409` | Perpindahan status tidak diizinkan, janji sudah SELESAI/DIBATALKAN, atau jadwal bentrok | Status tidak dapat diubah dari TERJADWAL ke SELESAI. Perubahan yang diizinkan: DIKONFIRMASI, DIBATALKAN |

---

## 9.6 Hapus janji temu

Menghapus janji temu. Ditolak jika janji temu sudah memiliki rekam medis.

### Endpoint

```http
DELETE /janji-temu/:id
```

### Path Parameter

| Parameter | Type | Required | Keterangan |
|---|---|---|---|
| `id` | string (UUID) | Yes | ID janji temu (UUID) |

### Response

**HTTP 200 OK**

```json
{
  "success": true,
  "message": "Data berhasil dihapus",
  "statusCode": 200,
  "data": {
    "message": "Janji temu b1a7e5d2-6c3f-4a98-8e14-5d0c9f2a7b61 berhasil dihapus",
    "idTerhapus": "b1a7e5d2-6c3f-4a98-8e14-5d0c9f2a7b61"
  }
}
```

### Kemungkinan Error

| Status | Penyebab | Contoh `message` |
|---|---|---|
| `400` | ID pada URL bukan UUID yang valid | Validation failed (uuid is expected) |
| `404` | Janji temu dengan ID tersebut tidak ditemukan | Janji temu 11111111-1111-4111-8111-111111111111 tidak ditemukan |
| `409` | Janji temu sudah memiliki rekam medis | Janji temu tidak dapat dihapus karena sudah memiliki rekam medis |

---

# 10. API Rekam Medis

Catatan kunjungan untuk satu janji temu.

## 10.1 Buat rekam medis (catatan kunjungan)

Menyimpan catatan kunjungan untuk satu janji temu yang sudah DIKONFIRMASI/SELESAI. Jika status janji masih DIKONFIRMASI, otomatis berubah menjadi SELESAI (dalam satu transaksi database).

### Endpoint

```http
POST /rekam-medis
```

### Request Body

```json
{
  "janjiTemuId": "b1a7e5d2-6c3f-4a98-8e14-5d0c9f2a7b61",
  "catatanKunjungan": "Pasien datang dengan keluhan demam dan batuk. Disarankan istirahat cukup.",
  "tindakan": "Observasi dan edukasi istirahat cukup"
}
```

| Field | Type | Required | Validasi |
|---|---|---|---|
| `janjiTemuId` | string (uuid) | Yes | UUID v4 janji temu berstatus DIKONFIRMASI atau SELESAI |
| `catatanKunjungan` | string | Yes | Catatan kunjungan, wajib diisi |
| `tindakan` | string | No | Opsional. Tindakan umum (bukan diagnosis klinis) |

### Response

**HTTP 201 Created**

```json
{
  "success": true,
  "message": "Data berhasil dibuat",
  "statusCode": 201,
  "data": {
    "id": "e4c8a2f6-1b5d-4e73-b9a0-6f3d8c1e5a27",
    "janjiTemuId": "b1a7e5d2-6c3f-4a98-8e14-5d0c9f2a7b61",
    "catatanKunjungan": "Pasien datang dengan keluhan demam dan batuk. Disarankan istirahat cukup dan banyak minum air putih.",
    "tindakan": "Observasi dan edukasi istirahat cukup",
    "dibuatPada": "2026-11-12T03:15:30.123Z",
    "diperbaruiPada": "2026-11-12T03:15:30.123Z",
    "janjiTemu": {
      "id": "b1a7e5d2-6c3f-4a98-8e14-5d0c9f2a7b61",
      "kodeJanjiTemu": "JT-20261112-K7Q2X",
      "pasienId": "3f2b8c1e-5d4a-4b7e-9c21-8a6f0d1e2b34",
      "dokterId": "9b2d1c4e-3f6a-4d8b-a1c5-2e7f8a9b0c3d",
      "jadwal": "2026-11-20T02:00:00.000Z",
      "keluhan": "Demam dan batuk sejak tiga hari",
      "status": "SELESAI",
      "alasanPembatalan": null,
      "dibuatPada": "2026-11-12T03:15:30.123Z",
      "diperbaruiPada": "2026-11-12T03:15:30.123Z",
      "pasien": {
        "id": "3f2b8c1e-5d4a-4b7e-9c21-8a6f0d1e2b34",
        "nomorRekamMedis": "RM-20261112-4821",
        "namaLengkap": "Budi Santoso",
        "nik": "3301010101900001",
        "jenisKelamin": "LAKI_LAKI",
        "tanggalLahir": "1990-01-01",
        "alamat": "Jl. Merdeka No. 10, Kota Contoh",
        "nomorTelepon": "081298765432",
        "dibuatPada": "2026-11-12T03:15:30.123Z",
        "diperbaruiPada": "2026-11-12T03:15:30.123Z"
      },
      "dokter": {
        "id": "9b2d1c4e-3f6a-4d8b-a1c5-2e7f8a9b0c3d",
        "departemenId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "namaLengkap": "dr. Andini Pratama",
        "nomorStr": "STR-3301-2024-001234",
        "spesialisasi": "Dokter Umum",
        "email": "andini.pratama@klinik.example",
        "nomorTelepon": "081234567890",
        "statusAktif": true,
        "dibuatPada": "2026-11-12T03:15:30.123Z",
        "diperbaruiPada": "2026-11-12T03:15:30.123Z",
        "dihapusPada": null
      }
    }
  }
}
```

### Kemungkinan Error

| Status | Penyebab | Contoh `message` |
|---|---|---|
| `400` | Data tidak valid / mengirim field yang tidak dikenal (mis. tekananDarah) | Catatan kunjungan harus diisi |
| `404` | Janji temu tidak ditemukan | Janji temu 11111111-1111-4111-8111-111111111111 tidak ditemukan |
| `409` | Status janji temu belum DIKONFIRMASI/SELESAI, atau janji temu sudah punya rekam medis | Rekam medis hanya dapat dibuat untuk janji temu berstatus DIKONFIRMASI atau SELESAI (status saat ini: TERJADWAL) |

---

## 10.2 Lihat semua rekam medis

Menampilkan seluruh rekam medis beserta janji temu, pasien, dan dokternya (terbaru di atas).

### Endpoint

```http
GET /rekam-medis
```

### Response

**HTTP 200 OK**

```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "statusCode": 200,
  "data": [
    {
      "id": "e4c8a2f6-1b5d-4e73-b9a0-6f3d8c1e5a27",
      "janjiTemuId": "b1a7e5d2-6c3f-4a98-8e14-5d0c9f2a7b61",
      "catatanKunjungan": "Pasien datang dengan keluhan demam dan batuk. Disarankan istirahat cukup dan banyak minum air putih.",
      "tindakan": "Observasi dan edukasi istirahat cukup",
      "dibuatPada": "2026-11-12T03:15:30.123Z",
      "diperbaruiPada": "2026-11-12T03:15:30.123Z",
      "janjiTemu": {
        "id": "b1a7e5d2-6c3f-4a98-8e14-5d0c9f2a7b61",
        "kodeJanjiTemu": "JT-20261112-K7Q2X",
        "pasienId": "3f2b8c1e-5d4a-4b7e-9c21-8a6f0d1e2b34",
        "dokterId": "9b2d1c4e-3f6a-4d8b-a1c5-2e7f8a9b0c3d",
        "jadwal": "2026-11-20T02:00:00.000Z",
        "keluhan": "Demam dan batuk sejak tiga hari",
        "status": "SELESAI",
        "alasanPembatalan": null,
        "dibuatPada": "2026-11-12T03:15:30.123Z",
        "diperbaruiPada": "2026-11-12T03:15:30.123Z",
        "pasien": {
          "id": "3f2b8c1e-5d4a-4b7e-9c21-8a6f0d1e2b34",
          "nomorRekamMedis": "RM-20261112-4821",
          "namaLengkap": "Budi Santoso",
          "nik": "3301010101900001",
          "jenisKelamin": "LAKI_LAKI",
          "tanggalLahir": "1990-01-01",
          "alamat": "Jl. Merdeka No. 10, Kota Contoh",
          "nomorTelepon": "081298765432",
          "dibuatPada": "2026-11-12T03:15:30.123Z",
          "diperbaruiPada": "2026-11-12T03:15:30.123Z"
        },
        "dokter": {
          "id": "9b2d1c4e-3f6a-4d8b-a1c5-2e7f8a9b0c3d",
          "departemenId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
          "namaLengkap": "dr. Andini Pratama",
          "nomorStr": "STR-3301-2024-001234",
          "spesialisasi": "Dokter Umum",
          "email": "andini.pratama@klinik.example",
          "nomorTelepon": "081234567890",
          "statusAktif": true,
          "dibuatPada": "2026-11-12T03:15:30.123Z",
          "diperbaruiPada": "2026-11-12T03:15:30.123Z",
          "dihapusPada": null
        }
      }
    }
  ]
}
```

---

## 10.3 Lihat satu rekam medis

Menampilkan satu rekam medis beserta janji temu, pasien, dan dokternya.

### Endpoint

```http
GET /rekam-medis/:id
```

### Path Parameter

| Parameter | Type | Required | Keterangan |
|---|---|---|---|
| `id` | string (UUID) | Yes | ID rekam medis (UUID) |

### Response

**HTTP 200 OK**

```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "statusCode": 200,
  "data": {
    "id": "e4c8a2f6-1b5d-4e73-b9a0-6f3d8c1e5a27",
    "janjiTemuId": "b1a7e5d2-6c3f-4a98-8e14-5d0c9f2a7b61",
    "catatanKunjungan": "Pasien datang dengan keluhan demam dan batuk. Disarankan istirahat cukup dan banyak minum air putih.",
    "tindakan": "Observasi dan edukasi istirahat cukup",
    "dibuatPada": "2026-11-12T03:15:30.123Z",
    "diperbaruiPada": "2026-11-12T03:15:30.123Z",
    "janjiTemu": {
      "id": "b1a7e5d2-6c3f-4a98-8e14-5d0c9f2a7b61",
      "kodeJanjiTemu": "JT-20261112-K7Q2X",
      "pasienId": "3f2b8c1e-5d4a-4b7e-9c21-8a6f0d1e2b34",
      "dokterId": "9b2d1c4e-3f6a-4d8b-a1c5-2e7f8a9b0c3d",
      "jadwal": "2026-11-20T02:00:00.000Z",
      "keluhan": "Demam dan batuk sejak tiga hari",
      "status": "SELESAI",
      "alasanPembatalan": null,
      "dibuatPada": "2026-11-12T03:15:30.123Z",
      "diperbaruiPada": "2026-11-12T03:15:30.123Z",
      "pasien": {
        "id": "3f2b8c1e-5d4a-4b7e-9c21-8a6f0d1e2b34",
        "nomorRekamMedis": "RM-20261112-4821",
        "namaLengkap": "Budi Santoso",
        "nik": "3301010101900001",
        "jenisKelamin": "LAKI_LAKI",
        "tanggalLahir": "1990-01-01",
        "alamat": "Jl. Merdeka No. 10, Kota Contoh",
        "nomorTelepon": "081298765432",
        "dibuatPada": "2026-11-12T03:15:30.123Z",
        "diperbaruiPada": "2026-11-12T03:15:30.123Z"
      },
      "dokter": {
        "id": "9b2d1c4e-3f6a-4d8b-a1c5-2e7f8a9b0c3d",
        "departemenId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "namaLengkap": "dr. Andini Pratama",
        "nomorStr": "STR-3301-2024-001234",
        "spesialisasi": "Dokter Umum",
        "email": "andini.pratama@klinik.example",
        "nomorTelepon": "081234567890",
        "statusAktif": true,
        "dibuatPada": "2026-11-12T03:15:30.123Z",
        "diperbaruiPada": "2026-11-12T03:15:30.123Z",
        "dihapusPada": null
      }
    }
  }
}
```

### Kemungkinan Error

| Status | Penyebab | Contoh `message` |
|---|---|---|
| `400` | ID pada URL bukan UUID yang valid | Validation failed (uuid is expected) |
| `404` | Rekam medis dengan ID tersebut tidak ditemukan | Rekam medis 11111111-1111-4111-8111-111111111111 tidak ditemukan |

---

## 10.4 Ubah rekam medis

Mengubah catatan kunjungan atau tindakan. janjiTemuId tidak bisa diganti.

### Endpoint

```http
PATCH /rekam-medis/:id
```

### Path Parameter

| Parameter | Type | Required | Keterangan |
|---|---|---|---|
| `id` | string (UUID) | Yes | ID rekam medis (UUID) |

### Request Body

```json
{
  "tindakan": "Observasi, istirahat cukup, kontrol ulang bila perlu"
}
```

| Field | Type | Required | Validasi |
|---|---|---|---|
| `catatanKunjungan` | string | No | Catatan kunjungan, wajib diisi |
| `tindakan` | string | No | Opsional. Tindakan umum (bukan diagnosis klinis) |

> `PATCH` dipakai karena hanya field yang ingin diubah yang perlu dikirim. Field yang tidak dikirim tidak akan berubah.

### Response

**HTTP 200 OK**

```json
{
  "success": true,
  "message": "Data berhasil diperbarui",
  "statusCode": 200,
  "data": {
    "id": "e4c8a2f6-1b5d-4e73-b9a0-6f3d8c1e5a27",
    "janjiTemuId": "b1a7e5d2-6c3f-4a98-8e14-5d0c9f2a7b61",
    "catatanKunjungan": "Pasien datang dengan keluhan demam dan batuk. Disarankan istirahat cukup dan banyak minum air putih.",
    "tindakan": "Observasi, istirahat cukup, kontrol ulang bila perlu",
    "dibuatPada": "2026-11-12T03:15:30.123Z",
    "diperbaruiPada": "2026-11-12T03:15:30.123Z",
    "janjiTemu": {
      "id": "b1a7e5d2-6c3f-4a98-8e14-5d0c9f2a7b61",
      "kodeJanjiTemu": "JT-20261112-K7Q2X",
      "pasienId": "3f2b8c1e-5d4a-4b7e-9c21-8a6f0d1e2b34",
      "dokterId": "9b2d1c4e-3f6a-4d8b-a1c5-2e7f8a9b0c3d",
      "jadwal": "2026-11-20T02:00:00.000Z",
      "keluhan": "Demam dan batuk sejak tiga hari",
      "status": "SELESAI",
      "alasanPembatalan": null,
      "dibuatPada": "2026-11-12T03:15:30.123Z",
      "diperbaruiPada": "2026-11-12T03:15:30.123Z",
      "pasien": {
        "id": "3f2b8c1e-5d4a-4b7e-9c21-8a6f0d1e2b34",
        "nomorRekamMedis": "RM-20261112-4821",
        "namaLengkap": "Budi Santoso",
        "nik": "3301010101900001",
        "jenisKelamin": "LAKI_LAKI",
        "tanggalLahir": "1990-01-01",
        "alamat": "Jl. Merdeka No. 10, Kota Contoh",
        "nomorTelepon": "081298765432",
        "dibuatPada": "2026-11-12T03:15:30.123Z",
        "diperbaruiPada": "2026-11-12T03:15:30.123Z"
      },
      "dokter": {
        "id": "9b2d1c4e-3f6a-4d8b-a1c5-2e7f8a9b0c3d",
        "departemenId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "namaLengkap": "dr. Andini Pratama",
        "nomorStr": "STR-3301-2024-001234",
        "spesialisasi": "Dokter Umum",
        "email": "andini.pratama@klinik.example",
        "nomorTelepon": "081234567890",
        "statusAktif": true,
        "dibuatPada": "2026-11-12T03:15:30.123Z",
        "diperbaruiPada": "2026-11-12T03:15:30.123Z",
        "dihapusPada": null
      }
    }
  }
}
```

### Kemungkinan Error

| Status | Penyebab | Contoh `message` |
|---|---|---|
| `400` | ID pada URL bukan UUID yang valid | Validation failed (uuid is expected) |
| `400` | Data tidak valid / mengirim janjiTemuId atau field tak dikenal | property janjiTemuId should not exist |
| `404` | Rekam medis dengan ID tersebut tidak ditemukan | Rekam medis 11111111-1111-4111-8111-111111111111 tidak ditemukan |

---

## 10.5 Hapus rekam medis

Menghapus rekam medis. Status janji temu tidak ikut berubah.

### Endpoint

```http
DELETE /rekam-medis/:id
```

### Path Parameter

| Parameter | Type | Required | Keterangan |
|---|---|---|---|
| `id` | string (UUID) | Yes | ID rekam medis (UUID) |

### Response

**HTTP 200 OK**

```json
{
  "success": true,
  "message": "Data berhasil dihapus",
  "statusCode": 200,
  "data": {
    "message": "Rekam medis e4c8a2f6-1b5d-4e73-b9a0-6f3d8c1e5a27 berhasil dihapus",
    "idTerhapus": "e4c8a2f6-1b5d-4e73-b9a0-6f3d8c1e5a27"
  }
}
```

### Kemungkinan Error

| Status | Penyebab | Contoh `message` |
|---|---|---|
| `400` | ID pada URL bukan UUID yang valid | Validation failed (uuid is expected) |
| `404` | Rekam medis dengan ID tersebut tidak ditemukan | Rekam medis 11111111-1111-4111-8111-111111111111 tidak ditemukan |

---

# 11. Aturan Bisnis

Selain validasi bentuk data, service menerapkan aturan bisnis berikut.

## Pasien

- NIK harus unik (`409` jika sudah terdaftar).
- Tanggal lahir tidak boleh di masa depan (`400`).
- Nomor rekam medis (`RM-YYYYMMDD-XXXX`) dibuat otomatis oleh sistem dan tidak bisa diisi dari luar.
- Pasien yang masih punya janji temu tidak bisa dihapus (`409`).

## Dokter

- `departemenId` harus mengacu pada departemen yang ada (`404`).
- Nomor STR dan email harus unik (`409`).
- Dokter yang masih punya janji temu tidak bisa dihapus (`409`); nonaktifkan dengan `statusAktif = false`.
- Dokter yang tidak aktif tidak bisa dipilih untuk janji temu baru (`400`).

## Departemen

- Nama departemen harus unik (`409`).
- Departemen yang masih punya dokter tidak bisa dihapus (`409`).

## Janji Temu

- Pasien harus ada (`404`), dokter harus ada (`404`) dan aktif (`400`).
- Jadwal harus di masa depan (`400`).
- Dokter maupun pasien tidak boleh punya dua janji **aktif** (TERJADWAL/DIKONFIRMASI) di jam yang persis sama (`409`).
- Status baru selalu `TERJADWAL`.
- Janji temu yang sudah `SELESAI` atau `DIBATALKAN` tidak bisa diubah dokter/jadwal/keluhannya (`409`).
- Janji temu yang sudah punya rekam medis tidak bisa dihapus (`409`).

### Aturan Perpindahan Status

| Status sekarang | Boleh berpindah ke |
|---|---|
| `TERJADWAL` | DIKONFIRMASI, DIBATALKAN |
| `DIKONFIRMASI` | SELESAI, DIBATALKAN |
| `SELESAI` | — (status akhir) |
| `DIBATALKAN` | — (status akhir) |

```text
TERJADWAL ──► DIKONFIRMASI ──► SELESAI
    │              │
    └──────────────┴──► DIBATALKAN  (wajib mengisi alasanPembatalan)
```

Mencoba perpindahan lain menghasilkan `409 Conflict`. Mengirim status yang sama dengan status sekarang diabaikan (tidak error).

## Rekam Medis

- Hanya janji temu berstatus `DIKONFIRMASI` atau `SELESAI` yang boleh dibuatkan rekam medis (`409`).
- Satu janji temu hanya boleh punya satu rekam medis (`409`).
- Saat rekam medis dibuat dan status janji masih `DIKONFIRMASI`, status janji otomatis menjadi `SELESAI`. Kedua langkah ini berjalan dalam **satu transaksi database**: jika salah satu gagal, keduanya dibatalkan (rollback).
- Rekam medis hanya memuat `catatanKunjungan` dan `tindakan` umum. Tidak ada kolom tekanan darah, suhu tubuh, berat badan, diagnosis, atau resep.

---

# 12. Ringkasan Endpoint

## Sistem

| Method | Endpoint | Keterangan | Sukses |
|---|---|---|---|
| `GET` | `/` | Cek server hidup | `200` |

## Departemen

| Method | Endpoint | Keterangan | Sukses |
|---|---|---|---|
| `POST` | `/departemen` | Tambah departemen | `201` |
| `GET` | `/departemen` | Lihat semua departemen | `200` |
| `GET` | `/departemen/:id` | Lihat satu departemen beserta dokternya | `200` |
| `PATCH` | `/departemen/:id` | Ubah departemen | `200` |
| `DELETE` | `/departemen/:id` | Hapus departemen | `200` |

## Dokter

| Method | Endpoint | Keterangan | Sukses |
|---|---|---|---|
| `POST` | `/dokter` | Tambah dokter | `201` |
| `GET` | `/dokter` | Lihat semua dokter | `200` |
| `GET` | `/dokter/:id` | Lihat satu dokter | `200` |
| `GET` | `/dokter/:id/janji-temu` | Lihat janji temu milik dokter | `200` |
| `PATCH` | `/dokter/:id` | Ubah dokter | `200` |
| `DELETE` | `/dokter/:id` | Hapus dokter | `200` |

## Pasien

| Method | Endpoint | Keterangan | Sukses |
|---|---|---|---|
| `POST` | `/pasien` | Tambah pasien | `201` |
| `GET` | `/pasien` | Lihat semua pasien | `200` |
| `GET` | `/pasien/:id` | Lihat satu pasien | `200` |
| `GET` | `/pasien/:id/janji-temu` | Lihat janji temu milik pasien | `200` |
| `PATCH` | `/pasien/:id` | Ubah pasien | `200` |
| `DELETE` | `/pasien/:id` | Hapus pasien | `200` |

## Janji Temu

| Method | Endpoint | Keterangan | Sukses |
|---|---|---|---|
| `POST` | `/janji-temu` | Buat janji temu | `201` |
| `GET` | `/janji-temu` | Lihat semua janji temu | `200` |
| `GET` | `/janji-temu/:id` | Lihat satu janji temu | `200` |
| `GET` | `/janji-temu/:id/rekam-medis` | Lihat rekam medis dari sebuah janji temu | `200` |
| `PATCH` | `/janji-temu/:id` | Ubah janji temu / ubah status | `200` |
| `DELETE` | `/janji-temu/:id` | Hapus janji temu | `200` |

## Rekam Medis

| Method | Endpoint | Keterangan | Sukses |
|---|---|---|---|
| `POST` | `/rekam-medis` | Buat rekam medis (catatan kunjungan) | `201` |
| `GET` | `/rekam-medis` | Lihat semua rekam medis | `200` |
| `GET` | `/rekam-medis/:id` | Lihat satu rekam medis | `200` |
| `PATCH` | `/rekam-medis/:id` | Ubah rekam medis | `200` |
| `DELETE` | `/rekam-medis/:id` | Hapus rekam medis | `200` |

Total: **29 endpoint**.

---

# 13. Struktur Module NestJS

```text
src/
├── main.ts                      # pintu masuk aplikasi + ValidationPipe + Interceptor
├── app.module.ts                # root module: config, database, semua feature module
├── app.controller.ts / app.service.ts   # GET / (cek server)
├── common/utils/buat-kode.ts    # pembuat nomor rekam medis & kode janji temu
├── interceptors/transform-response/     # pembungkus response sukses
├── middleware/log-middleware/           # pencatat log setiap request
├── departemen/   (module, controller, service, dto/, entities/)
├── dokter/       (module, controller, service, dto/, entities/)
├── pasien/       (module, controller, service, dto/, entities/, enums/)
├── janji-temu/   (module, controller, service, dto/, entities/, enums/)
└── rekam-medis/  (module, controller, service, dto/, entities/)
```
