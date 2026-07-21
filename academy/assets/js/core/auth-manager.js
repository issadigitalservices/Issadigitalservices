"use strict";

/* ==========================================================================
   ISSA Academy
   Authentication Manager
   Version : 1.0.0
   ========================================================================== */

import {

    auth

} from "./firebase-config.js";

import {

    onAuthStateChanged,
    signOut

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

/* ==========================================================================
   CACHE
   ========================================================================== */

let currentUser = null;

let authLoaded = false;

let authPromise = null;

/* ==========================================================================
   INITIALIZE
   ========================================================================== */

function initialize(){

    if(authPromise){

        return authPromise;

    }

    authPromise = new Promise(

        resolve=>{

            onAuthStateChanged(

                auth,

                user=>{

                    currentUser = user;

                    authLoaded = true;

                    resolve(user);

                }

            );

        }

    );

    return authPromise;

}

/* ==========================================================================
   GET CURRENT USER
   ========================================================================== */

export async function getCurrentUser(){

    if(authLoaded){

        return currentUser;

    }

    return await initialize();

}

/* ==========================================================================
   REQUIRE LOGIN
   ========================================================================== */

export async function requireStudent(){

    const user =

        await getCurrentUser();

    if(!user){

        location.replace(

            "login.html"

        );

        return null;

    }

    return user;

}

/* ==========================================================================
   LOGOUT
   ========================================================================== */

export async function logoutUser(){

    await signOut(

        auth

    );

    location.replace(

        "login.html"

    );

}

/* ==========================================================================
   USER
   ========================================================================== */

export function user(){

    return currentUser;

}

/* ==========================================================================
   END
   ========================================================================== */