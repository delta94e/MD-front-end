---
title: "AI-Powered Markdown Knowledge Hub"
description: "Personal Knowledge Management web app for software engineers — browse 485+ markdown files with AI-powered summarization, explanation, translation (EN↔VI), and writing assistance."
status: completed
priority: P1
branch: "main"
tags: [nextjs, ai, markdown, pkm, tailwind]
blockedBy: []
blocks: []
created: "2026-05-28T17:01:20.274Z"
createdBy: "ck:plan"
source: skill
---

# AI-Powered Markdown Knowledge Hub

## Overview

Build a Next.js App Router web app that serves as a central hub for viewing, editing, and interacting with 485+ markdown files organized in topic folders. Features a three-panel layout (file tree sidebar, markdown viewer/editor, AI panel) with dark-first theme, keyboard shortcuts, and Vercel AI SDK integration for summarization, contextual explanations, EN↔VI translation, and writing assistance.

## Tech Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui · react-arborist · react-markdown + remark-gfm + rehype-prism-plus · CodeMirror 6 · allotment · Vercel AI SDK · Google Gemini Flash · Claude Sonnet · Zustand · next-themes · lucide-react

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Project Setup & Configuration](./phase-01-project-setup-configuration.md) | Pending |
| 2 | [Core Layout & Theme](./phase-02-core-layout-theme.md) | Pending |
| 3 | [File Tree Sidebar](./phase-03-file-tree-sidebar.md) | Pending |
| 4 | [Markdown Viewer](./phase-04-markdown-viewer.md) | Pending |
| 5 | [Markdown Editor](./phase-05-markdown-editor.md) | Pending |
| 6 | [AI Integration](./phase-06-ai-integration.md) | Pending |
| 7 | [Polish & Testing](./phase-07-polish-testing.md) | Pending |

## Dependencies

- Phase 2 depends on Phase 1 (project must be set up)
- Phase 3 depends on Phase 2 (layout shell needed for sidebar)
- Phase 4 depends on Phase 2 (layout shell needed for viewer)
- Phase 5 depends on Phase 4 (viewer is the default, editor augments it)
- Phase 6 depends on Phases 3+4 (needs file content + viewer to attach AI)
- Phase 7 depends on all previous phases

## Key References

- Tech stack: `docs/tech-stack.md`
- Design guidelines: `docs/design-guidelines.md`
- Wireframe: `docs/wireframe/main-layout.html`
- Research reports: `plans/reports/researcher-260528-2347-*.md`
