'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ImageLayer, VisualizerLayer, TextLayer, LyricsLayer } from '@/types';
import { MoveUp, MoveDown, Trash2, X } from 'lucide-react';

export function Inspector() {
    const { selectedLayerId, layers, updateLayer, moveLayerUp, moveLayerDown, removeLayer, setSelectedLayerId } = useStore();
    const layer = layers.find(l => l.id === selectedLayerId);
    const layerIndex = layers.findIndex(l => l.id === selectedLayerId);

    if (!layer) {
        return (
            <div className="w-80 border-l bg-card flex flex-col h-full shrink-0 items-center justify-center text-muted-foreground">
                <p className="text-sm italic">Select a layer to edit properties</p>
            </div>
        );
    }

    return (
        <div className="w-80 border-l bg-card flex flex-col h-full shrink-0">
            <div className="p-4 border-b flex items-center justify-between shrink-0">
                <h2 className="text-sm font-semibold truncate flex-1 pr-2">{layer.name} Properties</h2>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setSelectedLayerId(null)}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto w-full p-4">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label>Layer Name</Label>
                        <Input
                            value={layer.name}
                            onChange={(e) => updateLayer(layer.id, { name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transform</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px]">Position X</Label>
                                <Input
                                    type="number" value={Math.round(layer.transform.x)}
                                    onChange={(e) => updateLayer(layer.id, { transform: { ...layer.transform, x: Number(e.target.value) } })}
                                    className="h-8"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px]">Position Y</Label>
                                <Input
                                    type="number" value={Math.round(layer.transform.y)}
                                    onChange={(e) => updateLayer(layer.id, { transform: { ...layer.transform, y: Number(e.target.value) } })}
                                    className="h-8"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between"><Label>Scale</Label><span className="text-xs">{layer.transform.scale.toFixed(2)}</span></div>
                            <Slider value={[layer.transform.scale]} min={0.1} max={5} step={0.05} onValueChange={([v]) => updateLayer(layer.id, { transform: { ...layer.transform, scale: v } })} />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between"><Label>Opacity</Label><span className="text-xs">{Math.round(layer.opacity * 100)}%</span></div>
                            <Slider value={[layer.opacity]} min={0} max={1} step={0.01} onValueChange={([v]) => updateLayer(layer.id, { opacity: v })} />
                        </div>
                    </div>
                    <div className="space-y-4 pt-4 border-t">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Effects</h4>
                        <div className="space-y-2">
                            <Label>Blend Mode</Label>
                            <select
                                className="w-full h-8 px-2 rounded-md border text-sm bg-background"
                                value={layer.blendMode || 'source-over'}
                                onChange={(e) => updateLayer(layer.id, { blendMode: e.target.value as any })}
                            >
                                <option value="source-over">Normal</option>
                                <option value="multiply">Multiply</option>
                                <option value="screen">Screen</option>
                                <option value="overlay">Overlay</option>
                                <option value="darken">Darken</option>
                                <option value="lighten">Lighten</option>
                                <option value="color-dodge">Color Dodge</option>
                                <option value="color-burn">Color Burn</option>
                                <option value="hard-light">Hard Light</option>
                                <option value="soft-light">Soft Light</option>
                                <option value="difference">Difference</option>
                                <option value="exclusion">Exclusion</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Drop Shadow Color</Label>
                            <div className="flex gap-2 items-center">
                                <input type="color" value={layer.shadowColor || '#000000'} onChange={(e) => updateLayer(layer.id, { shadowColor: e.target.value })} className="h-8 w-12 rounded border" />
                                <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => updateLayer(layer.id, { shadowColor: undefined, shadowBlur: 0 })}>Clear</Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between"><Label>Shadow Blur</Label><span className="text-xs">{layer.shadowBlur || 0}px</span></div>
                            <Slider value={[layer.shadowBlur || 0]} min={0} max={100} step={1} onValueChange={([v]) => updateLayer(layer.id, { shadowBlur: v })} />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Style Options</h4>
                        {layer.type === 'image' && <ImageProperties layer={layer as ImageLayer} />}
                        {layer.type === 'visualizer' && <VisualizerProperties layer={layer as VisualizerLayer} updateLayer={updateLayer} />}
                        {layer.type === 'text' && <TextProperties layer={layer as TextLayer} updateLayer={updateLayer} />}
                        {layer.type === 'lyrics' && <LyricsProperties layer={layer as LyricsLayer} updateLayer={updateLayer} />}
                    </div>

                    {/* Layer Actions */}
                    <div className="space-y-4 pt-4 border-t">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</h4>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => moveLayerUp(layer.id)} disabled={layer.zIndex >= layers.length - 1}>
                                <MoveUp className="w-4 h-4 mr-1" /> Up
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => moveLayerDown(layer.id)} disabled={layer.zIndex <= 0}>
                                <MoveDown className="w-4 h-4 mr-1" /> Down
                            </Button>
                        </div>
                        <Button variant="destructive" size="sm" className="w-full" onClick={() => removeLayer(layer.id)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Delete Layer
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ImageProperties({ layer }: { layer: ImageLayer }) {
    const { assets } = useStore();
    const asset = assets.find(a => a.id === layer.assetId);
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Source Asset</Label>
                <div className="p-2 border rounded bg-muted/50 text-xs truncate">
                    {asset ? asset.name : 'Unknown Asset'}
                </div>
            </div>
        </div>
    );
}

function VisualizerProperties({ layer, updateLayer }: { layer: VisualizerLayer, updateLayer: (id: string, updates: Partial<VisualizerLayer>) => void }) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Template</Label>
                <div className="grid grid-cols-2 gap-2">
                    {(['bars', 'circular', 'waveform', 'bass'] as const).map((t) => (
                        <Button
                            key={t}
                            variant={layer.template === t ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateLayer(layer.id, { template: t })}
                        >
                            {t}
                        </Button>
                    ))}
                </div>
            </div>
            {layer.template === 'bars' && (
                <div className="space-y-2">
                    <div className="flex justify-between"><Label>Number of Bars</Label><span className="text-xs">{layer.barCount || 64}</span></div>
                    <Slider value={[layer.barCount || 64]} min={8} max={256} step={8} onValueChange={([v]) => updateLayer(layer.id, { barCount: v })} />
                </div>
            )}
            <div className="space-y-2">
                <div className="flex justify-between"><Label>Sensitivity</Label><span className="text-xs">{layer.sensitivity.toFixed(1)}</span></div>
                <Slider value={[layer.sensitivity]} min={0.1} max={5} step={0.1} onValueChange={([v]) => updateLayer(layer.id, { sensitivity: v })} />
            </div>
            <div className="space-y-2">
                <div className="flex justify-between">
                    <Label htmlFor="hasArea">Fill Area under Visualizer</Label>
                    <input type="checkbox" id="hasArea" checked={layer.hasArea || false} onChange={(e) => updateLayer(layer.id, { hasArea: e.target.checked })} />
                </div>
            </div>
            <div className="space-y-2">
                <Label>Color</Label>
                <input type="color" value={layer.color} onChange={(e) => updateLayer(layer.id, { color: e.target.value })} className="w-full h-8 rounded border" />
            </div>
        </div>
    );
}

function TextProperties({ layer, updateLayer }: { layer: TextLayer, updateLayer: (id: string, updates: Partial<TextLayer>) => void }) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Text Content</Label>
                <Input value={layer.text} onChange={(e) => updateLayer(layer.id, { text: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                    <Label>Font Weight</Label>
                    <select className="w-full h-8 px-2 rounded-md border text-sm bg-background" value={layer.fontWeight || 'normal'} onChange={(e) => updateLayer(layer.id, { fontWeight: e.target.value })}>
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                        <option value="100">Thin</option>
                        <option value="900">Black</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <Label>Font Style</Label>
                    <select className="w-full h-8 px-2 rounded-md border text-sm bg-background" value={layer.fontStyle || 'normal'} onChange={(e) => updateLayer(layer.id, { fontStyle: e.target.value })}>
                        <option value="normal">Normal</option>
                        <option value="italic">Italic</option>
                    </select>
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between"><Label>Font Size</Label><span className="text-xs">{layer.fontSize}px</span></div>
                <Slider value={[layer.fontSize]} min={12} max={200} step={1} onValueChange={([v]) => updateLayer(layer.id, { fontSize: v })} />
            </div>
            <div className="space-y-2">
                <Label>Color</Label>
                <input type="color" value={layer.color} onChange={(e) => updateLayer(layer.id, { color: e.target.value })} className="w-full h-8 rounded border" />
            </div>
        </div>
    );
}

function LyricsProperties({ layer, updateLayer }: { layer: LyricsLayer, updateLayer: (id: string, updates: Partial<LyricsLayer>) => void }) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <div className="flex justify-between"><Label>Font Size</Label><span className="text-xs">{layer.fontSize}px</span></div>
                <Slider value={[layer.fontSize]} min={12} max={80} step={1} onValueChange={([v]) => updateLayer(layer.id, { fontSize: v })} />
            </div>
            <div className="space-y-2">
                <Label>Color</Label>
                <input type="color" value={layer.color} onChange={(e) => updateLayer(layer.id, { color: e.target.value })} className="w-full h-8 rounded border" />
            </div>
            <div className="space-y-2">
                <span className="text-xs text-muted-foreground block border-t pt-2 mt-2">
                    Lyrics are edited in the Timeline view.
                </span>
            </div>
        </div>
    );
}
