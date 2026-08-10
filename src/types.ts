// === Type Definitions for RSVP Application ===

/** Firebase configuration object */
export interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
}

/** Status kehadiran tamu */
export type StatusHadir = 'belum' | 'hadir' | 'tidak';

/** Dokumen kontak di Firestore */
export interface Contact {
    id: string;
    nama: string;
    nohp: string;
    statusHadir: StatusHadir;
    jumlahOrang?: number;
    createdAt?: import('firebase/firestore').Timestamp;
    updatedAt?: import('firebase/firestore').Timestamp;
}

/** Payload untuk form RSVP tamu */
export interface RsvpPayload {
    nama: string;
    jumlahOrang: number;
    statusHadir: StatusHadir;
    updatedAt: import('firebase/firestore').FieldValue;
    nohp?: string;
    createdAt?: import('firebase/firestore').FieldValue;
}

/** Payload untuk menambah kontak manual (admin) */
export interface AddContactPayload {
    nama: string;
    nohp: string;
    statusHadir: 'belum';
    createdAt: import('firebase/firestore').FieldValue;
    updatedAt: import('firebase/firestore').FieldValue;
}
