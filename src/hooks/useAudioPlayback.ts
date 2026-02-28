'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Howl, Howler } from 'howler';

export function useAudioPlayback() {
    const { audio, assets, setAudioStatus } = useStore();
    const howlRef = useRef<Howl | null>(null);
    const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
    const requestRef = useRef<number>(0);

    // Initialize Analyser safely
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const initAnalyser = () => {
            if (Howler.ctx && !analyser) {
                const newAnalyser = Howler.ctx.createAnalyser();
                newAnalyser.fftSize = 256;
                Howler.masterGain.connect(newAnalyser);
                setAnalyser(newAnalyser);
                console.log("Visualizer Analyser Initialized and Connected");
            }
        };

        if (Howler.ctx) {
            initAnalyser();
        } else {
            const handleTouch = () => {
                initAnalyser();
                window.removeEventListener('click', handleTouch);
                window.removeEventListener('keydown', handleTouch);
            };
            window.addEventListener('click', handleTouch);
            window.addEventListener('keydown', handleTouch);
            return () => {
                window.removeEventListener('click', handleTouch);
                window.removeEventListener('keydown', handleTouch);
            };
        }
    }, [analyser]);

    // Handle Audio Asset changes and initialization
    useEffect(() => {
        if (!audio.assetId) {
            if (howlRef.current) {
                howlRef.current.unload();
                howlRef.current = null;
            }
            return;
        }

        const currentAsset = assets.find(a => a.id === audio.assetId);
        if (!currentAsset || !currentAsset.url) return;

        // Cleanup previous
        if (howlRef.current) {
            howlRef.current.unload();
        }

        const newHowl = new Howl({
            src: [currentAsset.url],
            format: [currentAsset.name.split('.').pop() || 'mp3'],
            html5: false,
            onload: () => {
                console.log("Audio loaded, duration:", newHowl.duration());
                setAudioStatus({ duration: newHowl.duration() });
            },
            onloaderror: (id, err) => {
                console.error("Howler Load Error:", err, "URL:", currentAsset.url, "Format:", currentAsset.name.split('.').pop());
            },
            onplayerror: (id, err) => {
                console.error("Howler Play Error:", err);
                newHowl.once('unlock', () => {
                    newHowl.play();
                });
            },
            onend: () => {
                setAudioStatus({ isPlaying: false, currentTime: 0 });
            }
        });

        howlRef.current = newHowl;

        return () => {
            newHowl.unload();
            howlRef.current = null;
        };
    }, [audio.assetId]); // Only re-run when track changes

    // Handle Play/Pause and Progress tracking
    useEffect(() => {
        if (!howlRef.current) return;

        let animationFrameId: number;

        const updateProgress = () => {
            if (howlRef.current && howlRef.current.playing()) {
                const seek = howlRef.current.seek() as number;
                useStore.getState().setAudioStatus({ currentTime: seek });
                animationFrameId = requestAnimationFrame(updateProgress);
            }
        };

        if (audio.isPlaying) {
            if (Howler.ctx && Howler.ctx.state === 'suspended') {
                Howler.ctx.resume().then(() => console.log('AudioContext resumed'));
            }

            if (!howlRef.current.playing()) {
                howlRef.current.play();
                howlRef.current.seek(audio.currentTime); // Ensure starting at right point
            }
            // Start loop
            animationFrameId = requestAnimationFrame(updateProgress);
        } else {
            if (howlRef.current.playing()) {
                howlRef.current.pause();
                // Push exact seek state to store on pause
                useStore.getState().setAudioStatus({ currentTime: howlRef.current.seek() as number });
            }
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [audio.isPlaying]); // Only trigger on play/pause toggle

    // Handle Manual Seeking (triggered from Timeline clicks)
    useEffect(() => {
        if (!howlRef.current) return;

        const currentSeek = howlRef.current.seek() as number;

        // If the store's time is significantly different from Howler's internal time (>0.3s)
        // AND we're not currently dragging or just normally playing
        if (Math.abs(currentSeek - audio.currentTime) > 0.3) {
            howlRef.current.seek(audio.currentTime);
        }
    }, [audio.currentTime]);

    return { analyser };
}
