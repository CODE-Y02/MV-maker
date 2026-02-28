/**
 * Processes an audio file to generate an AudioBuffer and a high-fidelity RMS waveform.
 * RMS (Root Mean Square) is industry-standard for representing perceived loudness.
 */
export async function processAudioFile(file: File): Promise<{ buffer: AudioBuffer; peaks: number[] }> {
    const arrayBuffer = await file.arrayBuffer();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const peaks = generateRMSPeaks(audioBuffer, 500);
    return { buffer: audioBuffer, peaks };
}

/**
 * Generates RMS peaks for the given AudioBuffer.
 * @param buffer - The decoded AudioBuffer.
 * @param numSamples - Number of points in the resulting waveform (e.g. 500).
 */
function generateRMSPeaks(buffer: AudioBuffer, numSamples: number): number[] {
    const channelData = buffer.getChannelData(0); // Using first channel
    const totalSamples = channelData.length;
    const samplesPerPoint = Math.floor(totalSamples / numSamples);
    const peaks: number[] = [];

    for (let i = 0; i < numSamples; i++) {
        const start = i * samplesPerPoint;
        let sum = 0;

        // Calculate RMS for this window
        for (let j = 0; j < samplesPerPoint; j++) {
            const val = channelData[start + j];
            sum += val * val;
        }

        const rms = Math.sqrt(sum / samplesPerPoint);
        // Normalize and push
        peaks.push(rms);
    }

    // Final normalization to [0, 1] range based on max RMS found
    const maxRMS = Math.max(...peaks) || 1;
    return peaks.map(p => p / maxRMS);
}
