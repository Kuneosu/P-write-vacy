import React, { useState } from 'react';
import type { FocusSettings, Preset } from '../types';
import { ContextMenu } from './ContextMenu';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  privacyActive: boolean;
  onPrivacyToggle: () => void;
  focusSettings: FocusSettings;
  onSettingsChange: (settings: FocusSettings) => void;
  presets: Preset[];
  onSavePreset: (name: string) => void;
  onLoadPreset: (preset: Preset) => void;
  onUpdatePreset: (id: string, name: string) => void;
  onDeletePreset: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  privacyActive,
  onPrivacyToggle,
  focusSettings,
  onSettingsChange,
  presets,
  onSavePreset,
  onLoadPreset,
  onUpdatePreset,
  onDeletePreset
}) => {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    presetId: string;
  } | null>(null);
  const [hoveredPreset, setHoveredPreset] = useState<Preset | null>(null);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

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

  const handleContextMenu = (e: React.MouseEvent, presetId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      presetId,
    });
  };

  const handleEditPreset = (preset: Preset) => {
    setEditingPresetId(preset.id);
    setEditingName(preset.name);
  };

  const handleSaveEdit = (id: string) => {
    if (editingName.trim()) {
      onUpdatePreset(id, editingName.trim());
      setEditingPresetId(null);
    }
  };

  const handleCreatePreset = () => {
    if (newPresetName.trim()) {
      onSavePreset(newPresetName.trim());
      setNewPresetName('');
      setIsCreatingPreset(false);
    }
  };

  const formatSettings = (settings: FocusSettings): string => {
    return [
      `크기: ${settings.radiusX}×${settings.radiusY}px`,
      `블러: ${settings.blurIntensity}px`,
      `투명도: ${Math.round(settings.blurOpacity * 100)}%`,
      `모양: ${settings.focusShape === 'circle' ? '원형' : '타원형'}`
    ].join(' | ');
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
          style={{ zIndex: 140 }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ zIndex: 150 }}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">설정</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
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
            {/* Presets Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">프리셋</h3>
                <span className="text-xs text-gray-500">{presets.length}/3</span>
              </div>

              {/* Preset List */}
              <div className="space-y-2">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="relative"
                    onMouseEnter={() => setHoveredPreset(preset)}
                    onMouseLeave={() => setHoveredPreset(null)}
                  >
                    {editingPresetId === preset.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(preset.id);
                            if (e.key === 'Escape') setEditingPresetId(null);
                          }}
                          className="flex-1 px-3 py-2 text-sm border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(preset.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          aria-label="프리셋 이름 저장"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onLoadPreset(preset)}
                        onContextMenu={(e) => handleContextMenu(e, preset.id)}
                        className="w-full px-3 py-2 text-left text-sm bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors relative group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-700 group-hover:text-blue-700">
                            {preset.name}
                          </span>
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        {hoveredPreset?.id === preset.id && (
                          <div className="absolute left-0 right-0 -top-20 bg-gray-800 text-white text-xs rounded-lg p-2 z-10 shadow-lg">
                            <div className="space-y-1">
                              <div className="font-semibold border-b border-gray-600 pb-1">
                                {preset.name}
                              </div>
                              <div className="text-gray-300">
                                {formatSettings(preset.settings)}
                              </div>
                            </div>
                            <div className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-800" />
                          </div>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Create New Preset */}
              {presets.length < 3 && (
                <div>
                  {isCreatingPreset ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newPresetName}
                        onChange={(e) => setNewPresetName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreatePreset();
                          if (e.key === 'Escape') {
                            setIsCreatingPreset(false);
                            setNewPresetName('');
                          }
                        }}
                        placeholder="프리셋 이름"
                        className="flex-1 px-3 py-2 text-sm border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={handleCreatePreset}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        aria-label="프리셋 저장"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          setIsCreatingPreset(false);
                          setNewPresetName('');
                        }}
                        className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="취소"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsCreatingPreset(true)}
                      className="w-full px-3 py-2 text-sm text-blue-600 border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                      aria-label="현재 설정을 새 프리셋으로 저장"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      현재 설정 저장
                    </button>
                  )}
                </div>
              )}

              <p className="text-xs text-gray-500">
                프리셋을 클릭하면 설정이 적용됩니다. 우클릭으로 수정하거나 삭제할 수 있습니다.
              </p>
            </div>

            {/* Privacy Toggle */}
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  프라이버시 모드
                </span>
                <button
                  onClick={onPrivacyToggle}
                  role="switch"
                  aria-checked={privacyActive}
                  aria-label="프라이버시 모드 전환"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
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
                <div className="grid grid-cols-2 gap-2" role="group" aria-label="포커스 영역 모양 선택">
                  <button
                    onClick={() => handleShapeChange('ellipse')}
                    role="radio"
                    aria-checked={focusSettings.focusShape === 'ellipse'}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      focusSettings.focusShape === 'ellipse'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    타원형
                  </button>
                  <button
                    onClick={() => handleShapeChange('circle')}
                    role="radio"
                    aria-checked={focusSettings.focusShape === 'circle'}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
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
                    aria-label="포커스 영역 크기"
                    aria-valuemin={30}
                    aria-valuemax={150}
                    aria-valuenow={focusSettings.radiusX}
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
                      aria-label="포커스 영역 가로 크기"
                      aria-valuemin={30}
                      aria-valuemax={150}
                      aria-valuenow={focusSettings.radiusX}
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
                      aria-label="포커스 영역 세로 크기"
                      aria-valuemin={15}
                      aria-valuemax={100}
                      aria-valuenow={focusSettings.radiusY}
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
                  aria-label="테두리 번짐 정도"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={focusSettings.blurSpread}
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
                      aria-label="배경 색상 선택"
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
                      aria-label="텍스트 색상 선택"
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
                      aria-label="블러 색상 선택"
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
                  aria-label="블러 투명도"
                  aria-valuemin={0}
                  aria-valuemax={1}
                  aria-valuenow={focusSettings.blurOpacity}
                  aria-valuetext={`${Math.round(focusSettings.blurOpacity * 100)}%`}
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
                  aria-label="블러 강도"
                  aria-valuemin={0}
                  aria-valuemax={20}
                  aria-valuenow={focusSettings.blurIntensity}
                  aria-valuetext={`${focusSettings.blurIntensity}px`}
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

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onEdit={() => {
            const preset = presets.find((p) => p.id === contextMenu.presetId);
            if (preset) handleEditPreset(preset);
          }}
          onDelete={() => {
            if (confirm('이 프리셋을 삭제하시겠습니까?')) {
              onDeletePreset(contextMenu.presetId);
            }
          }}
        />
      )}
    </>
  );
};
