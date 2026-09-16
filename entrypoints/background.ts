let WAKELOCK_HANDLE: WakeLockSentinel | undefined = undefined;

interface Message {
  action: string,
};

interface SetReleaseTimeMessage extends Message {
  time: number,
}

interface SetAutoRelease extends Message {
  enable: boolean,
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener(async (m) => {
    const msg = m as Message;
    switch (msg.action) {
      case "toggle":
        return handleToggle();
      case "status":
        return isWakeLocked();
      case "getAutoRelease":
        return handleGetAutoRelease();
      case "setAutoRelease":
        return handleSetAutoRelease(msg);
      case "getReleaseTime":
        return handleGetReleaseTime();
      case "setReleaseTime":
        return handleSetReleaseTime(msg);
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

async function handleGetAutoRelease(): Promise<boolean> {
  const isEnabled = (await browser.storage.local.get("isAutoReleaseEnabled")).isAutoReleaseEnabled;

  if (typeof isEnabled === "boolean") {
    return isEnabled;
  }
  return false;
}

function handleSetAutoRelease(m: Message) {
  if (!("enable" in m)) {
    return;
  }

  const msg: SetAutoRelease = m as SetAutoRelease;

  browser.storage.local.set({
    isAutoReleaseEnabled: msg.enable,
  });
}

async function handleGetReleaseTime(): Promise<number | undefined> {
  const autoReleaseTime = (await browser.storage.local.get("autoReleaseTime")).autoReleaseTime;
  if (typeof autoReleaseTime === "number") {
    return autoReleaseTime;
  }
  return undefined;
}

function handleSetReleaseTime(m: Message) {
  // Make sure this is a SetReleaseTimeMessage
  if (!("time" in m)) {
    return;
  }

  const msg: SetReleaseTimeMessage = m as SetReleaseTimeMessage;
  
  browser.storage.local.set({
    autoReleaseTime: msg.time
  });
}

async function checkAutoRelease() {
  console.log("checkAutoRelease");
  let now = getMinuteTimestamp(new Date());

  // Get the last time we checked, then update it
  const lastCheckTime = (await browser.storage.local.get("lastCheckTime")).lastCheckTime;
  browser.storage.local.set({
    lastCheckTime: now,
  });
  if (typeof lastCheckTime !== "number") {
    return;
  }

  // If we aren't wakelocked, don't need to do anything
  if (WAKELOCK_HANDLE === undefined) {
    return;
  }

  // Check if automatic release is enabled
  const isAutoReleaseEnabled = (await browser.storage.local.get("isAutoReleaseEnabled"))
    .isAutoReleaseEnabled;
  if (isAutoReleaseEnabled !== true) {
    return;
  }

  // Get the scheduled automatic release time
  const autoReleaseTime = (await browser.storage.local.get("autoReleaseTime")).autoReleaseTime;
  if (typeof autoReleaseTime !== "number") {
    return;
  }

  // If midnight has happened since we last checked, now will be very small and lastCheckTime will
  // be very large. Shift now over 24 hours to make the comparison logic still work.
  if (now > lastCheckTime) {
    now += 24 * 60;
  }

  // If the release time has passed since we last checked, release wakelock
  if (lastCheckTime <= autoReleaseTime && autoReleaseTime <= now) {
    WAKELOCK_HANDLE.release();
  } 
}

function getMinuteTimestamp(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

setInterval(checkAutoRelease, 60_000);
