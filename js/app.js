/**
 * EduAssign - Hệ thống Giao & Nộp Bài Tập Thông Minh
 * Main Application Logic (v3.0)
 * Phân quyền tài khoản & mật khẩu - Giáo viên độc quyền cấp tài khoản học sinh
 */

// State Management
const STATE = {
    accounts: [],           // Teacher and student accounts
    currentUser: null,      // Logged in account object
    assignments: [],
    activeExam: null,       // { assignmentId, startTime, elapsedSeconds }
    selectedAssignmentForTracking: null,
    editingAssignmentId: null,
    editingStudentUsername: null,
    filterStatus: 'all',    // 'all' | 'active' | 'expired'
    currentTeacherTab: 'assignments', // 'assignments' | 'students'
    authTabRole: 'teacher', // 'teacher' | 'student'
    teacherPendingFiles: [],
    studentPendingFiles: []
};

// ==========================================================================
// Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    loadAccounts();
    loadAssignments();
    setupEventListeners();
    startClockTick();

    // Check existing auth session
    const savedUser = localStorage.getItem('edu_auth_user_v3');
    if (savedUser) {
        try {
            STATE.currentUser = JSON.parse(savedUser);
            // Verify account still exists
            const exists = STATE.accounts.find(a => a.username.toLowerCase() === STATE.currentUser.username.toLowerCase());
            if (exists) {
                STATE.currentUser = exists;
            }
        } catch (e) {
            STATE.currentUser = null;
        }
    }

    if (!STATE.currentUser) {
        showAuthOverlay();
    } else {
        hideAuthOverlay();
        renderAppForCurrentUser();
    }
});

// ==========================================================================
// Data Persistence (Accounts & Assignments)
// ==========================================================================
function loadAccounts() {
    const saved = localStorage.getItem('edu_accounts_v3');
    if (saved) {
        try {
            STATE.accounts = JSON.parse(saved);
        } catch (e) {
            STATE.accounts = generateSampleAccounts();
            saveAccounts();
        }
    } else {
        STATE.accounts = generateSampleAccounts();
        saveAccounts();
    }
}

function saveAccounts() {
    localStorage.setItem('edu_accounts_v3', JSON.stringify(STATE.accounts));
}

function loadAssignments() {
    const saved = localStorage.getItem('edu_assignments_v3');
    if (saved) {
        try {
            STATE.assignments = JSON.parse(saved);
        } catch (e) {
            STATE.assignments = generateSampleData();
            saveAssignments();
        }
    } else {
        STATE.assignments = generateSampleData();
        saveAssignments();
    }
}

function saveAssignments() {
    localStorage.setItem('edu_assignments_v3', JSON.stringify(STATE.assignments));
}

function resetSampleData() {
    if (confirm('Bạn có chắc muốn đặt lại dữ liệu mẫu ban đầu? Tất cả tài khoản học sinh và bài tập sẽ được khôi phục.')) {
        STATE.accounts = generateSampleAccounts();
        STATE.assignments = generateSampleData();
        saveAccounts();
        saveAssignments();
        showToast('Đã khôi phục dữ liệu mẫu thành công!', 'success');
        renderAppForCurrentUser();
    }
}

// ==========================================================================
// Authentication System (Login & Logout)
// ==========================================================================
function showAuthOverlay() {
    const overlay = document.getElementById('auth-overlay');
    if (overlay) overlay.style.display = 'flex';
}

function hideAuthOverlay() {
    const overlay = document.getElementById('auth-overlay');
    if (overlay) overlay.style.display = 'none';
}

function setAuthRoleTab(role) {
    STATE.authTabRole = role;
    document.querySelectorAll('.auth-role-tab').forEach(b => b.classList.remove('active'));
    document.getElementById(`auth-tab-${role}`).classList.add('active');

    const usernameInput = document.getElementById('auth-username-input');
    if (role === 'teacher') {
        usernameInput.placeholder = 'Ví dụ: giaovien';
    } else {
        usernameInput.placeholder = 'Ví dụ: hs_khang, hs_phuong...';
    }

    const err = document.getElementById('auth-error-banner');
    if (err) err.style.display = 'none';
}

function handleAuthSubmit(e) {
    if (e) e.preventDefault();
    const username = document.getElementById('auth-username-input').value.trim();
    const password = document.getElementById('auth-password-input').value.trim();
    const errBanner = document.getElementById('auth-error-banner');
    const errText = document.getElementById('auth-error-text');

    if (!username || !password) {
        errText.textContent = 'Vui lòng điền đầy đủ tên đăng nhập và mật khẩu!';
        errBanner.style.display = 'flex';
        return;
    }

    // Authenticate against STATE.accounts
    const user = STATE.accounts.find(
        acc => acc.username.toLowerCase() === username.toLowerCase() && acc.password === password
    );

    if (!user) {
        errText.textContent = 'Tên đăng nhập hoặc mật khẩu không chính xác!';
        errBanner.style.display = 'flex';
        return;
    }

    // Role verification
    if (user.role !== STATE.authTabRole) {
        errText.textContent = `Tài khoản này thuộc vai trò ${user.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}. Vui lòng chọn tab tương ứng để đăng nhập!`;
        errBanner.style.display = 'flex';
        return;
    }

    // Success
    errBanner.style.display = 'none';
    STATE.currentUser = user;
    localStorage.setItem('edu_auth_user_v3', JSON.stringify(user));
    hideAuthOverlay();

    showToast(`Chào mừng ${user.fullName} (${user.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}) đã đăng nhập!`, 'success');
    renderAppForCurrentUser();
}

function quickLoginAs(username, password) {
    document.getElementById('auth-username-input').value = username;
    document.getElementById('auth-password-input').value = password;

    const user = STATE.accounts.find(acc => acc.username === username);
    if (user) {
        setAuthRoleTab(user.role);
    }

    handleAuthSubmit();
}

function handleLogout() {
    if (confirm('Bạn có chắc muốn đăng xuất khỏi hệ thống?')) {
        STATE.currentUser = null;
        STATE.activeExam = null;
        localStorage.removeItem('edu_auth_user_v3');
        document.getElementById('auth-username-input').value = '';
        document.getElementById('auth-password-input').value = '';
        showAuthOverlay();
    }
}

function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
    } else {
        input.type = 'password';
        btn.textContent = '👁️';
    }
}

// ==========================================================================
// App Navigation & Role Dispatching
// ==========================================================================
function renderAppForCurrentUser() {
    if (!STATE.currentUser) {
        showAuthOverlay();
        return;
    }

    // Update Navigation User Badge
    const navBadge = document.getElementById('nav-user-badge');
    const avatarEl = document.getElementById('user-badge-avatar');
    const nameEl = document.getElementById('user-badge-name');
    const roleEl = document.getElementById('user-badge-role');
    const navTeacherMenu = document.getElementById('nav-teacher-menu');

    if (navBadge) navBadge.style.display = 'flex';
    if (nameEl) nameEl.textContent = STATE.currentUser.fullName;
    
    if (STATE.currentUser.role === 'teacher') {
        if (avatarEl) {
            avatarEl.textContent = 'GV';
            avatarEl.className = 'user-account-avatar teacher';
        }
        if (roleEl) roleEl.textContent = 'Giáo Viên (Quản trị)';
        if (navTeacherMenu) navTeacherMenu.style.display = 'flex';

        // Render teacher views
        document.getElementById('view-teacher').classList.add('active');
        document.getElementById('view-student').classList.remove('active');
        document.getElementById('view-exam').classList.remove('active');

        switchTeacherTab(STATE.currentTeacherTab);
    } else {
        // Student role
        if (avatarEl) {
            avatarEl.textContent = STATE.currentUser.fullName.charAt(0).toUpperCase();
            avatarEl.className = 'user-account-avatar';
        }
        if (roleEl) roleEl.textContent = `Học sinh • Lớp ${STATE.currentUser.className || '12A1'}`;
        if (navTeacherMenu) navTeacherMenu.style.display = 'none';

        document.getElementById('view-teacher').classList.remove('active');
        if (STATE.activeExam) {
            document.getElementById('view-student').classList.remove('active');
            document.getElementById('view-exam').classList.add('active');
            renderExamView();
        } else {
            document.getElementById('view-student').classList.add('active');
            document.getElementById('view-exam').classList.remove('active');
            renderStudentView();
        }
    }
}

function navigateHome() {
    if (!STATE.currentUser) return;
    if (STATE.currentUser.role === 'teacher') {
        switchTeacherTab('assignments');
    } else {
        STATE.activeExam = null;
        renderStudentView();
    }
}

function switchTeacherTab(tab) {
    STATE.currentTeacherTab = tab;
    const tabHwBtn = document.getElementById('btn-tab-teacher-hw');
    const tabStudentsBtn = document.getElementById('btn-tab-teacher-students');
    const subtabHw = document.getElementById('teacher-subtab-assignments');
    const subtabStudents = document.getElementById('teacher-subtab-students');

    if (tab === 'assignments') {
        if (tabHwBtn) tabHwBtn.classList.add('active');
        if (tabStudentsBtn) tabStudentsBtn.classList.remove('active');
        if (subtabHw) subtabHw.style.display = 'block';
        if (subtabStudents) subtabStudents.style.display = 'none';
        renderTeacherView();
    } else {
        if (tabHwBtn) tabHwBtn.classList.remove('active');
        if (tabStudentsBtn) tabStudentsBtn.classList.add('active');
        if (subtabHw) subtabHw.style.display = 'none';
        if (subtabStudents) subtabStudents.style.display = 'block';
        renderStudentsAccountTable();
    }
}

// ==========================================================================
// Teacher Student Account Provisioning (Cấp & Quản lý Tài Khoản Học Sinh)
// ==========================================================================
function renderStudentsAccountTable() {
    const tbody = document.getElementById('students-accounts-table-body');
    if (!tbody) return;

    const students = STATE.accounts.filter(a => a.role === 'student');

    // Update stats
    const totalStudentsEl = document.getElementById('stat-total-students');
    if (totalStudentsEl) totalStudentsEl.textContent = students.length;

    if (students.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                    Chưa có tài khoản học sinh nào được cấp. Bấm nút <strong>"➕ Cấp tài khoản mới cho học sinh"</strong> ở trên để tạo.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = students.map((std, idx) => {
        const initials = std.fullName ? std.fullName.charAt(0).toUpperCase() : 'H';
        
        // Count submissions of this student
        let subCount = 0;
        STATE.assignments.forEach(asg => {
            if (asg.submissions) {
                subCount += asg.submissions.filter(s => 
                    (s.studentUsername && s.studentUsername.toLowerCase() === std.username.toLowerCase()) ||
                    s.studentName.toLowerCase().trim() === std.fullName.toLowerCase().trim()
                ).length;
            }
        });

        const createdFormatted = std.createdAt ? formatDateTime(new Date(std.createdAt)) : 'Mặc định';

        return `
            <tr>
                <td><strong>#${idx + 1}</strong></td>
                <td>
                    <div class="student-cell">
                        <div class="avatar-circle">${initials}</div>
                        <div>
                            <div class="student-name-text">${escapeHtml(std.fullName)}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">ID: ${std.id}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="subject-badge" style="font-size: 0.75rem;">${escapeHtml(std.className || '12A1')}</span>
                </td>
                <td>
                    <code class="credentials-tag">${escapeHtml(std.username)}</code>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.4rem;">
                        <code class="credentials-tag" style="color: #059669;">${escapeHtml(std.password)}</code>
                        <button class="btn-secondary btn-sm" onclick="copyStudentCredentials('${escapeHtml(std.fullName)}', '${escapeHtml(std.username)}', '${escapeHtml(std.password)}')" title="Sao chép thông tin để gửi cho học sinh">
                            📋 Sao chép
                        </button>
                    </div>
                </td>
                <td>
                    <span class="duration-badge">📝 ${subCount} bài nộp</span>
                </td>
                <td>
                    <span class="time-stamp-text">${createdFormatted}</span>
                </td>
                <td style="text-align: right;">
                    <div style="display: flex; justify-content: flex-end; gap: 0.4rem;">
                        <button class="btn-secondary btn-sm" onclick="openEditStudentPasswordModal('${std.username}')" title="Đổi mật khẩu cho học sinh">
                            🔑 Đổi MK
                        </button>
                        <button class="btn-danger btn-sm" onclick="handleDeleteStudent('${std.username}')" title="Xóa tài khoản này">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function openCreateStudentModal() {
    document.getElementById('new-student-fullname').value = '';
    document.getElementById('new-student-class').value = '12A1';
    document.getElementById('new-student-username').value = '';
    document.getElementById('new-student-password').value = '123';

    // Auto-generate username suggestion on name input
    const nameInput = document.getElementById('new-student-fullname');
    nameInput.oninput = (e) => {
        const val = e.target.value.trim().toLowerCase();
        const slug = removeVietnameseTones(val).replace(/\s+/g, '_');
        document.getElementById('new-student-username').value = slug ? `hs_${slug}` : '';
    };

    openModal('modal-create-student');
}

function handleSaveNewStudent() {
    const fullName = document.getElementById('new-student-fullname').value.trim();
    const className = document.getElementById('new-student-class').value.trim();
    const username = document.getElementById('new-student-username').value.trim().toLowerCase();
    const password = document.getElementById('new-student-password').value.trim();

    if (!fullName) {
        showToast('Vui lòng nhập họ tên học sinh', 'danger');
        return;
    }
    if (!username) {
        showToast('Vui lòng nhập tên đăng nhập cho học sinh', 'danger');
        return;
    }
    if (!password) {
        showToast('Vui lòng nhập mật khẩu khởi tạo', 'danger');
        return;
    }

    // Check duplicate username
    const exists = STATE.accounts.find(a => a.username.toLowerCase() === username);
    if (exists) {
        showToast(`Tên đăng nhập "${username}" đã tồn tại! Vui lòng chọn tên đăng nhập khác.`, 'danger');
        return;
    }

    const newAcc = {
        id: 'acc_student_' + Date.now(),
        username: username,
        password: password,
        fullName: fullName,
        className: className || '12A1',
        role: 'student',
        createdAt: new Date().toISOString()
    };

    STATE.accounts.push(newAcc);
    saveAccounts();

    closeModal('modal-create-student');
    showToast(`Đã cấp tài khoản thành công cho học sinh: ${fullName}!`, 'success');
    renderStudentsAccountTable();
}

function openEditStudentPasswordModal(username) {
    const student = STATE.accounts.find(a => a.username === username);
    if (!student) return;

    STATE.editingStudentUsername = username;
    document.getElementById('edit-pwd-student-name').textContent = `${student.fullName} (Username: ${student.username})`;
    document.getElementById('edit-pwd-input').value = student.password;

    openModal('modal-edit-password');
}

function handleSaveStudentPassword() {
    const newPwd = document.getElementById('edit-pwd-input').value.trim();
    if (!newPwd) {
        showToast('Mật khẩu không được để trống', 'danger');
        return;
    }

    const student = STATE.accounts.find(a => a.username === STATE.editingStudentUsername);
    if (!student) return;

    student.password = newPwd;
    saveAccounts();

    closeModal('modal-edit-password');
    showToast(`Đã cập nhật mật khẩu mới cho ${student.fullName}!`, 'success');
    renderStudentsAccountTable();
}

function handleDeleteStudent(username) {
    const student = STATE.accounts.find(a => a.username === username);
    if (!student) return;

    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản của học sinh ${student.fullName} (${student.username})?`)) {
        STATE.accounts = STATE.accounts.filter(a => a.username !== username);
        saveAccounts();
        showToast(`Đã xóa tài khoản học sinh ${student.fullName}`, 'info');
        renderStudentsAccountTable();
    }
}

function copyStudentCredentials(fullName, username, password) {
    const text = `Thông tin đăng nhập làm bài tập EduAssign:\n- Học sinh: ${fullName}\n- Tên đăng nhập: ${username}\n- Mật khẩu: ${password}\n- Đường link: ${window.location.href}`;
    navigator.clipboard.writeText(text).then(() => {
        showToast(`Đã sao chép tài khoản của ${fullName} vào bộ nhớ tạm! Bạn có thể dán gửi cho học sinh.`, 'success');
    }).catch(() => {
        alert(text);
    });
}

function removeVietnameseTones(str) {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[^a-zA-Z0-9 ]/g, '');
}

// ==========================================================================
// Real-time Clock & Ticker
// ==========================================================================
function startClockTick() {
    updateClockAndTimers();
    setInterval(updateClockAndTimers, 1000);
}

function updateClockAndTimers() {
    const now = new Date();
    const clockEl = document.getElementById('nav-live-clock');
    if (clockEl) {
        clockEl.textContent = formatDateTime(now, true);
    }

    updateCardCountdowns(now);

    if (STATE.activeExam) {
        updateExamTimers(now);
    }
}

function updateCardCountdowns(now) {
    document.querySelectorAll('[data-countdown-id]').forEach(el => {
        const id = el.getAttribute('data-countdown-id');
        const assignment = STATE.assignments.find(a => a.id === id);
        if (!assignment) return;

        const due = new Date(assignment.dueDate);
        const diff = due.getTime() - now.getTime();

        if (diff <= 0) {
            el.className = 'countdown-highlight countdown-expired';
            el.innerHTML = '<span class="status-dot"></span> Đã hết hạn nộp';
            const badge = document.querySelector(`[data-status-badge="${id}"]`);
            if (badge && !badge.classList.contains('status-expired')) {
                badge.className = 'status-pill status-expired';
                badge.innerHTML = '● Đã hết hạn';
            }
        } else {
            const minutesLeft = Math.floor(diff / 60000);
            if (minutesLeft < 15) {
                el.className = 'countdown-highlight countdown-warning';
            } else {
                el.className = 'countdown-highlight countdown-active';
            }
            el.textContent = 'Còn lại: ' + formatDurationRemaining(diff);
        }
    });
}

function updateExamTimers(now) {
    const assignment = STATE.assignments.find(a => a.id === STATE.activeExam.assignmentId);
    if (!assignment) return;

    // Stopwatch
    const start = new Date(STATE.activeExam.startTime);
    const elapsedSec = Math.floor((now.getTime() - start.getTime()) / 1000);
    STATE.activeExam.elapsedSeconds = elapsedSec;

    const stopwatchEl = document.getElementById('exam-stopwatch-display');
    if (stopwatchEl) {
        stopwatchEl.textContent = formatSecondsToTime(elapsedSec);
    }

    // Deadline & lockout
    const due = new Date(assignment.dueDate);
    const diff = due.getTime() - now.getTime();
    const countdownEl = document.getElementById('exam-countdown-display');
    const submitBtn = document.getElementById('btn-submit-exam');
    const lockoutBanner = document.getElementById('exam-lockout-alert');

    if (diff <= 0) {
        if (countdownEl) {
            countdownEl.textContent = '00:00:00 (Hết hạn)';
            countdownEl.classList.add('danger');
        }
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '🔒 Đã quá hạn - Không thể nộp bài';
            submitBtn.title = 'Thời gian nộp bài đã kết thúc theo quy định của giáo viên';
        }
        if (lockoutBanner) {
            lockoutBanner.style.display = 'flex';
        }
    } else {
        if (countdownEl) {
            countdownEl.textContent = formatDurationRemaining(diff);
            if (diff < 5 * 60 * 1000) {
                countdownEl.classList.add('danger');
            } else {
                countdownEl.classList.remove('danger');
            }
        }
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `🚀 Nộp bài tập (${formatDurationRemaining(diff)})`;
        }
        if (lockoutBanner) {
            lockoutBanner.style.display = 'none';
        }
    }
}

// ==========================================================================
// Event Listeners Setup
// ==========================================================================
function setupEventListeners() {
    // Teacher Actions
    document.getElementById('btn-open-create-modal')?.addEventListener('click', openCreateAssignmentModal);
    document.getElementById('btn-save-new-assignment')?.addEventListener('click', handleSaveNewAssignment);
    document.getElementById('btn-save-edit-deadline')?.addEventListener('click', handleSaveEditDeadline);
    document.getElementById('btn-reset-data')?.addEventListener('click', resetSampleData);

    // File Inputs
    const teacherFileInput = document.getElementById('teacher-file-input');
    if (teacherFileInput) {
        teacherFileInput.addEventListener('change', handleTeacherFileSelect);
    }

    const studentFileInput = document.getElementById('student-file-input');
    if (studentFileInput) {
        studentFileInput.addEventListener('change', handleStudentFileSelect);
    }

    // Deadline presets inside Edit Deadline Modal
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const minutes = parseInt(e.target.getAttribute('data-add-minutes'), 10);
            applyDeadlinePreset(minutes);
        });
    });

    // Close Modals
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = e.currentTarget.getAttribute('data-close-modal');
            closeModal(modalId);
        });
    });

    // Exam submit & exit
    document.getElementById('btn-submit-exam')?.addEventListener('click', handleSubmitExam);
    document.getElementById('btn-exit-exam')?.addEventListener('click', handleExitExam);

    // Filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            STATE.filterStatus = e.target.getAttribute('data-filter');
            renderTeacherView();
        });
    });
}

// ==========================================================================
// Teacher Assignment Management View
// ==========================================================================
function renderTeacherView() {
    updateTeacherStats();
    renderTeacherAssignmentCards();
    if (STATE.selectedAssignmentForTracking) {
        renderTrackingTable(STATE.selectedAssignmentForTracking);
    }
}

function updateTeacherStats() {
    const totalAssignments = STATE.assignments.length;
    const now = new Date();
    const activeCount = STATE.assignments.filter(a => new Date(a.dueDate) > now).length;
    
    let totalSubmissions = 0;
    STATE.assignments.forEach(a => {
        totalSubmissions += (a.submissions ? a.submissions.length : 0);
    });

    const students = STATE.accounts.filter(a => a.role === 'student');

    document.getElementById('stat-total-assignments').textContent = totalAssignments;
    document.getElementById('stat-active-assignments').textContent = activeCount;
    document.getElementById('stat-total-submissions').textContent = totalSubmissions;
    const totalStudentsEl = document.getElementById('stat-total-students');
    if (totalStudentsEl) totalStudentsEl.textContent = students.length;
}

function renderTeacherAssignmentCards() {
    const container = document.getElementById('teacher-assignments-grid');
    if (!container) return;

    const now = new Date();
    let filtered = STATE.assignments;
    if (STATE.filterStatus === 'active') {
        filtered = STATE.assignments.filter(a => new Date(a.dueDate) > now);
    } else if (STATE.filterStatus === 'expired') {
        filtered = STATE.assignments.filter(a => new Date(a.dueDate) <= now);
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: white; border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
                <p style="color: var(--text-muted); font-size: 1rem;">Không có bài tập nào phù hợp với bộ lọc.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(assignment => {
        const due = new Date(assignment.dueDate);
        const isExpired = due <= now;
        const diff = due.getTime() - now.getTime();
        const subCount = assignment.submissions ? assignment.submissions.length : 0;

        let statusBadgeHtml = isExpired
            ? `<span class="status-pill status-expired" data-status-badge="${assignment.id}">● Đã hết hạn</span>`
            : `<span class="status-pill status-active" data-status-badge="${assignment.id}">● Đang mở nộp bài</span>`;

        let attachmentsHtml = '';
        if (assignment.attachments && assignment.attachments.length > 0) {
            attachmentsHtml = `
                <div class="card-attachments-row">
                    ${assignment.attachments.map(att => `
                        <button type="button" class="attachment-badge-btn" onclick="openFilePreview('${escapeHtml(att.name)}', '${escapeHtml(att.type)}', '${att.dataUrl || ''}', '${att.size || ''}')">
                            ${getFileIcon(att.name, att.type)} ${escapeHtml(att.name)}
                        </button>
                    `).join('')}
                </div>
            `;
        }

        return `
            <div class="assignment-card">
                <div>
                    <div class="card-top-meta">
                        <span class="subject-badge">${escapeHtml(assignment.subject || 'Chung')} - ${escapeHtml(assignment.className || 'Cả lớp')}</span>
                        ${statusBadgeHtml}
                    </div>
                    <h3 class="card-title">${escapeHtml(assignment.title)}</h3>
                    <p class="card-desc">${escapeHtml(assignment.description || 'Không có mô tả')}</p>

                    ${attachmentsHtml}

                    <div class="deadline-box">
                        <div class="deadline-row">
                            <span class="deadline-label">📅 Hạn nộp bài:</span>
                            <span class="deadline-time">${formatDateTime(due)}</span>
                        </div>
                        <div class="deadline-row">
                            <span class="deadline-label">⏳ Tình trạng:</span>
                            <span data-countdown-id="${assignment.id}" class="countdown-highlight ${isExpired ? 'countdown-expired' : 'countdown-active'}">
                                ${isExpired ? 'Đã hết hạn nộp' : 'Còn lại: ' + formatDurationRemaining(diff)}
                            </span>
                        </div>
                    </div>
                </div>

                <div>
                    <div class="card-footer-actions">
                        <span class="submission-count-tag">
                            👥 <strong>${subCount}</strong> học sinh đã nộp
                        </span>
                        <div style="display: flex; gap: 0.4rem;">
                            <button class="btn-secondary btn-sm" onclick="openEditDeadlineModal('${assignment.id}')" title="Gia hạn hoặc điều chỉnh thời hạn nộp bài">
                                ⏱️ Đổi hạn
                            </button>
                            <button class="btn-primary btn-sm" onclick="showAssignmentTracking('${assignment.id}')">
                                📊 Bài nộp (${subCount})
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ==========================================================================
// Teacher Tracking & Submission Table
// ==========================================================================
function showAssignmentTracking(assignmentId) {
    const assignment = STATE.assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    STATE.selectedAssignmentForTracking = assignment;
    const trackingSection = document.getElementById('teacher-tracking-section');
    if (trackingSection) {
        trackingSection.style.display = 'block';
        trackingSection.scrollIntoView({ behavior: 'smooth' });
    }

    renderTrackingTable(assignment);
}

function renderTrackingTable(assignment) {
    const titleEl = document.getElementById('tracking-assignment-title');
    const subtitleEl = document.getElementById('tracking-assignment-subtitle');
    const tbody = document.getElementById('tracking-table-body');
    const emptyState = document.getElementById('tracking-empty-state');

    if (titleEl) titleEl.textContent = assignment.title;
    if (subtitleEl) {
        subtitleEl.innerHTML = `
            Lớp: <strong>${assignment.className}</strong> | Hạn chót: <strong>${formatDateTime(new Date(assignment.dueDate))}</strong>
            | Tổng số bài nộp: <strong>${assignment.submissions ? assignment.submissions.length : 0}</strong>
        `;
    }

    const subs = assignment.submissions || [];
    if (subs.length === 0) {
        if (tbody) tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = subs.map((sub, idx) => {
        const initials = sub.studentName ? sub.studentName.trim().charAt(0).toUpperCase() : 'H';
        const startFormatted = sub.startTime ? formatDateTime(new Date(sub.startTime), true) : 'N/A';
        const submitFormatted = sub.submitTime ? formatDateTime(new Date(sub.submitTime), true) : 'N/A';
        const durationFormatted = sub.durationSeconds ? formatSecondsToText(sub.durationSeconds) : 'N/A';
        
        const scoreDisplay = (sub.score !== undefined && sub.score !== null)
            ? `<span class="score-private-pill" title="Điểm này được bảo mật, chỉ có giáo viên và học sinh ${escapeHtml(sub.studentName)} thấy">🔒 ${sub.score}/10</span>`
            : `<span class="score-ungraded-pill">Chưa chấm</span>`;

        const attCount = sub.attachments ? sub.attachments.length : 0;
        const attBadge = attCount > 0
            ? `<span class="duration-badge" style="cursor: pointer;" onclick="openSubmissionDetailModal('${assignment.id}', '${sub.id}')">📎 ${attCount} tệp</span>`
            : `<span style="color: var(--text-light); font-size: 0.8rem;">Không có</span>`;

        return `
            <tr>
                <td><strong>#${idx + 1}</strong></td>
                <td>
                    <div class="student-cell">
                        <div class="avatar-circle">${initials}</div>
                        <div>
                            <div class="student-name-text">${escapeHtml(sub.studentName)}</div>
                            <div class="student-class-text">Lớp ${escapeHtml(sub.studentClass || '12A1')}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <code class="credentials-tag">${escapeHtml(sub.studentUsername || 'N/A')}</code>
                </td>
                <td>
                    <div class="time-stamp-text">🕒 ${startFormatted}</div>
                </td>
                <td>
                    <div class="time-stamp-text">📥 ${submitFormatted}</div>
                </td>
                <td>
                    <span class="duration-badge">⏱️ ${durationFormatted}</span>
                </td>
                <td>
                    ${attBadge}
                </td>
                <td>
                    ${scoreDisplay}
                </td>
                <td style="text-align: right;">
                    <button class="btn-primary btn-sm" onclick="openSubmissionDetailModal('${assignment.id}', '${sub.id}')">
                        ✏️ Chấm điểm & Xem bài
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ==========================================================================
// Submission Details & Private Grading Modal
// ==========================================================================
function openSubmissionDetailModal(assignmentId, submissionId) {
    const assignment = STATE.assignments.find(a => a.id === assignmentId);
    if (!assignment) return;
    const sub = (assignment.submissions || []).find(s => s.id === submissionId);
    if (!sub) return;

    document.getElementById('sub-modal-title').textContent = assignment.title;
    document.getElementById('sub-modal-student').textContent = `${sub.studentName} (Lớp ${sub.studentClass || '12A1'} - TK: ${sub.studentUsername || 'N/A'})`;
    document.getElementById('sub-modal-start').textContent = formatDateTime(new Date(sub.startTime), true);
    document.getElementById('sub-modal-submit').textContent = formatDateTime(new Date(sub.submitTime), true);
    document.getElementById('sub-modal-duration').textContent = formatSecondsToText(sub.durationSeconds);
    
    // Student uploaded files
    const filesSection = document.getElementById('sub-modal-files-section');
    const filesList = document.getElementById('sub-modal-student-files-list');
    if (sub.attachments && sub.attachments.length > 0) {
        filesSection.style.display = 'block';
        filesList.innerHTML = sub.attachments.map(att => `
            <button type="button" class="attachment-badge-btn" style="padding: 0.5rem 0.8rem; font-size: 0.85rem;" onclick="openFilePreview('${escapeHtml(att.name)}', '${escapeHtml(att.type)}', '${att.dataUrl || ''}', '${att.size || ''}')">
                ${getFileIcon(att.name, att.type)} <strong>${escapeHtml(att.name)}</strong> (${att.size})
            </button>
        `).join('');
    } else {
        filesSection.style.display = 'none';
    }

    // Answers review
    const answersContainer = document.getElementById('sub-modal-answers-list');
    answersContainer.innerHTML = (assignment.questions || []).map((q, idx) => {
        const studentAns = sub.answers ? sub.answers[q.id] : null;
        let ansDisplay = '';

        if (q.type === 'multiple_choice') {
            const chosenText = (studentAns !== null && studentAns !== undefined && q.options[studentAns])
                ? q.options[studentAns]
                : 'Chưa chọn đáp án';
            ansDisplay = `<strong>Đáp án học sinh chọn:</strong> ${escapeHtml(chosenText)}`;
        } else {
            ansDisplay = `<strong>Bài giải tự luận:</strong><br><pre style="white-space: pre-wrap; font-family: inherit; margin-top: 0.5rem; background: #F8FAFC; padding: 0.75rem; border-radius: 6px;">${escapeHtml(studentAns || 'Học sinh không gõ trực tiếp (Có thể đính kèm file ở trên)')}</pre>`;
        }

        return `
            <div style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 1rem; margin-bottom: 1rem;">
                <div style="font-weight: 700; color: #1E293B; margin-bottom: 0.4rem;">Câu ${idx + 1}: ${escapeHtml(q.content)}</div>
                <div style="font-size: 0.9rem; color: #334155;">${ansDisplay}</div>
            </div>
        `;
    }).join('');

    // Private Grading fields
    const scoreInput = document.getElementById('sub-modal-score-input');
    const feedbackInput = document.getElementById('sub-modal-feedback-input');
    if (scoreInput) scoreInput.value = sub.score !== undefined && sub.score !== null ? sub.score : '';
    if (feedbackInput) feedbackInput.value = sub.feedback || '';

    // Save grading callback
    const saveGradeBtn = document.getElementById('btn-save-grading');
    if (saveGradeBtn) {
        saveGradeBtn.onclick = () => {
            const scoreVal = parseFloat(scoreInput.value);
            if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 10) {
                showToast('Vui lòng nhập điểm hợp lệ từ 0 đến 10', 'danger');
                return;
            }
            sub.score = scoreVal;
            sub.feedback = feedbackInput.value.trim();
            saveAssignments();
            showToast(`Đã lưu điểm ${scoreVal}/10! Điểm được bảo mật riêng cho tài khoản ${sub.studentName}.`, 'success');
            renderTrackingTable(assignment);
            if (STATE.currentUser && STATE.currentUser.role === 'student') {
                renderStudentView();
            }
            closeModal('modal-submission-detail');
        };
    }

    openModal('modal-submission-detail');
}

// ==========================================================================
// Student View Rendering & Private Grade Results Box
// ==========================================================================
function renderStudentView() {
    if (!STATE.currentUser || STATE.currentUser.role !== 'student') return;

    // Header banner
    const fullnameEl = document.getElementById('student-header-fullname');
    const classEl = document.getElementById('student-header-class');
    const userEl = document.getElementById('student-header-username');

    if (fullnameEl) fullnameEl.textContent = STATE.currentUser.fullName;
    if (classEl) classEl.textContent = STATE.currentUser.className || '12A1';
    if (userEl) userEl.textContent = STATE.currentUser.username;

    renderStudentPrivateGrades();
    renderStudentAssignmentCards();
}

function renderStudentPrivateGrades() {
    const studentUser = STATE.currentUser.username.toLowerCase();
    const studentName = STATE.currentUser.fullName;
    const nameEl = document.getElementById('my-grades-student-name');
    if (nameEl) nameEl.textContent = `${studentName} (${STATE.currentUser.username})`;

    const container = document.getElementById('my-grades-list-container');
    if (!container) return;

    // Strictly match by authenticated username or exact student name
    const mySubmissions = [];
    STATE.assignments.forEach(assignment => {
        if (assignment.submissions) {
            assignment.submissions.forEach(sub => {
                if (
                    (sub.studentUsername && sub.studentUsername.toLowerCase() === studentUser) ||
                    sub.studentName.toLowerCase().trim() === studentName.toLowerCase().trim()
                ) {
                    mySubmissions.push({ assignment, sub });
                }
            });
        }
    });

    if (mySubmissions.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; background: white; border: 1px dashed #86EFAC; border-radius: var(--radius-md); padding: 1.5rem; text-align: center;">
                <div style="font-size: 1.5rem; margin-bottom: 0.3rem;">📋</div>
                <p style="font-weight: 600; color: #166534;">Em chưa có bài nộp nào trên hệ thống.</p>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">
                    Hãy chọn một bài tập đang mở bên dưới để làm và gửi bài cho thầy cô nhé.
                </p>
            </div>
        `;
        return;
    }

    container.innerHTML = mySubmissions.map(({ assignment, sub }) => {
        const isGraded = sub.score !== undefined && sub.score !== null;
        const scoreHtml = isGraded
            ? `<div class="my-grade-score-big">${sub.score} <span style="font-size: 1rem; color: var(--text-muted); font-weight: 600;">/10</span></div>`
            : `<div style="font-weight: 700; color: #D97706; font-size: 0.95rem;">⏳ Đang chờ giáo viên chấm</div>`;

        const feedbackHtml = (isGraded && sub.feedback)
            ? `<div style="background: #F8FAFC; border-left: 3px solid #059669; padding: 0.6rem 0.8rem; font-size: 0.82rem; color: #1E293B; margin-top: 0.6rem; border-radius: 0 4px 4px 0;">
                💬 <strong>Nhận xét của GV:</strong> "${escapeHtml(sub.feedback)}"
               </div>`
            : '';

        const attCount = sub.attachments ? sub.attachments.length : 0;
        const attInfo = attCount > 0 ? `<span style="font-size: 0.75rem; color: var(--text-muted);">📎 Đã nộp ${attCount} tệp</span>` : '';

        return `
            <div class="my-grade-card">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem;">
                        <span class="subject-badge" style="font-size: 0.7rem;">${escapeHtml(assignment.subject)}</span>
                        <span class="score-private-pill" style="font-size: 0.75rem;">🔒 Chỉ em xem được</span>
                    </div>
                    <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem;">${escapeHtml(assignment.title)}</h4>
                    
                    <div style="margin: 0.75rem 0;">
                        ${scoreHtml}
                        ${feedbackHtml}
                    </div>
                </div>

                <div style="border-top: 1px solid #E2E8F0; padding-top: 0.75rem; margin-top: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 0.75rem; color: var(--text-muted);">
                        ⏱️ Làm trong: ${formatSecondsToText(sub.durationSeconds)}<br>
                        ${attInfo}
                    </div>
                    <button class="btn-secondary btn-sm" onclick="viewStudentSubmissionResult('${assignment.id}', '${sub.id}')">
                        👁️ Xem lại bài
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderStudentAssignmentCards() {
    const container = document.getElementById('student-assignments-grid');
    if (!container) return;

    const studentUser = STATE.currentUser.username.toLowerCase();
    const studentName = STATE.currentUser.fullName.toLowerCase().trim();
    const now = new Date();

    container.innerHTML = STATE.assignments.map(assignment => {
        const due = new Date(assignment.dueDate);
        const isExpired = due <= now;
        const diff = due.getTime() - now.getTime();

        // Check if THIS logged-in student has submitted
        const hasSubmitted = assignment.submissions && assignment.submissions.find(s => 
            (s.studentUsername && s.studentUsername.toLowerCase() === studentUser) ||
            s.studentName.toLowerCase().trim() === studentName
        );

        let actionButtonHtml = '';
        let statusBadgeHtml = '';

        if (hasSubmitted) {
            statusBadgeHtml = `<span class="status-pill status-submitted">✓ Đã nộp bài</span>`;
            actionButtonHtml = `
                <button class="btn-secondary btn-sm" onclick="viewStudentSubmissionResult('${assignment.id}', '${hasSubmitted.id}')">
                    📋 Xem lại bài nộp
                </button>
            `;
        } else if (isExpired) {
            statusBadgeHtml = `<span class="status-pill status-expired">● Đã hết hạn</span>`;
            actionButtonHtml = `
                <button class="btn-secondary btn-sm" disabled style="opacity: 0.6; cursor: not-allowed;" title="Đã qua thời hạn nộp bài của giáo viên">
                    🔒 Hết hạn nộp
                </button>
            `;
        } else {
            statusBadgeHtml = `<span class="status-pill status-active">● Đang mở</span>`;
            actionButtonHtml = `
                <button class="btn-primary btn-sm" onclick="startExam('${assignment.id}')">
                    ✍️ Vào làm bài
                </button>
            `;
        }

        let attachmentsHtml = '';
        if (assignment.attachments && assignment.attachments.length > 0) {
            attachmentsHtml = `
                <div class="card-attachments-row">
                    ${assignment.attachments.map(att => `
                        <button type="button" class="attachment-badge-btn" onclick="openFilePreview('${escapeHtml(att.name)}', '${escapeHtml(att.type)}', '${att.dataUrl || ''}', '${att.size || ''}')">
                            ${getFileIcon(att.name, att.type)} Tệp đề: ${escapeHtml(att.name)}
                        </button>
                    `).join('')}
                </div>
            `;
        }

        return `
            <div class="assignment-card">
                <div>
                    <div class="card-top-meta">
                        <span class="subject-badge">${escapeHtml(assignment.subject || 'Chung')} - ${escapeHtml(assignment.className || 'Cả lớp')}</span>
                        ${statusBadgeHtml}
                    </div>
                    <h3 class="card-title">${escapeHtml(assignment.title)}</h3>
                    <p class="card-desc">${escapeHtml(assignment.description || 'Không có mô tả chi tiết.')}</p>

                    ${attachmentsHtml}

                    <div class="deadline-box">
                        <div class="deadline-row">
                            <span class="deadline-label">📅 Hạn nộp bài:</span>
                            <span class="deadline-time">${formatDateTime(due)}</span>
                        </div>
                        <div class="deadline-row">
                            <span class="deadline-label">⏳ Thời gian còn lại:</span>
                            <span data-countdown-id="${assignment.id}" class="countdown-highlight ${isExpired ? 'countdown-expired' : 'countdown-active'}">
                                ${isExpired ? 'Đã hết hạn nộp' : formatDurationRemaining(diff)}
                            </span>
                        </div>
                    </div>
                </div>

                <div>
                    <div class="card-footer-actions">
                        <span class="submission-count-tag">
                            📝 ${assignment.questions ? assignment.questions.length : 0} câu hỏi đề bài
                        </span>
                        <div>
                            ${actionButtonHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ==========================================================================
// Student Exam Taking Flow
// ==========================================================================
function startExam(assignmentId) {
    const assignment = STATE.assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    const now = new Date();
    if (new Date(assignment.dueDate) <= now) {
        showToast('Bài tập này đã hết hạn nộp! Bạn không thể vào làm bài.', 'danger');
        return;
    }

    STATE.studentPendingFiles = [];
    STATE.activeExam = {
        assignmentId: assignment.id,
        startTime: new Date().toISOString(),
        elapsedSeconds: 0
    };

    document.getElementById('view-student').classList.remove('active');
    document.getElementById('view-exam').classList.add('active');

    renderExamView();
}

function renderExamView() {
    if (!STATE.activeExam || !STATE.currentUser) return;
    const assignment = STATE.assignments.find(a => a.id === STATE.activeExam.assignmentId);
    if (!assignment) return;

    // Sticky bar info
    document.getElementById('exam-student-name').textContent = STATE.currentUser.fullName;
    document.getElementById('exam-student-class').textContent = 'Lớp ' + (STATE.currentUser.className || '12A1');
    document.getElementById('exam-student-user').textContent = STATE.currentUser.username;
    document.getElementById('exam-start-timestamp').textContent = formatDateTime(new Date(STATE.activeExam.startTime), true);
    
    // Header
    document.getElementById('exam-title').textContent = assignment.title;
    document.getElementById('exam-subject-badge').textContent = `${assignment.subject} - Lớp ${assignment.className}`;
    document.getElementById('exam-description').textContent = assignment.description;

    // Teacher attached files in exam view
    const teacherAttBox = document.getElementById('exam-teacher-attachments-box');
    const teacherAttList = document.getElementById('exam-teacher-attachments-list');
    if (assignment.attachments && assignment.attachments.length > 0) {
        teacherAttBox.style.display = 'block';
        teacherAttList.innerHTML = assignment.attachments.map(att => `
            <button type="button" class="attachment-badge-btn" style="padding: 0.5rem 0.85rem; font-size: 0.85rem;" onclick="openFilePreview('${escapeHtml(att.name)}', '${escapeHtml(att.type)}', '${att.dataUrl || ''}', '${att.size || ''}')">
                ${getFileIcon(att.name, att.type)} <strong>${escapeHtml(att.name)}</strong> (${att.size})
            </button>
        `).join('');
    } else {
        teacherAttBox.style.display = 'none';
    }

    renderStudentPendingFiles();

    // Render questions
    const questionsContainer = document.getElementById('exam-questions-list');
    questionsContainer.innerHTML = (assignment.questions || []).map((q, idx) => {
        if (q.type === 'multiple_choice') {
            const optionsHtml = q.options.map((opt, optIdx) => `
                <label class="option-item" onclick="selectOption('${q.id}', ${optIdx}, this)">
                    <input type="radio" name="answer_${q.id}" value="${optIdx}" class="option-radio">
                    <span>${escapeHtml(opt)}</span>
                </label>
            `).join('');

            return `
                <div class="question-card">
                    <div class="question-header">
                        <span class="question-index-tag">Câu hỏi ${idx + 1}</span>
                        <span class="question-type-tag">Trắc nghiệm</span>
                    </div>
                    <div class="question-text">${escapeHtml(q.content)}</div>
                    <div class="options-list">${optionsHtml}</div>
                </div>
            `;
        } else {
            return `
                <div class="question-card">
                    <div class="question-header">
                        <span class="question-index-tag">Câu hỏi ${idx + 1}</span>
                        <span class="question-type-tag">Tự luận</span>
                    </div>
                    <div class="question-text">${escapeHtml(q.content)}</div>
                    <textarea class="essay-textarea" id="answer_${q.id}" placeholder="Nhập câu trả lời hoặc lời giải trực tiếp của em tại đây (hoặc đính kèm file ảnh/PDF bên dưới)..."></textarea>
                </div>
            `;
        }
    }).join('');

    updateExamTimers(new Date());
}

function selectOption(questionId, optIdx, labelEl) {
    const parent = labelEl.parentElement;
    parent.querySelectorAll('.option-item').forEach(el => el.classList.remove('selected'));
    labelEl.classList.add('selected');
    const radio = labelEl.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
}

function handleSubmitExam() {
    if (!STATE.activeExam || !STATE.currentUser) return;
    const assignment = STATE.assignments.find(a => a.id === STATE.activeExam.assignmentId);
    if (!assignment) return;

    const now = new Date();
    const dueDate = new Date(assignment.dueDate);

    // CRITICAL DEADLINE ENFORCEMENT
    if (now > dueDate) {
        showToast('RẤT TIẾC: Đã quá thời hạn nộp bài! Hệ thống không thể tiếp nhận bài làm này nữa.', 'danger');
        updateExamTimers(now);
        return;
    }

    if (!confirm('Bạn có chắc chắn muốn nộp bài tập này? Sau khi nộp bạn sẽ không thể chỉnh sửa.')) {
        return;
    }

    const submitTime = now.toISOString();
    const durationSeconds = Math.max(1, Math.floor((now.getTime() - new Date(STATE.activeExam.startTime).getTime()) / 1000));

    // Collect answers
    const answers = {};
    (assignment.questions || []).forEach(q => {
        if (q.type === 'multiple_choice') {
            const checked = document.querySelector(`input[name="answer_${q.id}"]:checked`);
            answers[q.id] = checked ? parseInt(checked.value, 10) : null;
        } else {
            const ta = document.getElementById(`answer_${q.id}`);
            answers[q.id] = ta ? ta.value.trim() : '';
        }
    });

    // Create submission record with student account credentials
    const submission = {
        id: 'sub-' + Date.now(),
        studentUsername: STATE.currentUser.username,
        studentName: STATE.currentUser.fullName,
        studentClass: STATE.currentUser.className || '12A1',
        startTime: STATE.activeExam.startTime,
        submitTime: submitTime,
        durationSeconds: durationSeconds,
        answers: answers,
        attachments: [...STATE.studentPendingFiles],
        status: 'on_time',
        score: null,
        feedback: ''
    };

    if (!assignment.submissions) assignment.submissions = [];
    assignment.submissions.unshift(submission);
    saveAssignments();

    triggerConfetti();

    document.getElementById('success-modal-student').textContent = `${STATE.currentUser.fullName} (${STATE.currentUser.username})`;
    document.getElementById('success-modal-start').textContent = formatDateTime(new Date(STATE.activeExam.startTime), true);
    document.getElementById('success-modal-submit').textContent = formatDateTime(now, true);
    document.getElementById('success-modal-duration').textContent = formatSecondsToText(durationSeconds);
    document.getElementById('success-modal-files').textContent = `${STATE.studentPendingFiles.length} tệp`;
    openModal('modal-submission-success');

    STATE.studentPendingFiles = [];
    STATE.activeExam = null;
}

function handleExitExam() {
    if (confirm('Bạn có chắc muốn thoát khỏi màn hình làm bài? Bài làm chưa nộp sẽ không được lưu.')) {
        STATE.studentPendingFiles = [];
        STATE.activeExam = null;
        renderStudentView();
    }
}

function viewStudentSubmissionResult(assignmentId, submissionId) {
    openSubmissionDetailModal(assignmentId, submissionId);
}

// ==========================================================================
// File Upload Handling
// ==========================================================================
function handleTeacherFileSelect(e) {
    const files = Array.from(e.target.files);
    processFiles(files, (fileObj) => {
        STATE.teacherPendingFiles.push(fileObj);
        renderTeacherPendingFiles();
    });
}

function renderTeacherPendingFiles() {
    const container = document.getElementById('teacher-selected-files-list');
    if (!container) return;

    container.innerHTML = STATE.teacherPendingFiles.map((file, idx) => `
        <div class="file-attachment-chip">
            <div class="file-chip-left">
                <span class="file-chip-icon">${getFileIcon(file.name, file.type)}</span>
                <div>
                    <div class="file-chip-name">${escapeHtml(file.name)}</div>
                    <div class="file-chip-size">${file.size}</div>
                </div>
            </div>
            <div class="file-chip-actions">
                <button type="button" class="btn-danger btn-sm" onclick="removeTeacherPendingFile(${idx})" title="Xóa tệp">
                    ✕
                </button>
            </div>
        </div>
    `).join('');
}

function removeTeacherPendingFile(idx) {
    STATE.teacherPendingFiles.splice(idx, 1);
    renderTeacherPendingFiles();
}

function handleStudentFileSelect(e) {
    const files = Array.from(e.target.files);
    processFiles(files, (fileObj) => {
        STATE.studentPendingFiles.push(fileObj);
        renderStudentPendingFiles();
    });
}

function renderStudentPendingFiles() {
    const container = document.getElementById('student-selected-files-list');
    if (!container) return;

    if (STATE.studentPendingFiles.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = STATE.studentPendingFiles.map((file, idx) => {
        const isImage = file.type.startsWith('image/');
        const thumbHtml = isImage && file.dataUrl
            ? `<img src="${file.dataUrl}" class="file-chip-thumb" alt="thumbnail">`
            : '';

        return `
            <div class="file-attachment-chip">
                <div class="file-chip-left">
                    ${thumbHtml || `<span class="file-chip-icon">${getFileIcon(file.name, file.type)}</span>`}
                    <div>
                        <div class="file-chip-name">${escapeHtml(file.name)}</div>
                        <div class="file-chip-size">${file.size}</div>
                    </div>
                </div>
                <div class="file-chip-actions">
                    ${isImage ? `<button type="button" class="btn-secondary btn-sm" onclick="previewImageDirectly('${file.dataUrl}', '${escapeHtml(file.name)}')">👁️ Xem</button>` : ''}
                    <button type="button" class="btn-danger btn-sm" onclick="removeStudentPendingFile(${idx})" title="Xóa tệp">
                        ✕
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function removeStudentPendingFile(idx) {
    STATE.studentPendingFiles.splice(idx, 1);
    renderStudentPendingFiles();
}

function processFiles(files, onFileReady) {
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const fileObj = {
                name: file.name,
                type: file.type || getMimeFromName(file.name),
                size: formatFileSize(file.size),
                dataUrl: event.target.result
            };
            onFileReady(fileObj);
        };
        reader.readAsDataURL(file);
    });
}

function getFileIcon(name, type) {
    const n = name.toLowerCase();
    if (n.endsWith('.pdf') || (type && type.includes('pdf'))) return '📄';
    if (n.endsWith('.jpg') || n.endsWith('.jpeg') || n.endsWith('.png') || (type && type.startsWith('image/'))) return '🖼️';
    if (n.endsWith('.doc') || n.endsWith('.docx')) return '📝';
    return '📎';
}

function getMimeFromName(name) {
    const n = name.toLowerCase();
    if (n.endsWith('.pdf')) return 'application/pdf';
    if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'image/jpeg';
    if (n.endsWith('.png')) return 'image/png';
    return 'application/octet-stream';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function openFilePreview(fileName, fileType, dataUrl, fileSize = '') {
    const titleEl = document.getElementById('lightbox-file-title');
    const contentArea = document.getElementById('lightbox-content-area');
    const sizeEl = document.getElementById('lightbox-file-size');
    const downloadLink = document.getElementById('lightbox-download-link');

    if (titleEl) titleEl.textContent = fileName;
    if (sizeEl) sizeEl.textContent = fileSize ? `Kích thước: ${fileSize}` : '';
    
    if (downloadLink) {
        downloadLink.download = fileName;
        downloadLink.href = dataUrl || '#';
    }

    const isImage = (fileType && fileType.startsWith('image/')) || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
    const isPdf = (fileType && fileType.includes('pdf')) || /\.pdf$/i.test(fileName);

    if (isImage && dataUrl) {
        contentArea.innerHTML = `<img src="${dataUrl}" class="lightbox-img" alt="${escapeHtml(fileName)}">`;
    } else if (isPdf && dataUrl && dataUrl.startsWith('data:application/pdf')) {
        contentArea.innerHTML = `<iframe src="${dataUrl}" style="width: 100%; height: 60vh; border: none; border-radius: 8px;"></iframe>`;
    } else {
        contentArea.innerHTML = `
            <div style="padding: 3rem 1rem; background: #F8FAFC; border-radius: var(--radius-md); border: 1px dashed var(--border-medium); width: 100%;">
                <div style="font-size: 3.5rem; margin-bottom: 0.75rem;">${getFileIcon(fileName, fileType)}</div>
                <h4 style="font-size: 1.1rem; color: var(--text-main); margin-bottom: 0.35rem;">${escapeHtml(fileName)}</h4>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem;">
                    Định dạng: <strong>${escapeHtml(fileType || 'Tài liệu')}</strong> ${fileSize ? `(${fileSize})` : ''}
                </p>
                ${dataUrl ? `<a href="${dataUrl}" download="${escapeHtml(fileName)}" class="btn-primary">⬇️ Tải tệp này về máy</a>` : '<p style="color: var(--text-muted); font-size: 0.85rem;">(Tệp đính kèm mô phỏng)</p>'}
            </div>
        `;
    }

    openModal('modal-file-lightbox');
}

function previewImageDirectly(dataUrl, fileName) {
    openFilePreview(fileName, 'image/jpeg', dataUrl);
}

// ==========================================================================
// Teacher Create Assignment Flow
// ==========================================================================
function openCreateAssignmentModal() {
    document.getElementById('create-hw-title').value = '';
    document.getElementById('create-hw-subject').value = 'Toán học';
    document.getElementById('create-hw-class').value = '12A1';
    document.getElementById('create-hw-desc').value = '';
    
    const defaultDue = new Date(Date.now() + 2 * 60 * 60 * 1000);
    document.getElementById('create-hw-deadline').value = toLocalISOString(defaultDue);

    STATE.teacherPendingFiles = [];
    renderTeacherPendingFiles();

    openModal('modal-create-assignment');
}

function handleSaveNewAssignment() {
    const title = document.getElementById('create-hw-title').value.trim();
    const subject = document.getElementById('create-hw-subject').value.trim();
    const className = document.getElementById('create-hw-class').value.trim();
    const desc = document.getElementById('create-hw-desc').value.trim();
    const deadlineVal = document.getElementById('create-hw-deadline').value;

    if (!title) {
        showToast('Vui lòng nhập tiêu đề bài tập', 'danger');
        return;
    }
    if (!deadlineVal) {
        showToast('Vui lòng chọn thời hạn nộp bài', 'danger');
        return;
    }

    const newAssignment = {
        id: 'hw-' + Date.now(),
        title: title,
        subject: subject,
        className: className,
        description: desc,
        createdAt: new Date().toISOString(),
        dueDate: new Date(deadlineVal).toISOString(),
        attachments: [...STATE.teacherPendingFiles],
        questions: [
            {
                id: 'q1',
                type: 'essay',
                content: 'Câu hỏi: Trình bày nội dung câu trả lời hoặc đính kèm bài làm chi tiết cho bài tập này.'
            }
        ],
        submissions: []
    };

    STATE.assignments.unshift(newAssignment);
    saveAssignments();

    STATE.teacherPendingFiles = [];
    closeModal('modal-create-assignment');
    showToast('Tạo bài tập mới kèm tệp đính kèm thành công!', 'success');
    renderTeacherView();
}

// ==========================================================================
// Edit Deadline Modal
// ==========================================================================
function openEditDeadlineModal(assignmentId) {
    const assignment = STATE.assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    STATE.editingAssignmentId = assignmentId;
    document.getElementById('edit-deadline-assignment-title').textContent = assignment.title;
    
    const dueDate = new Date(assignment.dueDate);
    document.getElementById('edit-deadline-input').value = toLocalISOString(dueDate);

    openModal('modal-edit-deadline');
}

function applyDeadlinePreset(addMinutes) {
    const input = document.getElementById('edit-deadline-input');
    const now = new Date();
    const newDate = new Date(now.getTime() + addMinutes * 60 * 1000);
    input.value = toLocalISOString(newDate);
}

function handleSaveEditDeadline() {
    const assignment = STATE.assignments.find(a => a.id === STATE.editingAssignmentId);
    if (!assignment) return;

    const inputVal = document.getElementById('edit-deadline-input').value;
    if (!inputVal) {
        showToast('Vui lòng chọn thời gian đến hạn hợp lệ', 'danger');
        return;
    }

    const newDueDate = new Date(inputVal);
    assignment.dueDate = newDueDate.toISOString();
    saveAssignments();

    closeModal('modal-edit-deadline');
    showToast(`Đã cập nhật hạn nộp mới: ${formatDateTime(newDueDate)}`, 'success');

    renderTeacherView();
    if (STATE.currentUser && STATE.currentUser.role === 'student') {
        renderStudentView();
    }

    if (STATE.activeExam && STATE.activeExam.assignmentId === assignment.id) {
        updateExamTimers(new Date());
    }
}

// ==========================================================================
// Modal Helpers & Toast
// ==========================================================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'danger') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// ==========================================================================
// Formatting Utilities
// ==========================================================================
function formatDateTime(date, withSeconds = false) {
    if (!(date instanceof Date) || isNaN(date)) return '';
    const pad = (n) => String(n).padStart(2, '0');
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    if (withSeconds) {
        const seconds = pad(date.getSeconds());
        return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
    }
    return `${hours}:${minutes} ${day}/${month}/${year}`;
}

function formatDurationRemaining(ms) {
    if (ms <= 0) return '00:00';
    const totalSec = Math.floor(ms / 1000);
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = (n) => String(n).padStart(2, '0');

    if (hours > 0) {
        return `${hours} giờ ${pad(mins)} phút`;
    }
    return `${pad(mins)}:${pad(secs)}`;
}

function formatSecondsToTime(sec) {
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    const pad = (n) => String(n).padStart(2, '0');

    if (hours > 0) {
        return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
}

function formatSecondsToText(sec) {
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    if (mins > 0) {
        return `${mins} phút ${remainingSec} giây`;
    }
    return `${remainingSec} giây`;
}

function toLocalISOString(date) {
    const pad = (n) => String(n).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function triggerConfetti() {
    let canvas = document.getElementById('confetti-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'confetti-canvas';
        document.body.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = [];
    const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    for (let i = 0; i < 90; i++) {
        pieces.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.4,
            w: Math.random() * 10 + 6,
            h: Math.random() * 6 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            vy: Math.random() * 3 + 2,
            vx: (Math.random() - 0.5) * 3,
            rot: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 8
        });
    }

    let frame = 0;
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pieces.forEach(p => {
            p.y += p.vy;
            p.x += p.vx;
            p.rot += p.rotSpeed;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rot * Math.PI) / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        });

        frame++;
        if (frame < 120) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    requestAnimationFrame(animate);
}
