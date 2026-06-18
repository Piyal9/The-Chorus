// ============ GLOBAL VARIABLES ============
let currentUser = {
    name: 'The Chorus',
    email: 'fan@thechorus.com',
    user_id: 'TC001',
    mobile: '+91 9073556848'
};
let allAccounts = [];
let filteredAccounts = [];
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

function loadAnnouncements() {
    const saved = localStorage.getItem('rehearsalAnnouncements');
    if (saved) {
        try {
            announcements = JSON.parse(saved);
        } catch(e) {
            announcements = [...defaultAnnouncements];
            saveAnnouncements();
        }
    } else {
        announcements = [...defaultAnnouncements];
        saveAnnouncements();
    }
    renderAnnouncements();
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

function deleteAnnouncementById(id) {
    announcements = announcements.filter(a => a.id !== id);
    saveAnnouncements();
    renderAnnouncements();
    showToast('Announcement deleted successfully!', 'success');
}

function addNewAnnouncement(week, month, message) {
    const newId = Date.now();
    announcements.push({
        id: newId,
        week: week,
        month: month,
        message: message,
        date: new Date().toISOString()
    });
    saveAnnouncements();
    renderAnnouncements();
    showToast('Announcement added successfully!', 'success');
}

function initAnnouncements() {
    const addAnnouncementBtn = document.getElementById('addAnnouncementBtn');
    const addAnnouncementModal = document.getElementById('addAnnouncementModal');
    const closeAnnouncementModal = document.querySelector('.close-announcement-modal');
    const saveAnnouncementBtn = document.getElementById('saveAnnouncementBtn');
    
    loadAnnouncements();
    
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
        saveAnnouncementBtn.onclick = function() {
            const week = document.getElementById('announcementWeek').value;
            const month = document.getElementById('announcementMonth').value;
            const message = document.getElementById('announcementMessage').value;
            
            if (week && month && message) {
                addNewAnnouncement(week, month, message);
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
    const userEmail = currentUser?.email || 'fan@thechorus.com';
    const userId = currentUser?.user_id || 'TC001';
    const userAvatar = userName.substring(0, 2).toUpperCase();
    const userMobile = currentUser?.mobile || '+91 9073556848';
    
    const userNameEl = document.getElementById('userName');
    const userEmailEl = document.getElementById('userEmail');
    const userAvatarEl = document.getElementById('userAvatar');
    const welcomeNameEl = document.getElementById('welcomeName');
    
    if (userNameEl) userNameEl.textContent = userName;
    if (userEmailEl) userEmailEl.textContent = userEmail;
    if (userAvatarEl) userAvatarEl.textContent = userAvatar;
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
}

// ============ LOAD ALL ACCOUNTS (MOCK DATA) ============
function loadAllAccounts() {
    // Mock fan accounts for demonstration
    allAccounts = [
        { user_id: 'TC001', name: 'The Chorus', email: 'fan@thechorus.com', mobile: '+91 9073556848', super_user: 'Y', avatar: 'TC' },
        { user_id: 'TC002', name: 'Rahul Sharma', email: 'rahul@email.com', mobile: '+91 9876543210', super_user: 'N', avatar: 'RS' },
        { user_id: 'TC003', name: 'Priya Patel', email: 'priya@email.com', mobile: '+91 9876543211', super_user: 'N', avatar: 'PP' },
        { user_id: 'TC004', name: 'Amit Kumar', email: 'amit@email.com', mobile: '+91 9876543212', super_user: 'N', avatar: 'AK' },
        { user_id: 'TC005', name: 'Sneha Reddy', email: 'sneha@email.com', mobile: '+91 9876543213', super_user: 'N', avatar: 'SR' }
    ];
    filteredAccounts = [...allAccounts];
    renderAccountsList(filteredAccounts);
}

// ============ RENDER ACCOUNTS LIST ============
function renderAccountsList(accounts) {
    const container = document.getElementById('accountsList');
    if (!container) return;
    
    const accountCount = document.getElementById('accountCount');
    if (accountCount) accountCount.textContent = accounts.length;
    
    if (!accounts || accounts.length === 0) {
        container.innerHTML = `
            <div class="empty-accounts">
                <i class="fas fa-user-slash"></i>
                <p>No Account Found</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    accounts.forEach(account => {
        const isCurrentUser = currentUser && account.user_id === currentUser.user_id;
        const badgeClass = account.super_user === 'Y' ? 'super' : '';
        const badgeText = account.super_user === 'Y' ? 'Super' : 'User';
        const avatar = account.avatar || (account.name || 'U').substring(0, 2).toUpperCase();
        
        html += `
            <div class="account-item ${isCurrentUser ? 'active' : ''}" data-user-id="${account.user_id}">
                <div class="account-avatar">${avatar}</div>
                <div class="account-info">
                    <div class="account-name">${account.name || 'User'}</div>
                    <div class="account-email">${account.email || account.user_id}</div>
                </div>
                <div class="account-badge ${badgeClass}">${badgeText}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    document.querySelectorAll('.account-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const userId = item.getAttribute('data-user-id');
            const account = allAccounts.find(a => a.user_id === userId);
            if (account) {
                showToast(`Viewing account: ${account.name}`, 'info');
            }
        });
    });
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
    
    const searchInput = document.getElementById('accountSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            if (!term.trim()) {
                filteredAccounts = [...allAccounts];
            } else {
                filteredAccounts = allAccounts.filter(account => 
                    (account.name?.toLowerCase().includes(term)) ||
                    (account.email?.toLowerCase().includes(term)) ||
                    (account.user_id?.toLowerCase().includes(term))
                );
            }
            renderAccountsList(filteredAccounts);
        });
    }
    
    const viewAllBtn = document.getElementById('viewAllUsersBtn');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => {
            closeDropdown();
            showToast('Showing all fans', 'info');
        });
    }
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
            window.open('https://example.com/book-tickets', '_blank');
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
    localStorage.clear();
    sessionStorage.clear();
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
    updateUserInterface();
    loadAllAccounts();
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