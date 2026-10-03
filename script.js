// ============ GLOBAL VARIABLES ============
let notes = [];
let announcements = [];

// ============ TOAST NOTIFICATION ============
function showToast(message, type = 'info') {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============ THEME SWITCHER ============
function initThemeSwitcher() {
    const savedTheme = localStorage.getItem('selectedTheme') || 'default';
    document.body.setAttribute('data-theme', savedTheme);

    const themeSwitcher = document.getElementById('themeSwitcher');
    const themeDropdown = document.getElementById('themeDropdown');

    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', (e) => {
            e.stopPropagation();
            themeDropdown.classList.toggle('show');
        });
    }

    document.addEventListener('click', (e) => {
        if (themeSwitcher && !themeSwitcher.contains(e.target)) {
            themeDropdown.classList.remove('show');
        }
    });

    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const theme = option.getAttribute('data-theme');
            document.body.setAttribute('data-theme', theme);
            localStorage.setItem('selectedTheme', theme);
            const themeName = option.querySelector('span')?.textContent || theme;
            showToast(`Theme changed to ${themeName}`, 'success');
            themeDropdown.classList.remove('show');
        });
    });
}

// ============ ANNOUNCEMENTS MANAGEMENT ============
const defaultAnnouncements = [
    {
        id: 1,
        week: '3 April 2026',   // shown as the Date
        month: 'Friday',        // shown as the Day
        message: '🎵 New song rehearsal scheduled for Friday at 6 PM. All band members please be present.',
        date: new Date().toISOString()
    },
    {
        id: 2,
        week: '10 April 2026',
        month: 'Friday',
        message: '🥁 Sound check for upcoming concert. Equipment setup at 4 PM.',
        date: new Date().toISOString()
    },
    {
        id: 3,
        week: '18 April 2026',
        month: 'Saturday',
        message: '🎸 New album recording session. Studio booked for whole day Saturday.',
        date: new Date().toISOString()
    },
    {
        id: 4,
        week: '24 April 2026',
        month: 'Friday',
        message: '🎤 Final rehearsal before the big show! Don\'t miss it.',
        date: new Date().toISOString()
    }
];

// ============ BAND MUSICIAN PROFILES ============
// Edit this list with the real band member names, roles and photo paths.
// Drop photo files into an "assets/members/" folder and point "photo" at them
// (e.g. 'assets/members/john.jpg'). If a photo is missing/broken, the card
// automatically falls back to showing the member's initials.
const bandMembers = [
    { id: 1, name: 'PINKU DAS', role: 'Synth', photo: 'pinku.png' },
    { id: 2, name: 'BIJAY', role: 'Lead Guitar', photo: 'bijay.png' },
    { id: 3, name: 'NONE', role: 'Rhythm Guitar', photo: 'fav.png' },
    { id: 4, name: 'PIYAL', role: 'Bass', photo: 'piyal.png' },
    { id: 5, name: 'RAJA', role: 'Drums', photo: 'raja.png' },
    { id: 6, name: 'NONE', role: 'Lead Vocals', photo: 'fav.png' },
    { id: 7, name: 'SHAMBHU', role: 'Octapad', photo: 'sambhu.png' },
    { id: 8, name: 'BISWANATH', role: 'Camera', photo: 'biswa.png' },
    { id: 9, name: 'BABU', role: 'Percussion', photo: 'babu.png' }
];

function getInitials(name) {
    return name
        .split(' ')
        .filter(Boolean)
        .map(part => part[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
}

function renderBandMembers() {
    const grid = document.getElementById('profilesGrid');
    if (!grid) return;

    grid.innerHTML = bandMembers.map(member => `
        <div class="musician-card">
            <div class="musician-photo">
                <img
                    src="${escapeHtml(member.photo)}"
                    alt="${escapeHtml(member.name)}"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                >
                <span class="photo-fallback" style="display:none;">${getInitials(member.name)}</span>
            </div>
            <span class="musician-role">${escapeHtml(member.role)}</span>
            <h3 class="musician-name">${escapeHtml(member.name)}</h3>
        </div>
    `).join('');
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('rehearsalAnnouncements');
    if (saved) {
        try {
            announcements = JSON.parse(saved);
        } catch (e) {
            announcements = [...defaultAnnouncements];
        }
    } else {
        announcements = [...defaultAnnouncements];
    }
    renderAnnouncements();
}

async function loadAnnouncements() {
    const client = window.supabaseClient;
    if (!client) {
        loadFromLocalStorage();
        return;
    }

    const container = document.getElementById('announcementsContainer');
    if (container && announcements.length === 0) {
        container.innerHTML = `
            <div class="empty-announcements">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading announcements from database...</p>
            </div>
        `;
    }

    try {
        const { data, error } = await client
            .from('announcements')
            .select('*')
            .order('id', { ascending: false });

        if (error) {
            console.warn('⚠️ Supabase error:', error);
            if (error.code === 'PGRST205') {
                showSupabaseSetupNotice();
                return;
            }
            loadFromLocalStorage();
            return;
        }

        announcements = data || [];
        renderAnnouncements();
    } catch (err) {
        console.error('Error fetching announcements from Supabase:', err);
        loadFromLocalStorage();
    }
}

function showSupabaseSetupNotice() {
    const container = document.getElementById('announcementsContainer');
    if (!container) return;
    container.innerHTML = `
        <div class="empty-announcements" style="padding: 1.5rem 1rem; text-align: center;">
            <i class="fas fa-database" style="font-size: 2rem; color: #6c5ce7; margin-bottom: 0.8rem; display: block;"></i>
            <h4 style="margin: 0 0 0.5rem 0; font-size: 0.95rem;">Database Connected! Table Setup Needed</h4>
            <p style="font-size: 0.8rem; opacity: 0.85; max-width: 360px; margin: 0 auto 1rem; line-height: 1.4;">
                Please run the SQL in <code>supabase-schema.sql</code> in your Supabase SQL Editor to create the <code>announcements</code> table.
            </p>
            <button class="add-announcement-btn" style="margin: 0 auto;" onclick="loadFromLocalStorage()">
                <i class="fas fa-folder-open"></i> Show Offline Announcements
            </button>
        </div>
    `;
}

function saveAnnouncements() {
    localStorage.setItem('rehearsalAnnouncements', JSON.stringify(announcements));
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderAnnouncements() {
    const container = document.getElementById('announcementsContainer');
    if (!container) return;

    if (announcements.length === 0) {
        container.innerHTML = `
            <div class="empty-announcements">
                <i class="fas fa-calendar-alt"></i>
                <p>No announcements yet. Click "Add Announcement" to create one.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = announcements.map(announcement => `
        <div class="announcement-item" data-id="${announcement.id}">
            <div class="announcement-content">
                <div class="announcement-date">
                    <i class="fas fa-calendar-day"></i>
                    <span>${escapeHtml(announcement.week)} (${escapeHtml(announcement.month)})</span>
                </div>
                <div class="announcement-message">
                    <p>${escapeHtml(announcement.message)}</p>
                </div>
            </div>
            <button class="delete-announcement" onclick="deleteAnnouncementById(${announcement.id})">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `).join('');
}

// Deleting needs the same password as posting (see PASSWORD GATE below).
function deleteAnnouncementById(id) {
    requireAnnouncementAccess(() => performDeleteAnnouncement(id));
}

async function performDeleteAnnouncement(id) {
    const client = window.supabaseClient;
    if (client) {
        try {
            const { error } = await client
                .from('announcements')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting announcement from Supabase:', error);
                showToast('Failed to delete announcement: ' + error.message, 'error');
                return;
            }
            showToast('Announcement deleted across all devices!', 'success');
            await loadAnnouncements();
            return;
        } catch (err) {
            console.error('Delete error:', err);
            showToast('Network error while deleting', 'error');
            return;
        }
    }

    // Local fallback
    announcements = announcements.filter(a => a.id !== id);
    saveAnnouncements();
    renderAnnouncements();
    showToast('Announcement deleted successfully!', 'success');
}

// NOTE: the database columns are still named `week` and `month`. They now hold
// the Date and the Day, so no Supabase change is needed and old rows still work.
async function addNewAnnouncement(week, month, message) {
    const client = window.supabaseClient;
    if (client) {
        try {
            const { error } = await client
                .from('announcements')
                .insert([{ week, month, message }]);

            if (error) {
                console.error('Supabase insert error:', error);
                if (error.code === 'PGRST205') {
                    showToast('Please run supabase-schema.sql in Supabase first!', 'error');
                } else {
                    showToast('Failed to save: ' + error.message, 'error');
                }
                return;
            }
            showToast('Announcement published across all devices!', 'success');
            await loadAnnouncements();
            return;
        } catch (err) {
            console.error('Insert error:', err);
            showToast('Network error while saving announcement', 'error');
            return;
        }
    }

    // Local fallback
    const newId = Date.now();
    announcements.unshift({
        id: newId,
        week: week,
        month: month,
        message: message,
        date: new Date().toISOString()
    });
    saveAnnouncements();
    renderAnnouncements();
    showToast('Announcement added locally!', 'success');
}

function initAnnouncements() {
    const addAnnouncementBtn = document.getElementById('addAnnouncementBtn');
    const addAnnouncementModal = document.getElementById('addAnnouncementModal');
    const closeAnnouncementModal = document.querySelector('.close-announcement-modal');
    const saveAnnouncementBtn = document.getElementById('saveAnnouncementBtn');

    loadAnnouncements();

    // Setup Supabase Realtime channel for instant cross-device updates
    if (window.supabaseClient) {
        try {
            window.supabaseClient
                .channel('public:announcements')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, (payload) => {
                    console.log('🔄 Cross-device update received:', payload);
                    loadAnnouncements();
                })
                .subscribe((status) => {
                    console.log('📡 Supabase Realtime status:', status);
                });
        } catch (err) {
            console.warn('Realtime subscription error:', err);
        }
    }

    if (addAnnouncementBtn) {
        addAnnouncementBtn.onclick = function () {
            requireAnnouncementAccess(() => {
                if (addAnnouncementModal) {
                    addAnnouncementModal.style.display = 'block';
                }
            });
        }
    }

    if (closeAnnouncementModal) {
        closeAnnouncementModal.onclick = function () {
            if (addAnnouncementModal) {
                addAnnouncementModal.style.display = 'none';
            }
        }
    }

    if (saveAnnouncementBtn) {
        saveAnnouncementBtn.onclick = async function () {
            if (!isAnnouncementUnlocked()) {
                if (addAnnouncementModal) addAnnouncementModal.style.display = 'none';
                requireAnnouncementAccess(() => {
                    if (addAnnouncementModal) addAnnouncementModal.style.display = 'block';
                });
                return;
            }
            const week = document.getElementById('announcementDate').value.trim();   // Date
            const month = document.getElementById('announcementDay').value.trim();   // Day
            const message = document.getElementById('announcementMessage').value;

            if (week && month && message) {
                saveAnnouncementBtn.disabled = true;
                const originalText = saveAnnouncementBtn.textContent;
                saveAnnouncementBtn.textContent = 'Saving...';

                try {
                    await addNewAnnouncement(week, month, message);
                    if (addAnnouncementModal) {
                        addAnnouncementModal.style.display = 'none';
                    }
                    document.getElementById('announcementDate').value = '';
                    document.getElementById('announcementDay').value = '';
                    document.getElementById('announcementMessage').value = '';
                } finally {
                    saveAnnouncementBtn.disabled = false;
                    saveAnnouncementBtn.textContent = originalText;
                }
            } else {
                showToast('Please fill all fields', 'error');
            }
        }
    }

    window.addEventListener('click', (e) => {
        if (e.target === addAnnouncementModal) {
            addAnnouncementModal.style.display = 'none';
        }
    });
}

// ============ NOTES FUNCTIONALITY ============
function loadNotes() {
    const savedNotes = localStorage.getItem('userNotes');
    if (savedNotes) {
        try {
            notes = JSON.parse(savedNotes);
        } catch (e) {
            notes = [];
        }
    } else {
        notes = [];
    }
    renderNotes();
    updateNotesCount();
}

function renderNotes() {
    const notesList = document.getElementById('notesList');
    if (!notesList) return;

    if (notes.length === 0) {
        notesList.innerHTML = `
            <div class="empty-notes">
                <i class="fas fa-edit"></i>
                <p>No notes yet. Click + to add a note</p>
            </div>
        `;
        return;
    }

    let html = '';
    notes.forEach((note, index) => {
        const previewContent = note.content.length > 80 ? note.content.substring(0, 80) + '...' : note.content;
        html += `
            <div class="note-item" data-index="${index}">
                <div class="note-title">${escapeHtml(note.title)}</div>
                <div class="note-text">${escapeHtml(previewContent)}</div>
                <button class="delete-note" data-index="${index}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
    });
    notesList.innerHTML = html;

    document.querySelectorAll('.delete-note').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.getAttribute('data-index'));
            deleteNote(index);
        });
    });
}

function addNote(title, content) {
    if (!title.trim()) {
        showToast('Please enter a title', 'error');
        return false;
    }
    if (!content.trim()) {
        showToast('Please enter note content', 'error');
        return false;
    }

    notes.unshift({
        title: title.trim(),
        content: content.trim(),
        date: new Date().toISOString()
    });

    localStorage.setItem('userNotes', JSON.stringify(notes));
    renderNotes();
    updateNotesCount();
    showToast('Note added successfully!', 'success');
    return true;
}

function deleteNote(index) {
    notes.splice(index, 1);
    localStorage.setItem('userNotes', JSON.stringify(notes));
    renderNotes();
    updateNotesCount();
    showToast('Note deleted', 'info');
}

function updateNotesCount() {
    const notesCount = document.getElementById('notesCount');
    if (notesCount) {
        notesCount.textContent = notes.length;
    }
}

function initNotes() {
    const notificationsIcon = document.getElementById('notificationsIcon');
    const notesBox = document.getElementById('notesBox');
    const addNoteBtn = document.getElementById('addNoteBtn');
    const addNoteModal = document.getElementById('addNoteModal');
    const closeNoteModal = document.querySelector('.close-note-modal');
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    const noteTitle = document.getElementById('noteTitle');
    const noteContent = document.getElementById('noteContent');

    if (notificationsIcon) {
        notificationsIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            notesBox.classList.toggle('show');
        });
    }

    document.addEventListener('click', (e) => {
        if (notesBox && notificationsIcon) {
            if (!notificationsIcon.contains(e.target) && !notesBox.contains(e.target)) {
                notesBox.classList.remove('show');
            }
        }
    });

    if (addNoteBtn) {
        addNoteBtn.addEventListener('click', () => {
            if (addNoteModal) addNoteModal.style.display = 'block';
        });
    }

    if (closeNoteModal) {
        closeNoteModal.addEventListener('click', () => {
            if (addNoteModal) addNoteModal.style.display = 'none';
            if (noteTitle) noteTitle.value = '';
            if (noteContent) noteContent.value = '';
        });
    }

    if (saveNoteBtn) {
        saveNoteBtn.addEventListener('click', () => {
            const title = noteTitle ? noteTitle.value : '';
            const content = noteContent ? noteContent.value : '';
            if (addNote(title, content)) {
                if (addNoteModal) addNoteModal.style.display = 'none';
                if (noteTitle) noteTitle.value = '';
                if (noteContent) noteContent.value = '';
            }
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === addNoteModal) {
            if (addNoteModal) addNoteModal.style.display = 'none';
            if (noteTitle) noteTitle.value = '';
            if (noteContent) noteContent.value = '';
        }
    });

    loadNotes();
}

// ============ MOBILE SIDEBAR HELPERS ============
function openMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.add('mobile-open');
    if (overlay) overlay.classList.add('active');
    document.body.classList.add('sidebar-open');
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (overlay) overlay.classList.remove('active');
    document.body.classList.remove('sidebar-open');
}

// ============ PAGE NAVIGATION ============
function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = item.getAttribute('data-page');
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
            item.classList.add('active');
            const targetPage = document.getElementById(`${pageId}Page`);
            if (targetPage) targetPage.classList.add('active');
            closeDropdown();

            // Automatically close mobile drawer when user navigates
            closeMobileSidebar();

            // Smoothly scroll to top of page on navigation
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// ============ SIDEBAR TOGGLE ============
function initSidebarToggle() {
    const toggle = document.getElementById('sidebarToggle');
    const closeBtn = document.getElementById('sidebarCloseBtn');
    const overlay = document.getElementById('sidebarOverlay');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');

    if (toggle) {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.innerWidth <= 992) {
                if (sidebar && sidebar.classList.contains('mobile-open')) {
                    closeMobileSidebar();
                } else {
                    openMobileSidebar();
                }
            } else {
                if (sidebar) sidebar.classList.toggle('collapsed');
                if (mainContent) mainContent.classList.toggle('expanded');
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeMobileSidebar();
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            closeMobileSidebar();
        });
    }

    // Auto-clean mobile state when resizing to larger screen
    window.addEventListener('resize', () => {
        if (window.innerWidth > 992) {
            closeMobileSidebar();
        }
    });

    // Close overlays/modals on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMobileSidebar();
            closeDropdown();
            const notesBox = document.getElementById('notesBox');
            if (notesBox) notesBox.classList.remove('show');
            const themeDropdown = document.getElementById('themeDropdown');
            if (themeDropdown) themeDropdown.classList.remove('show');
        }
    });
}

// ============ DROPDOWN FUNCTIONS ============
function toggleDropdown() {
    const dropdownMenu = document.querySelector('.dropdown-menu');
    if (dropdownMenu) {
        dropdownMenu.classList.toggle('show');
    }
}

function closeDropdown() {
    const dropdownMenu = document.querySelector('.dropdown-menu');
    if (dropdownMenu) {
        dropdownMenu.classList.remove('show');
    }
}

function initDropdown() {
    const userMenu = document.getElementById('userMenu');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    if (userMenu) {
        userMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown();
        });
    }

    document.addEventListener('click', (e) => {
        if (dropdownMenu && userMenu) {
            if (!userMenu.contains(e.target) && !dropdownMenu.contains(e.target)) {
                closeDropdown();
            }
        }
    });
}

// ============ CHANGE PASSWORD ============
function initChangePassword() {
    const btn = document.getElementById('changePasswordBtn');
    const modal = document.getElementById('passwordModal');
    const close = document.querySelector('.close-password');
    const form = document.getElementById('passwordForm');

    if (btn) {
        btn.addEventListener('click', () => {
            if (modal) modal.style.display = 'block';
        });
    }

    if (close) {
        close.addEventListener('click', () => {
            if (modal) modal.style.display = 'none';
        });
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const currentPass = document.getElementById('currentPassword').value;
            const newPass = document.getElementById('newPassword').value;
            const confirmPass = document.getElementById('confirmPassword').value;

            if (!currentPass) {
                showToast('Please enter current password', 'error');
                return;
            }
            if (newPass !== confirmPass) {
                showToast('New passwords do not match', 'error');
                return;
            }
            if (newPass.length < 6) {
                showToast('Password must be at least 6 characters', 'error');
                return;
            }

            showToast('Password changed successfully!', 'success');
            if (modal) modal.style.display = 'none';
            form.reset();
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal && modal) {
            modal.style.display = 'none';
        }
    });
}

// ============ APP LAUNCH ============
function launchApp(appName) {
    const modal = document.getElementById('appModal');
    const modalTitle = document.getElementById('appModalTitle');
    const modalBody = document.getElementById('appModalBody');

    if (appName === 'concert') {
        modalTitle.innerHTML = '<i class="fas fa-ticket-alt"></i> Live Concert';
        modalBody.innerHTML = '<div class="app-loader"><i class="fas fa-spinner fa-spin"></i><p>Redirecting to ticket booking page...</p></div>';
        modal.style.display = 'block';
        setTimeout(() => {
            window.open('https://www.facebook.com/profile.php?id=61568279226917', '_blank');
            modal.style.display = 'none';
            showToast('Redirecting to ticket booking...', 'success');
        }, 1500);
    } else if (appName === 'album') {
        modalTitle.innerHTML = '<i class="fas fa-headphones"></i> New Album - Echoes of Tomorrow';
        modalBody.innerHTML = '<div class="app-loader"><i class="fas fa-spinner fa-spin"></i><p>Taking you to pre-save page...</p></div>';
        modal.style.display = 'block';
        setTimeout(() => {
            window.open('https://example.com/pre-save', '_blank');
            modal.style.display = 'none';
            showToast('Opening pre-save page!', 'success');
        }, 1500);
    }
}

function closeAppModal() {
    const modal = document.getElementById('appModal');
    if (modal) modal.style.display = 'none';
}

function watchVideo(videoName) {
    showToast('Opening video player...', 'success');
    setTimeout(() => {
        window.open(`https://youtube.com/watch?v=${videoName}`, '_blank');
    }, 500);
}

// ============ VIDEO LINKS HANDLER ============
function initVideoLinks() {
    const videoLinks = document.querySelectorAll('.upload-card .watch-btn');
    videoLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href || href.trim() === '' || href === '#') {
                e.preventDefault();
                showToast('Video link coming soon! Add your video link to index.html', 'info');
            }
        });
    });
}

// ============ LOGOUT ============
function logout() {
    // Note: we intentionally do NOT clear localStorage here.
    // Announcements, notes and theme preference must survive logout/login
    // and page refreshes, persisting until manually removed by the user.
    showToast('Logged out successfully!', 'success');
    setTimeout(() => {
        window.location.href = '/';
    }, 1000);
}

// ============ PASSWORD GATE (ANNOUNCEMENTS) ============
// This is not a login system. It is a speed bump so only band members post or
// delete announcements. Change the password in ONE place: ANNOUNCEMENT_PASSWORD.
//
// IMPORTANT: this check runs in the visitor's browser, so the password can be
// found by anyone who views the page source. It stops casual visitors, not a
// determined one. Real protection must be enforced in Supabase (see notes).
const ANNOUNCEMENT_PASSWORD = '2021';
const GATE_UNLOCK_MS = 10 * 60 * 1000;   // stay unlocked for 10 minutes
const GATE_MAX_ATTEMPTS = 5;             // wrong tries before a short lockout
const GATE_LOCKOUT_MS = 30 * 1000;

const announcementGate = {
    unlockedUntil: 0,
    pendingAction: null,
    attempts: 0,
    lockedUntil: 0,
    lastFocus: null
};

function isAnnouncementUnlocked() {
    return Date.now() < announcementGate.unlockedUntil;
}

// Runs `action` straight away if unlocked, otherwise asks for the password first.
function requireAnnouncementAccess(action) {
    if (isAnnouncementUnlocked()) {
        action();
        return;
    }
    openPasswordGate(action);
}

function setGateError(message) {
    const errorEl = document.getElementById('passwordGateError');
    if (errorEl) errorEl.textContent = message || '';
}

function openPasswordGate(action) {
    const modal = document.getElementById('passwordGateModal');
    const input = document.getElementById('passwordGateInput');
    if (!modal || !input) return;

    announcementGate.pendingAction = action;
    announcementGate.lastFocus = document.activeElement;

    input.value = '';
    input.classList.remove('is-error');
    setGateError('');
    // numeric keypad on phones when the password is digits only
    input.inputMode = /^\d+$/.test(ANNOUNCEMENT_PASSWORD) ? 'numeric' : 'text';

    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
    setTimeout(() => input.focus(), 50);
}

function closePasswordGate(restoreFocus = true) {
    const modal = document.getElementById('passwordGateModal');
    if (!modal) return;

    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    announcementGate.pendingAction = null;

    if (restoreFocus && announcementGate.lastFocus && announcementGate.lastFocus.focus) {
        announcementGate.lastFocus.focus();
    }
    announcementGate.lastFocus = null;
}

function submitPasswordGate(e) {
    e.preventDefault();
    const input = document.getElementById('passwordGateInput');
    if (!input) return;

    const now = Date.now();
    if (now < announcementGate.lockedUntil) {
        const secs = Math.ceil((announcementGate.lockedUntil - now) / 1000);
        setGateError('Too many attempts. Try again in ' + secs + 's.');
        return;
    }

    if (input.value.trim() === ANNOUNCEMENT_PASSWORD) {
        announcementGate.unlockedUntil = now + GATE_UNLOCK_MS;
        announcementGate.attempts = 0;
        const action = announcementGate.pendingAction;
        closePasswordGate(false);        // the action usually opens another modal
        if (action) action();
        return;
    }

    announcementGate.attempts += 1;
    if (announcementGate.attempts >= GATE_MAX_ATTEMPTS) {
        announcementGate.attempts = 0;
        announcementGate.lockedUntil = now + GATE_LOCKOUT_MS;
        setGateError('Too many attempts. Try again in ' + (GATE_LOCKOUT_MS / 1000) + 's.');
    } else {
        setGateError('Incorrect password. Please try again.');
    }
    input.value = '';
    // restart the shake animation
    input.classList.remove('is-error');
    void input.offsetWidth;
    input.classList.add('is-error');
    input.focus();
}

function initPasswordGate() {
    const modal = document.getElementById('passwordGateModal');
    const form = document.getElementById('passwordGateForm');
    const closeBtn = document.querySelector('.close-password-gate');
    if (!modal || !form) return;

    form.addEventListener('submit', submitPasswordGate);
    if (closeBtn) closeBtn.addEventListener('click', () => closePasswordGate());

    // click on the dark backdrop closes it
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closePasswordGate();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') closePasswordGate();
    });
}

// ============ INITIALIZE DASHBOARD ============
function initDashboard() {
    console.log('🎵 The Chorus - Dashboard Initialized');

    initThemeSwitcher();
    initNotes();
    initAnnouncements();
    initVideoLinks();
    renderBandMembers();
    initNavigation();
    initSidebarToggle();
    initDropdown();
    initPasswordGate();
    initChangePassword();

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    const closeAppBtn = document.querySelector('.close-app-modal');
    if (closeAppBtn) {
        closeAppBtn.addEventListener('click', closeAppModal);
    }

    window.addEventListener('click', (e) => {
        const appModal = document.getElementById('appModal');
        if (e.target === appModal) {
            closeAppModal();
        }
    });

    console.log('✅ Dashboard fully loaded!');
}

// Make functions available globally
window.launchApp = launchApp;
window.watchVideo = watchVideo;
window.closeAppModal = closeAppModal;
window.deleteAnnouncementById = deleteAnnouncementById;
window.addNewAnnouncement = addNewAnnouncement;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initDashboard);

// ===================================================
// RECORDINGS - AUTO VIDEO THUMBNAILS
// Nothing needs uploading: each .release-card reads its own href and finds the
// image automatically.
//   1. data-thumb="my-image.png"  (OPTIONAL - your own image always wins)
//   2. YouTube / Vimeo            (the video's own thumbnail)
//   3. Any other link, e.g. Facebook / Instagram: best-effort preview image
//      from the page itself via the free Microlink service. Some sites block
//      this; then the card keeps its coloured placeholder (or use data-thumb).
// Size: by default every thumbnail FILLS the card (the original size).
// To show the whole picture instead (nothing cropped, on a soft blurred fill),
// add data-thumb-fit="contain" to that card's <a>.
// Cards with no link yet keep the coloured placeholder and are not clickable.
// ===================================================
function getYouTubeId(url) {
    try {
        const u = new URL(url);
        const host = u.hostname.replace(/^www\.|^m\./, '');
        if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
        if (host === 'youtube.com' || host === 'music.youtube.com' || host === 'youtube-nocookie.com') {
            if (u.pathname === '/watch') return u.searchParams.get('v');
            const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{6,})/);
            return m ? m[1] : null;
        }
    } catch (e) { /* not a valid URL */ }
    return null;
}

function getVimeoUrl(url) {
    try {
        const u = new URL(url);
        const host = u.hostname.replace(/^www\./, '');
        if ((host === 'vimeo.com' || host === 'player.vimeo.com') && /\d{5,}/.test(u.pathname)) return url;
    } catch (e) { /* not a valid URL */ }
    return null;
}

// ---- Best-effort preview image for any other link (Facebook, Instagram...) ----
const PREVIEW_CACHE_PREFIX = 'chorus:preview:';
const PREVIEW_HIT_MS = 12 * 60 * 60 * 1000;   // CDN image links expire, so keep it short
const PREVIEW_MISS_MS = 2 * 60 * 60 * 1000;   // don't hammer the free API after a miss

function isUsablePreviewImage(src) {
    try {
        const u = new URL(src);
        if (u.protocol !== 'https:') return false;
        // generic site artwork (not the video's own frame)
        if (/static\.xx\.fbcdn\.net|rsrc\.php|favicon|logo/i.test(u.href)) return false;
        return true;
    } catch (e) {
        return false;
    }
}

function readPreviewCache(url) {
    try {
        const c = JSON.parse(localStorage.getItem(PREVIEW_CACHE_PREFIX + url) || 'null');
        if (c && Date.now() < c.exp) return { img: c.img || null };
    } catch (e) { /* storage unavailable */ }
    return null;
}

function writePreviewCache(url, img) {
    try {
        localStorage.setItem(
            PREVIEW_CACHE_PREFIX + url,
            JSON.stringify({ img: img, exp: Date.now() + (img ? PREVIEW_HIT_MS : PREVIEW_MISS_MS) })
        );
    } catch (e) { /* storage unavailable */ }
}

function clearPreviewCache(url) {
    try { localStorage.removeItem(PREVIEW_CACHE_PREFIX + url); } catch (e) { /* ignore */ }
}

function fetchPreviewImage(url) {
    const cached = readPreviewCache(url);
    if (cached) return Promise.resolve(cached.img);

    return fetch('https://api.microlink.io/?url=' + encodeURIComponent(url))
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('preview failed'))))
        .then((json) => {
            const src = json && json.data && json.data.image && json.data.image.url;
            const good = src && isUsablePreviewImage(src) ? src : null;
            writePreviewCache(url, good);
            return good;
        })
        .catch(() => null);
}

function applyReleaseThumb(art, src, fallbackSrc, onFail, fit) {
    if (!art || !src) return;
    const img = new Image();
    img.className = fit ? 'release-thumb release-thumb--fit' : 'release-thumb';
    img.alt = '';
    img.decoding = 'async';
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer'; // CDNs often reject images with a foreign referrer

    // Blurred copy of the same image fills the space around a fitted thumbnail
    const bg = fit ? document.createElement('div') : null;
    if (bg) bg.className = 'release-thumb-bg';

    const fail = () => {
        img.remove();                 // keep the coloured placeholder...
        if (bg) bg.remove();
        if (onFail) onFail();         // ...unless there is another source to try
    };
    img.onerror = () => {
        if (fallbackSrc && img.src !== fallbackSrc) {
            img.src = fallbackSrc;
        } else {
            fail();
        }
    };
    img.onload = () => {
        // YouTube serves a 120x90 grey stub when maxresdefault doesn't exist
        if (fallbackSrc && img.naturalWidth <= 120 && img.src !== fallbackSrc) {
            img.src = fallbackSrc;
            return;
        }
        if (bg) bg.style.backgroundImage = 'url("' + img.src.replace(/"/g, '%22') + '")';
        art.classList.add('has-thumb');
        if (fit) art.classList.add('is-fit');
    };
    img.src = src;
    art.insertBefore(img, art.firstChild);
    if (bg) art.insertBefore(bg, art.firstChild);
}

function initReleaseThumbnails() {
    document.querySelectorAll('.release-card').forEach((card) => {
        const href = (card.getAttribute('href') || '').trim();
        const art = card.querySelector('.release-art');

        // Default: fill the card. data-thumb-fit="contain" shows the whole picture.
        const wholeFrame = (card.dataset.thumbFit || '').toLowerCase() === 'contain';
        const manualFit = wholeFrame;
        const autoFit = wholeFrame;

        // No link yet: don't open a blank tab pointing at this same page
        if (!href) {
            // ...but still show the card's own image if it has one
            const emptyThumb = (card.dataset.thumb || '').trim();
            if (emptyThumb) applyReleaseThumb(art, emptyThumb, null, null, manualFit);
            card.classList.add('is-empty');
            card.setAttribute('aria-disabled', 'true');
            card.addEventListener('click', (e) => {
                e.preventDefault();
                showToast('Video coming soon!', 'info');
            });
            return;
        }

        // Automatic thumbnail (YouTube / Vimeo). Used when there is no data-thumb,
        // or when the data-thumb image file is missing or fails to load.
        const useAutoThumb = () => {
            const ytId = getYouTubeId(href);
            if (ytId) {
                applyReleaseThumb(
                    art,
                    'https://i.ytimg.com/vi/' + ytId + '/maxresdefault.jpg',
                    'https://i.ytimg.com/vi/' + ytId + '/mqdefault.jpg',
                    undefined,
                    autoFit
                );
                return;
            }

            const vimeoUrl = getVimeoUrl(href);
            if (vimeoUrl) {
                fetch('https://vimeo.com/api/oembed.json?url=' + encodeURIComponent(vimeoUrl))
                    .then((r) => (r.ok ? r.json() : Promise.reject(new Error('oEmbed failed'))))
                    .then((data) => {
                        if (data && data.thumbnail_url) {
                            applyReleaseThumb(art, data.thumbnail_url.replace(/_\d+x\d+/, '_1280'), null, null, autoFit);
                        }
                    })
                    .catch(() => { /* keep the placeholder */ });
                return;
            }

            // Facebook, Instagram, anything else: ask the page for its preview image
            fetchPreviewImage(href).then((src) => {
                if (!src) return;
                applyReleaseThumb(art, src, null, () => clearPreviewCache(href), autoFit);
            });
        };

        const manual = (card.dataset.thumb || '').trim();
        if (manual) {
            applyReleaseThumb(art, manual, null, useAutoThumb, manualFit);
        } else {
            useAutoThumb();
        }
    });
}

document.addEventListener('DOMContentLoaded', initReleaseThumbnails);

// ===================================================
// HEADER THEME
// The header starts light-on-dark over the hero. Once the page scrolls past
// the hero it sits over pale sections, so it flips to dark-on-light
// (.site-header.is-light) to stay readable on desktop and mobile.
// ===================================================
function initHeaderTheme() {
    const header = document.getElementById('siteHeader');
    const hero = document.querySelector('.hero-scene');
    if (!header || !hero) return;

    let ticking = false;
    const update = () => {
        ticking = false;
        const heroBottom = hero.offsetTop + hero.offsetHeight;
        header.classList.toggle('is-light', window.scrollY + header.offsetHeight >= heroBottom);
    };
    const onScroll = () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('orientationchange', onScroll);
    update();
}

document.addEventListener('DOMContentLoaded', initHeaderTheme);