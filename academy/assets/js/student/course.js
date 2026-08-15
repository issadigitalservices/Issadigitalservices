"use strict";

/* ==========================================================================
   ISSA Academy
   Student Course
   ========================================================================== */

import {
    auth,
    db
} from "../core/firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    doc,
    getDoc,
    getDocs,
    collection,
    query,
    where,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* ==========================================================================
   DOM
   ========================================================================== */

const courseTitle = document.getElementById("courseTitle");
const bannerTitle = document.getElementById("bannerTitle");
const courseCategory = document.getElementById("courseCategory");
const courseDescription = document.getElementById("courseDescription");
const courseThumbnail = document.getElementById("courseThumbnail");
const lessonCount = document.getElementById("lessonCount");
const progressText = document.getElementById("progressText");
const overallProgress = document.getElementById("overallProgress");
const overallProgressBar = document.getElementById("overallProgressBar");
const moduleCount = document.getElementById("moduleCount");
const lessonCountCard = document.getElementById("lessonCountCard");
const certificateStatus = document.getElementById("certificateStatus");
const moduleList = document.getElementById("moduleList");
const finalExamContainer = document.getElementById("finalExamContainer");
const loader = document.getElementById("pageLoader");
const toastContainer = document.getElementById("toastContainer");
const logoutBtn = document.getElementById("logoutBtn");

let unlockedOrder = 1;
let isFinalExamAdminUnlocked = false;

/* ==========================================================================
   CACHE
   ========================================================================== */

let completedLessons = new Set();

/* ==========================================================================
   URL
   ========================================================================== */

const params = new URLSearchParams(location.search);
const courseId = params.get("id");

if (!courseId) {
    showToast("No course selected.", "error");
    setTimeout(() => {
        location.href = "my-courses.html";
    }, 1500);
}

/* ==========================================================================
   AUTH
   ========================================================================== */

onAuthStateChanged(auth, async user => {
    if (!user) {
        location.replace("login.html");
        return;
    }

    showLoader();
    await loadCourse(user.uid);
});

/* ==========================================================================
   LOAD COURSE
   ========================================================================== */

async function loadCourse(studentId) {
    const [courseSnap, enrollment, snapshot] = await Promise.all([
        getDoc(doc(db, "courses", courseId)),
        getDocs(query(
            collection(db, "enrollments"),
            where("studentId", "==", studentId),
            where("courseId", "==", courseId),
            where("approvalStatus", "==", "Approved")
        )),
        getDocs(query(
            collection(db, "moduleProgress"),
            where("studentId", "==", studentId),
            where("courseId", "==", courseId)
        ))
    ]);

    if (!courseSnap.exists()) {
        showToast("Course not found.", "error");
        return;
    }

    const course = courseSnap.data();
    isFinalExamAdminUnlocked = course.isFinalExamUnlocked === true;

    courseTitle.textContent = course.title;
    bannerTitle.textContent = course.title;
    courseCategory.textContent = course.category || "";
    courseDescription.textContent = course.description || "";
    courseThumbnail.src = "../assets/images/courses/excel-masterclass.jpg";

    if (enrollment.empty) {
        showToast("You are not enrolled in this course.", "error");
        setTimeout(() => {
            location.href = "my-courses.html";
        }, 1500);
        return;
    }

    unlockedOrder = snapshot.size + 1;

    hideLoader();

    // Trigger UI builders simultaneously
    loadModules();
    loadCertificateStatus(studentId);
}

/* ==========================================================================
   LOAD MODULES (BULK FETCHED FOR INSTANT LOADING)
   ========================================================================== */

async function loadModules() {
    moduleList.innerHTML = "";

    // Step 1: Bulk fetch EVERYTHING for this course in only 4 queries max
    const [
        lessonProgressSnapshot,
        moduleSnapshot,
        allLessonsSnapshot,
        allExamsSnapshot,
        allAttemptsSnapshot
    ] = await Promise.all([
        getDocs(query(
            collection(db, "lessonProgress"), 
            where("studentId", "==", auth.currentUser.uid),
            where("courseId", "==", courseId)
        )),
        getDocs(query(
            collection(db, "modules"), 
            where("courseId", "==", courseId), 
            orderBy("order")
        )),
        getDocs(query(
            collection(db, "lessons"), 
            where("courseId", "==", courseId), 
            orderBy("order")
        )),
        getDocs(query(
            collection(db, "exams"), 
            where("courseId", "==", courseId)
        )),
        getDocs(query(
            collection(db, "examAttempts"), 
            where("studentId", "==", auth.currentUser.uid),
            where("passed", "==", true)
        ))
    ]);

    completedLessons.clear();
    lessonProgressSnapshot.forEach(doc => {
        if (doc.data().completed) completedLessons.add(doc.data().lessonId);
    });

    const passedExamIds = new Set();
    const passedExamData = {};
    allAttemptsSnapshot.forEach(doc => {
        const data = doc.data();
        passedExamIds.add(data.examId);
        passedExamData[data.examId] = data;
    });

    const totalModules = moduleSnapshot.size;
    if (moduleSnapshot.empty) {
        moduleList.innerHTML = "<h3>No modules found.</h3>";
        moduleCount.textContent = "0";
        lessonCountCard.textContent = "0";
        return;
    }

    // Step 2: Map fetched data in memory without network delays
    const lessonsByModule = {};
    allLessonsSnapshot.forEach(docSnap => {
        const lesson = { id: docSnap.id, ...docSnap.data() };
        if (!lessonsByModule[lesson.moduleId]) lessonsByModule[lesson.moduleId] = [];
        lessonsByModule[lesson.moduleId].push(lesson);
    });

    const examsByModule = {};
    allExamsSnapshot.forEach(docSnap => {
        const exam = { id: docSnap.id, ...docSnap.data() };
        if (exam.moduleId) examsByModule[exam.moduleId] = exam;
    });

    let totalLessonsCount = 0;
    let modulesHTML = "";

    moduleSnapshot.docs.forEach(moduleDoc => {
        const module = moduleDoc.data();
        const locked = module.order > unlockedOrder;
        const moduleLessons = lessonsByModule[moduleDoc.id] || [];
        const exam = examsByModule[moduleDoc.id];

        totalLessonsCount += moduleLessons.length;

        let lessonsHTML = "";
        let examHTML = "";

        if (locked) {
            moduleLessons.forEach(lesson => {
                lessonsHTML += `
                    <a href="#" class="lesson-item locked">
                        <div class="lesson-info"><i class="fa-solid fa-lock"></i><span>${lesson.title}</span></div>
                        <span class="lesson-lock">Locked</span>
                    </a>`;
            });
            examHTML = `
                <div class="assessment-card locked">
                    <div class="assessment-icon"><i class="fa-solid fa-lock"></i></div>
                    <div class="assessment-content"><h4>Module Exam</h4><p>Complete the previous Module Exam to unlock this module.</p></div>
                    <div class="assessment-btn disabled">Locked</div>
                </div>`;
        } else {
            moduleLessons.forEach((lesson, index) => {
                const lessonLocked = index === 0 ? false : !completedLessons.has(moduleLessons[index - 1].id);

                lessonsHTML += `
                    <a href="${lessonLocked ? "#" : `lesson.html?id=${lesson.id}`}" class="lesson-item ${lessonLocked ? "locked" : ""}">
                        <div class="lesson-info">
                            <i class="fa-solid ${lessonLocked ? "fa-lock" : "fa-circle-play"}"></i>
                            <span>${lesson.title}</span>
                        </div>
                        ${lessonLocked ? '<span class="lesson-lock">Locked</span>' : '<i class="fa-solid fa-chevron-right"></i>'}
                    </a>`;
            });

            const allLessonsCompleted = moduleLessons.length > 0 && moduleLessons.every(lesson => completedLessons.has(lesson.id));

            if (exam) {
                if (passedExamIds.has(exam.id)) {
                    const attempt = passedExamData[exam.id];
                    examHTML = `
                        <div class="assessment-card passed">
                            <div class="assessment-icon"><i class="fa-solid fa-circle-check"></i></div>
                            <div class="assessment-content">
                                <h4>${exam.title}</h4>
                                <p>Score: ${attempt.score}/${attempt.totalMarks} (${attempt.percentage}%)<br><strong style="color:#16a34a;">✅ Passed</strong></p>
                            </div>
                        </div>`;
                } else if (allLessonsCompleted) {
                    examHTML = `
                        <div class="assessment-card">
                            <div class="assessment-icon"><i class="fa-solid fa-file-circle-question"></i></div>
                            <div class="assessment-content">
                                <h4>${exam.title}</h4>
                                <p>Complete this Exam to unlock the next Module.</p>
                            </div>
                            <a href="start-assessment.html?id=${exam.id}&courseId=${courseId}" class="assessment-btn">Start Exam</a>
                        </div>`;
                } else {
                    examHTML = `
                        <div class="assessment-card locked">
                            <div class="assessment-icon"><i class="fa-solid fa-lock"></i></div>
                            <div class="assessment-content"><h4>Module Exam</h4><p>Complete all lessons to unlock this Exam.</p></div>
                            <div class="assessment-btn disabled">Locked</div>
                        </div>`;
                }
            }
        }

        modulesHTML += `
            <div class="module-card">
                <div class="module-header">
                    <div class="module-title">
                        ${module.order}. ${module.title}
                        ${locked ? '<span class="module-lock"><i class="fa-solid fa-lock"></i> Locked</span>' : ""}
                    </div>
                    <i class="fa-solid fa-chevron-down"></i>
                </div>
                <div class="lesson-list show">
                    ${lessonsHTML}
                    ${examHTML}
                </div>
            </div>`;
    });

    moduleList.innerHTML = modulesHTML;

    // Update UI Counters
    moduleCount.textContent = totalModules;
    lessonCountCard.textContent = totalLessonsCount;
    lessonCount.textContent = totalLessonsCount;

    const completedLessonCount = lessonProgressSnapshot.docs.filter(
        doc => doc.data().completed === true
    ).length;

    const percentage = totalLessonsCount > 0 ? Math.round((completedLessonCount / totalLessonsCount) * 100) : 0;
    progressText.textContent = `${percentage}%`;
    overallProgress.textContent = `${percentage}%`;
    overallProgressBar.style.width = `${percentage}%`;

    document.getElementById("completedLessons").textContent = completedLessonCount;
    document.getElementById("lessonCountProgress").textContent = totalLessonsCount;

    document.querySelectorAll(".module-header").forEach(header => {
        header.addEventListener("click", () => {
            header.nextElementSibling.classList.toggle("show");
        });
    });

    await loadFinalExam();
}

async function loadCertificateStatus(studentId) {
    const snapshot = await getDocs(
        query(
            collection(db, "certificates"),
            where("studentId", "==", studentId),
            where("courseId", "==", courseId)
        )
    );

    if (snapshot.empty) {
        certificateStatus.textContent = "Locked";
        return;
    }

    certificateStatus.innerHTML = `
        <a href="certificate-view.html?courseId=${courseId}">
            View Certificate
        </a>
    `;
}

/* ==========================================================================
   LOAD FINAL EXAM
   ========================================================================== */

async function loadFinalExam() {
    finalExamContainer.innerHTML = "";

    const [finalExamSnapshot, moduleSnapshot] = await Promise.all([
        getDocs(query(
            collection(db, "exams"),
            where("courseId", "==", courseId),
            where("type", "==", "final"),
            limit(1)
        )),
        getDocs(query(
            collection(db, "modules"),
            where("courseId", "==", courseId)
        ))
    ]);

    if (finalExamSnapshot.empty) {
        return;
    }

    const finalExamDoc = finalExamSnapshot.docs[0];
    const finalExam = finalExamDoc.data();

    const moduleExamPromises = moduleSnapshot.docs.map(async moduleDoc => {
        const examSnapshot = await getDocs(
            query(
                collection(db, "exams"),
                where("courseId", "==", courseId),
                where("moduleId", "==", moduleDoc.id),
                where("type", "==", "module"),
                limit(1)
            )
        );

        if (examSnapshot.empty) {
            return false;
        }

        const examDoc = examSnapshot.docs[0];

        const attemptSnapshot = await getDocs(
            query(
                collection(db, "examAttempts"),
                where("studentId", "==", auth.currentUser.uid),
                where("examId", "==", examDoc.id),
                where("passed", "==", true),
                limit(1)
            )
        );

        return !attemptSnapshot.empty;
    });

    const [moduleExamResults, attemptSnapshot] = await Promise.all([
        Promise.all(moduleExamPromises),
        getDocs(query(
            collection(db, "examAttempts"),
            where("studentId", "==", auth.currentUser.uid),
            where("examId", "==", finalExamDoc.id),
            where("passed", "==", true),
            limit(1)
        ))
    ]);

    const modulesCompleted = moduleExamResults.length === moduleSnapshot.size &&
        moduleExamResults.every(passed => passed === true);

    if (!attemptSnapshot.empty) {
        const attempt = attemptSnapshot.docs[0].data();

        finalExamContainer.innerHTML = `
            <div class="assessment-card passed">
                <div class="assessment-icon">
                    <i class="fa-solid fa-graduation-cap"></i>
                </div>
                <div class="assessment-content">
                    <h4>${finalExam.title}</h4>
                    <p>
                        Score: ${attempt.score}/${attempt.totalMarks} (${attempt.percentage}%)
                        <br>
                        <strong style="color:#16a34a;">✅ Final Exam Passed</strong>
                    </p>
                </div>
            </div>
        `;
        return;
    }

    if (modulesCompleted) {
        finalExamContainer.innerHTML = `
            <div class="assessment-card">
                <div class="assessment-icon">
                    <i class="fa-solid fa-graduation-cap"></i>
                </div>
                <div class="assessment-content">
                    <h4>${finalExam.title}</h4>
                    <p>Complete the Final Exam to complete your course.</p>
                </div>
                <a href="start-assessment.html?id=${finalExamDoc.id}&courseId=${courseId}" class="assessment-btn">
                    Start Final Exam
                </a>
            </div>
        `;
    } else {
        finalExamContainer.innerHTML = `
            <div class="assessment-card locked">
                <div class="assessment-icon">
                    <i class="fa-solid fa-lock"></i>
                </div>
                <div class="assessment-content">
                    <h4>Final Certification Exam</h4>
                    <p>Complete all Module Exams to unlock the Final Exam.</p>
                </div>
                <div class="assessment-btn disabled">
                    Locked
                </div>
            </div>
        `;
    }
}

/* ==========================================================================
   LOGOUT & HELPERS
   ========================================================================== */

logoutBtn.addEventListener("click", async event => {
    event.preventDefault();
    await signOut(auth);
    location.href = "login.html";
});

function showLoader() { loader.classList.remove("hidden"); }
function hideLoader() { loader.classList.add("hidden"); }

function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => toast.remove(), 3000);
}