"use client";

import { motion, useAnimation } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Prize } from "@/types/database";
import { WHEEL_COLORS } from "@/lib/constants";

interface SpinWheelProps {
  prizes: Prize[];
  onSpinComplete: (prizeIndex: number) => void;
  spinning: boolean;
  targetIndex: number | null;
  disabled?: boolean;
}

export default function SpinWheel({
  prizes,
  onSpinComplete,
  spinning,
  targetIndex,
  disabled = false,
}: SpinWheelProps) {
  const controls = useAnimation();
  const [currentRotation, setCurrentRotation] = useState(0);
  const segmentAngle = 360 / prizes.length;
  const lastTickAngle = useRef(currentRotation);

  const playTickSound = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
      
      if (navigator.vibrate) {
        navigator.vibrate(15);
      }
    } catch (e) {
      // Ignore audio context errors
    }
  }, []);

  // Calculate segment paths for SVG
  const segments = useMemo(() => {
    const radius = 170;
    const center = 200;

    return prizes.map((prize, i) => {
      const startAngle = i * segmentAngle - 90; // Start from top
      const endAngle = startAngle + segmentAngle;
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);

      const largeArc = segmentAngle > 180 ? 1 : 0;

      const path = `M${center},${center} L${x1},${y1} A${radius},${radius} 0 ${largeArc} 1 ${x2},${y2} Z`;

      // Text position (center of segment)
      const midAngle = ((startAngle + endAngle) / 2) * (Math.PI / 180);
      const textRadius = radius * 0.62;
      const textX = center + textRadius * Math.cos(midAngle);
      const textY = center + textRadius * Math.sin(midAngle);
      const textRotation = (startAngle + endAngle) / 2;

      return {
        path,
        color: WHEEL_COLORS[i % WHEEL_COLORS.length],
        prize,
        textX,
        textY,
        textRotation,
      };
    });
  }, [prizes, segmentAngle]);

  // Spin animation
  const spinWheel = useCallback(async () => {
    if (targetIndex === null || !spinning) return;

    // Calculate target rotation:
    // We want the wheel to land so that targetIndex segment is at the top (pointer position)
    // The pointer is at the top (12 o'clock position = 0 degrees)
    // Each segment starts at (index * segmentAngle - 90)
    // To land on the middle of the target segment:
    const targetSegmentCenter = targetIndex * segmentAngle + segmentAngle / 2;
    // We need to rotate BACKWARDS (clockwise) so the target lands at top
    // Full rotations + offset to land correctly
    const fullRotations = 5 + Math.floor(Math.random() * 3); // 5-7 full spins
    const targetRotation =
      currentRotation + fullRotations * 360 + (360 - targetSegmentCenter);

    lastTickAngle.current = currentRotation;

    await controls.start({
      rotate: targetRotation,
      transition: {
        duration: 5,
        ease: [0.2, 0.8, 0.3, 1], // Custom ease: fast start, suspenseful slowdown
      },
    });

    setCurrentRotation(targetRotation);
    onSpinComplete(targetIndex);
  }, [
    targetIndex,
    spinning,
    segmentAngle,
    currentRotation,
    controls,
    onSpinComplete,
  ]);

  useEffect(() => {
    if (spinning && targetIndex !== null) {
      spinWheel();
    }
  }, [spinning, targetIndex, spinWheel]);

  return (
    <div className="relative w-[340px] h-[340px] sm:w-[380px] sm:h-[380px] md:w-[420px] md:h-[420px]">
      {/* Outer glow ring */}
      <div className="absolute inset-[-12px] rounded-full animate-pulse-glow" />

      {/* Outer border ring */}
      <div
        className="absolute inset-[-6px] rounded-full"
        style={{
          background:
            "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary), var(--accent-primary))",
          padding: "3px",
        }}
      >
        <div className="w-full h-full rounded-full bg-[var(--bg-primary)]" />
      </div>

      {/* Pointer / Indicator at top */}
      <div className="absolute top-[-18px] left-1/2 -translate-x-1/2 z-20">
        <div
          className="w-0 h-0"
          style={{
            borderLeft: "14px solid transparent",
            borderRight: "14px solid transparent",
            borderTop: "24px solid var(--accent-primary)",
            filter:
              "drop-shadow(0 0 8px rgba(var(--accent-primary-rgb), 0.8))",
          }}
        />
      </div>

      {/* Wheel SVG */}
      <motion.div
        animate={controls}
        onUpdate={(latest) => {
          if (typeof latest.rotate === "number") {
            const currentSegment = Math.floor(latest.rotate / segmentAngle);
            const lastSegment = Math.floor(lastTickAngle.current / segmentAngle);
            if (currentSegment > lastSegment) {
              playTickSound();
              lastTickAngle.current = latest.rotate;
            }
          }
        }}
        className="w-full h-full"
        style={{ transformOrigin: "center center" }}
      >
        <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-2xl">
          {/* Segments */}
          {segments.map((seg, i) => (
            <g key={i}>
              <path
                d={seg.path}
                fill={seg.color}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
              />
              {/* Prize text */}
              <text
                x={seg.textX}
                y={seg.textY}
                transform={`rotate(${seg.textRotation}, ${seg.textX}, ${seg.textY})`}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="11"
                fontWeight="700"
                fontFamily="'Satoshi', sans-serif"
                className="select-none"
              >
                {seg.prize.title.length > 12
                  ? seg.prize.title.substring(0, 12) + "…"
                  : seg.prize.title}
              </text>
            </g>
          ))}

          {/* Center hub */}
          <circle
            cx="200"
            cy="200"
            r="28"
            fill="var(--bg-primary)"
            stroke="var(--accent-primary)"
            strokeWidth="3"
          />
          <circle cx="200" cy="200" r="18" fill="var(--accent-primary)" />
          <text
            x="200"
            y="201"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="10"
            fontWeight="900"
            fontFamily="'Satoshi', sans-serif"
          >
            SB
          </text>
        </svg>
      </motion.div>

      {/* Disabled overlay */}
      {disabled && (
        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center z-10">
          <p className="text-white/70 text-sm font-medium">No spins left</p>
        </div>
      )}
    </div>
  );
}
