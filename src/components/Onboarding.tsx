import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

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
      if (e.key === "ArrowRight" && currentPage < totalPages - 1) {
        setCurrentPage((prev) => prev + 1);
      } else if (e.key === "ArrowLeft" && currentPage > 0) {
        setCurrentPage((prev) => prev - 1);
      } else if (e.key === "Enter" && currentPage === totalPages - 1) {
        onComplete();
      } else if (e.key === "Escape") {
        onComplete();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
            zIndex: 10000,
          } as React.CSSProperties
        }
      />
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
                  {t("onboarding.welcome.title")}
                </h1>
                <p className="text-gray-600 text-base leading-relaxed whitespace-pre-line">
                  {t("onboarding.welcome.description")}
                </p>
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
                {t("onboarding.privacy.title")}
              </h2>
              <p className="text-xl text-gray-600 font-medium">
                {t("onboarding.privacy.subtitle")}
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
          </div>
        )}

        {/* Page 3: Markdown Viewer */}
        {currentPage === 2 && (
          <div className="w-full text-center animate-fadeIn space-y-12">
            {/* Text content */}
            <div className="space-y-3">
              <h2 className="text-4xl font-bold text-gray-900">
                {t("onboarding.markdown.title")}
              </h2>
              <p className="text-xl text-gray-600 font-medium">
                {t("onboarding.markdown.subtitle")}
              </p>
            </div>

            {/* Markdown Viewer Video */}
            <div className="w-full max-w-xl mx-auto">
              <video
                key={currentPage}
                src="/assets/gifs/mdviewer.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full rounded-2xl shadow-2xl"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        )}

        {/* Page 4: Presets */}
        {currentPage === 3 && (
          <div className="w-full text-center animate-fadeIn space-y-12">
            {/* Text content */}
            <div className="space-y-3">
              <h2 className="text-4xl font-bold text-gray-900">
                {t("onboarding.presets.title")}
              </h2>
              <p className="text-xl text-gray-600 font-medium">
                {t("onboarding.presets.subtitle")}
              </p>
            </div>

            {/* Preset Feature Video */}
            <div className="w-full max-w-xl mx-auto">
              <video
                key={currentPage}
                src="/assets/gifs/preset.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full rounded-2xl shadow-2xl"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons - fixed position above indicator */}
      <div className="w-full max-w-4xl mx-auto px-8 py-8">
        <div className="flex gap-3 justify-center">
          {currentPage > 0 && (
            <button
              onClick={handlePrev}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium"
              aria-label={t("onboarding.prev")}
            >
              {t("onboarding.prev")}
            </button>
          )}
          <button
            onClick={handleNext}
            className="px-8 py-3 bg-gray-800/90 text-white rounded-2xl hover:bg-gray-900/90 transition-all font-semibold backdrop-blur-sm"
            style={{
              boxShadow:
                "0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
            }}
            aria-label={
              currentPage === totalPages - 1
                ? t("onboarding.finish")
                : t("onboarding.next")
            }
          >
            {currentPage === totalPages - 1
              ? t("onboarding.finish")
              : t("onboarding.next")}
          </button>
        </div>
      </div>

      {/* Pagination indicator - fixed at bottom */}
      <div className="w-full max-w-4xl mx-auto px-8 py-6">
        <div className="flex justify-center">
          <div
            className="flex gap-2"
            role="tablist"
            aria-label="Onboarding pages"
          >
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentPage
                    ? "bg-gray-800 w-8"
                    : "bg-gray-300 w-1.5 hover:bg-gray-400"
                }`}
                aria-label={`Go to page ${index + 1}`}
                aria-current={index === currentPage ? "true" : "false"}
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
