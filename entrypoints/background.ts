let WAKELOCK_HANDLE: WakeLockSentinel | undefined = undefined;

interface Message {
  action: string,
};

export default defineBackground(() => {
  browser.runtime.onMessage.addListener(async (m) => {
    const msg = m as Message;
    switch (msg.action) {
      case "toggle":
        return handleToggle();
      case "status":
        return isWakeLocked();
      default:
        console.warn("Received unknown message type:", msg.action);
    }
  });
});

async function handleToggle() {
  try {
    toggleWakeLock();
  } catch (err) {
    console.error("Unable to get wake lock:", err);
  }
}

async function toggleWakeLock() {
  if (WAKELOCK_HANDLE === undefined) {
    WAKELOCK_HANDLE = await navigator.wakeLock.request("screen");
    WAKELOCK_HANDLE.addEventListener("release", () => {
      WAKELOCK_HANDLE = undefined;
    });
  } else {
    await WAKELOCK_HANDLE.release();
  }
}

function isWakeLocked(): boolean {
  if (WAKELOCK_HANDLE === undefined) {
    return false;
  } else {
    return true;
  }
}
