import { useEffect } from "react";
import { motion } from "motion/react";
import { useTypewriter } from "./useTypewriter";

export interface TypewriterTextProps {
  text: string;
  speed?: number;
  onDone?: () => void;
  className?: string;
  showCursor?: boolean;
}

export function TypewriterText({
  text,
  speed = 15,
  onDone,
  className,
  showCursor = true,
}: TypewriterTextProps) {
  const { displayed, isDone } = useTypewriter(text, speed);

  useEffect(() => {
    if (isDone) {
      onDone?.();
    }
  }, [isDone, onDone]);

  return (
    <span className={className}>
      {displayed}
      {showCursor && !isDone && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="ml-0.5 inline-block h-[1em] w-0.5 bg-current align-middle"
          aria-hidden="true"
        />
      )}
    </span>
  );
}
