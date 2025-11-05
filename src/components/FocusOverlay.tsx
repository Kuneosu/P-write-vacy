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

  // 번짐 정도를 백분율로 계산 (100% 지점에서 시작하여 spread만큼 확장)
  const spreadEnd = 100 + blurSpread;

  // 포커스 영역 모양에 따라 mask 생성
  const getMask = () => {
    if (focusShape === 'ellipse') {
      return `radial-gradient(
        ellipse ${radiusX}px ${radiusY}px at ${caretPosition.x}% ${caretPosition.y}%,
        transparent 0%,
        transparent 100%,
        black ${spreadEnd}%
      )`;
    } else {
      // rectangle: 사각형 모양 (clip-path와 blur 조합)
      // 간단한 구현: 원형을 사용하되 radiusX, radiusY의 최대값 사용
      const maxRadius = Math.max(radiusX, radiusY);
      return `radial-gradient(
        circle ${maxRadius}px at ${caretPosition.x}% ${caretPosition.y}%,
        transparent 0%,
        transparent 100%,
        black ${spreadEnd}%
      )`;
    }
  };

  const maskValue = getMask();

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
    // @ts-ignore - mask is not in CSSProperties but works
    mask: maskValue,
    WebkitMask: maskValue,
    background: blurColorRgba
  };

  return (
    <div style={blurLayerStyle} className="focus-overlay" />
  );
});

FocusOverlay.displayName = 'FocusOverlay';
