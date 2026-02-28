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
    const [showConfirmCancel, setShowConfirmCancel] = React.useState(false);
    const abortControllerRef = React.useRef<AbortController | null>(null);

    const handleExport = async () => {
        if (!audio.buffer || !audio.duration) return;

        setIsProcessing(true);
        setLocalProgress(0);
        abortControllerRef.current = new AbortController();

        try {
            const blob = await exportVideoOffline(
                layers,
                assets,
                subtitles,
                audio.buffer,
                854,
                480,
                30,
                (p) => setLocalProgress(p),
                abortControllerRef.current.signal
            );

            if (abortControllerRef.current.signal.aborted) return;

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `music-maker-video-${Date.now()}.webm`;
            a.click();
            URL.revokeObjectURL(url);
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
                        <div className="flex flex-col items-center justify-center p-8 bg-muted/20 rounded-lg border border-dashed">
                            <Download className="w-12 h-12 text-muted-foreground mb-4" />
                            <p className="text-sm font-medium">Ready to export</p>
                            <p className="text-xs text-muted-foreground mt-1">Resolution: 854x480 (480p)</p>
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
