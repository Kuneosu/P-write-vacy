import React from 'react';
import { useTranslation } from 'react-i18next';

interface FileInputDialogProps {
  type: 'file' | 'folder';
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

/**
 * 파일/폴더 생성 입력 다이얼로그 컴포넌트
 * Enter 키로 생성, Escape 키로 취소
 */
export const FileInputDialog: React.FC<FileInputDialogProps> = ({
  type,
  value,
  onChange,
  onSubmit,
  onCancel,
}) => {
  const { t } = useTranslation();
  const isFile = type === 'file';

  return (
    <div className="mb-3 p-3 rounded-lg bg-white border border-gray-200 shadow-sm">
      {/* 헤더: 아이콘 + 타입 */}
      <div className="flex items-center gap-2 mb-2">
        {isFile ? (
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        )}
        <span className="text-xs font-medium text-gray-700">
          {isFile ? t('fileExplorer.newFile') : t('fileExplorer.newFolder')}
        </span>
      </div>

      {/* 입력 필드 */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit();
          if (e.key === 'Escape') onCancel();
        }}
        placeholder={isFile ? t('fileExplorer.fileNamePlaceholder') : t('fileExplorer.folderNamePlaceholder')}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-shadow"
        autoFocus
      />

      {/* 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={onSubmit}
          className="flex-1 px-3 py-2 text-xs font-medium text-white bg-gray-800 rounded-md hover:bg-gray-900 transition-colors"
        >
          {t('fileInput.create')}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          {t('fileInput.cancel')}
        </button>
      </div>
    </div>
  );
};
