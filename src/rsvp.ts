import './styles/rsvp.css';
import { db } from './firebase';
import {
    doc,
    getDoc,
    updateDoc,
    addDoc,
    collection,
    serverTimestamp,
} from 'firebase/firestore';
import type { StatusHadir, RsvpPayload } from './types';

// === DOM Elements ===
const rsvpFormContainer = document.getElementById('rsvp-form-container') as HTMLDivElement;
const loader = document.getElementById('loader') as HTMLDivElement;
const successContainer = document.getElementById('success-container') as HTMLDivElement;
const rsvpForm = document.getElementById('rsvp-form') as HTMLFormElement;
const inputNama = document.getElementById('input-nama') as HTMLInputElement;
const inputJumlah = document.getElementById('input-jumlah') as HTMLInputElement;
const inputStatus = document.getElementById('input-status') as HTMLInputElement;
const statusError = document.getElementById('status-error') as HTMLDivElement;
const btnSubmit = document.getElementById('btn-submit') as HTMLButtonElement;
const statusBtns = document.querySelectorAll<HTMLButtonElement>('.btn-status');

let contactId: string | null = null;

// === Initialization ===
async function init(): Promise<void> {
    // Cek parameter ID di URL
    const urlParams = new URLSearchParams(window.location.search);
    contactId = urlParams.get('id');

    if (contactId) {
        try {
            const docRef = doc(db, 'contacts', contactId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                inputNama.value = (data.nama as string) || '';

                // Pre-fill if they already answered before
                if (data.jumlahOrang) inputJumlah.value = String(data.jumlahOrang);
                if (data.statusHadir === 'hadir' || data.statusHadir === 'tidak') {
                    setStatus(data.statusHadir as StatusHadir);
                }
            } else {
                console.warn('Contact ID not found in database.');
            }
        } catch (error) {
            console.error('Error fetching contact:', error);
        }
    }

    // Sembunyikan loader, tampilkan form
    loader.classList.add('hidden');
    rsvpFormContainer.classList.remove('hidden');

    // Setup Status Buttons
    statusBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const status = btn.dataset.status as StatusHadir;
            setStatus(status);
        });
    });

    // Handle Submit
    rsvpForm.addEventListener('submit', handleSubmit);
}

function setStatus(status: StatusHadir): void {
    inputStatus.value = status;
    statusError.classList.add('hidden');

    // Update UI
    statusBtns.forEach((b) => b.classList.remove('active'));
    const activeBtn = document.querySelector<HTMLButtonElement>(
        `.btn-status[data-status="${status}"]`
    );
    if (activeBtn) activeBtn.classList.add('active');
}

async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault();

    if (!inputStatus.value) {
        statusError.classList.remove('hidden');
        return;
    }

    const nama = inputNama.value.trim();
    const jumlahOrang = parseInt(inputJumlah.value, 10);
    const statusHadir = inputStatus.value as StatusHadir;

    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Mengirim...';

    try {
        const payload: RsvpPayload = {
            nama,
            jumlahOrang,
            statusHadir,
            updatedAt: serverTimestamp(),
        };

        if (contactId) {
            // Update kontak yang sudah ada
            const docRef = doc(db, 'contacts', contactId);
            await updateDoc(docRef, { ...payload });
        } else {
            // Buat kontak baru jika tidak ada ID (Guest umum)
            payload.nohp = '';
            payload.createdAt = serverTimestamp();
            await addDoc(collection(db, 'contacts'), payload);
        }

        // Tampilkan layar sukses
        rsvpFormContainer.classList.add('hidden');
        successContainer.classList.remove('hidden');
    } catch (error) {
        console.error('Error saving RSVP:', error);
        alert('Gagal mengirim konfirmasi. Silakan coba lagi.');
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Kirim Konfirmasi';
    }
}

// Start
init();
