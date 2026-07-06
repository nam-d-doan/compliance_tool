import { useEffect, useState } from "react";

export interface UseTypewriterResult {
  displayed: string;
  isDone: boolean;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function* typewriterGenerator(
  text: string,
  speed: number,
): AsyncGenerator<string> {
  for (const char of text) {
    await delay(speed);
    yield char;
  }
}

export function useTypewriter(text: string, speed = 15): UseTypewriterResult {
  const [displayed, setDisplayed] = useState("");
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setDisplayed("");
      setIsDone(false);
      const generator = typewriterGenerator(text, speed);
      let result = await generator.next();
      while (!result.done) {
        if (cancelled) return;
        setDisplayed((prev) => prev + result.value);
        result = await generator.next();
      }
      if (!cancelled) setIsDone(true);
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [text, speed]);

  return { displayed, isDone };
}
