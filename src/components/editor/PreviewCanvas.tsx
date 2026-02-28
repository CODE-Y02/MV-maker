'use client';

import React, { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { drawBars, drawCircular, drawWaveform, drawBass } from '@/lib/visualizers/templates';
import { Layer, ImageLayer, VisualizerLayer, TextLayer, LyricsLayer } from '@/types';

export function PreviewCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { layers, audio, subtitles, assets } = useStore();
    const { analyser } = useAudioPlayback();
    const requestRef = useRef<number>(0);
    const imagesCache = useRef<Map<string, HTMLImageElement>>(new Map());

    // Pre-load images for image layers
    useEffect(() => {
        layers.forEach(layer => {
            if (layer.type === 'image') {
                const asset = assets.find(a => a.id === (layer as ImageLayer).assetId);
                if (asset && asset.url && !imagesCache.current.has(asset.url)) {
                    const img = new Image();
                    img.src = asset.url;
                    img.onload = () => {
                        imagesCache.current.set(asset.url!, img);
                    };
                }
            }
        });
    }, [layers, assets]);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = canvas;
        ctx.clearRect(0, 0, width, height);

        // Sort layers by zIndex for correct stacking
        const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

        sortedLayers.forEach(layer => {
            if (!layer.visible || layer.opacity <= 0) return;

            ctx.save();
            ctx.globalAlpha = layer.opacity;
            if (layer.blendMode) {
                ctx.globalCompositeOperation = layer.blendMode;
            }
            if (layer.shadowColor && layer.shadowBlur) {
                ctx.shadowColor = layer.shadowColor;
                ctx.shadowBlur = layer.shadowBlur;
                if (layer.shadowOffsetX) ctx.shadowOffsetX = layer.shadowOffsetX;
                if (layer.shadowOffsetY) ctx.shadowOffsetY = layer.shadowOffsetY;
            }

            switch (layer.type) {
                case 'image': {
                    const asset = assets.find(a => a.id === (layer as ImageLayer).assetId);
                    if (asset && asset.url) {
                        drawImageLayer(ctx, layer as ImageLayer, width, height, imagesCache.current, asset.url);
                    }
                    break;
                }
                case 'visualizer':
                    drawVisualizerLayer(ctx, layer as VisualizerLayer, width, height, analyser);
                    break;
                case 'text':
                    drawTextLayer(ctx, layer as TextLayer);
                    break;
                case 'lyrics':
                    drawLyricsLayer(ctx, layer as LyricsLayer, subtitles, audio.currentTime);
                    break;
            }

            ctx.restore();
        });

        requestRef.current = requestAnimationFrame(draw);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(requestRef.current);
    }, [analyser, layers, audio.currentTime, subtitles]);

    return (
        <div className="relative aspect-video w-full max-w-4xl bg-black rounded-lg shadow-2xl overflow-hidden border border-border">
            <canvas
                ref={canvasRef}
                width={854}
                height={480}
                className="w-full h-full object-contain"
            />
        </div>
    );
}

function drawImageLayer(
    ctx: CanvasRenderingContext2D,
    layer: ImageLayer,
    width: number,
    height: number,
    cache: Map<string, HTMLImageElement>,
    url: string
) {
    const img = cache.get(url);
    if (!img) {
        // Fill with placeholder color if image not loaded
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, width, height);
        return;
    }

    const imgRatio = img.width / img.height;
    const canvasRatio = width / height;
    let dWidth, dHeight, dx, dy;

    if (imgRatio > canvasRatio) {
        dHeight = height;
        dWidth = height * imgRatio;
        dx = (width - dWidth) / 2;
        dy = 0;
    } else {
        dWidth = width;
        dHeight = width / imgRatio;
        dx = 0;
        dy = (height - dHeight) / 2;
    }

    // Apply layer transform
    ctx.translate(layer.transform.x + dx, layer.transform.y + dy);
    ctx.scale(layer.transform.scale, layer.transform.scale);
    ctx.rotate((layer.transform.rotation * Math.PI) / 180);
    ctx.drawImage(img, 0, 0, dWidth, dHeight);
}

function drawVisualizerLayer(
    ctx: CanvasRenderingContext2D,
    layer: VisualizerLayer,
    width: number,
    height: number,
    analyser: AnalyserNode | null
) {
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const freqArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(freqArray);

    const timeArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(timeArray);

    ctx.translate(layer.transform.x, layer.transform.y);
    ctx.scale(layer.transform.scale, layer.transform.scale);
    ctx.rotate((layer.transform.rotation * Math.PI) / 180);

    // Note: Templates might need width/height adjustment based on transform
    // For now, passing full canvas width/height
    if (layer.template === 'bars') {
        drawBars(ctx, freqArray, width, height, layer);
    } else if (layer.template === 'circular') {
        drawCircular(ctx, freqArray, width, height, layer);
    } else if (layer.template === 'waveform') {
        drawWaveform(ctx, timeArray, width, height, layer);
    } else if (layer.template === 'bass') {
        drawBass(ctx, freqArray, width, height, layer);
    }
}

function drawTextLayer(
    ctx: CanvasRenderingContext2D,
    layer: TextLayer
) {
    ctx.translate(layer.transform.x, layer.transform.y);
    ctx.scale(layer.transform.scale, layer.transform.scale);
    ctx.rotate((layer.transform.rotation * Math.PI) / 180);

    ctx.fillStyle = layer.color;
    const fontStyle = layer.fontStyle || 'normal';
    const fontWeight = layer.fontWeight || 'normal';
    ctx.font = `${fontStyle} ${fontWeight} ${layer.fontSize}px ${layer.fontFamily || 'Inter'}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillText(layer.text, 0, 0);
}

function drawLyricsLayer(
    ctx: CanvasRenderingContext2D,
    layer: LyricsLayer,
    subtitles: { start: number, end: number, text: string }[],
    currentTime: number
) {
    const currentSubtitle = subtitles.find(s => currentTime >= s.start && currentTime <= s.end);
    if (!currentSubtitle) return;

    ctx.translate(layer.transform.x, layer.transform.y);
    ctx.scale(layer.transform.scale, layer.transform.scale);
    ctx.rotate((layer.transform.rotation * Math.PI) / 180);

    ctx.fillStyle = layer.color;
    ctx.font = `${layer.fontSize}px ${layer.fontFamily || 'Inter'}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillText(currentSubtitle.text, 0, 0);
}
