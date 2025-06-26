// app_coupon.js

// Firebase 設定
const firebaseConfig = {
  apiKey: "AIzaSyDWHQk8BgmQudT9GvlZpiP59w7dhVg7ifU",
  authDomain: "kinakomoti-77d00.firebaseapp.com",
  projectId: "kinakomoti-77d00",
  storageBucket: "kinakomoti-77d00.appspot.com",
  messagingSenderId: "1041967003917",
  appId: "1:1041967003917:web:e172dba27978de2b005844",
  measurementId: "G-6FV1BEECF0"
};

window.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  let userId = params.get("userId");

  // userId がなければ LIFF ログイン→取得→リダイレクト
  if (!userId) {
    try {
      await liff.init({ liffId: APP_CONFIG.LIFF_ID });
      if (!liff.isLoggedIn()) {
        return liff.login({ redirectUri: location.href });
      }
      userId = liff.getContext().userId;
      if (!userId) throw new Error("ユーザーID が取得できませんでした");
      return window.location.replace(`${location.pathname}?userId=${encodeURIComponent(userId)}`);
    } catch (err) {
      console.error("LIFF 初期化エラー:", err);
      return;
    }
  }

  // userId 取得後の処理
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  // UI 要素
  const tabContainer = document.getElementById("storeTabs");
  const sliderTrack  = document.getElementById("sliderTrack");
  const userNameEl   = document.getElementById("userName");
  const shopNameEl   = document.getElementById("shopName");

  // スライド移動用グローバル関数
  let currentIndex = 0;
  window.moveSlide = (dir) => {
    const total = document.querySelectorAll(".slide").length;
    currentIndex = Math.min(Math.max(currentIndex + dir, 0), total - 1);
    sliderTrack.style.transform = `translateX(${-320 * currentIndex}px)`;
  };

  // 店舗タブ作成
  function createStoreTabs() {
    const storeNames = ["龍谷食堂", "宮本屋"];
    tabContainer.innerHTML = "";
    storeNames.forEach((store, i) => {
      const btn = document.createElement("button");
      btn.textContent = store;
      btn.className = "store-tab" + (i === 0 ? " active" : "");
      btn.addEventListener("click", () => loadCoupons(store));
      tabContainer.appendChild(btn);
    });
    if (storeNames.length) loadCoupons(storeNames[0]);
  }

  // クーポン取得＆QR生成
  async function loadCoupons(storeName) {
    // タブの active 切り替え
    document.querySelectorAll(".store-tab").forEach(btn => {
      btn.classList.toggle("active", btn.textContent === storeName);
    });
    // ユーザー名・店舗名表示
    userNameEl.textContent = "ゲスト";
    shopNameEl.textContent  = storeName;

    // Firestore からデータ取得
    const snapshot = await db.collection(storeName).get();
    sliderTrack.innerHTML = "";

    snapshot.forEach(doc => {
      const data = doc.data();
      const name = data.name || doc.id;
      const image = data.cuisine_URL || "";
      const discountText = data.discountAmount
        ? `${data.discountAmount}円引き`
        : data.discountRate
          ? `${data.discountRate}%引き`
          : "割引なし";

      // スライド要素を生成
      const slide = document.createElement("div");
      slide.className = "slide";
      const qrDivId = `qr-${storeName}-${name}`;
      slide.innerHTML = `
        <h3>${name}</h3>
        <img src="${image}" alt="${name}">
        <p>${discountText}</p>
        <div id="${qrDivId}"></div>
      `;
      sliderTrack.appendChild(slide);

      // QR コード生成
      const scanUrl = [
        APP_CONFIG.MAKE_COUPON_URL + "/scan.html",
        `?code=${encodeURIComponent(userId)}`,
        `&shopname=${encodeURIComponent(storeName)}`,
        `&menuname=${encodeURIComponent(name)}`
      ].join("");
      new QRCode(document.getElementById(qrDivId), {
        text: scanUrl,
        width: 200,
        height: 200
      });
    });

    // スライド先頭に戻す
    currentIndex = 0;
    moveSlide(0);
  }

  // 初期処理
  createStoreTabs();
});