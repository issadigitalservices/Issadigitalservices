"use strict";

/* ==========================================================================
   ISSA Academy
   Add Lesson Controller
   Version : 1.0.0
   ========================================================================== */

import { uploadVideo } from "../services/r2-upload.js";
   import { auth } from "../core/firebase-config.js";

import {

    onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {

    getFirestore,

    collection,

    getDocs,

    query,

    where,

    addDoc,

    serverTimestamp

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const db = getFirestore();

/* ==========================================================================
   DOM
   ========================================================================== */

const lessonForm =
    document.getElementById("lessonForm");

const courseId =
    document.getElementById("courseId");

const moduleId =
    document.getElementById("moduleId");

const lessonTitle =
    document.getElementById("lessonTitle");

const lessonDescription =
    document.getElementById("lessonDescription");

const videoUrl =
    document.getElementById("videoUrl");

    const videoFile =
    document.getElementById("videoFile");

const uploadProgress =
    document.getElementById("uploadProgress");

const uploadPercent =
    document.getElementById("uploadPercent");

const lessonOrder =
    document.getElementById("lessonOrder");

const toastContainer =
    document.getElementById("toastContainer");

/* ==========================================================================
   TOAST
   ========================================================================== */

function showToast(message){

    const toast=document.createElement("div");

    toast.className="toast";

    toast.textContent=message;

    toastContainer.appendChild(toast);

    requestAnimationFrame(()=>{

        toast.classList.add("show");

    });

    setTimeout(()=>{

        toast.remove();

    },3000);

}

/* ==========================================================================
   AUTH
   ========================================================================== */

onAuthStateChanged(

    auth,

    async user=>{

        if(!user){

            location.replace("../student/login.html");

            return;

        }

        await loadCourses();

    }

);

/* ==========================================================================
   LOAD COURSES
   ========================================================================== */

async function loadCourses(){

    const snapshot = await getDocs(
        collection(db, "courses")
    );

    snapshot.forEach(docSnap => {

        const course = docSnap.data();

        const option = window.document.createElement("option");

        option.value = docSnap.id;
        option.textContent = course.title;
        option.dataset.title = course.title;

        courseId.appendChild(option);

    });

}

/* ==========================================================================
   LOAD MODULES
   ========================================================================== */

courseId.addEventListener(

    "change",

    loadModules

);

moduleId.addEventListener(

    "change",

    async ()=>{

        await loadNextLessonOrder(

            moduleId.value

        );

    }

);

async function loadModules(){

    moduleId.innerHTML =
        `<option value="">Select Module</option>`;

    if(!courseId.value){
        return;
    }

    const snapshot = await getDocs(
        query(
            collection(db,"modules"),
            where("courseId","==",courseId.value)
        )
    );

    snapshot.forEach(docSnap => {

        const module = docSnap.data();

        const option = window.document.createElement("option");

        option.value = docSnap.id;
        option.textContent = module.title;
        option.dataset.title = module.title;

        moduleId.appendChild(option);

    });

}

/* ==========================================================================
   AUTO NEXT LESSON ORDER
   ========================================================================== */

async function loadNextLessonOrder(moduleIdValue){

    if(!moduleIdValue){

        lessonOrder.value = 1;

        return;

    }

    const snapshot = await getDocs(

        collection(db,"lessons")

    );

    let highestOrder = 0;

    snapshot.forEach(docSnap=>{

        const lesson = docSnap.data();

        if(

            lesson.moduleId === moduleIdValue &&

            Number(lesson.order) > highestOrder

        ){

            highestOrder = Number(lesson.order);

        }

    });

    lessonOrder.value = highestOrder + 1;

}

/* ==========================================================================
   SAVE LESSON
   ========================================================================== */

lessonForm.addEventListener(

    "submit",

    async event=>{

        event.preventDefault();

        if (

    !courseId.value ||

    !moduleId.value ||

    !lessonTitle.value.trim() ||

    videoFile.files.length === 0

){

            showToast("Please complete all required fields and select a video.");
            return;

        }

        const selectedCourse=

            courseId.options[

                courseId.selectedIndex

            ];

        const selectedModule=

            moduleId.options[

                moduleId.selectedIndex

            ];

        try {

    let uploadedUrl = videoUrl.value.trim();

    if (videoFile.files.length > 0) {

        uploadedUrl = await uploadVideo(

            videoFile.files[0],

            percent => {

                uploadProgress.value = percent;

                uploadPercent.textContent = percent + "%";

            }

        );

        videoUrl.value = uploadedUrl;

    }

    await addDoc(

        collection(db, "lessons"),

        {
            courseId: courseId.value,
            courseTitle: selectedCourse.dataset.title,
            moduleId: moduleId.value,
            moduleTitle: selectedModule.dataset.title,
            title: lessonTitle.value.trim(),
            description: lessonDescription.value.trim(),
            videoUrl: uploadedUrl,
            order: Number(lessonOrder.value),
            type: "Video",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }

    );

    showToast("Lesson created successfully.");

    setTimeout(() => {

        location.href = "lessons.html";

    }, 1000);

}

catch (error) {

    console.error(error);

    showToast("Failed to save lesson.");

}
    }

);

/* ==========================================================================
   END
   ========================================================================== */