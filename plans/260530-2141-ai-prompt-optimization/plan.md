---
title: "AI Prompt Optimization for Non-Technical Learners"
status: in-progress
phases:
  - id: 1
    title: "Rewrite All AI System Prompts"
    status: in-progress
created: 2026-05-30
---

# AI Prompt Optimization Plan

## Problem

Current AI prompts are generic and produce shallow output. They don't serve the target audience: **non-IT learners who are weak at logic** but want to **deep dive** into technical concepts with **practical application** and **performance** focus.

## Current State

9 prompt locations across 6 files:

| File | Prompts | Issues |
|------|---------|--------|
| `lib/ai-helpers.ts` | 7 prompts (summarize, explain, explainELI5, translate, rewrite, write, whyExplain, generateExercises) | Generic, no Vietnamese instruction, no depth guidance |
| `app/api/study-guide/route.ts` | 1 inline prompt | Good Vietnamese instruction but generic structure |
| `app/api/generate-flashcards/route.ts` | 1 inline prompt | English-only, no depth |
| `app/api/learning-path/route.ts` | 1 inline prompt | No learner context |

## Target Audience Profile

- **Non-IT background**, switching to tech or learning frontend
- **Weak at logic** — needs step-by-step breakdowns, analogies before abstractions
- **Wants depth** — not just "what" but "why", performance implications, real-world usage
- **Vietnamese-first** — comfortable in Vietnamese, technical terms in English with explanation

## Strategy

### Prompt Design Principles

1. **Layered Output**: Simple analogy first → technical explanation → code → performance note
2. **Vietnamese-First**: All explanations in Vietnamese, technical terms kept in English with `(giải thích)` format
3. **Concrete Before Abstract**: Real-world examples before theory
4. **Performance-Aware**: Always include "how fast/slow" and "why" for code patterns
5. **Error-Friendly**: Explain what happens when things go wrong, not just when they work

### Files to Modify

1. **`lib/ai-helpers.ts`** — Rewrite all 7 SYSTEM_PROMPTS constants
2. **`app/api/study-guide/route.ts`** — Rewrite SYSTEM_PROMPT
3. **`app/api/generate-flashcards/route.ts`** — Rewrite SYSTEM_PROMPT
4. **`app/api/learning-path/route.ts`** — Rewrite SYSTEM_PROMPT

### Prompt Rewrites

#### 1. `summarize` (ai-helpers.ts)
Current: Generic "concise technical summarizer"
New: Vietnamese-first, structured output with "Tại sao quan trọng" section

#### 2. `explain` (ai-helpers.ts)
Current: Generic "patient technical educator"
New: 3-layer explanation (analogy → concept → code), Vietnamese, performance notes

#### 3. `explainELI5` (ai-helpers.ts)
Current: Basic "explain like I'm 5"
New: Real-life analogy → step-by-step → what could go wrong → performance tip

#### 4. `translate` (ai-helpers.ts)
Current: Basic translator
New: Context-aware technical translator with term explanations

#### 5. `rewrite` / `write` (ai-helpers.ts)
Current: Generic writing assistant
New: Writing assistant that simplifies for non-technical readers

#### 6. `whyExplain` (ai-helpers.ts)
Current: Design rationale explainer
New: Trade-off analysis with real-world impact, performance implications

#### 7. `generateExercises` (ai-helpers.ts)
Current: Basic exercise generator
New: Progressive difficulty, Vietnamese explanations, real-world scenarios

#### 8. `study-guide` (study-guide/route.ts)
Current: Good structure but generic guidance
New: Deeper concept explanations, practical code examples, performance patterns

#### 9. `generate-flashcards` (generate-flashcards/route.ts)
Current: English-only, basic
New: Vietnamese-first, include "mẹo nhớ" (memory tips), difficulty levels

#### 10. `learning-path` (learning-path/route.ts)
Current: Basic file ordering
New: Include prerequisites, difficulty rating, practical outcomes per step

## Success Criteria

- [ ] All prompts produce Vietnamese-first output
- [ ] Every technical concept has a real-world analogy
- [ ] Code examples include performance notes
- [ ] Output is structured with clear layers (simple → deep)
- [ ] Non-technical readers can understand 80%+ of output
- [ ] Technical depth is maintained for senior-level review
