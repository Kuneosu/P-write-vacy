import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = 4;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentPage < totalPages - 1) {
        setCurrentPage((prev) => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentPage > 0) {
        setCurrentPage((prev) => prev - 1);
      } else if (e.key === 'Enter' && currentPage === totalPages - 1) {
        onComplete();
      } else if (e.key === 'Escape') {
        onComplete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, onComplete]);

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-blue-100 via-purple-50 to-white"
      style={{ zIndex: 9999 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >

      <div className="w-full max-w-6xl mx-auto px-8 flex-1 flex flex-col items-center justify-center relative z-10">
        {/* Page 1: Welcome */}
        {currentPage === 0 && (
          <div className="w-full animate-fadeIn">
            <div className="grid grid-cols-[1.2fr_0.8fr] gap-12 items-center max-w-5xl mx-auto px-12">
              {/* Left: Text content */}
              <div className="space-y-6 text-left pr-8">
                <h1
                  id="onboarding-title"
                  className="text-3xl font-semibold text-gray-900"
                >
                  {t('onboarding.welcome.title')}
                </h1>
                <p className="text-gray-600 text-base leading-relaxed whitespace-pre-line">
                  {t('onboarding.welcome.description')}
                </p>

                {/* Navigation buttons */}
                <div className="flex gap-3 pt-4">
                  {currentPage > 0 && (
                    <button
                      onClick={handlePrev}
                      className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                      aria-label={t('onboarding.prev')}
                    >
                      {t('onboarding.prev')}
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className="px-8 py-3 bg-gray-800/90 text-white rounded-2xl hover:bg-gray-900/90 transition-all font-semibold backdrop-blur-sm"
                    style={{
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                    aria-label={currentPage === totalPages - 1 ? t('onboarding.finish') : t('onboarding.next')}
                  >
                    {currentPage === totalPages - 1 ? t('onboarding.finish') : t('onboarding.next')}
                  </button>
                </div>
              </div>

              {/* Right: App icon */}
              <div className="flex items-center justify-center pl-4">
                <img
                  src="/assets/app_icon.png"
                  alt="P-write-vacy App Icon"
                  className="w-64 h-64 object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* Page 2: Privacy Mode */}
        {currentPage === 1 && (
          <div className="w-full text-center animate-fadeIn space-y-12">
            {/* Text content first */}
            <div className="space-y-3">
              <h2 className="text-4xl font-bold text-gray-900">
                {t('onboarding.privacy.title')}
              </h2>
              <p className="text-xl text-gray-600 font-medium">
                {t('onboarding.privacy.subtitle')}
              </p>
            </div>

            {/* Privacy Mode GIF */}
            <div className="w-full max-w-xl mx-auto">
              <img
                key={currentPage}
                src={`/assets/gifs/privacy-mode.gif?t=${Date.now()}`}
                alt="Privacy Mode Demo"
                className="w-full rounded-2xl shadow-2xl"
              />
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3 justify-center pt-4">
              {currentPage > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                  aria-label={t('onboarding.prev')}
                >
                  {t('onboarding.prev')}
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-gray-800/90 text-white rounded-2xl hover:bg-gray-900/90 transition-all font-semibold backdrop-blur-sm"
                style={{
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}
                aria-label={currentPage === totalPages - 1 ? t('onboarding.finish') : t('onboarding.next')}
              >
                {currentPage === totalPages - 1 ? t('onboarding.finish') : t('onboarding.next')}
              </button>
            </div>
          </div>
        )}

        {/* Page 3: File Management */}
        {currentPage === 2 && (
          <div className="w-full text-center animate-fadeIn space-y-8">
            {/* Text content */}
            <div className="space-y-3">
              <h2 className="text-4xl font-bold text-gray-900">
                {t('onboarding.files.title')}
              </h2>
              <p className="text-xl text-blue-600 font-medium">
                {t('onboarding.files.subtitle')}
              </p>
            </div>

            {/* 📌 GIF PLACEHOLDER: File Explorer Demo */}
            <div className="w-full max-w-3xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-20 border-2 border-dashed border-blue-300">
                <p className="text-blue-600 font-medium text-lg mb-2">🎬 GIF 필요</p>
                <p className="text-gray-600 text-sm">
                  파일 탐색기 드래그 앤 드롭 데모<br />
                  파일을 드래그해서 폴더로 이동하는 GIF<br />
                  (1000x600px, 3-5초 반복)
                </p>
              </div>
            </div>

            {/* Key points */}
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-3xl mb-2">🗂️</div>
                <p className="text-sm text-gray-700 max-w-[120px]">
                  {t('onboarding.files.features.explorer')}
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🔀</div>
                <p className="text-sm text-gray-700 max-w-[120px]">
                  {t('onboarding.files.features.organize')}
                </p>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3 justify-center pt-4">
              {currentPage > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                  aria-label={t('onboarding.prev')}
                >
                  {t('onboarding.prev')}
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-gray-800/90 text-white rounded-2xl hover:bg-gray-900/90 transition-all font-semibold backdrop-blur-sm"
                style={{
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}
                aria-label={currentPage === totalPages - 1 ? t('onboarding.finish') : t('onboarding.next')}
              >
                {currentPage === totalPages - 1 ? t('onboarding.finish') : t('onboarding.next')}
              </button>
            </div>
          </div>
        )}

        {/* Page 4: Shortcuts */}
        {currentPage === 3 && (
          <div className="w-full text-center animate-fadeIn space-y-8">
            {/* Text content */}
            <div className="space-y-3">
              <h2 className="text-4xl font-bold text-gray-900">
                {t('onboarding.shortcuts.title')}
              </h2>
              <p className="text-xl text-purple-600 font-medium">
                {t('onboarding.shortcuts.subtitle')}
              </p>
            </div>

            {/* 📌 GIF PLACEHOLDER: Keyboard Shortcuts Demo */}
            <div className="w-full max-w-3xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-20 border-2 border-dashed border-purple-300">
                <p className="text-purple-600 font-medium text-lg mb-2">🎬 GIF 필요</p>
                <p className="text-gray-600 text-sm">
                  주요 단축키 사용 데모<br />
                  Ctrl+S (파일 탐색기), Ctrl+H (프라이버시)<br />
                  각 단축키 누를 때마다 화면 변화 표시<br />
                  (1000x600px, 5-8초 반복)
                </p>
              </div>
            </div>

            {/* Shortcuts grid - simplified */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                <kbd className="px-4 py-2 bg-white rounded-lg shadow-sm font-mono text-lg font-bold text-gray-800 block mb-2">
                  Ctrl+H
                </kbd>
                <p className="text-sm text-gray-700">
                  {t('onboarding.shortcuts.list.privacy')}
                </p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                <kbd className="px-4 py-2 bg-white rounded-lg shadow-sm font-mono text-lg font-bold text-gray-800 block mb-2">
                  Ctrl+S
                </kbd>
                <p className="text-sm text-gray-700">
                  {t('onboarding.shortcuts.list.fileExplorer')}
                </p>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3 justify-center pt-4">
              {currentPage > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                  aria-label={t('onboarding.prev')}
                >
                  {t('onboarding.prev')}
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-gray-800/90 text-white rounded-2xl hover:bg-gray-900/90 transition-all font-semibold backdrop-blur-sm"
                style={{
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}
                aria-label={currentPage === totalPages - 1 ? t('onboarding.finish') : t('onboarding.next')}
              >
                {currentPage === totalPages - 1 ? t('onboarding.finish') : t('onboarding.next')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pagination indicator - fixed at bottom */}
      <div className="w-full max-w-4xl mx-auto px-8 py-6">
        <div className="flex justify-center">
          <div className="flex gap-2" role="tablist" aria-label="Onboarding pages">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentPage
                    ? 'bg-gray-800 w-8'
                    : 'bg-gray-300 w-1.5 hover:bg-gray-400'
                }`}
                aria-label={`Go to page ${index + 1}`}
                aria-current={index === currentPage ? 'true' : 'false'}
                role="tab"
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};
