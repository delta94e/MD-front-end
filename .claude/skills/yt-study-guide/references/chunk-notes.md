# Chunk notes

Input: one `chunks/NN.txt` file (a time range of a long lecture). Output: `chunks/NN.notes.md`, raw material the lesson is assembled from. Timestamps belong here (they locate frames later); the final lesson has none. Write in Vietnamese, original term in parentheses on first use.

Capture, in transcript order:

```markdown
## CHUNK NN · <start> → <end> · <chapter title if any>

### Ý chính
- [mm:ss] <every point the lecturer makes, one bullet each, with enough detail that someone who didn't watch can reconstruct it — definitions, steps, reasons, examples, numbers, code/formulas spoken aloud, opinions and advice>

### Thuật ngữ
- <term (original)>: <plain explanation>

### Chỗ người mới dễ kẹt
- <concept the lecturer skims or assumes> → <what a beginner needs to know>

### Khoảnh khắc nên chụp hình
- [mm:ss] <what is probably on screen — UI, slide, diagram, code, demo result — and which idea it would illustrate>

### Gợi ý sơ đồ
- <an idea in this chunk that a Mermaid diagram would explain well: process, interaction between actors, structure, comparison — and which diagram type>

### Gợi ý câu hỏi kiểm tra
- <1–2 questions on this chunk>
```

Done when every timestamped line of the chunk is reflected in some "Ý chính" bullet — nothing skipped because it seemed minor.
