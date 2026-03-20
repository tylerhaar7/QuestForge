// useTypewriter — Variable-speed character reveal with paragraph queuing.
// Characters type at 40-70ms (randomized) with extra pauses at punctuation
// and a 300ms beat between paragraphs.

import { useEffect, useRef, useState, useCallback } from 'react';
import { TYPEWRITER } from '@/constants/animations';

type TypewriterSpeed = 'instant' | 'fast' | 'normal' | 'slow';

interface UseTypewriterOptions {
  /** Full text to reveal (paragraphs separated by double newlines) */
  text: string;
  /** Speed preset — maps to a multiplier on the base delay range */
  speed?: TypewriterSpeed;
  /** When true, text appears instantly (accessibility / reduceMotion) */
  skipAnimations?: boolean;
  /** Called when all text has been revealed */
  onComplete?: () => void;
}

interface UseTypewriterResult {
  /** Text revealed so far (flat string with paragraph breaks) */
  displayedText: string;
  /** True once all characters have been revealed */
  isComplete: boolean;
  /** True while actively typing (not during paragraph pause) */
  isTyping: boolean;
  /** Skip to end of current paragraph, or complete all if on last paragraph */
  skip: () => void;
}

/** Compute the delay before revealing the next character. */
function getCharDelay(char: string, multiplier: number): number {
  if (multiplier === 0) return 0;

  const base =
    TYPEWRITER.CHAR_MIN_MS +
    Math.random() * (TYPEWRITER.CHAR_MAX_MS - TYPEWRITER.CHAR_MIN_MS);

  let extra = 0;
  if ('.!?'.includes(char)) extra = TYPEWRITER.PAUSE_PERIOD;
  else if (',;:\u2014\u2013'.includes(char)) extra = TYPEWRITER.PAUSE_COMMA;
  else if (char === '\n') extra = TYPEWRITER.PAUSE_NEWLINE;

  return (base + extra) * multiplier;
}

export function useTypewriter({
  text,
  speed = 'normal',
  skipAnimations = false,
  onComplete,
}: UseTypewriterOptions): UseTypewriterResult {
  const paragraphs = text ? text.split(/\n\n+/).filter(Boolean) : [];
  const multiplier = TYPEWRITER.SPEED_MULTIPLIER[speed] ?? 1;
  const isInstant = skipAnimations || multiplier === 0;

  // Mutable state
  const [paraIdx, setParaIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [typing, setTyping] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // ─── Reset when text changes ──────────────────────────
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setCompleted([]);
    setParaIdx(0);
    setCharIdx(0);
    setDone(false);
    setTyping(false);

    if (!text || isInstant) {
      const paras = text ? text.split(/\n\n+/).filter(Boolean) : [];
      setCompleted(paras);
      setParaIdx(paras.length);
      setDone(true);
      // Defer callback so the caller's effect has time to mount
      setTimeout(() => onCompleteRef.current?.(), 0);
    }
  }, [text, isInstant]);

  // ─── Typewriter tick ──────────────────────────────────
  useEffect(() => {
    if (done || isInstant) return;
    if (paraIdx >= paragraphs.length) return;

    const para = paragraphs[paraIdx];

    // Paragraph fully typed — pause then advance
    if (charIdx >= para.length) {
      setTyping(false);

      const isLast = paraIdx >= paragraphs.length - 1;
      if (isLast) {
        setCompleted((prev) => [...prev, para]);
        setDone(true);
        onCompleteRef.current?.();
        return;
      }

      timeoutRef.current = setTimeout(() => {
        setCompleted((prev) => [...prev, para]);
        setParaIdx((p) => p + 1);
        setCharIdx(0);
      }, TYPEWRITER.PARAGRAPH_PAUSE);

      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }

    // Type next character
    setTyping(true);
    const delay = getCharDelay(para[charIdx], multiplier);

    timeoutRef.current = setTimeout(() => {
      setCharIdx((c) => c + 1);
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [charIdx, paraIdx, done, isInstant, paragraphs, multiplier]);

  // ─── Skip ─────────────────────────────────────────────
  const skip = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (done) return;

    const para = paragraphs[paraIdx];
    if (!para) return;

    const isLast = paraIdx >= paragraphs.length - 1;
    if (isLast) {
      // Complete everything
      setCompleted(paragraphs);
      setParaIdx(paragraphs.length);
      setDone(true);
      setTyping(false);
      onCompleteRef.current?.();
    } else {
      // Complete current paragraph, start next
      setCompleted((prev) => [...prev, para]);
      setParaIdx((p) => p + 1);
      setCharIdx(0);
    }
  }, [done, paraIdx, paragraphs]);

  // ─── Build displayed string ───────────────────────────
  let displayedText: string;
  if (done) {
    displayedText = completed.join('\n\n');
  } else {
    const partial =
      paraIdx < paragraphs.length
        ? paragraphs[paraIdx].slice(0, charIdx)
        : '';
    displayedText =
      completed.length > 0
        ? completed.join('\n\n') + '\n\n' + partial
        : partial;
  }

  return { displayedText, isComplete: done, isTyping: typing, skip };
}
