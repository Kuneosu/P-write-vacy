import { useState, useEffect, RefObject } from 'react';
import type { CaretPosition } from '../types';

export const useCaretTracking = (editorRef: RefObject<HTMLDivElement>) => {
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

    const range = selection.getRangeAt(0).cloneRange();

    // Create temporary span at caret position
    const span = document.createElement('span');
    span.textContent = '\u200B'; // zero-width space
    range.insertNode(span);

    const rect = span.getBoundingClientRect();
    const coordinates: CaretPosition = {
      x: rect.left,
      y: rect.top + rect.height / 2
    };

    // Remove temporary span
    span.parentNode?.removeChild(span);

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

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // Add event listeners
    editor.addEventListener('input', updateCaretPosition);
    editor.addEventListener('click', updateCaretPosition);
    editor.addEventListener('keyup', updateCaretPosition);
    editor.addEventListener('focus', updateCaretPosition);
    editor.addEventListener('scroll', updateCaretPosition);

    // Initial position
    setTimeout(updateCaretPosition, 100);

    return () => {
      editor.removeEventListener('input', updateCaretPosition);
      editor.removeEventListener('click', updateCaretPosition);
      editor.removeEventListener('keyup', updateCaretPosition);
      editor.removeEventListener('focus', updateCaretPosition);
      editor.removeEventListener('scroll', updateCaretPosition);
    };
  }, [editorRef]);

  return { caretPosition };
};
