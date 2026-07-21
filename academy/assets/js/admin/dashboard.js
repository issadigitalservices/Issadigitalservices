"use strict";

/* ==========================================================================
   ISSA Academy
   Admin Dashboard
   Version : 2.0.0
   ========================================================================== */

/* ==========================================================================
   FIREBASE
   ========================================================================== */

import {

    auth,
    db

} from "../core/firebase-config.js";

import {

    requireAdmin

} from "../core/auth-guard.js";

import {

    signOut

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {

    collection,
    getDocs,
    query,
    orderBy,
    limit

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* ==========================================================================
   AUTH
   ========================================================================== */

await requireAdmin();

/* ==========================================================================
   DOM
   ========================================================================== */

const totalStudents =
    document.getElementById("totalStudents");

const totalCourses =
    document.getElementById("totalCourses");

const totalLessons =
    document.getElementById("totalLessons");

const totalRevenue =
    document.getElementById("totalRevenue");

const recentCourses =
    document.getElementById("recentCourses");

const recentStudents =
    document.getElementById("recentStudents");

const recentPayments =
    document.getElementById("recentPayments");

const activityTimeline =
    document.getElementById("activityTimeline");

const pageLoader =
    document.getElementById("pageLoader");

const toastContainer =
    document.getElementById("toastContainer");

/* ==========================================================================
   LOADER
   ========================================================================== */

function showLoader(){

    pageLoader?.classList.remove("hidden");

}

function hideLoader(){

    pageLoader?.classList.add("hidden");

}

/* ==========================================================================
   TOAST
   ========================================================================== */

function showToast(

    message,

    type="success"

){

    if(!toastContainer){

        alert(message);

        return;

    }

    const toast =
        document.createElement("div");

    toast.className =
        `toast ${type}`;

    toast.textContent =
        message;

    toastContainer.appendChild(toast);

    requestAnimationFrame(()=>{

        toast.classList.add("show");

    });

    setTimeout(()=>{

        toast.classList.remove("show");

        setTimeout(()=>{

            toast.remove();

        },300);

    },3000);

}

/* ==========================================================================
   INIT
   ========================================================================== */

initializeDashboard();

async function initializeDashboard(){

    try{

        showLoader();

        await Promise.all([

            loadStatistics(),

            loadRecentCourses(),

            loadRecentStudents(),

            loadRecentPayments()

        ]);

        addActivity(

            "Dashboard Loaded",

            "Admin dashboard loaded successfully."

        );

    }

    catch(error){

        console.error(error);

        showToast(

            error.message,

            "error"

        );

    }

    finally{

        hideLoader();

    }

}

/* ==========================================================================
   STATISTICS
   ========================================================================== */

async function loadStatistics(){

    const [

        studentsSnapshot,

        coursesSnapshot,

        lessonsSnapshot,

        paymentsSnapshot

    ] = await Promise.all([

        getDocs(

            collection(

                db,

                "students"

            )

        ),

        getDocs(

            collection(

                db,

                "courses"

            )

        ),

        getDocs(

            collection(

                db,

                "lessons"

            )

        ),

        getDocs(

            collection(

                db,

                "payments"

            )

        )

    ]);

    totalStudents.textContent =
        studentsSnapshot.size;

    totalCourses.textContent =
        coursesSnapshot.size;

    totalLessons.textContent =
        lessonsSnapshot.size;

    let revenue = 0;

    paymentsSnapshot.forEach(

        docSnap=>{

            const payment =
                docSnap.data();

            revenue += Number(

                payment.amount || 0

            );

        }

    );

    totalRevenue.textContent =
        `₹ ${revenue.toLocaleString("en-IN")}`;

}

/* ==========================================================================
   RECENT COURSES
   ========================================================================== */

async function loadRecentCourses(){

    if(!recentCourses){

        return;

    }

    recentCourses.innerHTML="";

    const snapshot = await getDocs(

        query(

            collection(

                db,

                "courses"

            ),

            orderBy(

                "createdAt",

                "desc"

            ),

            limit(5)

        )

    );

    if(snapshot.empty){

        recentCourses.innerHTML=`

            <div class="empty-state">

                <i class="fa-solid fa-book-open"></i>

                <p>No courses available.</p>

            </div>

        `;

        return;

    }

    snapshot.forEach(docSnap=>{

        const course = docSnap.data();

        const item = document.createElement("div");

        item.className="list-item";

        item.innerHTML=`

            <div>

                <strong>

                    ${course.title || "-"}

                </strong>

                <p>

                    ${course.categoryId || "-"}

                </p>

            </div>

            <span>

                ${course.status || "Published"}

            </span>

        `;

        recentCourses.appendChild(item);

    });

}

/* ==========================================================================
   RECENT STUDENTS
   ========================================================================== */

async function loadRecentStudents(){

    if(!recentStudents){

        return;

    }

    recentStudents.innerHTML="";

    const snapshot = await getDocs(

        query(

            collection(

                db,

                "students"

            ),

            orderBy(

                "createdAt",

                "desc"

            ),

            limit(5)

        )

    );

    if(snapshot.empty){

        recentStudents.innerHTML=`

            <div class="empty-state">

                <i class="fa-solid fa-user-graduate"></i>

                <p>No students found.</p>

            </div>

        `;

        return;

    }

    snapshot.forEach(docSnap=>{

        const student = docSnap.data();

        const item = document.createElement("div");

        item.className="list-item";

        item.innerHTML=`

            <div>

                <strong>

                    ${student.name || "-"}

                </strong>

                <p>

                    ${student.email || "-"}

                </p>

            </div>

        `;

        recentStudents.appendChild(item);

    });

}

/* ==========================================================================
   RECENT PAYMENTS
   ========================================================================== */

async function loadRecentPayments(){

    if(!recentPayments){

        return;

    }

    recentPayments.innerHTML="";

    const snapshot = await getDocs(

        query(

            collection(

                db,

                "payments"

            ),

            orderBy(

                "createdAt",

                "desc"

            ),

            limit(5)

        )

    );

    if(snapshot.empty){

        recentPayments.innerHTML=`

            <div class="empty-state">

                <i class="fa-solid fa-credit-card"></i>

                <p>No payments found.</p>

            </div>

        `;

        return;

    }

    snapshot.forEach(docSnap=>{

        const payment = docSnap.data();

        const item = document.createElement("div");

        item.className="list-item";

        item.innerHTML=`

            <div>

                <strong>

                    ${payment.studentName || "Student"}

                </strong>

                <p>

                    ${payment.courseTitle || "Course"}

                </p>

            </div>

            <span>

                ₹ ${Number(payment.amount || 0).toLocaleString("en-IN")}

            </span>

        `;

        recentPayments.appendChild(item);

    });

}

/* ==========================================================================
   ACTIVITY TIMELINE
   ========================================================================== */

function addActivity(

    title,

    message

){

    if(!activityTimeline){

        return;

    }

    const item =
        document.createElement("div");

    item.className =
        "timeline-item";

    item.innerHTML = `

        <div class="timeline-dot"></div>

        <div>

            <strong>

                ${title}

            </strong>

            <p>

                ${message}

            </p>

        </div>

    `;

    activityTimeline.prepend(item);

}

/* ==========================================================================
   NOTIFICATION BUTTONS
   ========================================================================== */

document

    .querySelectorAll(".icon-btn")

    .forEach(button=>{

        button.addEventListener(

            "click",

            ()=>{

                showToast(

                    "Feature coming soon."

                );

            }

        );

    });

/* ==========================================================================
   LOGOUT
   ========================================================================== */

const logoutButton =

    document.querySelector(

        "#logoutBtn"

    ) ||

    document.querySelector(

        'a[href="../index.html"]'

    );

if(logoutButton){

    logoutButton.addEventListener(

        "click",

        async event=>{

            event.preventDefault();

            try{

                showLoader();

                await signOut(auth);

                location.replace(

                    "../student/login.html"

                );

            }

            catch(error){

                console.error(error);

                showToast(

                    "Logout failed.",

                    "error"

                );

            }

            finally{

                hideLoader();

            }

        }

    );

}

/* ==========================================================================
   AUTO REFRESH
   ========================================================================== */

setInterval(

    async ()=>{

        try{

            await loadStatistics();

        }

        catch(error){

            console.error(error);

        }

    },

    60000

);

/* ==========================================================================
   PAGE VISIBILITY
   ========================================================================== */

document.addEventListener(

    "visibilitychange",

    async ()=>{

        if(

            document.visibilityState==="visible"

        ){

            try{

                await loadStatistics();

            }

            catch(error){

                console.error(error);

            }

        }

    }

);

/* ==========================================================================
   END
   ========================================================================== */