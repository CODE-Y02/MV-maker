'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, Loader2 } from 'lucide-react';
import { exportVideo } from '@/lib/video-exporter';

export function ExportModal() {
    const { export: exportState, audio } = useStore();
    const [localProgress, setLocalProgress] = React.useState(0);
    const [isProcessing, setIsProcessing] = React.useState(false);

    const handleExport = async () => {
        const canvas = document.querySelector('canvas');
        if (!canvas || !audio.buffer) return;

        setIsProcessing(true);
        setLocalProgress(0);

        try {
            const blob = await exportVideo(canvas, audio.buffer, (p) => {
                setLocalProgress(p);
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `music-maker-video-${Date.now()}.webm`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
        } finally {
            setIsProcessing(false);
            exportState.setIsExporting(false);
        }
    };

    return (
        <Dialog open={exportState.isExporting} onOpenChange={exportState.setIsExporting}>
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
                                Please keep this tab focused for best results.
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
                    <Button variant="outline" onClick={() => exportState.setIsExporting(false)} disabled={isProcessing}>
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
        </Dialog>
    );
}
