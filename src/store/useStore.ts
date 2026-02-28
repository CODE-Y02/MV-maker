import { create } from 'zustand';
import { AppState, Layer, ProjectAsset } from '../types';
import { ProjectStorage } from '../lib/storage';
import { processAudioFile } from '../lib/audio-processor';

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useStore = create<AppState>((set, get) => ({
    name: 'Untitled Project',

    audio: {
        assetId: null,
        buffer: null,
        peaks: [],
        isPlaying: false,
        currentTime: 0,
        duration: 0,
    },

    assets: [],
    layers: [],
    subtitles: [],

    selectedLayerId: null,
    selectedAssetId: null,
    activeSidebarTab: 'assets',

    // Asset Actions
    addAsset: async (file: File) => {
        const id = generateId();
        await ProjectStorage.saveAsset(id, file);

        let url: string | undefined;
        // Pre-create object URLs for images so we can render them synchronously into canvas later
        // We will probably need to manage object URL lifecycles carefully in a real app
        if (file.type.startsWith('image/')) {
            url = URL.createObjectURL(file);
        }

        const newAsset: ProjectAsset = {
            id,
            name: file.name,
            type: file.type.startsWith('audio/') ? 'audio' : 'image',
            mimeType: file.type,
            size: file.size,
            url
        };

        set((state) => ({ assets: [...state.assets, newAsset] }));
    },

    removeAsset: async (id: string) => {
        const state = get();
        const asset = state.assets.find(a => a.id === id);

        if (asset?.url) {
            URL.revokeObjectURL(asset.url);
        }

        await ProjectStorage.deleteAsset(id);

        // Remove associated layers
        const newLayers = state.layers.filter(l => !(l.type === 'image' && l.assetId === id));

        // Reset audio if we deleted the current track
        let newAudio = { ...state.audio };
        if (state.audio.assetId === id) {
            newAudio = {
                assetId: null,
                buffer: null,
                peaks: [],
                isPlaying: false,
                currentTime: 0,
                duration: 0,
            };
        }

        set({
            assets: state.assets.filter(a => a.id !== id),
            layers: newLayers,
            audio: newAudio,
            selectedAssetId: state.selectedAssetId === id ? null : state.selectedAssetId
        });
    },

    // Audio Actions
    setAudioTrack: async (assetId: string) => {
        const file = await ProjectStorage.getAsset(assetId) as File;
        if (!file) return;

        set((state) => ({ audio: { ...state.audio, assetId } }));

        try {
            const { buffer, peaks } = await processAudioFile(file);
            // After processing, audio duration should be set based on buffer
            set((state) => ({
                audio: {
                    ...state.audio,
                    buffer,
                    peaks,
                    duration: buffer.duration
                }
            }));
        } catch (error) {
            console.error("Failed to process audio:", error);
        }
    },

    setAudioStatus: (status) => set((state) => ({ audio: { ...state.audio, ...status } })),

    // Layer Actions
    addLayerFromAsset: (assetId: string, layerId?: string) => {
        const state = get();
        const asset = state.assets.find(a => a.id === assetId);

        if (!asset || asset.type !== 'image') return;

        if (layerId) {
            // Replace existing image layer asset
            set((state) => ({
                layers: state.layers.map(l => l.id === layerId && l.type === 'image' ? { ...l, assetId: assetId, name: asset.name } : l)
            }));
            return;
        }

        const id = generateId();
        const newLayer: Layer = {
            id,
            name: asset.name,
            type: 'image',
            zIndex: state.layers.length,
            visible: true,
            opacity: 1,
            transform: { x: 427, y: 240, scale: 1, rotation: 0 },
            startTime: 0,
            duration: state.audio.duration || 60,
            assetId: assetId
        };

        set((state) => ({ layers: [...state.layers, newLayer], selectedLayerId: id }));
    },

    addTextLayer: () => {
        const id = generateId();
        const state = get();
        const newLayer: Layer = {
            id,
            name: 'New Text',
            type: 'text',
            zIndex: state.layers.length,
            visible: true,
            opacity: 1,
            transform: { x: 427, y: 240, scale: 1, rotation: 0 },
            startTime: 0,
            duration: state.audio.duration || 60,
            text: 'Text Layer',
            fontSize: 48,
            color: '#ffffff',
            fontFamily: 'Inter',
            fontWeight: 'normal',
            fontStyle: 'normal'
        };
        set((state) => ({ layers: [...state.layers, newLayer], selectedLayerId: id }));
    },

    addVisualizerLayer: () => {
        const id = generateId();
        const state = get();
        const newLayer: Layer = {
            id,
            name: 'New Visualizer',
            type: 'visualizer',
            zIndex: state.layers.length,
            visible: true,
            opacity: 1,
            transform: { x: 427, y: 240, scale: 1, rotation: 0 },
            startTime: 0,
            duration: state.audio.duration || 60,
            template: 'bars',
            color: '#3b82f6',
            sensitivity: 1.5,
            thickness: 2,
            barCount: 64,
            hasArea: false
        };
        set((state) => ({ layers: [...state.layers, newLayer], selectedLayerId: id }));
    },

    updateLayer: (id, updates) => set((state) => ({
        layers: state.layers.map((l) => l.id === id ? { ...l, ...updates } as Layer : l)
    })),

    removeLayer: (id) => set((state) => ({
        layers: state.layers.filter((l) => l.id !== id),
        selectedLayerId: state.selectedLayerId === id ? null : state.selectedLayerId
    })),

    moveLayerUp: (id: string) => set((state) => {
        // "Up" in timeline means moving to front visually -> higher zIndex
        const newLayers = [...state.layers].sort((a, b) => a.zIndex - b.zIndex);
        const index = newLayers.findIndex(l => l.id === id);
        if (index >= newLayers.length - 1 || index === -1) return state; // Already at front or not found

        const temp = { ...newLayers[index + 1] };
        newLayers[index + 1] = { ...newLayers[index] };
        newLayers[index] = temp;

        // Fix zIndex values after swap with immutable copies
        const finalizedLayers = newLayers.map((layer, i) => ({ ...layer, zIndex: i }));
        return { layers: finalizedLayers };
    }),

    moveLayerDown: (id: string) => set((state) => {
        // "Down" in timeline means moving to back visually -> lower zIndex
        const newLayers = [...state.layers].sort((a, b) => a.zIndex - b.zIndex);
        const index = newLayers.findIndex(l => l.id === id);
        if (index <= 0) return state; // Already at back or not found

        const temp = { ...newLayers[index - 1] };
        newLayers[index - 1] = { ...newLayers[index] };
        newLayers[index] = temp;

        // Fix zIndex values after swap with immutable copies
        const finalizedLayers = newLayers.map((layer, i) => ({ ...layer, zIndex: i }));
        return { layers: finalizedLayers };
    }),

    reorderLayers: (newLayers) => set({ layers: newLayers }),

    setSelectedLayerId: (id) => set({ selectedLayerId: id, activeSidebarTab: 'inspector' }),

    // Subtitle Actions
    addSubtitle: (subtitle) => set((state) => ({ subtitles: [...state.subtitles, subtitle] })),
    updateSubtitle: (id, updates) => set((state) => ({
        subtitles: state.subtitles.map((s) => s.id === id ? { ...s, ...updates } : s)
    })),
    removeSubtitle: (id) => set((state) => ({
        subtitles: state.subtitles.filter((s) => s.id !== id)
    })),

    // Export State
    export: {
        isExporting: false,
        progress: 0,
        setIsExporting: (isExporting) => set((state) => ({ export: { ...state.export, isExporting } })),
        setProgress: (progress) => set((state) => ({ export: { ...state.export, progress } })),
    }
}));
