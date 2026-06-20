// ============ GLOBAL VARIABLES ============
let currentUser = {
    name: 'The Chorus',
    email: 'thechorusbandkolkata@gmail.com',
    user_id: 'TC001',
    mobile: '+91 9073556848'
};
let notes = [];
let announcements = [];

// ============ SHARED CLOUD STORAGE (cross-device announcements) ============
// Automatically creates and manages a free JSON storage box for syncing
// announcements across all devices. No setup HTML file needed!
const STORAGE_KEY = 'announcements_storage_id';
const MAX_ANNOUNCEMENTS = 10;
const ANNOUNCEMENTS_REFRESH_MS = 20000;

// Get or create storage ID
let ANNOUNCEMENTS_BLOB_ID = localStorage.getItem(STORAGE_KEY);
let isAnnouncementsSetUp = false;

// Try to get existing storage or create new one
async function initializeStorage() {
    if (ANNOUNCEMENTS_BLOB_ID) {
        isAnnouncementsSetUp = true;
        return ANNOUNCEMENTS_BLOB_ID;
    }

    try {
        // Create a new storage blob
        const response = await fetch('https://jsonblob.com/api/jsonBlob', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify([])
        });

        if (!response.ok) throw new Error('Failed to create storage');

        const blobId = response.headers.get('Location')?.split('/').pop();
        if (!blobId) throw new Error('No ID returned');

        // Save the ID
        ANNOUNCEMENTS_BLOB_ID = blobId;
        localStorage.setItem(STORAGE_KEY, blobId);
        isAnnouncementsSetUp = true;
        
        console.log('✅ Shared storage created! ID:', blobId);
        return blobId;
    } catch (error) {
        console.warn('Could not create shared storage:', error);
        isAnnouncementsSetUp = false;
        return null;
    }
}

function getApiUrl() {
    return ANNOUNCEMENTS_BLOB_ID 
        ? `https://jsonblob.com/api/jsonBlob/${ANNOUNCEMENTS_BLOB_ID}`
        : null;
}

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
        week: 'Week 1',
        month: 'March 2025',
        message: '🎵 New song rehearsal scheduled for Friday at 6 PM. All band members please be present.',
        date: new Date().toISOString()
    },
    {
        id: 2,
        week: 'Week 2',
        month: 'March 2025',
        message: '🥁 Sound check for upcoming concert. Equipment setup at 4 PM.',
        date: new Date().toISOString()
    },
    {
        id: 3,
        week: 'Week 3',
        month: 'March 2025',
        message: '🎸 New album recording session. Studio booked for whole day Saturday.',
        date: new Date().toISOString()
    },
    {
        id: 4,
        week: 'Week 4',
        month: 'March 2025',
        message: '🎤 Final rehearsal before the big show! Don\'t miss it.',
        date: new Date().toISOString()
    }
];

// ============ BAND MUSICIAN PROFILES ============
const bandMembers = [
    { id: 1, name: 'PINKU DAS', role: 'Synth', photo: 'pinku.png' },
    { id: 2, name: 'BIJAY', role: 'Lead Guitar', photo: 'bijay.png' },
    { id: 3, name: 'NONE', role: 'Rhythm Guitar', photo: 'PZ.png' },
    { id: 4, name: 'PIYAL', role: 'Bass', photo: 'piyal.png' },
    { id: 5, name: 'ABIR', role: 'Drums', photo: 'abir.png' },
    { id: 6, name: 'NONE', role: 'Lead Vocals', photo: 'fav.png' },
    { id: 7, name: 'BISWANATH', role: 'Camera', photo: 'biswa.png' },
    { id: 8, name: 'BABU', role: 'Percussion', photo: 'babu.png' }
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

// ============ CLOUD SYNC FUNCTIONS ============
async function loadAnnouncements(showLoadErrors = true) {
    // Load from cache first
    const cached = localStorage.getItem('rehearsalAnnouncementsCache');
    if (cached) {
        try {
            announcements = JSON.parse(cached);
        } catch(e) {
            announcements = [...defaultAnnouncements];
        }
    } else {
        announcements = [...defaultAnnouncements];
    }
    renderAnnouncements();

    // If no storage ID, try to create one
    if (!ANNOUNCEMENTS_BLOB_ID) {
        await initializeStorage();
    }

    if (!isAnnouncementsSetUp) {
        console.log('📝 Using local announcements only (no cloud sync)');
        return;
    }

    const apiUrl = getApiUrl();
    if (!apiUrl) return;

    try {
        const res = await fetch(apiUrl, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load shared announcements');
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
            announcements = data;
            localStorage.setItem('rehearsalAnnouncementsCache', JSON.stringify(announcements));
            renderAnnouncements();
            console.log('🔄 Announcements synced from cloud');
        }
    } catch (e) {
        console.warn('Could not reach shared storage, showing cached announcements.', e);
        if (showLoadErrors) {
            showToast('Could not sync with cloud (offline?) — showing saved version', 'error');
        }
    }
}

async function saveAnnouncements() {
    // Keep only the most recent MAX_ANNOUNCEMENTS entries
    if (announcements.length > MAX_ANNOUNCEMENTS) {
        announcements = announcements
            .slice()
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(announcements.length - MAX_ANNOUNCEMENTS);
        renderAnnouncements();
    }

    // Save to cache
    localStorage.setItem('rehearsalAnnouncementsCache', JSON.stringify(announcements));

    // Try to save to cloud
    if (!isAnnouncementsSetUp) {
        console.log('📝 Saved to local cache only (cloud not available)');
        return;
    }

    const apiUrl = getApiUrl();
    if (!apiUrl) return;

    try {
        const res = await fetch(apiUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(announcements)
        });
        if (!res.ok) throw new Error('Failed to save to cloud');
        console.log('☁️ Announcements saved to cloud');
    } catch (e) {
        console.warn('Could not save to cloud — saved locally only.', e);
        showToast('Could not sync to cloud (offline?) — saved locally only', 'error');
    }
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
                    <i class="fas fa-calendar-week"></i>
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

async function deleteAnnouncementById(id) {
    announcements = announcements.filter(a => a.id !== id);
    renderAnnouncements();
    await saveAnnouncements();
    showToast('Announcement deleted successfully!', 'success');
}

async function addNewAnnouncement(week, month, message) {
    const newId = Date.now();
    announcements.push({
        id: newId,
        week: week,
        month: month,
        message: message,
        date: new Date().toISOString()
    });
    renderAnnouncements();
    await saveAnnouncements();
    showToast('✅ Announcement added! It will sync to other devices.', 'success');
}

function initAnnouncements() {
    const addAnnouncementBtn = document.getElementById('addAnnouncementBtn');
    const addAnnouncementModal = document.getElementById('addAnnouncementModal');
    const closeAnnouncementModal = document.querySelector('.close-announcement-modal');
    const saveAnnouncementBtn = document.getElementById('saveAnnouncementBtn');
    
    // Initialize storage first, then load announcements
    initializeStorage().then(() => {
        loadAnnouncements();
    });
    
    if (addAnnouncementBtn) {
        addAnnouncementBtn.onclick = function() {
            if (addAnnouncementModal) {
                addAnnouncementModal.style.display = 'block';
            }
        }
    }
    
    if (closeAnnouncementModal) {
        closeAnnouncementModal.onclick = function() {
            if (addAnnouncementModal) {
                addAnnouncementModal.style.display = 'none';
            }
        }
    }
    
    if (saveAnnouncementBtn) {
        const originalBtnText = saveAnnouncementBtn.textContent;
        saveAnnouncementBtn.onclick = async function() {
            const week = document.getElementById('announcementWeek').value;
            const month = document.getElementById('announcementMonth').value;
            const message = document.getElementById('announcementMessage').value;
            
            if (week && month && message) {
                saveAnnouncementBtn.disabled = true;
                saveAnnouncementBtn.textContent = 'Saving...';
                await addNewAnnouncement(week, month, message);
                saveAnnouncementBtn.disabled = false;
                saveAnnouncementBtn.textContent = originalBtnText;
                if (addAnnouncementModal) {
                    addAnnouncementModal.style.display = 'none';
                }
                document.getElementById('announcementWeek').value = '';
                document.getElementById('announcementMonth').value = '';
                document.getElementById('announcementMessage').value = '';
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

    // Auto-sync with other devices
    if (isAnnouncementsSetUp) {
        setInterval(() => loadAnnouncements(false), ANNOUNCEMENTS_REFRESH_MS);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') loadAnnouncements(false);
        });
    }
}

// ============ NOTES FUNCTIONALITY ============
function loadNotes() {
    const savedNotes = localStorage.getItem('userNotes');
    if (savedNotes) {
        try {
            notes = JSON.parse(savedNotes);
        } catch(e) {
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

// ============ UPDATE USER INTERFACE ============
function updateUserInterface() {
    const userName = currentUser?.name || 'The Chorus';
    const userEmail = currentUser?.email || 'thechorusbandkolkata@gmail.com';
    const userId = currentUser?.user_id || 'TC001';
    const userAvatar = userName.substring(0, 2).toUpperCase();
    const userMobile = currentUser?.mobile || '+91 9073556848';
    
    const userNameEl = document.getElementById('userName');
    const userEmailEl = document.getElementById('userEmail');
    const userAvatarEl = document.getElementById('userAvatar');
    const welcomeNameEl = document.getElementById('welcomeName');
    
    if (userNameEl) userNameEl.textContent = userName;
    if (userEmailEl) userEmailEl.textContent = userEmail;
    if (userAvatarEl && !userAvatarEl.querySelector('img')) {
        userAvatarEl.textContent = userAvatar;
    }
    if (welcomeNameEl) welcomeNameEl.textContent = userName.split(' ')[0];
    
    const profileNameEl = document.getElementById('profileName');
    const profileAvatarEl = document.getElementById('profileAvatar');
    const profileUserIdEl = document.getElementById('profileUserId');
    const profileEmailEl = document.getElementById('profileEmail');
    const profileMobileEl = document.getElementById('profileMobile');
    const profileJoinDateEl = document.getElementById('profileJoinDate');
    
    if (profileNameEl) profileNameEl.textContent = userName;
    if (profileAvatarEl) profileAvatarEl.textContent = userAvatar;
    if (profileUserIdEl) profileUserIdEl.textContent = userId;
    if (profileEmailEl) profileEmailEl.textContent = userEmail;
    if (profileMobileEl) profileMobileEl.textContent = userMobile;
    if (profileJoinDateEl) profileJoinDateEl.textContent = new Date().toLocaleDateString();
    
    const settingsName = document.getElementById('settingsName');
    const settingsEmail = document.getElementById('settingsEmail');
    const settingsMobile = document.getElementById('settingsMobile');
    
    if (settingsName) settingsName.value = userName;
    if (settingsEmail) settingsEmail.value = userEmail;
    if (settingsMobile) settingsMobile.value = currentUser?.mobile || '';

    renderAccountDropdown();
}

// ============ SYNC SINGLE ACCOUNT INTO DROPDOWN ============
function renderAccountDropdown() {
    const userName = currentUser?.name || 'The Chorus';
    const userEmail = currentUser?.email || 'thechorusbandkolkata@gmail.com';
    const userAvatar = userName.substring(0, 2).toUpperCase();

    const dropdownAvatarEl = document.getElementById('dropdownAvatar');
    const dropdownNameEl = document.getElementById('dropdownName');
    const dropdownEmailEl = document.getElementById('dropdownEmail');

    if (dropdownAvatarEl && !dropdownAvatarEl.querySelector('img')) {
        dropdownAvatarEl.textContent = userAvatar;
    }
    if (dropdownNameEl) dropdownNameEl.textContent = userName;
    if (dropdownEmailEl) dropdownEmailEl.textContent = userEmail;
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
        });
    });
}

// ============ SIDEBAR TOGGLE ============
function initSidebarToggle() {
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (toggle) {
        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
        });
    }
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

// ============ SETTINGS FORM ============
function initSettings() {
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newName = document.getElementById('settingsName').value;
            const newMobile = document.getElementById('settingsMobile').value;
            if (currentUser) {
                currentUser.name = newName;
                currentUser.mobile = newMobile;
                localStorage.setItem('userData', JSON.stringify(currentUser));
                updateUserInterface();
            }
            showToast('Profile updated successfully!', 'success');
        });
    }
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

// ============ LOGOUT ============
function logout() {
    showToast('Logged out successfully!', 'success');
    setTimeout(() => {
        window.location.href = '/';
    }, 1000);
}

// ============ INITIALIZE DASHBOARD ============
function initDashboard() {
    console.log('🎵 The Chorus - Dashboard Initialized');
    
    // Load saved user data
    const savedUser = localStorage.getItem('userData');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
        } catch(e) {}
    }
    
    initThemeSwitcher();
    initNotes();
    initAnnouncements();
    renderBandMembers();
    updateUserInterface();
    initNavigation();
    initSidebarToggle();
    initDropdown();
    initSettings();
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
    
    // Show storage status
    if (ANNOUNCEMENTS_BLOB_ID) {
        console.log('☁️ Cloud sync enabled - ID:', ANNOUNCEMENTS_BLOB_ID);
    } else {
        console.log('📝 Cloud sync will be set up automatically when adding announcements');
    }
    
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