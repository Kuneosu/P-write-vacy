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
  blurColor: '#ffffff',
  blurOpacity: 0.95,
  blurSpread: 50, // 테두리 번짐 정도 (0-100)
  focusShape: 'ellipse', // 기본값: 타원형
};

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [privacyActive, setPrivacyActive] = useState(true);
  const [content, setContent] = useState('');
  const [focusSettings, setFocusSettings] = useState<FocusSettings>(
    DEFAULT_FOCUS_SETTINGS
  );

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
      // Ctrl+H: Toggle privacy
      if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        setPrivacyActive((prev) => !prev);
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
    <div className="w-screen h-screen overflow-hidden bg-gray-50">
      <Editor
        privacyActive={privacyActive}
        focusSettings={focusSettings}
        content={content}
        onContentChange={handleContentChange}
      />

      <SettingsButton onClick={() => setSidebarOpen(true)} />

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
