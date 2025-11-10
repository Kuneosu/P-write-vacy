import { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FocusOverlay } from './FocusOverlay';
import type { FocusSettings, CaretPosition } from '../types';

interface MarkdownViewerProps {
  content: string;
  privacyActive: boolean;
  focusSettings: FocusSettings;
  fileExplorerOpen: boolean;
  currentFile?: string | null;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  privacyActive,
  focusSettings,
  fileExplorerOpen,
  currentFile,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState<CaretPosition>({ x: 50, y: 50 });
  const [hasInteracted, setHasInteracted] = useState(false);

  // Custom components for react-markdown with lazy loading images
  const markdownComponents = useMemo<Components>(() => ({
    img: ({ node, ...props }) => (
      <img
        {...props}
        loading="lazy"
        style={{
          maxWidth: '100%',
          height: 'auto',
          borderRadius: '4px',
        }}
        onError={(e) => {
          // Handle broken images gracefully
          const target = e.target as HTMLImageElement;
          target.alt = `[Image failed to load: ${props.alt || props.src}]`;
          target.style.display = 'none';
        }}
      />
    ),
  }), []);

  // Reset interaction state when file changes (not when content changes)
  useEffect(() => {
    setHasInteracted(false);
  }, [currentFile]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePosition({ x, y });
        if (!hasInteracted) {
          setHasInteracted(true);
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => container.removeEventListener('mousemove', handleMouseMove);
    }
  }, [hasInteracted]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ backgroundColor: focusSettings.backgroundColor }}
    >
      <FocusOverlay
        isActive={privacyActive}
        caretPosition={mousePosition}
        settings={focusSettings}
        hasInteracted={hasInteracted}
      />
      <div
        className="h-full overflow-y-auto px-8 py-20"
        style={{
          color: focusSettings.textColor,
          paddingLeft: fileExplorerOpen ? '288px' : '32px',
          transition: 'padding-left 0.3s ease',
        }}
      >
        <div className="max-w-4xl mx-auto prose prose-lg dark:prose-invert">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
