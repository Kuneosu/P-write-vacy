export interface CaretPosition {
  x: number;
  y: number;
}

export interface FocusSettings {
  radiusX: number;
  radiusY: number;
  blurColor: string;
  blurOpacity: number;
  blurSpread: number; // 테두리 번짐 정도 (0-100)
  blurIntensity: number; // 블러 강도 (0-20px)
  focusShape: 'ellipse' | 'rectangle'; // 포커스 영역 모양
}

export interface AppState {
  privacyActive: boolean;
  focusSettings: FocusSettings;
  sidebarOpen: boolean;
}
