import { useState, useEffect, useRef, type RefObject } from 'react';
import type { CaretPosition } from '../types';
import { throttle } from '../utils/throttle';

export const useCaretTracking = (editorRef: RefObject<HTMLDivElement | null>) => {
  const [caretPosition, setCaretPosition] = useState<CaretPosition>({ x: 50, y: 50 });

  const getCaretCoordinates = (): CaretPosition | null => {
    if (!editorRef.current) return null;

    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) {
      // No selection, return editor center
      const editorRect = editorRef.current.getBoundingClientRect();
      return {
        x: editorRect.left + 30,
        y: editorRect.top + 30
      };
    }

    const range = selection.getRangeAt(0);

    // Use range.getBoundingClientRect() instead of inserting temporary elements
    let rect = range.getBoundingClientRect();

    // If rect has no dimensions (collapsed range at start), use a temporary span
    if (rect.width === 0 && rect.height === 0) {
      const clonedRange = range.cloneRange();
      const span = document.createElement('span');
      span.textContent = '\u200B'; // zero-width space

      // Save current selection
      const savedRange = range.cloneRange();

      clonedRange.insertNode(span);
      rect = span.getBoundingClientRect();

      // Remove temporary span
      span.parentNode?.removeChild(span);

      // Restore selection
      selection.removeAllRanges();
      selection.addRange(savedRange);
    }

    const coordinates: CaretPosition = {
      x: rect.left,
      y: rect.top + rect.height / 2
    };

    return coordinates;
  };

  const updateCaretPosition = () => {
    const coords = getCaretCoordinates();
    if (coords && editorRef.current) {
      const rect = editorRef.current.getBoundingClientRect();
      const xPercent = ((coords.x - rect.left) / rect.width) * 100;
      const yPercent = ((coords.y - rect.top) / rect.height) * 100;

      setCaretPosition({
        x: Math.max(0, Math.min(100, xPercent)),
        y: Math.max(0, Math.min(100, yPercent))
      });
    }
  };

  // Create throttled version of updateCaretPosition (~60fps = 16ms)
  const throttledUpdateRef = useRef(throttle(updateCaretPosition, 16));

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const throttledUpdate = throttledUpdateRef.current;

    // Add event listeners with throttled update
    editor.addEventListener('input', throttledUpdate);
    editor.addEventListener('click', throttledUpdate);
    editor.addEventListener('keyup', throttledUpdate);
    editor.addEventListener('focus', throttledUpdate);
    editor.addEventListener('scroll', throttledUpdate);

    // Initial position (not throttled for immediate feedback)
    setTimeout(updateCaretPosition, 100);

    return () => {
      editor.removeEventListener('input', throttledUpdate);
      editor.removeEventListener('click', throttledUpdate);
      editor.removeEventListener('keyup', throttledUpdate);
      editor.removeEventListener('focus', throttledUpdate);
      editor.removeEventListener('scroll', throttledUpdate);
    };
  }, [editorRef]);

  return { caretPosition };
};
