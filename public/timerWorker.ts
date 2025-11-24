// timerWorker.js (accurate background timing)
let startTime = 0;
let totalDuration = 0;
let intervalMode = 30; // minutes
let lastIntervalMinutes = 0;

self.onmessage = (event) => {
  const { action, data } = event.data;

  if (action === "start") {
    startTime = Date.now();
    totalDuration = data.totalSeconds;
    intervalMode = data.intervalMode;
    lastIntervalMinutes = 0;
    timingLoop();
  } else if (action === "stop") {
    startTime = 0;
    totalDuration = 0;
  }
};

function timingLoop() {
  const loop = () => {
    if (totalDuration <= 0) return;

    const elapsedMs = Date.now() - startTime;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    const timeLeft = totalDuration - elapsedSeconds;

    if (timeLeft <= 0) {
      self.postMessage({ type: "end" });
      return;
    }

    // Send tick update (e.g., every second)
    self.postMessage({ type: "tick", timeLeft });

    // Check for interval bell
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    if (
      elapsedMinutes > lastIntervalMinutes &&
      elapsedMinutes % intervalMode === 0
    ) {
      self.postMessage({ type: "interval" });
      lastIntervalMinutes = elapsedMinutes;
    }

    // Accurate recursive timeout (better than setInterval for precision)
    setTimeout(loop, 1000 - (elapsedMs % 1000)); // Align to next second boundary
  };

  loop();
}
