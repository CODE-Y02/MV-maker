'use client';

import { VisualizerLayer } from "@/types";

/**
 * Draws standard audio bars.
 * Updated to center vertically and use professional spacing.
 */
export function drawBars(
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number,
    layer: VisualizerLayer
) {
    const barCount = layer.barCount || 64;
    const gap = 4;
    const barWidth = (width / barCount) - gap;

    ctx.fillStyle = layer.color;

    for (let i = 0; i < barCount; i++) {
        // Map frequency data: stretch or compress to fit barCount
        const dataIndex = Math.floor(i * (data.length / barCount)) % data.length;
        const val = Math.max(2, (data[dataIndex] / 255) * height * 0.5 * layer.sensitivity);
        const x = i * (barWidth + gap) - (width / 2);

        if (layer.hasArea) {
            // Anchor from a baseline (0)
            ctx.fillRect(x, 0, barWidth, -val);
        } else {
            // Center vertically
            const y = -val / 2;
            ctx.fillRect(x, y, barWidth, val);
        }
    }
}

/**
 * Draws circular waveform.
 */
export function drawCircular(
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number,
    layer: VisualizerLayer
) {
    const radius = 100 * layer.transform.scale;
    const points = 128;

    ctx.beginPath();
    ctx.strokeStyle = layer.color;
    ctx.lineWidth = layer.thickness;

    for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const val = (data[i % data.length] / 255) * 50 * layer.sensitivity;
        const r = radius + val;

        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.stroke();
}

/**
 * Draws real-time time-domain waveform.
 */
export function drawWaveform(
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number,
    layer: VisualizerLayer
) {
    ctx.beginPath();
    ctx.strokeStyle = layer.color;
    ctx.lineWidth = layer.thickness;

    const sliceWidth = width / data.length;
    let x = -width / 2;

    for (let i = 0; i < data.length; i++) {
        const v = data[i] / 128.0;
        const y = (v * height * 0.2 * layer.sensitivity) - (height * 0.1);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += sliceWidth;
    }

    ctx.stroke();

    if (layer.hasArea) {
        ctx.lineTo(width / 2, height / 2);
        ctx.lineTo(-width / 2, height / 2);
        ctx.closePath();
        ctx.fillStyle = layer.color;

        // Temporarily lower opacity for the fill
        ctx.globalAlpha = ctx.globalAlpha * 0.3;
        ctx.fill();
        ctx.globalAlpha = ctx.globalAlpha / 0.3; // restore
    }
}

/**
 * Draws bass-focused ripple effect.
 */
export function drawBass(
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number,
    layer: VisualizerLayer
) {
    // Focus on low frequencies (first 10 bins)
    let sum = 0;
    for (let i = 0; i < 10; i++) sum += data[i];
    const avg = sum / 10;

    const intensity = (avg / 255) * layer.sensitivity;

    ctx.beginPath();
    ctx.arc(0, 0, 50 + intensity * 100, 0, Math.PI * 2);
    ctx.strokeStyle = layer.color;
    ctx.lineWidth = 10 * intensity;
    ctx.stroke();

    ctx.globalAlpha = 0.2 * intensity;
    ctx.fillStyle = layer.color;
    ctx.fill();
}
