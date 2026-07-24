"use strict";

/* ==========================================================================
   ISSA Academy
   Add Course Controller
   Version : 2.0.0
   ========================================================================== */

import {

    auth,

    db,

    storage

} from "../core/firebase-config.js";

import {

    requireAdmin

} from "../core/auth-guard.js";

import {

    collection,

    doc,

    getDocs,

    serverTimestamp,

    setDoc

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {

    ref,

    uploadBytes,

    getDownloadURL

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

/* ==========================================================================
   DOM
   ========================================================================== */

const form=document.getElementById("courseForm");

const courseTitle=document.getElementById("courseTitle");

const courseSlug=document.getElementById("courseSlug");

const courseCategory=document.getElementById("courseCategory");

const courseInstructor=document.getElementById("courseInstructor");

const courseLanguage=document.getElementById("courseLanguage");

const courseLevel=document.getElementById("courseLevel");

const courseDuration=document.getElementById("courseDuration");

const coursePrice=document.getElementById("coursePrice");

const courseOfferPrice=document.getElementById("courseOfferPrice");

const courseCurrency=document.getElementById("courseCurrency");

const courseThumbnail=document.getElementById("courseThumbnail");

const courseTrailer=document.getElementById("courseTrailer");

const shortDescription=document.getElementById("shortDescription");

const fullDescription=document.getElementById("fullDescription");

const featuredCourse=document.getElementById("featuredCourse");

const certificate=document.getElementById("certificate");

const pageLoader=document.getElementById("pageLoader");

const toastContainer=document.getElementById("toastContainer");

/* ==========================================================================
   INIT
   ========================================================================== */

await requireAdmin();

loadCategories();

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

function showToast(message,type="success"){

    const toast=document.createElement("div");

    toast.className=`toast ${type}`;

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
   SLUG
   ========================================================================== */

courseTitle.addEventListener(

    "input",

    ()=>{

        courseSlug.value=

            courseTitle.value

            .trim()

            .toLowerCase()

            .replace(/[^\w\s-]/g,"")

            .replace(/\s+/g,"-");

    }

);

/* ==========================================================================
   LOAD CATEGORIES
   ========================================================================== */

async function loadCategories(){

    const snapshot=

        await getDocs(

            collection(

                db,

                "categories"

            )

        );

    snapshot.forEach(document=>{

        const data=document.data();

        courseCategory.innerHTML+=`

            <option value="${document.id}">

                ${data.title}

            </option>

        `;

    });

}

/* ==========================================================================
   SAVE COURSE
   ========================================================================== */

form.addEventListener(

    "submit",

    async event=>{

        event.preventDefault();

        try{

            showLoader();

            let thumbnail="";

            if(courseThumbnail.files.length){

                const file=

                    courseThumbnail.files[0];

                const storageRef=

                    ref(

                        storage,

                        `courses/${Date.now()}-${file.name}`

                    );

                await uploadBytes(

                    storageRef,

                    file

                );

                thumbnail=

                    await getDownloadURL(

                        storageRef

                    );

            }

            const courseId=

                courseSlug.value;

            await setDoc(

                doc(

                    db,

                    "courses",

                    courseId

                ),

                {

                    title:

                        courseTitle.value.trim(),

                    slug:

                        courseSlug.value,

                    categoryId:

                        courseCategory.value,

                    instructor:

                        courseInstructor.value.trim(),

                    language:

                        courseLanguage.value,

                    level:

                        courseLevel.value,

                    duration:

                        courseDuration.value,

                    shortDescription:

                        shortDescription.value.trim(),

                    description:

                        fullDescription.value.trim(),

                    thumbnail:

                        thumbnail,

                    trailerVideo:

                        courseTrailer.value.trim(),

                    price:

                        Number(coursePrice.value)||0,

                    offerPrice:

                        Number(courseOfferPrice.value)||0,

                    currency:

                        courseCurrency.value,

                    featured:

                        featuredCourse.checked,

                    certificate:

                        certificate.checked,

                    totalModules:0,

                    totalLessons:0,

                    totalStudents:0,

                    totalReviews:0,

                    rating:0,

                    createdBy:

                        auth.currentUser.uid,

                    createdAt:

                        serverTimestamp(),

                    updatedAt:

                        serverTimestamp()

                }

            );

            hideLoader();

            showToast(

                "Course created successfully."

            );

            setTimeout(()=>{

                location.href="courses.html";

            },1200);

        }

        catch(error){

            console.error(error);

            hideLoader();

            showToast(

                error.message,

                "error"

            );

        }

    }

);

/* ==========================================================================
   END
   ========================================================================== */