# Postman Collection — Clinic Management System

Dokumen ini menjelaskan seluruh skenario pengujian API di Postman: apa yang diuji, request yang dikirim, dan hasil yang seharusnya muncul. Collection yang bisa langsung diimpor tersedia di file **`Clinic-Management.postman_collection.json`**.

Total: **73 request** dalam **9 folder**, masing-masing sudah dilengkapi *test script* otomatis (status code, bentuk response, dan isi data).

---

## 1. Cara Memakai

1. Jalankan database PostgreSQL dan server NestJS (lihat `README.md`). Server harus aktif di `http://localhost:3000`.
2. Buka Postman, klik **Import**, lalu pilih file `Clinic-Management.postman_collection.json`.
3. Buka collection **Clinic Management System API**, tab **Variables**. Pastikan `baseUrl` benar. Jika server memakai port lain, ubah di sini.
4. Klik kanan collection (atau tombol **Run**) lalu pilih **Run collection** dan jalankan **semua request berurutan**.
5. Semua test seharusnya berwarna hijau (*passed*). Ambil tangkapan layar hasil Runner sebagai bukti pengujian.

> Urutan penting. Request memakai ID dari request sebelumnya (misalnya `pasienId`), jadi jangan mengacak urutannya. Folder 8 menghapus semua data uji, sehingga collection bisa dijalankan berulang kali.

---

## 2. Variabel Collection

| Variabel | Diisi oleh | Fungsi |
|---|---|---|
| `baseUrl` | Manual (default `http://localhost:3000`) | Alamat server |
| `unknownId` | Tetap | UUID valid yang tidak ada di database, untuk uji *404* |
| `jadwalLalu` | Tetap | Tanggal lampau, untuk uji jadwal tidak valid |
| `tanggalMasaDepan` | Tetap | Tanggal lahir di masa depan, untuk uji validasi |
| `runId`, `namaDepartemen`, `nik`, `nomorStr`, `emailDokter`, `emailDokter2` | Otomatis (request 0.1) | Data unik agar tidak bentrok dengan data lama |
| `jadwal1`, `jadwal2`, `jadwal3` | Otomatis (request 0.1) | Jadwal di masa depan (14, 15, dan 16 hari dari sekarang) |
| `departemenId`, `dokterId`, `pasienId`, `janjiTemuId`, `janjiTemuId2`, `rekamMedisId` | Otomatis (test script) | ID data yang baru dibuat, dipakai request berikutnya |

Script pembuat data unik (berjalan di *pre-request* request 0.1):

```javascript
// Request pertama selalu membuat data uji BARU untuk satu putaran pengujian
const rnd = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');
const id = rnd(6);
const base = Date.now() + 14 * 24 * 3600 * 1000; // 14 hari dari sekarang
const set = (k, v) => pm.collectionVariables.set(k, v);
set('runId', id);
set('namaDepartemen', 'Poli Uji ' + id);
set('nik', '3301' + rnd(12));                       // 16 digit
set('nomorStr', 'STR-UJI-' + id);
set('emailDokter', 'dokter.' + id + '@klinik.example');
set('emailDokter2', 'dokter2.' + id + '@klinik.example');
set('jadwal1', new Date(base).toISOString());
set('jadwal2', new Date(base + 24 * 3600 * 1000).toISOString());
set('jadwal3', new Date(base + 2 * 24 * 3600 * 1000).toISOString());
```

Contoh *test script* yang ada di setiap request (contoh: Tambah pasien):

```javascript
pm.test('Status code = 201', () => pm.response.to.have.status(201));
pm.test('Waktu respons < 3000 ms', () => pm.expect(pm.response.responseTime).to.be.below(3000));
const json = pm.response.json();
pm.test('Format sukses: success=true & statusCode=201', () => { pm.expect(json.success).to.eql(true); pm.expect(json.statusCode).to.eql(201); pm.expect(json).to.have.property('data'); });
pm.test('Nomor rekam medis otomatis', () => pm.expect(json.data.nomorRekamMedis).to.match(/^RM-\d{8}-\d{4}$/));
pm.collectionVariables.set('pasienId', json.data.id);  // disimpan untuk request berikutnya
```

---

## 3. Cakupan Pengujian

Tabel ini memetakan ketentuan tugas ke request di collection.

| Yang wajib diuji | Request |
|---|---|
| Create (buat data) | 1.1, 2.1, 3.1, 4.1, 4.6, 5.2 |
| Read (ambil data) dan relasinya | 0.1, 1.4, 1.5, 2.6, 2.7, 3.6, 3.7, 4.7, 4.8, 4.9, 4.10, 5.7, 5.8, 5.9, 5.10 |
| Update (ubah data) | 1.8, 2.9, 3.9, 4.13, 4.14, 5.12, 6.2 |
| Delete (hapus data) | 8.1, 8.2, 8.3, 8.4, 8.5, 8.6 |
| Input tidak valid (400) | 1.3, 1.7, 1.9, 2.3, 2.4, 3.3, 3.4, 3.5, 4.3, 5.4, 5.5, 5.13, 6.1, 6.5, 6.6 |
| ID tidak ditemukan (404) | 1.6, 2.2, 2.8, 3.8, 4.4, 4.5, 4.11, 5.6, 5.11, 8.7, 8.8 |
| Konflik data / relasi / aturan bisnis (409) | 1.2, 2.5, 3.2, 4.2, 4.12, 5.1, 5.3, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4 |

---

## 4. Daftar Request

### 0. Cek Server

Memastikan server dan database sudah hidup sebelum pengujian dimulai.

| No | Request | Method | URL | Hasil diharapkan |
|---|---|---|---|---|
| 0.1 | Cek server hidup | `GET` | `/` | **200** — Berhasil |

#### 0.1 Cek server hidup

- **Tujuan:** Server menjawab dengan info aplikasi.
- **Request:** `GET {{baseUrl}}/`
- **Status diharapkan:** `200`
- **Yang diperiksa test script:** data.status = berjalan

### 1. Departemen

CRUD departemen (relasi: 1 departemen punya banyak dokter).

| No | Request | Method | URL | Hasil diharapkan |
|---|---|---|---|---|
| 1.1 | Tambah departemen | `POST` | `/departemen` | **201** — Berhasil (Create) |
| 1.2 | Tambah departemen - nama kembar | `POST` | `/departemen` | **409** — Gagal: konflik data unik |
| 1.3 | Tambah departemen - nama kosong | `POST` | `/departemen` | **400** — Gagal: input tidak valid |
| 1.4 | Lihat semua departemen | `GET` | `/departemen` | **200** — Berhasil (Read) |
| 1.5 | Lihat satu departemen | `GET` | `/departemen/{{departemenId}}` | **200** — Berhasil (Read + relasi) |
| 1.6 | Lihat departemen - ID tidak ditemukan | `GET` | `/departemen/{{unknownId}}` | **404** — Gagal: ID tidak ditemukan |
| 1.7 | Lihat departemen - format ID salah | `GET` | `/departemen/abc` | **400** — Gagal: input tidak valid |
| 1.8 | Ubah departemen | `PATCH` | `/departemen/{{departemenId}}` | **200** — Berhasil (Update) |
| 1.9 | Ubah departemen - field tidak dikenal | `PATCH` | `/departemen/{{departemenId}}` | **400** — Gagal: input tidak valid |

#### 1.1 Tambah departemen

- **Tujuan:** Membuat departemen baru. ID disimpan ke variabel departemenId.
- **Request:** `POST {{baseUrl}}/departemen`
- **Status diharapkan:** `201`
- **Yang diperiksa test script:** nama sesuai input; ID disimpan
- **Menyimpan variabel:** `departemenId`

Body (raw / JSON):

```json
{
  "namaDepartemen": "{{namaDepartemen}}",
  "deskripsi": "Layanan pemeriksaan kesehatan umum"
}
```

#### 1.2 Tambah departemen - nama kembar

- **Tujuan:** Nama departemen harus unik, jadi ditolak.
- **Request:** `POST {{baseUrl}}/departemen`
- **Status diharapkan:** `409`
- **Yang diperiksa test script:** message memuat 'sudah ada'

Body (raw / JSON):

```json
{
  "namaDepartemen": "{{namaDepartemen}}"
}
```

#### 1.3 Tambah departemen - nama kosong

- **Tujuan:** Field wajib namaDepartemen tidak dikirim.
- **Request:** `POST {{baseUrl}}/departemen`
- **Status diharapkan:** `400`
- **Yang diperiksa test script:** message memuat 'Nama departemen harus diisi'

Body (raw / JSON):

```json
{
  "deskripsi": "Tanpa nama"
}
```

#### 1.4 Lihat semua departemen

- **Tujuan:** Daftar departemen berisi data yang tadi dibuat.
- **Request:** `GET {{baseUrl}}/departemen`
- **Status diharapkan:** `200`
- **Yang diperiksa test script:** data berupa array; memuat departemenId

#### 1.5 Lihat satu departemen

- **Tujuan:** Detail departemen + daftar dokternya.
- **Request:** `GET {{baseUrl}}/departemen/{{departemenId}}`
- **Status diharapkan:** `200`
- **Yang diperiksa test script:** id sesuai; dokter berupa array

#### 1.6 Lihat departemen - ID tidak ditemukan

- **Tujuan:** UUID valid tetapi tidak ada di database.
- **Request:** `GET {{baseUrl}}/departemen/{{unknownId}}`
- **Status diharapkan:** `404`
- **Yang diperiksa test script:** message memuat 'tidak ditemukan'

#### 1.7 Lihat departemen - format ID salah

- **Tujuan:** ID bukan UUID, ditolak ParseUUIDPipe.
- **Request:** `GET {{baseUrl}}/departemen/abc`
- **Status diharapkan:** `400`
- **Yang diperiksa test script:** message memuat 'uuid'

#### 1.8 Ubah departemen

- **Tujuan:** Mengubah sebagian data (hanya deskripsi).
- **Request:** `PATCH {{baseUrl}}/departemen/{{departemenId}}`
- **Status diharapkan:** `200`
- **Yang diperiksa test script:** deskripsi berubah

Body (raw / JSON):

```json
{
  "deskripsi": "Layanan pemeriksaan umum dan konsultasi"
}
```

#### 1.9 Ubah departemen - field tidak dikenal

- **Tujuan:** forbidNonWhitelisted menolak field yang tidak ada di DTO.
- **Request:** `PATCH {{baseUrl}}/departemen/{{departemenId}}`
- **Status diharapkan:** `400`
- **Yang diperiksa test script:** message memuat 'should not exist'

Body (raw / JSON):

```json
{
  "warna": "biru"
}
```

### 2. Dokter

CRUD dokter (relasi: dokter wajib milik satu departemen).

| No | Request | Method | URL | Hasil diharapkan |
|---|---|---|---|---|
| 2.1 | Tambah dokter | `POST` | `/dokter` | **201** — Berhasil (Create + relasi) |
| 2.2 | Tambah dokter - departemen tidak ada | `POST` | `/dokter` | **404** — Gagal: relasi tidak ditemukan |
| 2.3 | Tambah dokter - email salah format | `POST` | `/dokter` | **400** — Gagal: input tidak valid |
| 2.4 | Tambah dokter - nomor telepon salah | `POST` | `/dokter` | **400** — Gagal: input tidak valid |
| 2.5 | Tambah dokter - nomor STR kembar | `POST` | `/dokter` | **409** — Gagal: konflik data unik |
| 2.6 | Lihat semua dokter | `GET` | `/dokter` | **200** — Berhasil (Read) |
| 2.7 | Lihat satu dokter | `GET` | `/dokter/{{dokterId}}` | **200** — Berhasil (Read) |
| 2.8 | Lihat dokter - ID tidak ditemukan | `GET` | `/dokter/{{unknownId}}` | **404** — Gagal: ID tidak ditemukan |
| 2.9 | Ubah dokter | `PATCH` | `/dokter/{{dokterId}}` | **200** — Berhasil (Update) |

#### 2.1 Tambah dokter

- **Tujuan:** Membuat dokter di departemen yang tadi dibuat. ID disimpan ke dokterId.
- **Request:** `POST {{baseUrl}}/dokter`
- **Status diharapkan:** `201`
- **Yang diperiksa test script:** departemen ikut tampil; statusAktif = true (default)
- **Menyimpan variabel:** `dokterId`

Body (raw / JSON):

```json
{
  "departemenId": "{{departemenId}}",
  "namaLengkap": "dr. Andini Pratama",
  "nomorStr": "{{nomorStr}}",
  "spesialisasi": "Dokter Umum",
  "email": "{{emailDokter}}",
  "nomorTelepon": "081234567890"
}
```

#### 2.2 Tambah dokter - departemen tidak ada

- **Tujuan:** departemenId valid tetapi tidak ada: relasi tidak boleh rusak.
- **Request:** `POST {{baseUrl}}/dokter`
- **Status diharapkan:** `404`
- **Yang diperiksa test script:** message memuat 'Departemen'

Body (raw / JSON):

```json
{
  "departemenId": "{{unknownId}}",
  "namaLengkap": "dr. Tidak Ada",
  "nomorStr": "STR-X-{{runId}}",
  "spesialisasi": "Umum",
  "email": "x.{{runId}}@klinik.example",
  "nomorTelepon": "081234567890"
}
```

#### 2.3 Tambah dokter - email salah format

- **Tujuan:** Email tidak lolos validasi @IsEmail.
- **Request:** `POST {{baseUrl}}/dokter`
- **Status diharapkan:** `400`
- **Yang diperiksa test script:** message memuat 'Format email tidak valid'

Body (raw / JSON):

```json
{
  "departemenId": "{{departemenId}}",
  "namaLengkap": "dr. Salah Email",
  "nomorStr": "STR-Y-{{runId}}",
  "spesialisasi": "Umum",
  "email": "bukan-email",
  "nomorTelepon": "081234567890"
}
```

#### 2.4 Tambah dokter - nomor telepon salah

- **Tujuan:** Nomor telepon bukan format seluler Indonesia.
- **Request:** `POST {{baseUrl}}/dokter`
- **Status diharapkan:** `400`
- **Yang diperiksa test script:** message array tidak kosong

Body (raw / JSON):

```json
{
  "departemenId": "{{departemenId}}",
  "namaLengkap": "dr. Salah Telepon",
  "nomorStr": "STR-Z-{{runId}}",
  "spesialisasi": "Umum",
  "email": "z.{{runId}}@klinik.example",
  "nomorTelepon": "12345"
}
```

#### 2.5 Tambah dokter - nomor STR kembar

- **Tujuan:** Nomor STR sama dengan dokter yang sudah ada.
- **Request:** `POST {{baseUrl}}/dokter`
- **Status diharapkan:** `409`
- **Yang diperiksa test script:** message memuat 'Nomor STR'

Body (raw / JSON):

```json
{
  "departemenId": "{{departemenId}}",
  "namaLengkap": "dr. Kembar STR",
  "nomorStr": "{{nomorStr}}",
  "spesialisasi": "Umum",
  "email": "{{emailDokter2}}",
  "nomorTelepon": "081234567890"
}
```

#### 2.6 Lihat semua dokter

- **Tujuan:** Daftar dokter beserta departemennya.
- **Request:** `GET {{baseUrl}}/dokter`
- **Status diharapkan:** `200`
- **Yang diperiksa test script:** memuat dokterId

#### 2.7 Lihat satu dokter

- **Tujuan:** Detail satu dokter.
- **Request:** `GET {{baseUrl}}/dokter/{{dokterId}}`
- **Status diharapkan:** `200`
- **Yang diperiksa test script:** id sesuai

#### 2.8 Lihat dokter - ID tidak ditemukan

- **Tujuan:** UUID valid tetapi tidak ada.
- **Request:** `GET {{baseUrl}}/dokter/{{unknownId}}`
- **Status diharapkan:** `404`

#### 2.9 Ubah dokter

- **Tujuan:** Mengubah spesialisasi saja.
- **Request:** `PATCH {{baseUrl}}/dokter/{{dokterId}}`
- **Status diharapkan:** `200`
- **Yang diperiksa test script:** spesialisasi berubah

Body (raw / JSON):

```json
{
  "spesialisasi": "Penyakit Dalam"
}
```

### 3. Pasien

CRUD pasien fiktif.

| No | Request | Method | URL | Hasil diharapkan |
|---|---|---|---|---|
| 3.1 | Tambah pasien | `POST` | `/pasien` | **201** — Berhasil (Create) |
| 3.2 | Tambah pasien - NIK kembar | `POST` | `/pasien` | **409** — Gagal: konflik data unik |
| 3.3 | Tambah pasien - NIK bukan 16 digit | `POST` | `/pasien` | **400** — Gagal: input tidak valid |
| 3.4 | Tambah pasien - tanggal lahir masa depan | `POST` | `/pasien` | **400** — Gagal: aturan bisnis |
| 3.5 | Tambah pasien - jenis kelamin tidak valid | `POST` | `/pasien` | **400** — Gagal: input tidak valid |
| 3.6 | Lihat semua pasien | `GET` | `/pasien` | **200** — Berhasil (Read) |
| 3.7 | Lihat satu pasien | `GET` | `/pasien/{{pasienId}}` | **200** — Berhasil (Read) |
| 3.8 | Lihat pasien - ID tidak ditemukan | `GET` | `/pasien/{{unknownId}}` | **404** — Gagal: ID tidak ditemukan |
| 3.9 | Ubah pasien | `PATCH` | `/pasien/{{pasienId}}` | **200** — Berhasil (Update) |

#### 3.1 Tambah pasien

- **Tujuan:** Membuat pasien. Nomor rekam medis dibuat otomatis. ID disimpan ke pasienId.
- **Request:** `POST {{baseUrl}}/pasien`
- **Status diharapkan:** `201`
- **Yang diperiksa test script:** nomorRekamMedis berformat RM-YYYYMMDD-XXXX
- **Menyimpan variabel:** `pasienId`

Body (raw / JSON):

```json
{
  "namaLengkap": "Budi Santoso",
  "nik": "{{nik}}",
  "jenisKelamin": "LAKI_LAKI",
  "tanggalLahir": "1990-01-01",
  "alamat": "Jl. Merdeka No. 10, Kota Contoh",
  "nomorTelepon": "081298765432"
}
```

#### 3.2 Tambah pasien - NIK kembar

- **Tujuan:** NIK harus unik.
- **Request:** `POST {{baseUrl}}/pasien`
- **Status diharapkan:** `409`
- **Yang diperiksa test script:** message memuat 'sudah terdaftar'

Body (raw / JSON):

```json
{
  "namaLengkap": "Pasien Kembar",
  "nik": "{{nik}}",
  "jenisKelamin": "PEREMPUAN",
  "tanggalLahir": "1992-02-02",
  "alamat": "Jl. Kembar No. 1",
  "nomorTelepon": "081211112222"
}
```

#### 3.3 Tambah pasien - NIK bukan 16 digit

- **Tujuan:** NIK hanya 15 digit.
- **Request:** `POST {{baseUrl}}/pasien`
- **Status diharapkan:** `400`
- **Yang diperiksa test script:** message memuat 'NIK harus berupa 16 digit angka'

Body (raw / JSON):

```json
{
  "namaLengkap": "Pasien NIK Salah",
  "nik": "123456789012345",
  "jenisKelamin": "LAKI_LAKI",
  "tanggalLahir": "1990-01-01",
  "alamat": "Jl. Salah No. 1",
  "nomorTelepon": "081211112222"
}
```

#### 3.4 Tambah pasien - tanggal lahir masa depan

- **Tujuan:** Aturan bisnis: tanggal lahir tidak boleh di masa depan.
- **Request:** `POST {{baseUrl}}/pasien`
- **Status diharapkan:** `400`
- **Yang diperiksa test script:** message memuat 'masa depan'

Body (raw / JSON):

```json
{
  "namaLengkap": "Pasien Masa Depan",
  "nik": "{{nik}}",
  "jenisKelamin": "LAKI_LAKI",
  "tanggalLahir": "{{tanggalMasaDepan}}",
  "alamat": "Jl. Masa Depan No. 1",
  "nomorTelepon": "081211112222"
}
```

#### 3.5 Tambah pasien - jenis kelamin tidak valid

- **Tujuan:** Enum hanya LAKI_LAKI atau PEREMPUAN.
- **Request:** `POST {{baseUrl}}/pasien`
- **Status diharapkan:** `400`
- **Yang diperiksa test script:** message memuat 'LAKI_LAKI atau PEREMPUAN'

Body (raw / JSON):

```json
{
  "namaLengkap": "Pasien Enum Salah",
  "nik": "3301999999999999",
  "jenisKelamin": "LAINNYA",
  "tanggalLahir": "1990-01-01",
  "alamat": "Jl. Enum No. 1",
  "nomorTelepon": "081211112222"
}
```

#### 3.6 Lihat semua pasien

- **Tujuan:** Daftar pasien.
- **Request:** `GET {{baseUrl}}/pasien`
- **Status diharapkan:** `200`
- **Yang diperiksa test script:** memuat pasienId

#### 3.7 Lihat satu pasien

- **Tujuan:** Detail satu pasien.
- **Request:** `GET {{baseUrl}}/pasien/{{pasienId}}`
- **Status diharapkan:** `200`
- **Yang diperiksa test script:** id sesuai

#### 3.8 Lihat pasien - ID tidak ditemukan

- **Tujuan:** UUID valid tetapi tidak ada.
- **Request:** `GET {{baseUrl}}/pasien/{{unknownId}}`
- **Status diharapkan:** `404`

#### 3.9 Ubah pasien

- **Tujuan:** Mengubah alamat saja.
- **Request:** `PATCH {{baseUrl}}/pasien/{{pasienId}}`
- **Status diharapkan:** `200`
- **Yang diperiksa test script:** alamat berubah

Body (raw / JSON):

```json
{
  "alamat": "Jl. Melati No. 5, Kota Contoh"
}
```

### 4. Janji Temu

Membuat janji (relasi pasien + dokter), validasi jadwal, dan konfirmasi.

| No | Request | Method | URL | Hasil diharapkan |
|---|---|---|---|---|
| 4.1 | Buat janji temu A | `POST` | `/janji-temu` | **201** — Berhasil (Create + relasi) |
| 4.2 | Buat janji temu - jadwal dokter bentrok | `POST` | `/janji-temu` | **409** — Gagal: konflik jadwal |
| 4.3 | Buat janji temu - jadwal di masa lalu | `POST` | `/janji-temu` | **400** — Gagal: aturan bisnis |
| 4.4 | Buat janji temu - pasien tidak ada | `POST` | `/janji-temu` | **404** — Gagal: relasi tidak ditemukan |
| 4.5 | Buat janji temu - dokter tidak ada | `POST` | `/janji-temu` | **404** — Gagal: relasi tidak ditemukan |
| 4.6 | Buat janji temu B | `POST` | `/janji-temu` | **201** — Berhasil (Create) |
| 4.7 | Lihat semua janji temu | `GET` | `/janji-temu` | **200** — Berhasil (Read) |
| 4.8 | Lihat satu janji temu | `GET` | `/janji-temu/{{janjiTemuId}}` | **200** — Berhasil (Read + relasi) |
| 4.9 | Lihat janji temu milik pasien | `GET` | `/pasien/{{pasienId}}/janji-temu` | **200** — Berhasil (Read relasi) |
| 4.10 | Lihat janji temu milik dokter | `GET` | `/dokter/{{dokterId}}/janji-temu` | **200** — Berhasil (Read relasi) |
| 4.11 | Lihat rekam medis janji (belum ada) | `GET` | `/janji-temu/{{janjiTemuId}}/rekam-medis` | **404** — Gagal: data belum ada |
| 4.12 | Ubah status - loncat TERJADWAL ke SELESAI | `PATCH` | `/janji-temu/{{janjiTemuId}}` | **409** — Gagal: status tidak sah |
| 4.13 | Ubah keluhan janji temu | `PATCH` | `/janji-temu/{{janjiTemuId}}` | **200** — Berhasil (Update) |
| 4.14 | Ubah status - konfirmasi janji A | `PATCH` | `/janji-temu/{{janjiTemuId}}` | **200** — Berhasil (Update status) |

#### 4.1 Buat janji temu A

- **Tujuan:** Janji pertama. Status awal TERJADWAL. ID disimpan ke janjiTemuId.
- **Request:** `POST {{baseUrl}}/janji-temu`
- **Status diharapkan:** `201`
- **Yang diperiksa test script:** status = TERJADWAL; kode berformat JT-YYYYMMDD-XXXXX; belum ada rekam medis
- **Menyimpan variabel:** `janjiTemuId`

Body (raw / JSON):

```json
{
  "pasienId": "{{pasienId}}",
  "dokterId": "{{dokterId}}",
  "keluhan": "Demam dan batuk sejak tiga hari",
  "jadwal": "{{jadwal1}}"
}
```

#### 4.2 Buat janji temu - jadwal dokter bentrok

- **Tujuan:** Dokter yang sama pada jam yang sama.
- **Request:** `POST {{baseUrl}}/janji-temu`
- **Status diharapkan:** `409`
- **Yang diperiksa test script:** message memuat 'Dokter sudah memiliki janji'

Body (raw / JSON):

```json
{
  "pasienId": "{{pasienId}}",
  "dokterId": "{{dokterId}}",
  "keluhan": "Demam dan batuk sejak tiga hari",
  "jadwal": "{{jadwal1}}"
}
```

#### 4.3 Buat janji temu - jadwal di masa lalu

- **Tujuan:** Jadwal harus di masa depan.
- **Request:** `POST {{baseUrl}}/janji-temu`
- **Status diharapkan:** `400`
- **Yang diperiksa test script:** message memuat 'masa depan'

Body (raw / JSON):

```json
{
  "pasienId": "{{pasienId}}",
  "dokterId": "{{dokterId}}",
  "keluhan": "Demam dan batuk sejak tiga hari",
  "jadwal": "{{jadwalLalu}}"
}
```

#### 4.4 Buat janji temu - pasien tidak ada

- **Tujuan:** pasienId valid tetapi tidak ada.
- **Request:** `POST {{baseUrl}}/janji-temu`
- **Status diharapkan:** `404`
- **Yang diperiksa test script:** message memuat 'Pasien'

Body (raw / JSON):

```json
{
  "pasienId": "{{unknownId}}",
  "dokterId": "{{dokterId}}",
  "keluhan": "Demam dan batuk sejak tiga hari",
  "jadwal": "{{jadwal3}}"
}
```

#### 4.5 Buat janji temu - dokter tidak ada

- **Tujuan:** dokterId valid tetapi tidak ada.
- **Request:** `POST {{baseUrl}}/janji-temu`
- **Status diharapkan:** `404`
- **Yang diperiksa test script:** message memuat 'Dokter'

Body (raw / JSON):

```json
{
  "pasienId": "{{pasienId}}",
  "dokterId": "{{unknownId}}",
  "keluhan": "Demam dan batuk sejak tiga hari",
  "jadwal": "{{jadwal3}}"
}
```

#### 4.6 Buat janji temu B

- **Tujuan:** Janji kedua (hari berikutnya) untuk pengujian pembatalan. ID disimpan ke janjiTemuId2.
- **Request:** `POST {{baseUrl}}/janji-temu`
- **Status diharapkan:** `201`
- **Yang diperiksa test script:** status = TERJADWAL
- **Menyimpan variabel:** `janjiTemuId2`

Body (raw / JSON):

```json
{
  "pasienId": "{{pasienId}}",
  "dokterId": "{{dokterId}}",
  "keluhan": "Demam dan batuk sejak tiga hari",
  "jadwal": "{{jadwal2}}"
}
```

#### 4.7 Lihat semua janji temu

- **Tujuan:** Daftar janji beserta pasien dan dokter.
- **Request:** `GET {{baseUrl}}/janji-temu`
- **Status diharapkan:** `200`
- **Yang diperiksa test script:** memuat janjiTemuId

#### 4.8 Lihat satu janji temu

- **Tujuan:** Detail janji: pasien, dokter, dan departemen dokter.
- **Request:** `GET {{baseUrl}}/janji-temu/{{janjiTemuId}}`
- **Status diharapkan:** `200`
- **Yang diperiksa test script:** pasien.id sesuai; dokter.departemen ada

#### 4.9 Lihat janji temu milik pasien

- **Tujuan:** Relasi 1 pasien -> banyak janji.
- **Request:** `GET {{baseUrl}}/pasien/{{pasienId}}/janji-temu`
- **Status diharapkan:** `200`
- **Yang diperiksa test script:** minimal 2 janji

#### 4.10 Lihat janji temu milik dokter

- **Tujuan:** Relasi 1 dokter -> banyak janji.
- **Request:** `GET {{baseUrl}}/dokter/{{dokterId}}/janji-temu`
- **Status diharapkan:** `200`
- **Yang diperiksa test script:** minimal 2 janji

#### 4.11 Lihat rekam medis janji (belum ada)

- **Tujuan:** Janji A belum punya catatan kunjungan.
- **Request:** `GET {{baseUrl}}/janji-temu/{{janjiTemuId}}/rekam-medis`
- **Status diharapkan:** `404`
- **Yang diperiksa test script:** message memuat 'belum memiliki rekam medis'

#### 4.12 Ubah status - loncat TERJADWAL ke SELESAI

- **Tujuan:** Perpindahan status tidak sah.
- **Request:** `PATCH {{baseUrl}}/janji-temu/{{janjiTemuId}}`
- **Status diharapkan:** `409`
- **Yang diperiksa test script:** message memuat 'Status tidak dapat diubah'

Body (raw / JSON):

```json
{
  "status": "SELESAI"
}
```

#### 4.13 Ubah keluhan janji temu

- **Tujuan:** Mengubah keluhan saat janji masih aktif.
- **Request:** `PATCH {{baseUrl}}/janji-temu/{{janjiTemuId}}`
- **Status diharapkan:** `200`
- **Yang diperiksa test script:** keluhan berubah

Body (raw / JSON):

```json
{
  "keluhan": "Demam, batuk, dan pilek sejak tiga hari"
}
```

#### 4.14 Ubah status - konfirmasi janji A

- **Tujuan:** TERJADWAL -> DIKONFIRMASI (sah).
- **Request:** `PATCH {{baseUrl}}/janji-temu/{{janjiTemuId}}`
- **Status diharapkan:** `200`
- **Yang diperiksa test script:** status = DIKONFIRMASI

Body (raw / JSON):

```json
{
  "status": "DIKONFIRMASI"
}
```

### 5. Rekam Medis

Catatan kunjungan: relasi 1 janji temu -> 0..1 rekam medis dan aturan bisnisnya.

| No | Request | Method | URL | Hasil diharapkan |
|---|---|---|---|---|
| 5.1 | Buat rekam medis - janji masih TERJADWAL | `POST` | `/rekam-medis` | **409** — Gagal: aturan bisnis |
| 5.2 | Buat rekam medis untuk janji A | `POST` | `/rekam-medis` | **201** — Berhasil (Create + relasi + transaksi) |
| 5.3 | Buat rekam medis - sudah ada untuk janji ini | `POST` | `/rekam-medis` | **409** — Gagal: konflik relasi 1-ke-1 |
| 5.4 | Buat rekam medis - kirim kolom yang sudah dihapus | `POST` | `/rekam-medis` | **400** — Gagal: input tidak valid |
| 5.5 | Buat rekam medis - catatan kosong | `POST` | `/rekam-medis` | **400** — Gagal: input tidak valid |
| 5.6 | Buat rekam medis - janji tidak ada | `POST` | `/rekam-medis` | **404** — Gagal: relasi tidak ditemukan |
| 5.7 | Cek status janji A setelah rekam dibuat | `GET` | `/janji-temu/{{janjiTemuId}}` | **200** — Berhasil (Read relasi) |
| 5.8 | Lihat rekam medis dari janji temu | `GET` | `/janji-temu/{{janjiTemuId}}/rekam-medis` | **200** — Berhasil (Read relasi) |
| 5.9 | Lihat semua rekam medis | `GET` | `/rekam-medis` | **200** — Berhasil (Read) |
| 5.10 | Lihat satu rekam medis | `GET` | `/rekam-medis/{{rekamMedisId}}` | **200** — Berhasil (Read + relasi) |
| 5.11 | Lihat rekam medis - ID tidak ditemukan | `GET` | `/rekam-medis/{{unknownId}}` | **404** — Gagal: ID tidak ditemukan |
| 5.12 | Ubah rekam medis | `PATCH` | `/rekam-medis/{{rekamMedisId}}` | **200** — Berhasil (Update) |
| 5.13 | Ubah rekam medis - janjiTemuId tidak boleh diganti | `PATCH` | `/rekam-medis/{{rekamMedisId}}` | **400** — Gagal: input tidak valid |

#### 5.1 Buat rekam medis - janji masih TERJADWAL

- **Tujuan:** Janji B masih TERJADWAL: belum boleh dicatat.
- **Request:** `POST {{baseUrl}}/rekam-medis`
- **Status diharapkan:** `409`
- **Yang diperiksa test script:** message memuat 'DIKONFIRMASI atau SELESAI'

Body (raw / JSON):

```json
{
  "janjiTemuId": "{{janjiTemuId2}}",
  "catatanKunjungan": "Seharusnya ditolak"
}
```

#### 5.2 Buat rekam medis untuk janji A

- **Tujuan:** Janji A (DIKONFIRMASI) dicatat. Status janji otomatis menjadi SELESAI. ID disimpan ke rekamMedisId.
- **Request:** `POST {{baseUrl}}/rekam-medis`
- **Status diharapkan:** `201`
- **Yang diperiksa test script:** janji otomatis SELESAI; tidak ada kolom tekananDarah/suhuTubuh/beratBadan
- **Menyimpan variabel:** `rekamMedisId`

Body (raw / JSON):

```json
{
  "janjiTemuId": "{{janjiTemuId}}",
  "catatanKunjungan": "Pasien datang dengan keluhan demam dan batuk. Disarankan istirahat cukup dan banyak minum air putih.",
  "tindakan": "Observasi dan edukasi istirahat cukup"
}
```

#### 5.3 Buat rekam medis - sudah ada untuk janji ini

- **Tujuan:** Satu janji hanya boleh punya satu rekam medis.
- **Request:** `POST {{baseUrl}}/rekam-medis`
- **Status diharapkan:** `409`
- **Yang diperiksa test script:** message memuat 'sudah memiliki rekam medis'

Body (raw / JSON):

```json
{
  "janjiTemuId": "{{janjiTemuId}}",
  "catatanKunjungan": "Rekam kedua seharusnya ditolak"
}
```

#### 5.4 Buat rekam medis - kirim kolom yang sudah dihapus

- **Tujuan:** Kolom tekananDarah sudah dihapus dari DTO, jadi ditolak sebagai field tak dikenal.
- **Request:** `POST {{baseUrl}}/rekam-medis`
- **Status diharapkan:** `400`
- **Yang diperiksa test script:** message memuat 'tekananDarah should not exist'

Body (raw / JSON):

```json
{
  "janjiTemuId": "{{janjiTemuId}}",
  "catatanKunjungan": "Tes kolom lama",
  "tekananDarah": "120/80"
}
```

#### 5.5 Buat rekam medis - catatan kosong

- **Tujuan:** catatanKunjungan wajib.
- **Request:** `POST {{baseUrl}}/rekam-medis`
- **Status diharapkan:** `400`
- **Yang diperiksa test script:** message memuat 'Catatan kunjungan harus diisi'

Body (raw / JSON):

```json
{
  "janjiTemuId": "{{janjiTemuId}}"
}
```

#### 5.6 Buat rekam medis - janji tidak ada

- **Tujuan:** janjiTemuId valid tetapi tidak ada.
- **Request:** `POST {{baseUrl}}/rekam-medis`
- **Status diharapkan:** `404`
- **Yang diperiksa test script:** message memuat 'Janji temu'

Body (raw / JSON):

```json
{
  "janjiTemuId": "{{unknownId}}",
  "catatanKunjungan": "Janji tidak ada"
}
```

#### 5.7 Cek status janji A setelah rekam dibuat

- **Tujuan:** Membuktikan transaksi: status janji sudah SELESAI dan rekam medis terhubung.
- **Request:** `GET {{baseUrl}}/janji-temu/{{janjiTemuId}}`
- **Status diharapkan:** `200`
- **Yang diperiksa test script:** status = SELESAI; rekamMedis tidak null

#### 5.8 Lihat rekam medis dari janji temu

- **Tujuan:** Endpoint relasi janji -> rekam medis.
- **Request:** `GET {{baseUrl}}/janji-temu/{{janjiTemuId}}/rekam-medis`
- **Status diharapkan:** `200`
- **Yang diperiksa test script:** id sesuai

#### 5.9 Lihat semua rekam medis

- **Tujuan:** Daftar rekam medis.
- **Request:** `GET {{baseUrl}}/rekam-medis`
- **Status diharapkan:** `200`
- **Yang diperiksa test script:** memuat rekamMedisId

#### 5.10 Lihat satu rekam medis

- **Tujuan:** Detail rekam medis + janji temu + pasien + dokter.
- **Request:** `GET {{baseUrl}}/rekam-medis/{{rekamMedisId}}`
- **Status diharapkan:** `200`
- **Yang diperiksa test script:** janjiTemu.pasien ada

#### 5.11 Lihat rekam medis - ID tidak ditemukan

- **Tujuan:** UUID valid tetapi tidak ada.
- **Request:** `GET {{baseUrl}}/rekam-medis/{{unknownId}}`
- **Status diharapkan:** `404`

#### 5.12 Ubah rekam medis

- **Tujuan:** Mengubah tindakan.
- **Request:** `PATCH {{baseUrl}}/rekam-medis/{{rekamMedisId}}`
- **Status diharapkan:** `200`
- **Yang diperiksa test script:** tindakan berubah

Body (raw / JSON):

```json
{
  "tindakan": "Observasi, istirahat cukup, kontrol ulang bila perlu"
}
```

#### 5.13 Ubah rekam medis - janjiTemuId tidak boleh diganti

- **Tujuan:** Rekam medis terikat pada satu janji temu.
- **Request:** `PATCH {{baseUrl}}/rekam-medis/{{rekamMedisId}}`
- **Status diharapkan:** `400`
- **Yang diperiksa test script:** message memuat 'should not exist'

Body (raw / JSON):

```json
{
  "janjiTemuId": "{{janjiTemuId2}}"
}
```

### 6. Status & Pembatalan Janji Temu

Menguji alur status (state machine) pada janji B.

| No | Request | Method | URL | Hasil diharapkan |
|---|---|---|---|---|
| 6.1 | Batalkan janji B tanpa alasan | `PATCH` | `/janji-temu/{{janjiTemuId2}}` | **400** — Gagal: aturan bisnis |
| 6.2 | Batalkan janji B dengan alasan | `PATCH` | `/janji-temu/{{janjiTemuId2}}` | **200** — Berhasil (Update status) |
| 6.3 | Aktifkan lagi janji yang sudah batal | `PATCH` | `/janji-temu/{{janjiTemuId2}}` | **409** — Gagal: status tidak sah |
| 6.4 | Ubah jadwal janji yang sudah batal | `PATCH` | `/janji-temu/{{janjiTemuId2}}` | **409** — Gagal: status tidak sah |
| 6.5 | Ubah status - nilai enum tidak dikenal | `PATCH` | `/janji-temu/{{janjiTemuId}}` | **400** — Gagal: input tidak valid |
| 6.6 | Ubah janji temu - pasienId tidak boleh diganti | `PATCH` | `/janji-temu/{{janjiTemuId}}` | **400** — Gagal: input tidak valid |

#### 6.1 Batalkan janji B tanpa alasan

- **Tujuan:** Pembatalan wajib disertai alasan.
- **Request:** `PATCH {{baseUrl}}/janji-temu/{{janjiTemuId2}}`
- **Status diharapkan:** `400`
- **Yang diperiksa test script:** message memuat 'Alasan pembatalan wajib'

Body (raw / JSON):

```json
{
  "status": "DIBATALKAN"
}
```

#### 6.2 Batalkan janji B dengan alasan

- **Tujuan:** TERJADWAL -> DIBATALKAN (sah).
- **Request:** `PATCH {{baseUrl}}/janji-temu/{{janjiTemuId2}}`
- **Status diharapkan:** `200`
- **Yang diperiksa test script:** status = DIBATALKAN; alasan tersimpan

Body (raw / JSON):

```json
{
  "status": "DIBATALKAN",
  "alasanPembatalan": "Pasien berhalangan hadir"
}
```

#### 6.3 Aktifkan lagi janji yang sudah batal

- **Tujuan:** DIBATALKAN adalah status akhir.
- **Request:** `PATCH {{baseUrl}}/janji-temu/{{janjiTemuId2}}`
- **Status diharapkan:** `409`
- **Yang diperiksa test script:** message memuat 'status akhir'

Body (raw / JSON):

```json
{
  "status": "DIKONFIRMASI"
}
```

#### 6.4 Ubah jadwal janji yang sudah batal

- **Tujuan:** Janji batal tidak boleh diubah jadwalnya.
- **Request:** `PATCH {{baseUrl}}/janji-temu/{{janjiTemuId2}}`
- **Status diharapkan:** `409`
- **Yang diperiksa test script:** message memuat 'tidak dapat diubah'

Body (raw / JSON):

```json
{
  "jadwal": "{{jadwal3}}"
}
```

#### 6.5 Ubah status - nilai enum tidak dikenal

- **Tujuan:** Status harus salah satu dari 4 nilai enum.
- **Request:** `PATCH {{baseUrl}}/janji-temu/{{janjiTemuId}}`
- **Status diharapkan:** `400`
- **Yang diperiksa test script:** message memuat 'Status harus salah satu dari'

Body (raw / JSON):

```json
{
  "status": "ABC"
}
```

#### 6.6 Ubah janji temu - pasienId tidak boleh diganti

- **Tujuan:** Pasien tidak bisa diganti lewat PATCH.
- **Request:** `PATCH {{baseUrl}}/janji-temu/{{janjiTemuId}}`
- **Status diharapkan:** `400`
- **Yang diperiksa test script:** message memuat 'should not exist'

Body (raw / JSON):

```json
{
  "pasienId": "{{unknownId}}"
}
```

### 7. Konflik Penghapusan (Integritas Relasi)

Membuktikan data yang masih dipakai relasi tidak bisa dihapus.

| No | Request | Method | URL | Hasil diharapkan |
|---|---|---|---|---|
| 7.1 | Hapus pasien yang punya janji temu | `DELETE` | `/pasien/{{pasienId}}` | **409** — Gagal: konflik relasi |
| 7.2 | Hapus dokter yang punya janji temu | `DELETE` | `/dokter/{{dokterId}}` | **409** — Gagal: konflik relasi |
| 7.3 | Hapus departemen yang punya dokter | `DELETE` | `/departemen/{{departemenId}}` | **409** — Gagal: konflik relasi |
| 7.4 | Hapus janji temu yang punya rekam medis | `DELETE` | `/janji-temu/{{janjiTemuId}}` | **409** — Gagal: konflik relasi |

#### 7.1 Hapus pasien yang punya janji temu

- **Tujuan:** Pasien masih punya janji.
- **Request:** `DELETE {{baseUrl}}/pasien/{{pasienId}}`
- **Status diharapkan:** `409`
- **Yang diperiksa test script:** message memuat 'janji temu'

#### 7.2 Hapus dokter yang punya janji temu

- **Tujuan:** Dokter masih punya janji.
- **Request:** `DELETE {{baseUrl}}/dokter/{{dokterId}}`
- **Status diharapkan:** `409`
- **Yang diperiksa test script:** message memuat 'janji temu'

#### 7.3 Hapus departemen yang punya dokter

- **Tujuan:** Departemen masih punya dokter.
- **Request:** `DELETE {{baseUrl}}/departemen/{{departemenId}}`
- **Status diharapkan:** `409`
- **Yang diperiksa test script:** message memuat 'dokter'

#### 7.4 Hapus janji temu yang punya rekam medis

- **Tujuan:** Janji A sudah punya rekam medis.
- **Request:** `DELETE {{baseUrl}}/janji-temu/{{janjiTemuId}}`
- **Status diharapkan:** `409`
- **Yang diperiksa test script:** message memuat 'rekam medis'

### 8. Pembersihan (Delete)

Menghapus semua data uji dari anak ke induk, sekaligus menguji operasi DELETE.

| No | Request | Method | URL | Hasil diharapkan |
|---|---|---|---|---|
| 8.1 | Hapus rekam medis | `DELETE` | `/rekam-medis/{{rekamMedisId}}` | **200** — Berhasil (Delete) |
| 8.2 | Hapus janji temu A | `DELETE` | `/janji-temu/{{janjiTemuId}}` | **200** — Berhasil (Delete) |
| 8.3 | Hapus janji temu B | `DELETE` | `/janji-temu/{{janjiTemuId2}}` | **200** — Berhasil (Delete) |
| 8.4 | Hapus pasien | `DELETE` | `/pasien/{{pasienId}}` | **200** — Berhasil (Delete) |
| 8.5 | Hapus dokter | `DELETE` | `/dokter/{{dokterId}}` | **200** — Berhasil (Delete) |
| 8.6 | Hapus departemen | `DELETE` | `/departemen/{{departemenId}}` | **200** — Berhasil (Delete) |
| 8.7 | Cek pasien sudah terhapus | `GET` | `/pasien/{{pasienId}}` | **404** — Gagal: ID tidak ditemukan |
| 8.8 | Cek rekam medis sudah terhapus | `GET` | `/rekam-medis/{{rekamMedisId}}` | **404** — Gagal: ID tidak ditemukan |

#### 8.1 Hapus rekam medis

- **Tujuan:** Hapus paling bawah dulu.
- **Request:** `DELETE {{baseUrl}}/rekam-medis/{{rekamMedisId}}`
- **Status diharapkan:** `200`
- **Yang diperiksa test script:** idTerhapus sesuai

#### 8.2 Hapus janji temu A

- **Tujuan:** Sekarang tidak punya rekam medis lagi.
- **Request:** `DELETE {{baseUrl}}/janji-temu/{{janjiTemuId}}`
- **Status diharapkan:** `200`
- **Yang diperiksa test script:** idTerhapus sesuai

#### 8.3 Hapus janji temu B

- **Tujuan:** Janji batal boleh dihapus.
- **Request:** `DELETE {{baseUrl}}/janji-temu/{{janjiTemuId2}}`
- **Status diharapkan:** `200`

#### 8.4 Hapus pasien

- **Tujuan:** Pasien sudah tidak punya janji.
- **Request:** `DELETE {{baseUrl}}/pasien/{{pasienId}}`
- **Status diharapkan:** `200`

#### 8.5 Hapus dokter

- **Tujuan:** Dokter sudah tidak punya janji.
- **Request:** `DELETE {{baseUrl}}/dokter/{{dokterId}}`
- **Status diharapkan:** `200`

#### 8.6 Hapus departemen

- **Tujuan:** Departemen sudah tidak punya dokter.
- **Request:** `DELETE {{baseUrl}}/departemen/{{departemenId}}`
- **Status diharapkan:** `200`

#### 8.7 Cek pasien sudah terhapus

- **Tujuan:** Membuktikan data benar-benar hilang.
- **Request:** `GET {{baseUrl}}/pasien/{{pasienId}}`
- **Status diharapkan:** `404`

#### 8.8 Cek rekam medis sudah terhapus

- **Tujuan:** Membuktikan data benar-benar hilang.
- **Request:** `GET {{baseUrl}}/rekam-medis/{{rekamMedisId}}`
- **Status diharapkan:** `404`

---

## 5. Cara Menunjukkan Hasil ke Dosen

1. Jalankan **Collection Runner** (semua request, urutan default). Tangkap layar ringkasan hasil: jumlah *passed* dan *failed*.
2. Buka beberapa request penting dan tangkap layar tab **Body**, **Test Results**, dan status code-nya, minimal:
   - 1.1 (create), 4.8 (read dengan relasi), 5.2 (create rekam medis, status janji otomatis jadi SELESAI), 1.8 (update), 8.1 (delete);
   - satu contoh tiap kegagalan: 1.3 (input tidak valid), 1.6 (ID tidak ditemukan), 4.2 (jadwal bentrok), 7.1 (konflik relasi).
3. Siapkan penjelasan alur: *Postman → Controller → ValidationPipe/DTO → Service → TypeORM Repository → PostgreSQL → Interceptor → Postman*.
