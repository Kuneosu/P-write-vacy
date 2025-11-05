import React, { useRef, useEffect } from 'react';
import { useCaretTracking } from '../hooks/useCaretTracking';
import { FocusOverlay } from './FocusOverlay';
import type { FocusSettings } from '../types';

interface EditorProps {
  privacyActive: boolean;
  focusSettings: FocusSettings;
  content: string;
  onContentChange: (content: string) => void;
  fileExplorerOpen?: boolean;
}

export const Editor: React.FC<EditorProps> = ({
  privacyActive,
  focusSettings,
  content,
  onContentChange,
  fileExplorerOpen = false
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const { caretPosition } = useCaretTracking(editorRef);

  useEffect(() => {
    if (editorRef.current) {
      // 현재 포커스와 커서 위치 저장
      const hasFocus = document.activeElement === editorRef.current;
      const selection = window.getSelection();
      const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      const cursorOffset = range ? range.startOffset : 0;

      // 내용이 다를 때만 업데이트
      if (editorRef.current.textContent !== content) {
        editorRef.current.textContent = content;

        // 포커스와 커서 위치 복원
        if (hasFocus) {
          editorRef.current.focus();
          try {
            const newRange = document.createRange();
            const textNode = editorRef.current.firstChild;
            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
              const offset = Math.min(cursorOffset, textNode.textContent?.length || 0);
              newRange.setStart(textNode, offset);
              newRange.setEnd(textNode, offset);
              selection?.removeAllRanges();
              selection?.addRange(newRange);
            }
          } catch (e) {
            // 커서 복원 실패 시 무시
          }
        }
      }
    }
  }, [content]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.textContent || '';
    onContentChange(newContent);
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ backgroundColor: focusSettings.backgroundColor }}
    >
      <FocusOverlay
        isActive={privacyActive}
        caretPosition={caretPosition}
        settings={focusSettings}
      />
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="w-full h-full focus:outline-none text-lg leading-relaxed font-serif overflow-y-auto"
        style={{
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          color: focusSettings.textColor,
          padding: `60px 32px 32px ${fileExplorerOpen ? '288px' : '32px'}`, // 파일 탐색기가 열리면 왼쪽 패딩 추가
        }}
        data-placeholder="여기에 사적인 글을 작성하세요...&#10;&#10;텍스트를 입력하면 커서 주변만 선명하게 보입니다."
      />
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  );
};
