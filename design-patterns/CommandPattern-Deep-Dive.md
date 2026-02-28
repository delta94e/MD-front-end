# Command Pattern — Deep Dive

> 📅 2026-02-15 · ⏱ 25 phút đọc
>
> Command Concept & Encapsulation,
> OrderManager Refactoring,
> Undo/Redo with Command History,
> Text Editor — Copy/Cut/Paste/Undo,
> Macro Commands & Composite,
> Command Queue & Deferred Execution,
> Transaction & Rollback,
> Command vs Strategy vs Observer vs Mediator,
> Real-World Applications & Tradeoffs
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Behavioral Design Pattern

---

## Mục Lục

| #   | Phần                                    |
| --- | --------------------------------------- |
| 1   | Command Pattern là gì?                  |
| 2   | Vấn đề — Tight Coupling                 |
| 3   | OrderManager — Ví dụ kinh điển          |
| 4   | Command Structure — 4 thành phần        |
| 5   | Undo/Redo — Command History             |
| 6   | Text Editor — Copy/Cut/Paste/Undo       |
| 7   | Macro Commands — Composite              |
| 8   | Command Queue — Deferred Execution      |
| 9   | Transaction & Rollback                  |
| 10  | Command trong React                     |
| 11  | So sánh Command vs Strategy vs Observer |
| 12  | Real-World Applications                 |
| 13  | Tradeoffs — Ưu & Nhược điểm             |
| 14  | Tóm tắt                                 |

---

## §1. Command Pattern là gì?

```
COMMAND PATTERN — KHÁI NIỆM:
═══════════════════════════════════════════════════════════════

  ĐỊNH NGHĨA:
  → Command = ĐÓNG GÓI request thành OBJECT!
  → Object chứa TẤT CẢ info cần thiết để thực thi!
  → → Method name, receiver, arguments → TẤT CẢ trong 1 object!
  → Cho phép: queue, log, undo/redo, delay execution!

  TÊN GỌI KHÁC:
  → Action, Transaction, Operation!

  VÍ DỤ THỰC TẾ: NHÀ HÀNG!
  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
  │ Khách    │───→│ Bồi bàn  │───→│ Phiếu   │───→│ Đầu bếp │
  │ (Client) │    │ (Invoker)│    │ (Command)│    │(Receiver)│
  └──────────┘    └──────────┘    └──────────┘    └──────────┘

  → Khách: YÊU CẦU món ăn!
  → Bồi bàn: GHI phiếu order (KHÔNG nấu!)
  → Phiếu: CHỨA tất cả info (món, số lượng, ghi chú!)
  → Đầu bếp: THỰC HIỆN nấu ăn!

  → Phiếu order = COMMAND OBJECT!
  → Bồi bàn KHÔNG CẦN biết cách nấu!
  → Đầu bếp KHÔNG CẦN gặp khách!
  → → DECOUPLED! Tách rời sender và receiver!
```

```
TẠI SAO CẦN COMMAND PATTERN?
═══════════════════════════════════════════════════════════════

  ① DECOUPLE sender và receiver!
  → Người GỌI không cần biết ai THỰC HIỆN!

  ② UNDO/REDO!
  → Lưu history commands → undo bất kỳ lúc nào!

  ③ QUEUE commands!
  → Xếp hàng → thực thi SAU!

  ④ LOG commands!
  → Ghi lại LỊCH SỬ mọi thao tác!

  ⑤ MACRO commands!
  → Gộp nhiều commands = 1 complex operation!

  ⑥ TRANSACTION!
  → Execute tất cả hoặc rollback tất cả!
```

---

## §2. Vấn đề — Tight Coupling

```javascript
// ═══ VẤN ĐỀ: TIGHT COUPLING! ═══

// ❌ BAD — methods GẮN CHẶT vào manager:
class OrderManager {
  constructor() {
    this.orders = [];
  }

  placeOrder(order, id) {
    this.orders.push(id);
    return `You have successfully ordered ${order} (${id})`;
  }

  trackOrder(id) {
    return `Your order ${id} will arrive in 20 minutes.`;
  }

  cancelOrder(id) {
    this.orders = this.orders.filter((order) => order.id !== id);
    return `You have canceled your order ${id}`;
  }
}

const manager = new OrderManager();

// Client GỌI TRỰC TIẾP methods!
manager.placeOrder("Pad Thai", "1234");
manager.trackOrder("1234");
manager.cancelOrder("1234");

// → VẤN ĐỀ:
// → Đổi tên placeOrder → addOrder? → SỬA MỌI NƠI gọi!
// → Thêm logic (logging, validation)? → SỬA trong class!
// → Muốn undo? → KHÔNG CÓ CÁCH!
// → Muốn queue? → KHÔNG CÓ CÁCH!
// → Client GẮN CHẶT vào OrderManager!
```

```
TIGHT COUPLING:
═══════════════════════════════════════════════════════════════

  Client ──────────→ OrderManager
  manager.placeOrder()    ↑ methods GẮN CHẶT!
  manager.trackOrder()    ↑ đổi tên = BREAK!
  manager.cancelOrder()   ↑ thêm logic = SỬA class!

  → Client BIẾT hết tên methods!
  → Client PHẢI THAY ĐỔI khi methods đổi!
  → KHÔNG có abstraction layer!

  LOOSE COUPLING (sau Command Pattern):

  Client → execute(command) → Command → Receiver
           ↑ 1 method DUY NHẤT!
           ↑ Client không biết ai xử lý!
           ↑ Command ĐÓNG GÓI hết!
```

---

## §3. OrderManager — Ví dụ kinh điển

```javascript
// ═══ GIẢI PHÁP: COMMAND PATTERN! ═══

// ① OrderManager — chỉ còn 1 method: execute!
class OrderManager {
  constructor() {
    this.orders = [];
  }

  execute(command, ...args) {
    return command.execute(this.orders, ...args);
  }
}

// ② Command base class:
class Command {
  constructor(execute) {
    this.execute = execute;
  }
}

// ③ Concrete Commands:
function PlaceOrderCommand(order, id) {
  return new Command((orders) => {
    orders.push(id);
    return `You have successfully ordered ${order} (${id})`;
  });
}

function CancelOrderCommand(id) {
  return new Command((orders) => {
    orders = orders.filter((order) => order.id !== id);
    return `You have canceled your order ${id}`;
  });
}

function TrackOrderCommand(id) {
  return new Command(() => {
    return `Your order ${id} will arrive in 20 minutes.`;
  });
}

// ④ Client — DECOUPLED!
const manager = new OrderManager();

manager.execute(new PlaceOrderCommand("Pad Thai", "1234"));
// → "You have successfully ordered Pad Thai (1234)"

manager.execute(new TrackOrderCommand("1234"));
// → "Your order 1234 will arrive in 20 minutes."

manager.execute(new CancelOrderCommand("1234"));
// → "You have canceled your order 1234"

// → Client KHÔNG GỌI TRỰC TIẾP placeOrder/cancelOrder!
// → Client chỉ gọi execute(command)!
// → Đổi tên method? → CHỈ SỬA trong Command!
// → Thêm undo? → Thêm vào Command!
```

```
TRƯỚC vs SAU:
═══════════════════════════════════════════════════════════════

  TRƯỚC:                          SAU:
  manager.placeOrder(...)         manager.execute(new PlaceOrderCommand(...))
  manager.trackOrder(...)         manager.execute(new TrackOrderCommand(...))
  manager.cancelOrder(...)        manager.execute(new CancelOrderCommand(...))
       ↓                              ↓
  3 methods trên manager!         1 method execute + 3 Command objects!
  Tightly coupled!                Loosely coupled!
  Đổi tên = sửa nhiều nơi!       Đổi tên = sửa 1 Command class!
```

---

## §4. Command Structure — 4 thành phần

```
BỐN THÀNH PHẦN CỦA COMMAND PATTERN:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ① CLIENT (Người tạo commands!)                         │
  │  → Tạo concrete command objects!                        │
  │  → Truyền receiver + params vào command!                │
  │  → Giao command cho invoker!                            │
  │                                                          │
  │  ② INVOKER (Người gọi!)                                │
  │  → Nhận command từ client!                              │
  │  → GỌI command.execute()!                               │
  │  → KHÔNG biết command làm gì bên trong!                 │
  │  → Có thể lưu history commands!                         │
  │                                                          │
  │  ③ COMMAND (Object đóng gói request!)                   │
  │  → Interface chung: execute()!                          │
  │  → Có thể thêm: undo(), redo()!                        │
  │  → Chứa reference tới receiver!                        │
  │  → Chứa params cần thiết!                              │
  │                                                          │
  │  ④ RECEIVER (Người thực hiện!)                          │
  │  → Biết cách THỰC HIỆN công việc!                       │
  │  → Business logic THỰC SỰ ở đây!                       │
  │  → BẤT KỲ class nào cũng có thể là receiver!           │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  FLOW:
  Client ──→ Command(receiver, params)
                 ↓
  Invoker ──→ command.execute()
                 ↓
  Command ──→ receiver.action(params)
                 ↓
  Receiver ──→ THỰC HIỆN công việc!
```

```javascript
// ═══ COMMAND PATTERN — FULL STRUCTURE ═══

// ④ RECEIVER — biết cách thực hiện!
class Light {
  constructor(location) {
    this.location = location;
    this.isOn = false;
  }

  turnOn() {
    this.isOn = true;
    console.log(`${this.location} light is ON`);
  }

  turnOff() {
    this.isOn = false;
    console.log(`${this.location} light is OFF`);
  }
}

// ③ COMMAND interface + concrete commands!
class Command {
  execute() {
    throw new Error("Must implement execute()!");
  }
  undo() {
    throw new Error("Must implement undo()!");
  }
}

class TurnOnCommand extends Command {
  constructor(light) {
    super();
    this.light = light; // ← Receiver reference!
  }

  execute() {
    this.light.turnOn();
  }

  undo() {
    this.light.turnOff(); // ← REVERSE action!
  }
}

class TurnOffCommand extends Command {
  constructor(light) {
    super();
    this.light = light;
  }

  execute() {
    this.light.turnOff();
  }

  undo() {
    this.light.turnOn();
  }
}

// ② INVOKER — gọi execute, lưu history!
class RemoteControl {
  constructor() {
    this.history = []; // ← Command history cho undo!
  }

  executeCommand(command) {
    command.execute();
    this.history.push(command);
  }

  undo() {
    const command = this.history.pop();
    if (command) {
      command.undo();
    }
  }
}

// ① CLIENT — tạo receivers, commands, invoker!
const livingRoomLight = new Light("Living Room");
const kitchenLight = new Light("Kitchen");

const turnOnLiving = new TurnOnCommand(livingRoomLight);
const turnOffKitchen = new TurnOffCommand(kitchenLight);

const remote = new RemoteControl();

remote.executeCommand(turnOnLiving);
// → "Living Room light is ON"

remote.executeCommand(turnOffKitchen);
// → "Kitchen light is OFF"

remote.undo(); // ← UNDO last command!
// → "Kitchen light is ON" (reversed!)

remote.undo();
// → "Living Room light is OFF" (reversed!)
```

---

## §5. Undo/Redo — Command History

```javascript
// ═══ UNDO/REDO — COMMAND HISTORY STACK ═══

class CommandHistory {
  constructor() {
    this.undoStack = []; // Lệnh đã thực thi!
    this.redoStack = []; // Lệnh đã undo!
  }

  execute(command) {
    command.execute();
    this.undoStack.push(command);
    this.redoStack = []; // ← Clear redo khi execute mới!
  }

  undo() {
    if (this.undoStack.length === 0) {
      console.log("Nothing to undo!");
      return;
    }
    const command = this.undoStack.pop();
    command.undo();
    this.redoStack.push(command); // ← Chuyển sang redo!
  }

  redo() {
    if (this.redoStack.length === 0) {
      console.log("Nothing to redo!");
      return;
    }
    const command = this.redoStack.pop();
    command.execute(); // ← Thực thi LẠI!
    this.undoStack.push(command); // ← Về lại undo!
  }

  canUndo() {
    return this.undoStack.length > 0;
  }
  canRedo() {
    return this.redoStack.length > 0;
  }

  getHistory() {
    return this.undoStack.map(
      (cmd, i) => `${i + 1}. ${cmd.description || cmd.constructor.name}`,
    );
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}
```

```
UNDO/REDO FLOW:
═══════════════════════════════════════════════════════════════

  Execute A → Execute B → Execute C:
  undoStack: [A, B, C]
  redoStack: []

  Undo (C):
  undoStack: [A, B]
  redoStack: [C]

  Undo (B):
  undoStack: [A]
  redoStack: [C, B]

  Redo (B):
  undoStack: [A, B]
  redoStack: [C]

  Execute D (mới!):
  undoStack: [A, B, D]
  redoStack: []  ← CLEAR! Không redo C nữa!
```

```javascript
// ═══ VÍ DỤ: CALCULATOR VỚI UNDO/REDO ═══

class Calculator {
  constructor() {
    this.value = 0;
  }

  add(n) {
    this.value += n;
  }
  subtract(n) {
    this.value -= n;
  }
  multiply(n) {
    this.value *= n;
  }
  divide(n) {
    if (n === 0) throw new Error("Division by zero!");
    this.value /= n;
  }
  getValue() {
    return this.value;
  }
}

class AddCommand {
  constructor(calculator, value) {
    this.calculator = calculator;
    this.value = value;
    this.description = `Add ${value}`;
  }
  execute() {
    this.calculator.add(this.value);
  }
  undo() {
    this.calculator.subtract(this.value);
  }
}

class SubtractCommand {
  constructor(calculator, value) {
    this.calculator = calculator;
    this.value = value;
    this.description = `Subtract ${value}`;
  }
  execute() {
    this.calculator.subtract(this.value);
  }
  undo() {
    this.calculator.add(this.value);
  }
}

class MultiplyCommand {
  constructor(calculator, value) {
    this.calculator = calculator;
    this.value = value;
    this.previousValue = 0; // ← Cần snapshot cho undo!
    this.description = `Multiply by ${value}`;
  }
  execute() {
    this.previousValue = this.calculator.getValue();
    this.calculator.multiply(this.value);
  }
  undo() {
    // KHÔNG THỂ divide ngược (integer division problem!)
    // → Dùng SNAPSHOT!
    this.calculator.value = this.previousValue;
  }
}

// SỬ DỤNG:
const calc = new Calculator();
const history = new CommandHistory();

history.execute(new AddCommand(calc, 10));
console.log(calc.getValue()); // 10

history.execute(new MultiplyCommand(calc, 5));
console.log(calc.getValue()); // 50

history.execute(new SubtractCommand(calc, 15));
console.log(calc.getValue()); // 35

history.undo(); // Undo subtract 15
console.log(calc.getValue()); // 50

history.undo(); // Undo multiply 5
console.log(calc.getValue()); // 10

history.redo(); // Redo multiply 5
console.log(calc.getValue()); // 50

console.log(history.getHistory());
// → ["1. Add 10", "2. Multiply by 5"]
```

```
HAI CÁCH IMPLEMENT UNDO:
═══════════════════════════════════════════════════════════════

  ① REVERSE OPERATION:
  → Add 5? → Undo = Subtract 5!
  → TurnOn? → Undo = TurnOff!
  → ✅ TIẾT KIỆM memory!
  → ❌ Không phải lúc nào cũng reverse được!
  → ❌ Multiply 5 → Divide 5? Integer division LOSS!

  ② SNAPSHOT (Memento!):
  → LƯU state TRƯỚC khi execute!
  → Undo = KHÔI PHỤC state cũ!
  → ✅ LUÔN chính xác!
  → ❌ TỐN memory (lưu toàn bộ state!)

  → → Tùy trường hợp mà chọn!
  → → Add/Subtract: reverse OK!
  → → Multiply/Divide: snapshot an toàn hơn!
```

---

## §6. Text Editor — Copy/Cut/Paste/Undo

```javascript
// ═══ TEXT EDITOR — COMMAND PATTERN ═══

class Editor {
  constructor() {
    this.text = "";
    this.clipboard = "";
    this.selectionStart = 0;
    this.selectionEnd = 0;
  }

  getSelection() {
    return this.text.slice(this.selectionStart, this.selectionEnd);
  }

  deleteSelection() {
    this.text =
      this.text.slice(0, this.selectionStart) +
      this.text.slice(this.selectionEnd);
    this.selectionEnd = this.selectionStart;
  }

  replaceSelection(newText) {
    this.text =
      this.text.slice(0, this.selectionStart) +
      newText +
      this.text.slice(this.selectionEnd);
  }

  insertText(text) {
    this.text += text;
  }
}

// ═══ COMMAND BASE CLASS ═══

class EditorCommand {
  constructor(editor) {
    this.editor = editor;
    this.backup = "";
  }

  saveBackup() {
    this.backup = this.editor.text;
  }

  undo() {
    this.editor.text = this.backup;
  }

  // Subclass MUST override!
  // Return true = state changed (cần lưu history!)
  // Return false = state KHÔNG đổi (không lưu!)
  execute() {
    throw new Error("Must implement!");
  }
}

// ═══ CONCRETE COMMANDS ═══

class InsertCommand extends EditorCommand {
  constructor(editor, text) {
    super(editor);
    this.insertText = text;
  }

  execute() {
    this.saveBackup();
    this.editor.insertText(this.insertText);
    return true; // ← State changed!
  }
}

class CopyCommand extends EditorCommand {
  execute() {
    this.editor.clipboard = this.editor.getSelection();
    return false; // ← State KHÔNG đổi! Không cần undo!
  }
}

class CutCommand extends EditorCommand {
  execute() {
    this.saveBackup();
    this.editor.clipboard = this.editor.getSelection();
    this.editor.deleteSelection();
    return true; // ← State changed! Cần undo!
  }
}

class PasteCommand extends EditorCommand {
  execute() {
    this.saveBackup();
    this.editor.replaceSelection(this.editor.clipboard);
    return true;
  }
}

// ═══ APPLICATION — INVOKER ═══

class TextEditorApp {
  constructor() {
    this.editor = new Editor();
    this.history = [];
  }

  executeCommand(command) {
    const changed = command.execute();
    if (changed) {
      this.history.push(command); // Chỉ lưu nếu STATE ĐỔI!
    }
  }

  undo() {
    if (this.history.length === 0) return;
    const command = this.history.pop();
    command.undo();
  }
}

// ═══ SỬ DỤNG ═══

const app = new TextEditorApp();

app.executeCommand(new InsertCommand(app.editor, "Hello World"));
console.log(app.editor.text); // "Hello World"

// Select "World":
app.editor.selectionStart = 6;
app.editor.selectionEnd = 11;

// Copy (KHÔNG thay đổi state → KHÔNG lưu history!)
app.executeCommand(new CopyCommand(app.editor));
console.log(app.editor.clipboard); // "World"

// Cut (THAY ĐỔI state → LƯU history!)
app.executeCommand(new CutCommand(app.editor));
console.log(app.editor.text); // "Hello "

// Paste:
app.editor.selectionStart = 0;
app.editor.selectionEnd = 0;
app.executeCommand(new PasteCommand(app.editor));
console.log(app.editor.text); // "WorldHello "

// Undo paste:
app.undo();
console.log(app.editor.text); // "Hello "

// Undo cut:
app.undo();
console.log(app.editor.text); // "Hello World"
```

```
TEXT EDITOR — KEYBOARD SHORTCUTS ĐỀU DÙNG COMMAND!
═══════════════════════════════════════════════════════════════

  Ctrl+C → CopyCommand (execute = save selection to clipboard!)
  Ctrl+X → CutCommand (execute = copy + delete selection!)
  Ctrl+V → PasteCommand (execute = insert clipboard text!)
  Ctrl+Z → Undo (pop command from history, call undo()!)
  Ctrl+Y → Redo (pop from redo stack, call execute()!)

  → Button "Copy" = CÙNG CopyCommand!
  → Menu "Copy" = CÙNG CopyCommand!
  → Ctrl+C = CÙNG CopyCommand!
  → → 3 triggers, 1 Command! DRY!
```

---

## §7. Macro Commands — Composite

```javascript
// ═══ MACRO COMMAND — GỘP NHIỀU COMMANDS ═══

class MacroCommand {
  constructor(commands = []) {
    this.commands = commands;
    this.description = `Macro: ${commands.length} commands`;
  }

  add(command) {
    this.commands.push(command);
    return this; // ← Fluent API!
  }

  execute() {
    this.commands.forEach((cmd) => cmd.execute());
    return true;
  }

  undo() {
    // Undo NGƯỢC THỨ TỰ!
    [...this.commands].reverse().forEach((cmd) => cmd.undo());
  }
}

// ═══ SỬ DỤNG — PARTY MODE! ═══

const livingLight = new Light("Living Room");
const kitchenLight = new Light("Kitchen");
const bedroomLight = new Light("Bedroom");

// Macro: bật TẤT CẢ đèn!
const partyMode = new MacroCommand([
  new TurnOnCommand(livingLight),
  new TurnOnCommand(kitchenLight),
  new TurnOnCommand(bedroomLight),
]);

partyMode.execute();
// → "Living Room light is ON"
// → "Kitchen light is ON"
// → "Bedroom light is ON"

partyMode.undo();
// → "Bedroom light is OFF"  ← NGƯỢC!
// → "Kitchen light is OFF"
// → "Living Room light is OFF"
```

```javascript
// ═══ MACRO COMMAND — BATCH OPERATIONS ═══

class BatchCommand {
  constructor(name) {
    this.name = name;
    this.commands = [];
    this.executedCommands = []; // Track đã execute!
  }

  add(command) {
    this.commands.push(command);
    return this;
  }

  async execute() {
    this.executedCommands = [];

    for (const cmd of this.commands) {
      try {
        await cmd.execute();
        this.executedCommands.push(cmd); // Track thành công!
      } catch (error) {
        console.error(`Batch "${this.name}" failed at:`, error);
        // ROLLBACK tất cả đã thực thi!
        await this.undo();
        throw error; // Re-throw!
      }
    }
  }

  async undo() {
    // Chỉ undo những cái ĐÃ EXECUTE!
    const toUndo = [...this.executedCommands].reverse();
    for (const cmd of toUndo) {
      await cmd.undo();
    }
    this.executedCommands = [];
  }
}

// SỬ DỤNG — Batch user operations:
const batch = new BatchCommand("onboarding");
batch
  .add(new CreateUserCommand(userData))
  .add(new SendWelcomeEmailCommand(email))
  .add(new CreateDefaultSettingsCommand(userId))
  .add(new AssignRoleCommand(userId, "user"));

try {
  await batch.execute();
  console.log("Onboarding complete!");
} catch (error) {
  console.log("Onboarding failed, all changes rolled back!");
}
```

---

## §8. Command Queue — Deferred Execution

```javascript
// ═══ COMMAND QUEUE — THỰC THI SAU ═══

class CommandQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.history = [];
  }

  // Thêm command vào queue (CHƯA thực thi!):
  enqueue(command) {
    this.queue.push(command);
    console.log(`Queued: ${command.description || "command"}`);
  }

  // Xử lý TẤT CẢ commands trong queue:
  async processAll() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const command = this.queue.shift(); // FIFO!
      try {
        console.log(`Executing: ${command.description || "command"}`);
        await command.execute();
        this.history.push(command);
      } catch (error) {
        console.error("Command failed:", error);
        // Có thể retry hoặc skip!
      }
    }

    this.isProcessing = false;
  }

  // Xử lý 1 command (batch processing!):
  async processNext() {
    if (this.queue.length === 0) return null;
    const command = this.queue.shift();
    await command.execute();
    this.history.push(command);
    return command;
  }

  get size() {
    return this.queue.length;
  }
  get isEmpty() {
    return this.queue.length === 0;
  }
}
```

```javascript
// ═══ SCHEDULED COMMANDS — THỰC THI THEO HẸN GIỜ ═══

class ScheduledCommand {
  constructor(command, delay) {
    this.command = command;
    this.delay = delay;
    this.timerId = null;
    this.description = `Scheduled: ${command.description} in ${delay}ms`;
  }

  execute() {
    return new Promise((resolve) => {
      this.timerId = setTimeout(async () => {
        await this.command.execute();
        resolve();
      }, this.delay);
    });
  }

  cancel() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      console.log(`Cancelled: ${this.command.description}`);
    }
  }

  undo() {
    this.cancel();
    this.command.undo();
  }
}

// SỬ DỤNG:
const queue = new CommandQueue();

// Queue commands:
queue.enqueue(new SaveCommand(document)); // → Queued!
queue.enqueue(new NotifyCommand(users)); // → Queued!
queue.enqueue(
  new ScheduledCommand( // → Scheduled!
    new CleanupCommand(cache),
    5000, // → 5 giây sau!
  ),
);

// Process khi sẵn sàng:
await queue.processAll();
// → Execute SaveCommand
// → Execute NotifyCommand
// → Execute ScheduledCommand (5s delay!)
```

---

## §9. Transaction & Rollback

```javascript
// ═══ TRANSACTION — ALL OR NOTHING! ═══

class Transaction {
  constructor(name) {
    this.name = name;
    this.commands = [];
    this.executedCommands = [];
    this.state = "pending"; // pending | committed | rolledback
  }

  add(command) {
    if (this.state !== "pending") {
      throw new Error("Cannot add to committed/rolled back transaction!");
    }
    this.commands.push(command);
    return this;
  }

  async commit() {
    if (this.state !== "pending") {
      throw new Error(`Transaction already ${this.state}!`);
    }

    console.log(`[TX: ${this.name}] Committing...`);

    for (const cmd of this.commands) {
      try {
        await cmd.execute();
        this.executedCommands.push(cmd);
      } catch (error) {
        console.error(`[TX: ${this.name}] Failed! Rolling back...`);
        await this.rollback();
        throw error;
      }
    }

    this.state = "committed";
    console.log(`[TX: ${this.name}] Committed!`);
  }

  async rollback() {
    console.log(
      `[TX: ${this.name}] Rolling back ${this.executedCommands.length} commands...`,
    );

    // Undo NGƯỢC THỨ TỰ:
    const toRollback = [...this.executedCommands].reverse();
    for (const cmd of toRollback) {
      try {
        await cmd.undo();
      } catch (error) {
        console.error(
          `[TX: ${this.name}] Rollback failed for a command!`,
          error,
        );
      }
    }

    this.executedCommands = [];
    this.state = "rolledback";
    console.log(`[TX: ${this.name}] Rolled back!`);
  }
}

// ═══ SỬ DỤNG ═══

// Transfer money: TẤT CẢ phải thành công, hoặc rollback!
const transferTx = new Transaction("money-transfer");

transferTx
  .add(new DebitAccountCommand(accountA, 1000)) // ① Trừ tiền A
  .add(new CreditAccountCommand(accountB, 1000)) // ② Cộng tiền B
  .add(new SendNotificationCommand(accountA, "Sent $1000"))
  .add(new SendNotificationCommand(accountB, "Received $1000"))
  .add(new LogTransferCommand(accountA, accountB, 1000));

try {
  await transferTx.commit();
  // → Tất cả 5 commands thành công!
} catch (error) {
  // → Nếu bất kỳ command nào FAIL:
  // → TẤT CẢ đã execute sẽ được ROLLBACK!
  // → Tiền KHÔNG bị mất!
}
```

---

## §10. Command trong React

```javascript
// ═══ useCommandHistory HOOK ═══

import { useState, useCallback, useRef } from "react";

function useCommandHistory() {
  const [, forceUpdate] = useState(0);
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);

  const execute = useCallback((command) => {
    command.execute();
    undoStackRef.current.push(command);
    redoStackRef.current = []; // Clear redo!
    forceUpdate((n) => n + 1);
  }, []);

  const undo = useCallback(() => {
    const cmd = undoStackRef.current.pop();
    if (cmd) {
      cmd.undo();
      redoStackRef.current.push(cmd);
      forceUpdate((n) => n + 1);
    }
  }, []);

  const redo = useCallback(() => {
    const cmd = redoStackRef.current.pop();
    if (cmd) {
      cmd.execute();
      undoStackRef.current.push(cmd);
      forceUpdate((n) => n + 1);
    }
  }, []);

  return {
    execute,
    undo,
    redo,
    canUndo: undoStackRef.current.length > 0,
    canRedo: redoStackRef.current.length > 0,
    historyLength: undoStackRef.current.length,
  };
}
```

```javascript
// ═══ DRAWING APP — CANVAS + COMMAND ═══

// Commands:
class DrawCircleCommand {
  constructor(canvas, x, y, radius, color) {
    this.canvas = canvas;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.snapshot = null;
    this.description = `Circle at (${x}, ${y})`;
  }

  execute() {
    const ctx = this.canvas.getContext("2d");
    // Snapshot TRƯỚC khi vẽ:
    this.snapshot = ctx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height,
    );
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  undo() {
    if (this.snapshot) {
      const ctx = this.canvas.getContext("2d");
      ctx.putImageData(this.snapshot, 0, 0);
    }
  }
}

// React Component:
function DrawingApp() {
  const canvasRef = useRef(null);
  const { execute, undo, redo, canUndo, canRedo } = useCommandHistory();

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    execute(new DrawCircleCommand(canvasRef.current, x, y, 20, randomColor()));
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onClick={handleCanvasClick}
      />
      <div>
        <button onClick={undo} disabled={!canUndo}>
          Undo (Ctrl+Z)
        </button>
        <button onClick={redo} disabled={!canRedo}>
          Redo (Ctrl+Y)
        </button>
      </div>
    </div>
  );
}
```

---

## §11. So sánh Command vs Strategy vs Observer

```
COMMAND vs STRATEGY vs OBSERVER vs MEDIATOR:
═══════════════════════════════════════════════════════════════

  ┌───────────────┬────────────────────────────────────────────┐
  │ Command       │ ĐÓNG GÓI request thành object!             │
  │               │ → Undo/redo, queue, history, transaction! │
  │               │ → "Encapsulate a request!"                │
  │               │ → WHO does WHAT → stored as OBJECT!       │
  ├───────────────┼────────────────────────────────────────────┤
  │ Strategy      │ THAY ĐỔI algorithm tại runtime!            │
  │               │ → Cùng việc, KHÁC cách làm!              │
  │               │ → "Define a family of algorithms!"        │
  │               │ → HOW to do something → swappable!        │
  ├───────────────┼────────────────────────────────────────────┤
  │ Observer      │ NOTIFY nhiều objects khi state thay đổi!   │
  │               │ → Pub/Sub, event-driven!                  │
  │               │ → "Don't call us, we'll call you!"        │
  │               │ → ONE-to-MANY dependency!                  │
  ├───────────────┼────────────────────────────────────────────┤
  │ Mediator      │ TRUNG GIAN điều phối communication!         │
  │               │ → Many-to-one-to-many!                    │
  │               │ → Loose coupling giữa components!         │
  │               │ → "Don't talk to strangers, use mediator!"|
  └───────────────┴────────────────────────────────────────────┘

  CÙNG GIẢI QUYẾT COUPLING nhưng KHÁC MỤC ĐÍCH:

  Command:  sender ──→ [Command object] ──→ receiver
  Strategy: context ──→ [Strategy object] ──→ algorithm
  Observer: subject ──→ [notify] ──→ [observer1, observer2, ...]
  Mediator: obj1 ──→ [Mediator] ←── obj2
```

```
COMMAND vs MEMENTO:
═══════════════════════════════════════════════════════════════

  Command: HÀNH ĐỘNG để thay đổi state!
  → execute() → DO something!
  → undo() → REVERSE action!
  → Lưu action + receiver!

  Memento: SNAPSHOT của state!
  → save() → CAPTURE state!
  → restore() → KHÔI PHỤC state!
  → Lưu state data!

  → Thường DÙNG CÙNG nhau:
  → Command execute → Memento save state TRƯỚC!
  → Command undo → Memento restore state!
```

---

## §12. Real-World Applications

```javascript
// ═══ STOCK TRADING SYSTEM ═══

class StockTrade {
  buy(stock, amount) {
    console.log(`Bought ${amount} shares of ${stock}`);
  }
  sell(stock, amount) {
    console.log(`Sold ${amount} shares of ${stock}`);
  }
}

class BuyStockCommand {
  constructor(stockTrade, stock, amount) {
    this.stockTrade = stockTrade;
    this.stock = stock;
    this.amount = amount;
    this.description = `Buy ${amount} ${stock}`;
  }

  execute() {
    this.stockTrade.buy(this.stock, this.amount);
  }
  undo() {
    this.stockTrade.sell(this.stock, this.amount);
  }
}

class SellStockCommand {
  constructor(stockTrade, stock, amount) {
    this.stockTrade = stockTrade;
    this.stock = stock;
    this.amount = amount;
    this.description = `Sell ${amount} ${stock}`;
  }

  execute() {
    this.stockTrade.sell(this.stock, this.amount);
  }
  undo() {
    this.stockTrade.buy(this.stock, this.amount);
  }
}

// Agent (Invoker!):
class Agent {
  constructor() {
    this.orders = [];
  }

  placeOrder(order) {
    this.orders.push(order);
    order.execute();
  }

  listOrders() {
    return this.orders.map((o) => o.description).join("\n");
  }
}

const trade = new StockTrade();
const agent = new Agent();

agent.placeOrder(new BuyStockCommand(trade, "AAPL", 100));
agent.placeOrder(new SellStockCommand(trade, "GOOGL", 50));

console.log(agent.listOrders());
// → "Buy 100 AAPL"
// → "Sell 50 GOOGL"
```

```javascript
// ═══ FORM WIZARD — MULTI-STEP UNDO ═══

class FormWizard {
  constructor() {
    this.data = {};
    this.history = new CommandHistory();
  }

  execute(command) {
    this.history.execute(command);
  }

  undo() {
    this.history.undo();
  }

  getData() {
    return { ...this.data };
  }
}

class SetFieldCommand {
  constructor(wizard, field, value) {
    this.wizard = wizard;
    this.field = field;
    this.newValue = value;
    this.oldValue = wizard.data[field];
    this.description = `Set ${field} = "${value}"`;
  }

  execute() {
    this.wizard.data[this.field] = this.newValue;
  }

  undo() {
    if (this.oldValue === undefined) {
      delete this.wizard.data[this.field];
    } else {
      this.wizard.data[this.field] = this.oldValue;
    }
  }
}

// SỬ DỤNG:
const wizard = new FormWizard();

wizard.execute(new SetFieldCommand(wizard, "name", "John"));
wizard.execute(new SetFieldCommand(wizard, "email", "john@x.com"));
wizard.execute(new SetFieldCommand(wizard, "role", "admin"));

console.log(wizard.getData());
// → { name: "John", email: "john@x.com", role: "admin" }

wizard.undo(); // Undo role
console.log(wizard.getData());
// → { name: "John", email: "john@x.com" }

wizard.undo(); // Undo email
console.log(wizard.getData());
// → { name: "John" }
```

```javascript
// ═══ KEYBOARD SHORTCUT MANAGER — COMMAND ═══

class ShortcutManager {
  constructor() {
    this.shortcuts = new Map();
    this._setupListener();
  }

  register(key, command) {
    this.shortcuts.set(key, command);
  }

  unregister(key) {
    this.shortcuts.delete(key);
  }

  _setupListener() {
    document.addEventListener("keydown", (e) => {
      const key = this._getKey(e);
      const command = this.shortcuts.get(key);
      if (command) {
        e.preventDefault();
        command.execute();
      }
    });
  }

  _getKey(e) {
    const parts = [];
    if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
    if (e.shiftKey) parts.push("Shift");
    if (e.altKey) parts.push("Alt");
    parts.push(e.key.toUpperCase());
    return parts.join("+");
  }
}

// SỬ DỤNG:
const shortcuts = new ShortcutManager();

shortcuts.register("Ctrl+S", {
  execute: () => saveDocument(),
  description: "Save Document",
});

shortcuts.register("Ctrl+Z", {
  execute: () => history.undo(),
  description: "Undo",
});

shortcuts.register("Ctrl+Shift+Z", {
  execute: () => history.redo(),
  description: "Redo",
});

// → Button "Save" = CÙNG command với Ctrl+S!
// → Menu "Undo" = CÙNG command với Ctrl+Z!
// → DECOUPLED: trigger !== action!
```

---

## §13. Tradeoffs — Ưu & Nhược điểm

```
ƯU ĐIỂM:
═══════════════════════════════════════════════════════════════

  ✅ SINGLE RESPONSIBILITY PRINCIPLE:
  → Tách NGƯỜI GỌI khỏi NGƯỜI THỰC HIỆN!
  → Invoker không biết receiver!
  → Receiver không biết invoker!

  ✅ OPEN/CLOSED PRINCIPLE:
  → Thêm command MỚI = class MỚI!
  → KHÔNG SỬA code cũ!

  ✅ UNDO/REDO:
  → Lưu history → undo bất kỳ lúc nào!
  → Dùng reverse operation hoặc snapshot!

  ✅ DEFERRED EXECUTION:
  → Queue commands → thực thi SAU!
  → Schedule, delay, batch processing!

  ✅ MACRO COMMANDS:
  → Gộp nhiều commands = 1 operation!
  → Composite pattern!

  ✅ TRANSACTION:
  → All or nothing!
  → Fail → rollback tất cả!

  ✅ LOGGING:
  → Ghi lại MỌI thao tác!
  → Debug, audit trail!
```

```
NHƯỢC ĐIỂM:
═══════════════════════════════════════════════════════════════

  ❌ COMPLEXITY — BOILERPLATE:
  → Mỗi action = 1 class!
  → 10 actions = 10 command classes!
  → Code NHIỀU HƠN đáng kể!

  ❌ OVER-ENGINEERING:
  → Simple operations → Command = OVERKILL!
  → Không cần undo? Không cần queue?
  → → Gọi method TRỰC TIẾP cho nhanh!

  ❌ MEMORY:
  → Lưu history = TỐN memory!
  → Snapshot approach = TỐN THÊM!
  → Cần giới hạn history size!
```

```
KHI NÀO DÙNG:
═══════════════════════════════════════════════════════════════

  ✅ NÊN DÙNG:
  → Cần UNDO/REDO (text editor, drawing app!)
  → Cần QUEUE commands (job queue, task scheduler!)
  → Cần TRANSACTION (banking, e-commerce!)
  → Cần LOG mọi thao tác (audit trail!)
  → Cần MACRO (batch operations!)
  → Cần DECOUPLE sender/receiver!
  → Keyboard shortcuts, toolbar buttons, menu items!

  ❌ KHÔNG NÊN DÙNG:
  → Simple CRUD operations!
  → Không cần undo, không cần queue!
  → Ít operations → overkill!
  → "Sometimes a function is all you need!" — John Carmack!
```

---

## §14. Tóm tắt

```
COMMAND PATTERN — TRẢ LỜI PHỎNG VẤN:
═══════════════════════════════════════════════════════════════

  Q: "Command Pattern là gì?"
  A: Đóng gói REQUEST thành OBJECT chứa tất cả info
  (receiver, method, params)! Cho phép: undo/redo,
  queue, log, transaction! Tách sender khỏi receiver!

  Q: "4 thành phần?"
  A: Client (tạo commands!), Invoker (gọi execute!),
  Command (object đóng gói request!),
  Receiver (thực hiện business logic!)

  Q: "Undo 2 cách?"
  A: ① Reverse Operation: Add → Subtract! Nhẹ nhưng
  không phải lúc nào reverse được (multiply/divide!)
  ② Snapshot (Memento): lưu state trước execute!
  Luôn chính xác nhưng tốn memory!

  Q: "Macro Command?"
  A: Gộp nhiều commands thành 1! Execute TẤT CẢ!
  Undo NGƯỢC THỨ TỰ! Composite pattern!

  Q: "Command vs Strategy?"
  A: Command = ĐÓNG GÓI request (WHO does WHAT!)
  Strategy = THAY ĐỔI algorithm (HOW to do!)
  Command có undo/history; Strategy không!

  Q: "Real-world examples?"
  A: Text editor (Ctrl+Z undo!), drawing apps,
  database transactions (commit/rollback!),
  keyboard shortcuts, job queues, form wizards!
```

---

### Checklist

- [ ] **Command concept**: đóng gói request thành OBJECT; chứa receiver + method + params; decouple sender/receiver!
- [ ] **4 components**: Client (tạo!), Invoker (gọi!), Command (đóng gói!), Receiver (thực hiện!)
- [ ] **OrderManager**: 1 method execute(command); KHÔNG gọi trực tiếp placeOrder/cancelOrder!
- [ ] **Command interface**: execute() + undo(); concrete commands implement cả hai!
- [ ] **Undo/Redo**: undoStack + redoStack; execute → push undo + clear redo; undo → pop undo + push redo!
- [ ] **Snapshot vs Reverse**: Reverse = nhẹ nhưng không luôn đúng; Snapshot = tốn memory nhưng chính xác!
- [ ] **Text Editor**: Copy (không lưu history!), Cut/Paste (lưu history!), Ctrl+Z = undo!
- [ ] **Macro Command**: gộp nhiều commands; execute tất cả; undo NGƯỢC thứ tự!
- [ ] **Command Queue**: enqueue → processAll; deferred/scheduled execution!
- [ ] **Transaction**: all or nothing; fail → rollback tất cả đã execute (ngược thứ tự!)
- [ ] **React useCommandHistory**: execute/undo/redo hooks; drawing app, form wizard!
- [ ] **Command vs Strategy**: Command = WHO+WHAT (undo!); Strategy = HOW (swappable algorithm!)
- [ ] **Tradeoffs**: Ưu (SRP, OCP, undo, queue, macro, transaction!) vs Nhược (boilerplate, memory, over-engineering!)

---

_Nguồn: patterns.dev — Command Pattern, Refactoring Guru, SourceMaking, Carlos Caballero_
_Cập nhật lần cuối: Tháng 2, 2026_
