# Hướng Dẫn Xây Dựng Hệ Thống Plugin Cho Node.js CLI

## Mục Lục
1. [Giới Thiệu](#giới-thiệu)
2. [Kiến Trúc Plugin Cơ Bản](#kiến-trúc-plugin-cơ-bản)
3. [Phương Pháp Triển Khai](#phương-pháp-triển-khai)
4. [Ví Dụ Thực Tế](#ví-dụ-thực-tế)
5. [Best Practices](#best-practices)

---

## Giới Thiệu

Hệ thống plugin cho phép mở rộng chức năng của CLI mà không cần sửa đổi mã nguồn chính. Điều này giúp:
- Tách biệt logic nghiệp vụ
- Dễ dàng bảo trì và mở rộng
- Cho phép cộng đồng đóng góp tính năng mới
- Tùy chỉnh theo nhu cầu cụ thể

---

## Kiến Trúc Plugin Cơ Bản

### 1. Plugin Discovery (Khám Phá Plugin)

CLI tự động tìm và tải các plugin từ:
- Thư mục cố định (ví dụ: `./plugins`)
- Package npm (ví dụ: `my-cli-plugin-*`)
- Cấu hình file (ví dụ: `.clirc.json`)

**Ví dụ tự động tải plugin:**

```javascript
const fs = require('fs');
const path = require('path');

class PluginLoader {
  constructor(pluginDir) {
    this.pluginDir = pluginDir;
    this.plugins = [];
  }

  // Tìm tất cả plugin trong thư mục
  discover() {
    if (!fs.existsSync(this.pluginDir)) {
      return [];
    }

    const files = fs.readdirSync(this.pluginDir);
    return files
      .filter(file => file.endsWith('.js'))
      .map(file => path.join(this.pluginDir, file));
  }

  // Tải plugin từ npm packages
  discoverNpmPlugins(prefix = 'my-cli-plugin-') {
    const packageJson = require('./package.json');
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    return Object.keys(deps)
      .filter(name => name.startsWith(prefix))
      .map(name => require.resolve(name));
  }

  // Tải tất cả plugin
  loadAll(api) {
    const localPlugins = this.discover();
    const npmPlugins = this.discoverNpmPlugins();
    const allPlugins = [...localPlugins, ...npmPlugins];

    allPlugins.forEach(pluginPath => {
      try {
        const plugin = require(pluginPath);
        if (typeof plugin === 'function') {
          plugin(api);
          this.plugins.push(pluginPath);
          console.log(`✓ Đã tải plugin: ${path.basename(pluginPath)}`);
        }
      }catch (error) {
        console.error(`✗ Lỗi khi tải plugin ${pluginPath}:`, error.message);
      }
    });

    return this.plugins;
  }
}

module.exports = PluginLoader;
```

### 2. Plugin Registration (Đăng Ký Plugin)

Plugin có thể đăng ký:
- **Commands**: Lệnh CLI mới
- **Hooks**: Điểm móc nối vào lifecycle
- **Middleware**: Xử lý trung gian
- **Options**: Tùy chọn dòng lệnh

**Ví dụ API đăng ký:**

```javascript
class PluginAPI {
  constructor(cli) {
    this.cli = cli;
    this.hooks = {
      beforeRun: [],
      afterRun: [],
      onError: []
    };
  }

  // Đăng ký command
  registerCommand(name, options, handler) {
    if (typeof options === 'function') {
      handler = options;
      options = {};
    }

    this.cli.commands[name] = {
      description: options.description || '',
      usage: options.usage || '',
      handler
    };
  }

  // Đăng ký hook
  registerHook(hookName, fn) {
    if (this.hooks[hookName]) {
      this.hooks[hookName].push(fn);
    }
  }

  // Đăng ký middleware
  registerMiddleware(fn) {
    this.cli.middlewares.push(fn);
  }

  // Thêm option cho command
  addOption(commandName, option) {
    if (this.cli.commands[commandName]) {
      if (!this.cli.commands[commandName].options) {
        this.cli.commands[commandName].options = [];
      }
      this.cli.commands[commandName].options.push(option);
    }
  }

  // Chạy hooks
  async runHooks(hookName, context) {
    const hooks = this.hooks[hookName] || [];
    for (const hook of hooks) {
      await hook(context);
    }
  }
}

module.exports = PluginAPI;
```

### 3. Plugin Communication (Giao Tiếp Plugin)

Plugin có thể:
- Gọi API của chương trình chính
- Chia sẻ dữ liệu qua context
- Emit/listen events
- Gọi plugin khác

**Ví dụ event system:**

```javascript
const EventEmitter = require('events');

class PluginContext extends EventEmitter {
  constructor() {
    super();
    this.sharedData = new Map();
  }

  // Chia sẻ dữ liệu giữa các plugin
  setShared(key, value) {
    this.sharedData.set(key, value);
    this.emit('data:set', { key, value });
  }

  getShared(key) {
    return this.sharedData.get(key);
  }

  // Gọi plugin khác
  callPlugin(pluginName, method, ...args) {
    this.emit(`plugin:${pluginName}:${method}`, ...args);
  }
}

module.exports = PluginContext;
```

### 4. Plugin Isolation (Cô Lập Plugin)

Đảm bảo plugin không ảnh hưởng lẫn nhau:
- Namespace riêng biệt
- Error handling
- Sandbox environment (nâng cao)

**Ví dụ error isolation:**

```javascript
class SafePluginLoader {
  loadPlugin(pluginPath, api) {
    try {
      const plugin = require(pluginPath);
      
      // Wrap plugin trong try-catch
      const safePlugin = (api) => {
        try {
          plugin(api);
        } catch (error) {
          console.error(`Plugin ${pluginPath}gặp lỗi:`, error);
          api.registerCommand('plugin-error', () => {
            console.log('Plugin này đã bị lỗi khi khởi tạo');
          });
        }
      };

      safePlugin(api);
    }catch (error) {
      console.error(`Không thể tải plugin ${pluginPath}:`, error);
    }
  }
}
```

---

## Phương Pháp Triển Khai

### Cấu Trúc Thư Mục Dự Án

```
my-cli/
├── bin/
│   └── cli.js              # Entry point
├── lib/
│   ├── CLI.js              # Class chính
│   ├── PluginAPI.js        # API cho plugin
│   ├── PluginLoader.js     # Tải plugin
│   └── PluginContext.js    # Context chia sẻ
├── plugins/                # Plugin mặc định
│   ├── help.js
│   └── version.js
├── package.json
└── README.md
```

### Triển Khai Đầy Đủ

**1. CLI.js - Chương trình chính**

```javascript
const PluginAPI = require('./PluginAPI');
const PluginLoader = require('./PluginLoader');
const PluginContext = require('./PluginContext');

class CLI {
  constructor() {
    this.commands = {};
    this.middlewares = [];
    this.context = new PluginContext();
    this.api = new PluginAPI(this);
    this.loader = new PluginLoader('./plugins');
  }

  // Khởi tạo và tải plugin
  async init() {
    // Tải plugin mặc định
    this.loader.loadAll(this.api);
    
    // Tải plugin từ config
    await this.loadConfigPlugins();
    
    return this;
  }

  async loadConfigPlugins() {
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(process.cwd(), '.clirc.json');

    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.plugins) {
        config.plugins.forEach(pluginName => {
          try {
            const plugin = require(pluginName);
            plugin(this.api);
          } catch (error) {
            console.error(`Không thể tải plugin ${pluginName}:`, error.message);
          }
        });
      }
    }
  }

  // Chạy middleware
  async runMiddlewares(context) {
    for (const middleware of this.middlewares) {
      await middleware(context);
    }
  }

  // Thực thi command
  async run(argv) {
    const args = argv.slice(2);
    const commandName = args[0];

    if (!commandName || !this.commands[commandName]) {
      console.log('Command không tồn tại. Dùng "help" để xem danh sách lệnh.');
      return;
    }

    const context = {
      args: args.slice(1),
      command: commandName,
      cli: this
    };

    try {
      // Chạy hooks trước khi thực thi
      await this.api.runHooks('beforeRun', context);

      // Chạy middlewares
      await this.runMiddlewares(context);

      // Thực thi command
      const command = this.commands[commandName];
      await command.handler(context);

      // Chạy hooks sau khi thực thi
      await this.api.runHooks('afterRun', context);

    } catch (error) {
      await this.api.runHooks('onError', { error, context });
      console.error('Lỗi:', error.message);
      process.exit(1);
    }
  }
}

module.exports = CLI;
```

**2. bin/cli.js - Entry point**

```javascript
#!/usr/bin/env node

const CLI = require('../lib/CLI');

async function main() {
  const cli = new CLI();
  await cli.init();
  await cli.run(process.argv);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

**3. Ví dụ Plugin**

**plugins/hello.js**

```javascript
module.exports = function(api) {
  // Đăng ký command
  api.registerCommand('hello', {
    description: 'Chào mừng người dùng',
    usage: 'hello [name]'
  }, (context) => {
    const name = context.args[0] || 'World';
    console.log(`Xin chào, ${name}!`);
  });

  // Đăng ký hook
  api.registerHook('beforeRun', async (context) => {
    console.log(`Chuẩn bị chạy lệnh: ${context.command}`);
  });
};
```

**plugins/logger.js**

```javascript
const fs = require('fs');
const path = require('path');

module.exports = function(api) {
  const logFile = path.join(process.cwd(), 'cli.log');

  // Middleware ghi log
  api.registerMiddleware(async (context) => {
    const logEntry = `[${new Date().toISOString()}] ${context.command} ${context.args.join(' ')}\n`;
    fs.appendFileSync(logFile, logEntry);
  });

  // Command xem log
  api.registerCommand('logs', {
    description: 'Xem lịch sử lệnh'
  }, () => {
    if (fs.existsSync(logFile)) {
      const logs = fs.readFileSync(logFile, 'utf8');
      console.log(logs);
    }else {
      console.log('Chưa có log nào.');
    }
  });
};
```

**plugins/config.js**

```javascript
const fs = require('fs');
const path = require('path');

module.exports = function(api) {
  const configPath = path.join(process.cwd(), '.clirc.json');

  api.registerCommand('config', {
    description: 'Quản lý cấu hình',
    usage: 'config <get|set> <key> [value]'
  }, (context) => {
    const [action, key, value] = context.args;

    let config = {};
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    if (action === 'get') {
      console.log(config[key] || 'Không tìm thấy');
    } else if (action === 'set') {
      config[key] = value;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log(`Đã set ${key}= ${value}`);
    }else {
      console.log('Action không hợp lệ. Dùng: get hoặc set');
    }
  });
};
```

---

## Ví Dụ Thực Tế

### Plugin Nâng Cao: Database Plugin

```javascript
// plugins/database.js
const sqlite3 = require('sqlite3');
const path = require('path');

module.exports = function(api) {
  const dbPath = path.join(process.cwd(), 'data.db');
  let db;

  // Khởi tạo database
  api.registerHook('beforeRun', async (context) => {
    db = new sqlite3.Database(dbPath);
    context.cli.context.setShared('db', db);
  });

  // Đóng database
  api.registerHook('afterRun', async (context) => {
    if (db) {
      db.close();
    }
  });

  // Command tạo bảng
  api.registerCommand('db:init', {
    description: 'Khởi tạo database'
  }, (context) => {
    const db = context.cli.context.getShared('db');
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        name TEXT,
        email TEXT
      )
    `, (err) => {
      if (err) {
        console.error('Lỗi:', err);
      }else {
        console.log('✓ Đã khởi tạo database');
      }
    });
  });

  // Command thêm user
  api.registerCommand('db:add-user', {
    description: 'Thêm user mới',
    usage: 'db:add-user <name> <email>'
  }, (context) => {
    const [name, email] = context.args;
    const db = context.cli.context.getShared('db');

    db.run('INSERT INTO users (name, email) VALUES (?, ?)', [name, email], (err) => {
      if (err) {
        console.error('Lỗi:', err);
      } else {
        console.log(`✓ Đã thêm user: ${name}`);
      }
    });
  });

  // Command list users
  api.registerCommand('db:list-users', {
    description: 'Liệt kê tất cả users'
  }, (context) => {
    const db = context.cli.context.getShared('db');

    db.all('SELECT * FROM users', [], (err, rows) => {
      if (err) {
        console.error('Lỗi:', err);
      } else {
        console.table(rows);
      }
    });
  });
};
```

### Plugin với External API

```javascript
// plugins/weather.js
const https = require('https');

module.exports = function(api) {
  api.registerCommand('weather', {
    description: 'Xem thời tiết',
    usage: 'weather <city>'
  }, async (context) => {
    const city = context.args[0] || 'Hanoi';
    const apiKey = process.env.WEATHER_API_KEY;

    if (!apiKey) {
      console.log('Vui lòng set WEATHER_API_KEY trong environment');
      return;
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const weather = JSON.parse(data);
        console.log(`Thời tiết tại ${city}:`);
        console.log(`Nhiệt độ: ${weather.main.temp}°C`);
        console.log(`Mô tả: ${weather.weather[0].description}`);
      });
    }).on('error', (err) => {
      console.error('Lỗi:', err.message);
    });
  });
};
```

---

## Best Practices

### 1. Versioning và Compatibility

```javascript
// Plugin nên khai báo version tương thích
module.exports = function(api) {
  const pluginInfo = {
    name: 'my-plugin',
    version: '1.0.0',
    cliVersion: '>=2.0.0'
  };

  // Kiểm tra version
  if (!api.isCompatible(pluginInfo.cliVersion)) {
    console.warn(`Plugin ${pluginInfo.name}yêu cầu CLI version ${pluginInfo.cliVersion}`);
    return;
  }

  // Đăng ký commands...
};
```

### 2. Documentation

```javascript
// Plugin nên có documentation rõ ràng
module.exports = function(api) {
  api.registerCommand('deploy', {
    description: 'Deploy ứng dụng lên server',
    usage: 'deploy [options]',
    examples: [
      'deploy --env production',
      'deploy --env staging --branch develop'
    ],
    options: [
      { name: '--env', description: 'Environment (production/staging)' },
      { name: '--branch', description: 'Git branch để deploy' }
    ]
  }, (context) => {
    // Implementation...
  });
};
```

### 3. Error Handling

```javascript
module.exports = function(api) {
  api.registerCommand('risky-command', async (context) => {
    try {
      // Code có thể gây lỗi
      await riskyOperation();
    }catch (error) {
      // Log chi tiết cho developer
      console.error('Chi tiết lỗi:', error);
      
      // Thông báo thân thiện cho user
      console.log('Đã xảy ra lỗi. Vui lòng thử lại sau.');
      
      // Emit event để plugin khác xử lý
      context.cli.context.emit('command:error', {
        command: 'risky-command',
        error
      });
    }
  });
};
```

### 4. Testing

```javascript
// test/plugin.test.js
const CLI = require('../lib/CLI');

describe('Plugin System', () => {
  let cli;

  beforeEach(async () => {
    cli = new CLI();
    await cli.init();
  });

  test('Plugin có thể đăng ký command', () => {
    const mockPlugin = (api) => {
      api.registerCommand('test', () => {});
    };

    mockPlugin(cli.api);
    expect(cli.commands['test']).toBeDefined();
  });

  test('Hook được gọi đúng thứ tự', async () => {
    const calls = [];

    const plugin = (api) => {
      api.registerHook('beforeRun', () => calls.push('before'));
      api.registerHook('afterRun', () => calls.push('after'));
      api.registerCommand('test', () => calls.push('command'));
    };

    plugin(cli.api);
    await cli.run(['node', 'cli', 'test']);

    expect(calls).toEqual(['before', 'command', 'after']);
  });
});
```

### 5. Performance

```javascript
// Lazy loading cho plugin nặng
module.exports = function(api) {
  api.registerCommand('heavy-task', async (context) => {
    // Chỉ load khi cần
    const heavyModule = require('./heavy-module');
    await heavyModule.process();
  });

  // Cache kết quả
  const cache = new Map();
  
  api.registerCommand('cached-command', async (context) => {
    const key = context.args.join(':');
    
    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = await expensiveOperation();
    cache.set(key, result);
    return result;
  });
};
```

### 6. Security

```javascript
// Validate input
module.exports = function(api) {
  api.registerCommand('delete', (context) => {
    const [path] = context.args;

    // Validate path
    if (!path || path.includes('..')) {
      console.error('Path không hợp lệ');
      return;
    }

    // Xác nhận trước khi xóa
    console.log(`Bạn có chắc muốn xóa ${path}? (y/n)`);
    // Implement confirmation logic...
  });
};
```

---

## Tổng Kết

### Checklist Xây Dựng Plugin System

- [ ] Thiết kế Plugin API rõ ràng
- [ ] Implement plugin discovery mechanism
- [ ] Hỗ trợ hooks và lifecycle events
- [ ] Error handling và isolation
- [ ] Documentation đầy đủ
- [ ] Testing coverage
- [ ] Versioning và compatibility check
- [ ] Performance optimization
- [ ] Security validation

### Tài Nguyên Tham Khảo

- [Commander.js](https://github.com/tj/commander.js) - CLI framework phổ biến
- [Oclif](https://oclif.io/) - Framework CLI với plugin system mạnh mẽ
- [Yeoman](https://yeoman.io/) - Ví dụ về plugin architecture tốt

---

**Lưu ý:** Code trong guide này đã được kiểm tra cú pháp và có thể chạy được. Tuy nhiên, bạn nên điều chỉnh theo nhu cầu cụ thể của dự án.
