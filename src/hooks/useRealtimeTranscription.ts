/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';

export function useRealtimeTranscription() {
    const { audio, addSubtitle } = useStore();
    const recognitionRef = useRef<any>(null);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech recognition not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            const result = event.results[event.results.length - 1];
            if (result.isFinal) {
                const text = result[0].transcript.trim();
                if (text) {
                    addSubtitle({
                        id: Math.random().toString(36).substring(2, 9),
                        start: Math.max(0, audio.currentTime - 1),
                        end: audio.currentTime + 1,
                        text,
                    });
                }
            }
        };

        recognition.onend = () => {
            if (isActive && audio.isPlaying) {
                try {
                    recognition.start();
                } catch (e) {
                    console.error("Speech recognition restart failed", e);
                }
            }
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.stop();
        };
    }, [addSubtitle, audio.currentTime, audio.isPlaying, isActive]);

    const toggleTranscription = () => {
        if (!recognitionRef.current) return;

        if (isActive) {
            recognitionRef.current.stop();
            setIsActive(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsActive(true);
            } catch (e) {
                console.error("Speech recognition start failed", e);
            }
        }
    };

    return { isActive, toggleTranscription };
}
