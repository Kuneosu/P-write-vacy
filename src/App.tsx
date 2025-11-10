import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Editor } from "./components/Editor";
import { Sidebar } from "./components/Sidebar";
import { SettingsButton } from "./components/SettingsButton";
import { FileExplorer } from "./components/FileExplorer";
import { MarkdownViewer } from "./components/MarkdownViewer";
import { Tooltip } from "./components/Tooltip";
import { SaveStatus } from "./components/SaveStatus";
import { Onboarding } from "./components/Onboarding";
import type { SaveStatusType } from "./components/SaveStatus";
import { useToast } from "./contexts/ToastContext";
import type { FocusSettings, Preset } from "./types";

const STORAGE_KEYS = {
  CONTENT: "p-write-vacy-content",
  PRIVACY_ACTIVE: "p-write-vacy-privacy",
  FOCUS_SETTINGS: "p-write-vacy-focus-settings",
  PRESETS: "p-write-vacy-presets",
  ONBOARDING_COMPLETED: "p-write-vacy-onboarding-completed",
};

const DEFAULT_FOCUS_SETTINGS: FocusSettings = {
  radiusX: 60,
  radiusY: 30,
  blurColor: "#000000",
  blurOpacity: 0.3,
  blurSpread: 50, // 테두리 번짐 정도 (0-100)
  blurIntensity: 7, // 블러 강도 (0-20px)
  focusShape: "ellipse", // 기본값: 타원형
  backgroundColor: "#ffffff", // 기본 배경색: 흰색
  textColor: "#000000", // 기본 텍스트색: 검정
};

function App() {
  const { t } = useTranslation();
  const toast = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [privacyActive, setPrivacyActive] = useState(true);
  const [content, setContent] = useState("");
  const [focusSettings, setFocusSettings] = useState<FocusSettings>(
    DEFAULT_FOCUS_SETTINGS
  );
  const [isHovered, setIsHovered] = useState(false);
  const [presets, setPresets] = useState<Preset[]>([]);

  // File Explorer state
  const [fileExplorerOpen, setFileExplorerOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Markdown viewer state
  const [isMarkdownViewMode, setIsMarkdownViewMode] = useState(false);

  // Save status state
  const [saveStatus, setSaveStatus] = useState<SaveStatusType>('saved');
  const [saveError, setSaveError] = useState<string | undefined>();
  const [showSaveStatus, setShowSaveStatus] = useState(false);
  const [savedFileName, setSavedFileName] = useState<string | undefined>();

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if current file is markdown
  const isMarkdownFile = currentFile?.toLowerCase().match(/\.(md|markdown)$/) !== null;

  // Reset markdown view mode when file changes (but keep save status if showing)
  useEffect(() => {
    setIsMarkdownViewMode(false);
    // Don't reset save status here - let it display for the previous file
  }, [currentFile]);

  // Clear content and file when folder changes or is deselected
  useEffect(() => {
    setContent("");
    setCurrentFile(null);
    setSelectedFiles([]);
    setHasUnsavedChanges(false);
  }, [currentFolder]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedPrivacy = localStorage.getItem(STORAGE_KEYS.PRIVACY_ACTIVE);
    const savedSettings = localStorage.getItem(STORAGE_KEYS.FOCUS_SETTINGS);
    const savedPresets = localStorage.getItem(STORAGE_KEYS.PRESETS);
    const onboardingCompleted = localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);

    if (savedPrivacy !== null) {
      setPrivacyActive(savedPrivacy === "true");
    }

    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setFocusSettings({ ...DEFAULT_FOCUS_SETTINGS, ...parsedSettings });
      } catch (e) {
        console.error("Failed to parse focus settings:", e);
      }
    }

    if (savedPresets) {
      try {
        const parsedPresets = JSON.parse(savedPresets);
        setPresets(parsedPresets);
      } catch (e) {
        console.error("Failed to parse presets:", e);
      }
    }

    // Show onboarding if not completed
    if (!onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, []);

  // Save content to localStorage only when folder is selected
  useEffect(() => {
    if (!currentFolder) return;

    const timeoutId = setTimeout(() => {
      localStorage.setItem(STORAGE_KEYS.CONTENT, content);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [content, currentFolder]);

  // Save privacy state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRIVACY_ACTIVE, String(privacyActive));
  }, [privacyActive]);

  // Save focus settings to localStorage
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.FOCUS_SETTINGS,
      JSON.stringify(focusSettings)
    );
  }, [focusSettings]);

  // Save presets to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presets));
  }, [presets]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC: Deselect current file
      if (e.key === "Escape" && currentFile) {
        e.preventDefault();
        setCurrentFile(null);
        setContent("");
        setHasUnsavedChanges(false);
      }

      // Ctrl+S: Toggle file explorer
      if (e.ctrlKey && e.code === "KeyS") {
        e.preventDefault();
        setFileExplorerOpen((prev) => !prev);
      }

      // Ctrl+H: Toggle privacy (한국어 자판에서도 작동)
      if (e.ctrlKey && e.code === "KeyH") {
        e.preventDefault();
        setPrivacyActive((prev) => !prev);
      }

      // Ctrl+9: 가로 크기 감소
      if (e.ctrlKey && e.code === "Digit9") {
        e.preventDefault();
        setFocusSettings((prev) => {
          const newRadiusX = Math.max(30, prev.radiusX - 5);
          if (prev.focusShape === "circle") {
            return { ...prev, radiusX: newRadiusX, radiusY: newRadiusX };
          }
          return { ...prev, radiusX: newRadiusX };
        });
      }

      // Ctrl+0: 가로 크기 증가
      if (e.ctrlKey && e.code === "Digit0") {
        e.preventDefault();
        setFocusSettings((prev) => {
          const newRadiusX = Math.min(150, prev.radiusX + 5);
          if (prev.focusShape === "circle") {
            return { ...prev, radiusX: newRadiusX, radiusY: newRadiusX };
          }
          return { ...prev, radiusX: newRadiusX };
        });
      }

      // Ctrl+-: 세로 크기 감소
      if (e.ctrlKey && e.code === "Minus") {
        e.preventDefault();
        setFocusSettings((prev) => {
          const newRadiusY = Math.max(15, prev.radiusY - 5);
          if (prev.focusShape === "circle") {
            return { ...prev, radiusX: newRadiusY, radiusY: newRadiusY };
          }
          return { ...prev, radiusY: newRadiusY };
        });
      }

      // Ctrl+=: 세로 크기 증가
      if (e.ctrlKey && e.code === "Equal") {
        e.preventDefault();
        setFocusSettings((prev) => {
          const newRadiusY = Math.min(100, prev.radiusY + 5);
          if (prev.focusShape === "circle") {
            return { ...prev, radiusX: newRadiusY, radiusY: newRadiusY };
          }
          return { ...prev, radiusY: newRadiusY };
        });
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentFile]);

  const handleContentChange = (newContent: string) => {
    console.log('Content changed (length:', newContent.length, ')');
    console.log('Has newlines:', newContent.includes('\n'));
    setContent(newContent);
    if (currentFile) {
      console.log('Marking as unsaved');
      setHasUnsavedChanges(true);
    }
  };

  const handleSettingsChange = (newSettings: FocusSettings) => {
    setFocusSettings(newSettings);
  };

  // Preset handlers
  const handleSavePreset = (name: string) => {
    if (presets.length >= 3) {
      toast.warning(t('presets.maxPresetsWarning'));
      return;
    }

    const newPreset: Preset = {
      id: Date.now().toString(),
      name,
      settings: { ...focusSettings },
    };

    setPresets([...presets, newPreset]);
  };

  const handleLoadPreset = (preset: Preset) => {
    setFocusSettings(preset.settings);
  };

  const handleUpdatePreset = (id: string, name: string) => {
    setPresets(
      presets.map((p) =>
        p.id === id ? { ...p, name, settings: { ...focusSettings } } : p
      )
    );
  };

  const handleDeletePreset = (id: string) => {
    setPresets(presets.filter((p) => p.id !== id));
  };

  // Onboarding handlers
  const handleOnboardingComplete = () => {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    setShowOnboarding(false);
  };

  // File Explorer handlers
  const handleSelectFolder = async () => {
    if (!window.electron) return;
    const folderPath = await window.electron.selectFolder();
    if (folderPath) {
      setCurrentFolder(folderPath);
      setFileExplorerOpen(true);
    }
  };

  const handleSelectFile = async (filePath: string) => {
    if (!window.electron) return;

    // Save current file if there are unsaved changes
    if (currentFile && hasUnsavedChanges) {
      const previousFileName = currentFile.split('/').pop() || currentFile;
      const saveResult = await window.electron.writeFile(currentFile, content);
      setHasUnsavedChanges(false);

      if (saveResult.success) {
        // Show save confirmation with previous file name
        setSaveStatus('saved');
        setSavedFileName(previousFileName);
        setShowSaveStatus(true);
        setTimeout(() => {
          setShowSaveStatus(false);
          setSavedFileName(undefined);
        }, 1500);
      }
    }

    // Load new file
    const result = await window.electron.readFile(filePath);
    if (result.success && result.content !== undefined) {
      console.log('Loaded file:', filePath);
      console.log('File content (length:', result.content.length, ')');
      console.log('Has newlines:', result.content.includes('\n'));
      setCurrentFile(filePath);
      setSelectedFiles([filePath]);
      setContent(result.content);
      setHasUnsavedChanges(false);
    } else {
      console.error("Failed to read file:", result.error);
      toast.error(t('toast.fileReadError', { error: result.error }));
    }
  };

  const handleFileSelection = (selectedPaths: string[]) => {
    setSelectedFiles(selectedPaths);
  };

  // Clear currentFile when folder is selected (keep editor content)
  const handleFolderSelection = (folderPath: string) => {
    setSelectedFiles([folderPath]);
    setCurrentFile(null);
    // Keep content unchanged so editor still shows previous file
  };

  // Load file without resetting selection (for multi-select mode)
  const handleLoadFileInMultiSelect = async (filePath: string) => {
    if (!window.electron) return;

    // Save current file if there are unsaved changes
    if (currentFile && hasUnsavedChanges) {
      const previousFileName = currentFile.split('/').pop() || currentFile;
      const saveResult = await window.electron.writeFile(currentFile, content);
      setHasUnsavedChanges(false);

      if (saveResult.success) {
        // Show save confirmation with previous file name
        setSaveStatus('saved');
        setSavedFileName(previousFileName);
        setShowSaveStatus(true);
        setTimeout(() => {
          setShowSaveStatus(false);
          setSavedFileName(undefined);
        }, 1500);
      }
    }

    // Load new file without resetting selectedFiles
    const result = await window.electron.readFile(filePath);
    if (result.success && result.content !== undefined) {
      console.log('Loaded file:', filePath);
      setCurrentFile(filePath);
      setContent(result.content);
      setHasUnsavedChanges(false);
    } else {
      console.error("Failed to read file:", result.error);
      toast.error(t('toast.fileReadError', { error: result.error }));
    }
  };

  const handleCreateFile = async (fileName: string) => {
    if (!window.electron || !currentFolder) return;

    const result = await window.electron.createFile(currentFolder, fileName);
    if (result.success && result.path) {
      setCurrentFile(result.path);
      setContent("");
      setHasUnsavedChanges(false);
      // Trigger file list reload
      setRefreshTrigger((prev) => prev + 1);
      toast.success(t('toast.fileCreateSuccess'));
    } else {
      toast.error(t('toast.fileCreateError', { error: result.error }));
    }
  };

  const handleDeleteFile = (deletedPath: string) => {
    // If the deleted file is currently open, close it
    if (currentFile === deletedPath) {
      setCurrentFile(null);
      setContent("");
      setHasUnsavedChanges(false);
    }
    // Remove from selected files
    setSelectedFiles(prev => prev.filter(path => path !== deletedPath));
  };

  // Auto-save current file
  useEffect(() => {
    if (!currentFile || !hasUnsavedChanges || !window.electron) return;

    // Don't show "saving" status - only show when saved or error
    setSaveError(undefined);

    const timeoutId = setTimeout(async () => {
      if (!window.electron || !currentFile) return;

      console.log('Auto-saving file:', currentFile);
      console.log('Content to save (length:', content.length, '):', content.substring(0, 100));
      const result = await window.electron.writeFile(currentFile, content);
      if (result.success) {
        console.log('File saved successfully');
        setHasUnsavedChanges(false);
        setSaveStatus('saved');
        setSavedFileName(undefined); // Auto-save doesn't show file name
        setShowSaveStatus(true);

        // Hide "saved" status after 1.5 seconds
        setTimeout(() => {
          setShowSaveStatus(false);
        }, 1500);
      } else {
        console.error('Failed to save file:', result.error);
        setSaveStatus('error');
        setSaveError(result.error);
        setShowSaveStatus(true);

        // Hide error status after 5 seconds
        setTimeout(() => {
          setShowSaveStatus(false);
        }, 5000);
      }
    }, 1000); // Save after 1 second of inactivity

    return () => clearTimeout(timeoutId);
  }, [content, currentFile, hasUnsavedChanges]);

  // Don't show unsaved status - only show saving/saved/error states

  // Show onboarding on first launch
  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div
      className="w-screen h-screen overflow-hidden"
      style={{ backgroundColor: focusSettings.backgroundColor }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* macOS 드래그 영역 */}
      <div
        style={
          {
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "52px",
            WebkitAppRegion: "drag",
            zIndex: 100,
          } as React.CSSProperties
        }
      />

      {/* 파일 탐색기 토글 버튼 */}
      <Tooltip content={fileExplorerOpen ? t('fileExplorer.close') : t('fileExplorer.open')}>
        <button
          onClick={() => setFileExplorerOpen((prev) => !prev)}
          className="fixed p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
          style={
            {
              WebkitAppRegion: "no-drag",
              zIndex: 150,
              top: fileExplorerOpen ? "10px" : "10px",
              left: fileExplorerOpen ? "200px" : "100px",
              opacity: isHovered || fileExplorerOpen ? 1 : 0,
              pointerEvents: isHovered || fileExplorerOpen ? "auto" : "none",
              transition: "all 0.3s ease",
            } as React.CSSProperties
          }
          aria-label={t('fileExplorer.toggle')}
        >
          <svg
            className="w-6 h-6 text-gray-700 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        </button>
      </Tooltip>

      <FileExplorer
        isOpen={fileExplorerOpen}
        currentFolder={currentFolder}
        currentFile={currentFile}
        selectedFiles={selectedFiles}
        onSelectFolder={handleSelectFolder}
        onSelectFile={handleSelectFile}
        onLoadFileInMultiSelect={handleLoadFileInMultiSelect}
        onFileSelection={handleFileSelection}
        onFolderSelection={handleFolderSelection}
        onCreateFile={handleCreateFile}
        onDeleteFile={handleDeleteFile}
        refreshTrigger={refreshTrigger}
      />

      {!currentFolder ? (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ backgroundColor: focusSettings.backgroundColor }}
        >
          <button
            onClick={handleSelectFolder}
            className="px-8 py-4 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-lg font-medium group"
            style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
          >
            <div className="flex items-center gap-3">
              <svg
                className="w-6 h-6 text-gray-700 group-hover:text-gray-900 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
              <span className="text-gray-700 group-hover:text-gray-900 transition-colors">{t('fileExplorer.selectFolder')}</span>
            </div>
          </button>
        </div>
      ) : !currentFile ? (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            backgroundColor: focusSettings.backgroundColor,
            paddingLeft: fileExplorerOpen ? '256px' : '0'
          }}
        >
          <div className="text-center">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-gray-500 text-lg">{t('fileExplorer.selectFile')}</p>
            <p className="text-gray-400 text-sm mt-2">{t('fileExplorer.selectFileDescription')}</p>
          </div>
        </div>
      ) : isMarkdownViewMode ? (
        <MarkdownViewer
          content={content}
          privacyActive={privacyActive}
          focusSettings={focusSettings}
          fileExplorerOpen={fileExplorerOpen}
          currentFile={currentFile}
        />
      ) : (
        <Editor
          privacyActive={privacyActive}
          focusSettings={focusSettings}
          content={content}
          onContentChange={handleContentChange}
          fileExplorerOpen={fileExplorerOpen}
          currentFile={currentFile}
        />
      )}

      {/* Privacy mode toggle button */}
      {currentFolder && (
        <Tooltip content={privacyActive ? t('privacy.off') : t('privacy.on')}>
          <button
            onClick={() => setPrivacyActive((prev) => !prev)}
            className="fixed p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
            style={
              {
                WebkitAppRegion: "no-drag",
                zIndex: 150,
                top: "16px",
                right: "68px",
                opacity: isHovered || sidebarOpen ? 1 : 0,
                pointerEvents: isHovered || sidebarOpen ? "auto" : "none",
                transition: "all 0.3s ease",
              } as React.CSSProperties
            }
            aria-label={privacyActive ? t('privacy.off') : t('privacy.on')}
          >
            {privacyActive ? (
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            )}
          </button>
        </Tooltip>
      )}

      {/* Markdown viewer toggle button */}
      {isMarkdownFile && currentFolder && (
        <Tooltip content={isMarkdownViewMode ? t('markdown.editMode') : t('markdown.preview')}>
          <button
            onClick={() => setIsMarkdownViewMode((prev) => !prev)}
            className="fixed p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
            style={
              {
                WebkitAppRegion: "no-drag",
                zIndex: 150,
                top: "16px",
                right: "120px",
                opacity: isHovered || sidebarOpen ? 1 : 0,
                pointerEvents: isHovered || sidebarOpen ? "auto" : "none",
                transition: "all 0.3s ease",
              } as React.CSSProperties
            }
            aria-label={isMarkdownViewMode ? t('markdown.aria.editor') : t('markdown.aria.viewer')}
          >
            {isMarkdownViewMode ? (
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            )}
          </button>
        </Tooltip>
      )}

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
        presets={presets}
        onSavePreset={handleSavePreset}
        onLoadPreset={handleLoadPreset}
        onUpdatePreset={handleUpdatePreset}
        onDeletePreset={handleDeletePreset}
      />

      {/* Save status indicator - only show when needed */}
      {currentFile && showSaveStatus && (
        <SaveStatus
          status={saveStatus}
          errorMessage={saveError}
          savedFileName={savedFileName}
        />
      )}
    </div>
  );
}

export default App;
