# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of PRIOR — Persian Todo app
- Today View with Jalali week strip and agenda
- Board View with Kanban columns (New → Doing → Finished) and drag-and-drop
- AI Assistant (PRIOR) with natural language tool calling
- Bring Your Own Model support (OpenAI, OpenRouter, Groq, Together, Ollama, LM Studio)
- Persistent chat history stored in SQLite
- Instant settings apply (no restart needed)
- PRIOR brutalist/editorial design system

### Design
- Custom color palette: Ink (#171717), Paper (#F4F0E8), Signal (#FF5A36), Muted (#8B8780), Border (#DDD7CC)
- Editorial typographic scale
- Generous whitespace, clean borders, subtle shadows
- No gradients, glassmorphism, or neon

### Technical
- Tauri v2 + React 18 + TypeScript + Vite
- SQLite via tauri-plugin-sql
- CORS-free fetch via tauri-plugin-http
- @dnd-kit for drag-and-drop
- jalaali-js for Persian calendar
- Vazirmatn font bundled offline

## [0.1.0] - 2026-08-18

### Added
- Initial project structure and configuration
- Basic todo CRUD operations
- Jalali calendar integration
- OpenAI-compatible AI assistant with tool calls
- Settings modal with provider presets