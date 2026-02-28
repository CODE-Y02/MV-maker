import { Muxer, ArrayBufferTarget } from 'webm-muxer';
import { Layer, ImageLayer, VisualizerLayer, TextLayer, LyricsLayer, ProjectAsset } from '@/types';
import { drawBars, drawCircular, drawWaveform, drawBass } from './visualizers/templates';

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
    freqData: Uint8Array,
    timeData: Uint8Array
) {
    ctx.translate(layer.transform.x, layer.transform.y);
    ctx.scale(layer.transform.scale, layer.transform.scale);
    ctx.rotate((layer.transform.rotation * Math.PI) / 180);

    if (layer.template === 'bars') drawBars(ctx, freqData, width, height, layer);
    else if (layer.template === 'circular') drawCircular(ctx, freqData, width, height, layer);
    else if (layer.template === 'waveform') drawWaveform(ctx, timeData, width, height, layer);
    else if (layer.template === 'bass') drawBass(ctx, freqData, width, height, layer);
}

function drawTextLayer(ctx: CanvasRenderingContext2D, layer: TextLayer) {
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
    subtitles: any[],
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

function drawAllLayers(
    ctx: CanvasRenderingContext2D,
    layers: Layer[],
    assets: ProjectAsset[],
    subtitles: any[],
    imagesCache: Map<string, HTMLImageElement>,
    freqData: Uint8Array,
    timeData: Uint8Array,
    time: number,
    width: number,
    height: number
) {
    const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);
    sortedLayers.forEach(layer => {
        if (!layer.visible || layer.opacity <= 0) return;
        // Verify layer is present at this explicit timeline marker
        if (time < layer.startTime || time > layer.startTime + layer.duration) return;

        ctx.save();
        ctx.globalAlpha = layer.opacity;
        if (layer.blendMode) ctx.globalCompositeOperation = layer.blendMode as any;
        if (layer.shadowColor && layer.shadowBlur) {
            ctx.shadowColor = layer.shadowColor;
            ctx.shadowBlur = layer.shadowBlur;
            if (layer.shadowOffsetX) ctx.shadowOffsetX = layer.shadowOffsetX;
            if (layer.shadowOffsetY) ctx.shadowOffsetY = layer.shadowOffsetY;
        }

        switch (layer.type) {
            case 'image':
                const asset = assets.find(a => a.id === (layer as ImageLayer).assetId);
                if (asset && asset.url) drawImageLayer(ctx, layer as ImageLayer, width, height, imagesCache, asset.url);
                break;
            case 'visualizer':
                drawVisualizerLayer(ctx, layer as VisualizerLayer, width, height, freqData, timeData);
                break;
            case 'text':
                drawTextLayer(ctx, layer as TextLayer);
                break;
            case 'lyrics':
                drawLyricsLayer(ctx, layer as LyricsLayer, subtitles, time);
                break;
        }
        ctx.restore();
    });
}

export async function exportVideoOffline(
    layers: Layer[],
    assets: ProjectAsset[],
    subtitles: any[],
    audioBuffer: AudioBuffer,
    width: number,
    height: number,
    fps: number,
    onProgress: (p: number) => void
): Promise<Blob> {
    const duration = audioBuffer.duration;
    const totalFrames = Math.floor(duration * fps);
    const step = 1 / fps;

    // 1. Preload Images completely offline into memory cache
    const imagesCache = new Map<string, HTMLImageElement>();
    const imagePromises = layers.filter(l => l.type === 'image').map(l => {
        const asset = assets.find(a => a.id === (l as ImageLayer).assetId);
        if (!asset || !asset.url) return Promise.resolve();
        return new Promise<void>((resolve) => {
            if (imagesCache.has(asset.url!)) return resolve();
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = asset.url!;
            img.onload = () => { imagesCache.set(asset.url!, img); resolve(); };
            img.onerror = () => resolve();
        });
    });
    await Promise.all(imagePromises);

    // 2. Initialize WebM Muxer
    const muxer = new Muxer({
        target: new ArrayBufferTarget(),
        video: { codec: 'V_VP9', width, height, frameRate: fps },
        audio: { codec: 'A_OPUS', sampleRate: audioBuffer.sampleRate, numberOfChannels: audioBuffer.numberOfChannels },
        firstTimestampBehavior: 'offset'
    });

    const videoEncoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: e => console.error(e)
    });
    videoEncoder.configure({ codec: 'vp09.00.10.08', width, height, bitrate: 5_000_000 });

    const audioEncoder = new AudioEncoder({
        output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
        error: e => console.error(e)
    });
    audioEncoder.configure({ codec: 'opus', sampleRate: audioBuffer.sampleRate, numberOfChannels: audioBuffer.numberOfChannels, bitrate: 128_000 });

    // 3. Extract and encode pure Audio Buffer PCM offline instantaneously (no waiting)
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const chunkSize = Math.floor(sampleRate * 0.1); // 100ms slices
    for (let offset = 0; offset < audioBuffer.length; offset += chunkSize) {
        const end = Math.min(offset + chunkSize, audioBuffer.length);
        const size = end - offset;
        const options: AudioDataInit = {
            format: 'f32-planar',
            sampleRate: sampleRate,
            numberOfFrames: size,
            numberOfChannels: numChannels,
            timestamp: (offset / sampleRate) * 1e6,
            data: new Float32Array(size * numChannels)
        };
        const buffer = new Float32Array(size * numChannels);
        for (let c = 0; c < numChannels; c++) {
            const channelData = audioBuffer.getChannelData(c).subarray(offset, end);
            buffer.set(channelData, c * size);
        }
        options.data = buffer;
        const audioData = new AudioData(options);
        audioEncoder.encode(audioData);
        audioData.close();
    }
    await audioEncoder.flush();

    // 4. Set up Offline Audio Renderer for Canvas FFT
    const offlineCtx = new OfflineAudioContext(numChannels, audioBuffer.length, sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    const analyser = offlineCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(offlineCtx.destination);
    source.start(0);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

    const freqData = new Uint8Array(analyser.frequencyBinCount);
    const timeData = new Uint8Array(analyser.frequencyBinCount);

    let currentFrame = 0;

    // Initial frame 0 without suspension
    drawAllLayers(ctx, layers, assets, subtitles, imagesCache, freqData, timeData, 0, width, height);
    const frame0 = new VideoFrame(canvas, { timestamp: 0 });
    videoEncoder.encode(frame0);
    frame0.close();

    // Promisify the offline render timeline using scheduled suspends
    await new Promise<void>((resolveRender) => {
        const scheduleNext = () => {
            currentFrame++;
            if (currentFrame >= totalFrames) {
                // Let audio processing cleanly hit max edge and end
                resolveRender();
                return;
            }

            const time = currentFrame * step;
            offlineCtx.suspend(time).then(() => {
                analyser.getByteFrequencyData(freqData);
                analyser.getByteTimeDomainData(timeData);

                // Re-render completely black base canvas
                ctx.fillStyle = "black";
                ctx.fillRect(0, 0, width, height);

                drawAllLayers(ctx, layers, assets, subtitles, imagesCache, freqData, timeData, time, width, height);

                const vf = new VideoFrame(canvas, { timestamp: time * 1e6 });
                videoEncoder.encode(vf);
                vf.close();

                onProgress((currentFrame / totalFrames) * 100);

                // Queue next frame exactly before unpausing the processing
                scheduleNext();
                offlineCtx.resume();
            }).catch(e => {
                console.error("Context timeline interrupted:", e);
                resolveRender();
            });
        };

        scheduleNext();
        offlineCtx.startRendering();
    });

    await videoEncoder.flush();
    muxer.finalize();
    return new Blob([muxer.target.buffer], { type: 'video/webm' });
}
