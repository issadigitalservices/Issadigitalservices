"use strict";

/* ==========================================================================
   ISSA Academy
   Admin Sidebar & Global Layout Handler
   ========================================================================== */

const currentPage = location.pathname.split("/").pop();
const sidebar = document.getElementById("adminSidebar");

if (sidebar) {
    sidebar.innerHTML = `
    <div class="logo-area">
        <img src="../assets/images/Issa-Logo.png" alt="ISSA Academy">
        <h2>ISSA Academy</h2>
    </div>
    <nav>
        <ul>
            <li class="${currentPage === "dashboard.html" ? "active" : ""}">
                <i class="fa-solid fa-house"></i>
                <a href="dashboard.html">Dashboard</a>
            </li>
            <li class="${currentPage === "enrollments.html" ? "active" : ""}">
                <i class="fa-solid fa-square-plus"></i>
                <a href="enrollments.html">Enrollments</a>
            </li>
            <li class="${currentPage === "courses.html" ? "active" : ""}">
                <i class="fa-solid fa-book"></i>
                <a href="courses.html">Courses</a>
            </li>
            <li class="${currentPage === "add-course.html" ? "active" : ""}">
                <i class="fa-solid fa-square-plus"></i>
                <a href="add-course.html">Add Course</a>
            </li>
            <li class="${currentPage === "modules.html" ? "active" : ""}">
                <i class="fa-solid fa-layer-group"></i>
                <a href="modules.html">Modules</a>
            </li>
            <li class="${currentPage === "add-module.html" ? "active" : ""}">
                <i class="fa-solid fa-folder-plus"></i>
                <a href="add-module.html">Add Module</a>
            </li>
            <li class="${currentPage === "lessons.html" ? "active" : ""}">
                <i class="fa-solid fa-video"></i>
                <a href="lessons.html">Lessons</a>
            </li>
            <li class="${currentPage === "add-lesson.html" ? "active" : ""}">
                <i class="fa-solid fa-circle-plus"></i>
                <a href="add-lesson.html">Add Lesson</a>
            </li>
            <li class="${currentPage === "quizzes.html" ? "active" : ""}">
                <i class="fa-solid fa-file-circle-question"></i>
                <a href="quizzes.html">Exams</a>
            </li>
            <li class="${currentPage === "quiz-form.html" ? "active" : ""}">
                <i class="fa-solid fa-square-plus"></i>
                <a href="quiz-form.html">Add Exam</a>
            </li>
            <li class="${currentPage === "students.html" ? "active" : ""}">
                <i class="fa-solid fa-users"></i>
                <a href="students.html">Students</a>
            </li>
            <li class="${currentPage === "payments.html" ? "active" : ""}">
                <i class="fa-solid fa-credit-card"></i>
                <a href="payments.html">Payments</a>
            </li>
            <li class="${currentPage === "certificates.html" ? "active" : ""}">
                <i class="fa-solid fa-award"></i>
                <a href="certificates.html">Certificates</a>
            </li>
            <li class="${currentPage === "settings.html" ? "active" : ""}">
                <i class="fa-solid fa-gear"></i>
                <a href="settings.html">Settings</a>
            </li>
            <li>
                <i class="fa-solid fa-right-from-bracket"></i>
                <a href="../student/login.html">Logout</a>
            </li>
        </ul>
    </nav>
    `;
}

/* ==========================================================================
   Global Mobile Sidebar Toggle & Overlay Initialization
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    // 1. Automatically inject the overlay into the body if it doesn't exist
    let overlay = document.getElementById("sidebarOverlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "sidebarOverlay";
        overlay.className = "sidebar-overlay";
        document.body.appendChild(overlay);
    }

    const sidebarToggle = document.getElementById("sidebarToggle");
    const sidebarEl = document.querySelector(".sidebar");

    // 2. Toggle function
    function toggleSidebar() {
        sidebarEl?.classList.toggle("show");
        overlay?.classList.toggle("show");
    }

    // 3. Bind hamburger button click
    if (sidebarToggle && sidebarEl) {
        sidebarToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleSidebar();
        });
    }

    // 4. Bind overlay click to close
    if (overlay) {
        overlay.addEventListener("click", toggleSidebar);
    }

    // 5. Auto-close sidebar when clicking any navigation link on mobile screens
    sidebarEl?.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            if (window.innerWidth <= 992) {
                toggleSidebar();
            }
        });
    });
});