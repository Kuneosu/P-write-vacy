/**
 * useKeyboardShortcuts hook 테스트
 * 키보드 단축키 (복사, 붙여넣기, 삭제, 복제, 이름변경) 테스트
 */

import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';
import type { FileEntry } from '../../../../types/electron';

describe('useKeyboardShortcuts', () => {
  const mockCopyToClipboard = jest.fn();
  const mockHandleDelete = jest.fn().mockResolvedValue(undefined);
  const mockHandleMultiDelete = jest.fn().mockResolvedValue(undefined);
  const mockHandleDuplicate = jest.fn().mockResolvedValue(undefined);
  const mockHandleMultiDuplicate = jest.fn().mockResolvedValue(undefined);
  const mockHandlePaste = jest.fn().mockResolvedValue(undefined);
  const mockHandleRename = jest.fn();
  const mockFindEntryInAll = jest.fn();

  const testFiles: FileEntry[] = [
    {
      name: 'file1.md',
      path: '/test/file1.md',
      type: 'file',
      created: new Date('2025-01-01'),
      modified: new Date('2025-01-01'),
    },
    {
      name: 'file2.md',
      path: '/test/file2.md',
      type: 'file',
      created: new Date('2025-01-01'),
      modified: new Date('2025-01-01'),
    },
  ];

  const defaultProps = {
    isOpen: true,
    selectedFiles: ['/test/file1.md'],
    clipboard: [],
    isRenaming: null,
    findEntryInAll: mockFindEntryInAll,
    copyToClipboard: mockCopyToClipboard,
    handleDelete: mockHandleDelete,
    handleMultiDelete: mockHandleMultiDelete,
    handleDuplicate: mockHandleDuplicate,
    handleMultiDuplicate: mockHandleMultiDuplicate,
    handlePaste: mockHandlePaste,
    handleRename: mockHandleRename,
  };

  // Mac 플랫폼 mock
  const originalPlatform = navigator.platform;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFindEntryInAll.mockImplementation((path: string) =>
      testFiles.find((f) => f.path === path) || null
    );
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'platform', {
      value: originalPlatform,
      writable: true,
    });
  });

  const dispatchKeyboardEvent = (key: string, options: Partial<KeyboardEvent> = {}) => {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...options,
    });
    document.dispatchEvent(event);
    return event;
  };

  describe('복사 (Cmd+C / Ctrl+C)', () => {
    it('Mac에서 Cmd+C로 단일 파일을 복사할 수 있다', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
      });

      renderHook(() => useKeyboardShortcuts(defaultProps));

      const event = dispatchKeyboardEvent('c', { metaKey: true });

      expect(event.defaultPrevented).toBe(true);
      expect(mockCopyToClipboard).toHaveBeenCalledWith([testFiles[0]]);
    });

    it('Windows에서 Ctrl+C로 단일 파일을 복사할 수 있다', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true,
      });

      renderHook(() => useKeyboardShortcuts(defaultProps));

      const event = dispatchKeyboardEvent('c', { ctrlKey: true });

      expect(event.defaultPrevented).toBe(true);
      expect(mockCopyToClipboard).toHaveBeenCalledWith([testFiles[0]]);
    });

    it('여러 파일을 선택하면 모두 복사된다', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
      });

      renderHook(() =>
        useKeyboardShortcuts({
          ...defaultProps,
          selectedFiles: ['/test/file1.md', '/test/file2.md'],
        })
      );

      dispatchKeyboardEvent('c', { metaKey: true });

      expect(mockCopyToClipboard).toHaveBeenCalledWith([testFiles[0], testFiles[1]]);
    });
  });

  describe('붙여넣기 (Cmd+V / Ctrl+V)', () => {
    it('Mac에서 Cmd+V로 붙여넣을 수 있다', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
      });

      renderHook(() =>
        useKeyboardShortcuts({
          ...defaultProps,
          clipboard: [testFiles[0]],
        })
      );

      const event = dispatchKeyboardEvent('v', { metaKey: true });

      expect(event.defaultPrevented).toBe(true);
      expect(mockHandlePaste).toHaveBeenCalled();
    });

    it('Windows에서 Ctrl+V로 붙여넣을 수 있다', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true,
      });

      renderHook(() =>
        useKeyboardShortcuts({
          ...defaultProps,
          clipboard: [testFiles[0]],
        })
      );

      const event = dispatchKeyboardEvent('v', { ctrlKey: true });

      expect(event.defaultPrevented).toBe(true);
      expect(mockHandlePaste).toHaveBeenCalled();
    });

    it('클립보드가 비어있으면 붙여넣기가 동작하지 않는다', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          ...defaultProps,
          clipboard: [],
        })
      );

      dispatchKeyboardEvent('v', { metaKey: true });

      expect(mockHandlePaste).not.toHaveBeenCalled();
    });
  });

  describe('복제 (Cmd+D / Ctrl+D)', () => {
    it('Mac에서 Cmd+D로 단일 파일을 복제할 수 있다', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
      });

      renderHook(() => useKeyboardShortcuts(defaultProps));

      const event = dispatchKeyboardEvent('d', { metaKey: true });

      expect(event.defaultPrevented).toBe(true);
      expect(mockHandleDuplicate).toHaveBeenCalledWith(testFiles[0]);
    });

    it('Windows에서 Ctrl+D로 단일 파일을 복제할 수 있다', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true,
      });

      renderHook(() => useKeyboardShortcuts(defaultProps));

      const event = dispatchKeyboardEvent('d', { ctrlKey: true });

      expect(event.defaultPrevented).toBe(true);
      expect(mockHandleDuplicate).toHaveBeenCalledWith(testFiles[0]);
    });

    it('여러 파일을 선택하면 모두 복제된다', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
      });

      renderHook(() =>
        useKeyboardShortcuts({
          ...defaultProps,
          selectedFiles: ['/test/file1.md', '/test/file2.md'],
        })
      );

      dispatchKeyboardEvent('d', { metaKey: true });

      expect(mockHandleMultiDuplicate).toHaveBeenCalled();
    });
  });

  describe('삭제 (Delete, Backspace, Cmd+Backspace)', () => {
    it('Delete 키로 단일 파일을 삭제할 수 있다', () => {
      renderHook(() => useKeyboardShortcuts(defaultProps));

      const event = dispatchKeyboardEvent('Delete');

      expect(event.defaultPrevented).toBe(true);
      expect(mockHandleDelete).toHaveBeenCalledWith(testFiles[0]);
    });

    it('Backspace 키로 단일 파일을 삭제할 수 있다', () => {
      renderHook(() => useKeyboardShortcuts(defaultProps));

      const event = dispatchKeyboardEvent('Backspace');

      expect(event.defaultPrevented).toBe(true);
      expect(mockHandleDelete).toHaveBeenCalledWith(testFiles[0]);
    });

    it('Mac에서 Cmd+Backspace로 단일 파일을 삭제할 수 있다', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
      });

      renderHook(() => useKeyboardShortcuts(defaultProps));

      const event = dispatchKeyboardEvent('Backspace', { metaKey: true });

      expect(event.defaultPrevented).toBe(true);
      expect(mockHandleDelete).toHaveBeenCalledWith(testFiles[0]);
    });

    it('Windows에서 Ctrl+Backspace로 단일 파일을 삭제할 수 있다', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true,
      });

      renderHook(() => useKeyboardShortcuts(defaultProps));

      const event = dispatchKeyboardEvent('Backspace', { ctrlKey: true });

      expect(event.defaultPrevented).toBe(true);
      expect(mockHandleDelete).toHaveBeenCalledWith(testFiles[0]);
    });

    it('여러 파일을 선택하면 모두 삭제된다', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          ...defaultProps,
          selectedFiles: ['/test/file1.md', '/test/file2.md'],
        })
      );

      dispatchKeyboardEvent('Delete');

      expect(mockHandleMultiDelete).toHaveBeenCalled();
    });
  });

  describe('이름 변경 (Enter)', () => {
    it('Enter 키로 이름 변경을 시작할 수 있다', () => {
      renderHook(() => useKeyboardShortcuts(defaultProps));

      const event = dispatchKeyboardEvent('Enter');

      expect(event.defaultPrevented).toBe(true);
      expect(mockHandleRename).toHaveBeenCalledWith(testFiles[0]);
    });

    it('이미 이름 변경 중이면 Enter 키가 동작하지 않는다', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          ...defaultProps,
          isRenaming: '/test/file1.md',
        })
      );

      dispatchKeyboardEvent('Enter');

      expect(mockHandleRename).not.toHaveBeenCalled();
    });
  });

  describe('조건부 동작', () => {
    it('파일 탐색기가 닫혀있으면 단축키가 동작하지 않는다', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          ...defaultProps,
          isOpen: false,
        })
      );

      dispatchKeyboardEvent('c', { metaKey: true });
      dispatchKeyboardEvent('d', { metaKey: true });
      dispatchKeyboardEvent('Delete');

      expect(mockCopyToClipboard).not.toHaveBeenCalled();
      expect(mockHandleDuplicate).not.toHaveBeenCalled();
      expect(mockHandleDelete).not.toHaveBeenCalled();
    });

    it('선택된 파일이 없으면 단축키가 동작하지 않는다', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          ...defaultProps,
          selectedFiles: [],
        })
      );

      dispatchKeyboardEvent('c', { metaKey: true });
      dispatchKeyboardEvent('d', { metaKey: true });
      dispatchKeyboardEvent('Delete');

      expect(mockCopyToClipboard).not.toHaveBeenCalled();
      expect(mockHandleDuplicate).not.toHaveBeenCalled();
      expect(mockHandleDelete).not.toHaveBeenCalled();
    });

    it('INPUT 요소에서는 단축키가 동작하지 않는다', () => {
      renderHook(() => useKeyboardShortcuts(defaultProps));

      const input = document.createElement('input');
      document.body.appendChild(input);

      const event = new KeyboardEvent('keydown', {
        key: 'c',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      });

      input.dispatchEvent(event);

      expect(mockCopyToClipboard).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('TEXTAREA 요소에서는 단축키가 동작하지 않는다', () => {
      renderHook(() => useKeyboardShortcuts(defaultProps));

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      const event = new KeyboardEvent('keydown', {
        key: 'c',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      });

      textarea.dispatchEvent(event);

      expect(mockCopyToClipboard).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    it('contentEditable 요소에서는 단축키가 동작하지 않는다', () => {
      renderHook(() => useKeyboardShortcuts(defaultProps));

      const div = document.createElement('div');
      div.contentEditable = 'true';
      document.body.appendChild(div);

      const event = new KeyboardEvent('keydown', {
        key: 'c',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      });

      div.dispatchEvent(event);

      expect(mockCopyToClipboard).not.toHaveBeenCalled();

      document.body.removeChild(div);
    });
  });

  describe('이벤트 리스너 정리', () => {
    it('언마운트 시 이벤트 리스너가 제거된다', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      const { unmount } = renderHook(() => useKeyboardShortcuts(defaultProps));

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });
});
