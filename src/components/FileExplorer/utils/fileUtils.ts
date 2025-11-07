import React from 'react';
import type { FileEntry, SortOrder } from '../../../types/electron';

/**
 * 정렬 순서 라벨 반환
 */
export const getSortOrderLabel = (order: SortOrder): string => {
  switch (order) {
    case 'name-asc':
      return '파일 이름 (알파벳순)';
    case 'name-desc':
      return '파일 이름 (알파벳 역순)';
    case 'modified-desc':
      return '업데이트 날짜 (최신순)';
    case 'modified-asc':
      return '업데이트 날짜 (오래된 순)';
    case 'created-desc':
      return '생성일 (최신순)';
    case 'created-asc':
      return '생성일 (오래된 순)';
  }
};

/**
 * 모든 파일/폴더에서 path로 entry 찾기
 */
export const findEntryInAll = (
  path: string,
  files: FileEntry[],
  folderContents: Map<string, FileEntry[]>
): FileEntry | null => {
  // Search in root files
  const rootEntry = files.find(f => f.path === path);
  if (rootEntry) return rootEntry;

  // Search in expanded folders
  for (const [, entries] of folderContents) {
    const entry = entries.find(f => f.path === path);
    if (entry) return entry;
  }
  return null;
};

/**
 * 날짜를 상대적 또는 절대적 형식으로 포맷팅
 */
export const formatDate = (date: Date | undefined): string => {
  if (!date) return '알 수 없음';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * 드래그 중인 항목들의 라벨 생성
 */
export const getDraggedItemsLabel = (draggedItems: FileEntry[]): string => {
  if (draggedItems.length === 0) return '';
  if (draggedItems.length === 1) return draggedItems[0].name;

  const fileCount = draggedItems.filter(item => item.type === 'file').length;
  const folderCount = draggedItems.filter(item => item.type === 'directory').length;

  if (fileCount > 0 && folderCount > 0) {
    return `파일 ${fileCount}개, 폴더 ${folderCount}개`;
  } else if (fileCount > 0) {
    return `파일 ${fileCount}개`;
  } else {
    return `폴더 ${folderCount}개`;
  }
};

/**
 * 드롭 타겟 폴더 이름 가져오기
 */
export const getDropTargetName = (
  dropTarget: string | null,
  currentFolder: string | null,
  files: FileEntry[],
  folderContents: Map<string, FileEntry[]>
): string | null => {
  if (!dropTarget) return null;

  if (dropTarget === 'root') {
    return currentFolder?.split('/').pop() || '루트';
  }

  // Find the folder in files or folderContents
  const findFolder = (entries: FileEntry[]): string | null => {
    for (const entry of entries) {
      if (entry.path === dropTarget && entry.type === 'directory') {
        return entry.name;
      }
    }
    return null;
  };

  // Search in root files
  let folderName = findFolder(files);
  if (folderName) return folderName;

  // Search in expanded folders
  for (const [, entries] of folderContents) {
    folderName = findFolder(entries);
    if (folderName) return folderName;
  }

  return null;
};

/**
 * 폴더 내부 통계 가져오기
 */
export const getFolderStats = (
  folderPath: string,
  folderContents: Map<string, FileEntry[]>
): { files: number; folders: number } | null => {
  const contents = folderContents.get(folderPath);
  if (!contents) return null;

  const files = contents.filter(e => e.type === 'file').length;
  const folders = contents.filter(e => e.type === 'directory').length;
  return { files, folders };
};

/**
 * 파일 Tooltip 콘텐츠 생성
 */
export const getFileTooltipContent = (entry: FileEntry): React.ReactNode => {
  return React.createElement('div', { className: 'space-y-1' },
    React.createElement('div', { className: 'font-medium' }, entry.name),
    React.createElement('div', { className: 'text-xs text-gray-300' },
      React.createElement('div', null, `수정: ${formatDate(entry.modified)}`),
      React.createElement('div', null, `생성: ${formatDate(entry.created)}`)
    )
  );
};

/**
 * 폴더 Tooltip 콘텐츠 생성
 */
export const getFolderTooltipContent = (
  entry: FileEntry,
  folderContents: Map<string, FileEntry[]>
): React.ReactNode => {
  const stats = getFolderStats(entry.path, folderContents);

  return React.createElement('div', { className: 'space-y-1' },
    React.createElement('div', { className: 'font-medium' }, entry.name),
    stats
      ? React.createElement('div', { className: 'text-xs text-gray-300' },
          React.createElement('div', null, `폴더 ${stats.folders}개`),
          React.createElement('div', null, `파일 ${stats.files}개`)
        )
      : React.createElement('div', { className: 'text-xs text-gray-300' }, '클릭하여 내용 확인')
  );
};
