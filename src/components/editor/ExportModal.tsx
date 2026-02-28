'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, Loader2 } from 'lucide-react';
import { exportVideoOffline } from '@/lib/offline-renderer';

export function ExportModal() {
    const { export: exportState, audio, layers, assets, subtitles } = useStore();
    const [localProgress, setLocalProgress] = React.useState(0);
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [resolution, setResolution] = React.useState('480p');
    const [showConfirmCancel, setShowConfirmCancel] = React.useState(false);
    const abortControllerRef = React.useRef<AbortController | null>(null);

    const resolutions = React.useMemo(() => {
        interface ResolutionConfig {
            width: number;
            height: number;
            label: string;
            minMemory: number;
            minCores: number;
            isSupported?: boolean;
            isRecommended?: boolean;
        }

        const res: Record<string, ResolutionConfig> = {
            '480p': { width: 854, height: 480, label: '480p (Standard)', minMemory: 0, minCores: 0 },
            '720p': { width: 1280, height: 720, label: '720p (HD)', minMemory: 4, minCores: 2 },
            '1080p': { width: 1920, height: 1080, label: '1080p (Full HD)', minMemory: 8, minCores: 4 },
            '4K': { width: 3840, height: 2160, label: '4K (Ultra HD)', minMemory: 8, minCores: 4 },
        };

        if (typeof window === 'undefined') return res;

        // Browsers often cap deviceMemory at 8 for privacy
        const memory = (navigator as any).deviceMemory || 8;
        const cores = navigator.hardwareConcurrency || 4;

        return Object.entries(res).reduce((acc, [key, val]) => {
            const isSupported = memory >= val.minMemory && cores >= val.minCores;
            const isRecommended = (key === '1080p' && memory >= 8) || (key === '720p' && memory < 8 && memory >= 4) || (key === '480p' && memory < 4);

            return {
                ...acc,
                [key]: { ...val, isSupported, isRecommended }
            };
        }, {} as Record<string, Required<ResolutionConfig>>);
    }, []);

    // Set default resolution based on recommendation
    React.useEffect(() => {
        const recommended = Object.entries(resolutions).find(([_, v]) => v.isRecommended);
        if (recommended) setResolution(recommended[0]);
    }, [resolutions]);

    const handleExport = async () => {
        if (!audio.buffer || !audio.duration) return;

        setIsProcessing(true);
        setLocalProgress(0);
        abortControllerRef.current = new AbortController();

        try {
            const { width, height } = resolutions[resolution as keyof typeof resolutions];

            // Ask user for save location for high resolutions or by default
            let fileHandle: FileSystemFileHandle | null = null;
            try {
                if (window.showSaveFilePicker) {
                    fileHandle = await window.showSaveFilePicker({
                        suggestedName: `music-maker-video-${Date.now()}.webm`,
                        types: [{
                            description: 'Video File',
                            accept: { 'video/webm': ['.webm'] },
                        }],
                    });
                }
            } catch (pE) {
                console.log("User cancelled file picker or browser unsupported, falling back to RAM");
            }

            const blob = await exportVideoOffline(
                layers,
                assets,
                subtitles,
                audio.buffer,
                width,
                height,
                30,
                (p) => setLocalProgress(p),
                abortControllerRef.current.signal,
                fileHandle
            );

            if (abortControllerRef.current.signal.aborted) return;

            // If we didn't use stream to disk, do the legacy download
            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `music-maker-video-${Date.now()}.webm`;
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (err: any) {
            if (err.message === "Export cancelled") {
                console.log("Export was cancelled by user");
            } else {
                console.error('Export failed:', err);
            }
        } finally {
            setIsProcessing(false);
            abortControllerRef.current = null;
            exportState.setIsExporting(false);
        }
    };

    const handleCancel = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setShowConfirmCancel(false);
        exportState.setIsExporting(false);
    };

    const attemptCancel = () => {
        if (isProcessing) {
            setShowConfirmCancel(true);
        } else {
            exportState.setIsExporting(false);
        }
    };

    return (
        <Dialog open={exportState.isExporting} onOpenChange={(open) => {
            if (!open) attemptCancel();
            else exportState.setIsExporting(true);
        }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Export Video</DialogTitle>
                    <DialogDescription>
                        Render your lyric video to a high-quality WebM file.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-4">
                    {isProcessing ? (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs mb-1">
                                <span>Rendering...</span>
                                <span>{localProgress.toFixed(0)}%</span>
                            </div>
                            <Progress value={localProgress} className="h-2" />
                            <p className="text-[10px] text-muted-foreground text-center">
                                Processing offline. Closing this window will cancel the export.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex flex-col items-center justify-center p-8 bg-muted/20 rounded-lg border border-dashed">
                                <Download className="w-12 h-12 text-muted-foreground mb-4" />
                                <p className="text-sm font-medium">Ready to export</p>
                                <p className="text-xs text-muted-foreground mt-1">Resolution: {resolutions[resolution as keyof typeof resolutions].width}x{resolutions[resolution as keyof typeof resolutions].height}</p>
                            </div>

                            <div className="space-y-2 px-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium">Video Quality</span>
                                    <select
                                        className="h-8 text-xs bg-background border rounded px-2"
                                        value={resolution}
                                        onChange={(e) => setResolution(e.target.value)}
                                    >
                                        {Object.entries(resolutions).map(([key, val]) => (
                                            <option key={key} value={key}>
                                                {val.label} {!val.isSupported ? '(Low Perf Warning)' : (val.isRecommended ? '★ Recommended' : '')}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {!resolutions[resolution as keyof typeof resolutions]?.isSupported && (
                                    <p className="text-[10px] text-destructive font-medium">
                                        Warning: This resolution exceeds your hardware's recommended limits. Rendering may crash.
                                    </p>
                                )}
                                <p className="text-[10px] text-muted-foreground">
                                    Recommended based on your {((navigator as any).deviceMemory || 'detectable')}GB RAM and {(navigator.hardwareConcurrency || 'detectable')} cores.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={attemptCancel}>
                        Cancel
                    </Button>
                    <Button onClick={handleExport} disabled={isProcessing || !audio.buffer}>
                        {isProcessing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing
                            </>
                        ) : (
                            'Start Export'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmCancel} onOpenChange={setShowConfirmCancel}>
                <DialogContent className="sm:max-w-[300px] z-[100]">
                    <DialogHeader>
                        <DialogTitle>Cancel Export?</DialogTitle>
                        <DialogDescription>
                            Your progress will be lost. Are you sure?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-row gap-2 sm:justify-center">
                        <Button variant="outline" onClick={() => setShowConfirmCancel(false)} className="flex-1">
                            No
                        </Button>
                        <Button variant="destructive" onClick={handleCancel} className="flex-1">
                            Yes, Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}
