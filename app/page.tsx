"use client";

import { useState, useEffect, useRef } from "react";

type MeditationTrack = {
  id: string;
  title: string;
  duration: string;
  file: string;
};

const guidedTracks: MeditationTrack[] = [
  {
    id: "1",
    title: "Violin Relaxing Music (10 min)",
    duration: "10:00",
    file: "/audio/violin.mp3",
  },
  {
    id: "2",
    title: "Mindfulness of Body (20 min)",
    duration: "20:00",
    file: "/audio/violin.mp3",
  },
  {
    id: "3",
    title: "Loving-Kindness (15 min)",
    duration: "15:00",
    file: "/audio/violin.mp3",
  },
  {
    id: "4",
    title: "Full Body Scan (30 min)",
    duration: "30:00",
    file: "/audio/violin.mp3",
  },
  {
    id: "5",
    title: "สมาธิสำหรับผู้เริ่มต้น (10 นาที)",
    duration: "10:00",
    file: "/audio/violin.mp3",
  },
];

export default function Home() {
  const [mode, setMode] = useState<"silent" | "guided">("silent");
  const [selectedTrack, setSelectedTrack] = useState<MeditationTrack | null>(
    null
  );
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [inputMinutes, setInputMinutes] = useState(20);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bellRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load audio instances
  useEffect(() => {
    bellRef.current = new Audio("/audio/ting.mp3");
    return () => {
      intervalRef.current && clearInterval(intervalRef.current);
    };
  }, []);

  // Countdown logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            setIsRunning(false);
            bellRef.current?.play();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      intervalRef.current && clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);

  const startSilentTimer = () => {
    if (inputMinutes > 0) {
      setTimeLeft(inputMinutes * 60);
      setIsRunning(true);
      setMode("silent");
    }
  };

  const startGuided = (track: MeditationTrack) => {
    setSelectedTrack(track);
    setMode("guided");
    setTimeLeft(Math.round(parseInt(track.duration.split(":")[0])) * 60); // rough estimate
    setIsRunning(true);

    audioRef.current = new Audio(track.file);
    audioRef.current.play();

    audioRef.current.onended = () => {
      bellRef.current?.play();
      setIsRunning(false);
    };
  };

  const stopEverything = () => {
    setIsRunning(false);
    audioRef.current?.pause();
    intervalRef.current && clearInterval(intervalRef.current);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen  text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl md:text-5xl font-bold mb-10">Meditation Timer</h1>

      {/* Mode Switch */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setMode("silent")}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            mode === "silent" ? "bg-white text-indigo-900" : "bg-white/20"
          }`}
        >
          Silent Timer
        </button>
        <button
          onClick={() => setMode("guided")}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            mode === "guided" ? "bg-white text-indigo-900" : "bg-white/20"
          }`}
        >
          Guided Session
        </button>
      </div>

      {/* Silent Timer Mode */}
      {mode === "silent" && !isRunning && (
        <div className="bg-white/10 backdrop-blur rounded-2xl p-8 max-w-sm w-full">
          <label className="block text-xl mb-4">
            Set duration (minutes)
            <input
              type="number"
              min="1"
              value={inputMinutes}
              onChange={(e) => setInputMinutes(Number(e.target.value))}
              className="mt-2 w-full p-3 text-sky-500 rounded text-center text-2xl"
            />
          </label>
          <button
            onClick={startSilentTimer}
            className="w-full mt-4 bg-green-500 hover:bg-green-400 py-4 rounded-xl text-xl font-bold"
          >
            Start Meditation
          </button>
        </div>
      )}

      {/* Guided Mode - Track Selection */}
      {mode === "guided" && !isRunning && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
          {guidedTracks.map((track) => (
            <button
              key={track.id}
              onClick={() => startGuided(track)}
              className="bg-white/10 hover:bg-white/20 backdrop-blur p-6 rounded-2xl text-left transition"
            >
              <h3 className="font-bold text-lg">{track.title}</h3>
              <p className="text-sm opacity-80">{track.duration}</p>
            </button>
          ))}
        </div>
      )}

      {/* Active Timer Display */}
      {isRunning && (
        <div className="text-center">
          <div className="text-8xl font-mono mb-10">{formatTime(timeLeft)}</div>
          {mode === "guided" && selectedTrack && (
            <p className="text-xl mb-4">Now playing: {selectedTrack.title}</p>
          )}
          <button
            onClick={stopEverything}
            className="bg-red-600 hover:bg-red-500 px-10 py-5 rounded-full text-2xl font-bold"
          >
            Stop
          </button>
        </div>
      )}
    </div>
  );
}

// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
//       <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
//         <Image
//           className="dark:invert"
//           src="/next.svg"
//           alt="Next.js logo"
//           width={100}
//           height={20}
//           priority
//         />
//         <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
//           <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
//             To get started, edit the page.tsx file.
//           </h1>
//           <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
//             Looking for a starting point or more instructions? Head over to{" "}
//             <a
//               href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Templates
//             </a>{" "}
//             or the{" "}
//             <a
//               href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Learning
//             </a>{" "}
//             center.
//           </p>
//         </div>
//         <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
//           <a
//             className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
//             href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               className="dark:invert"
//               src="/vercel.svg"
//               alt="Vercel logomark"
//               width={16}
//               height={16}
//             />
//             Deploy Now
//           </a>
//           <a
//             className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
//             href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Documentation
//           </a>
//         </div>
//       </main>
//     </div>
//   );
// }
