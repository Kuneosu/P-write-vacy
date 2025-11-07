import React from 'react';

export type SaveStatusType = 'saved' | 'saving' | 'unsaved' | 'error';

interface SaveStatusProps {
  status: SaveStatusType;
  errorMessage?: string;
  savedFileName?: string;
}

export const SaveStatus: React.FC<SaveStatusProps> = ({ status, errorMessage, savedFileName }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: (
            <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ),
          text: savedFileName ? `${savedFileName} 저장 중` : '저장 중',
          color: 'text-gray-600 bg-gray-50/80 border-gray-200/50',
        };
      case 'saved':
        return {
          icon: (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          text: savedFileName ? `${savedFileName} 저장됨` : '저장됨',
          color: 'text-gray-600 bg-gray-50/80 border-gray-200/50',
        };
      case 'unsaved':
        return {
          icon: (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          text: '저장되지 않음',
          color: 'text-gray-600 bg-gray-50/80 border-gray-200/50',
        };
      case 'error':
        return {
          icon: (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          text: errorMessage || '저장 실패',
          color: 'text-red-600 bg-red-50/80 border-red-200/50',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className={`fixed bottom-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border transition-all duration-300 z-50 opacity-80 hover:opacity-100 ${config.color}`}
      style={{
        WebkitAppRegion: 'no-drag',
        backdropFilter: 'blur(8px)',
        fontSize: '0.75rem'
      } as React.CSSProperties}
    >
      {config.icon}
      <span className="text-xs font-normal">{config.text}</span>
    </div>
  );
};
