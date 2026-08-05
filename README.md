# 9ent.vn — Blog công ty + CMS

Website blog cho 9ent.vn — show dự án, chia sẻ quá trình làm, hướng đến khách hàng hiện hữu và tiềm năng.

## Tech stack

- Next.js 15 (App Router) + TypeScript + React 19
- Tailwind CSS + CSS Variables (theo `style.md`)
- **Prisma 7** + MySQL 8 (`@prisma/adapter-mariadb` driver)
- Tiptap 2 (sẽ thêm ở P3)
- Argon2 (auth) + Sharp (image) + Zod (validation)
- Vitest (unit) + Playwright (e2e)

## Công nghệ & nguyên tắc cross-platform

Repo chạy được cả **Windows (local dev)** lẫn **Linux (VPS production)**. Mọi đường dẫn trong code qua `node:path` + `process.env.UPLOAD_ROOT`; không hardcode `/srv/...` hay `\\`. End-of-line files ở dạng `lf` (set trong `.prettierrc`).

## Yêu cầu

- Node.js >= 20
- pnpm >= 9 (đã pin trong `packageManager`)
- MySQL 8+ (chạy local hoặc Docker)

### Cài MySQL theo OS

**Windows:**

- **Khuyến nghị:** Docker Desktop + `docker run --name mysql -e MYSQL_ROOT_PASSWORD=... -e MYSQL_DATABASE=9ent_blog -e MYSQL_USER=9ent -e MYSQL_PASSWORD=localpass -p 3306:3306 -d mysql:8`
- Hoặc: MySQL Installer for Windows (`mysql-installer-web-community-8.x.x.msi`)
- Hoặc: MariaDB (compatible với `mariadb` driver)

**Linux (Ubuntu/Debian VPS):**

```bash
sudo apt update
sudo apt install mysql-server
sudo service mysql start
sudo mysql_secure_installation
```

## Setup lần đầu

```bash
# 1. Clone + cài deps
pnpm install
# postinstall sẽ tự chạy `prisma generate` để tạo Prisma Client

# 2. Tạo DB + user MySQL
mysql -uroot -p
> CREATE DATABASE 9ent_blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
> CREATE USER '9ent'@'localhost' IDENTIFIED BY 'localpass';
> GRANT ALL PRIVILEGES ON 9ent_blog.* TO '9ent'@'localhost';
> FLUSH PRIVILEGES;

# Docker trên Windows: bỏ qua Bước 2 nếu đã set MYSQL_DATABASE + MYSQL_USER qua env vars.

# 3. Cấu hình env
cp .env.example .env
# Sửa DATABASE_URL nếu khác (Windows Docker thường dùng `localhost:3306`, Linux dùng `localhost:3306` hoặc socket)

# 4. Migrate + seed
pnpm db:migrate --name init
pnpm db:seed
# Admin mặc định: admin@9ent.vn / changeme123!  (đổi ngay sau khi đăng nhập ở P1)

# 5. Chạy dev
pnpm dev
```

Truy cập:

- **Public:** http://localhost:3000
- **Admin:** http://localhost:3000/admin/login (sẽ enable auth ở P1)
- **Health:** http://localhost:3000/api/health — trả `{ ok: true, db: 'up' }` khi MySQL chạy ổn

## Storage

- **Local (Windows / Linux dev):** `UPLOAD_ROOT="./storage/uploads"` (relative). Thư mục `storage/uploads/.gitkeep` đã được commit; mọi file upload thật được gitignore.
- **Production (VPS Ubuntu):** Override `UPLOAD_ROOT="/srv/9ent/storage/uploads"` trong `.env` thật trên server. Nginx serve `/uploads/*` trực tiếp từ disk (cấu hình ở P7).

## Scripts

```bash
pnpm dev                # dev server (port 3000)
pnpm build              # production build
pnpm start              # production server
pnpm lint               # eslint (next/core-web-vitals)
pnpm typecheck          # tsc --noEmit
pnpm format             # prettier write
pnpm format:check       # prettier check
pnpm test               # vitest unit
pnpm test:e2e           # playwright (cần dev server + MySQL)
pnpm db:migrate         # prisma migrate dev
pnpm db:seed            # tạo admin mặc định
pnpm db:studio          # Prisma Studio GUI
```

## Phase progress

- [x] **P0. Foundation** — scaffold, Prisma schema, ESLint/Prettier, layout shells, SEO helper, test skeletons
- [x] **P1. Auth & Settings** — session cookie `sid`, Argon2id password hash, role-based admin (ADMIN/EDITOR), audit log, settings module
- [x] **P2. Media & Categories/Tags** — Sharp pipeline (4 WebP variants), upload via Server Action, media library, categories tree, tags CRUD.
- [ ] P3. Posts (Tiptap)
- [ ] P4. Pages & Menus
- [ ] P5. Public site
- [ ] P6. SEO & Polish
- [ ] P7. Deploy (VPS Ubuntu + Nginx + PM2)

## Auth & Roles

CMS dùng session cookie `sid` (HttpOnly + SameSite=Lax; Secure ở production). Lưu trong DB (`Session` table). Argon2id cho password hash. Mọi thao tác admin đều ghi vào `AuditLog` (userId, action, target, ipHash).

Hai role:

- **ADMIN** — toàn quyền (incl. Users, Settings, Menus write).
- **EDITOR** — Posts, Pages, Categories, Tags, Media, Contacts. Settings là read-only.

Default admin (seed bởi `prisma/seed.ts`):

- Email: `admin@9ent.vn`
- Password: `changeme123!` ← đổi ngay sau khi login lần đầu (sẽ có UI ở P2+).

Login flow: `/admin/login`. Rate-limit 5 attempts / 15 min / IP. P1 implementation is **in-memory per Node process** — fine for dev + single-instance deploy. For multi-instance (PM2 cluster, k8s, etc.) replace `lib/rateLimit.ts` with a Redis-backed implementation before launch; the sliding-window API stays the same.

Logout: `POST /admin/logout` only (no GET — to prevent `<img src>` logout-CSRF by third-party pages).

Để generate `SESSION_IP_PEPPER` thật:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Paste giá trị 64-hex-char vào `.env` (KHÔNG commit).

## Media

Upload qua **Server Action** từ `/admin/media` (Admin-only). Sharp pipeline tạo 4 variant WebP ngay khi upload:

- `original` — giữ nguyên kích thước gốc + EXIF-rotate
- `large` — 1600w · q82
- `medium` — 800w · q82
- `thumb` — 400w · q80

Lưu local trong `UPLOAD_ROOT/YYYY/MM/<uuid>-<variant>.webp`. Mỗi bản ghi `Media` (DB) trỏ vào 1 variant + metadata chung (width/height/altText/caption). Public URL format: `/uploads/YYYY/MM/<uuid>-<variant>.webp`.

**Dev**: Next.js route handler `app/uploads/[...path]/route.ts` stream file từ disk.  
**Prod**: Nginx serve `/uploads/*` trực tiếp từ `UPLOAD_ROOT` (cấu hình ở P7) — route handler bypass hoàn toàn.

Limits: 10 MB / ảnh, MIME: JPEG/PNG/WebP/GIF (không SVG, không script).

## Categories & Tags

**Categories**: tree 2 cấp qua `parentId` self-relation. Admin CRUD ở `/admin/categories`. Slug tự sinh từ tên qua `slugify()` (chuẩn hóa Vietnamese diacritics, ví dụ `Giới thiệu` → `gioi-thieu`).

**Tags**: flat danh sách ở `/admin/tags`. Slug tự sinh, unique qua `ensureUniqueSlug()` (append `-2`, `-3`, … nếu trùng).

Cả hai module đều ghi `AuditLog` cho mỗi mutation.

## Note về local DB

Một số gates yêu cầu MySQL thật để pass:

- `/api/health` trả `{ ok: true, db: 'up' }` (P0/P1) — không có DB → 503 với `{ db: 'down' }`.
- E2E test `home.spec.ts > health endpoint returns ok` (P0) — fail khi MySQL down.
- E2E login round-trip thật (right password → dashboard) — cần seed admin user.

Build, typecheck, lint, unit tests, và hầu hết e2e tests (auth-gate + 404/traversal + form-render) **không cần** DB. Phase P0/P1/P2 ship được mà không cần MySQL.

Xem `docs/superpowers/plans/2026-08-05-9ent-vn-blog-cms.md` (P0 plan) và `docs/superpowers/specs/2026-08-05-9ent-vn-blog-cms-design.md` (design gốc) để biết chi tiết kiến trúc.
