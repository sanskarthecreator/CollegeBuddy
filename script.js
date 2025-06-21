document.addEventListener('DOMContentLoaded', () => {
    // --- Data Storage and Initialization ---
    let assignments = JSON.parse(localStorage.getItem('assignments')) || [];
    let lectures = JSON.parse(localStorage.getItem('lectures')) || [];
    let subjects = JSON.parse(localStorage.getItem('subjects')) || [];
    let semesters = JSON.parse(localStorage.getItem('semesters')) || [];
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    let profileData = JSON.parse(localStorage.getItem('profileData')) || {};
    let profilePictureData = localStorage.getItem('profilePictureData') || 'https://via.placeholder.com/150';

    // Ensure IDs are unique and increment correctly after load
    let nextAssignmentId = assignments.length > 0 ? Math.max(...assignments.map(a => a.id)) + 1 : 1;
    let nextLectureId = lectures.length > 0 ? Math.max(...lectures.map(l => l.id)) + 1 : 1;
    let nextSemesterId = semesters.length > 0 ? Math.max(...semesters.map(s => s.id)) + 1 : 1;
    
    // Fallback if data is empty or IDs are not numbers
    if (isNaN(nextAssignmentId)) nextAssignmentId = 1;
    if (isNaN(nextLectureId)) nextLectureId = 1;
    if (isNaN(nextSemesterId)) nextSemesterId = 1;

    // --- DOM Element References ---
    const navLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const modalTriggers = document.querySelectorAll('[data-modal]');
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.modal .close, .modal .btn-secondary[data-close]');

    // Dashboard elements
    const currentDateEl = document.getElementById('currentDate');
    const totalAssignmentsEl = document.getElementById('totalAssignments');
    const completedAssignmentsEl = document.getElementById('completedAssignments');
    const pendingAssignmentsEl = document.getElementById('pendingAssignments');
    const averageGradeEl = document.getElementById('averageGrade');
    const upcomingDeadlinesEl = document.getElementById('upcomingDeadlines');
    const todayScheduleEl = document.getElementById('todaySchedule');

    // Forms
    const assignmentForm = document.getElementById('assignmentForm');
    const lectureForm = document.getElementById('lectureForm');
    const subjectForm = document.getElementById('subjectForm');
    const semesterForm = document.getElementById('semesterForm');
    const todoForm = document.getElementById('todoForm');
    const profileForm = document.getElementById('profileForm');

    // Lists
    const assignmentsListEl = document.getElementById('assignmentsList');
    const lecturesListEl = document.getElementById('lecturesList');
    const subjectListEl = document.getElementById('subjectList');
    const semesterListEl = document.getElementById('semesterList');
    const todoListEl = document.getElementById('todoList');

    // Filters
    const assignmentFilter = document.getElementById('assignmentFilter');
    const semesterFilter = document.getElementById('semesterFilter');
    const lectureSemesterFilter = document.getElementById('lectureSemesterFilter');
    const scheduleSemesterFilter = document.getElementById('scheduleSemesterFilter');
    const gradesSemesterFilter = document.getElementById('gradesSemesterFilter');

    // Select dropdowns in modals
    const assignmentSubjectSelect = document.getElementById('assignmentSubject');
    const assignmentSemesterSelect = document.getElementById('assignmentSemester');
    const lectureSubjectSelect = document.getElementById('lectureSubject');
    const lectureSemesterSelect = document.getElementById('lectureSemester');

    // Grades tab elements
    const currentGPAEl = document.getElementById('currentGPA');
    const semesterStatsEl = document.getElementById('semesterStats');
    const subjectGradesEl = document.getElementById('subjectGrades');

    // Profile elements
    const profilePictureEl = document.getElementById('profilePicture');
    const profilePicUpload = document.getElementById('profilePicUpload');
    const studentNameEl = document.getElementById('studentName');
    const studentIdDisplayEl = document.getElementById('studentIdDisplay');
    const studentMajorEl = document.getElementById('studentMajor');
    const studentYearEl = document.getElementById('studentYear');
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const studentIdInput = document.getElementById('studentIdInput');
    const majorInput = document.getElementById('major');
    const yearSelect = document.getElementById('year');

    // Pomodoro Timer elements
    const timerDisplay = document.getElementById('timerDisplay');
    const timerStatus = document.getElementById('timerStatus');
    const startTimerBtn = document.getElementById('startTimer');
    const resetTimerBtn = document.getElementById('resetTimer');
    let pomodoroTimer;
    let timeRemaining;
    let isPaused = true;
    let sessionType = 'work'; // 'work' or 'break'
    const WORK_TIME = 25 * 60; // 25 minutes
    const BREAK_TIME = 5 * 60; // 5 minutes
    const LONG_BREAK_TIME = 15 * 60; // 15 minutes
    let workSessionsCompleted = 0;

    // AI Chat elements
    const chatMessagesEl = document.getElementById('chatMessages');
    const chatInputEl = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const toggleChatBtn = document.getElementById('toggleChat');
    const chatAssistantSection = document.querySelector('.chat-assistant');

    // FullCalendar instance
    let calendar;

    // --- Helper Functions ---
    const saveData = () => {
        localStorage.setItem('assignments', JSON.stringify(assignments));
        localStorage.setItem('lectures', JSON.stringify(lectures));
        localStorage.setItem('subjects', JSON.stringify(subjects));
        localStorage.setItem('semesters', JSON.stringify(semesters));
        localStorage.setItem('todos', JSON.stringify(todos));
        localStorage.setItem('profileData', JSON.stringify(profileData));
        localStorage.setItem('profilePictureData', profilePictureData);
    };

  const showNotification = (message, type = 'info', duration = 2000) => {
    const container = document.getElementById('notificationContainer');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    container.appendChild(notification);

    // Trigger reflow
    notification.offsetHeight;

    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
        // Remove notification after the transition
        setTimeout(() => notification.remove(), 600); // Adjust if your transition is different
    }, duration);
};

    // --- UI Update Functions ---

    // Dark Mode Toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    const enableDarkMode = () => {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'enabled');
        if (darkModeToggle) darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    };

    const disableDarkMode = () => {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'disabled');
        if (darkModeToggle) darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    };

    if (localStorage.getItem('darkMode') === 'enabled') {
        enableDarkMode();
    }

    darkModeToggle?.addEventListener('click', () => {
        if (document.body.classList.contains('dark-mode')) {
            disableDarkMode();
        } else {
            enableDarkMode();
        }
    });

    // Mobile Navigation Toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    navToggle?.addEventListener('click', () => {
        navMenu?.classList.toggle('active');
        navToggle.querySelector('i')?.classList.toggle('fa-bars');
        navToggle.querySelector('i')?.classList.toggle('fa-times');
    });

    // Tab Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = link.dataset.tab;

            navLinks.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            link.classList.add('active');
            document.getElementById(targetTab)?.classList.add('active');

            // Specific updates for tabs
            if (targetTab === 'assignments') {
                updateAssignmentsList();
                populateSemesterFilters(); // Ensure filters are populated
            } else if (targetTab === 'lectures') {
                updateLecturesList();
                populateLectureSemesterFilter(); // Ensure filters are populated
            } else if (targetTab === 'schedule') {
                populateScheduleSemesterFilter(); // Ensure filter is populated before rendering
                renderCalendar();
            } else if (targetTab === 'grades') {
                populateGradesSemesterFilter(); // Ensure filter is populated before rendering
                updateGradesDisplay();
            } else if (targetTab === 'dashboard') {
                updateDashboardStats();
                updateTodaySchedule();
                updateUpcomingDeadlines();
            } else if (targetTab === 'profile') {
                loadProfileData();
            }
        });
    });

    // Modal Handling
    modalTriggers.forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.dataset.modal;
            const modal = document.getElementById(modalId);
            if (modal) {
                // Populate selects specific to the modal before showing
                if (modalId === 'assignmentModal') {
                    populateAssignmentModalSelects();
                } else if (modalId === 'lectureModal') {
                    populateLectureModalSelects();
                } else if (modalId === 'subjectModal') {
                    updateSubjectList(); // Refresh subject list inside modal
                } else if (modalId === 'semesterModal') {
                    updateSemesterList(); // Refresh semester list inside modal
                }
                modal.style.display = 'block';
            }
        });
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.dataset.close;
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });

    window.addEventListener('click', (e) => {
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });

    // --- Core Data Management & Display ---

    // Subjects
    const updateSubjectList = () => {
        if (subjectListEl) {
            subjectListEl.innerHTML = subjects.map(s => `
                <li class="list-item">
                    <span>${s}</span>
                    <button class="btn-delete-item" data-action="delete-subject" data-subject="${s}">Delete</button>
                </li>
            `).join('');
        }
    };

    subjectForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const newSubjectInput = document.getElementById('newSubject');
        const newSubject = newSubjectInput.value.trim();
        if (newSubject && !subjects.includes(newSubject)) {
            subjects.push(newSubject);
            saveData();
            updateSubjectList();
            populateAssignmentModalSelects(); // Update assignment/lecture subject dropdowns
            populateLectureModalSelects();
            updateAssignmentsList(); // Refresh assignments list in case a subject was newly added and could now be assigned
            updateLecturesList(); // Refresh lectures list similarly
            showNotification('Subject added successfully!', 'success');
            newSubjectInput.value = '';
        } else if (newSubject && subjects.includes(newSubject)) {
            showNotification('Subject already exists.', 'warning');
        }
    });

    // Event Delegation for Subject Deletion
    subjectListEl?.addEventListener('click', (e) => {
        const target = e.target;
        if (target.dataset.action === 'delete-subject') {
            const subjectToDelete = target.dataset.subject;
            if (confirm(`Are you sure you want to delete the subject "${subjectToDelete}"? This will also remove all assignments and lectures associated with it.`)) {
                subjects = subjects.filter(s => s !== subjectToDelete);
                assignments = assignments.filter(a => a.subject !== subjectToDelete);
                lectures = lectures.filter(l => l.subject !== subjectToDelete);
                saveData();
                updateSubjectList();
                populateAssignmentModalSelects();
                populateLectureModalSelects();
                updateAssignmentsList();
                updateLecturesList();
                updateDashboardStats();
                updateGradesDisplay();
                renderCalendar(); // Calendar might have events for this subject
                showNotification('Subject and associated data deleted.', 'info');
            }
        }
    });

    // Semesters
    const updateSemesterList = () => {
        if (semesterListEl) {
            semesterListEl.innerHTML = semesters.map(s => `
                <li class="list-item">
                    <span>${s.name} (${s.startDate} to ${s.endDate})</span>
                    <button class="btn-delete-item" data-action="delete-semester" data-id="${s.id}">Delete</button>
                </li>
            `).join('');
        }
    };

    semesterForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const semesterName = document.getElementById('semesterName').value.trim();
        const semesterStart = document.getElementById('semesterStart').value;
        const semesterEnd = document.getElementById('semesterEnd').value;

        if (semesterName && semesterStart && semesterEnd) {
            semesters.push({ id: nextSemesterId++, name: semesterName, startDate: semesterStart, endDate: semesterEnd });
            saveData();
            updateSemesterList();
            populateSemesterFilters(); // Update all semester filter dropdowns
            populateAssignmentModalSelects(); // Update assignment/lecture semester dropdowns
            populateLectureModalSelects();
            updateAssignmentsList(); // Refresh assignments/lectures list as new semester filter might be available
            updateLecturesList();
            renderCalendar(); // Calendar might need refresh
            showNotification('Semester added successfully!', 'success');
            semesterForm.reset();
        } else {
            showNotification('Please fill all semester fields.', 'error');
        }
    });

    // Event Delegation for Semester Deletion
    semesterListEl?.addEventListener('click', (e) => {
        const target = e.target;
        if (target.dataset.action === 'delete-semester') {
            const semesterIdToDelete = parseInt(target.dataset.id);
            const semesterName = semesters.find(s => s.id === semesterIdToDelete)?.name;
            if (confirm(`Are you sure you want to delete the semester "${semesterName}"? This will also remove all assignments and lectures associated with it.`)) {
                semesters = semesters.filter(s => s.id !== semesterIdToDelete);
                assignments = assignments.filter(a => a.semesterId !== semesterIdToDelete);
                lectures = lectures.filter(l => l.semesterId !== semesterIdToDelete);
                saveData();
                updateSemesterList();
                populateSemesterFilters(); // Update all semester filter dropdowns
                populateAssignmentModalSelects();
                populateLectureModalSelects();
                updateAssignmentsList();
                updateLecturesList();
                updateDashboardStats();
                updateGradesDisplay();
                renderCalendar(); // Calendar might have events for this semester
                showNotification('Semester and associated data deleted.', 'info');
            }
        }
    });

    // Assignments
    const populateAssignmentModalSelects = () => {
        if (assignmentSubjectSelect) {
            assignmentSubjectSelect.innerHTML = '<option value="">Select Subject</option>' +
                subjects.map(s => `<option value="${s}">${s}</option>`).join('');
        }
        if (assignmentSemesterSelect) {
            assignmentSemesterSelect.innerHTML = '<option value="">Select Semester</option>' +
                semesters.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        }
    };

    const updateAssignmentsList = () => {
        if (!assignmentsListEl) return;

        const filterStatus = assignmentFilter?.value || 'all';
        const filterSemesterId = parseInt(semesterFilter?.value) || 'all';

        const filteredAssignments = assignments.filter(a => {
            const isOverdue = new Date(a.dueDate + 'T' + a.dueTime) < new Date() && a.status === 'pending';
            const matchesStatus = (filterStatus === 'all') ||
                                  (filterStatus === 'overdue' && isOverdue) ||
                                  (filterStatus === a.status && filterStatus !== 'overdue');
            const matchesSemester = (filterSemesterId === 'all') || (a.semesterId === filterSemesterId);
            return matchesStatus && matchesSemester;
        }).sort((a, b) => new Date(a.dueDate + 'T' + a.dueTime) - new Date(b.dueDate + 'T' + b.dueTime));

        assignmentsListEl.innerHTML = filteredAssignments.length === 0
            ? '<p class="no-items">No assignments found for the current filters.</p>'
            : filteredAssignments.map(a => {
                const isOverdue = new Date(a.dueDate + 'T' + a.dueTime) < new Date() && a.status === 'pending';
                const statusClass = a.status === 'completed' ? 'assignment-completed' : (isOverdue ? 'assignment-overdue' : 'assignment-pending');
                const semesterName = semesters.find(s => s.id === a.semesterId)?.name || 'N/A';
                return `
                    <div class="assignment-card ${statusClass}">
                        <h3>${a.title}</h3>
                        <p><strong>Subject:</strong> ${a.subject}</p>
                        <p><strong>Semester:</strong> ${semesterName}</p>
                        <p><strong>Due:</strong> ${a.dueDate} at ${a.dueTime}</p>
                        <p><strong>Priority:</strong> <span class="priority-${a.priority}">${a.priority.toUpperCase()}</span></p>
                        <p><strong>Status:</strong> ${a.status.charAt(0).toUpperCase() + a.status.slice(1)}</p>
                        ${a.grade ? `<p><strong>Grade:</strong> ${a.grade}</p>` : ''}
                        <div class="assignment-actions">
                            <button class="btn-secondary" data-id="${a.id}" data-action="toggle-complete">${a.status === 'completed' ? 'Mark Pending' : 'Mark Completed'}</button>
                            ${a.status === 'completed' && !a.grade ? `<button class="btn-secondary" data-id="${a.id}" data-action="assign-grade">Grade</button>` : ''}
                            <button class="btn-delete-item" data-id="${a.id}" data-action="remove-assignment">Delete</button>
                        </div>
                    </div>
                `;
            }).join('');
    };

    assignmentForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const newAssignment = {
            id: nextAssignmentId++,
            title: document.getElementById('assignmentTitle').value,
            subject: document.getElementById('assignmentSubject').value,
            semesterId: parseInt(document.getElementById('assignmentSemester').value),
            dueDate: document.getElementById('assignmentDueDate').value,
            dueTime: document.getElementById('assignmentDueTime').value,
            priority: document.getElementById('assignmentPriority').value,
            status: 'pending',
            grade: null
        };
        assignments.push(newAssignment);
        saveData();
        updateAssignmentsList();
        updateDashboardStats();
        updateUpcomingDeadlines();
        renderCalendar(); // Update calendar with new assignment
        showNotification('Assignment added successfully!', 'success');
        document.getElementById('assignmentModal').style.display = 'none';
        assignmentForm.reset();
    });

    const populateSemesterFilters = () => {
        const filterElements = [semesterFilter, lectureSemesterFilter, scheduleSemesterFilter, gradesSemesterFilter];
        filterElements.forEach(selectEl => {
            if (selectEl) {
                const currentVal = selectEl.value; // Preserve current selection
                selectEl.innerHTML = '<option value="all">All Semesters</option>' +
                    semesters.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
                if (currentVal) selectEl.value = currentVal; // Restore selection
            }
        });
    };

    assignmentFilter?.addEventListener('change', updateAssignmentsList);
    semesterFilter?.addEventListener('change', updateAssignmentsList);

    // Event Delegation for Assignment Actions
    assignmentsListEl?.addEventListener('click', (e) => {
        const target = e.target;
        const id = parseInt(target.dataset.id);

        if (isNaN(id)) return; // Not a button with a valid ID

        if (target.dataset.action === 'toggle-complete') {
            const assignment = assignments.find(a => a.id === id);
            if (assignment) {
                assignment.status = assignment.status === 'completed' ? 'pending' : 'completed';
                if (assignment.status === 'pending') {
                    assignment.grade = null; // Remove grade if marked pending
                }
                saveData();
                updateAssignmentsList();
                updateDashboardStats();
                updateUpcomingDeadlines();
                updateGradesDisplay();
                renderCalendar(); // Update calendar
                showNotification(`Assignment marked as ${assignment.status}!`, 'info');
            }
        } else if (target.dataset.action === 'assign-grade') {
            const assignment = assignments.find(a => a.id === id);
            if (assignment) {
                let grade = prompt(`Enter grade for "${assignment.title}" (e.g., A+, B, 95%):`);
                if (grade !== null) {
                    assignment.grade = grade.trim();
                    saveData();
                    updateAssignmentsList();
                    updateDashboardStats();
                    updateGradesDisplay();
                    showNotification('Grade assigned successfully!', 'success');
                }
            }
        } else if (target.dataset.action === 'remove-assignment') {
            if (confirm('Are you sure you want to delete this assignment?')) {
                assignments = assignments.filter(a => a.id !== id);
                saveData();
                updateAssignmentsList();
                updateDashboardStats();
                updateUpcomingDeadlines();
                updateGradesDisplay();
                renderCalendar(); // Update calendar
                showNotification('Assignment deleted!', 'info');
            }
        }
    });

    // Lectures
    const populateLectureModalSelects = () => {
        if (lectureSubjectSelect) {
            lectureSubjectSelect.innerHTML = '<option value="">Select Subject</option>' +
                subjects.map(s => `<option value="${s}">${s}</option>`).join('');
        }
        if (lectureSemesterSelect) {
            lectureSemesterSelect.innerHTML = '<option value="">Select Semester</option>' +
                semesters.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        }
    };

    const updateLecturesList = () => {
        if (!lecturesListEl) return;

        const filterSemesterId = parseInt(lectureSemesterFilter?.value) || 'all';

        const filteredLectures = lectures.filter(l => {
            const matchesSemester = (filterSemesterId === 'all') || (l.semesterId === filterSemesterId);
            return matchesSemester;
        }).sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));

        lecturesListEl.innerHTML = filteredLectures.length === 0
            ? '<p class="no-items">No lectures found for the current filters.</p>'
            : filteredLectures.map(l => {
                const semesterName = semesters.find(s => s.id === l.semesterId)?.name || 'N/A';
                return `
                    <div class="lecture-card">
                        <h3>${l.title}</h3>
                        <p><strong>Subject:</strong> ${l.subject}</p>
                        <p><strong>Semester:</strong> ${semesterName}</p>
                        <p><strong>Date:</strong> ${l.date}</p>
                        <p><strong>Time:</strong> ${l.time}</p>
                        <p><strong>Location:</strong> ${l.location || 'N/A'}</p>
                        <div class="lecture-actions">
                            <button class="btn-delete-item" data-id="${l.id}" data-action="remove-lecture">Delete</button>
                        </div>
                    </div>
                `;
            }).join('');
    };

    lectureForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const newLecture = {
            id: nextLectureId++,
            title: document.getElementById('lectureTitle').value,
            subject: document.getElementById('lectureSubject').value,
            semesterId: parseInt(document.getElementById('lectureSemester').value),
            date: document.getElementById('lectureDate').value,
            time: document.getElementById('lectureTime').value,
            location: document.getElementById('lectureLocation').value
        };
        lectures.push(newLecture);
        saveData();
        updateLecturesList();
        renderCalendar(); // Update calendar with new lecture
        updateTodaySchedule();
        showNotification('Lecture added successfully!', 'success');
        document.getElementById('lectureModal').style.display = 'none';
        lectureForm.reset();
    });

    const populateLectureSemesterFilter = () => {
        if (lectureSemesterFilter) {
            const currentVal = lectureSemesterFilter.value;
            lectureSemesterFilter.innerHTML = '<option value="all">All Semesters</option>' +
                semesters.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
            if (currentVal) lectureSemesterFilter.value = currentVal;
        }
    };

    lectureSemesterFilter?.addEventListener('change', updateLecturesList);

    // Event Delegation for Lecture Deletion
    lecturesListEl?.addEventListener('click', (e) => {
        const target = e.target;
        if (target.dataset.action === 'remove-lecture') {
            const id = parseInt(target.dataset.id);
            if (confirm('Are you sure you want to delete this lecture?')) {
                lectures = lectures.filter(l => l.id !== id);
                saveData();
                updateLecturesList();
                renderCalendar(); // Update calendar
                updateTodaySchedule();
                showNotification('Lecture deleted!', 'info');
            }
        }
    });

    // Schedule (FullCalendar)
    const renderCalendar = () => {
        const calendarEl = document.getElementById('fullCalendar');
        if (!calendarEl) {
             console.warn("FullCalendar element not found.");
             return; // Exit if element is not in DOM
        }

        const currentFilterSemesterId = parseInt(scheduleSemesterFilter?.value) || 'all';

        const events = [];

        // Add assignments as events
        assignments.forEach(a => {
            if (currentFilterSemesterId === 'all' || a.semesterId === currentFilterSemesterId) {
                events.push({
                    id: `assignment-${a.id}`,
                    title: `Assignment: ${a.title} (${a.subject})`,
                    start: `${a.dueDate}T${a.dueTime}`,
                    color: a.status === 'completed' ? '#28a745' : (new Date(`${a.dueDate}T${a.dueTime}`) < new Date() ? '#dc3545' : '#007bff'),
                    extendedProps: { type: 'assignment', status: a.status, priority: a.priority }
                });
            }
        });

        // Add lectures as events
        lectures.forEach(l => {
            if (currentFilterSemesterId === 'all' || l.semesterId === currentFilterSemesterId) {
                events.push({
                    id: `lecture-${l.id}`,
                    title: `Lecture: ${l.title} (${l.subject})`,
                    start: `${l.date}T${l.time}`,
                    color: '#6f42c1', // Purple for lectures
                    extendedProps: { type: 'lecture', location: l.location }
                });
            }
        });

        if (calendar) {
            calendar.destroy(); // Destroy existing calendar instance before re-rendering
        }

        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: events,
            eventDidMount: function(info) {
                // Add tooltips or custom rendering if needed
            },
            eventClick: function(info) {
                // Optional: Handle click on an event to show details
                let eventType = info.event.extendedProps.type;
                let details = `<h4>${info.event.title}</h4>`;
                if (eventType === 'assignment') {
                    details += `<p>Due: ${new Date(info.event.start).toLocaleString()}</p>`;
                    details += `<p>Status: ${info.event.extendedProps.status}</p>`;
                    details += `<p>Priority: ${info.event.extendedProps.priority}</p>`;
                } else if (eventType === 'lecture') {
                    details += `<p>Time: ${new Date(info.event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>`;
                    details += `<p>Location: ${info.event.extendedProps.location || 'N/A'}</p>`;
                }
                showNotification(details, 'info', 5000); // Display event info in a notification
            }
        });
        calendar.render();
    };

    const populateScheduleSemesterFilter = () => {
        if (scheduleSemesterFilter) {
            const currentVal = scheduleSemesterFilter.value;
            scheduleSemesterFilter.innerHTML = '<option value="all">All Semesters</option>' +
                semesters.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
            if (currentVal) scheduleSemesterFilter.value = currentVal;
        }
    };

    scheduleSemesterFilter?.addEventListener('change', renderCalendar);


    // Grades
    const updateGradesDisplay = () => {
        if (!currentGPAEl || !semesterStatsEl || !subjectGradesEl) return;

        const filterSemesterId = parseInt(gradesSemesterFilter?.value) || 'all';

        const filteredAssignments = assignments.filter(a =>
            a.grade && (filterSemesterId === 'all' || a.semesterId === filterSemesterId)
        );

        // Calculate Average Grade / GPA
        let totalPoints = 0;
        let totalAssignmentsWithGrades = 0;
        filteredAssignments.forEach(a => {
            // Simple numerical grade conversion for average.
            // For true GPA, you'd need credit hours and letter grade mapping.
            const gradeNum = parseFloat(a.grade);
            if (!isNaN(gradeNum)) {
                totalPoints += gradeNum;
                totalAssignmentsWithGrades++;
            }
        });

        const averageGrade = totalAssignmentsWithGrades > 0 ? (totalPoints / totalAssignmentsWithGrades).toFixed(2) : 'N/A';
        currentGPAEl.textContent = averageGrade; // Renamed to average grade for simplicity

        // Semester Stats (if applicable, though current setup is GPA per subject)
        semesterStatsEl.innerHTML = `
            <p><strong>Total Graded Assignments:</strong> ${filteredAssignments.length}</p>
        `;

        // Grades per Subject
        const gradesBySubject = {};
        filteredAssignments.forEach(a => {
            if (!gradesBySubject[a.subject]) {
                gradesBySubject[a.subject] = [];
            }
            gradesBySubject[a.subject].push(a);
        });

        subjectGradesEl.innerHTML = Object.keys(gradesBySubject).length === 0
            ? '<p class="no-items">No graded assignments for the selected filters.</p>'
            : Object.keys(gradesBySubject).map(subject => {
                const subjectAssignments = gradesBySubject[subject];
                const subjectTotalPoints = subjectAssignments.reduce((sum, a) => sum + (parseFloat(a.grade) || 0), 0);
                const subjectAverage = (subjectTotalPoints / subjectAssignments.length).toFixed(2);

                return `
                    <div class="subject-grade-card">
                        <h3>${subject} <span class="subject-avg-grade">Avg: ${subjectAverage}</span></h3>
                        <ul>
                            ${subjectAssignments.map(a => `
                                <li>
                                    <span>${a.title}</span>
                                    <span>${a.grade}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            }).join('');
    };

    const populateGradesSemesterFilter = () => {
        if (gradesSemesterFilter) {
            const currentVal = gradesSemesterFilter.value;
            gradesSemesterFilter.innerHTML = '<option value="all">All Semesters</option>' +
                semesters.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
            if (currentVal) gradesSemesterFilter.value = currentVal;
        }
    };

    gradesSemesterFilter?.addEventListener('change', updateGradesDisplay);

    // Profile Management
    const loadProfileData = () => {
        if (fullNameInput) fullNameInput.value = profileData.fullName || '';
        if (emailInput) emailInput.value = profileData.email || '';
        if (phoneInput) phoneInput.value = profileData.phone || '';
        if (studentIdInput) studentIdInput.value = profileData.studentId || '';
        if (majorInput) majorInput.value = profileData.major || '';
        if (yearSelect) yearSelect.value = profileData.year || '';

        if (studentNameEl) studentNameEl.textContent = profileData.fullName || 'Student Name';
        if (studentIdDisplayEl) studentIdDisplayEl.textContent = `Student ID: ${profileData.studentId || 'N/A'}`;
        if (studentMajorEl) studentMajorEl.textContent = `Major: ${profileData.major || 'N/A'}`;
        if (studentYearEl) studentYearEl.textContent = `Year: ${profileData.year || 'N/A'}`;
        if (profilePictureEl) profilePictureEl.src = profilePictureData;
    };

    profileForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        profileData = {
            fullName: fullNameInput.value,
            email: emailInput.value,
            phone: phoneInput.value,
            studentId: studentIdInput.value,
            major: majorInput.value,
            year: yearSelect.value
        };
        saveData();
        loadProfileData(); // Update displayed info immediately
        showNotification('Profile updated successfully!', 'success');
    });

    profilePicUpload?.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                profilePictureData = e.target.result;
                if (profilePictureEl) profilePictureEl.src = profilePictureData;
                saveData();
                showNotification('Profile picture updated!', 'success');
            };
            reader.readAsDataURL(file);
        }
    });

    // --- Dashboard Specific Updates ---

    const updateDashboardStats = () => {
        const total = assignments.length;
        const completed = assignments.filter(a => a.status === 'completed').length;
        const pending = total - completed;

        if (totalAssignmentsEl) totalAssignmentsEl.textContent = total;
        if (completedAssignmentsEl) completedAssignmentsEl.textContent = completed;
        if (pendingAssignmentsEl) pendingAssignmentsEl.textContent = pending;

        const gradedAssignments = assignments.filter(a => a.grade && !isNaN(parseFloat(a.grade)));
        const totalGradePoints = gradedAssignments.reduce((sum, a) => sum + parseFloat(a.grade), 0);
        const avgGrade = gradedAssignments.length > 0 ? (totalGradePoints / gradedAssignments.length).toFixed(2) : 'N/A';
        if (averageGradeEl) averageGradeEl.textContent = avgGrade;
    };

    const updateUpcomingDeadlines = () => {
        if (!upcomingDeadlinesEl) return;
        const now = new Date();
        const upcoming = assignments
            .filter(a => a.status === 'pending' && new Date(a.dueDate + 'T' + a.dueTime) > now)
            .sort((a, b) => new Date(a.dueDate + 'T' + a.dueTime) - new Date(b.dueDate + 'T' + b.dueTime))
            .slice(0, 5); // Show top 5 upcoming

        if (upcoming.length === 0) {
            upcomingDeadlinesEl.innerHTML = '<p class="no-items">No upcoming assignments.</p>';
        } else {
            upcomingDeadlinesEl.innerHTML = upcoming.map(a => {
                const dueDateObj = new Date(a.dueDate + 'T' + a.dueTime);
                const timeString = dueDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return `
                    <div class="deadline-item">
                        <span>${a.title} (${a.subject})</span>
                        <span>${dueDateObj.toLocaleDateString()} at ${timeString}</span>
                    </div>
                `;
            }).join('');
        }
    };

    const updateTodaySchedule = () => {
        if (!todayScheduleEl) return;
        const today = new Date().toISOString().slice(0, 10); //YYYY-MM-DD

        const todayLectures = lectures
            .filter(l => l.date === today)
            .sort((a, b) => a.time.localeCompare(b.time));

        if (todayLectures.length === 0) {
            todayScheduleEl.innerHTML = '<p class="no-items">No lectures scheduled for today.</p>';
        } else {
            todayScheduleEl.innerHTML = todayLectures.map(l => `
                <div class="schedule-item">
                    <span>${l.time} - ${l.title} (${l.subject})</span>
                    <span>${l.location || 'N/A'}</span>
                </div>
            `).join('');
        }
    };

    // --- Pomodoro Timer Logic ---
    const updateTimerDisplay = () => {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        if (timerDisplay) timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const startTimer = () => {
        if (!isPaused) return;

        isPaused = false;
        if (startTimerBtn) {
            startTimerBtn.textContent = 'Pause';
            startTimerBtn.classList.remove('btn-primary');
            startTimerBtn.classList.add('btn-warning');
        }

        pomodoroTimer = setInterval(() => {
            timeRemaining--;
            updateTimerDisplay();

            if (timeRemaining <= 0) {
                clearInterval(pomodoroTimer);
                if (sessionType === 'work') {
                    workSessionsCompleted++;
                    showNotification('Work session completed! Time for a break.', 'success', 4000);
                    sessionType = (workSessionsCompleted % 4 === 0) ? 'long-break' : 'break';
                    timeRemaining = (sessionType === 'long-break') ? LONG_BREAK_TIME : BREAK_TIME;
                    if (timerStatus) timerStatus.textContent = sessionType === 'long-break' ? 'Long Break' : 'Break Session';
                } else {
                    showNotification('Break completed! Time to get back to work.', 'info', 4000);
                    sessionType = 'work';
                    timeRemaining = WORK_TIME;
                    if (timerStatus) timerStatus.textContent = 'Work Session';
                }
                isPaused = true;
                if (startTimerBtn) {
                    startTimerBtn.textContent = 'Start';
                    startTimerBtn.classList.remove('btn-warning');
                    startTimerBtn.classList.add('btn-primary');
                }
                updateTimerDisplay(); // Update display to new session time
            }
        }, 1000);
    };

    const resetTimer = () => {
        clearInterval(pomodoroTimer);
        isPaused = true;
        sessionType = 'work';
        timeRemaining = WORK_TIME;
        workSessionsCompleted = 0;
        if (timerStatus) timerStatus.textContent = 'Work Session';
        if (startTimerBtn) {
            startTimerBtn.textContent = 'Start';
            startTimerBtn.classList.remove('btn-warning');
            startTimerBtn.classList.add('btn-primary');
        }
        updateTimerDisplay();
    };

    startTimerBtn?.addEventListener('click', () => {
        if (isPaused) {
            startTimer();
        } else {
            clearInterval(pomodoroTimer);
            isPaused = true;
            if (startTimerBtn) {
                startTimerBtn.textContent = 'Resume';
                startTimerBtn.classList.remove('btn-warning');
                startTimerBtn.classList.add('btn-primary');
            }
        }
    });

    resetTimerBtn?.addEventListener('click', resetTimer);

    // Initialize Pomodoro Timer
    timeRemaining = WORK_TIME;
    updateTimerDisplay();

    // --- Daily To-Do List ---
    const updateTodoList = () => {
        if (!todoListEl) return;
        todoListEl.innerHTML = todos.map((todo, index) => `
            <li class="${todo.completed ? 'completed' : ''}">
                <input type="checkbox" data-index="${index}" ${todo.completed ? 'checked' : ''}>
                <span>${todo.text}</span>
                <button class="btn-delete-item" data-index="${index}" data-action="delete-todo">Delete</button>
            </li>
        `).join('');
    };

    todoForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const todoInput = document.getElementById('todoInput');
        const taskText = todoInput.value.trim();
        if (taskText) {
            todos.push({ text: taskText, completed: false });
            saveData();
            updateTodoList();
            showNotification('Task added!', 'success');
            todoInput.value = '';
        }
    });

    todoListEl?.addEventListener('change', (e) => {
        const target = e.target;
        if (target.type === 'checkbox' && target.dataset.index) {
            const index = parseInt(target.dataset.index);
            if (!isNaN(index) && todos[index]) {
                todos[index].completed = target.checked;
                saveData();
                updateTodoList();
                showNotification(`Task marked as ${target.checked ? 'completed' : 'pending'}!`, 'info');
            }
        }
    });

    todoListEl?.addEventListener('click', (e) => {
        const target = e.target;
        if (target.dataset.action === 'delete-todo' && target.dataset.index) {
            if (confirm('Are you sure you want to delete this task?')) {
                const index = parseInt(target.dataset.index);
                if (!isNaN(index) && todos[index]) {
                    todos.splice(index, 1);
                    saveData();
                    updateTodoList();
                    showNotification('Task deleted!', 'info');
                }
            }
        }
    });

    // --- AI Assistant Logic (Placeholder) ---
    toggleChatBtn?.addEventListener('click', () => {
        chatAssistantSection?.classList.toggle('minimized');
        toggleChatBtn.querySelector('i')?.classList.toggle('fa-minus');
        toggleChatBtn.querySelector('i')?.classList.toggle('fa-plus');
    });

    const appendMessage = (sender, message) => {
        if (!chatMessagesEl) return;
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('chat-message', sender);
        msgDiv.innerHTML = message;
        chatMessagesEl.appendChild(msgDiv);
        chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight; // Auto-scroll to latest
    };

    sendChatBtn?.addEventListener('click', () => {
        const userMessage = chatInputEl.value.trim();
        if (userMessage) {
            appendMessage('user', userMessage);
            chatInputEl.value = '';
            // Simulate AI response
            setTimeout(() => {
                const aiResponse = generateAIResponse(userMessage);
                appendMessage('ai', aiResponse);
            }, 500);
        }
    });

    chatInputEl?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatBtn.click();
        }
    });

    const generateAIResponse = (message) => {
        message = message.toLowerCase();
        if (message.includes('assignments pending')) {
            const pendingCount = assignments.filter(a => a.status === 'pending').length;
            return `You have ${pendingCount} assignments pending.`;
        } else if (message.includes('upcoming deadlines')) {
            const now = new Date();
            const upcoming = assignments
                .filter(a => a.status === 'pending' && new Date(a.dueDate + 'T' + a.dueTime) > now)
                .sort((a, b) => new Date(a.dueDate + 'T' + a.dueTime) - new Date(b.dueDate + 'T' + b.dueTime))
                .slice(0, 3);
            if (upcoming.length > 0) {
                return "Here are your top 3 upcoming deadlines: " +
                       upcoming.map(a => `${a.title} (${a.subject}) due on ${a.dueDate}`).join(', ') + ".";
            } else {
                return "You have no upcoming deadlines! Great job!";
            }
        } else if (message.includes('total assignments')) {
            return `You have a total of ${assignments.length} assignments recorded.`;
        } else if (message.includes('hello') || message.includes('hi')) {
            return "Hello there! How can I assist you today?";
        } else if (message.includes('grades')) {
            const gradedCount = assignments.filter(a => a.grade !== null).length;
            if (gradedCount > 0) {
                return "I can show you your grades on the Grades tab. Your current average grade is likely displayed there.";
            } else {
                return "You haven't recorded any grades yet. Once you do, I can help summarize them.";
            }
        } else if (message.includes('today schedule')) {
            const today = new Date().toISOString().slice(0, 10);
            const todayLectures = lectures.filter(l => l.date === today);
            if (todayLectures.length > 0) {
                return `Today, ${todayLectures.map(l => `${l.title} at ${l.time}`).join(', ')}.`;
            } else {
                return "You have no lectures scheduled for today.";
            }
        }
        return "I'm not sure how to answer that. Can you rephrase or ask about assignments, lectures, or schedules?";
    };

    // --- Initial Load and Data Render ---
    const init = () => {
        // Set current date on dashboard
        if (currentDateEl) {
            currentDateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }

        // Initialize and populate all dropdowns first
        // This is crucial because other update functions (like updateAssignmentsList)
        // depend on these filters being populated with current subject/semester data.
        populateAssignmentModalSelects();
        populateLectureModalSelects();
        populateSemesterFilters(); // This populates all filter dropdowns (assignment, lecture, schedule, grades)
        updateSubjectList(); // Needed for manage subjects modal

        // Then load and update all UI sections
        loadProfileData();
        updateDashboardStats();
        updateUpcomingDeadlines();
        updateTodaySchedule();
        updateAssignmentsList();
        updateLecturesList();
        updateTodoList();
        updateGradesDisplay();
        renderCalendar(); // Render calendar after all data and filters are loaded
    };

    init();
});
