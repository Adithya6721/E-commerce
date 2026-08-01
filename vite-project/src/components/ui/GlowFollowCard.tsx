import React, { useRef } from "react";
import { motion } from "framer-motion";

interface GlowFollowCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export default function GlowFollowCard({ children, className = "", delay = 0 }: GlowFollowCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ref.current.style.setProperty("--mouse-x", `${x}px`);
    ref.current.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ y: -6 }}
      transition={{ delay, type: "spring", stiffness: 400, damping: 25 }}
      // The outer wrapper has a 1px or 2px padding which becomes the border
      className={`group relative rounded-[2rem] bg-slate-200/50 p-[1.5px] w-full ${className}`}
    >
      {/* The invisible spotlight layer that reveals the glow on hover */}
      <div 
        className="pointer-events-none absolute inset-0 rounded-[2rem] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(350px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(255, 180, 162, 0.8), rgba(255, 215, 140, 0.5) 20%, transparent 50%)`
        }}
      />
      
      {/* The actual card content with solid background to hide the center of the glow */}
      <div className="relative h-full w-full rounded-[calc(2rem-1.5px)] bg-white/70 backdrop-blur-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
        {children}
      </div>
    </motion.div>
  );
}
