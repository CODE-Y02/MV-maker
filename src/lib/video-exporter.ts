export async function exportVideo(
    canvas: HTMLCanvasElement,
    audioBuffer: AudioBuffer,
    onProgress: (progress: number) => void
): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
        const stream = canvas.captureStream(30); // 30 FPS

        // Add audio track to the stream
        const audioCtx = new AudioContext();
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        const destination = audioCtx.createMediaStreamDestination();
        source.connect(destination);

        const combinedStream = new MediaStream([
            ...stream.getVideoTracks(),
            ...destination.stream.getAudioTracks()
        ]);

        const recorder = new MediaRecorder(combinedStream, {
            mimeType: 'video/webm;codecs=vp9,opus',
            videoBitsPerSecond: 5000000 // 5Mbps
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            resolve(blob);
        };

        recorder.onerror = (e) => reject(e);

        // Start recording and playback
        recorder.start();
        source.start();

        const duration = audioBuffer.duration;
        const interval = setInterval(() => {
            const currentTime = audioCtx.currentTime;
            const progress = Math.min((currentTime / duration) * 100, 100);
            onProgress(progress);

            if (currentTime >= duration) {
                clearInterval(interval);
                recorder.stop();
                source.stop();
                audioCtx.close();
            }
        }, 100);
    });
}
