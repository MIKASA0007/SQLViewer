# Android SQL Viewer Constitution

## Core Principles

### I. Native Android Experience (MANDATORY)
The application MUST be a native Android app built with modern Android development tools 
(Android Studio, Kotlin/Java, latest SDK). The app must integrate seamlessly with Android's
file system, following platform conventions for file handling, permissions, and UI patterns.

**Rationale**: Ensures optimal performance, proper system integration, and familiar user experience
for Android users. Native implementation provides access to file association APIs and system
intents required for .sql file handling.

### II. File Association & System Integration (NON-NEGOTIABLE)
The app MUST register as a handler for `.sql` file types through Android's intent-filter system,
allowing users to open SQL files from any file manager, email attachment, or other apps.
Implementation must follow Android's security model and scoped storage requirements.

**Rationale**: This is the core requirement - users must be able to select the app as default
.sql file opener. Without proper intent-filter registration and file access handling, the
primary use case fails.

### III. Syntax Highlighting & Readability (MANDATORY)
SQL content MUST be displayed with syntax highlighting that distinguishes keywords, identifiers,
literals, and comments. The implementation must support standard SQL syntax and be extensible
for common SQL dialects (SQLite, MySQL, PostgreSQL). Display must handle large files (>10MB)
without performance degradation.

**Rationale**: Raw SQL without highlighting is difficult to read and understand. Syntax
highlighting transforms the app from a simple viewer to a professional tool. Performance with
large files ensures usability across real-world scenarios.

### IV. Template-Driven Development Process (MANDATORY)
All feature specifications, implementation plans, and task breakdowns MUST originate from
version-controlled templates in `.specify/templates/`. The development process must follow the
phase-based workflow: Setup, Foundational, User Stories, and Polish phases.

**Rationale**: Maintains consistency across development efforts, ensures constitutional compliance,
and enables systematic evolution of both the app and its development process.

### V. Offline-First & Privacy-Conscious (MANDATORY)
The app MUST function entirely offline with no network requests, cloud dependencies, or data
transmission. File access must be read-only by default with no modifications to original SQL
files. No user tracking, analytics, or data collection without explicit opt-in.

**Rationale**: SQL files often contain sensitive data. An offline, read-only approach builds
user trust and ensures the app works reliably in any environment without internet connectivity.

## Android Development Standards

### Technology Stack
- **Language**: Kotlin (preferred) or Java
- **Minimum SDK**: API 26 (Android 8.0) for proper file association support
- **Target SDK**: Latest stable Android SDK
- **Build Tools**: Android Studio with Gradle
- **Architecture**: MVVM or MVI with Repository pattern
- **UI Framework**: Jetpack Compose (preferred) or XML layouts

### Code Quality Requirements
- Kotlin code must follow Kotlin Coding Conventions
- XML layouts must include content descriptions for accessibility
- Database operations must be performed off main thread
- Proper lifecycle management for Activities and Fragments
- Memory-efficient handling of large files (pagination, lazy loading)

## Governance

### Constitutional Supremacy
This constitution supersedes all other development practices. Any conflicting guidance
(including Android development trends or personal preferences) MUST be updated to align with
these principles. Deviations require documented justification and approval.

### Amendment Process
- **MAJOR**: Changes to core principles, file handling behavior, or syntax highlighting requirements
- **MINOR**: New features, additional SQL dialect support, UI enhancements
- **PATCH**: Bug fixes, performance improvements, documentation clarifications

### Review Requirements
All pull requests MUST include:
- Verification of AndroidManifest.xml intent-filter configuration
- Test with sample SQL files of various sizes
- Accessibility testing (TalkBack compatibility)
- Performance testing with files >5MB
- Constitution compliance checklist

### Versioning Alignment
App version numbers follow semantic versioning and must be synchronized with:
- Constitution version updates
- Template version compatibility
- Android SDK deprecation schedules

**Version**: 1.0.0 | **Ratified**: 2025-02-09 | **Last Amended**: 2025-02-09