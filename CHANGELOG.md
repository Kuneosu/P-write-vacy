# Changelog

All notable changes to Pwritevacy will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-beta] - 2025-11-13

### Added
- 다국어 지원 (한국어/영어) with react-i18next
- 온보딩 화면 드래그 기능
- Apple Developer ID 인증서로 코드 서명
- macOS Notarization 완료 (정식 배포 가능)

### Changed
- 앱 이름을 "Pwritevacy"로 통일 (p-write-vacy-react → Pwritevacy)
- 버전을 v1.0.0-beta로 업그레이드
- 프로덕션 빌드에서 개발자 도구 제거

### Fixed
- 온보딩 페이지에서 앱 드래그 불가 문제 해결

## [0.3.0] - 2025-11-07

### Added
- Jest 테스트 환경 구축 (106개 테스트, 89% 커버리지)
- FileExplorer 테스트 스위트 6개 작성

### Changed
- **대규모 리팩토링**: FileExplorer 1,497줄 → 330줄 (78% 감소)
  - 11개 모듈로 분리 (Hooks 6개, Components 5개, Utils 1개)
  - TypeScript 타입 안전성 100% 달성
  - 테스트 가능한 구조로 전환

### Improved
- 코드 품질 75% → 95% 향상
- 유지보수성 대폭 개선

## [0.2.0] - 2025-11-06

### Added
- ErrorBoundary 컴포넌트 (React 에러 처리)
- Toast 알림 시스템 (성공/에러/정보/경고)
- SaveStatus 컴포넌트 (저장 상태 표시)
- ToastContext (전역 토스트 상태 관리)

### Security
- 파일 경로 검증 추가 (경로 공격 방지)
- 파일 크기 제한 (100MB)
- DevTools 프로덕션 빌드에서 제거

### Fixed
- 파일 전환 시 이전 파일 자동 저장 확인
- 저장 상태 UI/UX 개선 (3차 반복)

## [0.1.0] - 2025-11-05

### Added
- 프라이버시 모드 (커서 주변 포커스 영역)
- 파일 탐색기 (생성/수정/삭제/복제)
- 마크다운 뷰어 (GitHub Flavored Markdown)
- 프리셋 시스템 (최대 3개)
- 자동 저장 (1초 지연)
- 키보드 단축키 지원
- Electron 데스크톱 앱 구조

### Technical
- React 19 + TypeScript
- TailwindCSS 스타일링
- Vite 빌드 시스템
- Electron 39

---

## Upcoming

### v1.0.0 (정식 릴리스)
- 베타 테스트 피드백 반영
- 성능 최적화 (대용량 폴더)
- 접근성 개선 (WCAG 2.1 AA)
- Windows/Linux 버전

### v1.1.0
- 다크 모드
- 클라우드 동기화
- 코드 블록 문법 강조
- 플러그인 시스템
