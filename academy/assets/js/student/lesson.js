"use strict";

/* ==========================================================================
   ISSA Academy
   Student Lesson
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
    updateDoc,
    addDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* ==========================================================================
   DOM
   ========================================================================== */

const lessonTitle =
    document.getElementById("lessonTitle");

const headerModuleTitle =
    document.getElementById("moduleTitle");

const lessonVideo =
    document.getElementById("lessonVideo");

const lessonDescription =
    document.getElementById("lessonDescription");

const downloadBtn =
    document.getElementById("downloadBtn");

const previousLesson =
    document.getElementById("previousLesson");

const nextLesson =
    document.getElementById("nextLesson");

const logoutBtn =
    document.getElementById("logoutBtn");

const loader =
    document.getElementById("pageLoader");

const toastContainer =
    document.getElementById("toastContainer");

    const progressPercent =
    document.getElementById("progressPercent");

const progressBar =
    document.getElementById("progressBar");

const lessonNumber =
    document.getElementById("lessonNumber");

const lessonStatus =
    document.getElementById("lessonStatus");

    const lessonStatusText =
    document.getElementById("lessonStatusText");


/* ==========================================================================
   URL
   ========================================================================== */

const params =
    new URLSearchParams(location.search);

const lessonId =
    params.get("id");

/* ==========================================================================
   GLOBALS
   ========================================================================== */

let studentId = null;

let lessonData = null;

let enrollmentId = null;

let enrollmentData = null;

let lessons = [];

let currentIndex = -1;

let isCompleted = false;

let watchMarked = false;

let lastSavedTime = 0;

let player = null;

/* ==========================================================================
   AUTH
   ========================================================================== */

onAuthStateChanged(

    auth,

    async user=>{

        if(!user){

            location.replace("login.html");

            return;

        }

        studentId = user.uid;

        showLoader();

        await loadLesson();

        hideLoader();

    }

);

/* ==========================================================================
   LOAD LESSON
   ========================================================================== */

async function loadLesson(){

    const lessonSnap =

        await getDoc(

            doc(

                db,

                "lessons",

                lessonId

            )

        );

    if(!lessonSnap.exists()){

        showToast(

            "Lesson not found",

            "error"

        );

        return;

    }

    lessonData =

    lessonSnap.data();

const lesson =

    lessonData;

    lessonTitle.textContent =
        lesson.title;

    lessonDescription.textContent =
        lesson.description || "";

   /* ================= VIDEO ================= */

if (lesson.videoUrl) {

    lessonVideo.src = lesson.videoUrl;

    if(!player){

    player = new Plyr(lessonVideo,{

        controls:[

            "play-large",
            "play",
            "progress",
            "current-time",
            "duration",
            "mute",
            "volume",
            "settings",
            "fullscreen"

        ],

        settings:[

            "speed"

        ],

        speed:{

            selected:1,

            options:[

                0.5,
                0.75,
                1,
                1.25,
                1.5,
                2

            ]

        }

    });

}

    lessonVideo.addEventListener(

        "loadedmetadata",

        ()=>{

            const durationElement =

                document.getElementById("lessonDuration");

            if(!durationElement){

                return;

            }

            const totalSeconds =

                Math.floor(

                    lessonVideo.duration

                );

            const minutes =

                Math.floor(

                    totalSeconds / 60

                );

            const seconds =

                totalSeconds % 60;

            durationElement.textContent =

                `${minutes}:${seconds.toString().padStart(2,"0")}`;

        }

    );

} else {

    lessonVideo.removeAttribute("src");

}

    if(lesson.attachmentUrl){

        downloadBtn.href =
            lesson.attachmentUrl;

    }

    else{

        downloadBtn.style.display="none";

    }

    

lessonVideo.addEventListener("contextmenu", event => {
    event.preventDefault();
});

/* ================= MODULE ================= */

const moduleSnap =

    await getDoc(

        doc(

            db,

            "modules",

            lesson.moduleId

        )

    );

if(moduleSnap.exists()){

    headerModuleTitle.textContent =
    moduleSnap.data().title;

}

/* ================= VIDEO EVENTS ================= */

lessonVideo.addEventListener("timeupdate", async () => {

    if (!lessonVideo.duration) return;

    const percent =
        (lessonVideo.currentTime / lessonVideo.duration) * 100;

    if (
        percent >= 90 &&
        !watchMarked &&
        !isCompleted
    ) {

        watchMarked = true;

        await completeLesson();

    }

});

    /* ================= Lesson List ================= */

    const snapshot =

        await getDocs(

            query(

                collection(

                    db,

                    "lessons"

                ),

                where(

                    "moduleId",

                    "==",

                    lesson.moduleId

                ),

                orderBy(

                    "order"

                )

            )

        );

    lessons=[];

    snapshot.forEach(docSnap=>{

        lessons.push({

            id:docSnap.id,

            ...docSnap.data()

        });

    });

    currentIndex =

        lessons.findIndex(

            item=>item.id===lessonId

        );

        lessonNumber.textContent =
    `${currentIndex + 1} of ${lessons.length}`;

    if(currentIndex === 0){

    previousLesson.disabled = true;

}

/* ==========================================================
   LAST LESSON
========================================================== */

if(currentIndex === lessons.length - 1){

    const quizSnapshot = await getDocs(

        query(

            collection(db,"quizzes"),

            where("moduleId","==",lesson.moduleId),

            limit(1)

        )

    );

    nextLesson.innerHTML = `

        <div>

            <small>

                Next Step

            </small>

            <strong>

                Take Module Assessment

            </strong>

        </div>

        <i class="fa-solid fa-file-circle-check"></i>

    `;

    nextLesson.onclick = ()=>{

        if(quizSnapshot.empty){

            showToast("Module assessment not found.","error");

            return;

        }

        const quizId = quizSnapshot.docs[0].id;

        location.href =
`start-assessment.html?id=${quizId}&courseId=${lesson.courseId}`;

    };

}
else{

    nextLesson.innerHTML = `

        <div>

            <small>

                Next Lesson

            </small>

            <strong>

                Continue

            </strong>

        </div>

        <i class="fa-solid fa-arrow-right"></i>

    `;

    nextLesson.onclick = ()=>{

        location.href = `lesson.html?id=${lessons[currentIndex + 1].id}`;

    };

}

    /* ================= Enrollment ================= */

    const enrollment =

    await getDocs(

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

                lesson.courseId

            )

        )

    );

   if(!enrollment.empty){

    enrollmentId =

        enrollment.docs[0].id;

    enrollmentData =

        enrollment.docs[0].data();

    const progress =

        enrollmentData.progress || 0;

    progressPercent.textContent =

        `${progress}%`;

    progressBar.style.width =

        `${progress}%`;

}

/* ================= CHECK LESSON ================= */

const completedSnapshot =

    await getDocs(

        query(

            collection(

                db,

                "lessonProgress"

            ),

            where(

                "studentId",

                "==",

                studentId

            ),

            where(

                "lessonId",

                "==",

                lessonId

            )

        )

    );

if(!completedSnapshot.empty){

    isCompleted = true;

    lessonStatus.innerHTML = `

    <i class="fa-solid fa-circle-check"></i>

    <div>

        <small>

            Lesson Status

        </small>

        <strong>

            Completed

        </strong>

    </div>

`;

    lessonStatus.classList.remove(

        "status-warning"

    );

    lessonStatus.classList.add(

        "status-success"

    );

    lessonStatusText.textContent =

        "Completed";

    nextLesson.disabled = false;

    if(currentIndex < lessons.length - 1){

        nextLesson.innerHTML = `

            <div>

                <small>

                    Next Lesson

                </small>

                <strong>

                    Continue

                </strong>

            </div>

            <i class="fa-solid fa-arrow-right"></i>

        `;

    }

    else{

    nextLesson.innerHTML = `

        <div>

            <small>

                Next Step

            </small>

            <strong>

                Take Module Assessment

            </strong>

        </div>

        <i class="fa-solid fa-file-circle-check"></i>

    `;

}

}

}
/* ==========================================================================
   PREVIOUS
   ========================================================================== */

previousLesson.addEventListener(

    "click",

    ()=>{

        if(currentIndex <= 0){

            showToast(

                "This is the first lesson.",

                "warning"

            );

            return;

        }

        location.href =

            `lesson.html?id=${lessons[currentIndex - 1].id}`;

    }

);

/* ==========================================================================
   NEXT
   ========================================================================== */

nextLesson.addEventListener(

    "click",

    async () => {

        // Last lesson
        if (currentIndex === lessons.length - 1) {

            if (!isCompleted) {

                showToast(
                    "Please watch at least 90% of this lesson to finish the module.",
                    "warning"
                );

                return;
            }

            // TODO:
            // Later we will check Assessment result here.
            // If passed -> Unlock Module 2
            // If failed -> Stay here.

            showToast(
                "Module completed successfully!",
                "success"
            );

            // Temporary
            const quizSnapshot = await getDocs(

    query(

        collection(db,"quizzes"),

        where("moduleId","==",lesson.moduleId),

        limit(1)

    )

);

if(quizSnapshot.empty){

    showToast("Module assessment not found.","error");

    return;

}

location.href =
`start-assessment.html?id=${quizSnapshot.docs[0].id}&courseId=${lesson.courseId}`;

            return;

        }

        // Normal Next Lesson

        location.href =
            `lesson.html?id=${lessons[currentIndex + 1].id}`;

    }

);

/* ==========================================================================
   COMPLETE
   ========================================================================== */

async function completeLesson(){

    if(!enrollmentId || isCompleted){
        return;
    }

    try{

        await addDoc(

            collection(
                db,
                "lessonProgress"
            ),

            {

                studentId:
                    studentId,

                courseId:
                    lessonData.courseId,

                moduleId:
                    lessonData.moduleId,

                lessonId:
                    lessonId,

                completed:
                    true,

                completedAt:
                    serverTimestamp()

            }

        );

        isCompleted = true;
        lessonStatusText.textContent = "Completed";

        const totalLessons =

            await getDocs(

                query(

                    collection(
                        db,
                        "lessons"
                    ),

                    where(
                        "courseId",
                        "==",
                        lessonData.courseId
                    )

                )

            );

        const completedLessons =

            await getDocs(

                query(

                    collection(
                        db,
                        "lessonProgress"
                    ),

                    where(
                        "studentId",
                        "==",
                        studentId
                    ),

                    where(
                        "courseId",
                        "==",
                        lessonData.courseId
                    )

                )

            );

        const progress = Math.round(

            (

                completedLessons.size /

                totalLessons.size

            ) * 100

        );

        await updateDoc(
    doc(
        db,
        "enrollments",
        enrollmentId
    ),
    {
        progress: progress
    }
);

console.log("Progress =", progress);

        progressPercent.textContent =
            `${progress}%`;

        progressBar.style.width =
            `${progress}%`;

        lessonStatus.innerHTML = `

    <i class="fa-solid fa-circle-check"></i>

    <div>

        <small>

            Lesson Status

        </small>

        <strong>

            Completed

        </strong>

    </div>

`;

lessonStatus.classList.remove(

    "status-warning"

);

lessonStatus.classList.add(

    "status-success"

);

lessonStatusText.textContent =

    "Completed";

/* ================= NEXT BUTTON ================= */

nextLesson.disabled = false;

if(currentIndex < lessons.length - 1){

    nextLesson.innerHTML = `

        <div>

            <small>

                Next Lesson

            </small>

            <strong>

                Continue

            </strong>

        </div>

        <i class="fa-solid fa-arrow-right"></i>

    `;

}

else{

    nextLesson.innerHTML = `

        <div>

            <small>

                Next Step

            </small>

            <strong>

                Take Module Assessment

            </strong>

        </div>

        <i class="fa-solid fa-file-circle-check"></i>

    `;

}

        showToast(
            "Lesson automatically marked as completed."
        );

    }

    catch(error){

        console.error(error);


        showToast(
            "Unable to complete lesson.",
            "error"
        );

    }

}

/* ==========================================================================
   GENERATE CERTIFICATE
   ========================================================================== */


   async function generateCertificate() {
    console.log("generateCertificate() called");

    const existing = await getDocs(

        query(

            collection(db, "certificates"),

            where("studentId", "==", studentId),

            where("courseId", "==", lessonData.courseId)

        )

    );

    if (!existing.empty) {

    location.href =
        "certificate-view.html?courseId=" + lessonData.courseId;

    return;

}

    const certificateNumber =
        "ISSA-" +
        new Date().getFullYear() +
        "-" +
        Date.now();

    await addDoc(

        collection(db, "certificates"),

        {

            studentId: studentId,

            studentName: enrollmentData.studentName,

            studentEmail: enrollmentData.studentEmail,

            courseId: lessonData.courseId,

            courseName: enrollmentData.courseName,

            certificateNumber: certificateNumber,

            fileUrl: "",

            issuedAt: serverTimestamp()

        }

    );

    showToast(

        "🎉 Congratulations! Certificate unlocked."

    );
    setTimeout(() => {

    location.href =
        "certificate-view.html?courseId=" + lessonData.courseId;

}, 1500);

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

    loader.classList.remove("hidden");

}

function hideLoader(){

    loader.classList.add("hidden");

}

/* ==========================================================================
   TOAST
   ========================================================================== */

function showToast(

    message,

    type="success"

){

    const toast =

        document.createElement("div");

    toast.className=

        `toast ${type}`;

    toast.textContent=

        message;

    toastContainer.appendChild(toast);

    requestAnimationFrame(()=>{

        toast.classList.add("show");

    });

    setTimeout(()=>{

        toast.remove();

    },3000);

}

/* ==========================================================================
   END
   ========================================================================== */