export type LayerType = 'image' | 'visualizer' | 'text' | 'lyrics';

export interface LayerTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface BaseLayer {
  id: string;
  name: string;
  type: LayerType;
  zIndex: number;
  visible: boolean;
  opacity: number;
  blendMode?: GlobalCompositeOperation;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  transform: LayerTransform;
  startTime: number; // For timeline sync
  duration: number;  // For timeline sync
}

export interface ImageLayer extends BaseLayer {
  type: 'image';
  assetId: string; // References ProjectAsset
}

export interface VisualizerLayer extends BaseLayer {
  type: 'visualizer';
  template: 'bars' | 'circular' | 'waveform' | 'bass' | 'particles';
  color: string;
  sensitivity: number;
  thickness: number;
  barCount?: number;
  hasArea?: boolean;
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  text: string;
  fontSize: number;
  color: string;
  fontFamily: string;
  fontWeight?: string;
  fontStyle?: string;
}

export interface LyricsLayer extends BaseLayer {
  type: 'lyrics';
  fontSize: number;
  color: string;
  fontFamily: string;
  alignment: 'top' | 'middle' | 'bottom';
}

export type Layer = ImageLayer | VisualizerLayer | TextLayer | LyricsLayer;

export interface ProjectAsset {
  id: string;
  name: string;
  type: 'audio' | 'image';
  mimeType: string;
  size: number;
  url?: string; // Temporary Blob URL for rendering
}

export interface AudioState {
  assetId: string | null;
  buffer: AudioBuffer | null;
  peaks: number[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

export interface Subtitle {
  id: string;
  start: number;
  end: number;
  text: string;
}

export interface AppState {
  // Project Info
  name: string;

  // Media State
  audio: AudioState;
  assets: ProjectAsset[];
  layers: Layer[];
  subtitles: Subtitle[];

  // UI State
  selectedLayerId: string | null;
  selectedAssetId: string | null;
  activeSidebarTab: string;

  // Actions
  // Asset Actions
  addAsset: (file: File) => Promise<void>;
  removeAsset: (id: string) => Promise<void>;

  // Audio Actions
  setAudioTrack: (assetId: string) => Promise<void>;
  setAudioStatus: (status: Partial<AudioState>) => void;

  // Layer Actions
  addLayerFromAsset: (assetId: string, layerId?: string) => void;
  addTextLayer: () => void;
  addVisualizerLayer: () => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  removeLayer: (id: string) => void;
  moveLayerUp: (id: string) => void;
  moveLayerDown: (id: string) => void;
  reorderLayers: (newLayers: Layer[]) => void;
  setSelectedLayerId: (id: string | null) => void;

  // Subtitle Actions
  addSubtitle: (subtitle: Subtitle) => void;
  updateSubtitle: (id: string, updates: Partial<Subtitle>) => void;
  removeSubtitle: (id: string) => void;

  // Export
  export: ExportState;
}

export interface ExportState {
  isExporting: boolean;
  progress: number;
  setIsExporting: (is: boolean) => void;
  setProgress: (p: number) => void;
}
