<script lang="ts" setup>

onMounted(async () => {
  enabled.value = await browser.runtime.sendMessage({
    action: "getAutoRelease",
  });

  const releaseTimeNum = await browser.runtime.sendMessage({
    action: "getReleaseTime",
  });

  if (releaseTimeNum !== undefined) {
    const hour = Math.floor(releaseTimeNum / 60).toString().padStart(2, "0");
    const minute = (releaseTimeNum % 60).toString().padStart(2, "0");
    const time = `${hour}:${minute}`;

    releaseTime.value = time;
  }
});

const enabled = ref(false);
const releaseTime: Ref<string | undefined> = ref(undefined);

watch(enabled, async (isEnabled) => {
  browser.runtime.sendMessage({
    action: "setAutoRelease",
    enable: isEnabled,
  });
});

watch(releaseTime, async (releaseTime) => {
  console.log(releaseTime);
  dUpdateReleaseTime(releaseTime);
});

function debounce(f: Function, delay: number) {
  let timeout: number | undefined;
  return function(...args: any[]) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      f(...args);
    }, delay) as unknown as number;
  };
}

function updateRelaseTime(releaseTime: string | undefined) {
  if (typeof releaseTime !== "string") {
    return;
  }

  // Make sure this fits the form we expect
  const [hourStr, minuteStr] = releaseTime.split(":");
  if (typeof hourStr !== "string" || typeof minuteStr !== "string") {
    return;
  }

  const hour = parseInt(hourStr);
  const minute = parseInt(minuteStr);
  if (isNaN(hour) || isNaN(minute)) {
    return;
  }

  console.log("sending setReleaseTime");
  browser.runtime.sendMessage({
    action: "setReleaseTime",
    time: hour * 60 + minute,
  });
}

const dUpdateReleaseTime = debounce(updateRelaseTime, 500);

</script>

<template>
  <input type="checkbox" name="enable" id="enable" v-model="enabled">
  <label for="enable">Release automatically</label>
  <div v-if="enabled">
    <input type="time" name="release-time" id="release-time" v-model="releaseTime">
  </div>
</template>
