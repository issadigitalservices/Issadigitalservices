/* ==========================================================
   ISSA Digital Services
   Excel Mastery Course
   excel.js
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ===========================================
       Sticky Header Shadow
    =========================================== */

    const header = document.querySelector("header");

    window.addEventListener("scroll", () => {

        if (window.scrollY > 40) {

            header.style.boxShadow = "0 10px 30px rgba(0,0,0,.12)";

        } else {

            header.style.boxShadow = "0 3px 15px rgba(0,0,0,.08)";

        }

    });


    /* ===========================================
       Smooth Scroll
    =========================================== */

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {

        anchor.addEventListener("click", function (e) {

            e.preventDefault();

            const target = document.querySelector(this.getAttribute("href"));

            if(target){

                target.scrollIntoView({

                    behavior:"smooth"

                });

            }

        });

    });


    /* ===========================================
       FAQ Accordion
    =========================================== */

    const questions = document.querySelectorAll(".faq-question");

    questions.forEach(question => {

        question.addEventListener("click", () => {

            const answer = question.nextElementSibling;

            const icon = question.querySelector("i");

            document.querySelectorAll(".faq-answer").forEach(item => {

                if(item !== answer){

                    item.style.display="none";

                }

            });

            if(answer.style.display==="block"){

                answer.style.display="none";

                if(icon){

                    icon.classList.remove("fa-minus");

                    icon.classList.add("fa-plus");

                }

            }else{

                answer.style.display="block";

                if(icon){

                    icon.classList.remove("fa-plus");

                    icon.classList.add("fa-minus");

                }

            }

        });

    });


    /* ===========================================
       Scroll Reveal Animation
    =========================================== */

    const revealItems = document.querySelectorAll(

        ".card,.feature-grid div,.demo-card,.module,.join-card"

    );

    const reveal = () => {

        const trigger = window.innerHeight * 0.85;

        revealItems.forEach(item => {

            const top = item.getBoundingClientRect().top;

            if(top < trigger){

                item.style.opacity="1";

                item.style.transform="translateY(0)";

            }

        });

    };

    reveal();

    window.addEventListener("scroll", reveal);


    /* ===========================================
       Initial Hidden State
    =========================================== */

    revealItems.forEach(item => {

        item.style.opacity="0";

        item.style.transform="translateY(40px)";

        item.style.transition=".7s ease";

    });


    /* ===========================================
       Animated Counters
    =========================================== */

    const counters = document.querySelectorAll(".stats-grid h2");

    let started = false;

    function startCounters(){

        if(started) return;

        const section = document.querySelector(".stats");

        if(!section) return;

        const top = section.getBoundingClientRect().top;

        if(top < window.innerHeight){

            started = true;

            counters.forEach(counter=>{

                const txt = counter.innerText;

                const value = parseInt(txt);

                if(isNaN(value)) return;

                let count=0;

                const speed=value/60;

                const update=()=>{

                    count+=speed;

                    if(count<value){

                        counter.innerText=Math.floor(count)+"+";

                        requestAnimationFrame(update);

                    }else{

                        counter.innerText=value+"+";

                    }

                }

                update();

            });

        }

    }

    startCounters();

    window.addEventListener("scroll",startCounters);


    /* ===========================================
       Active Navigation
    =========================================== */

    const sections = document.querySelectorAll("section");

    const navLinks = document.querySelectorAll("nav a");

    window.addEventListener("scroll",()=>{

        let current="";

        sections.forEach(section=>{

            const top=section.offsetTop-150;

            const height=section.offsetHeight;

            if(pageYOffset>=top){

                current=section.getAttribute("id");

            }

        });

        navLinks.forEach(link=>{

            link.classList.remove("active");

            if(link.getAttribute("href")==="#"+current){

                link.classList.add("active");

            }

        });

    });


    /* ===========================================
       Button Hover Ripple
    =========================================== */

    document.querySelectorAll(".btn").forEach(button=>{

        button.addEventListener("mouseenter",()=>{

            button.style.transform="translateY(-5px) scale(1.03)";

        });

        button.addEventListener("mouseleave",()=>{

            button.style.transform="translateY(0)";

        });

    });


    /* ===========================================
       Hero Image Rotation
    =========================================== */

    const laptop=document.querySelector(".hero-right img");

    if(laptop){

        window.addEventListener("mousemove",(e)=>{

            const x=(window.innerWidth/2-e.pageX)/70;

            const y=(window.innerHeight/2-e.pageY)/70;

            laptop.style.transform=

            `rotateY(${x}deg) rotateX(${y}deg)`;

        });

    }

});