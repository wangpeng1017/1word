# Changelog

## [Unreleased]

### Added
- **Mini-App**: Added 3D-style emoji icons (⭐️, 📖, 🔒) to Home Page timeline nodes.
- **Mini-App**: Added haptic feedback to audio playback button in "Listen and Choose" mode.

### Changed
- **Mini-App**: Reduced delay after correct answer in "Listen and Choose" mode (1.5s -> 0.8s) for faster pacing.
- **Web-Admin**: Updated `download-word-audios.ts` script to use correct `public` path and include robustness checks for "upheaval".
- **Web-Admin**: Switched to dynamic import for `p-limit` in audio script to resolve ESM/CommonJS compatibility issues on server.
