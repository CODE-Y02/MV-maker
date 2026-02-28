'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Music, Settings, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useStore } from '@/store/useStore';

export function TopBar() {
    const { theme, setTheme } = useTheme();
    const setIsExporting = useStore((state) => state.export.setIsExporting);

    return (
        <header className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Music className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg tracking-tight">MusicMaker</span>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
                <Button variant="ghost" size="icon">
                    <Settings className="w-5 h-5" />
                </Button>
                <Button onClick={() => setIsExporting(true)} className="gap-2">
                    <Download className="w-4 h-4" />
                    Export
                </Button>
            </div>
        </header>
    );
}
