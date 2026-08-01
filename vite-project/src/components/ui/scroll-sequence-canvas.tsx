import React, { useRef, useEffect, useState } from "react";
import { useScroll, useTransform, motion } from "framer-motion";

interface ScrollSequenceCanvasProps {
  frameCount: number;
  imagePathLoader: (index: number) => string;
  className?: string;
}

export const ScrollSequenceCanvas: React.FC<ScrollSequenceCanvasProps> = ({
  frameCount,
  imagePathLoader,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [loaded, setLoaded] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Preload images
  useEffect(() => {
    let isMounted = true;
    const preloadImages = async () => {
      const loadedImages: HTMLImageElement[] = [];
      for (let i = 0; i < frameCount; i++) {
        const img = new Image();
        img.src = imagePathLoader(i + 1); // 1-indexed assuming 001.jpg etc.
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve; // Continue even if one fails
        });
        if (!isMounted) return;
        loadedImages.push(img);
        setLoaded(i + 1);
      }
      setImages(loadedImages);
    };
    preloadImages();
    return () => {
      isMounted = false;
    };
  }, [frameCount, imagePathLoader]);

  // Map scroll progress (0-0.8) to an index in the images array (0-159)
  // This leaves the last 20% of the scroll for the final high-res image to fade in and rest
  const frameIndex = useTransform(scrollYProgress, [0, 0.8], [0, frameCount - 1]);

  useEffect(() => {
    if (images.length === 0 || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // A function to render the current frame
    const render = (index: number) => {
      // Math.min ensures we don't go out of bounds if scroll goes past 0.8
      const img = images[Math.min(Math.floor(index), images.length - 1)];
      if (!img) return;
      
      // Calculate responsive dimensions
      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      const ratio = Math.max(hRatio, vRatio);
      const centerShift_x = (canvas.width - img.width * ratio) / 2;
      const centerShift_y = (canvas.height - img.height * ratio) / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        img,
        0, 0, img.width, img.height,
        centerShift_x, centerShift_y, img.width * ratio, img.height * ratio
      );
    };

    // Render the initial frame
    render(0);

    // Subscribe to scroll changes and re-render
    const unsubscribe = frameIndex.on("change", (v) => render(v));
    return () => unsubscribe();
  }, [images, frameIndex]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative" }} className={`h-[300vh] w-full bg-slate-950 relative ${className || ""}`}>
      {loaded < frameCount && (
        <div className="sticky top-0 h-screen w-full flex items-center justify-center text-slate-500 z-10 pointer-events-none">
          Loading 3D Sequence... {Math.round((loaded / frameCount) * 100)}%
        </div>
      )}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover"
        />

        {/* Optional overlay gradient for smooth blending */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-transparent to-slate-950/80 pointer-events-none" />
      </div>
    </div>
  );
};
