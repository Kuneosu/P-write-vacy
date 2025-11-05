import { useState, useEffect } from 'react';
import { Editor } from './components/Editor';
import { Sidebar } from './components/Sidebar';
import { SettingsButton } from './components/SettingsButton';
import type { FocusSettings } from './types';

const STORAGE_KEYS = {
  CONTENT: 'p-write-vacy-content',
  PRIVACY_ACTIVE: 'p-write-vacy-privacy',
  FOCUS_SETTINGS: 'p-write-vacy-focus-settings',
};

const DEFAULT_FOCUS_SETTINGS: FocusSettings = {
  radiusX: 60,
  radiusY: 30,
  blurColor: '#000000',
  blurOpacity: 0.3,
  blurSpread: 50, // 테두리 번짐 정도 (0-100)
  blurIntensity: 7, // 블러 강도 (0-20px)
  focusShape: 'ellipse', // 기본값: 타원형
  backgroundColor: '#ffffff', // 기본 배경색: 흰색
  textColor: '#000000', // 기본 텍스트색: 검정
};

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [privacyActive, setPrivacyActive] = useState(true);
  const [content, setContent] = useState('');
  const [focusSettings, setFocusSettings] = useState<FocusSettings>(
    DEFAULT_FOCUS_SETTINGS
  );
  const [isHovered, setIsHovered] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedContent = localStorage.getItem(STORAGE_KEYS.CONTENT);
    const savedPrivacy = localStorage.getItem(STORAGE_KEYS.PRIVACY_ACTIVE);
    const savedSettings = localStorage.getItem(STORAGE_KEYS.FOCUS_SETTINGS);

    if (savedContent) {
      setContent(savedContent);
    }

    if (savedPrivacy !== null) {
      setPrivacyActive(savedPrivacy === 'true');
    }

    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setFocusSettings({ ...DEFAULT_FOCUS_SETTINGS, ...parsedSettings });
      } catch (e) {
        console.error('Failed to parse focus settings:', e);
      }
    }
  }, []);

  // Save content to localStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem(STORAGE_KEYS.CONTENT, content);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [content]);

  // Save privacy state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRIVACY_ACTIVE, String(privacyActive));
  }, [privacyActive]);

  // Save focus settings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FOCUS_SETTINGS, JSON.stringify(focusSettings));
  }, [focusSettings]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+H: Toggle privacy (한국어 자판에서도 작동)
      if (e.ctrlKey && e.code === 'KeyH') {
        e.preventDefault();
        setPrivacyActive((prev) => !prev);
      }

      // Ctrl+9: 가로 크기 감소
      if (e.ctrlKey && e.code === 'Digit9') {
        e.preventDefault();
        setFocusSettings((prev) => {
          const newRadiusX = Math.max(30, prev.radiusX - 5);
          if (prev.focusShape === 'circle') {
            return { ...prev, radiusX: newRadiusX, radiusY: newRadiusX };
          }
          return { ...prev, radiusX: newRadiusX };
        });
      }

      // Ctrl+0: 가로 크기 증가
      if (e.ctrlKey && e.code === 'Digit0') {
        e.preventDefault();
        setFocusSettings((prev) => {
          const newRadiusX = Math.min(150, prev.radiusX + 5);
          if (prev.focusShape === 'circle') {
            return { ...prev, radiusX: newRadiusX, radiusY: newRadiusX };
          }
          return { ...prev, radiusX: newRadiusX };
        });
      }

      // Ctrl+-: 세로 크기 감소
      if (e.ctrlKey && e.code === 'Minus') {
        e.preventDefault();
        setFocusSettings((prev) => {
          const newRadiusY = Math.max(15, prev.radiusY - 5);
          if (prev.focusShape === 'circle') {
            return { ...prev, radiusX: newRadiusY, radiusY: newRadiusY };
          }
          return { ...prev, radiusY: newRadiusY };
        });
      }

      // Ctrl+=: 세로 크기 증가
      if (e.ctrlKey && e.code === 'Equal') {
        e.preventDefault();
        setFocusSettings((prev) => {
          const newRadiusY = Math.min(100, prev.radiusY + 5);
          if (prev.focusShape === 'circle') {
            return { ...prev, radiusX: newRadiusY, radiusY: newRadiusY };
          }
          return { ...prev, radiusY: newRadiusY };
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleSettingsChange = (newSettings: FocusSettings) => {
    setFocusSettings(newSettings);
  };

  return (
    <div
      className="w-screen h-screen overflow-hidden"
      style={{ backgroundColor: focusSettings.backgroundColor }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* macOS 드래그 영역 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '52px',
          WebkitAppRegion: 'drag',
          zIndex: 100,
        } as React.CSSProperties}
      />

      <Editor
        privacyActive={privacyActive}
        focusSettings={focusSettings}
        content={content}
        onContentChange={handleContentChange}
      />

      <SettingsButton
        onClick={() => setSidebarOpen(true)}
        isVisible={isHovered || sidebarOpen}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        privacyActive={privacyActive}
        onPrivacyToggle={() => setPrivacyActive((prev) => !prev)}
        focusSettings={focusSettings}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  );
}

export default App;
