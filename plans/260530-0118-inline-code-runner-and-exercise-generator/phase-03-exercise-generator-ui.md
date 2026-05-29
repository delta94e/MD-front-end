---
phase: 3
title: "Exercise Generator UI"
status: completed
priority: P2
effort: "45min"
dependencies: [2]
---

# Phase 3: Exercise Generator UI

## Overview

Add "Exercises" tab to AI panel. User clicks Generate → sees interactive exercise cards. Predict-output and fix-bug exercises show code blocks. Quiz shows multiple choice options. User selects answer → reveals correct answer with explanation.

## Requirements

- Functional: New tab "Exercise" in secondary tabs row
- Functional: Generate button calls API with current note content
- Functional: Exercise cards with interactive answer reveal
- Functional: Code blocks in exercises are syntax-highlighted
- Non-functional: Responsive, works on mobile

## Architecture

```
components/ai-panel.tsx
└── ExerciseTab (new component)
    ├── Generate button
    ├── Loading state
    └── ExerciseCard[] (rendered from API response)

ExerciseCard:
├── predict-output → code block + "What's the output?" + hidden answer
├── fix-bug → buggy code + "Find the bug" + hidden fix
└── quiz → question + 4 option buttons + hidden correct answer
```

## Related Code Files

- Modify: `components/ai-panel.tsx` — add ExerciseTab component
- Modify: `components/ai-panel.tsx` — add to secondaryTabs array

## Implementation Steps

1. Add `ExerciseTab` component in `ai-panel.tsx`:
   - State: `exercises`, `loading`, `revealedIndex` (which exercise is revealed)
   - `handleGenerate()` → POST to `/api/generate-exercises` with `editorContent`
   - Render exercise cards based on type

2. Add to `secondaryTabs` array:
   ```typescript
   { value: "exercise", icon: Brain, label: "Exercise" }
   ```
   Import `Brain` from lucide-react.

3. Add `TabsContent` for exercise:
   ```tsx
   <TabsContent value="exercise" className="mt-3">
     <ExerciseTab />
   </TabsContent>
   ```

4. ExerciseCard rendering:
   ```tsx
   function ExerciseCard({ exercise, index, revealed, onReveal }: {...}) {
     return (
       <div className="border rounded-lg p-3 space-y-2">
         <Badge variant="outline">{exercise.type}</Badge>
         {/* predict-output: show code, ask question */}
         {/* fix-bug: show buggy code */}
         {/* quiz: show options as buttons */}
         {revealed && (
           <div className="p-2 bg-muted rounded text-sm">
             <p className="font-medium">Answer: {exercise.answer || exercise.correctCode}</p>
             <p className="text-muted-foreground">{exercise.explanation}</p>
           </div>
         )}
       </div>
     );
   }
   ```

5. Quiz interaction: click option → highlight selected → reveal correct
6. Predict-output: "Show Answer" button → reveal output
7. Fix-bug: "Show Fix" button → reveal corrected code

## Success Criteria

- [ ] Exercise tab visible in secondary tabs
- [ ] Generate button creates exercises from current note
- [ ] Three exercise types render correctly
- [ ] Answer reveal works for all types
- [ ] Quiz options are clickable with visual feedback
