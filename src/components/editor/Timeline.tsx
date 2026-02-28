'use client';

import React, { useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Layers, MoveUp, MoveDown, Trash2, Clock, SkipBack, SkipForward, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clsx } from 'clsx';
import { Layer } from '@/types';

export function Timeline() {
    const { audio, layers, selectedLayerId, setSelectedLayerId, removeLayer, moveLayerUp, moveLayerDown } = useStore();
    const timelineRef = useRef<HTMLDivElement>(null);
    const waveformRef = useRef<HTMLCanvasElement>(null);

    const HEADER_WIDTH = 150;

    // Waveform rendering
    useEffect(() => {
        const canvas = waveformRef.current;
        if (!canvas || audio.peaks.length === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        ctx.fillStyle = '#6366f1'; // indigo-500
        const barWidth = width / audio.peaks.length;

        audio.peaks.forEach((peak, i) => {
            const x = i * barWidth;
            const barHeight = peak * height;
            ctx.fillRect(x, (height - barHeight) / 2, barWidth - 1, barHeight);
        });
    }, [audio.peaks]);

    const handleTimelineClick = (e: React.MouseEvent) => {
        if (!timelineRef.current || !audio.duration) return;
        const rect = timelineRef.current.getBoundingClientRect();
        // Adjust x for scroll and header width
        const scrollLeft = timelineRef.current.scrollLeft;
        const clickX = e.clientX - rect.left - HEADER_WIDTH + scrollLeft;
        const contentWidth = rect.width - HEADER_WIDTH;

        // Bounds check
        if (clickX < 0) return;

        // Calculate progress
        const progress = Math.max(0, Math.min(1, clickX / contentWidth));
        useStore.getState().setAudioStatus({ currentTime: progress * audio.duration });
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // --- Drag Interaction State ---
    const [draggingState, setDraggingState] = React.useState<{
        id: string;
        type: 'start' | 'end' | 'move';
        initialX: number;
        initialStartTime: number;
        initialDuration: number;
    } | null>(null);

    // Timeline Scroll Sync
    const headersScrollRef = useRef<HTMLDivElement>(null);
    const tracksScrollRef = useRef<HTMLDivElement>(null);

    const handleTracksScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (headersScrollRef.current) {
            headersScrollRef.current.scrollTop = e.currentTarget.scrollTop;
        }
    };

    const handleHeadersScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (tracksScrollRef.current) {
            tracksScrollRef.current.scrollTop = e.currentTarget.scrollTop;
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!draggingState || !audio.duration || !timelineRef.current) return;

            const rect = timelineRef.current.getBoundingClientRect();
            // Get pixels per second ratio
            const pxPerSec = (rect.width - HEADER_WIDTH) / audio.duration;

            const deltaX = e.clientX - draggingState.initialX;
            const deltaSec = deltaX / pxPerSec;

            if (draggingState.type === 'end') {
                const newDuration = Math.max(0.5, draggingState.initialDuration + deltaSec);
                // Ensure we don't drag past the end of the audio track (optional, but good for UX)
                const clampedDuration = Math.min(newDuration, audio.duration - draggingState.initialStartTime);
                useStore.getState().updateLayer(draggingState.id, { duration: clampedDuration });
            } else if (draggingState.type === 'start') {
                const newStartTime = Math.max(0, draggingState.initialStartTime + deltaSec);
                // Adjust duration so the right edge stays in the same place
                const newDuration = Math.max(0.5, draggingState.initialDuration - deltaSec);
                if (newStartTime + newDuration <= audio.duration && newStartTime < draggingState.initialStartTime + draggingState.initialDuration - 0.5) {
                    useStore.getState().updateLayer(draggingState.id, {
                        startTime: newStartTime,
                        duration: newDuration
                    });
                }
            } else if (draggingState.type === 'move') {
                const newStartTime = Math.max(0, draggingState.initialStartTime + deltaSec);
                // Ensure it doesn't get dragged completely off the right edge
                const clampedStartTime = Math.min(newStartTime, audio.duration - 0.5);
                useStore.getState().updateLayer(draggingState.id, { startTime: clampedStartTime });
            }
        };

        const handleMouseUp = () => {
            setDraggingState(null);
        };

        if (draggingState) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingState, audio.duration]);

    const renderTrackItem = (layer: Layer) => {
        const safeAudioDuration = audio.duration || Math.max(0.1, layer.duration);
        const safeStartTime = isNaN(layer.startTime) ? 0 : layer.startTime;
        const safeDuration = isNaN(layer.duration) || layer.duration === 0 ? 60 : layer.duration;

        const leftPercent = (safeStartTime / safeAudioDuration) * 100;
        const widthPercent = (safeDuration / safeAudioDuration) * 100;

        return (
            <div
                key={layer.id}
                onMouseDown={(e) => {
                    e.stopPropagation();
                    setSelectedLayerId(layer.id);
                    setDraggingState({
                        id: layer.id,
                        type: 'move',
                        initialX: e.clientX,
                        initialStartTime: layer.startTime,
                        initialDuration: layer.duration
                    });
                }}
                className={clsx(
                    "absolute h-[80%] top-[10%] rounded-md border text-[10px] items-center flex font-medium px-2 py-1 truncate cursor-grab active:cursor-grabbing transition-colors shadow-sm z-50 select-none",
                    selectedLayerId === layer.id
                        ? "bg-primary/90 text-primary-foreground border-primary"
                        : "bg-muted/90 text-foreground border-muted-foreground/30 hover:bg-muted"
                )}
                style={{
                    left: `${Math.max(0, leftPercent)}%`,
                    width: `${Math.min(100 - leftPercent, widthPercent)}%`,
                }}
            >
                <span className="truncate w-full pointer-events-none">{layer.name}</span>

                {/* Drag Handles */}
                <div
                    className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-primary/50"
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggingState({
                            id: layer.id,
                            type: 'start',
                            initialX: e.clientX,
                            initialStartTime: layer.startTime,
                            initialDuration: layer.duration
                        });
                    }}
                />
                <div
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-primary/50"
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggingState({
                            id: layer.id,
                            type: 'end',
                            initialX: e.clientX,
                            initialStartTime: layer.startTime,
                            initialDuration: layer.duration
                        });
                    }}
                />
            </div>
        );
    };

    return (
        <div className="h-64 border-t bg-card flex flex-col shrink-0 text-foreground">
            {/* Controls Bar */}
            <div className="h-10 border-b flex items-center justify-between px-4 shrink-0 bg-muted/10">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => useStore.getState().setAudioStatus({ currentTime: 0 })}>
                        <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => useStore.getState().setAudioStatus({ isPlaying: !audio.isPlaying })}
                    >
                        {audio.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => useStore.getState().setAudioStatus({ currentTime: audio.duration })}>
                        <SkipForward className="w-4 h-4" />
                    </Button>
                    <span className="text-xs font-mono ml-4 text-muted-foreground/80">
                        {formatTime(audio.currentTime)} / {formatTime(audio.duration || 0)}
                    </span>
                </div>
            </div>

            {/* Multi-track Area */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Track Headers (Left Column) */}
                <div className="w-[150px] shrink-0 border-r bg-muted/5 flex flex-col z-20">
                    <div className="h-12 border-b flex items-center px-4 shrink-0 text-xs font-semibold text-muted-foreground">
                        Master Audio
                    </div>
                    <div
                        className="flex-1 overflow-y-auto no-scrollbar pb-10"
                        ref={headersScrollRef}
                        onScroll={handleHeadersScroll}
                    >
                        {[...layers].sort((a, b) => b.zIndex - a.zIndex).map((layer, index) => (
                            <div
                                key={layer.id}
                                className={clsx(
                                    "h-[40px] border-b flex items-center px-3 text-xs justify-between group cursor-pointer transition-colors",
                                    selectedLayerId === layer.id ? "bg-primary/5 border-primary/20" : "hover:bg-muted/20"
                                )}
                                onClick={() => setSelectedLayerId(layer.id)}
                            >
                                <div className="flex items-center gap-2 min-w-0 pr-2 flex-1">
                                    <Layers className="w-3 h-3 text-muted-foreground shrink-0" />
                                    <span className="truncate flex-1 shrink" title={layer.name}>{layer.name}</span>
                                </div>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 bg-card rounded">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); moveLayerUp(layer.id); }} disabled={layer.zIndex >= layers.length - 1}>
                                        <MoveUp className="w-3 h-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); moveLayerDown(layer.id); }} disabled={layer.zIndex <= 0}>
                                        <MoveDown className="w-3 h-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tracks Viewer (Scrollable Content) */}
                <div
                    ref={timelineRef}
                    className="flex-1 overflow-x-auto relative no-scrollbar flex flex-col"
                >
                    <div
                        className="flex-1 overflow-y-auto no-scrollbar pb-10"
                        ref={tracksScrollRef}
                        onScroll={handleTracksScroll}
                    >
                        <div className="min-w-full relative" style={{ minWidth: '800px' }}>
                            {/* Master Audio Track (Waveform) */}
                            <div
                                className="h-12 border-b bg-muted/10 relative cursor-pointer"
                                onClick={handleTimelineClick}
                            >
                                {audio.peaks.length > 0 ? (
                                    <canvas
                                        ref={waveformRef}
                                        width={2000}
                                        height={48}
                                        className="absolute inset-0 w-full h-full opacity-60"
                                        style={{ pointerEvents: 'none' }}
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-[10px] italic text-muted-foreground/50 pointer-events-none">
                                        Drop audio to see waveform
                                    </div>
                                )}
                            </div>

                            {/* Layer Tracks */}
                            <div className="relative">
                                {[...layers].sort((a, b) => b.zIndex - a.zIndex).map(layer => (
                                    <div
                                        key={`track-${layer.id}`}
                                        className={clsx(
                                            "h-[40px] border-b relative group",
                                            selectedLayerId === layer.id ? "bg-primary/5" : "hover:bg-muted/5"
                                        )}
                                        onClick={handleTimelineClick}
                                    >
                                        {renderTrackItem(layer)}
                                    </div>
                                ))}
                            </div>

                            {/* Playhead Line */}
                            <div
                                className="absolute top-0 bottom-0 w-px bg-red-500 z-50 pointer-events-none shadow-[0_0_4px_rgba(239,68,68,0.5)]"
                                style={{ left: `${(audio.currentTime / (audio.duration || 1)) * 100}%` }}
                            >
                                <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-red-500 absolute -top-0 -left-[5.5px]" />
                            </div>

                            {/* Playhead interaction overlay */}
                            <div
                                className="absolute inset-0 z-40 cursor-text"
                                onClick={handleTimelineClick}
                                style={{ pointerEvents: draggingState ? 'none' : 'auto' }} // Disable global click while dragging
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
