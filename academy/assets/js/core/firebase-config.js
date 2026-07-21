"use strict";

/* ==========================================================================
   ISSA Academy
   Firebase Configuration
   Version : 1.0.0
   ========================================================================== */

import {

    initializeApp

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {

    getAuth

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {

    getFirestore

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {

    getStorage

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

/* ==========================================================================
   FIREBASE CONFIG
   Replace with your Firebase Project Configuration
   ========================================================================== */

const firebaseConfig = {

    apiKey: "AIzaSyBNgQN_Kl0FDKmOfNS1no2KBvYHP2m9Gh4",

    authDomain: "issa-academy.firebaseapp.com",

    projectId: "issa-academy",

    storageBucket: "issa-academy.firebasestorage.app",

    messagingSenderId: "353505183812",

    appId: "1:353505183812:web:3aa93ec9bcdee902d79411",
    measurementId: "G-YF8TCFSEP8"

};

/* ==========================================================================
   INITIALIZE
   ========================================================================== */

const app = initializeApp(

    firebaseConfig

);

const auth = getAuth(

    app

);

const db = getFirestore(

    app

);

const storage = getStorage(

    app

);

/* ==========================================================================
   EXPORTS
   ========================================================================== */

export {

    app,

    auth,

    db,

    storage

};