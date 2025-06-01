import { motion } from "framer-motion";
import React from "react";

const CustomConfetti = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* More particles for a richer effect */}
      {[...Array(100)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute ${
            Math.random() > 0.7
              ? "w-3 h-8 rounded-full"
              : "w-2 h-2 rounded-full"
          }`}
          initial={{
            top: "50%",
            left: "50%",
            scale: 0,
            opacity: 1,
            backgroundColor: [
              "#FF0000",
              "#00FF00",
              "#0000FF",
              "#FFFF00",
              "#FF00FF",
              "#00FFFF",
              "#FFFFFF",
              "#FFA500",
            ][Math.floor(Math.random() * 8)],
          }}
          animate={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            scale: [0, 1 + Math.random(), 0.5],
            opacity: [1, 1, 0],
            rotate: Math.random() * 360 * (Math.random() > 0.5 ? 1 : -1),
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            ease: "easeOut",
            delay: Math.random() * 0.5,
          }}
        />
      ))}

      {/* Add some glowing orbs */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute rounded-full blur-md"
          style={{
            width: `${20 + Math.random() * 30}px`,
            height: `${20 + Math.random() * 30}px`,
            background: `radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)`,
          }}
          initial={{
            top: "50%",
            left: "50%",
            scale: 0,
            opacity: 0.7,
          }}
          animate={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            scale: [0, 3 + Math.random() * 2, 0],
            opacity: [0.7, 0.5, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            ease: "easeOut",
            delay: Math.random() * 0.5,
          }}
        />
      ))}
    </div>
  );
};

export default CustomConfetti;
