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

const courseTitle =
    document.getElementById("courseTitle");

const bannerTitle =
    document.getElementById("bannerTitle");

const courseCategory =
    document.getElementById("courseCategory");

const courseDescription =
    document.getElementById("courseDescription");

const courseThumbnail =
    document.getElementById("courseThumbnail");

const lessonCount =
    document.getElementById("lessonCount");

const progressText =
    document.getElementById("progressText");

    const overallProgress =
    document.getElementById("overallProgress");

const overallProgressBar =
    document.getElementById("overallProgressBar");

const moduleCount =
    document.getElementById("moduleCount");

const lessonCountCard =
    document.getElementById("lessonCountCard");

const certificateStatus =
    document.getElementById("certificateStatus");

const moduleList =
    document.getElementById("moduleList");

    const finalExamContainer =
    document.getElementById("finalExamContainer");

const loader =
    document.getElementById("pageLoader");

const toastContainer =
    document.getElementById("toastContainer");

const logoutBtn =
    document.getElementById("logoutBtn");

    let unlockedOrder = 1;
    let isFinalExamAdminUnlocked = false; // Add this line

    /* ==========================================================================
   CACHE
   ========================================================================== */

let completedLessons = new Set();

let lessonProgressSnapshot = null;

/* ==========================================================================
   URL
   ========================================================================== */

const params =
    new URLSearchParams(location.search);

const courseId =
    params.get("id");

    // Add this validation check:
if (!courseId) {
    showToast("No course selected.", "error");
    setTimeout(() => {
        location.href = "my-courses.html";
    }, 1500);
}

/* ==========================================================================
   AUTH
   ========================================================================== */

onAuthStateChanged(

    auth,

    async user=>{

        if(!user){

            location.replace(

                "login.html"

            );

            return;

        }

        showLoader();

await loadCourse(user.uid);

// Loader is now hidden inside loadCourse()

    }

);

/* ==========================================================================
   LOAD COURSE
   ========================================================================== */

async function loadCourse(studentId){

    const courseSnap =

        await getDoc(

            doc(

                db,

                "courses",

                courseId

            )

        );

    if(!courseSnap.exists()){

        showToast(

            "Course not found.",

            "error"

        );

        return;

    }

    const course =

        courseSnap.data();

        isFinalExamAdminUnlocked = course.isFinalExamUnlocked === true; // Add this line

    courseTitle.textContent =
        course.title;

    bannerTitle.textContent =
        course.title;

    courseCategory.textContent =
        course.category || "";

    courseDescription.textContent =
        course.description || "";

    courseThumbnail.src =
    "../assets/images/courses/excel-masterclass.jpg";


    /* ================= Progress ================= */

    const enrollment = await getDocs(

    query(

        collection(
            db,
            "enrollments"
        ),

        where(
            "studentId",
            "==",
            studentId
        ),

        where(
            "courseId",
            "==",
            courseId
        ),

        where(
            "approvalStatus",
            "==",
            "Approved"
        )

    )

);

if(enrollment.empty){

    showToast(
        "You are not enrolled in this course.",
        "error"
    );

    setTimeout(()=>{

        location.href = "my-courses.html";

    },1500);

    return;

}

await loadUnlockedModule(studentId);

// Show the page immediately
hideLoader();

// Load the remaining data in the background
loadModules();
loadCertificateStatus(studentId);
}

async function loadUnlockedModule(studentId){

    const snapshot = await getDocs(

        query(

            collection(db,"moduleProgress"),

            where("studentId","==",studentId),

            where("courseId","==",courseId)

        )

    );

    unlockedOrder =

        snapshot.size + 1;

}

/* ==========================================================================
   LOAD MODULES
   ========================================================================== */

async function loadModules() {
    moduleList.innerHTML = "";

    // 1. Fetch Lesson Progress and Modules concurrently
    const [lessonProgressSnapshot, moduleSnapshot] = await Promise.all([
        getDocs(query(collection(db, "lessonProgress"), where("studentId", "==", auth.currentUser.uid))),
        getDocs(query(collection(db, "modules"), where("courseId", "==", courseId), orderBy("order")))
    ]);

    completedLessons.clear();
    lessonProgressSnapshot.forEach(doc => {
        if (doc.data().completed) completedLessons.add(doc.data().lessonId);
    });

    const totalModules = moduleSnapshot.size;
    if (moduleSnapshot.empty) {
        moduleList.innerHTML = "<h3>No modules found.</h3>";
        moduleCount.textContent = "0";
        lessonCountCard.textContent = "0";
        return;
    }

    // 2. Fetch all module content IN PARALLEL instead of inside a sequential 'for...of' loop
    const modulePromises = moduleSnapshot.docs.map(async (moduleDoc) => {
        const module = moduleDoc.data();
        const locked = module.order > unlockedOrder;

        // Run lesson query and exam query simultaneously for this module
        const [lessonSnapshot, examSnapshot] = await Promise.all([
            getDocs(query(collection(db, "lessons"), where("moduleId", "==", moduleDoc.id), orderBy("order"))),
            getDocs(query(collection(db, "exams"), where("courseId", "==", courseId), where("moduleId", "==", moduleDoc.id), limit(1)))
        ]);

        let lessonsHTML = "";
        let examHTML = "";

        if (locked) {
            lessonSnapshot.forEach(docSnap => {
                const lesson = docSnap.data();
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
            let lessonIndex = 1;
            lessonSnapshot.forEach(docSnap => {
                const lesson = docSnap.data();
                const lessonLocked = lessonIndex === 1 ? false : !completedLessons.has(lessonSnapshot.docs[lessonIndex - 2].id);

                lessonsHTML += `
                    <a href="${lessonLocked ? "#" : `lesson.html?id=${docSnap.id}`}" class="lesson-item ${lessonLocked ? "locked" : ""}">
                        <div class="lesson-info">
                            <i class="fa-solid ${lessonLocked ? "fa-lock" : "fa-circle-play"}"></i>
                            <span>${lesson.title}</span>
                        </div>
                        ${lessonLocked ? '<span class="lesson-lock">Locked</span>' : '<i class="fa-solid fa-chevron-right"></i>'}
                    </a>`;
                lessonIndex++;
            });

            const allLessonsCompleted = lessonSnapshot.docs.every(doc => completedLessons.has(doc.id));

            if (!examSnapshot.empty) {
                const exam = examSnapshot.docs[0];
                const examData = exam.data();

                const attemptSnapshot = await getDocs(
                    query(collection(db, "examAttempts"), where("studentId", "==", auth.currentUser.uid), where("examId", "==", exam.id), where("passed", "==", true), limit(1))
                );

                if (!attemptSnapshot.empty) {
                    const attempt = attemptSnapshot.docs[0].data();
                    examHTML = `
                        <div class="assessment-card passed">
                            <div class="assessment-icon"><i class="fa-solid fa-circle-check"></i></div>
                            <div class="assessment-content">
                                <h4>${examData.title}</h4>
                                <p>Score: ${attempt.score}/${attempt.totalMarks} (${attempt.percentage}%)<br><strong style="color:#16a34a;">✅ Passed</strong></p>
                            </div>
                        </div>`;
                } else if (allLessonsCompleted) {
                    examHTML = `
                        <div class="assessment-card">
                            <div class="assessment-icon"><i class="fa-solid fa-file-circle-question"></i></div>
                            <div class="assessment-content">
                                <h4>${examData.title}</h4>
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

        return {
            order: module.order,
            totalLessons: lessonSnapshot.size,
            html: `
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
                </div>`
        };
    });

    // Resolve all module queries at once
    const processedModules = await Promise.all(modulePromises);

    // Render HTML sorted by module order
    let totalLessons = 0;
    processedModules.sort((a, b) => a.order - b.order).forEach(m => {
        totalLessons += m.totalLessons;
        moduleList.innerHTML += m.html;
    });

    // Update UI counters
    moduleCount.textContent = totalModules;
    lessonCountCard.textContent = totalLessons;
    lessonCount.textContent = totalLessons;

    const completedLessonCount = lessonProgressSnapshot.docs.filter(
        doc => doc.data().courseId === courseId && doc.data().completed === true
    ).length;

    const percentage = totalLessons > 0 ? Math.round((completedLessonCount / totalLessons) * 100) : 0;
    progressText.textContent = `${percentage}%`;
    overallProgress.textContent = `${percentage}%`;
    overallProgressBar.style.width = `${percentage}%`;

    document.getElementById("completedLessons").textContent = completedLessonCount;
    document.getElementById("lessonCountProgress").textContent = totalLessons;

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

async function loadFinalExam(){

    finalExamContainer.innerHTML = "";

    const finalExamSnapshot = await getDocs(

        query(
            collection(db, "exams"),
            where("courseId", "==", courseId),
            where("type", "==", "final"),
            limit(1)
        )

    );

    if(finalExamSnapshot.empty){

        return;

    }

    const finalExamDoc =
        finalExamSnapshot.docs[0];

    const finalExam =
        finalExamDoc.data();


    /* ==========================================================
       CHECK ALL MODULE EXAMS
       ========================================================== */

    const moduleSnapshot = await getDocs(

        query(
            collection(db, "modules"),
            where("courseId", "==", courseId)
        )

    );

    const moduleExamPromises =
        moduleSnapshot.docs.map(async moduleDoc => {

            const examSnapshot = await getDocs(

                query(
                    collection(db, "exams"),
                    where("courseId", "==", courseId),
                    where("moduleId", "==", moduleDoc.id),
                    where("type", "==", "module"),
                    limit(1)
                )

            );

            if(examSnapshot.empty){

                return false;

            }

            const examDoc =
                examSnapshot.docs[0];

            const attemptSnapshot =
                await getDocs(

                    query(
                        collection(db, "examAttempts"),
                        where(
                            "studentId",
                            "==",
                            auth.currentUser.uid
                        ),
                        where(
                            "examId",
                            "==",
                            examDoc.id
                        ),
                        where(
                            "passed",
                            "==",
                            true
                        ),
                        limit(1)
                    )

                );

            return !attemptSnapshot.empty;

        });


    const moduleExamResults =
        await Promise.all(moduleExamPromises);


    const modulesCompleted =
        moduleExamResults.length === moduleSnapshot.size &&
        moduleExamResults.every(
            passed => passed === true
        );


    /* ==========================================================
       FINAL EXAM ATTEMPT
       ========================================================== */

    const attemptSnapshot = await getDocs(

        query(
            collection(db, "examAttempts"),
            where(
                "studentId",
                "==",
                auth.currentUser.uid
            ),
            where(
                "examId",
                "==",
                finalExamDoc.id
            ),
            where(
                "passed",
                "==",
                true
            ),
            limit(1)
        )

    );


    /* ==========================================================
       FINAL EXAM ALREADY PASSED
       ========================================================== */

    if(!attemptSnapshot.empty){

        const attempt =
            attemptSnapshot.docs[0].data();

        finalExamContainer.innerHTML = `

            <div class="assessment-card passed">

                <div class="assessment-icon">

                    <i class="fa-solid fa-graduation-cap"></i>

                </div>

                <div class="assessment-content">

                    <h4>
                        ${finalExam.title}
                    </h4>

                    <p>

                        Score:
                        ${attempt.score}/${attempt.totalMarks}

                        (${attempt.percentage}%)

                        <br>

                        <strong style="color:#16a34a;">

                            ✅ Final Exam Passed

                        </strong>

                    </p>

                </div>

            </div>

        `;

        return;

    }


    /* ==========================================================
       ALL MODULE EXAMS PASSED
       ========================================================== */

    if(modulesCompleted){

        finalExamContainer.innerHTML = `

            <div class="assessment-card">

                <div class="assessment-icon">

                    <i class="fa-solid fa-graduation-cap"></i>

                </div>

                <div class="assessment-content">

                    <h4>
                        ${finalExam.title}
                    </h4>

                    <p>

                        Complete the Final Exam to complete
                        your course.

                    </p>

                </div>

                <a
                    href="start-assessment.html?id=${finalExamDoc.id}&courseId=${courseId}"
                    class="assessment-btn"
                >

                    Start Final Exam

                </a>

            </div>

        `;

    }

    else{

        /* ======================================================
           MODULE EXAMS NOT ALL PASSED
           ====================================================== */

        finalExamContainer.innerHTML = `

            <div class="assessment-card locked">

                <div class="assessment-icon">

                    <i class="fa-solid fa-lock"></i>

                </div>

                <div class="assessment-content">

                    <h4>

                        Final Certification Exam

                    </h4>

                    <p>

                        Complete all Module Exams to unlock
                        the Final Exam.

                    </p>

                </div>

                <div class="assessment-btn disabled">

                    Locked

                </div>

            </div>

        `;

    }

}

/* ==========================================================================
   LOGOUT
   ========================================================================== */

logoutBtn.addEventListener(

    "click",

    async event=>{

        event.preventDefault();

        await signOut(auth);

        location.href="login.html";

    }

);

/* ==========================================================================
   LOADER
   ========================================================================== */

function showLoader(){

    loader.classList.remove(

        "hidden"

    );

}

function hideLoader(){

    loader.classList.add(

        "hidden"

    );

}

/* ==========================================================================
   TOAST
   ========================================================================== */

function showToast(

    message,

    type="success"

){

    const toast =

        document.createElement(

            "div"

        );

    toast.className =

        `toast ${type}`;

    toast.textContent =

        message;

    toastContainer.appendChild(

        toast

    );

    requestAnimationFrame(()=>{

        toast.classList.add(

            "show"

        );

    });

    setTimeout(()=>{

        toast.remove();

    },3000);

}

/* ==========================================================================
   END
   ========================================================================== */