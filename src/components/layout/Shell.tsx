'use client';

import React from 'react';
import { AssetLibrary } from '@/components/sidebar/AssetLibrary';
import { Inspector } from '@/components/sidebar/Inspector';
import { PreviewCanvas } from '@/components/editor/PreviewCanvas';
import { Timeline } from '@/components/editor/Timeline';
import { ExportModal } from '@/components/editor/ExportModal';
import { TopBar } from './TopBar';
import { useProjectSync } from '@/hooks/useProjectSync';

export function Shell({ children }: { children?: React.ReactNode }) {
    useProjectSync();

    return (
        <div className="flex flex-col h-screen bg-background overflow-hidden font-sans">
            <TopBar />
            <div className="flex flex-1 overflow-hidden">
                <AssetLibrary />
                <main className="flex-1 flex flex-col relative bg-muted/20 border-r">
                    <div className="flex-1 flex items-center justify-center p-4">
                        <PreviewCanvas />
                    </div>
                    <Timeline />
                </main>
                <Inspector />
            </div>
            {children}
            <ExportModal />
        </div>
    );
}
