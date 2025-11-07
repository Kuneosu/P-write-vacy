import React from 'react';

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
  const isFile = type === 'file';

  return (
    <div
      className={`mb-3 p-2 rounded border ${
        isFile
          ? 'bg-blue-50 border-blue-200'
          : 'bg-green-50 border-green-200'
      }`}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit();
          if (e.key === 'Escape') onCancel();
        }}
        placeholder={isFile ? '파일 이름 (예: note.md)' : '폴더 이름'}
        className={`w-full px-2 py-1 text-sm border rounded mb-2 focus:outline-none focus:ring-2 ${
          isFile
            ? 'border-blue-300 focus:ring-blue-500'
            : 'border-green-300 focus:ring-green-500'
        }`}
        autoFocus
      />
      <div className="flex gap-2">
        <button
          onClick={onSubmit}
          className={`flex-1 px-2 py-1 text-xs text-white rounded transition-colors ${
            isFile
              ? 'bg-blue-500 hover:bg-blue-600'
              : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          생성
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
        >
          취소
        </button>
      </div>
    </div>
  );
};
