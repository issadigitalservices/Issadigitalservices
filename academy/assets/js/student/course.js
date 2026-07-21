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

/* ==========================================================================
   URL
   ========================================================================== */

const params =
    new URLSearchParams(location.search);

const courseId =
    params.get("id");

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

        hideLoader();

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

await loadModules();

await loadCertificateStatus(studentId);
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

    let totalModules = 0;
    let totalLessons = 0;

    const moduleSnapshot = await getDocs(

        query(

            collection(db, "modules"),

            where("courseId", "==", courseId),

            orderBy("order")

        )

    );

    totalModules = moduleSnapshot.size;

    if (moduleSnapshot.empty) {

        moduleList.innerHTML = "<h3>No modules found.</h3>";

        moduleCount.textContent = "0";
        lessonCountCard.textContent = "0";

        return;

    }

    for (const moduleDoc of moduleSnapshot.docs) {

        const module = moduleDoc.data();

        const locked =

    module.order >

    unlockedOrder;

        const lessonSnapshot = await getDocs(

            query(

                collection(db, "lessons"),

                where("moduleId", "==", moduleDoc.id),

                orderBy("order")

            )

        );

        totalLessons += lessonSnapshot.size;

        let lessonsHTML = "";
        let quizHTML = "";

if (locked) {

    lessonSnapshot.forEach(docSnap => {

        const lesson = docSnap.data();

        lessonsHTML += `

<a href="#"

class="lesson-item locked">

<div class="lesson-info">

<i class="fa-solid fa-lock"></i>

<span>

${lesson.title}

</span>

</div>

<span class="lesson-lock">

Locked

</span>

</a>

`;

    });

    quizHTML = `

<div class="assessment-card locked">

<div class="assessment-icon">

<i class="fa-solid fa-lock"></i>

</div>

<div class="assessment-content">

<h4>

Module Assessment

</h4>

<p>

Complete the previous module assessment to unlock this module.

</p>

</div>

<div class="assessment-btn disabled">

Locked

</div>

</div>

`;

}
else{

        let lessonIndex = 1;

        const lessonProgressSnapshot = await getDocs(

    query(

        collection(db,"lessonProgress"),

        where("studentId","==",auth.currentUser.uid)

    )

);

const completedLessons = new Set();

lessonProgressSnapshot.forEach(doc=>{

    const progress = doc.data();

    if(progress.completed){

        completedLessons.add(progress.lessonId);

    }

});

lessonSnapshot.forEach(docSnap => {

    const lesson = docSnap.data();

    const lessonLocked =

lessonIndex === 1

?

false

:

!completedLessons.has(

lessonSnapshot.docs[lessonIndex-2].id

);

    lessonsHTML += `

<a

href="${lessonLocked ? "#" : `lesson.html?id=${docSnap.id}`}"

class="lesson-item ${lessonLocked ? "locked" : ""}">

<div class="lesson-info">

<i class="fa-solid ${lessonLocked ? "fa-lock" : "fa-circle-play"}"></i>

<span>

${lesson.title}

</span>

</div>

${lessonLocked ?

'<span class="lesson-lock">Locked</span>'

:

'<i class="fa-solid fa-chevron-right"></i>'

}

</a>

`;

    lessonIndex++;

});

/* ================= Assessment ================= */

const allLessonsCompleted =

    lessonSnapshot.docs.every(doc =>

        completedLessons.has(doc.id)

    );

const quizSnapshot = await getDocs(

    query(

        collection(db,"quizzes"),

        where("courseId","==",courseId),

        where("moduleId","==",moduleDoc.id),

        limit(1)

    )

);

if (!quizSnapshot.empty) {

    const quiz = quizSnapshot.docs[0];
    const quizData = quiz.data();

    const attemptSnapshot = await getDocs(

        query(

            collection(db, "quizAttempts"),

            where("studentId", "==", auth.currentUser.uid),

            where("quizId", "==", quiz.id),

            where("passed", "==", true),

            limit(1)

        )

    );

    if (!attemptSnapshot.empty) {

        const attempt = attemptSnapshot.docs[0].data();

        quizHTML = `

<div class="assessment-card passed">

    <div class="assessment-icon">

        <i class="fa-solid fa-circle-check"></i>

    </div>

    <div class="assessment-content">

        <h4>${quizData.title}</h4>

        <p>

            Score: ${attempt.score}/${attempt.totalMarks}
            (${attempt.percentage}%)

            <br>

            <strong style="color:#16a34a;">
                ✅ Passed
            </strong>

        </p>

    </div>

</div>

`;

    }

    else if (allLessonsCompleted) {

        quizHTML = `

<div class="assessment-card">

    <div class="assessment-icon">

        <i class="fa-solid fa-file-circle-question"></i>

    </div>

    <div class="assessment-content">

        <h4>${quizData.title}</h4>

        <p>

            Complete this assessment to unlock the next module.

        </p>

    </div>

    <a
        href="start-assessment.html?id=${quiz.id}&courseId=${courseId}"
        class="assessment-btn">

        Start Assessment

    </a>

</div>

`;

    }

    else {

        quizHTML = `

<div class="assessment-card locked">

    <div class="assessment-icon">

        <i class="fa-solid fa-lock"></i>

    </div>

    <div class="assessment-content">

        <h4>Module Assessment</h4>

        <p>

            Complete all lessons to unlock this assessment.

        </p>

    </div>

    <div class="assessment-btn disabled">

        Locked

    </div>

</div>

`;

    }

}

/* ================= Render Module ================= */

moduleList.innerHTML += `

<div class="module-card">

<div class="module-header">

<div class="module-title">

${module.order}. ${module.title}

${locked
    ? '<span class="module-lock"><i class="fa-solid fa-lock"></i> Locked</span>'
    : ""}

</div>

<i class="fa-solid fa-chevron-down"></i>

</div>

<div class="lesson-list show">

${lessonsHTML}

${quizHTML}

</div>

</div>

`;

}
    }

    moduleCount.textContent = totalModules;

lessonCountCard.textContent = totalLessons;

/* ================= Banner Lesson Count ================= */

lessonCount.textContent = totalLessons;

/* ================= Progress Text ================= */

const enrollmentSnapshot = await getDocs(

    query(

        collection(db,"lessonProgress"),

        where("studentId","==",auth.currentUser.uid),

        where("courseId","==",courseId)

    )

);

const completedLessons = enrollmentSnapshot.docs.filter(

    doc => doc.data().completed === true

).length;

const percentage =
Math.round((completedLessons / totalLessons) * 100);

progressText.textContent =
`${percentage}%`;

overallProgress.textContent =
`${percentage}%`;

overallProgressBar.style.width =
`${percentage}%`;

document.getElementById("completedLessons").textContent =
completedLessons;

document.getElementById("lessonCountProgress").textContent =
totalLessons;

    document

        .querySelectorAll(".module-header")

        .forEach(header => {

            header.addEventListener("click", () => {

                header.nextElementSibling.classList.toggle("show");

            });

        });

        /* ================= Final Exam ================= */

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

    const finalQuizSnapshot = await getDocs(

        query(

            collection(db,"quizzes"),

            where("courseId","==",courseId),

            where("type","==","final"),

            limit(1)

        )

    );

    if(finalQuizSnapshot.empty){

        return;

    }

    const finalQuizDoc = finalQuizSnapshot.docs[0];

    const finalQuiz = finalQuizDoc.data();

    const moduleProgressSnapshot = await getDocs(

        query(

            collection(db,"moduleProgress"),

            where("studentId","==",auth.currentUser.uid),

            where("courseId","==",courseId)

        )

    );

    const moduleSnapshot = await getDocs(

        query(

            collection(db,"modules"),

            where("courseId","==",courseId)

        )

    );

    const unlocked =

        moduleProgressSnapshot.size >= moduleSnapshot.size;

    const attemptSnapshot = await getDocs(

        query(

            collection(db,"quizAttempts"),

            where("studentId","==",auth.currentUser.uid),

            where("quizId","==",finalQuizDoc.id),

            where("passed","==",true),

            limit(1)

        )

    );

    if(!attemptSnapshot.empty){

        const attempt = attemptSnapshot.docs[0].data();

        finalExamContainer.innerHTML = `

<div class="assessment-card passed">

    <div class="assessment-icon">

        <i class="fa-solid fa-graduation-cap"></i>

    </div>

    <div class="assessment-content">

        <h4>

            ${finalQuiz.title}

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

    if(unlocked){

        finalExamContainer.innerHTML = `

<div class="assessment-card">

    <div class="assessment-icon">

        <i class="fa-solid fa-graduation-cap"></i>

    </div>

    <div class="assessment-content">

        <h4>

            ${finalQuiz.title}

        </h4>

        <p>

            Complete the Final Exam to unlock your certificate.

        </p>

    </div>

    <a

        href="start-assessment.html?id=${finalQuizDoc.id}&courseId=${courseId}"

        class="assessment-btn">

        Start Final Exam

    </a>

</div>

`;

    }

    else{

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

            Complete all module assessments to unlock the Final Exam.

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