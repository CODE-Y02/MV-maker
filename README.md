# 🎵 Music Maker - Web-Based Music Visualizer & Lyric Video Editor

Music Maker is a powerful, **100% client-side** web application that allows musicians and creators to transform their audio into stunning lyric videos and music visualizers instantly. No server uploads, no privacy concerns, and no expensive software required.

> "Create lyric videos in 60 seconds — right in your browser."

---

## ✨ Key Features

- **🛡️ 100% Private & Local**: All processing happens in your browser. Your audio and images never touch a server.
- **📊 Dynamic Visualizers**: Choose from various templates including Bars, Circular, Waveform, Bass-reactive, and Particle effects.
- **✍️ Lyric/Subtitle System**:
  - **SRT Upload**: Import existing subtitle files.
  - **Manual Editor**: Timeline-based editor with drag handles for precise timing.
  - **Auto-Transcription**: Experimental Whisper WASM integration for automatic lyric generation.
- **🖼️ Custom Backgrounds**: Upload your album art or posters to use as the backdrop.
- **🎬 WebM Export**: High-speed video export (480p/720p) directly from the browser using standard Web APIs.
- **🎹 Interactive Timeline**: Scrubbable waveform timeline with real-time preview and playhead sync.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Audio Engine**: [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) & [Howler.js](https://howlerjs.com/)
- **Video Processing**: [webm-muxer](https://github.com/kairi003/webm-muxer) & [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Runtime**: [Bun](https://bun.sh/) (Recommended)

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed (or Node.js v20+)
- A modern web browser (Chrome, Edge, or Firefox recommended for MediaRecorder support)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/CODE-Y02/MV-maker.git
   cd MV-maker
   ```

2. **Install dependencies**:
   ```bash
   bun install
   # or
   npm install
   ```

3. **Run the development server**:
   ```bash
   bun dev
   # or
   npm run dev
   ```

4. **Build for production**:
   ```bash
   bun run build
   bun start
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📖 How to Use

1. **Upload Audio**: Drag and drop your MP3/WAV file. The waveform will generate automatically.
2. **Set Background**: Upload your album art or brand image.
3. **Customize Visualizer**: Use the side panel to change templates, colors, and sensitivity.
4. **Add Lyrics**: 
   - Click "Add Subtitle" on the timeline.
   - Drag the edges to adjust timing.
   - Type your text directly in the editor.
5. **Export**: Hit the "Export" button, choose your FPS, and wait for the browser to render your video file.

---

## 🤝 Contributing

Contributions are welcome! If you have ideas for new visualizer templates or feature improvements, feel free to open an issue or submit a pull request.

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.

---

Built with ❤️ for indie artists.
