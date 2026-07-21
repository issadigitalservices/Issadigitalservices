"use strict";

/* ==========================================================================
   ISSA Academy
   Edit Course
   ========================================================================== */

import {

    db,
    storage

} from "../core/firebase-config.js";

import {

    requireAdmin

} from "../core/auth-guard.js";

import {

    doc,
    getDoc,
    updateDoc,
    serverTimestamp

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {

    ref,
    uploadBytes,
    getDownloadURL

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

/* ==========================================================================
   AUTH
   ========================================================================== */

await requireAdmin();

/* ==========================================================================
   DOM
   ========================================================================== */

const form =
    document.getElementById("courseForm");

const title =
    document.getElementById("title");

const category =
    document.getElementById("category");

const price =
    document.getElementById("price");

const duration =
    document.getElementById("duration");

const level =
    document.getElementById("level");

const status =
    document.getElementById("status");

const description =
    document.getElementById("description");

const thumbnail =
    document.getElementById("thumbnail");

const loader =
    document.getElementById("pageLoader");

const toast =
    document.getElementById("toastContainer");

/* ==========================================================================
   URL
   ========================================================================== */

const params =
    new URLSearchParams(location.search);

const courseId =
    params.get("id");

let thumbnailUrl = "";

/* ==========================================================================
   INIT
   ========================================================================== */

init();

async function init(){

    if(!courseId){

        showToast(

            "Course not found.",

            "error"

        );

        setTimeout(()=>{

            location.href="courses.html";

        },1500);

        return;

    }

    await loadCourse();

}

/* ==========================================================================
   LOAD COURSE
   ========================================================================== */

async function loadCourse(){

    showLoader();

    try{

        const docRef =
            doc(

                db,

                "courses",

                courseId

            );

        const docSnap =
            await getDoc(docRef);

        if(!docSnap.exists()){

            showToast(

                "Course not found.",

                "error"

            );

            return;

        }

        const course =
            docSnap.data();

        title.value =
            course.title || "";

        category.value =
            course.category || "";

        price.value =
            course.price || "";

        duration.value =
            course.duration || "";

        level.value =
            course.level || "Beginner";

        status.value =
            course.status || "draft";

        description.value =
            course.description || "";

        thumbnailUrl =
            course.thumbnail || "";

    }

    catch(error){

        console.error(error);

        showToast(

            error.message,

            "error"

        );

    }

    hideLoader();

}

/* ==========================================================================
   UPDATE
   ========================================================================== */

form.addEventListener(

    "submit",

    async event=>{

        event.preventDefault();

        showLoader();

        try{

            if(

                thumbnail.files.length

            ){

                const file =
                    thumbnail.files[0];

                const storageRef =
                    ref(

                        storage,

                        `courses/${Date.now()}-${file.name}`

                    );

                await uploadBytes(

                    storageRef,

                    file

                );

                thumbnailUrl =
                    await getDownloadURL(

                        storageRef

                    );

            }

            await updateDoc(

                doc(

                    db,

                    "courses",

                    courseId

                ),

                {

                    title:title.value.trim(),

                    category:category.value.trim(),

                    price:Number(price.value),

                    duration:duration.value.trim(),

                    level:level.value,

                    status:status.value,

                    description:description.value.trim(),

                    thumbnail:thumbnailUrl,

                    updatedAt:serverTimestamp()

                }

            );

            showToast(

                "Course updated successfully."

            );

            setTimeout(()=>{

                location.href="courses.html";

            },1200);

        }

        catch(error){

            console.error(error);

            showToast(

                error.message,

                "error"

            );

        }

        hideLoader();

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

    const item =
        document.createElement(

            "div"

        );

    item.className =
        `toast ${type}`;

    item.textContent =
        message;

    toast.appendChild(item);

    requestAnimationFrame(()=>{

        item.classList.add(

            "show"

        );

    });

    setTimeout(()=>{

        item.remove();

    },3000);

}

/* ==========================================================================
   END
   ========================================================================== */