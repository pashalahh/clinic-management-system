export enum StatusJanjiTemu {
    TERJADWAL = 'TERJADWAL',
    DIKONFIRMASI = 'DIKONFIRMASI',
    SELESAI = 'SELESAI',
    DIBATALKAN = 'DIBATALKAN',
}

// Status yang masih "memakai" slot jadwal dokter / pasien
export const STATUS_AKTIF: StatusJanjiTemu[] = [
    StatusJanjiTemu.TERJADWAL,
    StatusJanjiTemu.DIKONFIRMASI,
];

// Aturan perpindahan status (state machine)
export const TRANSISI_STATUS: Record<StatusJanjiTemu, StatusJanjiTemu[]> = {
    [StatusJanjiTemu.TERJADWAL]: [StatusJanjiTemu.DIKONFIRMASI, StatusJanjiTemu.DIBATALKAN],
    [StatusJanjiTemu.DIKONFIRMASI]: [StatusJanjiTemu.SELESAI, StatusJanjiTemu.DIBATALKAN],
    [StatusJanjiTemu.SELESAI]: [],
    [StatusJanjiTemu.DIBATALKAN]: [],
};
