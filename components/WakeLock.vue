<script lang="ts" setup>
import { ref } from 'vue';
import lock_open from '~/assets/lock_open.png';
import lock_closed from '~/assets/lock_closed.png';

const WAKELOCK_ACQUIRE = "Acquire wakelock";
const WAKELOCK_RELEASE = "Release wakelock";

// Check wake lock status on page load
onMounted(() => {
  updateLockStatus();
});

// Check wake lock status every so often in case it got dropped
let UPDATE_INTERVAL = window.setInterval(updateLockStatus, 1000);

const hasWakelock: Ref<boolean> = ref(false);

const buttonText: Ref<string> = computed(() => {
  if (hasWakelock.value) {
    return WAKELOCK_RELEASE;
  } else {
    return WAKELOCK_ACQUIRE;
  }
});

const imgSrc: Ref<string> = computed(() => {
  if (hasWakelock.value) {
    return lock_closed;
  } else {
    return lock_open;
  }
});
const imgAlt: Ref<string> = computed(() => {
  if (hasWakelock.value) {
    return "A closed and locked padlock.";
  } else {
    return "An open and unlocked padlock.";
  }
});

async function toggleWakelock() {
  // Temporarily cancel the update loop to prevent flickering icons
  window.clearInterval(UPDATE_INTERVAL);

  hasWakelock.value = !hasWakelock.value;
  await browser.runtime.sendMessage({
    action: "toggle",
  });

  // Restart the update loop
  UPDATE_INTERVAL = window.setInterval(updateLockStatus, 1000);
}

async function updateLockStatus() {
  hasWakelock.value = await isWakeLocked();
}

async function isWakeLocked(): Promise<boolean> {
  return browser.runtime.sendMessage({
    action: "status",
  });
}

</script>

<template>
  <div>
    <img :src=imgSrc :alt=imgAlt width="100">
  </div>
  <div>
    <button @click="toggleWakelock">{{ buttonText }}</button>
  </div>
  <p class="icon8">
    <a target="_blank" href="https://icons8.com/icon/sPUcnHvQaL0L/padlock" class="">Padlock</a> icon
    by <a target="_blank" href="https://icons8.com">Icons8</a>
  </p>
</template>

<style scoped>
  .icon8 {
    font-size: x-small;
    margin: 0.25em;
  }
</style>
