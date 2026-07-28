"use strict";

/* ==========================================================================
   ISSA Academy - Student Sidebar Component
   ========================================================================== */

import { auth } from "../core/firebase-config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById("adminSidebar");
    if (!sidebar) return;

    // Inject sidebar structural layout
    sidebar.innerHTML = `
        <div class="sidebar-brand" style="padding: 1.5rem; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <img src="../assets/images/Issa-Logo.png" alt="ISSA Academy Logo" style="max-width: 100px; height: auto; margin-bottom: 0.5rem;">
            <div style="font-weight: 700; font-size: 1.1rem; color: #ffffff;">ISSA Academy</div>
        </div>

        <nav class="sidebar-nav" style="display: flex; flex-direction: column; gap: 0.5rem; padding: 1.25rem 1rem; flex-grow: 1;">
            <a href="dashboard.html" class="nav-link ${location.pathname.includes('dashboard.html') ? 'active' : ''}">
                <i class="fa-solid fa-house"></i>
                <span>Dashboard</span>
            </a>
            <a href="all-courses.html" class="nav-link ${location.pathname.includes('all-courses.html') ? 'active' : ''}">
                <i class="fa-solid fa-compass"></i>
                <span>Explore Courses</span>
            </a>
            <a href="my-courses.html" class="nav-link ${location.pathname.includes('my-courses.html') ? 'active' : ''}">
                <i class="fa-solid fa-graduation-cap"></i>
                <span>My Courses</span>
            </a>
            <a href="certificates.html" class="nav-link ${location.pathname.includes('certificates.html') ? 'active' : ''}">
                <i class="fa-solid fa-award"></i>
                <span>Certificates</span>
            </a>
            <a href="profile.html" class="nav-link ${location.pathname.includes('profile.html') ? 'active' : ''}">
                <i class="fa-solid fa-user"></i>
                <span>Profile</span>
            </a>
        </nav>

        <div class="sidebar-footer" style="padding: 1rem; border-top: 1px solid rgba(255,255,255,0.1); margin-top: auto;">
            <button id="sidebarLogoutBtn" class="nav-link logout-btn" style="width: 100%; border: none; background: none; cursor: pointer; display: flex; align-items: center; gap: 0.75rem; color: #9ca3af; padding: 0.75rem 1rem; border-radius: 0.5rem; font-size: 0.95rem;">
                <i class="fa-solid fa-right-from-bracket"></i>
                <span>Logout</span>
            </button>
        </div>
    `;

    // Toggle Sidebar functionality for Mobile view
    const sidebarToggle = document.getElementById("sidebarToggle");
    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", () => {
            sidebar.classList.toggle("show");
        });
    }

    // Logout Handler
    const logoutBtn = document.getElementById("sidebarLogoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            try {
                await signOut(auth);
                location.replace("login.html");
            } catch (error) {
                console.error("Logout error:", error);
            }
        });
    }
});