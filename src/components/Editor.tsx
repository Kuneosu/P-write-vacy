import React, { useRef, useEffect } from 'react';
import { useCaretTracking } from '../hooks/useCaretTracking';
import { FocusOverlay } from './FocusOverlay';
import type { FocusSettings } from '../types';

interface EditorProps {
  privacyActive: boolean;
  focusSettings: FocusSettings;
  content: string;
  onContentChange: (content: string) => void;
}

export const Editor: React.FC<EditorProps> = ({
  privacyActive,
  focusSettings,
  content,
  onContentChange
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const { caretPosition } = useCaretTracking(editorRef);

  useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.textContent !== content) {
        editorRef.current.textContent = content;
      }
      // 초기 마운트 시 에디터에 포커스 주기
      editorRef.current.focus();
    }
  }, []);

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
          padding: '60px 32px 32px 32px', // 상단 여유 공간 추가
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
