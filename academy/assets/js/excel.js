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
                selected: 1,
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



