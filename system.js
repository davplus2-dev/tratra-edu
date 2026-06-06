/**
 * TRATRA SYSTEM CORE - Full Stack LMS Version
 */

const TratraSystem = {
    // --- DATABASE SIMULATION ---
    db: {
        getUsers: () => JSON.parse(localStorage.getItem('tratra_users') || '[]'),
        saveUsers: (users) => localStorage.setItem('tratra_users', JSON.stringify(users)),
        
        getPayments: () => JSON.parse(localStorage.getItem('tratra_payments') || '[]'),
        savePayments: (payments) => localStorage.setItem('tratra_payments', JSON.stringify(payments)),
        
        getUser: (email) => TratraSystem.db.getUsers().find(u => u.email === email),
    },

    // --- COURSE DATA & RESOURCES ---
    courses: {
        'c1': { 
            title: "The Philosophy and Psychology of a Teacher", 
            resources: {
                ppt: "https://tratraedu.com/assets/c1_philosophy.pptx",
                pdf: "https://tratraedu.com/assets/c1_handbook.pdf",
                video: "https://tratraedu.com/assets/c1_full_lecture.mp4"
            },
            quiz: [
                { q: "Which of these is a core tenet of the Growth Mindset?", a: ["Intelligence is fixed", "Effort leads to mastery", "Avoid challenges", "Consistency is irrelevant"], correct: 1 },
                { q: "Cognitive load refers to the limit of which memory?", a: ["Long-term", "Sensory", "Working", "Implicit"], correct: 2 },
                { q: "What is the primary goal of inclusive education?", a: ["Grouping by ability", "Standardized testing", "Equity of access", "Strict discipline"], correct: 2 },
                { q: "Maslow's hierarchy suggests which need must be met first?", a: ["Self-actualization", "Esteem", "Physiological", "Social"], correct: 2 },
                { q: "Which psychologist is known for the 'Zone of Proximal Development'?", a: ["Piaget", "Vygotsky", "Skinner", "Pavlov"], correct: 1 },
                ...Array.from({length: 20}, (_, i) => ({
                    q: `Philosophy & Psychology Question ${i+6}?`,
                    a: ["Option A", "Option B", "Option C", "Option D"],
                    correct: Math.floor(Math.random() * 4)
                }))
            ]
        },
        'c2': { 
            title: "Student and Teacher Centered Pedagogy", 
            resources: {
                ppt: "https://tratraedu.com/assets/c2_pedagogy.pptx",
                pdf: "https://tratraedu.com/assets/c2_guide.pdf",
                video: "https://tratraedu.com/assets/c2_lecture.mp4"
            },
            quiz: [
                { q: "What is the role of a teacher in student-centered learning?", a: ["Lecturer", "Disciplinarian", "Facilitator", "Evaluator"], correct: 2 },
                { q: "Which is a characteristic of direct instruction?", a: ["Student-led discovery", "Teacher-led explanation", "Peer-to-peer teaching", "Unstructured exploration"], correct: 1 },
                ...Array.from({length: 23}, (_, i) => ({
                    q: `Pedagogy Question ${i+3}?`,
                    a: ["Option A", "Option B", "Option C", "Option D"],
                    correct: Math.floor(Math.random() * 4)
                }))
            ]
        },
        'c3': { title: "Planning in Teaching", resources: { ppt: "#", pdf: "#", video: "#" }, quiz: Array.from({length: 25}, (_, i) => ({ q: `Planning Q${i+1}?`, a: ["A","B","C","D"], correct: 0 })) },
        'c4': { title: "School Administration", resources: { ppt: "#", pdf: "#", video: "#" }, quiz: Array.from({length: 25}, (_, i) => ({ q: `Admin Q${i+1}?`, a: ["A","B","C","D"], correct: 0 })) },
        'c5': { title: "Job Interviews & Demo Prep", resources: { ppt: "#", pdf: "#", video: "#" }, quiz: Array.from({length: 25}, (_, i) => ({ q: `Interview Q${i+1}?`, a: ["A","B","C","D"], correct: 0 })) },
        'c6': { title: "AI & Digital Tools for Teaching", resources: { ppt: "#", pdf: "#", video: "#" }, quiz: Array.from({length: 25}, (_, i) => ({ q: `AI Q${i+1}?`, a: ["A","B","C","D"], correct: 0 })) },
        'c7': { title: "Measurement & Evaluation", resources: { ppt: "#", pdf: "#", video: "#" }, quiz: Array.from({length: 25}, (_, i) => ({ q: `Eval Q${i+1}?`, a: ["A","B","C","D"], correct: 0 })) },
        'c8': { title: "Class Management Tactics", resources: { ppt: "#", pdf: "#", video: "#" }, quiz: Array.from({length: 25}, (_, i) => ({ q: `Management Q${i+1}?`, a: ["A","B","C","D"], correct: 0 })) },
    },

    // --- SITE SETTINGS ---
    settings: {
        whatsapp: "+96877598158",
        siteName: "Tratra",
        bankData: {
            NGN: { bank: "Guaranty Trust Bank", accName: "Tratra Education Ltd", accNum: "1234567890", extra: "" },
            OMR: { bank: "Bank of Muscat", accName: "Tratra Training Center", accNum: "00123456789", extra: "IBAN: OM00 BMSB 0000 0000 1234 5678" },
            USD: { bank: "JP Morgan Chase", accName: "Tratra International", accNum: "987654321", extra: "SWIFT: CHASUS33" }
        }
    },

    // --- INITIALIZATION ---
    init: () => {
        const overrides = localStorage.getItem('tratra_course_overrides');
        if (overrides) {
            const savedCourses = JSON.parse(overrides);
            Object.assign(TratraSystem.courses, savedCourses);
            console.log("✅ Custom course resources loaded.");
        }

        const siteSettings = localStorage.getItem('tratra_site_settings');
        if (siteSettings) {
            const savedSettings = JSON.parse(siteSettings);
            Object.assign(TratraSystem.settings, savedSettings);
            console.log("✅ Site settings loaded.");
        }
    },

    // --- AUTHENTICATION ---
    auth: {
        signup: async (userData) => {
            const users = TratraSystem.db.getUsers();
            if (TratraSystem.db.getUser(userData.email)) throw new Error("User already exists");
            
            const newUser = { 
                ...userData, 
                id: 'u' + Date.now(), 
                enrolledCourses: [], 
                bundleAccess: false,
                role: 'teacher',
                scores: {} 
            };
            users.push(newUser);
            TratraSystem.db.saveUsers(users);
            localStorage.setItem('tratra_current_user', JSON.stringify(newUser));
            return newUser;
        },
        login: async (email, password) => {
            const user = TratraSystem.db.getUser(email);
            if (!user || user.password !== password) throw new Error("Invalid credentials");
            localStorage.setItem('tratra_current_user', JSON.stringify(user));
            return user;
        },
        logout: () => {
            localStorage.removeItem('tratra_current_user');
        },
        getCurrentUser: () => JSON.parse(localStorage.getItem('tratra_current_user')),
        
        forceAdmin: () => {
            const user = TratraSystem.auth.getCurrentUser();
            if (!user) return false;
            
            user.role = 'admin';
            localStorage.setItem('tratra_current_user', JSON.stringify(user));
            
            const users = TratraSystem.db.getUsers();
            const idx = users.findIndex(u => u.id === user.id);
            if (idx !== -1) {
                users[idx].role = 'admin';
                TratraSystem.db.saveUsers(users);
            }
            return true;
        }
    },

    // --- PAYMENT SYSTEM ---
    payments: {
        processPayment: async (paymentData) => {
            const payments = TratraSystem.db.getPayments();
            const user = TratraSystem.auth.getCurrentUser();
            
            const payment = {
                id: 'p' + Date.now(),
                userId: user.id,
                ...paymentData,
                status: paymentData.method === 'card' ? 'completed' : 'pending',
                createdAt: new Date().toISOString()
            };
            
            payments.push(payment);
            TratraSystem.db.savePayments(payments);

            if (payment.status === 'completed') {
                TratraSystem.payments.grantAccess(user.id, payment.plan);
            }
            
            return payment;
        },
        grantAccess: (userId, plan) => {
            const users = TratraSystem.db.getUsers();
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex === -1) return;

            if (plan === 'bundle') {
                users[userIndex].bundleAccess = true;
                users[userIndex].enrolledCourses = ['c1','c2','c3','c4','c5','c6','c7','c8'].map(id => ({
                    courseId: id, progress: 0, completed: false, paymentStatus: 'paid'
                }));
            } else {
                users[userIndex].enrolledCourses.push({
                    courseId: 'selected_course', progress: 0, completed: false, paymentStatus: 'paid'
                });
            }
            TratraSystem.db.saveUsers(users);
        }
    },

    // --- LMS LOGIC ---
    lms: {
        updateProgress: (userId, courseId, progress) => {
            const users = TratraSystem.db.getUsers();
            const user = users.find(u => u.id === userId);
            const course = user.enrolledCourses.find(c => c.courseId === courseId);
            if (course) {
                course.progress = progress;
                if (progress >= 100) course.completed = true;
                TratraSystem.db.saveUsers(users);
            }
        },
        saveScore: (userId, courseId, score) => {
            const users = TratraSystem.db.getUsers();
            const user = users.find(u => u.id === userId);
            if (user) {
                user.scores[courseId] = {
                    score: score,
                    date: new Date().toLocaleDateString()
                };
                TratraSystem.db.saveUsers(users);
            }
        },
        checkAccess: (userId, courseId) => {
            const user = TratraSystem.auth.getCurrentUser();
            if (!user) return false;
            if (user.role === 'admin') return true;
            if (user.bundleAccess) return true;
            return user.enrolledCourses.some(c => c.courseId === courseId && c.paymentStatus === 'paid');
        }
    }
};

// RUN INITIALIZATION IMMEDIATELY
TratraSystem.init();

window.Tratra = TratraSystem;
