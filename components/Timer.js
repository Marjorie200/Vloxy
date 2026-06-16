"use client";

import { motion } from "framer-motion";

export default function Timer({ secondsLeft, totalSeconds }) {
  const progress = Math.max(0, secondsLeft / totalSeconds);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const display = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const isLow = secondsLeft <= 10;

  return (
    <div className="relative w-44 h-44 flex items-center justify-center">
      <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 160 160">
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="10"
        />
        <motion.circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={isLow ? "#f43f5e" : "#22D3EE"}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transition={{ duration: 0.5, ease: "linear" }}
          style={{
            filter: isLow
              ? "drop-shadow(0 0 8px #f43f5e)"
              : "drop-shadow(0 0 8px #22D3EE)",
          }}
        />
      </svg>
      <motion.div
        animate={isLow ? { scale: [1, 1.15, 1] } : {}}
        transition={{ duration: 0.6, repeat: isLow ? Infinity : 0 }}
        className={`text-4xl font-bold tabular-nums ${
          isLow ? "text-rose-400" : "text-white"
        }`}
      >
        {display}
      </motion.div>
    </div>
  );
}
