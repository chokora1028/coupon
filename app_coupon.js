// public/app.js

window.addEventListener("DOMContentLoaded", async () => {
  try {
    // 1) LIFF 初期化
    await liff.init({ liffId: APP_CONFIG.LIFF_ID });

    // 2) 未ログインならログイン
    if (!liff.isLoggedIn()) {
      return liff.login({ redirectUri: location.href });
    }

    // 3) userId と idToken を取得（idToken は scan.html 用）
    const userId  = liff.getContext().userId;
    const idToken = liff.getIDToken();

    // 4) QRコード生成 (scan.html に code と idToken を渡す)
    const scanUrl =
      `${APP_CONFIG.MAKE_COUPON_URL}/make_coupon_list.html` +
      `?code=${encodeURIComponent(userId)}` +
      `&shopname=${encodeURIComponent(shopname)}`+
      `&menuname=${encodeURIComponent(menuname)}`;
    const qEl = document.getElementById("qrcode");
    qEl.innerHTML = "";
    new QRCode(qEl, { text: scanUrl, width:300, height:300 });
    qEl.style.display = "block";

  } catch (err) {
    console.error("LIFF 初期化エラー", err);
  }
});