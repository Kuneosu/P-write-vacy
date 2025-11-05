import React from 'react';
import type { CaretPosition, FocusSettings } from '../types';

interface FocusOverlayProps {
  isActive: boolean;
  caretPosition: CaretPosition;
  settings: FocusSettings;
}

export const FocusOverlay: React.FC<FocusOverlayProps> = React.memo(({
  isActive,
  caretPosition,
  settings
}) => {
  if (!isActive) return null;

  const { radiusX, radiusY, blurColor, blurOpacity, blurSpread, blurIntensity, focusShape } = settings;

  // Convert hex color to rgba
  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const blurColorRgba = hexToRgba(blurColor, blurOpacity);

  // 타원형과 원형은 mask 방식 사용
  const spreadEnd = 100 + blurSpread;

  const getMask = () => {
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
  };

  const maskStyles = getMask();

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
    // @ts-ignore - mask properties are not in CSSProperties but work
    ...maskStyles
  };

  return (
    <div style={blurLayerStyle} className="focus-overlay" />
  );
});

FocusOverlay.displayName = 'FocusOverlay';
