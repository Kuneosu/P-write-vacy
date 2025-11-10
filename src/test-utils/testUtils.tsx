/**
 * 테스트 유틸리티 함수
 * 공통으로 사용되는 테스트 헬퍼 함수들
 */

import React from 'react';
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { ToastProvider } from '../contexts/ToastContext';
import type { FileEntry } from '../types/electron';
import i18n from '../i18n/config';

/**
 * ToastProvider와 I18nextProvider로 감싸진 render 함수
 */
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <I18nextProvider i18n={i18n}>
      <ToastProvider>{children}</ToastProvider>
    </I18nextProvider>
  );
};

export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, { wrapper: AllTheProviders, ...options });
};

/**
 * Mock FileEntry 생성 헬퍼
 */
export const createMockFileEntry = (
  overrides?: Partial<FileEntry>
): FileEntry => {
  const defaultEntry: FileEntry = {
    name: 'test-file.md',
    path: '/test-folder/test-file.md',
    type: 'file',
    created: new Date('2025-01-01'),
    modified: new Date('2025-01-02'),
  };

  return { ...defaultEntry, ...overrides };
};

/**
 * Mock FileEntry 목록 생성 헬퍼
 */
export const createMockFileEntries = (count: number): FileEntry[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockFileEntry({
      name: `file-${index + 1}.md`,
      path: `/test-folder/file-${index + 1}.md`,
    })
  );
};

/**
 * Mock 폴더 FileEntry 생성 헬퍼
 */
export const createMockFolderEntry = (
  overrides?: Partial<FileEntry>
): FileEntry => {
  const defaultEntry: FileEntry = {
    name: 'test-folder',
    path: '/test-folder/test-folder',
    type: 'directory',
    created: new Date('2025-01-01'),
    modified: new Date('2025-01-01'),
  };

  return { ...defaultEntry, ...overrides };
};

/**
 * 비동기 작업 완료 대기 (act 경고 방지)
 */
export const waitForAsync = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

/**
 * React 18+ renderHook re-export
 * @testing-library/react에 renderHook이 포함되어 있음
 */
export { renderHook } from '@testing-library/react';

/**
 * 모든 테스트 유틸리티 re-export
 */
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
