"use strict";

/* ==========================================================================
   ISSA Academy
   Edit Course (Synchronized with Add Course fields)
   ========================================================================== */

import {
    db
} from "../core/firebase-config.js";

import {
    requireAdmin
} from "../core/auth-guard.js";

import {
    doc,
    getDoc,
    updateDoc,
    getDocs,
    collection,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { uploadFile } from "../services/r2-upload.js";

/* ==========================================================================
   AUTH
   ========================================================================== */

await requireAdmin();

/* ==========================================================================
   DOM ELEMENTS (Matched exactly to your Add Course form fields)
   ========================================================================== */

const form = document.getElementById("courseForm");
const courseTitle = document.getElementById("title") || document.getElementById("courseTitle");
const courseSlug = document.getElementById("courseSlug");
const courseCategory = document.getElementById("category") || document.getElementById("courseCategory");
const courseInstructor = document.getElementById("instructor") || document.getElementById("courseInstructor");
const courseLanguage = document.getElementById("language") || document.getElementById("courseLanguage");
const courseLevel = document.getElementById("level") || document.getElementById("courseLevel");
const courseDuration = document.getElementById("duration") || document.getElementById("courseDuration");
const coursePrice = document.getElementById("price") || document.getElementById("coursePrice");
const courseOfferPrice = document.getElementById("offerPrice") || document.getElementById("courseOfferPrice");
const courseCurrency = document.getElementById("currency") || document.getElementById("courseCurrency");
const courseThumbnail = document.getElementById("thumbnail") || document.getElementById("courseThumbnail");
const courseTrailer = document.getElementById("trailerVideo") || document.getElementById("courseTrailer");
const shortDescription = document.getElementById("shortDescription");
const fullDescription = document.getElementById("description") || document.getElementById("fullDescription");
const featuredCourse = document.getElementById("featured") || document.getElementById("featuredCourse");
const certificate = document.getElementById("certificate");
const courseStatus = document.getElementById("status");

const loader = document.getElementById("pageLoader");
const toastContainer = document.getElementById("toastContainer");

/* ==========================================================================
   URL
   ========================================================================== */

const params = new URLSearchParams(location.search);
const courseId = params.get("id");

let thumbnailUrl = "";

/* ==========================================================================
   INIT
   ========================================================================== */

init();

async function init(){
    if(!courseId){
        showToast("Course not found.", "error");
        setTimeout(()=>{
            location.href = "courses.html";
        }, 1500);
        return;
    }

    await loadCategories();
    await loadCourse();
}

/* ==========================================================================
   LOAD CATEGORIES (Populate dropdown first so selection matches)
   ========================================================================== */

async function loadCategories(){
    try {
        const snapshot = await getDocs(collection(db, "categories"));
        if(courseCategory){
            snapshot.forEach(document => {
                const data = document.data();
                // Avoid duplicate options if already present
                if(![...courseCategory.options].some(opt => opt.value === document.id)){
                    courseCategory.innerHTML += `
                        <option value="${document.id}">
                            ${data.title}
                        </option>
                    `;
                }
            });
        }
    } catch(e) {
        console.error("Error loading categories:", e);
    }
}

/* ==========================================================================
   LOAD COURSE DATA
   ========================================================================== */

async function loadCourse(){
    showLoader();

    try{
        const docRef = doc(db, "courses", courseId);
        const docSnap = await getDoc(docRef, { source: "server" }).catch(async () => {
            return await getDoc(docRef);
        });

        if(!docSnap.exists()){
            showToast("Course not found.", "error");
            return;
        }

        const course = docSnap.data();

        if(courseTitle) courseTitle.value = course.title || "";
        if(courseSlug) courseSlug.value = course.slug || courseId;
        if(courseCategory) courseCategory.value = course.categoryId || "";
        if(courseInstructor) courseInstructor.value = course.instructor || "";
        if(courseLanguage) courseLanguage.value = course.language || "";
        if(courseLevel) courseLevel.value = course.level || "Beginner";
        if(courseDuration) courseDuration.value = course.duration || "";
        if(coursePrice) coursePrice.value = course.price !== undefined ? course.price : "";
        if(courseOfferPrice) courseOfferPrice.value = course.offerPrice !== undefined ? course.offerPrice : "";
        if(courseCurrency) courseCurrency.value = course.currency || "INR";
        if(shortDescription) shortDescription.value = course.shortDescription || "";
        if(fullDescription) fullDescription.value = course.description || "";
        if(courseTrailer) courseTrailer.value = course.trailerVideo || "";
        if(courseStatus) courseStatus.value = course.status || "draft";
        
        if(featuredCourse) featuredCourse.checked = !!course.featured;
        if(certificate) certificate.checked = !!course.certificate;

        thumbnailUrl = course.thumbnail || "";

    } catch(error){
        console.error(error);
        showToast(error.message, "error");
    }

    hideLoader();
}

/* ==========================================================================
   UPDATE COURSE
   ========================================================================== */

form.addEventListener(
    "submit",
    async event=>{
        event.preventDefault();
        showLoader();

        try{
            if (courseThumbnail && courseThumbnail.files.length) {

    const file = courseThumbnail.files[0];

    const response = await uploadFile(
        file,
        "course-thumbnails",
        percent => {
            console.log(`Thumbnail upload: ${percent}%`);
        }
    );

    thumbnailUrl = response.url;
}

            await updateDoc(
                doc(db, "courses", courseId),
                {
                    title: courseTitle ? courseTitle.value.trim() : "",
                    slug: courseSlug ? courseSlug.value : courseId,
                    categoryId: courseCategory ? courseCategory.value : "",
                    instructor: courseInstructor ? courseInstructor.value.trim() : "",
                    language: courseLanguage ? courseLanguage.value : "",
                    level: courseLevel ? courseLevel.value : "",
                    duration: courseDuration ? courseDuration.value.trim() : "",
                    shortDescription: shortDescription ? shortDescription.value.trim() : "",
                    description: fullDescription ? fullDescription.value.trim() : "",
                    thumbnail: thumbnailUrl,
                    trailerVideo: courseTrailer ? courseTrailer.value.trim() : "",
                    price: coursePrice ? Number(coursePrice.value) || 0 : 0,
                    offerPrice: courseOfferPrice ? Number(courseOfferPrice.value) || 0 : 0,
                    currency: courseCurrency ? courseCurrency.value : "INR",
                    featured: featuredCourse ? featuredCourse.checked : false,
                    certificate: certificate ? certificate.checked : false,
                    status: courseStatus ? courseStatus.value : "draft",
                    updatedAt: serverTimestamp()
                }
            );

            showToast("Course updated successfully.");

            setTimeout(()=>{
                location.href = "courses.html";
            }, 1200);

        }
        catch(error){
            console.error(error);
            showToast(error.message, "error");
        }

        hideLoader();
    }
);

/* ==========================================================================
   LOADER
   ========================================================================== */

function showLoader(){
    if(loader) loader.classList.remove("hidden");
}

function hideLoader(){
    if(loader) loader.classList.add("hidden");
}

/* ==========================================================================
   TOAST
   ========================================================================== */

function showToast(message, type="success"){
    if(!toastContainer) {
        alert(message);
        return;
    }

    const item = document.createElement("div");
    item.className = `toast ${type}`;
    item.textContent = message;

    toastContainer.appendChild(item);

    requestAnimationFrame(()=>{
        item.classList.add("show");
    });

    setTimeout(()=>{
        item.remove();
    }, 3000);
}

/* ==========================================================================
   END
   ========================================================================== */