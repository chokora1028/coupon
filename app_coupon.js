// app_coupon.js

// Firebase 設定（index.html に書いてあっても再度読み込んで大丈夫です）
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

  // ユーザーID がなければ LIFF ログイン→取得→リダイレクト
  if (!userId) {
    try {
      await liff.init({ liffId: APP_CONFIG.LIFF_ID });
      if (!liff.isLoggedIn()) {
        return liff.login({ redirectUri: location.href });
      }
      userId = liff.getContext().userId;
      if (!userId) throw new Error("ユーザーID が取得できませんでした");
      // userId をクエリに乗せてリロード
      return window.location.replace(`${location.pathname}?userId=${encodeURIComponent(userId)}`);
    } catch (err) {
      console.error("LIFF 初期化エラー:", err);
      return;
    }
  }

  // userId がある場合、クーポン表示ロジックを開始
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  // UI 要素参照
  const tabContainer   = document.getElementById("storeTabs");
  const sliderTrack    = document.getElementById("sliderTrack");
  const userNameEl     = document.getElementById("userName");
  const shopNameEl     = document.getElementById("shopName");

  // 定義：店舗タブを作成
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
    // 最初の店舗をロード
    if (storeNames.length) loadCoupons(storeNames[0]);
  }

  // 定義：クーポンを取得してスライド表示
  let currentIndex = 0;
  window.moveSlide = (dir) => {
    const total = document.querySelectorAll(".slide").length;
    currentIndex = Math.min(Math.max(currentIndex + dir, 0), total - 1);
    sliderTrack.style.transform = `translateX(${-320 * currentIndex}px)`;
  };

  async function loadCoupons(storeName) {
    // タブのアクティブ切り替え
    document.querySelectorAll(".store-tab").forEach(btn => {
      btn.classList.toggle("active", btn.textContent === storeName);
    });
    // ユーザー名・店舗名表示
    userNameEl.textContent = "ゲスト";  // 必要に応じて他の情報を入れてください
    shopNameEl.textContent = storeName;

    // Firestore からクーポンデータ取得
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

      // スライド要素作成
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

      // QR を生成
      const scanUrl = [
        APP_CONFIG.MAKE_COUPON_URL + "/index.html",
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

    // スライドを先頭にリセット
    currentIndex = 0;
    moveSlide(0);
  }

  // 初期化
  createStoreTabs();
});