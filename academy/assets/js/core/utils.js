"use strict";

/* ==========================================================================
   ISSA Academy
   Utility Functions
   Version : 1.0.0
   ========================================================================== */

/* ==========================================================================
   LOADER
   ========================================================================== */

export function showLoader(loader){

    if(loader){

        loader.classList.remove("hidden");

    }

}

export function hideLoader(loader){

    if(loader){

        loader.classList.add("hidden");

    }

}

/* ==========================================================================
   TOAST
   ========================================================================== */

export function showToast(container,message,type="success"){

    if(!container){

        return;

    }

    const toast=document.createElement("div");

    toast.className=`toast ${type}`;

    toast.innerHTML=`

        <span>

            ${message}

        </span>

    `;

    container.appendChild(toast);

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
   FORMAT DATE
   ========================================================================== */

export function formatDate(date){

    if(!date){

        return "-";

    }

    return new Date(date).toLocaleDateString(

        "en-GB",

        {

            day:"2-digit",

            month:"short",

            year:"numeric"

        }

    );

}

/* ==========================================================================
   FORMAT CURRENCY
   ========================================================================== */

export function formatCurrency(amount){

    return new Intl.NumberFormat(

        "en-SA",

        {

            style:"currency",

            currency:"SAR"

        }

    ).format(amount || 0);

}

/* ==========================================================================
   RANDOM ID
   ========================================================================== */

export function generateId(prefix="ISSA"){

    return `${prefix}-${Date.now()}-${Math.floor(Math.random()*1000)}`;

}

/* ==========================================================================
   QUERY PARAM
   ========================================================================== */

export function getQueryParam(name){

    return new URLSearchParams(

        window.location.search

    ).get(name);

}

/* ==========================================================================
   DEBOUNCE
   ========================================================================== */

export function debounce(callback,delay=300){

    let timer;

    return(...args)=>{

        clearTimeout(timer);

        timer=setTimeout(()=>{

            callback(...args);

        },delay);

    };

}

/* ==========================================================================
   CONFIRM
   ========================================================================== */

export function confirmAction(message){

    return window.confirm(message);

}

/* ==========================================================================
   END
   ========================================================================== */