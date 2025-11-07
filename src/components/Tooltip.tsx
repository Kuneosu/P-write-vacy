import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactElement<any>;
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, delay = 500 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();

    timeoutRef.current = setTimeout(() => {
      // Calculate initial position (below the element)
      let top = rect.bottom + 8;
      let left = rect.left + rect.width / 2;

      setIsVisible(true);
      setPosition({ top, left });

      // Adjust position after tooltip is rendered to check its size
      requestAnimationFrame(() => {
        if (tooltipRef.current) {
          const tooltipRect = tooltipRef.current.getBoundingClientRect();
          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;

          // Adjust horizontal position if tooltip goes off-screen
          if (left + tooltipRect.width / 2 > windowWidth) {
            left = windowWidth - tooltipRect.width / 2 - 8;
          } else if (left - tooltipRect.width / 2 < 0) {
            left = tooltipRect.width / 2 + 8;
          }

          // Adjust vertical position if tooltip goes off-screen (show above instead)
          if (top + tooltipRect.height > windowHeight) {
            top = rect.top - tooltipRect.height - 8;
          }

          setPosition({ top, left });
        }
      });
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const childProps = children.props as any;

  return (
    <>
      {React.cloneElement(children, {
        onMouseEnter: (e: React.MouseEvent) => {
          handleMouseEnter(e);
          if (childProps.onMouseEnter) {
            childProps.onMouseEnter(e);
          }
        },
        onMouseLeave: (e: React.MouseEvent) => {
          handleMouseLeave();
          if (childProps.onMouseLeave) {
            childProps.onMouseLeave(e);
          }
        },
      } as any)}
      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-[500] pointer-events-none"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-md shadow-lg whitespace-nowrap">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
