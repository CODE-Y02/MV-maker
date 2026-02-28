'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { get, set } from 'idb-keyval';
import { AppState, ProjectAsset } from '@/types';
import { ProjectStorage } from '@/lib/storage';

const PROJECT_STORAGE_KEY = 'music_maker_project_v1';

export function useProjectSync() {
    const isInitialized = useRef(false);

    // Initial Load
    useEffect(() => {
        const loadProject = async () => {
            if (isInitialized.current) return;

            try {
                const savedState = await get(PROJECT_STORAGE_KEY);
                if (savedState) {
                    const state = JSON.parse(savedState) as Partial<AppState>;

                    // Rehydrate asset blob URLs from IndexedDB
                    const restoredAssets: ProjectAsset[] = state.assets || [];
                    for (const asset of restoredAssets) {
                        try {
                            const file = await ProjectStorage.getAsset(asset.id) as File;
                            if (file) {
                                asset.url = URL.createObjectURL(file);
                            }
                        } catch (e) {
                            console.error("Failed to load asset file:", asset.id, e);
                        }
                    }

                    useStore.setState({
                        name: state.name || 'Untitled Project',
                        assets: restoredAssets,
                        layers: state.layers || [],
                        subtitles: state.subtitles || [],
                        audio: {
                            ...useStore.getState().audio,
                            assetId: state.audio?.assetId || null,
                            duration: state.audio?.duration || 0,
                            currentTime: 0,
                            isPlaying: false,
                        }
                    });

                    if (state.audio?.assetId) {
                        useStore.getState().setAudioTrack(state.audio.assetId);
                    }
                }
            } catch (error) {
                console.error("Failed to load project from IndexedDB:", error);
            } finally {
                isInitialized.current = true;
            }
        };

        loadProject();
    }, []);

    // Auto-Save via Zustand Subscription
    useEffect(() => {
        const unsubscribe = useStore.subscribe((state) => {
            if (!isInitialized.current) return;

            const stateToSave = {
                name: state.name,
                assets: state.assets,
                layers: state.layers,
                subtitles: state.subtitles,
                audio: {
                    assetId: state.audio.assetId,
                    duration: state.audio.duration,
                }
            };

            set(PROJECT_STORAGE_KEY, JSON.stringify(stateToSave)).catch(err => {
                console.error("Failed to auto-save project:", err);
            });
        });

        return unsubscribe;
    }, []);
}
