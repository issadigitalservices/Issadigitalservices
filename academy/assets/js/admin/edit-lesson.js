"use strict";

/* ==========================================================================
   ISSA Academy
   Edit Lesson Controller
   Version : 2.0.0
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

    getDoc,

    query,

    where,

    doc,

    updateDoc,

    serverTimestamp

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const db = getFirestore();

/* ==========================================================================
   URL
   ========================================================================== */

const params =
    new URLSearchParams(location.search);

const lessonId =
    params.get("id");

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

const lessonDuration =
    document.getElementById("lessonDuration");

const lessonOrder =
    document.getElementById("lessonOrder");

const lessonStatus =
    document.getElementById("lessonStatus");

const attachmentUrl =
    document.getElementById("attachmentUrl");

const preview =
    document.getElementById("preview");

const videoFile =
    document.getElementById("videoFile");

const videoUrl =
    document.getElementById("videoUrl");

const currentVideo =
    document.getElementById("currentVideo");

const uploadProgress =
    document.getElementById("uploadProgress");

const uploadPercent =
    document.getElementById("uploadPercent");

const pageLoader =
    document.getElementById("pageLoader");

const toastContainer =
    document.getElementById("toastContainer");

/* ==========================================================================
   GLOBALS
   ========================================================================== */

let existingVideoUrl = "";

/* ==========================================================================
   LOADER
   ========================================================================== */

function showLoader(){

    pageLoader.classList.remove("hidden");

}

function hideLoader(){

    pageLoader.classList.add("hidden");

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

    toast.className =
        `toast ${type}`;

    toast.textContent =
        message;

    toastContainer.appendChild(
        toast
    );

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

        if(!lessonId){

            location.href =
                "lessons.html";

            return;

        }

        showLoader();

        await loadCourses();

        await loadLesson();

        hideLoader();

    }

);

/* ==========================================================================
   LOAD COURSES
   ========================================================================== */

async function loadCourses(){

    const snapshot = await getDocs(
        collection(db,"courses")
    );

    courseId.innerHTML =
        `<option value="">Select Course</option>`;

    snapshot.forEach(docSnap=>{

        const course = docSnap.data();

        const option =
            document.createElement("option");

        option.value =
            docSnap.id;

        option.textContent =
            course.title;

        option.dataset.title =
            course.title;

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

async function loadModules(){

    moduleId.innerHTML =
        `<option value="">Select Module</option>`;

    if(!courseId.value){
        return;
    }

    const snapshot = await getDocs(

        query(

            collection(db,"modules"),

            where(
                "courseId",
                "==",
                courseId.value
            )

        )

    );

    snapshot.forEach(docSnap=>{

        const module =
            docSnap.data();

        const option =
            document.createElement("option");

        option.value =
            docSnap.id;

        option.textContent =
            module.title;

        option.dataset.title =
            module.title;

        moduleId.appendChild(option);

    });

}

/* ==========================================================================
   LOAD LESSON
   ========================================================================== */

async function loadLesson(){

    const lessonRef = doc(
        db,
        "lessons",
        lessonId
    );

    const lessonSnap =
        await getDoc(lessonRef);

    if(!lessonSnap.exists()){

        showToast(
            "Lesson not found.",
            "error"
        );

        location.href =
            "lessons.html";

        return;

    }

    const lesson =
        lessonSnap.data();

    courseId.value =
        lesson.courseId;

    await loadModules();

    moduleId.value =
        lesson.moduleId;

    lessonTitle.value =
        lesson.title || "";

    lessonDescription.value =
        lesson.description || "";

    lessonDuration.value =
        lesson.duration || "";

    lessonOrder.value =
        lesson.order || 1;

    lessonStatus.value =
        lesson.status || "published";

    attachmentUrl.value =
        lesson.attachmentUrl || "";

    preview.value =
        String(
            lesson.preview ?? false
        );

    existingVideoUrl =
        lesson.videoUrl || "";

    videoUrl.value =
        existingVideoUrl;

    if(existingVideoUrl){

        const fileName =
            existingVideoUrl.split("/").pop();

        currentVideo.textContent =
            fileName;

    }
    else{

        currentVideo.textContent =
            "No video uploaded.";

    }

}

/* ==========================================================================
   UPDATE LESSON
   ========================================================================== */

lessonForm.addEventListener(

    "submit",

    async event=>{

        event.preventDefault();

        try{

            showLoader();

            let uploadedUrl = existingVideoUrl;

            if(videoFile.files.length > 0){

                uploadedUrl = await uploadVideo(

                    videoFile.files[0],

                    percent=>{

                        uploadProgress.value = percent;

                        uploadPercent.textContent =
                            percent + "%";

                    }

                );

            }

            const selectedCourse =
                courseId.options[
                    courseId.selectedIndex
                ];

            const selectedModule =
                moduleId.options[
                    moduleId.selectedIndex
                ];

            await updateDoc(

                doc(
                    db,
                    "lessons",
                    lessonId
                ),

                {

                    courseId:
                        courseId.value,

                    courseTitle:
                        selectedCourse.dataset.title,

                    moduleId:
                        moduleId.value,

                    moduleTitle:
                        selectedModule.dataset.title,

                    title:
                        lessonTitle.value.trim(),

                    description:
                        lessonDescription.value.trim(),

                    duration:
                        lessonDuration.value.trim(),

                    order:
                        Number(
                            lessonOrder.value
                        ),

                    status:
                        lessonStatus.value,

                    videoUrl:
                        uploadedUrl,

                    attachmentUrl:
                        attachmentUrl.value.trim(),

                    preview:
                        preview.value === "true",

                    updatedAt:
                        serverTimestamp()

                }

            );

            hideLoader();

            showToast(
                "Lesson updated successfully."
            );

            setTimeout(()=>{

                location.href =
                    "lessons.html";

            },1000);

        }

        catch(error){

            console.error(error);

            hideLoader();

            showToast(
                "Failed to update lesson.",
                "error"
            );

        }

    }

);