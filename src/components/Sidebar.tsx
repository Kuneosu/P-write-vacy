import React from 'react';
import type { FocusSettings } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  privacyActive: boolean;
  onPrivacyToggle: () => void;
  focusSettings: FocusSettings;
  onSettingsChange: (settings: FocusSettings) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  privacyActive,
  onPrivacyToggle,
  focusSettings,
  onSettingsChange
}) => {
  const handleRadiusXChange = (value: number) => {
    if (focusSettings.focusShape === 'circle') {
      // 원형일 때는 radiusX와 radiusY를 동시에 변경
      onSettingsChange({ ...focusSettings, radiusX: value, radiusY: value });
    } else {
      onSettingsChange({ ...focusSettings, radiusX: value });
    }
  };

  const handleRadiusYChange = (value: number) => {
    if (focusSettings.focusShape === 'circle') {
      // 원형일 때는 radiusX와 radiusY를 동시에 변경
      onSettingsChange({ ...focusSettings, radiusX: value, radiusY: value });
    } else {
      onSettingsChange({ ...focusSettings, radiusY: value });
    }
  };

  const handleColorChange = (color: string) => {
    onSettingsChange({ ...focusSettings, blurColor: color });
  };

  const handleOpacityChange = (opacity: number) => {
    onSettingsChange({ ...focusSettings, blurOpacity: opacity });
  };

  const handleBlurSpreadChange = (spread: number) => {
    onSettingsChange({ ...focusSettings, blurSpread: spread });
  };

  const handleBlurIntensityChange = (intensity: number) => {
    onSettingsChange({ ...focusSettings, blurIntensity: intensity });
  };

  const handleShapeChange = (shape: 'ellipse' | 'circle') => {
    if (shape === 'circle') {
      // 원형으로 변경할 때 radiusX와 radiusY를 동일하게 설정
      const radius = Math.max(focusSettings.radiusX, focusSettings.radiusY);
      onSettingsChange({ ...focusSettings, focusShape: shape, radiusX: radius, radiusY: radius });
    } else {
      onSettingsChange({ ...focusSettings, focusShape: shape });
    }
  };

  const handleBackgroundColorChange = (color: string) => {
    onSettingsChange({ ...focusSettings, backgroundColor: color });
  };

  const handleTextColorChange = (color: string) => {
    onSettingsChange({ ...focusSettings, textColor: color });
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">설정</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="닫기"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Privacy Toggle */}
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  프라이버시 모드
                </span>
                <button
                  onClick={onPrivacyToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    privacyActive ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      privacyActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
              <p className="text-xs text-gray-500">
                커서 주변만 선명하게 표시 (Ctrl+H)
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                포커스 영역
              </h3>

              {/* Focus Shape */}
              <div className="space-y-2 mb-4">
                <label className="text-sm text-gray-700 block mb-2">
                  모양
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleShapeChange('ellipse')}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      focusSettings.focusShape === 'ellipse'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    타원형
                  </button>
                  <button
                    onClick={() => handleShapeChange('circle')}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      focusSettings.focusShape === 'circle'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    원형
                  </button>
                </div>
              </div>

              {/* Circle: Single Size Control */}
              {focusSettings.focusShape === 'circle' ? (
                <div className="space-y-2 mb-4">
                  <label className="flex items-center justify-between text-sm text-gray-700">
                    <span>크기</span>
                    <span className="font-mono text-blue-600">
                      {focusSettings.radiusX}px
                    </span>
                  </label>
                  <input
                    type="range"
                    min="30"
                    max="150"
                    step="5"
                    value={focusSettings.radiusX}
                    onChange={(e) => handleRadiusXChange(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              ) : (
                <>
                  {/* Radius X */}
                  <div className="space-y-2 mb-4">
                    <label className="flex items-center justify-between text-sm text-gray-700">
                      <span>가로 크기</span>
                      <span className="font-mono text-blue-600">
                        {focusSettings.radiusX}px
                      </span>
                    </label>
                    <input
                      type="range"
                      min="30"
                      max="150"
                      step="5"
                      value={focusSettings.radiusX}
                      onChange={(e) => handleRadiusXChange(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  {/* Radius Y */}
                  <div className="space-y-2 mb-4">
                    <label className="flex items-center justify-between text-sm text-gray-700">
                      <span>세로 크기</span>
                      <span className="font-mono text-blue-600">
                        {focusSettings.radiusY}px
                      </span>
                    </label>
                    <input
                      type="range"
                      min="15"
                      max="100"
                      step="5"
                      value={focusSettings.radiusY}
                      onChange={(e) => handleRadiusYChange(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                </>
              )}

              {/* Blur Spread */}
              <div className="space-y-2">
                <label className="flex items-center justify-between text-sm text-gray-700">
                  <span>테두리 번짐</span>
                  <span className="font-mono text-blue-600">
                    {focusSettings.blurSpread}
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={focusSettings.blurSpread}
                  onChange={(e) => handleBlurSpreadChange(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <p className="text-xs text-gray-500">
                  포커스 영역 테두리의 번지는 정도를 조절합니다
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                에디터 스타일
              </h3>

              {/* Background Color */}
              <div className="space-y-2 mb-4">
                <label className="flex items-center justify-between text-sm text-gray-700">
                  <span>배경 색상</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={focusSettings.backgroundColor}
                      onChange={(e) => handleBackgroundColorChange(e.target.value)}
                      className="w-10 h-8 rounded cursor-pointer"
                    />
                    <span className="font-mono text-xs text-gray-500">
                      {focusSettings.backgroundColor}
                    </span>
                  </div>
                </label>
              </div>

              {/* Text Color */}
              <div className="space-y-2 mb-4">
                <label className="flex items-center justify-between text-sm text-gray-700">
                  <span>텍스트 색상</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={focusSettings.textColor}
                      onChange={(e) => handleTextColorChange(e.target.value)}
                      className="w-10 h-8 rounded cursor-pointer"
                    />
                    <span className="font-mono text-xs text-gray-500">
                      {focusSettings.textColor}
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                블러 영역 스타일
              </h3>

              {/* Color */}
              <div className="space-y-2 mb-4">
                <label className="flex items-center justify-between text-sm text-gray-700">
                  <span>블러 색상</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={focusSettings.blurColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-10 h-8 rounded cursor-pointer"
                    />
                    <span className="font-mono text-xs text-gray-500">
                      {focusSettings.blurColor}
                    </span>
                  </div>
                </label>
              </div>

              {/* Opacity */}
              <div className="space-y-2 mb-4">
                <label className="flex items-center justify-between text-sm text-gray-700">
                  <span>투명도</span>
                  <span className="font-mono text-blue-600">
                    {Math.round(focusSettings.blurOpacity * 100)}%
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={focusSettings.blurOpacity}
                  onChange={(e) => handleOpacityChange(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Blur Intensity */}
              <div className="space-y-2">
                <label className="flex items-center justify-between text-sm text-gray-700">
                  <span>블러 강도</span>
                  <span className="font-mono text-blue-600">
                    {focusSettings.blurIntensity}px
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={focusSettings.blurIntensity}
                  onChange={(e) => handleBlurIntensityChange(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <p className="text-xs text-gray-500">
                  블러 효과의 강도를 조절합니다
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200">
            <div className="text-xs text-gray-500 space-y-1">
              <p className="font-semibold">단축키</p>
              <p>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                  Ctrl
                </kbd>{' '}
                +{' '}
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">H</kbd> -
                프라이버시 토글
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
