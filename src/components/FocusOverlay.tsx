import React, { useState, useEffect, useMemo } from 'react';
import type { CaretPosition, FocusSettings } from '../types';

interface FocusOverlayProps {
  isActive: boolean;
  caretPosition: CaretPosition;
  settings: FocusSettings;
  hasInteracted?: boolean;
}

export const FocusOverlay: React.FC<FocusOverlayProps> = React.memo(({
  isActive,
  caretPosition,
  settings,
  hasInteracted = true
}) => {
  const [opacity, setOpacity] = useState(0);
  const { radiusX, radiusY, blurColor, blurOpacity, blurSpread, blurIntensity, focusShape } = settings;

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (isActive) {
      // 활성화 시 자연스럽게 나타남
      const timer = setTimeout(() => setOpacity(1), 50);
      return () => clearTimeout(timer);
    } else {
      // 비활성화 시 즉시 사라짐
      setOpacity(0);
    }
  }, [isActive]);

  // Memoize hex to rgba conversion
  const hexToRgba = useMemo(() => {
    return (hex: string, opacity: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };
  }, []);

  // Memoize blur color for non-interacted state
  const fullBlurColorRgba = useMemo(
    () => hexToRgba(settings.blurColor, settings.blurOpacity),
    [settings.blurColor, settings.blurOpacity, hexToRgba]
  );

  // Memoize blur color for interacted state
  const blurColorRgba = useMemo(
    () => hexToRgba(blurColor, blurOpacity),
    [blurColor, blurOpacity, hexToRgba]
  );

  // Memoize mask styles based on settings and caret position
  const maskStyles = useMemo(() => {
    const spreadEnd = 100 + blurSpread;

    if (focusShape === 'ellipse') {
      return {
        mask: `radial-gradient(
          ellipse ${radiusX}px ${radiusY}px at ${caretPosition.x}% ${caretPosition.y}%,
          transparent 0%,
          transparent 100%,
          black ${spreadEnd}%
        )`,
        WebkitMask: `radial-gradient(
          ellipse ${radiusX}px ${radiusY}px at ${caretPosition.x}% ${caretPosition.y}%,
          transparent 0%,
          transparent 100%,
          black ${spreadEnd}%
        )`
      };
    } else {
      // circle
      const radius = Math.max(radiusX, radiusY);
      return {
        mask: `radial-gradient(
          circle ${radius}px at ${caretPosition.x}% ${caretPosition.y}%,
          transparent 0%,
          transparent 100%,
          black ${spreadEnd}%
        )`,
        WebkitMask: `radial-gradient(
          circle ${radius}px at ${caretPosition.x}% ${caretPosition.y}%,
          transparent 0%,
          transparent 100%,
          black ${spreadEnd}%
        )`
      };
    }
  }, [radiusX, radiusY, blurSpread, focusShape, caretPosition.x, caretPosition.y]);

  // Conditional returns after all hooks
  if (!isActive) return null;

  // 상호작용 전: 전체 블러
  if (!hasInteracted) {
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 10,
          backdropFilter: `blur(${settings.blurIntensity}px)`,
          WebkitBackdropFilter: `blur(${settings.blurIntensity}px)`,
          background: fullBlurColorRgba,
          opacity: opacity,
          transition: 'opacity 0.4s ease-out',
        }}
        className="focus-overlay"
      />
    );
  }

  const blurLayerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 10,
    backdropFilter: `blur(${blurIntensity}px)`,
    WebkitBackdropFilter: `blur(${blurIntensity}px)`,
    background: blurColorRgba,
    opacity: opacity,
    transition: 'opacity 0.4s ease-out, backdrop-filter 0.4s ease-out',
    // @ts-ignore - mask properties are not in CSSProperties but work
    ...maskStyles
  };

  return (
    <div style={blurLayerStyle} className="focus-overlay" />
  );
});

FocusOverlay.displayName = 'FocusOverlay';
