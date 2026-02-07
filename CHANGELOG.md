# Changelog

## [1.0.1] - 2026-02-07

### Added
- **Testing**: Added reproduction scripts `reproduce-session-bug.ts` and `reproduce-time.ts`.
- **Scripts**: Added data restoration and integrity check scripts (`restore-data.sql`, `check-abandon-question.js`, `check-basin-question.js`).
- **Assets**: Added review icons to Mini-App (`review.png`, `review-active.png`).

### Fixed
- **Study Progress**: Fixed issue where progress was lost/reset by saving full task list and trusting local storage.
- **Make-up Logic**: Make-up tasks now auto-resume silently if progress exists.
- **Vocabulary Test**: Added sound effects for correct/wrong answers, streaks, and completion.
- **Home Page**: Fixed white screen on startup by ensuring `today-learn` page configuration exists.
- **UX**: Moved welcome animation to the first tab ("Today's Learn") for correct startup experience.

## [1.0.0] - 2026-02-06

### Added
- **Mini-App**: **4-Tab Architecture** - Split "Today's Review" into "Today's Learn" (New Words) and "Review" (Timeline).
- **Mini-App**: **Make-up Learning** - Users can click on "Missed" days in timeline to learn *only* the new words from that day.
- **Mini-App**: **UX Enhancements** - Implemented option shuffling to prevent position memorization. Added "Streak-3" sound effect.
- **Mini-App**: Added 3D-style emoji icons (⭐️, 📖, 🔒) to Home Page timeline nodes.
- **Mini-App**: Added haptic feedback to audio playback button.
- **Web-Admin**: **Local Audio Hosting** - Downloaded all sound effects to local server to avoid network issues with external URLs.
- **Web-Admin**: **API Update** - `daily-tasks` now supports `day` parameter for make-up learning and auto-filters review words in this mode.
- **Web-Admin**: **Student Management** - Enforced phone number requirement in "Add Student" form to match backend validation.
- **Web-Admin**: **Class Management** - Added uniqueness check for class names to prevent duplicates.

### Changed
- **Mini-App**: Reduced delay after correct answer in "Listen and Choose" mode (1.5s -> 0.8s) for faster pacing.
- **Web-Admin**: Updated `download-word-audios.ts` script to use correct `public` path and include robustness checks for "upheaval".
- **Web-Admin**: Switched to dynamic import for `p-limit` in audio script to resolve ESM/CommonJS compatibility issues on server.
