import './styles/admin.css';
import { db, auth } from './firebase';
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    writeBatch,
    serverTimestamp,
} from 'firebase/firestore';
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from 'firebase/auth';
import type { Contact, StatusHadir } from './types';

// === State ===
let contactsData: Contact[] = [];
let currentSortColumn: string = 'createdAt';
let currentSortDirection: 'asc' | 'desc' = 'desc';
let unsubscribeSnapshot: (() => void) | null = null;

// === DOM Elements ===
const formSingle = document.getElementById('form-add-single') as HTMLFormElement;
const formBulk = document.getElementById('form-add-bulk') as HTMLFormElement;
const inputNama = document.getElementById('input-nama') as HTMLInputElement;
const inputNoHp = document.getElementById('input-nohp') as HTMLInputElement;
const inputBulk = document.getElementById('input-bulk') as HTMLTextAreaElement;
const bulkResult = document.getElementById('bulk-result') as HTMLDivElement;
const tableBody = document.getElementById('table-body') as HTMLTableSectionElement;
const emptyState = document.getElementById('empty-state') as HTMLDivElement;
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const filterStatus = document.getElementById('filter-status') as HTMLSelectElement;
const btnExport = document.getElementById('btn-export') as HTMLButtonElement;
const btnPrint = document.getElementById('btn-print') as HTMLButtonElement | null;

// Stats Elements
const statTotal = document.getElementById('stat-total') as HTMLSpanElement;
const statAttend = document.getElementById('stat-attend') as HTMLSpanElement;
const statAbsent = document.getElementById('stat-absent') as HTMLSpanElement;

// Auth DOM Elements
const loginContainer = document.getElementById('login-container') as HTMLDivElement;
const mainApp = document.getElementById('main-app') as HTMLDivElement;
const formLogin = document.getElementById('form-login') as HTMLFormElement;
const inputEmail = document.getElementById('input-email') as HTMLInputElement;
const inputPassword = document.getElementById('input-password') as HTMLInputElement;
const loginError = document.getElementById('login-error') as HTMLDivElement;
const btnLogout = document.getElementById('btn-logout') as HTMLButtonElement;

const colRef = collection(db, 'contacts');

// === Initialization ===
function init(): void {
    setupTabs();

    // Auth Listener
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            loginContainer.classList.add('hidden');
            mainApp.classList.remove('hidden');

            // Listen to Firestore
            if (!unsubscribeSnapshot) {
                unsubscribeSnapshot = onSnapshot(
                    colRef,
                    (snapshot) => {
                        contactsData = [];
                        snapshot.docs.forEach((docSnap) => {
                            contactsData.push({
                                id: docSnap.id,
                                ...docSnap.data(),
                            } as Contact);
                        });
                        renderTable();
                        updateStats();
                    },
                    (error) => {
                        console.error('Error fetching data:', error);
                        if (error.code === 'permission-denied') {
                            alert(
                                'Akses ke database ditolak. Pastikan Firestore rules Anda mengizinkan read/write untuk authenticated user.'
                            );
                        }
                    }
                );
            }
        } else {
            // No user is signed in
            loginContainer.classList.remove('hidden');
            mainApp.classList.add('hidden');

            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
                unsubscribeSnapshot = null;
            }
        }
    });

    // Login Event
    formLogin.addEventListener('submit', (e: Event) => {
        e.preventDefault();
        loginError.classList.add('hidden');
        const email = inputEmail.value.trim();
        const password = inputPassword.value.trim();

        const btnLogin = document.getElementById('btn-login') as HTMLButtonElement;
        btnLogin.textContent = 'Loading...';
        btnLogin.disabled = true;

        signInWithEmailAndPassword(auth, email, password)
            .then(() => {
                formLogin.reset();
                btnLogin.textContent = 'Login';
                btnLogin.disabled = false;
            })
            .catch((error) => {
                console.error('Login Error:', error);

                if (
                    error.code === 'auth/user-not-found' ||
                    error.code === 'auth/invalid-credential' ||
                    error.code === 'auth/wrong-password'
                ) {
                    loginError.textContent = 'Email atau password salah.';
                } else if (error.code === 'auth/operation-not-allowed') {
                    loginError.textContent =
                        'Metode login Email/Password belum diaktifkan di Firebase Console.';
                } else {
                    loginError.textContent = 'Error: ' + error.message;
                }

                loginError.classList.remove('hidden');
                btnLogin.textContent = 'Login';
                btnLogin.disabled = false;
            });
    });

    // Logout Event
    btnLogout.addEventListener('click', () => {
        signOut(auth);
    });

    // Event Listeners
    if (formSingle) formSingle.addEventListener('submit', handleAddSingle);
    if (formBulk) formBulk.addEventListener('submit', handleAddBulk);
    searchInput.addEventListener('input', renderTable);
    filterStatus.addEventListener('change', renderTable);
    btnExport.addEventListener('click', exportCSV);
    if (btnPrint) btnPrint.addEventListener('click', () => window.print());

    document.querySelectorAll<HTMLTableCellElement>('th.sortable').forEach((th) => {
        th.addEventListener('click', () => {
            const column = th.dataset.sort!;
            if (currentSortColumn === column) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortColumn = column;
                currentSortDirection = 'asc';
            }
            renderTable();
        });
    });
}

// === Utility Functions ===
function normalizePhone(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.substring(1);
    } else if (cleaned.startsWith('8')) {
        cleaned = '62' + cleaned;
    }
    return cleaned;
}

function setupTabs(): void {
    const tabBtns = document.querySelectorAll<HTMLButtonElement>('.tab-btn');
    tabBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(btn.dataset.target!)!.classList.add('active');
        });
    });
}

// === CRUD Operations ===
async function handleAddSingle(e: Event): Promise<void> {
    e.preventDefault();

    const nama = inputNama.value.trim();
    const nohp = normalizePhone(inputNoHp.value.trim());

    try {
        await addDoc(colRef, {
            nama,
            nohp,
            statusHadir: 'belum' as StatusHadir,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        formSingle.reset();
        inputNama.focus();
    } catch (error) {
        console.error('Error adding doc:', error);
        alert('Gagal menambahkan kontak.');
    }
}

async function handleAddBulk(e: Event): Promise<void> {
    e.preventDefault();

    const text = inputBulk.value.trim();
    const lines = text.split('\n');
    const batch = writeBatch(db);
    let successCount = 0;
    let skipCount = 0;

    lines.forEach((line) => {
        let parts = line.split(/\t|,/);

        if (parts.length < 2 && line.trim() !== '') {
            const spaceParts = line.trim().split(/\s+/);
            if (spaceParts.length >= 2) {
                const phone = spaceParts.pop()!;
                const name = spaceParts.join(' ');
                parts = [name, phone];
            }
        }

        if (parts.length >= 2) {
            const nama = parts[0].trim();
            const nohp = normalizePhone(parts[1].trim());

            if (nama && nohp) {
                const newDocRef = doc(colRef);
                batch.set(newDocRef, {
                    nama,
                    nohp,
                    statusHadir: 'belum' as StatusHadir,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                successCount++;
            } else {
                skipCount++;
            }
        } else {
            if (line.trim() !== '') skipCount++;
        }
    });

    if (successCount > 0) {
        try {
            await batch.commit();
            bulkResult.innerHTML =
                `<span style="color:#10b981">✅ Berhasil import ${successCount} kontak.</span>` +
                (skipCount > 0
                    ? ` <span style="color:#f59e0b">⚠️ Dilewati: ${skipCount} baris tidak valid.</span>`
                    : '');
            bulkResult.classList.remove('hidden');
            formBulk.reset();
        } catch (error) {
            console.error('Error batch write:', error);
            alert('Gagal melakukan import data.');
        }
    } else {
        bulkResult.innerHTML =
            '<span style="color:#ef4444">❌ Tidak ada data valid yang ditemukan untuk diimport. Pastikan format: Nama [tab/koma/spasi] No.HP</span>';
        bulkResult.classList.remove('hidden');
    }
}

async function updateStatusHadir(id: string, newStatus: StatusHadir): Promise<void> {
    try {
        const docRef = doc(db, 'contacts', id);
        await updateDoc(docRef, {
            statusHadir: newStatus,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error update status hadir:', error);
        alert('Gagal update status.');
    }
}

async function deleteContact(id: string, nama: string): Promise<void> {
    if (confirm(`Yakin ingin menghapus kontak "${nama}"?`)) {
        try {
            const docRef = doc(db, 'contacts', id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error('Error delete doc:', error);
            alert('Gagal menghapus kontak.');
        }
    }
}

// Expose to global scope for inline event handlers in table rows
(window as any).updateStatusHadir = updateStatusHadir;
(window as any).deleteContact = deleteContact;

// === UI Rendering ===
function renderTable(): void {
    const search = searchInput.value.toLowerCase();
    const status = filterStatus.value;

    // Update sort icons
    document.querySelectorAll<HTMLTableCellElement>('th.sortable').forEach((th) => {
        th.classList.remove('sort-asc', 'sort-desc');
        if (th.dataset.sort === currentSortColumn) {
            th.classList.add(currentSortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
        }
    });

    // Sort Data
    const sortedData = [...contactsData].sort((a, b) => {
        let valA: any = (a as any)[currentSortColumn];
        let valB: any = (b as any)[currentSortColumn];

        if (currentSortColumn === 'createdAt' || currentSortColumn === 'updatedAt') {
            valA = valA?.toMillis?.() || 0;
            valB = valB?.toMillis?.() || 0;
        }

        if (valA === undefined) valA = '';
        if (valB === undefined) valB = '';

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return currentSortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return currentSortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    // Filter & Search
    const filteredData = sortedData.filter((c) => {
        const matchSearch =
            c.nama.toLowerCase().includes(search) || c.nohp.includes(search);
        const matchStatus = status === 'semua' || c.statusHadir === status;
        return matchSearch && matchStatus;
    });

    tableBody.innerHTML = '';

    if (filteredData.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        filteredData.forEach((c) => {
            const tr = document.createElement('tr');

            const selectClass =
                c.statusHadir === 'belum'
                    ? 'select-belum'
                    : c.statusHadir === 'hadir'
                      ? 'select-hadir'
                      : 'select-tidak';

            const escapedNama = c.nama.replace(/'/g, "\\'");

            tr.innerHTML = `
                <td><strong>${c.nama}</strong></td>
                <td>
                    <select class="table-select ${selectClass}" onchange="updateStatusHadir('${c.id}', this.value)">
                        <option value="belum" ${c.statusHadir === 'belum' ? 'selected' : ''}>Belum Konfirmasi</option>
                        <option value="hadir" ${c.statusHadir === 'hadir' ? 'selected' : ''}>Hadir</option>
                        <option value="tidak" ${c.statusHadir === 'tidak' ? 'selected' : ''}>Tidak Hadir</option>
                    </select>
                </td>
                <td style="text-align: center;">${c.jumlahOrang ? c.jumlahOrang : '-'}</td>
                <td class="no-print">
                    <div style="display:flex; gap:8px;">
                        <button class="btn btn-danger" onclick="deleteContact('${c.id}', '${escapedNama}')">
                            Hapus
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }
}

function updateStats(): void {
    const total = contactsData.length;
    let attend = 0;
    let absent = 0;

    contactsData.forEach((c) => {
        if (c.statusHadir === 'hadir') attend++;
        if (c.statusHadir === 'tidak') absent++;
    });

    statTotal.textContent = String(total);
    statAttend.textContent = String(attend);
    statAbsent.textContent = String(absent);
}

function exportCSV(): void {
    if (contactsData.length === 0) {
        alert('Tidak ada data untuk diexport.');
        return;
    }

    let csvContent = 'Nama,Status Kehadiran,Jumlah Orang\n';

    // Rows
    contactsData.forEach((c) => {
        const row = `"${c.nama}","${c.statusHadir}","${c.jumlahOrang || 0}"`;
        csvContent += row + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
        'download',
        `Data_Kontak_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Start app
init();
