---
title: "Interactive Knowledge Graph Visualization"
description: "Add a D3-based force-directed knowledge graph showing relationships between 485+ markdown files, with category clustering, click-to-navigate, and search/filter."
status: completed
priority: P2
branch: "main"
tags: [d3, graph, visualization, knowledge-base]
blockedBy: []
blocks: []
created: "2026-05-29T03:27:53.191Z"
createdBy: "ck:plan"
source: skill
---

# Interactive Knowledge Graph Visualization

## Overview

Add an interactive force-directed graph that visualizes relationships between all markdown files in the knowledge base. Nodes represent files, colored by category. Edges derive from README topic index, directory co-location, and filename similarity. Uses `react-force-graph-2d` (Canvas-based, built on d3-force) for performant rendering of 200-500 nodes. Graph replaces the main content area when activated; clicking a node opens that file.

## Tech Stack

`react-force-graph-2d` (Canvas, ~55KB gzip) · `d3-force` (bundled) · Zustand store additions · Build-time graph pre-computation script

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Research & Data Layer](./phase-01-research-data-layer.md) | Completed |
| 2 | [Graph Component](./phase-02-graph-component.md) | Completed |
| 3 | [Integration & Polish](./phase-03-integration-polish.md) | Completed |
| 4 | [Testing](./phase-04-testing.md) | Completed |

## Key Decisions

- **Library**: `react-force-graph-2d` over raw d3-force (saves 2-3x code, built-in interactions)
- **Edge sources**: README categories (weight 1.0) + directory co-location (0.8) + filename token overlap (0.5)
- **Integration**: Replace main content area (toggle between ContentViewer and GraphView)
- **Performance**: Pre-compute `graph.json` at build time (~50KB for 485 nodes)
- **No heading analysis**: Boilerplate headings ("Muc Luc", "Checklist") produce noisy edges

## Dependencies

None (standalone feature).
