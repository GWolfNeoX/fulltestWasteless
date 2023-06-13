Berikut adalah dokumentasi API dari kode yang diberikan:

## API Endpoint

### Register User

**Endpoint**: `/register`

**Method**: `POST`

**Request Body**:
- `name` (string): Nama pengguna (wajib)
- `email` (string): Alamat email pengguna (wajib, harus valid)
- `password` (string): Kata sandi pengguna (wajib, minimal 6 karakter)

**Response**:
- Jika registrasi berhasil:
  - `status code`: 201
  - `body`: `{ message: 'User created successfully' }`
- Jika registrasi gagal:
  - `status code`: 400
  - `body`: `{ errors: [ { msg: 'Error message' } ] }`

### User Login

**Endpoint**: `/login`

**Method**: `POST`

**Request Body**:
- `email` (string): Alamat email pengguna (wajib, harus valid)
- `password` (string): Kata sandi pengguna (wajib)

**Response**:
- Jika login berhasil:
  - `status code`: 200
  - `body`: `{ userId: user.userId, name, email, token }`
    - `userId` (number): ID pengguna
    - `name` (string): Nama pengguna
    - `email` (string): Alamat email pengguna
    - `token` (string): Token JWT untuk otentikasi
- Jika login gagal:
  - `status code`: 401
  - `body`: `{ error: 'Invalid email/password. Please try again.' }`

### Get User History

**Endpoint**: `/history`

**Method**: `GET`

**Request Header**:
- `Authorization`: Token JWT (Bearer token)

**Response**:
- Jika autentikasi berhasil:
  - `status code`: 200
  - `body`: `[ { historyId, userId_peminat, foodId, userId_donatur, status }, ... ]`
    - `historyId` (number): ID riwayat
    - `userId_peminat` (number): ID pengguna penerima
    - `foodId` (number): ID makanan yang diambil
    - `userId_donatur` (number): ID pengguna yang menyumbangkan makanan
    - `status` (boolean): Status riwayat (true = selesai, false = belum selesai)
- Jika autentikasi gagal:
  - `status code`: 401
  - `body`: `{ error: 'Unauthorized' }`

### Create History

**Endpoint**: `/history`

**Method**: `POST`

**Request Header**:
- `Authorization`: Token JWT (Bearer token)

**Request Body**:
- `userId_peminat` (number): ID pengguna penerima (wajib)
- `foodId` (number): ID makanan yang diambil (wajib)
- `userId_donatur` (number): ID pengguna yang menyumbangkan makanan (wajib)
- `status` (boolean): Status riwayat (true = selesai, false = belum selesai) (wajib)

**Response**:
- Jika berhasil membuat riwayat:
  - `status code`: 201
  - `body`: `{ message: 'Berhasil request makanan' }`
- Jika gagal membuat riwayat:
  - `status code`: 500
  - `body`: `{ error: 'Internal server error' }`

### Update History

**Endpoint

**: `/history/:id`

**Method**: `PUT`

**Request Header**:
- `Authorization`: Token JWT (Bearer token)

**Request Parameters**:
- `id` (number): ID riwayat yang akan diperbarui (wajib)

**Request Body**:
- `status` (boolean): Status riwayat yang baru (true = selesai, false = belum selesai) (wajib)

**Response**:
- Jika berhasil memperbarui riwayat:
  - `status code`: 200
  - `body`: `{ message: 'Makanan telah dibagikan ke userId_peminat' }`
- Jika gagal memperbarui riwayat:
  - `status code`: 500
  - `body`: `{ error: 'Internal server error' }`

### Post Food Donation

**Endpoint**: `/postFood`

**Method**: `POST`

**Request Header**:
- `Authorization`: Token JWT (Bearer token)

**Request Body**:
- `foodName` (string): Nama makanan (wajib)
- `description` (string): Deskripsi makanan (wajib)
- `quantity` (number): Jumlah makanan (wajib)
- `location` (string): Lokasi makanan (wajib)
- `expiredAt` (string): Tanggal kadaluarsa makanan dalam format "DD-MM-YYYY" (wajib)
- `foodType` (string): Jenis makanan (wajib)
- `fotoMakanan` (file): Foto makanan (wajib)

**Response**:
- Jika berhasil menyumbangkan makanan:
  - `status code`: 200
  - `body`: `{ message: 'Food donation posted successfully' }`
- Jika gagal menyumbangkan makanan:
  - `status code`: 500
  - `body`: `{ error: 'Internal server error' }`

### Get Food List by User ID

**Endpoint**: `/foodList/:userId`

**Method**: `GET`

**Request Header**:
- `Authorization`: Token JWT (Bearer token)

**Request Parameters**:
- `userId` (number): ID pengguna yang ingin dilihat daftar makanannya (wajib)

**Response**:
- Jika berhasil mendapatkan daftar makanan:
  - `status code`: 200
  - `body`: `[ { foodId, name, expiredAt, fotoMakanan, userId }, ... ]`
    - `foodId` (number): ID makanan
    - `name` (string): Nama pengguna yang menyumbangkan makanan
    - `expiredAt` (string): Tanggal kadaluarsa makanan dalam format "YYYY-MM-DD HH:mm:ss"
    - `fotoMakanan` (string): URL foto makanan
    - `userId` (number): ID pengguna yang menyumbangkan makanan
- Jika tidak ada makanan yang didonasikan oleh pengguna:
  - `status code`: 200
  - `body`: `{ message: 'Tidak ada makanan yang didonasikan oleh pengguna ini' }`
- Jika terjadi kesalahan server:
  - `status code`: 500
  - `body`: `{ error: 'Internal server error' }`

### Get Preferred Food List

**Endpoint**: `/preferancefoodList`

**Method**: `GET`

**Request Header**:
- `Authorization`: Token JWT (Bearer token)

**Response**:
- J

ika berhasil mendapatkan daftar makanan yang direkomendasikan:
  - `status code`: 200
  - `body`: `[ { foodId, fotoMakanan, foodName, description, quantity, location, latitude, longitude, expiredAt, foodType }, ... ]`
    - `foodId` (number): ID makanan
    - `fotoMakanan` (string): URL foto makanan
    - `foodName` (string): Nama makanan
    - `description` (string): Deskripsi makanan
    - `quantity` (number): Jumlah makanan
    - `location` (string): Lokasi makanan
    - `latitude` (string): Koordinat lintang lokasi makanan
    - `longitude` (string): Koordinat bujur lokasi makanan
    - `expiredAt` (string): Tanggal kadaluarsa makanan dalam format "YYYY-MM-DD HH:mm:ss"
    - `foodType` (string): Jenis makanan
- Jika tidak ada makanan yang direkomendasikan:
  - `status code`: 200
  - `body`: `{ message: 'Tidak ada makanan yang direkomendasikan untuk saat ini' }`
- Jika terjadi kesalahan server:
  - `status code`: 500
  - `body`: `{ error: 'Internal server error' }`

### Get All Food List

**Endpoint**: `/allFoodList`

**Method**: `GET`

**Request Header**:
- `Authorization`: Token JWT (Bearer token)

**Response**:
- Jika berhasil mendapatkan semua daftar makanan:
  - `status code`: 200
  - `body`: `[ { foodId, fotoMakanan, foodName, description, quantity, location, latitude, longitude, expiredAt, foodType, userId, name }, ... ]`
    - `foodId` (number): ID makanan
    - `fotoMakanan` (string): URL foto makanan
    - `foodName` (string): Nama makanan
    - `description` (string): Deskripsi makanan
    - `quantity` (number): Jumlah makanan
    - `location` (string): Lokasi makanan
    - `latitude` (string): Koordinat lintang lokasi makanan
    - `longitude` (string): Koordinat bujur lokasi makanan
    - `expiredAt` (string): Tanggal kadaluarsa makanan dalam format "YYYY-MM-DD HH:mm:ss"
    - `foodType` (string): Jenis makanan
    - `userId` (number): ID pengguna yang menyumbangkan makanan
    - `name` (string): Nama pengguna yang menyumbangkan makanan
- Jika tidak ada makanan yang sedang didonasikan:
  - `status code`: 200
  - `body`: `{ message: 'Tidak ada makanan yang sedang didonasikan' }`
- Jika terjadi kesalahan server:
  - `status code`: 500
  - `body`: `{ error: 'Internal server error' }`

### Get Food Detail

**Endpoint**: `/foodDetail/:id`

**Method**: `GET`

**Request Header**:
- `Authorization`: Token JWT (Bearer token)

**Request Parameters**:
- `id` (number): ID makanan yang ingin dilihat detailnya (wajib)



**Response**:
- Jika berhasil mendapatkan detail makanan:
  - `status code`: 200
  - `body`: `{ foodId, fotoMakanan, foodName, description, quantity, location, latitude, longitude, expiredAt, foodType, userId, name }`
    - `foodId` (number): ID makanan
    - `fotoMakanan` (string): URL foto makanan
    - `foodName` (string): Nama makanan
    - `description` (string): Deskripsi makanan
    - `quantity` (number): Jumlah makanan
    - `location` (string): Lokasi makanan
    - `latitude` (string): Koordinat lintang lokasi makanan
    - `longitude` (string): Koordinat bujur lokasi makanan
    - `expiredAt` (string): Tanggal kadaluarsa makanan dalam format "YYYY-MM-DD HH:mm:ss"
    - `foodType` (string): Jenis makanan
    - `userId` (number): ID pengguna yang menyumbangkan makanan
    - `name` (string): Nama pengguna yang menyumbangkan makanan
- Jika data makanan tidak ditemukan:
  - `status code`: 404
  - `body`: `{ error: 'Food data not found' }`
- Jika terjadi kesalahan server:
  - `status code`: 500
  - `body`: `{ error: 'Internal server error' }`

### Get User Profile

**Endpoint**: `/userProfile`

**Method**: `GET`

**Request Header**:
- `Authorization`: Token JWT (Bearer token)

**Response**:
- Jika berhasil mendapatkan profil pengguna:
  - `status code`: 200
  - `body`: `{ userId, name, email, location, fotoProfile, historyDonation }`
    - `userId` (number): ID pengguna
    - `name` (string): Nama pengguna
    - `email` (string): Alamat email pengguna
    - `location` (string): Lokasi pengguna
    - `fotoProfile` (string): URL foto profil pengguna
    - `historyDonation` (string): Riwayat sumbangan pengguna
- Jika data pengguna tidak ditemukan:
  - `status code`: 404
  - `body`: `{ error: 'User data not found' }`
- Jika terjadi kesalahan server:
  - `status code`: 500
  - `body`: `{ error: 'Internal server error' }`

### Update User Profile

**Endpoint**: `/userProfile`

**Method**: `PUT`

**Request Header**:
- `Authorization`: Token JWT (Bearer token)

**Request Body**:
- `location` (string): Lokasi pengguna yang baru (wajib)
- `fotoProfile` (file): Foto profil pengguna (opsional)

**Response**:
- Jika berhasil memperbarui profil pengguna:
  - `status code`: 200
  - `body`: `{ message: 'User profile updated successfully' }`
- Jika gagal memperbarui profil pengguna:
  - `status code`: 500
  - `body`: `{ error: 'Internal server error' }`

### Home Page

**Endpoint**: `/homepage`

**Method**: `GET`

**Request Header**:
- `Authorization`: Token JWT (Bearer token)

**Response**:
- Jika autentikasi berhasil

:
  - `status code`: 200
  - `body`: `{ message: 'Welcome, {name}! This is the homepage.' }`
    - `{name}` adalah nama pengguna yang terautentikasi
- Jika terjadi kesalahan server:
  - `status code`: 500
  - `body`: `{ error: 'Internal server error' }`

### Error Handling

- Jika terjadi kesalahan server pada endpoint manapun:
  - `status code`: 500
  - `body`: `{ error: 'Internal server error' }`
