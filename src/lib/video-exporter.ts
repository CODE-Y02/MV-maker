import { Howler } from 'howler';

export async function exportVideo(
    canvas: HTMLCanvasElement,
    duration: number,
    onProgress: (progress: number) => void
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        try {
            const stream = canvas.captureStream(30); // 30 FPS

            // Add audio track from Howler instance
            let audioStream: MediaStream | null = null;
            if (Howler && Howler.ctx && (Howler as any).masterGain) {
                const dest = Howler.ctx.createMediaStreamDestination();
                (Howler as any).masterGain.connect(dest);
                audioStream = dest.stream;
            }

            const tracks = [
                ...stream.getVideoTracks(),
                ...(audioStream ? audioStream.getAudioTracks() : [])
            ];

            const combinedStream = new MediaStream(tracks);

            let mimeType = '';
            ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'].forEach(type => {
                if (!mimeType && MediaRecorder.isTypeSupported(type)) {
                    mimeType = type;
                }
            });

            const options: MediaRecorderOptions = { videoBitsPerSecond: 5000000 };
            if (mimeType) options.mimeType = mimeType;

            const recorder = new MediaRecorder(combinedStream, options);

            const chunks: Blob[] = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
                resolve(blob);
            };

            recorder.onerror = (e) => reject(e);

            // Start recording
            recorder.start(100);

            // Real-time capturing progress
            let elapsedTime = 0;
            const interval = setInterval(() => {
                elapsedTime += 0.2;
                const progress = Math.min((elapsedTime / duration) * 100, 100);
                onProgress(progress);

                if (elapsedTime >= duration) {
                    clearInterval(interval);
                    if (recorder.state !== 'inactive') {
                        recorder.stop();
                    }
                }
            }, 200);
        } catch (e) {
            console.error("Exporter internal error:", e);
            reject(e);
        }
    });
}
