import { useCallback, useRef } from "react";

interface Tilt3DOptions {
  maxTilt?: number;    // degrees — default 8
  perspective?: number; // px — default 1000
  scale?: number;       // hover scale — default 1.02
  speed?: number;       // transition ms — default 400
  glare?: boolean;      // show glare effect — default true
}

export function useTilt3D<T extends HTMLElement>(options: Tilt3DOptions = {}) {
  const {
    maxTilt = 8,
    perspective = 1000,
    scale = 1.02,
    speed = 400,
    glare = true,
  } = options;

  const ref = useRef<T>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<T>) => {
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -maxTilt;
      const rotateY = ((x - centerX) / centerX) * maxTilt;

      el.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`;
      el.style.transition = `transform ${speed * 0.15}ms ease-out`;

      if (glare) {
        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;
        el.style.setProperty("--glare-x", `${glareX}%`);
        el.style.setProperty("--glare-y", `${glareY}%`);
      }
    },
    [maxTilt, perspective, scale, speed, glare]
  );

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    el.style.transition = `transform ${speed}ms cubic-bezier(0.23, 0.86, 0.39, 0.96)`;
    if (glare) {
      el.style.setProperty("--glare-x", "50%");
      el.style.setProperty("--glare-y", "50%");
    }
  }, [perspective, speed, glare]);

  return { ref, handleMouseMove, handleMouseLeave };
}
