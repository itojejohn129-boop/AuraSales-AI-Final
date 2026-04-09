"use client";

import { motion } from "framer-motion";

interface SoundWaveProps {
  isPlaying?: boolean;
}

export default function SoundWave({ isPlaying = true }: SoundWaveProps) {
  const waveVariants = {
    initial: { scaleX: 0.8, opacity: 0.6 },
    animate: { scaleX: 1.2, opacity: 0 },
  };

  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1 h-6 bg-gradient-to-t from-blue-400 to-blue-600 rounded-full"
          variants={waveVariants}
          initial="initial"
          animate={isPlaying ? "animate" : "initial"}
          transition={{
            duration: 0.6,
            delay: i * 0.1,
            repeat: isPlaying ? Infinity : 0,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
