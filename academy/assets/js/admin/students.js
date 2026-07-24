"use strict";

/* ==========================================================================
   ISSA Academy
   Students Controller
   Version : 1.0.0
   ========================================================================== */

import { auth } from "../core/firebase-config.js";

import {

    onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {

    getFirestore,

    collection,

    getDocs,

    deleteDoc,

    doc

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const db = getFirestore();

/* ==========================================================================
   DOM
   ========================================================================== */

const tableBody =
    document.getElementById("studentsTableBody");

const searchInput =
    document.getElementById("searchInput");

const pageLoader =
    document.getElementById("pageLoader");

const toastContainer =
    document.getElementById("toastContainer");

/* ==========================================================================
   STATE
   ========================================================================== */

const state = {

    students: [],

    filteredStudents: []

};

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

        showLoader();

        await loadStudents();

        hideLoader();

    }

);

/* ==========================================================================
   LOAD STUDENTS
   ========================================================================== */

async function loadStudents(){

    // Fetch both students and enrollments concurrently from Firestore
    const [studentsSnapshot, enrollmentsSnapshot] = await Promise.all([
        getDocs(collection(db, "students")),
        getDocs(collection(db, "enrollments"))
    ]);

    // Build a lookup map of all enrollments
    const enrollmentsList = [];
    enrollmentsSnapshot.forEach(docSnap => {
        enrollmentsList.push(docSnap.data());
    });

    state.students=[];

    studentsSnapshot.forEach(document=>{
        const studentData = document.data();
        const studentId = document.id;

        // Find all enrollments matching this student's ID, UID, or email
        const studentEnrollments = enrollmentsList.filter(
            e => e.studentId === studentId || 
                 e.studentId === studentData.uid || 
                 e.email === studentData.email
        );

        const courseCount = studentEnrollments.length;

        // Calculate average progress percentage across their enrolled courses
        let avgProgress = 0;
        if (courseCount > 0) {
            const totalProgressSum = studentEnrollments.reduce((sum, e) => sum + Number(e.progress || 0), 0);
            avgProgress = Math.round(totalProgressSum / courseCount);
        }

        state.students.push({
            id: studentId,
            ...studentData,
            // Fallback map for phone/mobile fields
            phone: studentData.phone || studentData.mobile || studentData.phoneNumber || "-",
            // Use calculated course count, falling back to 0
            totalCourses: courseCount > 0 ? courseCount : (studentData.totalCourses || 0),
            progress: avgProgress
        });
    });

    state.filteredStudents=[

        ...state.students

    ];

    renderStudents();

}

/* ==========================================================================
   RENDER
   ========================================================================== */

function renderStudents(){

    tableBody.innerHTML="";

    state.filteredStudents.forEach(student=>{

        const row=document.createElement("tr");

        row.innerHTML=`

            <td>

                ${student.name || "-"}

            </td>

            <td>

                ${student.email || "-"}

            </td>

            <td>

                ${student.phone || "-"}

            </td>

            <td>

                ${student.totalCourses || 0}

            </td>

            <td>

                ${student.progress || 0}%

            </td>

            <td>

                <span class="badge ${student.status==="inactive"?"inactive":"active"}">

                    ${student.status || "active"}

                </span>

            </td>

            <td>

                <div class="action-buttons">

                    <button

                        class="btn-view"

                        data-id="${student.id}"

                        title="View">

                        <i class="fa-solid fa-eye"></i>

                    </button>

                    <button

                        class="btn-edit"

                        data-id="${student.id}"

                        title="Edit">

                        <i class="fa-solid fa-pen"></i>

                    </button>

                    <button

                        class="btn-delete"

                        data-id="${student.id}"

                        title="Delete">

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </div>

            </td>

        `;

        tableBody.appendChild(row);

    });

    attachEvents();

}

/* ==========================================================================
   SEARCH
   ========================================================================== */

searchInput.addEventListener(

    "input",

    ()=>{

        const keyword=

            searchInput.value

                .trim()

                .toLowerCase();

        state.filteredStudents=

            state.students.filter(student=>

                (student.name||"")

                    .toLowerCase()

                    .includes(keyword)

                ||

                (student.email||"")

                    .toLowerCase()

                    .includes(keyword)

            );

        renderStudents();

    }

);

/* ==========================================================================
   EVENTS
   ========================================================================== */

function attachEvents(){

    document

        .querySelectorAll(".btn-view")

        .forEach(button=>{

            button.onclick=()=>{

                location.href=

                    `student-details.html?id=${button.dataset.id}`;

            };

        });

    document

        .querySelectorAll(".btn-edit")

        .forEach(button=>{

            button.onclick=()=>{

                location.href=

                    `edit-student.html?id=${button.dataset.id}`;

            };

        });

    document

        .querySelectorAll(".btn-delete")

        .forEach(button=>{

            button.onclick=async()=>{

                if(

                    !confirm(

                        "Delete this student?"

                    )

                ){

                    return;

                }

                try{

                    await deleteDoc(

                        doc(

                            db,

                            "students",

                            button.dataset.id

                        )

                    );

                    showToast(

                        "Student deleted."

                    );

                    await loadStudents();

                }

                catch(error){

                    console.error(error);

                    showToast(

                        "Delete failed."

                    );

                }

            };

        });

}

/* ==========================================================================
   AUTO REFRESH
   ========================================================================== */

setInterval(

    async()=>{

        try{

            await loadStudents();

        }

        catch(error){

            console.error(error);

        }

    },

    60000

);

/* ==========================================================================
   END
   ========================================================================== */