import { ValueTransformer } from 'typeorm';

// PostgreSQL mengembalikan tipe decimal sebagai string ("36.5").
// Transformer ini mengubahnya menjadi number (36.5) saat dibaca dari database.
export const desimalTransformer: ValueTransformer = {
    // to: dari aplikasi -> database (tidak diubah)
    to: (nilai: number | null) => nilai,
    // from: dari database -> aplikasi (string diubah menjadi number)
    from: (nilai: string | null) => (nilai === null ? null : parseFloat(nilai)),
};
