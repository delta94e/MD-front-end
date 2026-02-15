# Frontend Infrastructure & Vite & Mini-Program — Deep Dive

> 📅 2026-02-14 · ⏱ 18 phút đọc
>
> Frontend Infrastructure (Tech Selection, CI/CD, Testing, Scaffolding),
> Vite Principles (ESM, esbuild, Rollup), Vite vs Webpack,
> Vite HMR, Monitoring & Alarm System, Business Metrics,
> Mini-Program Performance Optimization (setData, JSBridge)
> Độ khó: ⭐️⭐️⭐️⭐️ | Senior Frontend Interview

---

## Mục Lục

| #   | Phần                                                |
| --- | --------------------------------------------------- |
| 1   | Frontend Infrastructure — Tổng quan                 |
| 2   | Giai đoạn Phát triển — Tech Selection & Scaffolding |
| 3   | Giai đoạn Deploy — CI/CD Pipeline                   |
| 4   | Đảm bảo Chất lượng — Testing & Config               |
| 5   | Nâng cao Hiệu suất — Templates & Components         |
| 6   | Vite — Nguyên lý hoạt động                          |
| 7   | Vite vs Webpack — So sánh                           |
| 8   | Vite HMR — Hot Module Replacement                   |
| 9   | Hệ thống Monitoring & Alarm                         |
| 10  | Business Metrics — Theo dõi chỉ số kinh doanh       |
| 11  | Mini-Program — Tối ưu hiệu năng                     |
| 12  | Tóm tắt phỏng vấn                                   |

---

## §1. Frontend Infrastructure — Tổng quan

```
FRONTEND INFRASTRUCTURE — 4 TRỤ CỘT:
═══════════════════════════════════════════════════════════════

  Frontend Lead làm gì về hạ tầng?

  ┌─────────────────────────────────────────────────────────┐
  │ ① PHÁT TRIỂN (Development):                             │
  │ → Tech selection (chọn công nghệ!)                      │
  │ → Project creation (khởi tạo dự án!)                    │
  │ → Template creation (tạo template!)                     │
  │ → Scaffolding tools (công cụ scaffold!)                 │
  ├─────────────────────────────────────────────────────────┤
  │ ② TRIỂN KHAI (Deployment):                              │
  │ → CI/CD automation (tự động hóa!)                       │
  │ → Deploy lên server!                                    │
  │ → Environment management (dev/staging/prod!)             │
  ├─────────────────────────────────────────────────────────┤
  │ ③ CHẤT LƯỢNG (Quality):                                 │
  │ → Automated testing framework!                          │
  │ → Project config chuẩn hóa!                             │
  │ → Consistent infrastructure ACROSS ALL projects!        │
  ├─────────────────────────────────────────────────────────┤
  │ ④ HIỆU SUẤT (Efficiency):                               │
  │ → Zero-config project startup & deploy!                  │
  │ → Templates + Components + Schema!                      │
  │ → Hạ thấp barrier → tăng productivity!                  │
  └─────────────────────────────────────────────────────────┘

  MỤC TIÊU CHUNG:
  → CHUẨN HÓA: tất cả projects chạy cùng hạ tầng!
  → TỰ ĐỘNG HÓA: giảm manual work!
  → NHANH HƠN: zero-config, templates, scaffolding!
  → ỔN ĐỊNH: testing, monitoring, CI/CD!
```

---

## §2. Giai đoạn Phát triển — Tech Selection & Scaffolding

```
TECH SELECTION — CHỌN CÔNG NGHỆ:
═══════════════════════════════════════════════════════════════

  TIÊU CHÍ CHỌN:
  ┌────────────────────────────────────────────────────────┐
  │ ① Team expertise: team giỏi React/Vue → dùng đó!      │
  │ ② Ecosystem: npm packages, community, docs!            │
  │ ③ Performance: bundle size, render speed!               │
  │ ④ Scalability: project lớn dần → có scale được?        │
  │ ⑤ Hiring: tìm developer dễ không?                     │
  │ ⑥ Maintenance: long-term support, update frequency!    │
  └────────────────────────────────────────────────────────┘

  STACK PHỔ BIẾN 2024-2026:
  → Framework: React (Next.js) / Vue (Nuxt) / Svelte
  → Build tool: Vite (CHÍNH!) / Webpack (legacy)
  → Language: TypeScript (BẮT BUỘC!)
  → Styling: Tailwind CSS / CSS Modules / Styled Components
  → State: Zustand / Jotai / Redux Toolkit / Pinia
  → Testing: Vitest / Jest / Playwright / Cypress
  → Lint: ESLint + Prettier + Husky + lint-staged
```

```
SCAFFOLDING TOOLS — CÔNG CỤ SCAFFOLD:
═══════════════════════════════════════════════════════════════

  Scaffold = KHUNG DỰ ÁN có sẵn config, structure, tools!
  → Developer tạo project MỚI trong PHÚT!
  → Không cần config webpack/vite/eslint/tsconfig từ đầu!
```

```javascript
// ═══ TỰ TẠO CLI SCAFFOLDING ═══

// my-cli/bin/index.js
#!/usr/bin/env node

const { program } = require('commander');
const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');

program
    .command('create <project-name>')
    .description('Tạo project mới')
    .action(async (projectName) => {
        // ① Hỏi developer chọn template:
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'template',
                message: 'Chọn template:',
                choices: [
                    'react-vite-ts',
                    'vue-vite-ts',
                    'react-nextjs',
                    'mini-program',
                ],
            },
            {
                type: 'confirm',
                name: 'eslint',
                message: 'Thêm ESLint + Prettier?',
                default: true,
            },
            {
                type: 'confirm',
                name: 'husky',
                message: 'Thêm Husky + lint-staged?',
                default: true,
            },
        ]);

        // ② Copy template:
        const templateDir = path.join(__dirname, '../templates', answers.template);
        const targetDir = path.resolve(projectName);

        await fs.copy(templateDir, targetDir);

        // ③ Update package.json:
        const pkgPath = path.join(targetDir, 'package.json');
        const pkg = await fs.readJson(pkgPath);
        pkg.name = projectName;
        await fs.writeJson(pkgPath, pkg, { spaces: 2 });

        // ④ Install dependencies:
        console.log(chalk.green('📦 Installing dependencies...'));
        execSync('npm install', { cwd: targetDir, stdio: 'inherit' });

        // ⑤ Init git:
        execSync('git init', { cwd: targetDir });

        console.log(chalk.green(`✅ Project ${projectName} created!`));
        console.log(chalk.cyan(`cd ${projectName} && npm run dev`));
    });

program.parse();

// SỬ DỤNG:
// npx my-company-cli create my-new-app
// → Chọn template → auto install → sẵn sàng code!
```

```
TEMPLATE STRUCTURE:
═══════════════════════════════════════════════════════════════

  templates/react-vite-ts/
  ├── public/
  ├── src/
  │   ├── components/      ← Shared components!
  │   ├── hooks/           ← Custom hooks!
  │   ├── pages/           ← Route pages!
  │   ├── services/        ← API layer!
  │   ├── stores/          ← State management!
  │   ├── utils/           ← Utilities!
  │   ├── types/           ← TypeScript types!
  │   ├── App.tsx
  │   └── main.tsx
  ├── .eslintrc.cjs        ← Chuẩn hóa lint rules!
  ├── .prettierrc          ← Chuẩn hóa format!
  ├── tsconfig.json        ← TS config chuẩn!
  ├── vite.config.ts       ← Vite config chuẩn!
  ├── package.json
  └── README.md

  → TẤT CẢ projects trong team dùng CÙNG structure!
  → Config THỐNG NHẤT → chuyển project dễ dàng!
```

---

## §3. Giai đoạn Deploy — CI/CD Pipeline

```
CI/CD PIPELINE:
═══════════════════════════════════════════════════════════════

  CI = Continuous Integration (Tích hợp liên tục!)
  CD = Continuous Deployment (Triển khai liên tục!)

  FLOW:
  ┌─────────┐  push   ┌──────────┐  pass   ┌──────────┐
  │  Code   │ ───────→│   CI     │ ──────→│   CD     │
  │ (Git)   │         │ Pipeline │        │ Pipeline │
  └─────────┘         └──────────┘        └──────────┘
       │                    │                    │
       │              ┌─────┴─────┐        ┌────┴────┐
       │              │ • Lint    │        │ • Build │
       │              │ • Test   │        │ • Deploy│
       │              │ • Type   │        │ • Notify│
       │              │   check  │        └─────────┘
       │              └──────────┘
```

```yaml
# ═══ GITHUB ACTIONS — CI/CD ═══

# .github/workflows/deploy.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # ═══ CI: Kiểm tra chất lượng code ═══
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - run: npm ci # Install dependencies!

      - run: npm run lint # ESLint check!

      - run: npm run type-check # TypeScript check!

      - run: npm run test -- --coverage # Unit tests + coverage!

      - run: npm run build # Build check!

  # ═══ CD: Deploy lên server ═══
  deploy:
    needs: ci # CHỈ chạy khi CI pass!
    if: github.ref == 'refs/heads/main' # CHỈ deploy từ main!
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - run: npm ci && npm run build

      # Deploy lên server (nhiều cách!):

      # Cách 1: SCP/SSH lên server trực tiếp:
      - name: Deploy via SSH
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_KEY }}
          source: "dist/*"
          target: "/var/www/my-app/"

      # Cách 2: Deploy lên Vercel:
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}

      # Cách 3: Deploy Docker image:
      - name: Build & Push Docker
        run: |
          docker build -t my-app:latest .
          docker push registry.company.com/my-app:latest

      # Notify team:
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1.25.0
        with:
          payload: '{"text":"🚀 Deploy thành công!"}'
```

```
DEPLOY STRATEGIES:
═══════════════════════════════════════════════════════════════

  ① STATIC HOSTING:
  → Vercel / Netlify / AWS S3 + CloudFront
  → Build → upload dist/ → CDN serve!
  → Đơn giản nhất cho SPA/SSG!

  ② SERVER (Nginx):
  → Build → SCP dist/ lên server → Nginx serve!
  → Nginx config: try_files cho SPA routing!

  ③ DOCKER + KUBERNETES:
  → Enterprise! Dockerfile → build image → K8s deploy!
  → Auto-scaling, rolling updates, rollback!

  ④ SSR (Next.js/Nuxt):
  → Node.js server! Cần process manager (PM2)!
  → Hoặc: Vercel (Next.js native!)
```

---

## §4. Đảm bảo Chất lượng — Testing & Config

```
AUTOMATED TESTING:
═══════════════════════════════════════════════════════════════

  ┌─────────────────┬────────────────────────────────────────┐
  │ LOẠI TEST       │ TOOLS                                  │
  ├─────────────────┼────────────────────────────────────────┤
  │ Unit Test       │ Vitest / Jest                          │
  │                 │ → Test functions, utilities, logic!    │
  ├─────────────────┼────────────────────────────────────────┤
  │ Component Test  │ React Testing Library / Vue Test Utils │
  │                 │ → Test component render, interaction!  │
  ├─────────────────┼────────────────────────────────────────┤
  │ Integration Test│ Playwright / Cypress                   │
  │                 │ → Test user flows, E2E!                │
  ├─────────────────┼────────────────────────────────────────┤
  │ Visual Test     │ Chromatic / Percy                      │
  │                 │ → Screenshot comparison!               │
  └─────────────────┴────────────────────────────────────────┘

  CHUẨN HÓA CONFIG:
  → eslint.config.js → CÙNG rules cho TẤT CẢ projects!
  → tsconfig.json → strictNullChecks, noImplicitAny!
  → prettier.config.js → format thống nhất!
  → .editorconfig → indent, line endings!
  → Publish config dưới dạng npm packages:
    @company/eslint-config
    @company/tsconfig
    @company/prettier-config

  → Dev chỉ cần:
    { "extends": "@company/tsconfig" }
    → ZERO config! Thống nhất TOÀN TEAM!
```

---

## §5. Nâng cao Hiệu suất — Templates & Components

```
TEMPLATES + COMPONENTS + SCHEMA:
═══════════════════════════════════════════════════════════════

  ① TEMPLATES:
  → Page templates: login, dashboard, CRUD table, form...
  → Scaffold CLI chọn template → generate pages!
  → Developer KHÔNG cần viết từ đầu!

  ② COMPONENT LIBRARY:
  → Internal UI library (dựa trên Ant Design / MUI)!
  → Chuẩn hóa design system!
  → npm publish → tất cả projects install!
  → Storybook cho documentation!

  ③ SCHEMA-DRIVEN:
  → Định nghĩa form/table bằng JSON schema!
  → Engine đọc schema → tự generate UI!
  → Giảm code boilerplate drastically!
```

```typescript
// ═══ SCHEMA-DRIVEN FORM — VÍ DỤ ═══

interface FormSchema {
    fields: {
        name: string;
        type: 'text' | 'number' | 'select' | 'date';
        label: string;
        required?: boolean;
        options?: { label: string; value: string }[];
        rules?: { pattern: string; message: string }[];
    }[];
}

// Schema:
const userFormSchema: FormSchema = {
    fields: [
        { name: 'name', type: 'text', label: 'Họ tên', required: true },
        { name: 'age', type: 'number', label: 'Tuổi' },
        {
            name: 'role',
            type: 'select',
            label: 'Vai trò',
            options: [
                { label: 'Admin', value: 'admin' },
                { label: 'User', value: 'user' },
            ]
        },
    ]
};

// Engine: đọc schema → render form tự động!
function renderForm(schema: FormSchema) {
    return schema.fields.map(field => {
        switch (field.type) {
            case 'text': return <Input label={field.label} required={field.required} />;
            case 'select': return <Select label={field.label} options={field.options} />;
            // ...
        }
    });
}

// → Developer CHỈ CẦN viết schema JSON!
// → Engine tự render form, validation, submit!
// → Giảm 70-80% code cho CRUD pages!
```

---

## §6. Vite — Nguyên lý hoạt động

```
VITE — KIẾN TRÚC:
═══════════════════════════════════════════════════════════════

  Vite dựa trên 2 CÔNG CỤ:

  ① esbuild (Development):
  → Viết bằng Go → NHANH cực kỳ! (10-100x nhanh hơn JS tools!)
  → Dùng để: transform TypeScript, JSX, CSS Modules!
  → Pre-bundle dependencies (node_modules)!

  ② Rollup (Production):
  → Mature bundler cho production build!
  → Tree shaking, code splitting, plugin ecosystem!
  → Output optimized bundles!

  DEVELOPMENT MODE — ESM (ES Modules):
  ┌─────────────────────────────────────────────────────────┐
  │ Webpack:                                                │
  │ → BUNDLE TẤT CẢ files → 1 bundle.js → serve!           │
  │ → Project lớn → bundle RẤT LÂU! 30s-60s chờ đợi!     │
  │                                                        │
  │ Vite:                                                   │
  │ → KHÔNG bundle trong dev! Serve file NHƯ NGUYÊN BẢN!   │
  │ → Browser NATIVE import ESM!                            │
  │ → Chỉ transform file ĐƯỢC YÊU CẦU (on-demand!)         │
  │ → Start gần như NGAY LẬP TỨC! <1s!                    │
  └─────────────────────────────────────────────────────────┘
```

```
VITE DEV SERVER — FLOW:
═══════════════════════════════════════════════════════════════

  ① STARTUP:
  ┌─────────────────────────────────────────────────────────┐
  │ → Vite scan entry (index.html)!                         │
  │ → Pre-bundle dependencies bằng esbuild!                │
  │   (lodash 600 files → 1 file!)                         │
  │ → Start HTTP server + WebSocket server!                 │
  │ → XONG! < 500ms!                                       │
  └─────────────────────────────────────────────────────────┘

  ② REQUEST:
  ┌─────────────────────────────────────────────────────────┐
  │ Browser: GET /src/App.tsx                               │
  │        ↓                                                │
  │ Vite server NHẬN request:                               │
  │ → Transform App.tsx (esbuild: TS→JS, JSX→JS)!          │
  │ → Rewrite imports (bare → actual paths)!                │
  │   import React from 'react'                             │
  │   → import React from '/node_modules/.vite/react.js'   │
  │ → Trả về file đã transform!                            │
  │        ↓                                                │
  │ Browser: execute file → gặp import → request tiếp!     │
  └─────────────────────────────────────────────────────────┘

  ③ PRE-BUNDLING (Dependency Optimization):
  ┌─────────────────────────────────────────────────────────┐
  │ VẤN ĐỀ:                                                │
  │ → lodash-es có 600+ files → 600+ HTTP requests!        │
  │ → CommonJS modules (React!) KHÔNG phải ESM!            │
  │                                                        │
  │ GIẢI PHÁP:                                             │
  │ → esbuild pre-bundle node_modules!                      │
  │ → 600 files → 1 file!                                  │
  │ → CommonJS → ESM conversion!                            │
  │ → Cache: node_modules/.vite/ (chỉ bundle 1 lần!)       │
  └─────────────────────────────────────────────────────────┘
```

---

## §7. Vite vs Webpack — So sánh

```
VITE vs WEBPACK:
═══════════════════════════════════════════════════════════════

  ┌───────────────────┬──────────────────┬──────────────────┐
  │ Tiêu chí          │ Webpack          │ Vite              │
  ├───────────────────┼──────────────────┼──────────────────┤
  │ Dev start         │ CHẬM! 10-60s!    │ NHANH! < 1s!     │
  │                   │ Bundle ALL first!│ ESM on-demand!   │
  ├───────────────────┼──────────────────┼──────────────────┤
  │ HMR speed         │ Chậm (rebuild    │ NHANH! Chỉ       │
  │                   │ affected modules)│ transform 1 file!│
  ├───────────────────┼──────────────────┼──────────────────┤
  │ Config            │ PHỨC TẠP!        │ ĐƠN GIẢN!        │
  │                   │ webpack.config.js│ vite.config.ts    │
  │                   │ Nhiều loaders,   │ Nhiều built-in!   │
  │                   │ plugins!         │ Zero-config OK!   │
  ├───────────────────┼──────────────────┼──────────────────┤
  │ Built-in          │ ÍT! Cần thêm:   │ NHIỀU!            │
  │                   │ css-loader,      │ CSS, PostCSS,     │
  │                   │ file-loader,     │ JSON, Static,     │
  │                   │ ts-loader...     │ TypeScript, JSX!  │
  ├───────────────────┼──────────────────┼──────────────────┤
  │ Production        │ Webpack bundler  │ Rollup bundler    │
  │                   │                  │ (mature, reliable)│
  ├───────────────────┼──────────────────┼──────────────────┤
  │ Ecosystem         │ RẤT LỚN!        │ Đang lớn nhanh!   │
  │                   │ Mature plugins!  │                   │
  ├───────────────────┼──────────────────┼──────────────────┤
  │ Browser support   │ Polyfill mọi thứ!│ Cần ESM support! │
  │                   │ IE11 possible!   │ Modern browsers!  │
  ├───────────────────┼──────────────────┼──────────────────┤
  │ TypeScript        │ ts-loader /      │ esbuild built-in! │
  │                   │ babel-loader!    │ NHANH hơn nhiều!  │
  └───────────────────┴──────────────────┴──────────────────┘

  TẠI SAO VITE NHANH HƠN?
  ① ESM native: browser tự resolve imports → KHÔNG bundle!
  ② esbuild: Go-based → 10-100x nhanh hơn JS tools!
  ③ On-demand: chỉ transform file ĐƯỢC REQUEST!
  ④ Cache: pre-bundle cached, browser 304 Not Modified!
```

---

## §8. Vite HMR — Hot Module Replacement

```
VITE HMR — NGUYÊN LÝ:
═══════════════════════════════════════════════════════════════

  ① STARTUP:
  → Vite tạo WebSocket connection (client ↔ server)!
  → Đồng thời: chokidar watch local files!

  ② FILE CHANGE:
  → User sửa file → chokidar PHÁT HIỆN!
  → Server xác định MODULE NÀO thay đổi!
  → Server gửi UPDATE message qua WebSocket:
    { type: 'update', updates: [{ path: '/src/App.tsx', ... }] }

  ③ CLIENT RECEIVE:
  → Client nhận WebSocket message!
  → Request file MỚI: import('/src/App.tsx?t=timestamp')
  → timestamp đảm bảo browser KHÔNG dùng cache!
  → Module mới được execute → UI refresh!

  FLOW:
  ┌──────────┐  save   ┌──────────┐  detect  ┌──────────┐
  │ Developer│ ──────→│ File     │ ───────→│ chokidar │
  │ sửa file │        │ System   │         │ watcher  │
  └──────────┘        └──────────┘         └────┬─────┘
                                                │
                                          ┌─────▼─────┐
                                          │   Vite    │
                                          │  Server   │
                                          └─────┬─────┘
                                                │ WebSocket
                                          ┌─────▼─────┐
                                          │  Browser  │
                                          │  Client   │
                                          └─────┬─────┘
                                                │ import()
                                          ┌─────▼─────┐
                                          │ New Module│
                                          │ Executed! │
                                          └───────────┘

  SO SÁNH VỚI WEBPACK HMR:
  → Webpack: phải REBUILD module graph → CHẬM khi project lớn!
  → Vite: chỉ invalidate 1 module → request lại → NHANH!
  → Vite HMR speed KHÔNG PHỤ THUỘC kích thước project!
```

```javascript
// ═══ VITE HMR API ═══

// Trong module, accept HMR:
if (import.meta.hot) {
  // Self-accepting: module tự handle update!
  import.meta.hot.accept((newModule) => {
    // newModule = module sau khi sửa!
    console.log("Module updated!", newModule);
  });

  // Accept dependency update:
  import.meta.hot.accept("./utils.js", (newUtils) => {
    // utils.js thay đổi → callback được gọi!
  });

  // Cleanup trước khi dispose:
  import.meta.hot.dispose((data) => {
    // Cleanup side effects (intervals, listeners...)!
    clearInterval(timer);
  });

  // Giữ state giữa các updates:
  import.meta.hot.data.count = count; // Persist!
}

// ⚠️ Vue/React frameworks TỰ ĐỘNG handle HMR!
// → @vitejs/plugin-react / @vitejs/plugin-vue
// → Developer KHÔNG cần viết HMR code thủ công!
```

---

## §9. Hệ thống Monitoring & Alarm

```
MONITORING & ALARM — 2 PHẦN:
═══════════════════════════════════════════════════════════════

  PHẦN 1: LOG TRACKING & UPLOAD
  ┌─────────────────────────────────────────────────────────┐
  │ ① Code Logs (logs kỹ thuật):                            │
  │ → Custom WebSocket log service!                         │
  │ → Client load → start WebSocket connection!              │
  │ → sdk.log('info', 'User clicked buy button', data)!     │
  │ → Server nhận logs → forward đến Data Warehouse!        │
  │ → Query logs qua Data Warehouse API!                    │
  │                                                        │
  │ ② Business Logs (logs nghiệp vụ):                       │
  │ → Track khi user thực hiện hành động nghiệp vụ!        │
  │ → VD: đặt hàng, thanh toán, tìm kiếm, thêm giỏ hàng! │
  │ → Report ngay khi action xảy ra!                        │
  └─────────────────────────────────────────────────────────┘

  PHẦN 2: ALARM IMPLEMENTATION
  ┌─────────────────────────────────────────────────────────┐
  │ → Dùng hạ tầng alarm THỐNG NHẤT của công ty!           │
  │ → Tracking data → xây TREND CHARTS!                     │
  │ → Đặt ALARM THRESHOLDS dựa trên trends!                │
  │ → CHIẾN LƯỢC alarm: manual → điều chỉnh → chính xác!! │
  │                                                        │
  │ FLOW:                                                  │
  │ Tracking data → Trend chart → Set threshold              │
  │ → Monitor real-time → Vượt threshold → ALARM!           │
  │ → Gửi notification: Slack, Email, SMS, PagerDuty!      │
  └─────────────────────────────────────────────────────────┘
```

```
LOG SERVICE ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  ┌──────────┐  WebSocket  ┌──────────┐  Forward  ┌──────────┐
  │  Client  │ ──────────→│  Log     │ ────────→│  Data    │
  │  App     │  log data  │  Server  │          │ Warehouse│
  └──────────┘            └──────────┘          └────┬─────┘
                                                     │
                                               ┌─────▼─────┐
                                               │  Alarm    │
                                               │ Platform  │
                                               └─────┬─────┘
                                                     │
                                               ┌─────▼─────┐
                                               │ Trend     │
                                               │ Charts +  │
                                               │ Thresholds│
                                               └─────┬─────┘
                                                     │ Alert!
                                               ┌─────▼─────┐
                                               │ Slack /   │
                                               │ Email /   │
                                               │ SMS       │
                                               └───────────┘
```

---

## §10. Business Metrics — Theo dõi chỉ số kinh doanh

```
BUSINESS METRICS — CÁCH TÍNH:
═══════════════════════════════════════════════════════════════

  Chỉ số kinh doanh = DỰA TRÊN tracking data từ các GIAI ĐOẠN
  của business flow!

  VÍ DỤ — TỶ LỆ ĐẶT HÀNG THÀNH CÔNG:

  ┌─────────────────────────────────────────────────────────┐
  │                                                        │
  │  Tỷ lệ đặt hàng     Tracking: thanh toán thành công   │
  │  thành công       =  ─────────────────────────────────  │
  │                      Tracking: click "Đặt hàng" ở     │
  │                      trang giỏ hàng                    │
  │                                                        │
  └─────────────────────────────────────────────────────────┘

  CÁC METRICS PHỔ BIẾN:

  ┌─────────────────────┬──────────────────────────────────┐
  │ Metric              │ Công thức                         │
  ├─────────────────────┼──────────────────────────────────┤
  │ Conversion Rate     │ Purchases / Page Views           │
  │ (Tỷ lệ chuyển đổi) │                                  │
  ├─────────────────────┼──────────────────────────────────┤
  │ Checkout Success    │ Payment Success / Checkout Click  │
  │ (Thanh toán đúng)   │                                  │
  ├─────────────────────┼──────────────────────────────────┤
  │ Cart Abandonment    │ 1 - (Checkout / Add to Cart)     │
  │ (Bỏ giỏ hàng)      │                                  │
  ├─────────────────────┼──────────────────────────────────┤
  │ Search Success      │ Click Result / Total Searches     │
  │ (Tìm kiếm hiệu quả)│                                  │
  ├─────────────────────┼──────────────────────────────────┤
  │ Error Rate          │ Error Events / Total Requests     │
  │ (Tỷ lệ lỗi)        │                                  │
  └─────────────────────┴──────────────────────────────────┘

  SAU KHI CÓ METRICS:
  → Config trend charts trên alarm platform!
  → Set thresholds (VD: checkout success < 90% → ALARM!)
  → Monitoring real-time → phát hiện sớm issues!
```

---

## §11. Mini-Program — Tối ưu hiệu năng

```
MINI-PROGRAM ARCHITECTURE — DUAL THREAD:
═══════════════════════════════════════════════════════════════

  WeChat Mini-Program dùng KIẾN TRÚC 2 LUỒNG:

  ┌───────────────────┐         ┌───────────────────┐
  │  RENDER THREAD     │         │  LOGIC THREAD      │
  │  (WebView!)        │         │  (JSCore!)          │
  │                   │         │                    │
  │  WXML + WXSS      │ JSBridge│  JavaScript logic  │
  │  → Hiển thị UI!   │←───────→│  → Xử lý logic!    │
  │                   │ native  │                    │
  │  Không chạy JS!   │ WeChat  │  Không truy cập    │
  │                   │         │  DOM!               │
  └───────────────────┘         └───────────────────┘

  → 2 threads TÁCH BIỆT! Giao tiếp qua JSBridge (native WeChat)!
  → Performance bottleneck = COMMUNICATION giữa 2 threads!
  → setData() = cầu nối CHÍNH! Data từ Logic → Render!

  BOTTLENECK CỤ THỂ:
  ① TẦN SUẤT setData: gọi quá NHIỀU lần → lag!
  ② DUNG LƯỢNG setData: data quá LỚN → serialize/deserialize chậm!
```

```javascript
// ═══ setData BOTTLENECK ═══

// ❌ ANTI-PATTERN 1: setData quá nhiều lần!
this.setData({ name: "John" });
this.setData({ age: 30 });
this.setData({ city: "HCM" });
// → 3 lần serialize + JSBridge communication + render!

// ✅ GỘP setData!
this.setData({
  name: "John",
  age: 30,
  city: "HCM",
});
// → CHỈ 1 lần!

// ❌ ANTI-PATTERN 2: setData toàn bộ object LỚN!
this.setData({
  hugeList: [...this.data.hugeList, newItem], // Copy TẤT CẢ!
});
// → Serialize toàn bộ list → CHẬM!

// ✅ setData PATH cụ thể!
this.setData({
  [`hugeList[${index}]`]: newItem, // CHỈ update 1 item!
});
// → Serialize CHỈ 1 item → NHANH!

// ❌ ANTI-PATTERN 3: setData data KHÔNG liên quan đến render!
this.setData({
  renderData: "shown on page", // ✅ Cần render!
  internalFlag: true, // ❌ Không liên quan UI!
});

// ✅ Data không render → dùng biến thường!
this.internalFlag = true; // Không qua setData!
this.setData({ renderData: "shown on page" });
```

```
TỐI ƯU MINI-PROGRAM — TỔNG HỢP:
═══════════════════════════════════════════════════════════════

  ① GIẢM TẦN SUẤT setData:
  → Gộp nhiều setData thành MỘT!
  → Dùng debounce/throttle cho setData liên tục!
  → KHÔNG setData data không liên quan đến render!

  ② GIẢM DUNG LƯỢNG setData:
  → setData ĐƯỜNG DẪN cụ thể: `list[0].name` thay vì toàn bộ!
  → Chia data lớn thành nhiều setData nhỏ (split)!
  → CÂN BẰNG: giữa tần suất và dung lượng!

  ③ WXML NODE COMPRESSION:
  → Giảm số lượng DOM nodes! (< 1000 nodes lý tưởng!)
  → Tránh nested quá sâu!
  → Dùng wx:if thay v-show cho elements ít hiển thị!

  ④ CSS STYLE MERGING:
  → Gộp CSS selectors trùng lặp!
  → Tránh inline styles!
  → Dùng CSS class thay vì nhiều inline style riêng lẻ!

  ⑤ REQUEST PRELOADING:
  → Preload data TRƯỚC khi navigate đến page mới!
  → Trong page A: bắt đầu fetch data cho page B!
  → Khi navigate B: data ĐÃ SẴN SÀNG!

  ⑥ IMAGE OPTIMIZATION:
  → Lazy load images (wx:lazy-load)!
  → Dùng WebP format!
  → CDN + appropriate sizes!

  ⑦ PHÂN TRANG + VIRTUAL LIST:
  → Danh sách dài: load theo trang!
  → recycle-view component cho virtual scrolling!
```

---

## §12. Tóm tắt phỏng vấn

```
PHỎNG VẤN — TRẢ LỜI:
═══════════════════════════════════════════════════════════════

  Q: "Frontend Lead làm gì về hạ tầng?"
  A: 4 trụ cột:
  → Development: tech selection, scaffolding, templates!
  → Deployment: CI/CD automation (GitHub Actions/Jenkins!)
  → Quality: automated testing, config chuẩn hóa!
  → Efficiency: zero-config, templates, components, schema!

  Q: "Vite nhanh hơn Webpack ở đâu?"
  A: 2 điểm chính:
  → Dev: ESM native + esbuild → KHÔNG bundle, on-demand!
  → Config: nhiều built-in, zero-config có thể chạy ngay!

  Q: "Vite HMR hoạt động thế nào?"
  A: 3 bước:
  → Start: tạo WebSocket + watch files (chokidar)!
  → File change: server detect → gửi ID qua WebSocket!
  → Client: nhận → request file mới → refresh module!

  Q: "Monitoring & Alarm System?"
  A: 2 phần:
  → Log tracking: WebSocket service + Data Warehouse!
  → Alarm: trend charts → thresholds → notifications!

  Q: "Business Metrics?"
  A: Tính từ tracking data các giai đoạn business flow!
  → VD: Checkout success = Payment OK / Click Checkout!
  → Config trend charts → set thresholds → alarm!

  Q: "Mini-Program optimization?"
  A: Bottleneck = setData (JSBridge communication!)
  → Giảm TẦN SUẤT: gộp setData, loại bỏ non-render data!
  → Giảm DUNG LƯỢNG: path cụ thể, split data!
  → Thêm: WXML compression, CSS merge, request preloading!
```

---

### Checklist

- [ ] **Frontend Infrastructure 4 trụ cột**: Development (scaffold/template), Deployment (CI/CD), Quality (testing/config), Efficiency (zero-config/schema)!
- [ ] **Scaffolding CLI**: inquirer prompts → copy template → install deps → git init; publish npm @company/cli!
- [ ] **CI/CD Pipeline**: Push → Lint → TypeScript check → Test → Build → Deploy; GitHub Actions/Jenkins!
- [ ] **Deploy strategies**: Static hosting (Vercel/S3), Server (Nginx+SCP), Docker+K8s, SSR (PM2/Vercel)!
- [ ] **Config chuẩn hóa**: @company/eslint-config + @company/tsconfig → npm publish → extends trong project!
- [ ] **Vite nguyên lý**: Dev = ESM native + esbuild (on-demand transform); Prod = Rollup bundle!
- [ ] **Vite pre-bundling**: esbuild bundle node_modules → 1 file; CommonJS → ESM; cache node_modules/.vite/!
- [ ] **Vite vs Webpack**: Dev start (< 1s vs 10-60s), Config (built-in vs manual loaders), HMR (1 module vs rebuild graph)!
- [ ] **Vite HMR**: WebSocket + chokidar → detect change → send module ID → client import() → refresh!
- [ ] **Monitoring**: WebSocket log service → Data Warehouse; Alarm: trend charts → thresholds → Slack/Email/SMS!
- [ ] **Business Metrics**: Tracking data các giai đoạn → công thức (payment_ok / checkout_click) → trend → alarm!
- [ ] **Mini-Program**: Dual thread (Render + Logic) → JSBridge → setData bottleneck!
- [ ] **setData optimization**: Gộp (1 lần), path cụ thể (`list[0].name`), loại non-render data, debounce!
- [ ] **Mini-Program thêm**: WXML < 1000 nodes, CSS merge, request preloading, lazy load images, virtual list!

---

_Nguồn: Helianthuswhite — juejin.cn/post/7298218459795734582_
_Cập nhật lần cuối: Tháng 2, 2026_
