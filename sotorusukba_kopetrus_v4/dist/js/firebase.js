"use strict";

/*
  File: js/firebase.js
  Tujuan: Inisialisasi Firebase menggunakan CDN agar bisa jalan di GitHub Pages & browser LG
*/

// Firebase App dan Realtime Database (Compat mode agar support CDN)
var firebaseScriptApp = document.createElement('script');
firebaseScriptApp.src = "https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js";
document.head.appendChild(firebaseScriptApp);
var firebaseScriptDB = document.createElement('script');
firebaseScriptDB.src = "https://www.gstatic.com/firebasejs/9.22.2/firebase-database-compat.js";
document.head.appendChild(firebaseScriptDB);

// Tunggu sampai semua script termuat
firebaseScriptDB.onload = function () {
  var firebaseConfig = {
    apiKey: "AIzaSyBcu0rGrmBITM9fJUWlpG5Sd8S_uhPgl3M",
    authDomain: "rusukbakopetrus.firebaseapp.com",
    projectId: "rusukbakopetrus",
    storageBucket: "rusukbakopetrus.firebasestorage.app",
    messagingSenderId: "616900062598",
    appId: "1:616900062598:web:c57da9b5b4986317afd007",
    databaseURL: "https://rusukbakopetrus-default-rtdb.asia-southeast1.firebasedatabase.app"
  };
  if (window.firebase && firebase.initializeApp) {
    firebase.initializeApp(firebaseConfig);
    window.db = firebase.database();
    console.log("✅ Firebase connected");
  } else {
    console.error("❌ Firebase gagal dimuat.");
  }
  firebaseScriptDB.onerror = function () {
    alert("❌ Gagal memuat Firebase. Cek koneksi atau URL script.");
  };

  // Inisialisasi Firebase
  firebase.initializeApp(firebaseConfig);
  window.db = firebase.database();
  console.log("✅ Firebase connected");
};