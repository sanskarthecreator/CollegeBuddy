document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, initializing CollegeBuddy...');

    // --- Data Initialization ---
    let assignments = JSON.parse(localStorage.getItem('assignments')) || [];
    let lectures = JSON.parse(localStorage.getItem('lectures')) || [];
    let subjects = JSON.parse(localStorage.getItem('subjects')) || [];
    let semesters = JSON.parse(localStorage.getItem('semesters')) || [];
    // Initialize profile with default values or from localStorage, including picture
    let profile = JSON.parse(localStorage.getItem('profile')) || { name: '', id: '', major: '', year: '', email: '', phone: '', picture: '' };
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    let recentActivity = JSON.parse(localStorage.getItem('recentActivity')) || [];
    let darkMode = JSON.parse(localStorage.getItem('darkMode')) || false;

    const holidays = [
        { title: 'New Year’s Day', date: '2025-01-01', allDay: true },
        { title: 'Republic Day', date: '2025-01-26', allDay: true },
        { title: 'Holi', date: '2025-03-14', allDay: true },
        { title: 'Independence Day', date: '2025-08-15', allDay: true },
        { title: 'Diwali', date: '2025-10-20', allDay: true },
        { title: 'Christmas', date: '2025-12-25', allDay: true }
    ];

    // --- Utility Functions ---
    const notify = (msg, type = 'success') => {
        const div = document.createElement('div');
        div.className = `notification ${type}`;
        div.textContent = msg;
        document.getElementById('notificationContainer')?.appendChild(div);
        setTimeout(() => div.remove(), 3000);
    };

    const saveData = () => {
        try {
            localStorage.setItem('assignments', JSON.stringify(assignments));
            localStorage.setItem('lectures', JSON.stringify(lectures));
            localStorage.setItem('subjects', JSON.stringify(subjects));
            localStorage.setItem('semesters', JSON.stringify(semesters));
            localStorage.setItem('profile', JSON.stringify(profile)); // <--- VERIFIED: Profile data is saved here
            localStorage.setItem('todos', JSON.stringify(todos));
            localStorage.setItem('recentActivity', JSON.stringify(recentActivity));
            localStorage.setItem('darkMode', JSON.stringify(darkMode));
        } catch (e) {
            console.error('Error saving data:', e);
            notify('Error saving data! Please check browser storage settings.', 'error'); // Notify user of save error
        }
    };

    const logActivity = (msg) => {
        recentActivity.unshift({ id: Date.now(), message: msg, date: new Date().toISOString() });
        recentActivity = recentActivity.slice(0, 10); // Keep only the 10 most recent activities
        saveData();
        updateRecentActivity();
    };

    // Placeholder for sound function (implement if needed)
    const playSound = () => {
        // Example: new Audio('path/to/your/sound.mp3').play();
        console.log('Playing sound...');
    };

    // --- Navigation ---
    try {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Nav link clicked:', link.getAttribute('data-tab'));
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                const tab = document.getElementById(link.getAttribute('data-tab'));
                if (tab) tab.classList.add('active');

                // Trigger updates for relevant sections when a tab is activated
                if (link.getAttribute('data-tab') === 'dashboard') {
                    updateDashboardStats();
                    updateUpcomingDeadlines();
                    updateTodaySchedule();
                    updateRecentActivity();
                } else if (link.getAttribute('data-tab') === 'assignments') {
                    updateAssignmentsList();
                } else if (link.getAttribute('data-tab') === 'lectures') {
                    updateLecturesList();
                } else if (link.getAttribute('data-tab') === 'grades') {
                    updateGrades();
                } else if (link.getAttribute('data-tab') === 'schedule') {
                    updateCalendar(); // Re-render calendar when schedule tab is active
                } else if (link.getAttribute('data-tab') === 'profile') {
                    loadProfileData(); // Ensure profile data is loaded when profile tab is active
                }
            });
        });

        document.querySelector('.nav-toggle')?.addEventListener('click', () => {
            console.log('Nav toggle clicked');
            document.querySelector('.nav-menu')?.classList.toggle('active');
        });
    } catch (e) {
        console.error('Error setting up navigation:', e);
    }

    // --- Dark Mode ---
    const toggleDarkMode = () => {
        darkMode = !darkMode;
        document.body.classList.toggle('dark-mode');
        document.getElementById('darkModeToggle').innerHTML = `<i class="fas fa-${darkMode ? 'sun' : 'moon'}"></i>`;
        saveData();
        console.log('Dark mode toggled:', darkMode);
    };

    document.getElementById('darkModeToggle')?.addEventListener('click', toggleDarkMode);

    // Apply dark mode on initial load
    if (darkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').innerHTML = `<i class="fas fa-sun"></i>`;
    }

    // --- Modals ---
    try {
        document.querySelectorAll('[data-modal-target]').forEach(btn => { // Changed data-modal to data-modal-target for clarity
            btn.addEventListener('click', () => {
                const modalId = btn.getAttribute('data-modal-target');
                console.log('Modal button clicked:', modalId);
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.style.display = 'flex';
                    modal.classList.add('show');
                    // Specific updates for modals
                    if (['assignmentModal', 'lectureModal'].includes(modalId)) {
                        updateSubjectOptions();
                        updateSemesterOptions();
                    }
                    if (modalId === 'subjectModal') updateSubjectList();
                    if (modalId === 'semesterModal') updateSemesterList();
                }
            });
        });

        document.querySelectorAll('[data-close-modal], .close').forEach(btn => { // Changed data-close to data-close-modal
            btn.addEventListener('click', () => {
                const modalId = btn.getAttribute('data-close-modal') || btn.closest('.modal')?.id; // Get ID from data-attribute or closest modal parent
                console.log('Close button clicked for modal:', modalId);
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.classList.remove('show');
                    setTimeout(() => modal.style.display = 'none', 300);
                }
            });
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    console.log('Modal background clicked');
                    modal.classList.remove('show');
                    setTimeout(() => modal.style.display = 'none', 300);
                }
            });
        });
    } catch (e) {
        console.error('Error setting up modals:', e);
    }

    // --- Subjects Management ---
    const updateSubjectOptions = () => {
        ['assignmentSubject', 'lectureSubject'].forEach(id => {
            const select = document.getElementById(id);
            if (select) select.innerHTML = '<option value="">Select Subject</option>' + subjects.map(s => `<option value="${s}">${s}</option>`).join('');
        });
    };

    document.getElementById('subjectForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const subjectInput = document.getElementById('newSubject');
        const subject = subjectInput?.value.trim();
        if (subject && !subjects.includes(subject)) {
            subjects.push(subject);
            saveData();
            updateSubjectList();
            updateSubjectOptions();
            notify('Subject added!');
            subjectInput.value = ''; // Clear input field
        } else {
            notify('Invalid or duplicate subject.', 'error');
        }
    });

    const updateSubjectList = () => {
        const list = document.getElementById('subjectList');
        if (list) list.innerHTML = subjects.map(s => `<li>${s}<button class="btn-delete-item" onclick="deleteSubject('${s}')">Delete</button></li>`).join('');
    };

    window.deleteSubject = (subject) => {
        if (assignments.some(a => a.subject === subject) || lectures.some(l => l.subject === subject)) {
            notify('Subject is currently in use by assignments or lectures and cannot be deleted.', 'error');
            return;
        }
        if (confirm(`Are you sure you want to delete the subject "${subject}"?`)) {
            subjects = subjects.filter(s => s !== subject);
            saveData();
            updateSubjectList();
            updateSubjectOptions();
            notify('Subject deleted!');
            logActivity(`Deleted subject: ${subject}`);
        }
    };

    // --- Semesters Management ---
    const updateSemesterOptions = () => {
        ['assignmentSemester', 'lectureSemester', 'semesterFilter', 'lectureSemesterFilter', 'scheduleSemesterFilter', 'gradesSemesterFilter'].forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                const currentSelection = select.value; // Preserve current selection if possible
                select.innerHTML = '<option value="all">All Semesters</option>' + semesters.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
                if (select.querySelector(`option[value="${currentSelection}"]`)) {
                    select.value = currentSelection;
                }
            }
        });
    };

    document.getElementById('semesterForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('semesterName');
        const startInput = document.getElementById('semesterStart');
        const endInput = document.getElementById('semesterEnd');

        const name = nameInput?.value.trim();
        const start = startInput?.value;
        const end = endInput?.value;

        if (name && start && end && new Date(start) <= new Date(end)) {
            semesters.push({ id: Date.now(), name, start, end });
            saveData();
            updateSemesterList();
            updateSemesterOptions();
            notify('Semester added!');
            e.target.reset(); // Clear form
        } else {
            notify('Invalid semester details. Ensure all fields are filled and end date is not before start date.', 'error');
        }
    });

    const updateSemesterList = () => {
        const list = document.getElementById('semesterList');
        if (list) list.innerHTML = semesters.map(s => `<li>${s.name} (${s.start} to ${s.end})<button class="btn-delete-item" onclick="deleteSemester(${s.id})">Delete</button></li>`).join('');
    };

    window.deleteSemester = (id) => {
        if (assignments.some(a => a.semesterId === id) || lectures.some(l => l.semesterId === id)) {
            notify('Semester is currently in use by assignments or lectures and cannot be deleted.', 'error');
            return;
        }
        if (confirm('Are you sure you want to delete this semester?')) {
            semesters = semesters.filter(s => s.id !== id);
            saveData();
            updateSemesterList();
            updateSemesterOptions();
            notify('Semester deleted!');
            logActivity(`Deleted semester: ${semesters.find(s => s.id === id)?.name || id}`); // Log name if found
        }
    };

    // --- Assignments Management ---
    document.getElementById('assignmentForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const assignment = {
            id: Date.now(),
            title: document.getElementById('assignmentTitle')?.value.trim(),
            subject: document.getElementById('assignmentSubject')?.value,
            semesterId: parseInt(document.getElementById('assignmentSemester')?.value),
            dueDate: document.getElementById('assignmentDueDate')?.value,
            dueTime: document.getElementById('assignmentDueTime')?.value,
            priority: document.getElementById('assignmentPriority')?.value,
            status: 'pending',
            grade: null
        };
        if (!assignment.title || !assignment.subject || isNaN(assignment.semesterId) || !assignment.dueDate || !assignment.dueTime) {
            notify('Please fill all required fields for the assignment.', 'error');
            return;
        }
        assignments.push(assignment);
        saveData();
        logActivity(`Added assignment: ${assignment.title}`);
        updateAssignmentsList();
        updateDashboardStats();
        updateUpcomingDeadlines();
        updateGrades();
        updateCalendar();
        notify('Assignment added successfully!');
        e.target.reset();
        const modal = document.getElementById('assignmentModal');
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
    });

    window.removeAssignment = (id) => {
        const assignmentToRemove = assignments.find(a => a.id === id);
        if (assignmentToRemove && confirm(`Delete assignment: "${assignmentToRemove.title}"?`)) {
            assignments = assignments.filter(a => a.id !== id);
            saveData();
            logActivity(`Deleted assignment: ${assignmentToRemove.title}`);
            updateAssignmentsList();
            updateDashboardStats();
            updateUpcomingDeadlines();
            updateGrades();
            updateCalendar();
            notify('Assignment deleted!');
        }
    };

    window.markAsCompleted = (id) => {
        const a = assignments.find(a => a.id === id);
        if (a) {
            a.status = a.status === 'completed' ? 'pending' : 'completed';
            saveData();
            logActivity(`Marked ${a.title} as ${a.status}`);
            updateAssignmentsList();
            updateDashboardStats();
            updateGrades();
            updateCalendar();
            notify(`Assignment marked as ${a.status}!`);
        }
    };

    window.assignGrade = (id) => {
        const a = assignments.find(a => a.id === id);
        if (a) {
            let grade = prompt(`Enter grade for "${a.title}" (0-100):`);
            if (grade === null) return; // User cancelled
            const gradeNum = parseFloat(grade);
            if (!isNaN(gradeNum) && gradeNum >= 0 && gradeNum <= 100) {
                a.grade = gradeNum;
                saveData();
                logActivity(`Graded ${a.title}: ${gradeNum}%`);
                updateAssignmentsList();
                updateGrades();
                updateDashboardStats();
                notify('Grade assigned!');
            } else {
                notify('Invalid grade. Please enter a number between 0 and 100.', 'error');
            }
        }
    };

    const updateAssignmentsList = () => {
        const list = document.getElementById('assignmentsList');
        if (!list) return;
        const filter = document.getElementById('assignmentFilter')?.value;
        const semesterId = parseInt(document.getElementById('semesterFilter')?.value) || 'all';

        const filteredAssignments = assignments
            .filter(a => {
                if (semesterId !== 'all' && a.semesterId !== semesterId) return false;
                if (filter === 'all') return true;
                if (filter === 'overdue') return new Date(`${a.dueDate}T${a.dueTime}`) < new Date() && a.status !== 'completed';
                return a.status === filter;
            })
            .sort((a, b) => new Date(`${a.dueDate}T${a.dueTime}`) - new Date(`${b.dueDate}T${b.dueTime}`)); // Sort by due date

        list.innerHTML = filteredAssignments.length > 0 ? filteredAssignments
            .map(a => `
                <div class="assignment-card">
                    <h3>${a.title}</h3>
                    <p>Subject: ${a.subject}</p>
                    <p>Semester: ${semesters.find(s => s.id === a.semesterId)?.name || 'N/A'}</p>
                    <p>Due: ${a.dueDate} ${a.dueTime}</p>
                    <p>Priority: ${a.priority}</p>
                    <p>Status: ${a.status}</p>
                    <p>Grade: ${a.grade !== null ? a.grade + '%' : 'Not graded'}</p>
                    <div class="assignment-actions">
                        <button class="btn-secondary" onclick="markAsCompleted(${a.id})">${a.status === 'completed' ? 'Mark Pending' : 'Mark Completed'}</button>
                        <button class="btn-secondary" onclick="assignGrade(${a.id})">Grade</button>
                        <button class="btn-delete-item" onclick="removeAssignment(${a.id})">Delete</button>
                    </div>
                </div>
            `)
            .join('') : '<p>No assignments found for the selected filters.</p>';
    };

    // --- Lectures Management ---
    document.getElementById('lectureForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const lecture = {
            id: Date.now(),
            title: document.getElementById('lectureTitle')?.value.trim(),
            subject: document.getElementById('lectureSubject')?.value,
            semesterId: parseInt(document.getElementById('lectureSemester')?.value),
            date: document.getElementById('lectureDate')?.value,
            time: document.getElementById('lectureTime')?.value,
            location: document.getElementById('lectureLocation')?.value.trim(),
            duration: 90 // Hardcoded duration for now
        };
        if (!lecture.title || !lecture.subject || isNaN(lecture.semesterId) || !lecture.date || !lecture.time) {
            notify('Please fill all required fields for the lecture.', 'error');
            return;
        }
        lectures.push(lecture);
        saveData();
        logActivity(`Added lecture: ${lecture.title}`);
        updateLecturesList();
        updateTodaySchedule();
        updateCalendar();
        notify('Lecture added successfully!');
        e.target.reset();
        const modal = document.getElementById('lectureModal');
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
    });

    window.removeLecture = (id) => {
        const lectureToRemove = lectures.find(l => l.id === id);
        if (lectureToRemove && confirm(`Delete lecture: "${lectureToRemove.title}"?`)) {
            lectures = lectures.filter(l => l.id !== id);
            saveData();
            logActivity(`Deleted lecture: ${lectureToRemove.title}`);
            updateLecturesList();
            updateTodaySchedule();
            updateCalendar();
            notify('Lecture deleted!');
        }
    };

    const updateLecturesList = () => {
        const list = document.getElementById('lecturesList');
        if (!list) return;
        const semesterId = parseInt(document.getElementById('lectureSemesterFilter')?.value) || 'all';
        const filteredLectures = lectures
            .filter(l => semesterId === 'all' || l.semesterId === semesterId)
            .sort((a, b) => {
                const dateTimeA = new Date(`${a.date}T${a.time}`);
                const dateTimeB = new Date(`${b.date}T${b.time}`);
                return dateTimeA - dateTimeB;
            });

        list.innerHTML = filteredLectures.length > 0 ? filteredLectures
            .map(l => `
                <div class="assignment-card">
                    <h3>${l.title}</h3>
                    <p>Subject: ${l.subject}</p>
                    <p>Semester: ${semesters.find(s => s.id === l.semesterId)?.name || 'N/A'}</p>
                    <p>Date: ${l.date} ${l.time}</p>
                    <p>Location: ${l.location || 'N/A'}</p>
                    <button class="btn-delete-item" onclick="removeLecture(${l.id})">Delete</button>
                </div>
            `)
            .join('') : '<p>No lectures found for the selected semester.</p>';
    };

    // --- Dashboard Stats ---
    const updateDashboardStats = () => {
        document.getElementById('totalAssignments').textContent = assignments.length;
        document.getElementById('completedAssignments').textContent = assignments.filter(a => a.status === 'completed').length;
        document.getElementById('pendingAssignments').textContent = assignments.filter(a => a.status !== 'completed').length;
        document.getElementById('averageGrade').textContent = calculateAverageGrade();
    };

    const calculateAverageGrade = () => {
        const grades = assignments.filter(a => a.grade !== null).map(a => a.grade);
        if (!grades.length) return 'N/A';
        const avg = (grades.reduce((sum, g) => sum + g, 0) / grades.length).toFixed(1);
        return `${avg}% (${getLetterGrade(parseFloat(avg))})`;
    };

    const getLetterGrade = (grade) => {
        if (grade >= 90) return 'A';
        if (grade >= 80) return 'B';
        if (grade >= 70) return 'C';
        if (grade >= 60) return 'D';
        return 'F';
    };

    // --- Upcoming Deadlines ---
    const updateUpcomingDeadlines = () => {
        const list = document.getElementById('upcomingDeadlines');
        if (!list) return;
        const now = new Date();
        const upcoming = assignments
            .filter(a => a.status !== 'completed' && new Date(`${a.dueDate}T${a.dueTime}`) > now)
            .sort((a, b) => new Date(`${a.dueDate}T${a.dueTime}`) - new Date(`${b.dueDate}T${b.dueTime}`))
            .slice(0, 5);

        list.innerHTML = upcoming.length > 0 ? upcoming
            .map(a => `<p>${a.title} (${a.subject}) - Due: ${a.dueDate} ${a.dueTime}</p>`)
            .join('') : '<p>No upcoming deadlines.</p>';
    };

    // --- Today's Schedule ---
    const updateTodaySchedule = () => {
        const list = document.getElementById('todaySchedule');
        if (!list) return;
        const today = new Date().toISOString().split('T')[0];
        const todaysLectures = lectures
            .filter(l => l.date === today)
            .sort((a, b) => a.time.localeCompare(b.time));

        list.innerHTML = todaysLectures.length > 0 ? todaysLectures
            .map(l => `<p>${l.title} (${l.subject}) - ${l.time} (${l.location || 'N/A'})</p>`)
            .join('') : '<p>No lectures scheduled for today.</p>';
    };

    // --- Grades ---
    const updateGrades = () => {
        const semesterId = parseInt(document.getElementById('gradesSemesterFilter')?.value) || 'all';
        const filteredAssignments = assignments.filter(a => semesterId === 'all' || a.semesterId === semesterId);

        // Update GPA
        document.getElementById('currentGPA').textContent = calculateGPA(filteredAssignments).toFixed(2);

        // Update Semester Stats (Average grade per subject for the filtered semester)
        const semesterStatsHtml = subjects
            .map(s => {
                const grades = filteredAssignments.filter(a => a.subject === s && a.grade !== null).map(a => a.grade);
                if (!grades.length) return '';
                const avg = grades.reduce((sum, g) => sum + g, 0) / grades.length;
                return `<p>${s}: ${avg.toFixed(1)}% (${getLetterGrade(parseFloat(avg.toFixed(1)))})</p>`;
            })
            .join('');
        document.getElementById('semesterStats').innerHTML = semesterStatsHtml || '<p>No graded assignments for this semester.</p>';


        // Update Subject Grades (Individual subject cards)
        const subjectGradesHtml = subjects
            .map(s => {
                const grades = filteredAssignments.filter(a => a.subject === s && a.grade !== null).map(a => a.grade);
                if (!grades.length) return '';
                const avg = grades.reduce((sum, g) => sum + g, 0) / grades.length;
                return `
                    <div class="assignment-card">
                        <h3>${s}</h3>
                        <p>Average: ${avg.toFixed(1)}% (${getLetterGrade(parseFloat(avg.toFixed(1)))})</p>
                        <p>Assignments Graded: ${grades.length}</p>
                    </div>
                `;
            })
            .join('');
        document.getElementById('subjectGrades').innerHTML = subjectGradesHtml || '<p>No subjects with graded assignments for the selected semester.</p>';
    };

    const calculateGPA = (filteredAssignments) => {
        const subjectAverages = {};
        filteredAssignments.forEach(a => {
            if (a.grade !== null) {
                if (!subjectAverages[a.subject]) {
                    subjectAverages[a.subject] = { sum: 0, count: 0 };
                }
                subjectAverages[a.subject].sum += a.grade;
                subjectAverages[a.subject].count++;
            }
        });

        const gpaPoints = Object.values(subjectAverages).map(data => {
            const avg = data.sum / data.count;
            // Convert percentage to 4.0 scale (simple linear conversion)
            // Example: 90-100 = 4.0, 80-89 = 3.0, etc. Adjust as per your university's scale
            if (avg >= 90) return 4.0;
            if (avg >= 80) return 3.0;
            if (avg >= 70) return 2.0;
            if (avg >= 60) return 1.0;
            return 0.0;
        });

        if (!gpaPoints.length) return 0.00;
        return (gpaPoints.reduce((sum, val) => sum + val, 0) / gpaPoints.length);
    };

    // --- FullCalendar Integration ---
    let calendar;
    const updateCalendar = () => {
        const semesterId = parseInt(document.getElementById('scheduleSemesterFilter')?.value) || 'all';
        const calendarEl = document.getElementById('fullCalendar');
        if (!calendarEl) return;

        // Destroy existing calendar instance before re-initializing
        if (calendar) calendar.destroy();

        try {
            calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                },
                events: [
                    // Lectures
                    ...lectures
                        .filter(l => semesterId === 'all' || l.semesterId === semesterId)
                        .map(l => ({
                            id: `lecture-${l.id}`,
                            title: `${l.title} (${l.subject})`,
                            start: `${l.date}T${l.time}`,
                            // Calculate end time for lectures based on duration
                            end: new Date(new Date(`${l.date}T${l.time}`).getTime() + l.duration * 60 * 1000).toISOString(),
                            classNames: ['lecture'],
                            color: '#6a5acd' // Consistent with CSS
                        })),
                    // Assignments (pending only)
                    ...assignments
                        .filter(a => (semesterId === 'all' || a.semesterId === semesterId) && a.status !== 'completed')
                        .map(a => ({
                            id: `assignment-${a.id}`,
                            title: `${a.title} (Due)`,
                            start: `${a.dueDate}T${a.dueTime}`,
                            classNames: ['assignment'],
                            color: '#ff69b4' // Consistent with CSS
                        })),
                    // Holidays
                    ...holidays
                        .filter(h => {
                            if (semesterId === 'all' || !semesters.length) return true; // Show all holidays if no semester is selected or if no semesters are defined
                            const semester = semesters.find(s => s.id === semesterId);
                            if (!semester) return false;
                            const holidayDate = new Date(h.date);
                            const semesterStartDate = new Date(semester.start);
                            const semesterEndDate = new Date(semester.end);
                            return holidayDate >= semesterStartDate && holidayDate <= semesterEndDate;
                        })
                        .map(h => ({
                            id: `holiday-${h.date}`, // Use date for unique ID
                            title: h.title,
                            start: h.date,
                            classNames: ['holiday'],
                            allDay: true,
                            color: '#4682b4' // Consistent with CSS
                        }))
                ],
                dateClick: (info) => {
                    console.log('Calendar date clicked:', info.dateStr);
                    const promptResponse = prompt(`You clicked on ${info.dateStr}.\nAdd (1) Lecture or (2) Assignment? Enter 1 or 2:`);
                    if (promptResponse === '1') {
                        document.getElementById('lectureDate').value = info.dateStr;
                        document.getElementById('lectureModal').style.display = 'flex';
                        document.getElementById('lectureModal').classList.add('show');
                        updateSubjectOptions();
                        updateSemesterOptions();
                    } else if (promptResponse === '2') {
                        document.getElementById('assignmentDueDate').value = info.dateStr;
                        document.getElementById('assignmentModal').style.display = 'flex';
                        document.getElementById('assignmentModal').classList.add('show');
                        updateSubjectOptions();
                        updateSemesterOptions();
                    }
                },
                eventClick: (info) => {
                    console.log('Calendar event clicked:', info.event.id);
                    const [type, id] = info.event.id.split('-');
                    if (type === 'holiday') {
                        alert(`Holiday: ${info.event.title}\nDate: ${new Date(info.event.start).toLocaleDateString()}`);
                        return;
                    }
                    if (confirm(`Are you sure you want to delete this ${type}: "${info.event.title}"?`)) {
                        if (type === 'lecture') {
                            removeLecture(parseInt(id));
                        } else if (type === 'assignment') {
                            removeAssignment(parseInt(id));
                        }
                    }
                }
            });
            calendar.render();
        } catch (e) {
            console.error('Error initializing FullCalendar:', e);
            notify('Failed to load calendar. Please try again.', 'error');
        }
    };

    // --- Profile Management ---
    // Get elements for profile picture handling
    const profilePicUpload = document.getElementById('profilePicUpload');
    const profilePicture = document.getElementById('profilePicture');

    // Get elements for form and displaying profile info
    const profileForm = document.getElementById('profileForm');
    const studentNameElement = document.getElementById('studentName');
    const studentIdDisplayElement = document.getElementById('studentIdDisplay');
    const studentMajorElement = document.getElementById('studentMajor');
    const studentYearElement = document.getElementById('studentYear');

    // Get input elements for form submission
    const fullNameInput = document.getElementById('fullName');
    const studentIdInput = document.getElementById('studentIdInput');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const majorInput = document.getElementById('major');
    const yearSelect = document.getElementById('year');

    // Function to load profile data into form and display
    const loadProfileData = () => {
        console.log('Loading profile data...');
        if (profile) {
            if (fullNameInput) fullNameInput.value = profile.name || '';
            if (studentIdInput) studentIdInput.value = profile.id || '';
            if (emailInput) emailInput.value = profile.email || '';
            if (phoneInput) phoneInput.value = profile.phone || '';
            if (majorInput) majorInput.value = profile.major || '';
            if (yearSelect) yearSelect.value = profile.year || '';

            // Update displayed profile info
            if (studentNameElement) studentNameElement.textContent = profile.name || 'Student';
            if (studentIdDisplayElement) studentIdDisplayElement.textContent = `Student ID: ${profile.id || 'N/A'}`;
            if (studentMajorElement) studentMajorElement.textContent = `Major: ${profile.major || 'N/A'}`;
            if (studentYearElement) studentYearElement.textContent = `Year: ${profile.year || 'N/A'}`;

            // Handle profile picture display (assuming `profile.picture` stores data URL)
            if (profilePicture && profile.picture) {
                profilePicture.src = profile.picture;
                console.log('Profile picture loaded from storage.');
            } else if (profilePicture) {
                profilePicture.src = 'https://via.placeholder.com/150'; // Default placeholder if no picture
                console.log('No profile picture found, using placeholder.');
            }
        }
    };

    // Function to handle profile picture upload
    if (profilePicUpload && profilePicture) {
        profilePicUpload.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    profilePicture.src = e.target.result;
                    profile.picture = e.target.result; // Save picture data to profile object
                    saveData(); // <--- VERIFIED FIX: Call saveData() immediately after updating picture
                    notify('Profile picture updated!');
                    logActivity('Profile picture updated.');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Event listener for profile form submission
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Profile form submitted.');

            // Collect form data into profile object
            profile.name = fullNameInput?.value.trim();
            profile.id = studentIdInput?.value.trim();
            profile.email = emailInput?.value.trim();
            profile.phone = phoneInput?.value.trim();
            profile.major = majorInput?.value.trim();
            profile.year = yearSelect?.value;

            saveData(); // <--- VERIFIED FIX: Call saveData() after updating profile object with form data
            logActivity('Updated profile information');
            loadProfileData(); // Reload data to ensure display is updated
            notify('Profile updated successfully!');
        });
    }

    // --- Pomodoro Timer ---
    let timerInterval;
    let timeLeft = 25 * 60; // Default to 25 minutes work session
    let isWorkSession = true;
    let cycleCount = 0;

    const updateTimerDisplay = () => {
        const min = Math.floor(timeLeft / 60);
        const sec = timeLeft % 60;
        document.getElementById('timerDisplay').textContent = `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
        document.getElementById('timerStatus').textContent = isWorkSession ? 'Work Session' : 'Break';
    };

    document.getElementById('startTimer')?.addEventListener('click', () => {
        console.log('Pomodoro start/pause clicked');
        if (!timerInterval) {
            timerInterval = setInterval(() => {
                if (timeLeft <= 0) {
                    playSound(); // Play sound when session ends
                    clearInterval(timerInterval); // Stop current interval
                    timerInterval = null; // Clear interval ID

                    if (isWorkSession) {
                        cycleCount++;
                        if (cycleCount % 4 === 0) {
                            timeLeft = 15 * 60; // Long break
                            notify('Time for a long break! (15 minutes)');
                        } else {
                            timeLeft = 5 * 60; // Short break
                            notify('Time for a short break! (5 minutes)');
                        }
                    } else { // It was a break, start a new work session
                        timeLeft = 25 * 60; // New work session
                        notify('Back to work! (25 minutes)');
                    }
                    isWorkSession = !isWorkSession;
                    updateTimerDisplay();
                    document.getElementById('startTimer').textContent = 'Start'; // Reset button text for next session
                    return;
                }
                timeLeft--;
                updateTimerDisplay();
            }, 1000);
            document.getElementById('startTimer').textContent = 'Pause';
        } else {
            clearInterval(timerInterval);
            timerInterval = null;
            document.getElementById('startTimer').textContent = 'Resume';
        }
    });

    document.getElementById('resetTimer')?.addEventListener('click', () => {
        console.log('Pomodoro reset clicked');
        clearInterval(timerInterval);
        timerInterval = null;
        timeLeft = 25 * 60; // Reset to initial work session time
        isWorkSession = true;
        cycleCount = 0;
        updateTimerDisplay();
        document.getElementById('startTimer').textContent = 'Start';
        notify('Pomodoro timer reset.');
    });

    // --- To-Do List ---
    document.getElementById('todoForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const todoInput = document.getElementById('todoInput');
        const task = todoInput?.value.trim();
        if (task) {
            todos.push({ id: Date.now(), task, completed: false });
            saveData();
            updateTodoList();
            notify('Task added to to-do list!');
            todoInput.value = ''; // Clear input field
        } else {
            notify('Please enter a task.', 'error');
        }
    });

    const updateTodoList = () => {
        const list = document.getElementById('todoList');
        if (!list) return;
        list.innerHTML = todos.length > 0 ? todos
            .map(t => `
                <li class="${t.completed ? 'completed' : ''}">
                    <span onclick="toggleTodo(${t.id})">${t.task}</span>
                    <button class="btn-delete-item" onclick="removeTodo(${t.id})">Delete</button>
                </li>
            `)
            .join('') : '<p>No tasks yet. Add one above!</p>';
    };

    window.toggleTodo = (id) => {
        const todo = todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            saveData();
            logActivity(`${todo.completed ? 'Completed' : 'Uncompleted'} task: ${todo.task}`);
            updateTodoList();
            notify(`Task marked as ${todo.completed ? 'completed' : 'incomplete'}!`);
        }
    };

    window.removeTodo = (id) => {
        const todoToRemove = todos.find(t => t.id === id);
        if (todoToRemove && confirm(`Delete task: "${todoToRemove.task}"?`)) {
            todos = todos.filter(t => t.id !== id);
            saveData();
            logActivity(`Deleted task: ${todoToRemove.task}`);
            updateTodoList();
            notify('Task deleted!');
        }
    };

    // --- Chat Assistant ---
    const addChatMessage = (content, sender = 'user') => {
        const chatMessagesDiv = document.getElementById('chatMessages');
        if (!chatMessagesDiv) return;

        const div = document.createElement('div');
        div.className = `chat-message ${sender}`;
        div.textContent = content;
        chatMessagesDiv.appendChild(div);
        chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight; // Auto-scroll to bottom
    };

    const processChatInput = (input) => {
        input = input.toLowerCase().trim();
        addChatMessage(input, 'user');

        let response = '';
        if (input.includes('help') || input.includes('hi') || input === 'hello') {
            response = 'Hi there! I\'m your CollegeBuddy Assistant. You can ask me about: \n- **Assignments:** "upcoming assignments", "graded assignments"\n- **Lectures:** "today\'s lectures", "all lectures"\n- **Grades:** "my GPA", "subject grades"\n- **Schedule:** "what\'s on my calendar"\n- **Timer:** "start timer", "reset timer"\n- **To-Do List:** "my todos"';
        } else if (input.includes('upcoming assignment')) {
            const upcoming = assignments.filter(a => a.status !== 'completed' && new Date(`${a.dueDate}T${a.dueTime}`) > new Date()).sort((a, b) => new Date(`${a.dueDate}T${a.dueTime}`) - new Date(`${b.dueDate}T${b.dueTime}`)).slice(0, 3);
            response = upcoming.length > 0 ? 'Upcoming assignments:\n' + upcoming.map(a => `- ${a.title} (${a.subject}) due ${a.dueDate} at ${a.dueTime}`).join('\n') : 'No upcoming assignments!';
        } else if (input.includes('graded assignment')) {
            const graded = assignments.filter(a => a.grade !== null).slice(0, 3);
            response = graded.length > 0 ? 'Recently graded assignments:\n' + graded.map(a => `- ${a.title} (${a.subject}): ${a.grade}%`).join('\n') : 'No graded assignments yet.';
        } else if (input.includes('today lecture') || input.includes('lectures today')) {
            const today = new Date().toISOString().split('T')[0];
            const todaysLectures = lectures.filter(l => l.date === today).sort((a, b) => a.time.localeCompare(b.time));
            response = todaysLectures.length > 0 ? 'Today\'s lectures:\n' + todaysLectures.map(l => `- ${l.title} (${l.subject}) at ${l.time} in ${l.location || 'N/A'}`).join('\n') : 'No lectures scheduled for today.';
        } else if (input.includes('all lecture')) {
            const allLectures = lectures.slice(0, 5); // Limit to 5 for chat response
            response = allLectures.length > 0 ? 'Some of your lectures:\n' + allLectures.map(l => `- ${l.title} (${l.subject}) on ${l.date} at ${l.time}`).join('\n') : 'No lectures added yet.';
        } else if (input.includes('my gpa')) {
            const gpa = calculateGPA(assignments).toFixed(2);
            response = `Your current GPA is: ${gpa}.`;
        } else if (input.includes('subject grade')) {
            const subjectGradeInfo = subjects.map(s => {
                const grades = assignments.filter(a => a.subject === s && a.grade !== null).map(a => a.grade);
                if (!grades.length) return null;
                const avg = (grades.reduce((sum, g) => sum + g, 0) / grades.length).toFixed(1);
                return `${s}: ${avg}% (${getLetterGrade(parseFloat(avg))})`;
            }).filter(Boolean);
            response = subjectGradeInfo.length > 0 ? 'Average grades by subject:\n' + subjectGradeInfo.join('\n') : 'No graded assignments for any subject yet.';
        } else if (input.includes('calendar') || input.includes('schedule')) {
            response = 'Check the "Schedule" tab for your full calendar view of lectures and assignments!';
        } else if (input.includes('start timer') || input.includes('pomodoro start')) {
            if (!timerInterval) {
                document.getElementById('startTimer')?.click(); // Simulate click
                response = 'Pomodoro timer started!';
            } else {
                response = 'Pomodoro timer is already running. You can "pause timer" or "reset timer".';
            }
        } else if (input.includes('pause timer') || input.includes('pomodoro pause')) {
            if (timerInterval) {
                document.getElementById('startTimer')?.click(); // Simulate click
                response = 'Pomodoro timer paused.';
            } else {
                response = 'Pomodoro timer is not running.';
            }
        } else if (input.includes('reset timer') || input.includes('pomodoro reset')) {
            document.getElementById('resetTimer')?.click(); // Simulate click
            response = 'Pomodoro timer reset.';
        } else if (input.includes('my todo')) {
            const pendingTodos = todos.filter(t => !t.completed).slice(0, 5);
            response = pendingTodos.length > 0 ? 'Your pending tasks:\n' + pendingTodos.map(t => `- ${t.task}`).join('\n') : 'Great! No pending tasks at the moment.';
        } else {
            response = 'I\'m not sure how to help with that. Please try asking about assignments, lectures, grades, schedule, timer, or to-do list.';
        }
        setTimeout(() => addChatMessage(response, 'bot'), 500);
    };

    document.getElementById('sendChatBtn')?.addEventListener('click', () => {
        const chatInput = document.getElementById('chatInput');
        if (chatInput?.value.trim()) {
            processChatInput(chatInput.value);
            chatInput.value = '';
        }
    });

    document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const chatInput = document.getElementById('chatInput');
            if (chatInput?.value.trim()) {
                processChatInput(chatInput.value);
                chatInput.value = '';
            }
        }
    });

    // --- Recent Activity ---
    const updateRecentActivity = () => {
        const activityList = document.getElementById('recentActivityList');
        if (!activityList) return;
        activityList.innerHTML = recentActivity.length > 0 ? recentActivity.map(activity => {
            const date = new Date(activity.date).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
            return `<p><strong>${date}:</strong> ${activity.message}</p>`;
        }).join('') : '<p>No recent activity.</p>';
    };

    // --- Initializations on Load ---
    const initializeApp = () => {
        // Load initial data for profile
        loadProfileData();

        // Initialize display for all sections
        updateSubjectOptions();
        updateSemesterOptions();
        updateAssignmentsList();
        updateLecturesList();
        updateDashboardStats();
        updateUpcomingDeadlines();
        updateTodaySchedule();
        updateGrades();
        updateTodoList();
        updateTimerDisplay(); // Set initial display for Pomodoro
        updateRecentActivity(); // Display recent activity

        // Render calendar (important to do this after all data and elements are ready)
        updateCalendar();

        // Activate the first tab by default if none is active
        const firstNavLink = document.querySelector('.nav-link');
        const firstTabContent = document.querySelector('.tab-content');
        if (firstNavLink && firstTabContent && !document.querySelector('.nav-link.active')) {
            firstNavLink.classList.add('active');
            firstTabContent.classList.add('active');
        }
    };

    // Run all initializations
    initializeApp();
});
