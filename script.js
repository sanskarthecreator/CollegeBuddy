document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, initializing CollegeBuddy...');

    // Data
    let assignments = JSON.parse(localStorage.getItem('assignments')) || [];
    let lectures = JSON.parse(localStorage.getItem('lectures')) || [];
    let subjects = JSON.parse(localStorage.getItem('subjects')) || [];
    let semesters = JSON.parse(localStorage.getItem('semesters')) || [];
    let profile = JSON.parse(localStorage.getItem('profile')) || { name: '', id: '', major: '', year: '', email: '', phone: '' };
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

    // Utilities
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
            localStorage.setItem('profile', JSON.stringify(profile));
            localStorage.setItem('todos', JSON.stringify(todos));
            localStorage.setItem('recentActivity', JSON.stringify(recentActivity));
            localStorage.setItem('darkMode', JSON.stringify(darkMode));
        } catch (e) {
            console.error('Error saving data:', e);
        }
    };

    const logActivity = (msg) => {
        recentActivity.unshift({ id: Date.now(), message: msg, date: new Date().toISOString() });
        recentActivity = recentActivity.slice(0, 10);
        saveData();
        updateRecentActivity();
    };

    // Navigation
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
            });
        });

        document.querySelector('.nav-toggle')?.addEventListener('click', () => {
            console.log('Nav toggle clicked');
            document.querySelector('.nav-menu')?.classList.toggle('active');
        });
    } catch (e) {
        console.error('Error setting up navigation:', e);
    }

    // Dark Mode
    const toggleDarkMode = () => {
        darkMode = !darkMode;
        document.body.classList.toggle('dark-mode');
        document.getElementById('darkModeToggle').innerHTML = `<i class="fas fa-${darkMode ? 'sun' : 'moon'}"></i>`;
        saveData();
        console.log('Dark mode toggled:', darkMode);
    };

    document.getElementById('darkModeToggle')?.addEventListener('click', toggleDarkMode);

    // Modals
    try {
        document.querySelectorAll('[data-modal]').forEach(btn => {
            btn.addEventListener('click', () => {
                console.log('Modal button clicked:', btn.getAttribute('data-modal'));
                const modal = document.getElementById(btn.getAttribute('data-modal'));
                if (modal) {
                    modal.style.display = 'flex';
                    modal.classList.add('show');
                    if (['assignmentModal', 'lectureModal'].includes(btn.getAttribute('data-modal'))) {
                        updateSubjectOptions();
                        updateSemesterOptions();
                    }
                    if (btn.getAttribute('data-modal') === 'subjectModal') updateSubjectList();
                    if (btn.getAttribute('data-modal') === 'semesterModal') updateSemesterList();
                }
            });
        });

        document.querySelectorAll('[data-close], .close').forEach(btn => {
            btn.addEventListener('click', () => {
                console.log('Close button clicked');
                const modal = document.getElementById(btn.getAttribute('data-close') || btn.getAttribute('data-modal'));
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

    // Subjects
    const updateSubjectOptions = () => {
        ['assignmentSubject', 'lectureSubject'].forEach(id => {
            const select = document.getElementById(id);
            if (select) select.innerHTML = '<option value="">Select Subject</option>' + subjects.map(s => `<option value="${s}">${s}</option>`).join('');
        });
    };

    document.getElementById('subjectForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const subject = document.getElementById('newSubject')?.value.trim();
        if (subject && !subjects.includes(subject)) {
            subjects.push(subject);
            saveData();
            updateSubjectList();
            updateSubjectOptions();
            notify('Subject added!');
            e.target.reset();
        } else {
            notify('Invalid or duplicate subject.', 'error');
        }
    });

    const updateSubjectList = () => {
        const list = document.getElementById('subjectList');
        if (list) list.innerHTML = subjects.map(s => `<li>${s}<button onclick="deleteSubject('${s}')">Delete</button></li>`).join('');
    };

    window.deleteSubject = (subject) => {
        if (assignments.some(a => a.subject === subject) || lectures.some(l => l.subject === subject)) {
            notify('Subject in use!', 'error');
            return;
        }
        subjects = subjects.filter(s => s !== subject);
        saveData();
        updateSubjectList();
        updateSubjectOptions();
        notify('Subject deleted!');
    };

    // Semesters
    const updateSemesterOptions = () => {
        ['assignmentSemester', 'lectureSemester', 'semesterFilter', 'lectureSemesterFilter', 'scheduleSemesterFilter', 'gradesSemesterFilter'].forEach(id => {
            const select = document.getElementById(id);
            if (select) select.innerHTML = '<option value="all">All Semesters</option>' + semesters.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        });
    };

    document.getElementById('semesterForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('semesterName')?.value.trim();
        const start = document.getElementById('semesterStart')?.value;
        const end = document.getElementById('semesterEnd')?.value;
        if (name && start && end && new Date(start) <= new Date(end)) {
            semesters.push({ id: Date.now(), name, start, end });
            saveData();
            updateSemesterList();
            updateSemesterOptions();
            notify('Semester added!');
            e.target.reset();
        } else {
            notify('Invalid semester details.', 'error');
        }
    });

    const updateSemesterList = () => {
        const list = document.getElementById('semesterList');
        if (list) list.innerHTML = semesters.map(s => `<li>${s.name} (${s.start} to ${s.end})<button onclick="deleteSemester(${s.id})">Delete</button></li>`).join('');
    };

    window.deleteSemester = (id) => {
        if (assignments.some(a => a.semesterId === id) || lectures.some(l => l.semesterId === id)) {
            notify('Semester in use!', 'error');
            return;
        }
        semesters = semesters.filter(s => s.id !== id);
        saveData();
        updateSemesterList();
        updateSemesterOptions();
        notify('Semester deleted!');
    };

    // Assignments
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
        if (!assignment.title || !assignment.subject || !assignment.semesterId || !assignment.dueDate || !assignment.dueTime) {
            notify('Fill all required fields.', 'error');
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
        notify('Assignment added!');
        e.target.reset();
        const modal = document.getElementById('assignmentModal');
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
    });

    window.removeAssignment = (id) => {
        if (confirm('Delete this assignment?')) {
            const assignment = assignments.find(a => a.id === id);
            assignments = assignments.filter(a => a.id !== id);
            saveData();
            logActivity(`Deleted assignment: ${assignment.title}`);
            updateAssignmentsList();
            updateDashboardStats();
            updateUpcomingDeadlines();
            updateGrades();
            updateCalendar();
            notify('Assignment deleted!');
        }
    };

    // Lectures
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
            duration: 90
        };
        if (!lecture.title || !lecture.subject || !lecture.semesterId || !lecture.date || !lecture.time) {
            notify('Fill all required fields.', 'error');
            return;
        }
        lectures.push(lecture);
        saveData();
        logActivity(`Added lecture: ${lecture.title}`);
        updateLecturesList();
        updateTodaySchedule();
        updateCalendar();
        notify('Lecture added!');
        e.target.reset();
        const modal = document.getElementById('lectureModal');
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
    });

    window.removeLecture = (id) => {
        if (confirm('Delete this lecture?')) {
            const lecture = lectures.find(l => l.id === id);
            lectures = lectures.filter(l => l.id !== id);
            saveData();
            logActivity(`Deleted lecture: ${lecture.title}`);
            updateLecturesList();
            updateTodaySchedule();
            updateCalendar();
            notify('Lecture deleted!');
        }
    };

    // Assignment List
    const updateAssignmentsList = () => {
        const list = document.getElementById('assignmentsList');
        if (!list) return;
        const filter = document.getElementById('assignmentFilter')?.value;
        const semesterId = parseInt(document.getElementById('semesterFilter')?.value) || 'all';
        list.innerHTML = assignments
            .filter(a => {
                if (semesterId !== 'all' && a.semesterId !== semesterId) return false;
                if (filter === 'all') return true;
                if (filter === 'overdue') return new Date(`${a.dueDate}T${a.dueTime}`) < new Date() && a.status !== 'completed';
                return a.status === filter;
            })
            .map(a => `
                <div class="assignment-card">
                    <h3>${a.title}</h3>
                    <p>Subject: ${a.subject}</p>
                    <p>Semester: ${semesters.find(s => s.id === a.semesterId)?.name || 'N/A'}</p>
                    <p>Due: ${a.dueDate} ${a.dueTime}</p>
                    <p>Priority: ${a.priority}</p>
                    <p>Status: ${a.status}</p>
                    <p>Grade: ${a.grade !== null ? a.grade + '%' : 'Not graded'}</p>
                    <button onclick="markAsCompleted(${a.id})">Mark ${a.status === 'completed' ? 'Pending' : 'Completed'}</button>
                    <button onclick="assignGrade(${a.id})">Grade</button>
                    <button onclick="removeAssignment(${a.id})">Delete</button>
                </div>
            `)
            .join('');
    };

    window.markAsCompleted = (id) => {
        const a = assignments.find(a => a.id === id);
        a.status = a.status === 'completed' ? 'pending' : 'completed';
        saveData();
        logActivity(`Marked ${a.title} as ${a.status}`);
        updateAssignmentsList();
        updateDashboardStats();
        updateGrades();
        updateCalendar();
        notify(`Marked as ${a.status}!`);
    };

    window.assignGrade = (id) => {
        const a = assignments.find(a => a.id === id);
        const grade = prompt(`Grade for ${a.title} (0-100):`);
        const gradeNum = parseFloat(grade);
        if (gradeNum >= 0 && gradeNum <= 100) {
            a.grade = gradeNum;
            saveData();
            logActivity(`Graded ${a.title}: ${gradeNum}%`);
            updateAssignmentsList();
            updateGrades();
            updateDashboardStats();
            notify('Grade assigned!');
        } else {
            notify('Invalid grade.', 'error');
        }
    };

    // Dashboard Stats
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
        return `${avg}% (${avg >= 90 ? 'A' : avg >= 80 ? 'B' : avg >= 70 ? 'C' : avg >= 60 ? 'D' : 'F'})`;
    };

    // Upcoming Deadlines
    const updateUpcomingDeadlines = () => {
        const list = document.getElementById('upcomingDeadlines');
        if (!list) return;
        list.innerHTML = assignments
            .filter(a => a.status !== 'completed')
            .sort((a, b) => new Date(`${a.dueDate}T${a.dueTime}`) - new Date(`${b.dueDate}T${b.dueTime}`))
            .slice(0, 5)
            .map(a => `<p>${a.title} (${a.subject}) - Due: ${a.dueDate} ${a.dueTime}</p>`)
            .join('');
    };

    // Today's Schedule
    const updateTodaySchedule = () => {
        const list = document.getElementById('todaySchedule');
        if (!list) return;
        const today = new Date().toISOString().split('T')[0];
        list.innerHTML = lectures
            .filter(l => l.date === today)
            .sort((a, b) => a.time.localeCompare(b.time))
            .map(l => `<p>${l.title} (${l.subject}) - ${l.time} (${l.location})</p>`)
            .join('');
    };

    // Lectures List
    const updateLecturesList = () => {
        const list = document.getElementById('lecturesList');
        if (!list) return;
        const semesterId = parseInt(document.getElementById('lectureSemesterFilter')?.value) || 'all';
        list.innerHTML = lectures
            .filter(l => semesterId === 'all' || l.semesterId === semesterId)
            .map(l => `
                <div class="assignment-card">
                    <h3>${l.title}</h3>
                    <p>Subject: ${l.subject}</p>
                    <p>Semester: ${semesters.find(s => s.id === l.semesterId)?.name || 'N/A'}</p>
                    <p>Date: ${l.date} ${l.time}</p>
                    <p>Location: ${l.location}</p>
                    <button onclick="removeLecture(${l.id})">Delete</button>
                </div>
            `)
            .join('');
    };

    // Grades
    const updateGrades = () => {
        const semesterId = parseInt(document.getElementById('gradesSemesterFilter')?.value) || 'all';
        const filteredAssignments = assignments.filter(a => semesterId === 'all' || a.semesterId === semesterId);
        document.getElementById('currentGPA').textContent = calculateGPA(filteredAssignments).toFixed(2);
        document.getElementById('semesterStats').innerHTML = subjects
            .map(s => {
                const grades = filteredAssignments.filter(a => a.subject === s && a.grade !== null).map(a => a.grade);
                if (!grades.length) return '';
                const avg = grades.reduce((sum, g) => sum + g, 0) / grades.length;
                return `<p>${s}: ${avg.toFixed(1)}% (${avg >= 90 ? 'A' : avg >= 80 ? 'B' : avg >= 70 ? 'C' : avg >= 60 ? 'D' : 'F'})</p>`;
            })
            .join('');
        document.getElementById('subjectGrades').innerHTML = subjects
            .map(s => {
                const grades = filteredAssignments.filter(a => a.subject === s && a.grade !== null).map(a => a.grade);
                if (!grades.length) return '';
                const avg = grades.reduce((sum, g) => sum + g, 0) / grades.length;
                return `
                    <div class="assignment-card">
                        <h3>${s}</h3>
                        <p>Average: ${avg.toFixed(1)}% (${avg >= 90 ? 'A' : avg >= 80 ? 'B' : avg >= 70 ? 'C' : avg >= 60 ? 'D' : 'F'})</p>
                        <p>Assignments: ${grades.length}</p>
                    </div>
                `;
            })
            .join('');
    };

    const calculateGPA = (filteredAssignments) => {
        const avgs = subjects
            .map(s => {
                const grades = filteredAssignments.filter(a => a.subject === s && a.grade !== null).map(a => a.grade);
                return grades.length ? grades.reduce((sum, g) => sum + g, 0) / grades.length : null;
            })
            .filter(avg => avg !== null);
        if (!avgs.length) return 0;
        return (avgs.reduce((sum, avg) => sum + (avg / 25), 0) / avgs.length).toFixed(2);
    };

    // FullCalendar
    let calendar;
    const updateCalendar = () => {
        const semesterId = parseInt(document.getElementById('scheduleSemesterFilter')?.value) || 'all';
        const calendarEl = document.getElementById('fullCalendar');
        if (!calendarEl) return;
        if (calendar) calendar.destroy();
        try {
            calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
                events: [
                    ...lectures
                        .filter(l => semesterId === 'all' || l.semesterId === semesterId)
                        .map(l => ({
                            id: `lecture-${l.id}`,
                            title: `${l.title} (${l.subject})`,
                            start: `${l.date}T${l.time}`,
                            end: new Date(new Date(`${l.date}T${l.time}`).getTime() + l.duration * 60 * 1000).toISOString(),
                            classNames: ['lecture']
                        })),
                    ...assignments
                        .filter(a => (semesterId === 'all' || a.semesterId === semesterId) && a.status !== 'completed')
                        .map(a => ({
                            id: `assignment-${a.id}`,
                            title: `${a.title} (Due)`,
                            start: `${a.dueDate}T${a.dueTime}`,
                            classNames: ['assignment']
                        })),
                    ...holidays
                        .filter(h => {
                            if (semesterId === 'all') return true;
                            const semester = semesters.find(s => s.id === semesterId);
                            return new Date(h.date) >= new Date(semester.start) && new Date(h.date) <= new Date(semester.end);
                        })
                        .map(h => ({
                            title: h.title,
                            start: h.date,
                            classNames: ['holiday'],
                            allDay: true
                        }))
                ],
                dateClick: (info) => {
                    console.log('Calendar date clicked:', info.dateStr);
                    const modal = prompt('Add (1) Lecture or (2) Assignment? Enter 1 or 2:');
                    if (modal === '1') {
                        document.getElementById('lectureDate').value = info.dateStr;
                        document.getElementById('lectureModal').style.display = 'flex';
                        document.getElementById('lectureModal').classList.add('show');
                    } else if (modal === '2') {
                        document.getElementById('assignmentDueDate').value = info.dateStr;
                        document.getElementById('assignmentModal').style.display = 'flex';
                        document.getElementById('assignmentModal').classList.add('show');
                    }
                },
                eventClick: (info) => {
                    console.log('Calendar event clicked:', info.event.id);
                    const [type, id] = info.event.id.split('-');
                    if (type === 'holiday') {
                        alert(`Holiday: ${info.event.title}\nDate: ${info.event.start.toLocaleDateString()}`);
                        return;
                    }
                    if (confirm(`Delete ${type}: ${info.event.title}?`)) {
                        if (type === 'lecture') removeLecture(parseInt(id));
                        else removeAssignment(parseInt(id));
                    }
                }
            });
            calendar.render();
        } catch (e) {
            console.error('Error initializing FullCalendar:', e);
        }
    };

    // Profile
document.addEventListener('DOMContentLoaded', () => {
    // Get elements for profile picture handling
    const profilePicUpload = document.getElementById('profilePicUpload');
    const profilePicture = document.getElementById('profilePicture');

    // Get elements for form and displaying profile info
    const profileForm = document.getElementById('profileForm');
    const studentNameElement = document.getElementById('studentName');
    const studentIdDisplayElement = document.getElementById('studentIdDisplay'); // Changed ID for display
    const studentMajorElement = document.getElementById('studentMajor');
    const studentYearElement = document.getElementById('studentYear');

    // Get input elements for form submission
    const fullNameInput = document.getElementById('fullName');
    const studentIdInput = document.getElementById('studentIdInput'); // Changed ID for input
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const majorInput = document.getElementById('major');
    const yearSelect = document.getElementById('year');


    // Function to handle profile picture upload
    if (profilePicUpload && profilePicture) {
        profilePicUpload.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    profilePicture.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Event listener for profile form submission
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Collect form data into a profile object
            const profile = {
                name: fullNameInput?.value.trim(),
                id: studentIdInput?.value.trim(), // Use the correct ID for the input
                email: emailInput?.value.trim(),
                phone: phoneInput?.value.trim(),
                major: majorInput?.value.trim(),
                year: yearSelect?.value
            };

            // Update the displayed profile information
            studentNameElement.textContent = profile.name || 'Student';
            studentIdDisplayElement.textContent = `Student ID: ${profile.id || 'N/A'}`; // Use the correct ID for display
            studentMajorElement.textContent = `Major: ${profile.major || 'N/A'}`;
            studentYearElement.textContent = `Year: ${profile.year || 'N/A'}`;

            // Call your existing functions
            // Assuming saveData(), logActivity(), and notify() are defined elsewhere in your script
            saveData();
            logActivity('Updated profile');
            notify('Profile updated!');
        });
    }

    // Dummy functions for demonstration if you haven't defined them globally
    function saveData() {
        console.log('Data saved (placeholder function)');
        // Implement your actual data saving logic here (e.g., to localStorage)
    }

    function logActivity(activity) {
        console.log(`Activity Log: ${activity} (placeholder function)`);
        // Implement your actual activity logging logic here
    }

    function notify(message) {
        console.log(`Notification: ${message} (placeholder function)`);
        // Implement your actual notification display logic here (e.g., a toast message)
    }

    // Optional: You might want to load existing profile data when the page loads
    // For example, if you save it to localStorage using the saveData() function.
    // This would involve a loadData() function.
});
    // Pomodoro Timer
    let timerInterval;
    let timeLeft = 30 * 60;
    let isWorkSession = true;
    let cycleCount = 0;

    const updateTimerDisplay = () => {
        const min = Math.floor(timeLeft / 60);
        const sec = timeLeft % 60;
        document.getElementById('timerDisplay').textContent = `${min}:${sec < 10 ? '0' : ''}${sec}`;
        document.getElementById('timerStatus').textContent = isWorkSession ? 'Work Session' : 'Break';
    };

    document.getElementById('startTimer')?.addEventListener('click', () => {
        console.log('Pomodoro start/pause clicked');
        if (!timerInterval) {
            timerInterval = setInterval(() => {
                if (timeLeft <= 0) {
                    playSound();
                    cycleCount++;
                    if (isWorkSession && cycleCount % 4 === 0) {
                        timeLeft = 15 * 60;
                        notify('Long break time!');
                    } else {
                        timeLeft = isWorkSession ? 5 * 60: 30 * 60;
                        notify(isWorkSession ? 'Break time!' : 'Work time!');
                    }
                    isWorkSession = !isWorkSession;
                    updateTimerDisplay();
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
        timeLeft = 30 * 60;
        isWorkSession = true;
        cycleCount = 0;
        updateTimerDisplay();
        document.getElementById('startTimer').textContent = 'Start';
    });

    // To-Do List
    document.getElementById('todoForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const task = document.getElementById('todoInput')?.value.trim();
        if (task) {
            todos.push({ id: Date.now(), task, completed: false });
            saveData();
            updateTodoList();
            notify('Task added!');
            e.target.reset();
        }
    });

    const updateTodoList = () => {
        const list = document.getElementById('todoList');
        if (!list) return;
        list.innerHTML = todos
            .map(t => `
                <li class="${t.completed ? 'completed' : ''}">
                    <span onclick="toggleTodo(${t.id})">${t.task}</span>
                    <button onclick="removeTodo(${t.id})">Delete</button>
                </li>
            `)
            .join('');
    };

    window.toggleTodo = (id) => {
        const todo = todos.find(t => t.id === id);
        todo.completed = !todo.completed;
        saveData();
        logActivity(`${todo.completed ? 'Completed' : 'Uncompleted'} task: ${todo.task}`);
        updateTodoList();
        notify(`Task marked as ${todo.completed ? 'completed' : 'incomplete'}!`);
    };

    window.removeTodo = (id) => {
        const todo = todos.find(t => t.id === id);
        todos = todos.filter(t => t.id !== id);
        saveData();
        logActivity(`Deleted task: ${todo.task}`);
        updateTodoList();
        notify('Task deleted!');
    };

    // Chat Assistant
    const addChatMessage = (content, sender = 'user') => {
        const div = document.createElement('div');
        div.className = `chat-message ${sender}`;
        div.textContent = content;
        document.getElementById('chatMessages')?.appendChild(div);
        document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
    };

    const processChatInput = (input) => {
        input = input.toLowerCase().trim();
        addChatMessage(input, 'user');
        let response = '';
        if (input.includes('help') || input.includes('hi')) {
            response = 'Hi! Ask about assignments, lectures, grades, schedule, timer, or to-do list!';
        } else if (input.includes('assignment')) {
            response = input.includes('due')
                ? assignments
                    .filter(a => a.status !== 'completed')
                    .slice(0, 3)
                    .map(a => `- ${a.title} (${a.subject}) due ${a.dueDate} ${a.dueTime}`)
                    .join('\n') || 'No upcoming assignments.'
                : `You have ${assignments.length} assignments. Add one via the sidebar!`;
        } else if (input.includes('lecture') || input.includes('schedule')) {
            const today = new Date().toISOString().split('T')[0];
            response = lectures
                .filter(l => l.date === today)
                .map(l => `- ${l.title} (${l.subject}) at ${l.time}`)
                .join('\n') || 'No lectures today. Check the Schedule tab.';
        } else if (input.includes('grade') || input.includes('gpa')) {
            response = `GPA: ${calculateGPA(assignments)}. Average: ${calculateAverageGrade()}.`;
        } else if (input.includes('pomodoro') || input.includes('timer')) {
            response = 'Use the Pomodoro timer in the Dashboard for 25-min work sessions with breaks!';
        } else if (input.includes('todo') || input.includes('task')) {
            response = todos.length
                ? `You have ${todos.length} tasks (${todos.filter(t => t.completed).length} completed). Add more in the Dashboard!`
                : 'No tasks yet. Add one in the Dashboard to-do list.';
        } else if (input.includes('semester')) {
            response = semesters.length
                ? `Your semesters: ${semesters.map(s => s.name).join(', ')}. Manage them in the sidebar.`
                : 'No semesters yet. Add one via "Manage Semesters".';
        } else {
            response = 'Try asking about assignments, lectures, timer, or tasks!';
        }
        setTimeout(() => addChatMessage(response, 'bot'), 500);
    };

    document.getElementById('sendChatBtn')?.addEventListener('click', () => {
        console.log('Chat send button clicked');
        const input = document.getElementById('chatInput')?.value.trim();
        if (input) {
            processChatInput(input);
            document.getElementById('chatInput').value = '';
        }
    });

    document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            console.log('Chat enter key pressed');
            processChatInput(e.target.value.trim());
            e.target.value = '';
        }
    });

    document.getElementById('toggleChat')?.addEventListener('click', () => {
        console.log('Chat toggle clicked');
        const messages = document.getElementById('chatMessages');
        const input = document.getElementById('chatInput')?.parentElement;
        const isHidden = messages.style.display === 'none';
        messages.style.display = isHidden ? 'block' : 'none';
        input.style.display = isHidden ? 'flex' : 'none';
        document.getElementById('toggleChat').innerHTML = `<i class="fas fa-${isHidden ? 'minus' : 'plus'}"></i>`;
    });

    // Filter Listeners
    ['semesterFilter', 'lectureSemesterFilter', 'scheduleSemesterFilter', 'gradesSemesterFilter'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', () => {
            console.log(`Filter changed: ${id}`);
            if (id === 'semesterFilter') updateAssignmentsList();
            if (id === 'lectureSemesterFilter') updateLecturesList();
            if (id === 'scheduleSemesterFilter') updateCalendar();
            if (id === 'gradesSemesterFilter') updateGrades();
        });
    });

    // Initialize
    const init = () => {
        try {
            console.log('Initializing dashboard...');
            document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
            ['fullName', 'studentId', 'email', 'phone', 'major', 'year'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = profile[id] || '';
            });
            document.getElementById('studentName').textContent = profile.name || 'Student';
            document.getElementById('studentId').textContent = `Student ID: ${profile.id || 'N/A'}`;
            document.getElementById('studentMajor').textContent = `Major: ${profile.major || 'N/A'}`;
            document.getElementById('studentYear').textContent = `Year: ${profile.year || 'N/A'}`;
            if (darkMode) {
                document.body.classList.add('dark-mode');
                document.getElementById('darkModeToggle').innerHTML = `<i class="fas fa-sun"></i>`;
            }
            updateSubjectOptions();
            updateSemesterOptions();
            updateAssignmentsList();
            updateDashboardStats();
            updateUpcomingDeadlines();
            updateTodaySchedule();
            updateLecturesList();
            updateGrades();
            updateRecentActivity();
            updateCalendar();
            updateTodoList();
            updateTimerDisplay();
            console.log('Initialization complete');
        } catch (e) {
            console.error('Initialization error:', e);
        }
    };

    init();
});
