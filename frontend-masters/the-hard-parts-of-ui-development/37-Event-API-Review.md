# The Hard Parts of UI Development — Phần 37: Event API Review — "Summary: Auto-Inserted, Composable, Semi-Visual!"

> 📅 2026-03-08 · ⏱ 15 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Bài: Event API Review — "Tổng kết event object, map + spread, composable code!"

---

## §1. Event Object — "Auto-Inserted, No Named Accessors!"

> Will: _"Our handle function can work on DOM elements where we DON'T have named accessor objects. Instead, they provide via this auto-inserted argument — the event object."_

### Tại sao cần event object?

Khi dùng `elems` array thay vì `jsInput`/`jsDiv` → **không có named accessors** nữa!

Will: _"If we didn't put an 'e' parameter there, we wouldn't be able to access this auto-inserted argument."_

Flow: e.target → accessor linked to input → e.target.value = "Li" → `name = "Li"`!

---

## §2. VDOM Archive — "Seems Wasteful, Could Compare!"

> Will: _"It seems a bit wasteful — maybe we could have used that and made a COMPARISON to see what actually CHANGED."_

### Will teases diff AGAIN!

Mỗi lần updateDOM chạy → **wipe old VDOM** → create new!

Will: _"Wipe the previous version. It seems wasteful — maybe we could have used that and made a comparison to it to see what actually changed."_

→ Diff algorithm preview (lần thứ 3 Will nhắc!)

---

## §3. Full Pipeline Review

> Will: _"Data is changed. Recreate the representation. Any conditions described in the VDOM as to what will be displayed. Convert each element into actual DOM elements. Appended and the display updates."_

### 4 bước pipeline!

1. **Data change** → handle updates name!
2. **createVDOM** → recreate full representation with new data!
3. **map(convert)** → convert each element to DOM!
4. **replaceChildren(...elems)** → display! User sees change!

Will: _"We're long past worrying about the user's content they're typing. We're just seeing that as a SUBMISSION to handle and then update data."_

```
FULL PIPELINE:
═══════════════════════════════════════════════════════════════

  1. handle(e): name = e.target.value → DATA CHANGE!
  2. createVDOM(): VDOM = [arrays] → DESCRIPTION!
  3. VDOM.map(convert): elems = [accessors] → CONVERSION!
  4. replaceChildren(...elems): → DISPLAY!

  "Adding new elements? Just add to the list!
   They'll ALL show up." — Will 🎯
```

---

## §4. Element Flexible + Composable!

> Will: _"With our element flexible code, we can COMPOSE — adding to our list of arrays each new element we want in order on the page."_

### Convert function sophistication!

Will: _"Our convert function would have to become far more VERSATILE to handle many different types of DOM elements."_

_"We get semi-visual coding."_

→ Tiếp theo: functional components — functions tạo VDOM sub-arrays!

---

## Checklist

```
[ ] Event object: auto-inserted, no named accessors needed!
[ ] VDOM archive: "wasteful" → diff teaser (3rd time!)
[ ] Pipeline: data → createVDOM → map(convert) → display!
[ ] User typing = just a SUBMISSION to handler!
[ ] Element flexible: add to list → no new code!
[ ] Convert: needs more sophistication for many element types!
TIẾP THEO → Phần 38: Generating VDOM Elements from Array!
```
