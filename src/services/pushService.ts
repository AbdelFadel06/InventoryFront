// src/services/pushService.ts
// Notifications sur téléphone (Web Push) : abonnement de l'appareil du manager.
import axiosInstance from "../api/axiosInstance";

export type PushState =
  | "loading"
  | "unsupported"      // navigateur sans notifications
  | "needs-install"    // iPhone : il faut ouvrir l'appli depuis l'écran d'accueil
  | "not-configured"   // serveur sans clés
  | "denied"           // refusé dans les réglages du téléphone
  | "off"
  | "on";

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

function supported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function keyToBytes(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}

async function currentSubscription() {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function getPushState(): Promise<PushState> {
  if (!supported()) return isIos() && !isStandalone() ? "needs-install" : "unsupported";
  const { data } = await axiosInstance.get("/notifications/push/key/");
  if (!data.public_key) return "not-configured";
  if (Notification.permission === "denied") return "denied";
  return (await currentSubscription()) ? "on" : "off";
}

export async function enablePush(): Promise<PushState> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "off";

  const { data } = await axiosInstance.get("/notifications/push/key/");
  const registration = await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyToBytes(data.public_key),
    }));
  await axiosInstance.post("/notifications/push/subscribe/", subscription.toJSON());
  return "on";
}

export async function disablePush(): Promise<PushState> {
  const subscription = await currentSubscription();
  if (subscription) {
    await axiosInstance.post("/notifications/push/unsubscribe/", { endpoint: subscription.endpoint }).catch(() => {});
    await subscription.unsubscribe();
  }
  return "off";
}

/** À la déconnexion : ce téléphone ne doit plus recevoir les notifications de ce compte. */
export function forgetPushOnLogout() {
  if (!supported()) return;
  currentSubscription().then(s => s?.unsubscribe()).catch(() => {});
}

export const sendTestPush = () => axiosInstance.post("/notifications/push/test/");
