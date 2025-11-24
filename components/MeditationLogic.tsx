"use client";

import { useState, useEffect, useRef } from "react";

const MeditationLogic = () => {
  const [inputMinutes, setInputMinutes] = useState(90); // Default 2 hours
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Choose interval: 30 minutes or 60 minutes
  const [intervalMode, setIntervalMode] = useState<30 | 60>(30);

  const bellSoft = useRef<HTMLAudioElement | null>(null); // Every 30/60 min
  const bellFinal = useRef<HTMLAudioElement | null>(null); // End of session
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0); // Absolute start time (Date.now())
  const totalDurationRef = useRef<number>(0); // Total seconds
  const lastIntervalTimeRef = useRef<number>(0); // Track last interval bell time
  const wakeLockRef = useRef<WakeLockSentinel | null>(null); // Wake lock reference

  // Initialize audio only on client
  useEffect(() => {
    bellSoft.current = new Audio("/audio/ting.mp3"); // Softer bell for intervals
    bellFinal.current = new Audio("/audio/ting1.mp3"); // Louder or different for end

    // Preload + unlock audio context on first tap
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

    return () => {
      intervalRef.current && clearInterval(intervalRef.current);
    };
  }, []);

  const playSoftBell = () => bellSoft.current?.play();
  const playFinalBell = () => bellFinal.current?.play();

  // Request screen wake lock
  const requestWakeLock = async () => {
    if ("wakeLock" in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        wakeLockRef.current.addEventListener("release", () => {
          wakeLockRef.current = null;
        });
        console.log("Wake lock active");
      } catch (err) {
        console.error("Wake lock failed:", err);
        alert(
          "Unable to prevent screen sleep. Please adjust your system power settings to 'Never' during meditation."
        );
      }
    } else {
      alert(
        "Screen wake lock not supported in this browser. Adjust power settings manually."
      );
    }
  };

  // Release wake lock
  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().then(() => {
        wakeLockRef.current = null;
        console.log("Wake lock released");
      });
    }
  };

  // Reacquire wake lock on visibility change (e.g., tab switch back)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (
        document.visibilityState === "visible" &&
        isRunning &&
        !wakeLockRef.current
      ) {
        await requestWakeLock();
        // Also check for missed time after potential sleep/wake
        handleMissedEvents();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isRunning]);

  const startTimer = () => {
    if (inputMinutes < 1) return;
    const totalSeconds = inputMinutes * 60;
    setTimeLeft(totalSeconds);
    setIsRunning(true);
    startTimeRef.current = Date.now();
    totalDurationRef.current = totalSeconds;
    lastIntervalTimeRef.current = 0; // Reset interval tracker
    requestWakeLock(); // Prevent sleep
  };

  const stopTimer = () => {
    setIsRunning(false);
    setTimeLeft(0);
    intervalRef.current && clearInterval(intervalRef.current);
    releaseWakeLock(); // Allow sleep again
  };

  // Check for missed bells after sleep/wake or tab inactivity
  const handleMissedEvents = () => {
    if (!isRunning) return;
    const elapsedSeconds = Math.floor(
      (Date.now() - startTimeRef.current) / 1000
    );
    const remaining = totalDurationRef.current - elapsedSeconds;

    if (remaining <= 0) {
      // Timer should have ended during sleep
      playFinalBell();
      stopTimer();
      return;
    }

    setTimeLeft(remaining);

    // Check missed interval bells
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    const intervalMinutes = intervalMode;
    const lastIntervalMinutes = lastIntervalTimeRef.current;

    if (
      elapsedMinutes > lastIntervalMinutes &&
      elapsedMinutes % intervalMinutes === 0
    ) {
      playSoftBell();
      lastIntervalTimeRef.current =
        elapsedMinutes - (elapsedMinutes % intervalMinutes); // Update to latest multiple
    }
  };

  // Main countdown logic (runs every second, but calculates absolute time)
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      const elapsedSeconds = Math.floor(
        (Date.now() - startTimeRef.current) / 1000
      );
      const remaining = totalDurationRef.current - elapsedSeconds;

      if (remaining <= 0) {
        setTimeLeft(0);
        setIsRunning(false);
        playFinalBell();
        releaseWakeLock();
        return;
      }

      setTimeLeft(remaining);

      // Ring interval bell based on elapsed time
      const elapsedMinutes = Math.floor(elapsedSeconds / 60);
      if (
        elapsedMinutes > 0 &&
        elapsedMinutes % intervalMode === 0 &&
        elapsedMinutes !== lastIntervalTimeRef.current
      ) {
        playSoftBell();
        lastIntervalTimeRef.current = elapsedMinutes;
      }
    }, 1000);

    return () => clearInterval(intervalRef.current!);
  }, [isRunning, intervalMode]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-white to-slate-900 text-black flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl md:text-6xl font-bold mb-8  xl:text-white ">
        ဘုရား ... တရား ... သံယာ
      </h1>
      <br />

      {!isRunning ? (
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-10 max-w-md w-full shadow-2xl">
          <div className="mb-8">
            <label className="block text-2xl  mb-4">
              တရားထိုင်ချိန် သတ်မှတ်ရန် (မိနစ်)
            </label>
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
            <p className="text-xl mb-3 underline">အချိန် သတ်မှတ်ရန်</p>
            {/* <p className="text-wrap">
              အချိန်သတ်မှတ်ရန်ဆိုသည်မှာ။ ။ ၃၀ မိနစ် (သို့) ၁ နာရီ
              သတ်မှတ်ထားလျှင် သတ်မှတ်ထားသည့် မိနစ်အချိန်ရောက်တိုင်း
              ခေါင်းလောင်းသံ မြည်မှာဖြစ်ပါတယ်။
            </p> */}
            <br />
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setIntervalMode(30)}
                className={`py-4 rounded-xl text-xl font-bold transition ${
                  intervalMode === 30
                    ? "bg-green-500 text-white"
                    : "bg-white/20"
                }`}
              >
                (၃၀) မိနစ်
              </button>
              <button
                onClick={() => setIntervalMode(60)}
                className={`py-4 rounded-xl text-xl font-bold transition ${
                  intervalMode === 60
                    ? "bg-green-500 text-white"
                    : "bg-white/20"
                }`}
              >
                (၁) နာရီ
              </button>
            </div>
          </div>

          <button
            onClick={startTimer}
            className="w-full bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 py-6 rounded-2xl text-3xl font-bold shadow-lg"
          >
            စတင်မည်
          </button>
        </div>
      ) : (
        <div className="text-center">
          <div className="text-7xl md:text-9xl font-mono mb-10 tracking-wider">
            {formatTime(timeLeft)}
          </div>

          <div className="mb-10 text-xl opacity-90">
            {intervalMode === 30
              ? "မိနစ် ၃၀ ပြည့်လျှင် 🔔"
              : "၁ နာရီ ပြည့်လျှင် 🔔"}
            {timeLeft > 0 && timeLeft <= 60 && " — ကျန်ရှိသည့်အချိန်"}
            <p className="text-sm mt-2 ">
              တရားထိုင်ချိန်အတွင်း ဖုန်း (သို့) ကွန်ပျုတာ
            </p>
            <p className="text-sm mt-2 "> မှန်သားပြင်သည် ပိတ်သွားမည်မဟုတ်ပါ။</p>
            {/* User note */}
          </div>

          <button
            onClick={stopTimer}
            className="bg-red-600 hover:bg-red-700 px-12 py-6 rounded-full text-3xl font-bold shadow-2xl"
          >
            ရပ်မည်
          </button>
        </div>
      )}
    </div>
  );
};
export default MeditationLogic;
