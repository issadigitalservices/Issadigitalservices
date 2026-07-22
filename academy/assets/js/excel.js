"use strict";

/* ==========================================================================
   ISSA Academy
   Microsoft Excel Course
   ========================================================================== */

import {

    db

} from "./core/firebase-config.js";

import {

    collection,

    getDocs

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";



/* ==========================================================================
   DOM
   ========================================================================== */

const header =
    document.querySelector("header");

const faqItems =
    document.querySelectorAll(".faq-item");

const revealItems =
    document.querySelectorAll(".reveal");

const navLinks =
    document.querySelectorAll("nav a");

    const syllabusList =
    document.getElementById("syllabusList");

/* ==========================================================================
   STICKY HEADER SHADOW
   ========================================================================== */

window.addEventListener(

    "scroll",

    ()=>{

        if(window.scrollY > 30){

            header.style.boxShadow =

                "0 12px 35px rgba(0,0,0,.08)";

        }

        else{

            header.style.boxShadow =

                "0 5px 20px rgba(0,0,0,.06)";

        }

    }

);

/* ==========================================================================
   SMOOTH SCROLL
   ========================================================================== */

navLinks.forEach(link=>{

    const href =

        link.getAttribute("href");

    if(

        href &&

        href.startsWith("#")

    ){

        link.addEventListener(

            "click",

            event=>{

                event.preventDefault();

                const section =

                    document.querySelector(href);

                if(section){

                    section.scrollIntoView({

                        behavior:"smooth",

                        block:"start"

                    });

                }

            }

        );

    }

});

/* ==========================================================================
   HERO BUTTONS
   ========================================================================== */

document

    .querySelectorAll(

        'a[href^="#"]'

    )

    .forEach(button=>{

        button.addEventListener(

            "click",

            event=>{

                const target =

                    button.getAttribute(

                        "href"

                    );

                if(

                    target.length <= 1

                ){

                    return;

                }

                const section =

                    document.querySelector(

                        target

                    );

                if(section){

                    event.preventDefault();

                    section.scrollIntoView({

    behavior: "smooth",

    block: "start"

});

                }

            }

        );

    });

/* ==========================================================================
   FAQ
   ========================================================================== */

faqItems.forEach(item=>{

    const question =

        item.querySelector(

            ".faq-question"

        );

    question.addEventListener(

        "click",

        ()=>{

            faqItems.forEach(faq=>{

                if(faq!==item){

                    faq.classList.remove(

                        "active"

                    );

                }

            });

            item.classList.toggle(

                "active"

            );

        }

    );

});

/* ==========================================================================
   SCROLL REVEAL
   ========================================================================== */

const observer =

    new IntersectionObserver(

        entries=>{

            entries.forEach(entry=>{

                if(entry.isIntersecting){

                    entry.target.classList.add(

                        "show"

                    );

                }

            });

        },

        {

            threshold:.15

        }

    );

revealItems.forEach(section=>{

    observer.observe(section);

});

/* ==========================================================================
   DEMO CLASS
   ========================================================================== */

document.querySelectorAll(".demo-card").forEach(card => {

    card.addEventListener("click", () => {

        const video = card.dataset.video;

        const popup = document.createElement("div");

        popup.className = "video-modal show";

        popup.innerHTML = `

            <div class="video-box">

                <button class="close-video" type="button">
    <i class="fa-solid fa-xmark"></i>
</button>

                <video
                    id="demoPlayer"
                    playsinline
                    controls>

                    <source src="${video}" type="video/mp4">

                </video>

            </div>

        `;

        document.body.appendChild(popup);

        const player = new Plyr("#demoPlayer", {

            controls: [

    "play-large",

    "play",

    "progress",

    "current-time",

    "mute",

    "volume",

    "settings",

    "fullscreen"

],

settings: [

    "speed"

],

speed: {

    selected: 1,

    options: [

        0.5,

        0.75,

        1,

        1.25,

        1.5,

        1.75,

        2

    ]

}

        });

        popup.querySelector(".close-video").onclick = () => {

            player.destroy();

            popup.remove();

        };

        popup.onclick = (e) => {

            if (e.target === popup) {

                player.destroy();

                popup.remove();

            }

        };

    });

});
/* ==========================================================================
   ACTIVE NAVIGATION
   ========================================================================== */

const sections =

    document.querySelectorAll(

        "section[id]"

    );

window.addEventListener(

    "scroll",

    ()=>{

        const scrollY =

            window.scrollY;

        sections.forEach(section=>{

            const top =

                section.offsetTop-120;

            const height =

                section.offsetHeight;

            const id =

                section.getAttribute(

                    "id"

                );

            if(

                scrollY>=top &&

                scrollY<top+height

            ){

                navLinks.forEach(link=>{

                    link.classList.remove(

                        "active"

                    );

                    if(

                        link.getAttribute(

                            "href"

                        )===`#${id}`

                    ){

                        link.classList.add(

                            "active"

                        );

                    }

                });

            }

        });

    }

);

/* ==========================================================================
   PRELOAD IMAGES
   ========================================================================== */

window.addEventListener(

    "load",

    ()=>{

        document

            .querySelectorAll("img")

            .forEach(image=>{

                if(image.complete){

                    image.classList.add(

                        "loaded"

                    );

                }

                else{

                    image.onload=()=>{

                        image.classList.add(

                            "loaded"

                        );

                    };

                }

            });

    }

);

/* ==========================================================================
   LOAD COURSE CURRICULUM
   ========================================================================== */

async function loadCurriculum(){

    if(!syllabusList){

        return;

    }

    syllabusList.innerHTML="";

    const moduleSnapshot = await getDocs(

        collection(

            db,

            "modules"

        )

    );

    const lessonSnapshot = await getDocs(

        collection(

            db,

            "lessons"

        )

    );

    const modules=[];

    moduleSnapshot.forEach(doc=>{

        modules.push({

            id:doc.id,

            ...doc.data()

        });

    });

    modules.sort(

        (a,b)=>a.order-b.order

    );

    modules.forEach(module=>{

        const lessonCount =

            lessonSnapshot.docs.filter(

                lesson=>

                    lesson.data().moduleId===module.id

            ).length;

        syllabusList.innerHTML += `

<div class="syllabus-item">

<div class="syllabus-header">

<span>

Module ${module.order} – ${module.title}

</span>

<span>

${lessonCount} Lessons

</span>

</div>

</div>

`;

    });

}

/* ==========================================================================
   PAGE INITIALIZATION
   ========================================================================== */

document.addEventListener(

    "DOMContentLoaded",

    ()=>{

        console.log(

    "ISSA Academy Excel Page Loaded"

);

loadCurriculum();

    }

);

/* ==========================================================================
   END
   ========================================================================== */