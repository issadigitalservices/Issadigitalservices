"use strict";

/* ==========================================================================
   ISSA Academy - Microsoft Excel Course
   ========================================================================== */

import { db } from "./core/firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* ==========================================================================
   DOM ELEMENTS
   ========================================================================== */
const header = document.querySelector("header");
const faqItems = document.querySelectorAll(".faq-item");
const revealItems = document.querySelectorAll(".reveal");
const syllabusList = document.getElementById("syllabusList");

/* ==========================================================================
   STICKY HEADER SHADOW
   ========================================================================== */
window.addEventListener("scroll", () => {
    if (window.scrollY > 30) {
        header.style.boxShadow = "0 12px 35px rgba(0,0,0,.08)";
    } else {
        header.style.boxShadow = "0 5px 20px rgba(0,0,0,.06)";
    }
});

/* ==========================================================================
   SMOOTH SCROLL (Unified Handler)
   ========================================================================== */
document.querySelectorAll('a[href^="#"]').forEach(button => {
    button.addEventListener("click", event => {
        const target = button.getAttribute("href");
        if (!target || target.length <= 1) return;

        const section = document.querySelector(target);
        if (section) {
            event.preventDefault();
            section.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });
});

/* ==========================================================================
   FAQ ACCORDION
   ========================================================================== */
faqItems.forEach(item => {
    const question = item.querySelector(".faq-question");
    question.addEventListener("click", () => {
        faqItems.forEach(faq => {
            if (faq !== item) {
                faq.classList.remove("active");
            }
        });
        item.classList.toggle("active");
    });
});

/* ==========================================================================
   SCROLL REVEAL ANIMATION
   ========================================================================== */
const observer = new IntersectionObserver(
    entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
            }
        });
    },
    { threshold: 0.15 }
);

revealItems.forEach(section => {
    observer.observe(section);
});

/* ==========================================================================
   DEMO CLASS VIDEO MODAL
   ========================================================================== */
document.querySelectorAll(".demo-card").forEach(card => {
    card.addEventListener("click", () => {
        const video = card.dataset.video;
        const popup = document.createElement("div");
        popup.className = "video-modal show";

        popup.innerHTML = `
            <div class="video-box">
                <button class="close-video" type="button" aria-label="Close video">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <video id="demoPlayer" playsinline controls>
                    <source src="${video}" type="video/mp4">
                </video>
            </div>
        `;

        document.body.appendChild(popup);

        const player = new Plyr("#demoPlayer", {
            controls: [
                "play-large", "play", "progress", "current-time",
                "mute", "volume", "settings", "fullscreen"
            ],
            settings: ["speed"],
            speed: {
                selected: 1.25,
                options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
            }
        });

        // Close logic (Click close btn, click outside, or press ESC)
        const closeModal = () => {
            player.destroy();
            popup.remove();
            document.removeEventListener("keydown", handleKeydown);
        };

        const handleKeydown = (e) => {
            if (e.key === "Escape") closeModal();
        };

        popup.querySelector(".close-video").onclick = closeModal;
        popup.onclick = (e) => { if (e.target === popup) closeModal(); };
        document.addEventListener("keydown", handleKeydown);
    });
});

/* ==========================================================================
   ACTIVE NAVIGATION ON SCROLL
   ========================================================================== */
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll("nav a");

window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    sections.forEach(section => {
        const top = section.offsetTop - 120;
        const height = section.offsetHeight;
        const id = section.getAttribute("id");

        if (scrollY >= top && scrollY < top + height) {
            navLinks.forEach(link => {
                link.classList.remove("active");
                if (link.getAttribute("href") === `#${id}`) {
                    link.classList.add("active");
                }
            });
        }
    });
});

/* ==========================================================================
   PRELOAD IMAGES
   ========================================================================== */
window.addEventListener("load", () => {
    document.querySelectorAll("img").forEach(image => {
        if (image.complete) {
            image.classList.add("loaded");
        } else {
            image.onload = () => image.classList.add("loaded");
        }
    });
});

/* ==========================================================================
   FETCH & RENDER PUBLIC RESOURCES
   ========================================================================== */
import { query, orderBy } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

async function renderPublicResources() {
    const container = document.getElementById("resourcesContainer");
    if (!container) return;

    try {
        const q = query(collection(db, "resources"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            container.innerHTML = "<p style='text-align:center; color:#64748b; grid-column: 1/-1;'>No downloadable files currently available.</p>";
            return;
        }

        container.innerHTML = "";
        snapshot.forEach((docSnap) => {
            const item = docSnap.data();
            const urlLower = item.fileUrl.toLowerCase();
            const isPdf = urlLower.includes(".pdf");
            
            const iconClass = isPdf ? "fa-solid fa-file-pdf" : "fa-solid fa-file-excel";
            const iconColor = isPdf ? "#dc2626" : "#16a34a";

            const card = `
                <div style="background: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                    <div>
                        <i class="${iconClass}" style="font-size: 2.2rem; color: ${iconColor}; margin-bottom: 12px;"></i>
                        <h3 style="font-size: 1.15rem; color: #0f172a; margin-bottom: 8px;">${item.title}</h3>
                        <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 20px; line-height: 1.5;">${item.description}</p>
                    </div>
                    <a href="${item.fileUrl}" target="_blank" download style="display: inline-block; text-align: center; background: #2563eb; color: #ffffff; padding: 10px 16px; border-radius: 6px; text-decoration: none; font-weight: 500;">
                        <i class="fa-solid fa-download" style="margin-right: 8px;"></i> Download File
                    </a>
                </div>
            `;
            container.insertAdjacentHTML("beforeend", card);
        });
    } catch (err) {
        console.error("Error fetching resources:", err);
        container.innerHTML = "<p style='text-align:center; color:#ef4444; grid-column: 1/-1;'>Failed to load resources.</p>";
    }
}

renderPublicResources();

