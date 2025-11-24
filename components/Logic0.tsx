// "use client";

// import { useState, useEffect, useRef } from "react";

// export default function Home() {
//   const [inputMinutes, setInputMinutes] = useState(120); // Default 2 hours
//   const [timeLeft, setTimeLeft] = useState(0);
//   const [isRunning, setIsRunning] = useState(false);

//   // Choose interval: 30 minutes or 60 minutes
//   const [intervalMode, setIntervalMode] = useState<30 | 60>(30);

//   const bellSoft = useRef<HTMLAudioElement | null>(null); // Every 30/60 min
//   const bellFinal = useRef<HTMLAudioElement | null>(null); // End of session
//   const intervalRef = useRef<NodeJS.Timeout | null>(null);
//   const startTimeRef = useRef<number>(0); // To calculate elapsed time

//   // Initialize audio only on client
//   useEffect(() => {
//     bellSoft.current = new Audio("/audio/ting.mp3"); // Softer bell for intervals
//     bellFinal.current = new Audio("/audio/ting1.mp3"); // Louder or different for end

//     // Preload + unlock audio context on first tap
//     const unlock = () => {
//       bellSoft.current
//         ?.play()
//         .then(() => bellSoft.current?.pause())
//         .catch(() => {});
//       bellFinal.current
//         ?.play()
//         .then(() => bellFinal.current?.pause())
//         .catch(() => {});
//       document.removeEventListener("touchstart", unlock);
//       document.removeEventListener("click", unlock);
//     };
//     document.addEventListener("touchstart", unlock);
//     document.addEventListener("click", unlock);

//     return () => {
//       intervalRef.current && clearInterval(intervalRef.current);
//     };
//   }, []);

//   const playSoftBell = () => bellSoft.current?.play();
//   const playFinalBell = () => bellFinal.current?.play();

//   const startTimer = () => {
//     if (inputMinutes < 1) return;
//     setTimeLeft(inputMinutes * 60);
//     setIsRunning(true);
//     startTimeRef.current = Date.now();
//   };

//   const stopTimer = () => {
//     setIsRunning(false);
//     setTimeLeft(0);
//     intervalRef.current && clearInterval(intervalRef.current);
//   };

//   // Main countdown + interval bell logic
//   useEffect(() => {
//     if (!isRunning || timeLeft <= 0) return;

//     intervalRef.current = setInterval(() => {
//       setTimeLeft((prev) => {
//         const newTime = prev - 1;

//         // Calculate elapsed minutes
//         const elapsedSeconds = inputMinutes * 60 - newTime;
//         const elapsedMinutes = Math.floor(elapsedSeconds / 60);

//         // Ring bell every 30 or 60 minutes
//         if (
//           intervalMode === 30 &&
//           elapsedMinutes > 0 &&
//           elapsedMinutes % 30 === 0 &&
//           newTime % 60 === 59
//         ) {
//           playSoftBell();
//         }
//         if (
//           intervalMode === 60 &&
//           elapsedMinutes > 0 &&
//           elapsedMinutes % 60 === 0 &&
//           newTime % 60 === 59
//         ) {
//           playSoftBell();
//         }

//         // Final bell when timer ends
//         if (newTime <= 0) {
//           setIsRunning(false);
//           playFinalBell();
//           return 0;
//         }

//         return newTime;
//       });
//     }, 1000);

//     return () => clearInterval(intervalRef.current!);
//   }, [isRunning, timeLeft, intervalMode, inputMinutes]);

//   const formatTime = (seconds: number) => {
//     const h = Math.floor(seconds / 3600);
//     const m = Math.floor((seconds % 3600) / 60);
//     const s = seconds % 60;
//     return `${h.toString().padStart(2, "0")}:${m
//       .toString()
//       .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
//   };

//   return (
//     <div className="min-h-screen  text-white flex flex-col items-center justify-center p-6">
//       {/* <div className="min-h-screen bg-linear-0 from-purple-900 via-blue-900 to-indigo-900 text-white flex flex-col items-center justify-center p-6"> */}
//       <h1 className="text-5xl md:text-6xl font-bold mb-8">Meditation Timer</h1>

//       {!isRunning ? (
//         <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-10 max-w-md w-full shadow-2xl">
//           <div className="mb-8">
//             <label className="block text-2xl mb-4">
//               Set Meditation Timer (minutes)
//             </label>
//             <input
//               type="number"
//               value={inputMinutes}
//               onChange={(e) =>
//                 setInputMinutes(Math.max(1, Number(e.target.value)))
//               }
//               className="w-full p-5 text-4xl text-center text-white rounded-xl font-mono"
//               placeholder="120"
//             />
//           </div>

//           <div className="mb-8">
//             <p className="text-xl mb-3">To Ring Bell Every</p>
//             <div className="grid grid-cols-2 gap-4">
//               <button
//                 onClick={() => setIntervalMode(30)}
//                 className={`py-4 rounded-xl text-xl font-bold transition ${
//                   intervalMode === 30
//                     ? "bg-green-500 text-white"
//                     : "bg-white/20"
//                 }`}
//               >
//                 30 minutes
//               </button>
//               <button
//                 onClick={() => setIntervalMode(60)}
//                 className={`py-4 rounded-xl text-xl font-bold transition ${
//                   intervalMode === 60
//                     ? "bg-green-500 text-white"
//                     : "bg-white/20"
//                 }`}
//               >
//                 1 hour
//               </button>
//             </div>
//           </div>

//           <button
//             onClick={startTimer}
//             className="w-full bg-linear-0 from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 py-6 rounded-2xl text-3xl font-bold shadow-lg"
//           >
//             Start Meditating
//           </button>
//         </div>
//       ) : (
//         <div className="text-center">
//           <div className="text-8xl md:text-9xl font-mono mb-10 tracking-wider">
//             {formatTime(timeLeft)}
//           </div>

//           <div className="mb-10 text-xl opacity-90">
//             {intervalMode === 30 ? "🔔 Every 30 minutes" : "🔔 Every 1 hour"}
//             {timeLeft > 0 && timeLeft <= 60 && " — Ending soon"}
//           </div>

//           <button
//             onClick={stopTimer}
//             className="bg-red-600 hover:bg-red-700 px-12 py-6 rounded-full text-3xl font-bold shadow-2xl"
//           >
//             Stop
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }
