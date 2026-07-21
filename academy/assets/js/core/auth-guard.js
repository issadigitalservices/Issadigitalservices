"use strict";

/* ==========================================================================
   ISSA Academy
   Authentication Guard
   Version : 1.0.0
   ========================================================================== */

import {

    auth

} from "./firebase-config.js";

import {

    onAuthStateChanged,

    signOut

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {

    doc,
    getDoc

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {

    db

} from "./firebase-config.js";

/* ==========================================================================
   REQUIRE LOGIN
   ========================================================================== */

export function requireAuth(

    redirect="student/login.html"

){

    return new Promise(resolve=>{

        onAuthStateChanged(

            auth,

            user=>{

                if(!user){

                    location.replace(

                        redirect

                    );

                    return;

                }

                console.log("Current User UID:", user.uid);
console.log("Current User Email:", user.email);

                resolve(user);

            }

        );

    });

}

/* ==========================================================================
   REQUIRE ADMIN
   ========================================================================== */

export function requireAdmin(
    redirect = "../student/login.html"
){
    return new Promise(resolve => {
        onAuthStateChanged(auth, async user => {

            if (!user) {
                location.replace(redirect);
                return;
            }

            try {
                const adminRef = doc(db, "admins", user.uid);
                const adminSnap = await getDoc(adminRef);

                if (!adminSnap.exists()) {
                    await signOut(auth);
                    location.replace(redirect);
                    return;
                }

                resolve(user);

            } catch (error) {
                console.error(error);
                await signOut(auth);
                location.replace(redirect);
            }

        });
    });
}

/* ==========================================================================
   LOGOUT
   ========================================================================== */

export async function logout(

    redirect="../student/login.html"

){

    try{

        await signOut(

            auth

        );

        location.replace(

            redirect

        );

    }

    catch(error){

        console.error(error);

    }

}

/* ==========================================================================
   CURRENT USER
   ========================================================================== */

export function getCurrentUser(){

    return auth.currentUser;

}

/* ==========================================================================
   END
   ========================================================================== */