import React from 'react';
import type { SortOrder } from '../../../types/electron';
import { Tooltip } from '../../Tooltip';
import { getSortOrderLabel } from '../utils/fileUtils';

interface FileToolbarProps {
  // Folder state
  currentFolder: string | null;
  expandedFolders: Set<string>;

  // Sort state
  sortOrder: SortOrder;
  showSortMenu: boolean;
  onSortOrderChange: (order: SortOrder) => void;
  onToggleSortMenu: () => void;

  // Actions
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onSelectFolder: () => void;
}

/**
 * 파일 탐색기 상단 툴바 컴포넌트
 * 파일/폴더 생성, 펼치기/접기, 정렬, 폴더 선택 버튼 제공
 */
export const FileToolbar: React.FC<FileToolbarProps> = ({
  currentFolder,
  expandedFolders,
  sortOrder,
  showSortMenu,
  onSortOrderChange,
  onToggleSortMenu,
  onCreateFile,
  onCreateFolder,
  onExpandAll,
  onCollapseAll,
  onSelectFolder,
}) => {
  const sortOrders: SortOrder[] = [
    'name-asc',
    'name-desc',
    'modified-desc',
    'modified-asc',
    'created-desc',
    'created-asc',
  ];

  return (
    <div className="flex items-center justify-between mb-3 px-3 py-2 bg-white border-b border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700">파일</h3>
      <div className="flex gap-2">
        {currentFolder && (
          <>
            {/* 새 파일 만들기 */}
            <Tooltip content="새 파일 만들기">
              <button
                onClick={onCreateFile}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            </Tooltip>

            {/* 새 폴더 만들기 */}
            <Tooltip content="새 폴더 만들기">
              <button
                onClick={onCreateFolder}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
              </button>
            </Tooltip>

            {/* 모두 펼치기/접기 */}
            <Tooltip content={expandedFolders.size > 0 ? "모두 접기" : "모두 펼치기"}>
              <button
                onClick={expandedFolders.size > 0 ? onCollapseAll : onExpandAll}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                {expandedFolders.size > 0 ? (
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </Tooltip>

            {/* 정렬 메뉴 */}
            <div className="relative sort-menu-container">
              <Tooltip content="정렬 순서 변경">
                <button
                  onClick={onToggleSortMenu}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                </button>
              </Tooltip>
              {showSortMenu && (
                <div
                  className="absolute right-0 mt-1 w-44 bg-white rounded-md shadow-lg border border-gray-200 z-10 sort-menu-container"
                  style={{ marginRight: '4px' }}
                >
                  {sortOrders.map((order) => (
                    <button
                      key={order}
                      onClick={() => {
                        onSortOrderChange(order);
                        onToggleSortMenu();
                      }}
                      className={`w-full text-left px-2 py-2 text-xs hover:bg-gray-100 transition-colors ${
                        sortOrder === order ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {getSortOrderLabel(order)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* 작업 폴더 선택 */}
        <Tooltip content="작업 폴더 선택">
          <button
            onClick={onSelectFolder}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </button>
        </Tooltip>
      </div>
    </div>
  );
};
