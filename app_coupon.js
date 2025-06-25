// public/app.js

window.addEventListener("DOMContentLoaded", async () => {

  const params = new URLSearchParams(window.location.search);
  if (params.has('userId')) return;

  try {
    // 1) LIFF 初期化
    await liff.init({ liffId: APP_CONFIG.LIFF_ID });

    // 2) 未ログインならログイン
    if (!liff.isLoggedIn()) {
      return liff.login({ redirectUri: location.href });
    }

    // 3) userIdを取得
    const userId  = liff.getContext().userId;
    if (!userId) {
      throw new Error("userId が取得できませんでした");
    }

    // index.htmlにuserIdを渡して遷移
    window.location.href = `index.html?userId=${encodeURIComponent(userId)}`;

    //ここより下実行されない
    // 4) QRコード生成 (scan.html に code と idToken を渡す)
    const scanUrl =
      `${APP_CONFIG.MAKE_COUPON_URL}/index.html` +
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