// Membuat tanggal hari ini dalam format YYYYMMDD
function tanggalHariIni(): string {
    const sekarang = new Date();
    const tahun = sekarang.getFullYear();
    const bulan = String(sekarang.getMonth() + 1).padStart(2, '0');
    const hari = String(sekarang.getDate()).padStart(2, '0');
    return `${tahun}${bulan}${hari}`;
}

// Contoh hasil: RM-20261110-4821 (4 digit angka acak)
export function buatNomorRekamMedis(): string {
    const acak = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `RM-${tanggalHariIni()}-${acak}`;
}

// Contoh hasil: JT-20261110-K7Q2X (5 karakter huruf besar/angka acak)
export function buatKodeJanjiTemu(): string {
    const karakter = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let acak = '';
    for (let i = 0; i < 5; i++) {
        acak += karakter[Math.floor(Math.random() * karakter.length)];
    }
    return `JT-${tanggalHariIni()}-${acak}`;
}
