# Product Requirements Document (PRD)
**Product:** Web-Based Music Visualizer + Lyric Video Editor  
**Type:** Fully Client-Side Web App  

---

# 1. Product Overview

## Description
A browser-based tool that allows users to upload audio, apply visualizers, add subtitles, and export a lyric video — all processed locally without server uploads.

---

## Target Audience
- Indie musicians
- Content creators
- Casual users
- Designers

---

## Problem Statement
Existing tools for creating lyric or visualizer videos are:
- complicated
- slow
- expensive
- require downloads
- or upload files to servers

---

## Value Proposition
- Runs entirely in browser
- No installation
- No uploads
- Fast export
- Beginner friendly

---

# 2. Core Features

---

## Audio Upload
Supports MP3/WAV upload and generates waveform preview.

Priority: Must-have

---

## Poster Upload
Upload background image or album art.

Priority: Must-have

---

## Visualizer Templates
Types:
- Bars
- Circular
- Waveform
- Bass reactive
- Particle

Priority: Must-have

---

## Subtitle System
Input methods:
- SpeechRecognition
- Whisper WASM
- SRT Upload

Priority:
- SRT → Must-have
- Auto transcription → Nice-to-have

---

## Manual Subtitle Editor
Timeline-based editing with drag handles.

Priority: Must-have

---

## Video Export
Export canvas + audio to WebM 480p.

Priority: Must-have

---

## Timeline Preview
Scrubbable waveform timeline with playhead.

Priority: Must-have

---

## Export Progress
Progress bar + cancel option.

Priority: Must-have

---

## Watermark (Optional)
Small watermark for free version.

Priority: Nice-to-have


----
# 3. UI & UX Design

---

## Layout Structure

Top Bar
- Logo
- Export Button
- Settings

Left Panel
- Upload
- Templates
- Subtitles
- Controls

Center
- Preview Canvas

Bottom
- Timeline

---

## Desktop Layout
3-column layout
- Left = controls
- Center = preview
- Bottom = timeline

---

## Mobile Layout
Vertical stack
- Preview
- Tabs for tools
- Collapsible timeline

---

## Screens

### Upload Screen
- Drag drop audio
- Upload image

### Editor Screen
- Live preview
- Sliders + controls
- Timeline

### Export Modal
- Resolution selector
- FPS selector
- Export button
- Progress bar

---

## Interaction Rules
- Sliders update instantly
- Scrubbing pauses playback
- Subtitles update live
- Visualizers animate smoothly

---

## Visualizer Controls
- Sensitivity
- Color
- Thickness
- Reactivity

---

## Subtitle Controls
- Drag timing
- Snap to beat
- Keyboard shortcuts

---

## Export Controls
- FPS
- File name
- Watermark toggle

# 4. Frontend Architecture

---

## Tech Stack
- React
- Vite
- Canvas API
- Web Audio API
- MediaRecorder API

---

## Component Tree

App
 ├ UploadScreen
 ├ EditorLayout
 │   ├ Sidebar
 │   ├ PreviewCanvas
 │   ├ Timeline
 │   └ ExportModal

---

## State Management
Recommended: Zustand

State slices:
- audioState
- subtitleState
- visualizerState
- exportState
- uiState

---

## Data Structures

Audio
{
 buffer,
 duration,
 sampleRate,
 peaks[]
}

Subtitles
[
 { start, end, text }
]

Visualizer
{
 template,
 sensitivity,
 color,
 thickness
}

---

## Rendering Loop
Use requestAnimationFrame

Steps:
1. Get audio frequency data
2. Render visualizer
3. Draw subtitles
4. Draw image
5. Sync with audio time

Optimization:
- Pause rendering when tab hidden
- Use OffscreenCanvas if available

---

## Event Handling
- Pointer events for timeline
- Keyboard shortcuts
- Debounced sliders
- Audio time sync

# 5. Non-Functional Requirements

---

## Performance
- 30 FPS on low-end laptops
- UI response <200ms

---

## Browser Support
Full:
- Chrome
- Edge
- Firefox

Partial:
- Safari

---

## Memory Optimization
- Release buffers after export
- Downscale images
- Avoid duplicate audio buffers

---

## File Limits
- Audio ≤ 50MB
- Image ≤ 10MB

---

## Export Constraints
- Format: WebM
- Resolution: 854x480
- FPS: 24 or 30

---

## Accessibility
- Keyboard navigation
- Screen reader labels
- Color contrast safe

---

# 6. Analytics

Track Events:
- Upload audio
- Select template
- Add subtitles
- Start export
- Complete export

Tools:
- Plausible
- Umami

Success Metrics:
- % exports completed
- Session time
- Return users
- Template usage

---

# 7. Roadmap

---

## MVP
- Upload audio
- Upload image
- 3 visualizers
- Subtitle editor
- Timeline
- Export video

Timeline: ~6 weeks

---

## Phase 2
- Auto transcription
- More templates
- Custom fonts

---

## Phase 3
- HD export
- Template marketplace
- Plugin system

---

# 8. Strategy Notes

Design Principles:
- Simple UI
- Fast feedback
- Minimal clicks

Risks:
- Large files freezing browser
- Heavy transcription models
- MediaRecorder inconsistencies

Differentiation:
- Fully local processing
- No installs
- Fast creation

Tagline:
"Create lyric videos in 60 seconds — right in your browser."