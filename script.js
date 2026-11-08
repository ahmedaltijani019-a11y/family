// ======================================
// 1. إعدادات Firebase والمكتبات السحابية
// ======================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, deleteDoc, onSnapshot, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDeuWVOzOs784lretb6GVByMspAY4EzN_k",
    authDomain: "family-b2c75.firebaseapp.com",
    projectId: "family-b2c75",
    storageBucket: "family-b2c75.firebasestorage.app",
    messagingSenderId: "321218921724",
    appId: "1:321218921724:web:85ffd3453b60ca6c798379",
    measurementId: "G-XJ38GSJBDE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const FAMILY_MEMBERS = [
    "الوالد التجاني",
    "الوالدة تهاني",
    "أحمد",
    "السر",
    "أسامة",
    "محمد",
    "العائلة"
];

const MEMBER_EMAILS = {
    "الوالد التجاني": "eltijani@family.com",
    "الوالدة تهاني": "tahani@family.com",
    "أحمد": "ahmed@family.com",
    "السر": "elssier@family.com",
    "أسامة": "osama@family.com",
    "محمد": "mohamed@family.com"
};

// الصور الرمزية (Avatars) لكل فرد من العائلة
const MEMBER_AVATARS = {
    "الوالد التجاني": "🧔🏻‍♂️",
    "الوالدة تهاني": "🧕🏻",
    "أحمد": "💻",
    "السر": "🚀",
    "أسامة": "⚡",
    "محمد": "🎯",
    "العائلة": "🏠"
};

let tasks = [];
let familyScores = {
    "الوالد التجاني": 0,
    "الوالدة تهاني": 0,
    "أحمد": 0,
    "السر": 0,
    "أسامة": 0,
    "محمد": 0,
    "العائلة": 0
};
let currentFilter = "all";
let currentLoggedInUser = null;

document.addEventListener("DOMContentLoaded", () => {
    initializeTheme();
    initializeEvents();

    onAuthStateChanged(auth, (user) => {
        const modal = document.getElementById("authModal");
        if (user) {
            currentLoggedInUser = Object.keys(MEMBER_EMAILS).find(key => MEMBER_EMAILS[key] === user.email) || "أحمد";
            if (modal) modal.style.display = "none";
            const userDisplay = document.getElementById("currentLoggedUserDisplay");
            if (userDisplay) userDisplay.textContent = `مرحباً، ${currentLoggedInUser} 👤`;
            initCloudSync();
        } else {
            if (modal) modal.style.display = "grid";
            currentLoggedInUser = null;
        }
    });
});

window.handleLogin = async function() {
    const userSelect = document.getElementById("loginUserSelect").value;
    const rawPin = document.getElementById("loginPinInput").value.trim();
    const errorMsg = document.getElementById("authErrorMsg");

    if (!rawPin) {
        errorMsg.textContent = "الرجاء إدخال رمز الـ PIN الخاص بك.";
        return;
    }

    const email = MEMBER_EMAILS[userSelect];
    if (!email) {
        errorMsg.textContent = "حدث خطأ في تحديد الحساب.";
        return;
    }

    try {
        errorMsg.textContent = "جاري التحقق وتسجيل الدخول...";
        await signInWithEmailAndPassword(auth, email, rawPin);
        errorMsg.textContent = "";
        document.getElementById("loginPinInput").value = "";
    } catch (error) {
        console.error(error);
        errorMsg.textContent = "رمز الـ PIN غير صحيح. تأكد من الرمز وحاول مجدداً.";
    }
};

window.handleLogout = function() {
    signOut(auth).then(() => {
        location.reload();
    });
};

async function initCloudSync() {
    await migrateLocalDataToCloudIfNeeded();

    onSnapshot(collection(db, "familyTasks"), (snapshot) => {
        tasks = [];
        snapshot.forEach((docSnap) => {
            let data = docSnap.data