/**
 * Tratra secure application core.
 *
 * Uses Firebase Authentication, Firestore, and Storage instead of browser-only
 * localStorage. Tratra data is kept separate from SciEngage data by collection
 * names and Storage paths beginning with "tratra".
 */
(function () {
  "use strict";

  if (!window.firebase) {
    console.error("Firebase SDK was not loaded before system.js.");
    return;
  }

  const ADMIN_EMAIL = "tratraedu@gmail.com";
  const USERS = "tratraUsers";
  const PAYMENTS = "tratraPayments";
  const ACCESS = "tratraAccess";
  const PROGRESS = "tratraProgress";
  const SCORES = "tratraScores";
  const SETTINGS = "tratraSettings";
  const COURSES = "tratraCourses";

  const defaultSettings = {
    siteName: "Tratra",
    whatsapp: "+96877598158",
    bankData: {
      NGN: { bank: "Guaranty Trust Bank", accName: "Tratra Education Ltd", accNum: "1234567890", extra: "" },
      OMR: { bank: "Bank of Muscat", accName: "Tratra Training Center", accNum: "00123456789", extra: "IBAN: OM00 BMSB 0000 0000 1234 5678" },
      USD: { bank: "JP Morgan Chase", accName: "Tratra International", accNum: "987654321", extra: "SWIFT: CHASUS33" }
    }
  };

  const courses = {
    c1: {
      title: "The Philosophy and Psychology of a Teacher",
      description: "Explore the philosophical and psychological foundations of effective teaching.",
      outcomes: ["Develop a personal teaching philosophy", "Apply psychology to motivate diverse learners", "Build professional resilience"],
      resources: { ppt: "assets/c1_handbook.pptx", pdf: "assets/c1_handbook.pdf", video: "" },
      quiz: [
        { q: "Which idea is central to a growth mindset?", a: ["Ability never changes", "Effort can support mastery", "Challenges should be avoided", "Feedback is unnecessary"], correct: 1 },
        { q: "Cognitive load is most closely connected to the limits of what kind of memory?", a: ["Working memory", "Procedural memory", "Episodic memory", "Long-term memory"], correct: 0 },
        { q: "Inclusive education primarily aims to provide learners with what?", a: ["Identical tasks", "Separate classrooms", "Equitable access and participation", "Only standardized tests"], correct: 2 },
        { q: "Maslow's model places which need at the foundation?", a: ["Esteem", "Belonging", "Self-actualization", "Physiological needs"], correct: 3 },
        { q: "The Zone of Proximal Development is associated with which psychologist?", a: ["Vygotsky", "Pavlov", "Skinner", "Thorndike"], correct: 0 }
      ]
    },
    c2: {
      title: "Student and Teacher Centered Pedagogy",
      description: "Compare instructional models and apply active, inclusive learning strategies.",
      outcomes: ["Design student-led lessons", "Balance direct instruction with collaboration", "Use differentiated instruction"],
      resources: { ppt: "assets/c2_handbook.pptx", pdf: "assets/c2_handbook.pdf", video: "" },
      quiz: [
        { q: "In student-centered learning, the teacher mainly acts as a...", a: ["Facilitator", "Silent observer", "Sole lecturer", "Exam invigilator"], correct: 0 },
        { q: "Which practice gives learners the most ownership?", a: ["Copying notes only", "Student inquiry and choice", "One-way lecture", "Removing discussion"], correct: 1 },
        { q: "Differentiation means adapting teaching to differences in learners'...", a: ["Uniformity", "Needs and readiness", "School buildings", "Attendance registers"], correct: 1 },
        { q: "Collaborative learning is strongest when students have...", a: ["A shared goal and clear roles", "No instructions", "Identical opinions", "No feedback"], correct: 0 },
        { q: "Direct instruction can be useful when learners need...", a: ["Clear modelling of a new skill", "No explanation", "Less structure", "Only independent work"], correct: 0 }
      ]
    },
    c3: {
      title: "Planning in Teaching",
      description: "Build coherent plans from curriculum mapping to daily classroom delivery.",
      outcomes: ["Map learning across a term", "Write measurable objectives", "Align assessment with instruction"],
      resources: { ppt: "assets/c3_handbook.pptx", pdf: "assets/c3_handbook.pdf", video: "" },
      quiz: [
        { q: "A strong lesson objective should describe what learners will...", a: ["Do or demonstrate", "Memorize without context", "Avoid", "Feel only"], correct: 0 },
        { q: "Curriculum mapping helps teachers see...", a: ["Only attendance", "Progression and connections across learning", "The school budget", "Staff birthdays"], correct: 1 },
        { q: "Assessment should be aligned with...", a: ["The teacher's mood", "The learning objectives", "The classroom wall", "The school logo"], correct: 1 },
        { q: "A scheme of work usually organizes learning across a...", a: ["Longer period such as a term", "Single question", "Five-minute break", "One attendance entry"], correct: 0 },
        { q: "A useful lesson plan includes a way to check...", a: ["Whether learning occurred", "Only the room temperature", "The teacher's handwriting", "The number of chairs"], correct: 0 }
      ]
    },
    c4: {
      title: "School Administration",
      description: "Understand leadership, policy, people, resources, and ethical school governance.",
      outcomes: ["Understand school governance", "Coordinate people and resources", "Handle conflict ethically"],
      resources: { ppt: "assets/c4_handbook.pptx", pdf: "assets/c4_handbook.pdf", video: "" },
      quiz: [
        { q: "Effective school administration should ultimately support...", a: ["Student learning and wellbeing", "More paperwork only", "Competition between staff", "Fewer communication channels"], correct: 0 },
        { q: "A school policy should be applied with...", a: ["Consistency and professional judgment", "Secrecy", "Favouritism", "No documentation"], correct: 0 },
        { q: "Good delegation includes clear responsibility and...", a: ["Support and accountability", "No follow-up", "Hidden expectations", "Punishment first"], correct: 0 },
        { q: "Conflict resolution begins with...", a: ["Understanding the issue and hearing relevant perspectives", "Ignoring everyone", "Choosing a winner immediately", "Spreading rumours"], correct: 0 },
        { q: "School resources should be allocated according to...", a: ["Educational priorities and fairness", "Personal preference only", "The loudest request", "Random selection"], correct: 0 }
      ]
    },
    c5: {
      title: "Job Interviews and Demo Prep",
      description: "Prepare a confident professional portfolio, interview response, and demonstration lesson.",
      outcomes: ["Build a focused teaching portfolio", "Answer interview questions clearly", "Deliver an effective demo lesson"],
      resources: { ppt: "assets/c5_handbook.pptx", pdf: "assets/c5_handbook.pdf", video: "" },
      quiz: [
        { q: "A teaching portfolio should show evidence of...", a: ["Professional practice and impact", "Only personal hobbies", "Unverified claims", "Blank lesson plans"], correct: 0 },
        { q: "A strong interview answer should be...", a: ["Specific and supported by an example", "Very vague", "Unrelated to the role", "Long but unsupported"], correct: 0 },
        { q: "A demo lesson should begin with...", a: ["A clear purpose and engaging opening", "An apology", "A silent worksheet", "A long unrelated story"], correct: 0 },
        { q: "When discussing a challenge, a candidate should explain...", a: ["Action taken and learning gained", "Who to blame", "Only the problem", "Nothing measurable"], correct: 0 },
        { q: "Professional interview preparation includes researching the...", a: ["School and role", "Weather only", "Interviewer's private life", "Unrelated companies"], correct: 0 }
      ]
    },
    c6: {
      title: "AI and Digital Tools for Teaching",
      description: "Use AI and digital tools thoughtfully to plan, assess, personalize, and communicate.",
      outcomes: ["Use AI responsibly for planning", "Evaluate digital tools", "Protect learner privacy"],
      resources: { ppt: "assets/c6_handbook.pptx", pdf: "assets/c6_handbook.pdf", video: "" },
      quiz: [
        { q: "AI-generated teaching material should be...", a: ["Reviewed by the teacher", "Published without checking", "Treated as always correct", "Used without context"], correct: 0 },
        { q: "A key digital-privacy practice is to...", a: ["Avoid sharing unnecessary personal learner data", "Publish all student data", "Reuse passwords", "Ignore permissions"], correct: 0 },
        { q: "A useful prompt usually includes context, task, and...", a: ["Desired format or criteria", "A secret password", "Random unrelated text", "No audience"], correct: 0 },
        { q: "Technology improves learning when it supports...", a: ["A clear pedagogical purpose", "Novelty alone", "More screen time regardless of need", "Less feedback"], correct: 0 },
        { q: "Teachers should check AI outputs for bias, accuracy, and...", a: ["Age appropriateness", "Brand colour", "File size only", "Popularity"], correct: 0 }
      ]
    },
    c7: {
      title: "Measurement and Evaluation",
      description: "Design valid, reliable, fair assessments and use evidence to improve learning.",
      outcomes: ["Distinguish assessment concepts", "Design better tests and rubrics", "Use results for improvement"],
      resources: { ppt: "assets/c7_handbook.pptx", pdf: "assets/c7_handbook.pdf", video: "" },
      quiz: [
        { q: "Measurement is best described as...", a: ["Assigning numbers or descriptions to an attribute", "A school timetable", "A teaching philosophy", "A parent meeting"], correct: 0 },
        { q: "Validity asks whether an assessment measures...", a: ["What it is intended to measure", "Only speed", "The teacher's preference", "The number of pages"], correct: 0 },
        { q: "Reliability refers to...", a: ["Consistency of results", "The attractiveness of a test", "The length of a lesson", "Student popularity"], correct: 0 },
        { q: "Formative assessment is mainly used to...", a: ["Improve learning during instruction", "Certify a final award only", "Replace all teaching", "Rank schools publicly"], correct: 0 },
        { q: "A rubric makes criteria and performance levels...", a: ["Clearer", "Less visible", "Random", "Unnecessary"], correct: 0 }
      ]
    },
    c8: {
      title: "Classroom Management Tactics",
      description: "Create predictable, positive classrooms using proactive routines and responsive strategies.",
      outcomes: ["Establish clear routines", "Use positive reinforcement", "Respond to behaviour fairly"],
      resources: { ppt: "assets/c8_handbook.pptx", pdf: "assets/c8_handbook.pdf", video: "" },
      quiz: [
        { q: "Proactive classroom management focuses on...", a: ["Preventing problems through routines and relationships", "Punishment first", "Ignoring expectations", "Surprise rules"], correct: 0 },
        { q: "A classroom routine should be...", a: ["Taught, practised, and reinforced", "Kept secret", "Changed every minute", "Used only after disruption"], correct: 0 },
        { q: "Positive reinforcement is used to...", a: ["Increase a behaviour by recognizing it", "Remove all expectations", "Embarrass a learner", "Avoid feedback"], correct: 0 },
        { q: "A fair response to behaviour should be...", a: ["Consistent, respectful, and proportionate", "Publicly humiliating", "Unpredictable", "Unrelated to the behaviour"], correct: 0 },
        { q: "Strong teacher-learner relationships are supported by...", a: ["Respect, clarity, and listening", "Favouritism", "Silence only", "Unclear boundaries"], correct: 0 }
      ]
    }
  };

  const courseContent = {
    c1: [
      { title: "Philosophy of Teaching", lessons: [{ title: "Why Teaching Matters", body: "Examine the purposes, values, and beliefs that shape a teacher's professional identity." }, { title: "Building a Personal Philosophy", body: "Connect educational beliefs to classroom decisions, learner dignity, and professional responsibility." }] },
      { title: "Psychology of Learning", lessons: [{ title: "How Learners Develop", body: "Review development, motivation, memory, and the role of supportive learning environments." }, { title: "Resilience and Reflection", body: "Use reflection and practical resilience strategies to sustain effective teaching." }] }
    ],
    c2: [
      { title: "Teaching Models", lessons: [{ title: "Teacher-Centred Practice", body: "Identify the strengths and limits of direct instruction, modelling, explanation, and guided practice." }, { title: "Student-Centred Practice", body: "Explore inquiry, collaboration, choice, and learner voice in classroom design." }] },
      { title: "Responsive Pedagogy", lessons: [{ title: "Differentiation", body: "Adapt content, process, support, and outcomes to learner readiness and need." }, { title: "Choosing the Right Approach", body: "Combine teacher and student-centred strategies according to the lesson goal and context." }] }
    ],
    c3: [
      { title: "Planning Levels", lessons: [{ title: "Curriculum Mapping", body: "Connect long-term curriculum intentions to termly progression and classroom sequence." }, { title: "Schemes of Work", body: "Organize topics, outcomes, resources, assessment, and timing across a teaching period." }] },
      { title: "The Effective Lesson", lessons: [{ title: "Writing Objectives", body: "Write measurable objectives that make the expected learner performance clear." }, { title: "Evidence of Learning", body: "Align activities and assessment evidence with the lesson objectives." }] }
    ],
    c4: [
      { title: "Leading Schools", lessons: [{ title: "Governance and Purpose", body: "Understand how school vision, policy, roles, and accountability support learning and wellbeing." }, { title: "Ethical Leadership", body: "Use fairness, transparency, and professional judgment when making decisions." }] },
      { title: "People and Resources", lessons: [{ title: "Coordinating Staff", body: "Use communication, delegation, and support to build effective teams." }, { title: "Managing Conflict", body: "Approach conflict through listening, evidence, respectful dialogue, and agreed action." }] }
    ],
    c5: [
      { title: "Professional Preparation", lessons: [{ title: "Your Teaching Portfolio", body: "Select evidence that demonstrates planning, instruction, assessment, reflection, and learner impact." }, { title: "Researching the School", body: "Prepare by understanding the school's values, learners, curriculum, and expectations." }] },
      { title: "Interview and Demo", lessons: [{ title: "Answering with Evidence", body: "Structure examples around the situation, action, result, and professional learning." }, { title: "Delivering the Demo", body: "Plan a focused opening, clear objective, active learning, checks for understanding, and a confident close." }] }
    ],
    c6: [
      { title: "Responsible AI", lessons: [{ title: "AI in the Teacher's Workflow", body: "Identify practical uses for planning, differentiation, assessment, and feedback." }, { title: "Checking AI Output", body: "Review accuracy, bias, privacy, age suitability, and curriculum alignment before use." }] },
      { title: "Digital Classroom Practice", lessons: [{ title: "Choosing Tools", body: "Select tools according to learning purpose, accessibility, privacy, and available support." }, { title: "Designing Engaging Content", body: "Use digital media and interaction to support, not distract from, learning." }] }
    ],
    c7: [
      { title: "Assessment Foundations", lessons: [{ title: "Measurement and Evaluation", body: "Distinguish measurement, assessment, evaluation, and testing in educational practice." }, { title: "Validity and Reliability", body: "Use clear constructs, consistent procedures, and suitable evidence to improve assessment quality." }] },
      { title: "Using Evidence", lessons: [{ title: "Formative Assessment", body: "Gather evidence during teaching and use it to adapt instruction and feedback." }, { title: "Rubrics and Reporting", body: "Create transparent criteria and communicate achievement fairly and clearly." }] }
    ],
    c8: [
      { title: "Proactive Foundations", lessons: [{ title: "Routines and Expectations", body: "Teach predictable procedures and make expectations visible, practised, and consistent." }, { title: "Relationships and Belonging", body: "Build a classroom culture where learners feel known, respected, and responsible." }] },
      { title: "Responsive Strategies", lessons: [{ title: "Positive Reinforcement", body: "Recognize constructive behaviour and use feedback to strengthen classroom habits." }, { title: "Fair Behaviour Responses", body: "Respond calmly and proportionately while maintaining dignity, safety, and accountability." }] }
    ]
  };

  const app = firebase.apps.length
    ? firebase.app()
    : firebase.initializeApp(window.TratraFirebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();

  let currentUser = null;
  let currentProfile = null;
  let resolveReady;
  const ready = new Promise((resolve) => { resolveReady = resolve; });

  function profileFor(user, profile) {
    if (!user) return null;
    return {
      ...(profile || {}),
      uid: user.uid,
      email: user.email || profile?.email || "",
      name: profile?.name || user.displayName || user.email?.split("@")[0] || "Teacher",
      role: profile?.role || "teacher",
      enrolledCourses: Array.isArray(profile?.enrolledCourses) ? profile.enrolledCourses : [],
      scores: profile?.scores || {}
    };
  }

  async function loadProfile(user) {
    if (!user) return null;
    const snap = await db.collection(USERS).doc(user.uid).get();
    if (snap.exists) return snap.data();
    const profile = {
      uid: user.uid,
      name: user.displayName || user.email?.split("@")[0] || "Teacher",
      email: user.email || "",
      role: "teacher",
      status: "pending",
      plan: "free",
      phone: "",
      subject: "",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    await db.collection(USERS).doc(user.uid).set(profile, { merge: true });
    return profile;
  }

  auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    currentProfile = null;
    await loadCourseOverrides();
    if (user) {
      try { currentProfile = await loadProfile(user); }
      catch (error) { console.error("Tratra profile load failed", error); }
    }
    resolveReady({ user: currentUser, profile: currentProfile });
  });

  function isAdminUser(user = currentUser) {
    return Boolean(
      user &&
      user.email &&
      user.email.toLowerCase() === ADMIN_EMAIL &&
      user.emailVerified
    );
  }

  async function requireAdmin() {
    await ready;
    if (!isAdminUser()) throw new Error("Administrator access is required.");
    return true;
  }

  async function getSettings() {
    try {
      const snap = await db.collection(SETTINGS).doc("site").get();
      if (snap.exists) return { ...defaultSettings, ...snap.data(), bankData: { ...defaultSettings.bankData, ...(snap.data().bankData || {}) } };
    } catch (error) { console.error("Settings load failed", error); }
    return defaultSettings;
  }

  async function loadCourseOverrides() {
    try {
      const snap = await db.collection(COURSES).get();
      snap.forEach((item) => {
        const base = courses[item.id] || {};
        courses[item.id] = {
          ...base,
          ...item.data(),
          resources: { ...(base.resources || {}), ...(item.data().resources || {}) }
        };
      });
    } catch (error) {
      console.error("Course settings load failed", error);
    }
  }

  async function getAccess(uid) {
    const snap = await db.collection(ACCESS).doc(uid).get();
    return snap.exists ? snap.data() : { bundleAccess: false, courses: [] };
  }

  async function getProgress(uid, courseId) {
    const snap = await db.collection(PROGRESS).doc(uid).collection("courses").doc(courseId).get();
    return snap.exists ? snap.data() : { progress: 0, completed: false };
  }

  async function getScores(uid) {
    const snap = await db.collection(SCORES).where("uid", "==", uid).get();
    const result = {};
    snap.forEach((item) => { const data = item.data(); result[data.courseId] = data; });
    return result;
  }

  const Tratra = {
    ADMIN_EMAIL,
    courses,
    courseContent,
    settings: {
      ...defaultSettings,
      ready: getSettings,
      save: async (data) => {
        await requireAdmin();
        await db.collection(SETTINGS).doc("site").set(data, { merge: true });
      }
    },
    auth: {
      ready,
      signup: async (data) => {
        const email = String(data.email || "").trim().toLowerCase();
        const credential = await auth.createUserWithEmailAndPassword(email, data.password);
        if (data.name) await credential.user.updateProfile({ displayName: data.name });
        const profile = {
          uid: credential.user.uid,
          name: String(data.name || "").trim(),
          email,
          phone: String(data.phone || "").trim(),
          subject: String(data.subject || "").trim(),
          role: "teacher",
          status: "pending",
          plan: "free",
          enrolledCourses: [],
          scores: {},
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        await db.collection(USERS).doc(credential.user.uid).set(profile, { merge: true });
        await credential.user.sendEmailVerification().catch(() => undefined);
        currentUser = credential.user;
        currentProfile = profile;
        return profileFor(currentUser, currentProfile);
      },
      login: async (email, password) => {
        const credential = await auth.signInWithEmailAndPassword(String(email || "").trim().toLowerCase(), password);
        currentUser = credential.user;
        currentProfile = await loadProfile(credential.user);
        return profileFor(currentUser, currentProfile);
      },
      logout: () => auth.signOut(),
      getCurrentUser: () => profileFor(currentUser, currentProfile),
      isAdmin: () => isAdminUser(),
      resendVerification: async () => { if (currentUser && !currentUser.emailVerified) await currentUser.sendEmailVerification(); },
      getIdToken: async () => { await ready; if (!currentUser) throw new Error("Please sign in first."); return currentUser.getIdToken(); }
    },
    db: {
      getUsers: async () => { await requireAdmin(); const snap = await db.collection(USERS).where("role", "==", "teacher").get(); return snap.docs.map((item) => ({ id: item.id, ...item.data() })); },
      getPayments: async () => { await requireAdmin(); const snap = await db.collection(PAYMENTS).orderBy("createdAt", "desc").get(); return snap.docs.map((item) => ({ id: item.id, ...item.data() })); },
      getScores: async () => { await requireAdmin(); const snap = await db.collection(SCORES).get(); return snap.docs.map((item) => ({ id: item.id, ...item.data() })); }
    },
    payments: {
      submitManual: async ({ plan, courseId, amount, currency, reference, proofFile }) => {
        await ready;
        if (!currentUser) throw new Error("Please sign in before submitting payment details.");
        const paymentRef = db.collection(PAYMENTS).doc();
        let proofPath = "";
        if (proofFile) {
          const safeName = String(proofFile.name || "proof").replace(/[^a-z0-9._-]+/gi, "-");
          proofPath = `tratraPayments/${currentUser.uid}/${paymentRef.id}-${safeName}`;
          await storage.ref(proofPath).put(proofFile, { contentType: proofFile.type || "application/octet-stream" });
        }
        await paymentRef.set({
          uid: currentUser.uid,
          name: currentProfile?.name || currentUser.displayName || "",
          email: currentUser.email || "",
          plan: plan || "single",
          courseId: courseId || "",
          amount: Number(amount || 0),
          currency: currency || "USD",
          reference: String(reference || "").trim(),
          proofPath,
          method: "bank_transfer",
          status: "pending",
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return paymentRef.id;
      },
      proofUrl: async (proofPath) => {
        await requireAdmin();
        if (!proofPath) return "";
        return storage.ref(proofPath).getDownloadURL();
      },
      startPaystack: async ({ product, courseId = "" }) => {
        const token = await Tratra.auth.getIdToken();
        const response = await fetch("/.netlify/functions/paystack-initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ site: "tratra", product, courseId }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success || !result.authorizationUrl) throw new Error(result.error || "Paystack could not start the payment.");
        window.location.href = result.authorizationUrl;
      },
      approve: async (paymentId) => {
        await requireAdmin();
        const ref = db.collection(PAYMENTS).doc(paymentId);
        const snap = await ref.get();
        if (!snap.exists) throw new Error("Payment request not found.");
        const payment = snap.data();
        const accessRef = db.collection(ACCESS).doc(payment.uid);
        const accessSnap = await accessRef.get();
        const existing = accessSnap.exists ? accessSnap.data() : { bundleAccess: false, courses: [] };
        const coursesForAccess = payment.plan === "bundle"
          ? Object.keys(courses)
          : Array.from(new Set([...(existing.courses || []), payment.courseId])).filter(Boolean);
        await accessRef.set({ uid: payment.uid, bundleAccess: payment.plan === "bundle" || existing.bundleAccess === true, courses: coursesForAccess, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        await ref.update({ status: "completed", approvedAt: firebase.firestore.FieldValue.serverTimestamp(), approvedBy: currentUser.uid });
        await db.collection(USERS).doc(payment.uid).set({ plan: payment.plan === "bundle" ? "bundle" : "single", status: "approved", updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      }
    },
    lms: {
      checkAccess: async (uid, courseId) => {
        await ready;
        if (!currentUser || currentUser.uid !== uid) return false;
        if (isAdminUser()) return true;
        const access = await getAccess(uid);
        return access.bundleAccess === true || (access.courses || []).includes(courseId);
      },
      getAccess,
      getProgress,
      getScores,
      updateProgress: async (uid, courseId, progress) => {
        await ready;
        if (!currentUser || currentUser.uid !== uid) throw new Error("Please sign in again.");
        await db.collection(PROGRESS).doc(uid).collection("courses").doc(courseId).set({ uid, courseId, progress: Math.max(0, Math.min(100, Number(progress) || 0)), completed: Number(progress) >= 100, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      },
      saveScore: async (uid, courseId, score) => {
        await ready;
        if (!currentUser || currentUser.uid !== uid) throw new Error("Please sign in again.");
        await db.collection(SCORES).doc(`${uid}_${courseId}`).set({ uid, courseId, score: Number(score) || 0, date: new Date().toLocaleDateString() }, { merge: true });
      }
    },
    admin: {
      require: requireAdmin,
      getSettings,
      saveSettings: async (data) => { await requireAdmin(); await db.collection(SETTINGS).doc("site").set(data, { merge: true }); },
      getCourses: async () => { await requireAdmin(); const snap = await db.collection(COURSES).get(); const result = {}; snap.forEach((item) => { result[item.id] = item.data(); }); return result; },
      saveCourse: async (courseId, data) => { await requireAdmin(); await db.collection(COURSES).doc(courseId).set(data, { merge: true }); }
    }
  };

  window.Tratra = Tratra;
})();
