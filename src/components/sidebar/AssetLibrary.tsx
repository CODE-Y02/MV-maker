'use client';

import React, { useRef } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Plus, Image as ImageIcon, Music, Trash2, Type, Activity } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProjectAsset, Layer } from '@/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AssetLibrary() {
    const { assets, layers, addAsset, removeAsset, setAudioTrack, addLayerFromAsset, addTextLayer, addVisualizerLayer } = useStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        for (let i = 0; i < files.length; i++) {
            await addAsset(files[i]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (!files || files.length === 0) return;

        for (let i = 0; i < files.length; i++) {
            await addAsset(files[i]);
        }
    };

    return (
        <div
            className={`w-64 border-r bg-card flex flex-col h-full shrink-0 transition-colors ${isDragging ? 'bg-primary/5 border-primary' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="p-4 border-b flex flex-col gap-2">
                <h2 className="text-sm font-semibold mb-1">Add Elements</h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-2" title="Add Text Layer" onClick={addTextLayer}>
                        <Type className="w-4 h-4" /> Text
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-2" title="Add Audio Visualizer" onClick={addVisualizerLayer}>
                        <Activity className="w-4 h-4" /> Visualizer
                    </Button>
                </div>

                <h2 className="text-sm font-semibold mt-4 mb-1">Media Files</h2>
                <input
                    type="file"
                    multiple
                    accept="image/*,audio/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
                <Button
                    className="w-full gap-2"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Plus className="w-4 h-4" /> Import Media
                </Button>
            </div>

            <ScrollArea className="flex-1 p-2">
                <div className="space-y-2">
                    {assets.length === 0 ? (
                        <div className="text-center p-4 text-xs text-muted-foreground italic">
                            No assets yet.<br />Click &apos;Import Media&apos; to add images or audio.
                        </div>
                    ) : (
                        assets.map((asset) => (
                            <AssetItem
                                key={asset.id}
                                asset={asset}
                                layers={layers}
                                onRemove={() => removeAsset(asset.id)}
                                onUse={() => {
                                    if (asset.type === 'audio') {
                                        setAudioTrack(asset.id);
                                    } else {
                                        addLayerFromAsset(asset.id);
                                    }
                                }}
                                onUseToLayer={(layerId) => addLayerFromAsset(asset.id, layerId)}
                            />
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

function AssetItem({ asset, layers, onRemove, onUse, onUseToLayer }: { asset: ProjectAsset, layers: Layer[], onRemove: () => void, onUse: () => void, onUseToLayer: (layerId: string) => void }) {
    const truncateName = (name: string, maxLength: number = 20) => {
        if (name.length <= maxLength) return name;
        const extension = name.split('.').pop();
        const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
        if (!extension || nameWithoutExt.length === 0) return name.substring(0, maxLength) + '...';

        const charsToShow = maxLength - extension.length - 4; // 4 for "...." margin
        const truncated = nameWithoutExt.substring(0, charsToShow) + '...';
        return `${truncated}.${extension}`;
    };

    return (
        <div className="group flex items-center gap-3 p-2 rounded-md border bg-muted/20 hover:bg-muted/50 transition-colors">
            <div className="shrink-0 w-8 h-8 rounded bg-background flex items-center justify-center border">
                {asset.type === 'audio' ? <Music className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0 pr-2 flex flex-col justify-center">
                <p className="text-[13px] font-medium leading-tight" title={asset.name}>{truncateName(asset.name)}</p>
                <p className="text-[10px] text-muted-foreground uppercase leading-none mt-1">{asset.type} • {(asset.size / (1024 * 1024)).toFixed(1)}MB</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
                {asset.type === 'audio' ? (
                    <Button variant="secondary" size="icon" className="h-8 w-8 hover:bg-primary/20 hover:text-primary" onClick={onUse} title="Set as Audio Track">
                        <Plus className="w-4 h-4" />
                    </Button>
                ) : (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="h-8 w-8 hover:bg-primary/20 hover:text-primary" title="Add to Canvas">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-xs">Add Asset</DropdownMenuLabel>
                            <DropdownMenuItem onClick={onUse} className="text-xs font-medium cursor-pointer">
                                Add to New Layer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Replace Layer Image</DropdownMenuLabel>
                            {layers.filter(l => l.type === 'image').length === 0 && (
                                <DropdownMenuItem disabled className="text-xs italic">No Image Layers</DropdownMenuItem>
                            )}
                            {layers.filter(l => l.type === 'image').map(layer => (
                                <DropdownMenuItem key={layer.id} onClick={() => onUseToLayer(layer.id)} className="text-xs cursor-pointer">
                                    Replace &quot;{layer.name}&quot;
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={onRemove} title="Delete from project">
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
