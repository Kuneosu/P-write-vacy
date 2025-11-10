import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation();
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

  const sidebarRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management: auto-focus close button when sidebar opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      // Small delay to ensure the sidebar animation has started
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Focus trap: keep focus within sidebar when open
  useEffect(() => {
    const handleTabKey = (e: KeyboardEvent) => {
      if (!isOpen || e.key !== 'Tab' || !sidebarRef.current) return;

      const focusableElements = sidebarRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        // Shift+Tab on first element -> focus last
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        // Tab on last element -> focus first
        e.preventDefault();
        firstElement?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleTabKey);
      return () => document.removeEventListener('keydown', handleTabKey);
    }
  }, [isOpen]);

  // Escape key handler to close sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // If editing preset name or creating preset, cancel that first
        if (editingPresetId) {
          setEditingPresetId(null);
          e.stopPropagation();
        } else if (isCreatingPreset) {
          setIsCreatingPreset(false);
          setNewPresetName('');
          e.stopPropagation();
        } else if (isOpen) {
          // Otherwise close the sidebar
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, editingPresetId, isCreatingPreset, onClose]);

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
    const shapeText = settings.focusShape === 'circle'
      ? t('focus.shape.circle')
      : t('focus.shape.ellipse');
    return [
      t('presets.tooltip.size', { radiusX: settings.radiusX, radiusY: settings.radiusY }),
      t('presets.tooltip.blur', { blurIntensity: settings.blurIntensity }),
      t('presets.tooltip.opacity', { opacity: Math.round(settings.blurOpacity * 100) }),
      t('presets.tooltip.shape', { shape: shapeText })
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
        ref={sidebarRef}
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ zIndex: 150 }}
        role="dialog"
        aria-modal="true"
        aria-label={t('settings.aria.panel')}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">{t('settings.title')}</h2>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
              aria-label={t('settings.close')}
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
                <h3 className="text-sm font-semibold text-gray-700">{t('presets.title')}</h3>
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
                          aria-label={t('presets.saveName')}
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
                        placeholder={t('presets.name')}
                        className="flex-1 px-3 py-2 text-sm border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={handleCreatePreset}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        aria-label={t('presets.save')}
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
                        aria-label={t('presets.cancel')}
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
                      aria-label={t('presets.create')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      {t('presets.saveCurrentSettings')}
                    </button>
                  )}
                </div>
              )}

              <p className="text-xs text-gray-500">
                {t('presets.clickToApply')}
              </p>
            </div>

            {/* Privacy Toggle */}
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {t('privacy.mode')}
                </span>
                <button
                  onClick={onPrivacyToggle}
                  role="switch"
                  aria-checked={privacyActive}
                  aria-label={t('privacy.toggle')}
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
                {t('privacy.description')}
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                {t('focus.title')}
              </h3>

              {/* Focus Shape */}
              <div className="space-y-2 mb-4">
                <label className="text-sm text-gray-700 block mb-2">
                  {t('focus.shape.title')}
                </label>
                <div className="grid grid-cols-2 gap-2" role="group" aria-label={t('focus.shape.aria')}>
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
                    {t('focus.shape.ellipse')}
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
                    {t('focus.shape.circle')}
                  </button>
                </div>
              </div>

              {/* Circle: Single Size Control */}
              {focusSettings.focusShape === 'circle' ? (
                <div className="space-y-2 mb-4">
                  <label className="flex items-center justify-between text-sm text-gray-700">
                    <span>{t('focus.size.title')}</span>
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
                    aria-label={t('focus.size.aria.overall')}
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
                      <span>{t('focus.size.width')}</span>
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
                      aria-label={t('focus.size.aria.width')}
                      aria-valuemin={30}
                      aria-valuemax={150}
                      aria-valuenow={focusSettings.radiusX}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  {/* Radius Y */}
                  <div className="space-y-2 mb-4">
                    <label className="flex items-center justify-between text-sm text-gray-700">
                      <span>{t('focus.size.height')}</span>
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
                      aria-label={t('focus.size.aria.height')}
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
                  <span>{t('focus.spread.title')}</span>
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
                  aria-label={t('focus.spread.aria')}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={focusSettings.blurSpread}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <p className="text-xs text-gray-500">
                  {t('focus.spread.description')}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                {t('style.editor')}
              </h3>

              {/* Background Color */}
              <div className="space-y-2 mb-4">
                <label className="flex items-center justify-between text-sm text-gray-700">
                  <span>{t('colors.background')}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={focusSettings.backgroundColor}
                      onChange={(e) => handleBackgroundColorChange(e.target.value)}
                      aria-label={t('colors.aria.background')}
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
                  <span>{t('colors.text')}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={focusSettings.textColor}
                      onChange={(e) => handleTextColorChange(e.target.value)}
                      aria-label={t('colors.aria.text')}
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
                {t('style.blur')}
              </h3>

              {/* Color */}
              <div className="space-y-2 mb-4">
                <label className="flex items-center justify-between text-sm text-gray-700">
                  <span>{t('focus.blur.color')}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={focusSettings.blurColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      aria-label={t('focus.blur.aria.color')}
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
                  <span>{t('focus.blur.opacity')}</span>
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
                  aria-label={t('focus.blur.aria.opacity')}
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
                  <span>{t('focus.blur.intensity')}</span>
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
                  aria-label={t('focus.blur.aria.intensity')}
                  aria-valuemin={0}
                  aria-valuemax={20}
                  aria-valuenow={focusSettings.blurIntensity}
                  aria-valuetext={`${focusSettings.blurIntensity}px`}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <p className="text-xs text-gray-500">
                  {t('focus.blur.description')}
                </p>
              </div>
            </div>
          </div>

          {/* Language Selection */}
          <div className="p-6 border-t border-gray-200">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">{t('language.title')}</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => i18n.changeLanguage('ko')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    i18n.language === 'ko'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                >
                  {t('language.korean')}
                </button>
                <button
                  onClick={() => i18n.changeLanguage('en')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    i18n.language === 'en'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                >
                  {t('language.english')}
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200">
            <div className="text-xs text-gray-500 space-y-1">
              <p className="font-semibold">{t('shortcuts.title')}</p>
              <p>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                  Ctrl
                </kbd>{' '}
                +{' '}
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">H</kbd> -
                {t('shortcuts.privacy')}
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
            if (confirm(t('presets.deleteConfirm'))) {
              onDeletePreset(contextMenu.presetId);
            }
          }}
        />
      )}
    </>
  );
};
