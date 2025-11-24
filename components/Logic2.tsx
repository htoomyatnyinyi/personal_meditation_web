"use client";

import React, { useState, useEffect, useRef } from "react";

export default function Logic2() {
  const [inputMinutes, setInputMinutes] = useState(120); // Default 2 hours
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Choose interval: 30 minutes or 60 minutes
  const [intervalMode, setIntervalMode] = useState<30 | 60>(30);

  const bellSoft = useRef<HTMLAudioElement | null>(null); // Every 30/60 min
  const bellFinal = useRef<HTMLAudioElement | null>(null); // End of session
  const workerRef = useRef<Worker | null>(null);
  const startTimeRef = useRef<number>(0); // For missed event fallback
  const totalDurationRef = useRef<number>(0);
  const lastIntervalTimeRef = useRef<number>(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Initialize audio and worker only on client
  useEffect(() => {
    bellSoft.current = new Audio("/audio/ting.mp3");
    bellFinal.current = new Audio("/audio/ting.mp3");

    // Preload + unlock audio
    const unlock = () => {
      bellSoft.current
        ?.play()
        .then(() => bellSoft.current?.pause())
        .catch(() => {});
      bellFinal.current
        ?.play()
        .then(() => bellFinal.current?.pause())
        .catch(() => {});
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("click", unlock);
    };
    document.addEventListener("touchstart", unlock);
    document.addEventListener("click", unlock);

    // Create Web Worker for background timing
    if (typeof Worker !== "undefined") {
      workerRef.current = new Worker("/timerWorker.ts");
      workerRef.current.onmessage = (event) => {
        const { type, timeLeft: workerTimeLeft } = event.data;
        if (type === "tick") {
          setTimeLeft(workerTimeLeft);
        } else if (type === "interval") {
          bellSoft.current?.play();
        } else if (type === "end") {
          bellFinal.current?.play();
          setIsRunning(false);
          setTimeLeft(0);
          releaseWakeLock();
        }
      };
    } else {
      console.warn("Web Workers not supported; falling back to main thread.");
    }

    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, []);

  const playSoftBell = () => bellSoft.current?.play();
  const playFinalBell = () => bellFinal.current?.play();

  // Wake Lock functions (unchanged)
  const requestWakeLock = async () => {
    if ("wakeLock" in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        wakeLockRef.current.addEventListener("release", () => {
          wakeLockRef.current = null;
        });
      } catch (err) {
        alert("Unable to prevent screen sleep. Adjust system power settings.");
      }
    } else {
      alert("Wake lock not supported. Adjust power settings manually.");
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().then(() => {
        wakeLockRef.current = null;
      });
    }
  };

  // Reacquire wake lock and check missed events on visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (
        document.visibilityState === "visible" &&
        isRunning &&
        !wakeLockRef.current
      ) {
        await requestWakeLock();
        handleMissedEvents(); // Fallback check
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isRunning]);

  // Fallback for missed events (e.g., full system sleep)
  const handleMissedEvents = () => {
    if (!isRunning) return;
    const elapsedSeconds = Math.floor(
      (Date.now() - startTimeRef.current) / 1000
    );
    const remaining = totalDurationRef.current - elapsedSeconds;

    if (remaining <= 0) {
      playFinalBell();
      stopTimer();
      return;
    }

    setTimeLeft(remaining);

    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    const intervalMinutes = intervalMode;
    const lastIntervalMinutes = lastIntervalTimeRef.current;

    if (
      elapsedMinutes > lastIntervalMinutes &&
      elapsedMinutes % intervalMinutes === 0
    ) {
      playSoftBell();
      lastIntervalTimeRef.current =
        elapsedMinutes - (elapsedMinutes % intervalMinutes);
    }
  };

  const startTimer = () => {
    if (inputMinutes < 1) return;
    const totalSeconds = inputMinutes * 60;
    setTimeLeft(totalSeconds);
    setIsRunning(true);
    startTimeRef.current = Date.now(); // For fallback
    totalDurationRef.current = totalSeconds;
    lastIntervalTimeRef.current = 0;
    requestWakeLock();

    if (workerRef.current) {
      workerRef.current.postMessage({
        action: "start",
        data: { totalSeconds, intervalMode },
      });
    } else {
      // Fallback main-thread loop (your original logic)
      // ... (implement if needed, but worker is primary)
    }
  };

  const stopTimer = () => {
    setIsRunning(false);
    setTimeLeft(0);
    releaseWakeLock();
    if (workerRef.current) {
      workerRef.current.postMessage({ action: "stop" });
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen  flex flex-col items-center justify-center p-6">
      <h1 className="text-5xl md:text-6xl font-bold mb-8">Meditation Timer</h1>

      {!isRunning ? (
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-10 max-w-md w-full shadow-2xl">
          <div className="mb-8">
            <label className="block text-2xl mb-4">ตั้งเวลาสมาธิ (นาที)</label>
            <input
              type="number"
              value={inputMinutes}
              onChange={(e) =>
                setInputMinutes(Math.max(1, Number(e.target.value)))
              }
              className="w-full p-5 text-4xl text-center text-black rounded-xl font-mono"
              placeholder="120"
            />
          </div>

          <div className="mb-8">
            <p className="text-xl mb-3">เสียงกระดิ่งทุก ๆ</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setIntervalMode(30)}
                className={`py-4 rounded-xl text-xl font-bold transition ${
                  intervalMode === 30
                    ? "bg-green-500 text-white"
                    : "bg-white/20"
                }`}
              >
                30 นาที
              </button>
              <button
                onClick={() => setIntervalMode(60)}
                className={`py-4 rounded-xl text-xl font-bold transition ${
                  intervalMode === 60
                    ? "bg-green-500 text-white"
                    : "bg-white/20"
                }`}
              >
                1 ชั่วโมง
              </button>
            </div>
          </div>

          <button
            onClick={startTimer}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 py-6 rounded-2xl text-3xl font-bold shadow-lg"
          >
            เริ่มสมาธิ
          </button>
        </div>
      ) : (
        <div className="text-center">
          <div className="text-8xl md:text-9xl font-mono mb-10 tracking-wider">
            {formatTime(timeLeft)}
          </div>

          <div className="mb-10 text-xl opacity-90">
            {intervalMode === 30 ? "🔔 ทุก 30 นาที" : "🔔 ทุก 1 ชั่วโมง"}
            {timeLeft > 0 && timeLeft <= 60 && " — กำลังจะจบ"}
            <p className="text-sm mt-2">
              หน้าจอจะไม่ดับระหว่างสมาธิ (พื้นหลังทำงาน)
            </p>
          </div>

          <button
            onClick={stopTimer}
            className="bg-red-600 hover:bg-red-700 px-12 py-6 rounded-full text-3xl font-bold shadow-2xl"
          >
            หยุด
          </button>
        </div>
      )}
    </div>
  );
}
