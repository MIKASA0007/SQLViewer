# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Kotlin 1.9, Java 17, or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., SQLite library, syntax highlighting library, or NEEDS CLARIFICATION]  
**Minimum SDK**: [e.g., API 26 (Android 8.0) or NEEDS CLARIFICATION]  
**Target SDK**: [e.g., API 34 (Android 14) or NEEDS CLARIFICATION]  
**Architecture Pattern**: [e.g., MVVM, MVI, or NEEDS CLARIFICATION]  
**UI Framework**: [Jetpack Compose or XML layouts]  
**Testing**: [e.g., JUnit, Espresso, or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Native Android Experience Compliance
- [ ] Modern Android development stack selected (Kotlin/Java, appropriate SDK)
- [ ] Android Studio compatibility verified
- [ ] Target platform constraints documented

### II. File Association & System Integration
- [ ] Intent-filter configuration for `.sql` files defined in AndroidManifest.xml
- [ ] Scoped storage permissions and FileProvider configured
- [ ] Test plan for file opening from various sources (file manager, email, etc.)

### III. Syntax Highlighting Implementation Plan
- [ ] SQL parsing/highlighting library selected or custom implementation planned
- [ ] Performance considerations for large files documented
- [ ] Supported SQL dialects identified

### IV. Template-Driven Design Compliance
- [ ] All deliverables use templates from `.specify/templates/`
- [ ] Custom Android-specific sections documented and justified
- [ ] Template version compatibility verified

### V. Offline-First & Privacy
- [ ] Network permission requirements assessed (should be none)
- [ ] Read-only file access confirmed
- [ ] No data collection/analytics without explicit justification

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: For Android projects, typically one of these structures:
  Option 1: Single module Kotlin app
  Option 2: Multi-module (app + core) for better separation
-->

```text
# Recommended: Standard Android Studio project
app/
├── src/
│   ├── main/
│   │   ├── java/com/example/sqlviewer/
│   │   │   ├── MainActivity.kt
│   │   │   ├── SqlFileViewerActivity.kt
│   │   │   ├── SqlHighlighter.kt
│   │   │   └── FileIntentHandler.kt
│   │   ├── res/
│   │   │   ├── layout/
│   │   │   ├── values/
│   │   │   └── xml/file_paths.xml  # For FileProvider
│   │   └── AndroidManifest.xml
│   └── test/  # Unit tests
│       └── java/com/example/sqlviewer/
│           └── SqlHighlighterTest.kt
└── build.gradle.kts

# Optional: Additional test directories
androidTest/  # Instrumentation tests
```

**Structure Decision**: [Document the selected structure and reference the real directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., Custom SQL parser] | [specific performance/accuracy requirements] | [why library insufficient] |
| [e.g., Multi-module architecture] | [separation of concerns for testing] | [why single module insufficient] |
