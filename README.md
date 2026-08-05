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
- [ ] P1. Auth & Settings
- [ ] P2. Media & Categories/Tags
- [ ] P3. Posts (Tiptap)
- [ ] P4. Pages & Menus
- [ ] P5. Public site
- [ ] P6. SEO & Polish
- [ ] P7. Deploy (VPS Ubuntu + Nginx + PM2)

## Note về MySQL chưa có

Phase P0 scaffolds toàn bộ nhưng **không yêu cầu MySQL để build**. Các chỗ cần DB thực (dashboard counters, health endpoint, e2e tests) đều dùng `force-dynamic` hoặc try/catch để không crash khi DB chưa cấu hình. Sau khi cài MySQL + chạy migrate/seed thì mọi thứ hoạt động đầy đủ.

## Source layout

Xem `docs/superpowers/plans/2026-08-05-9ent-vn-blog-cms.md` (P0 plan) và `docs/superpowers/specs/2026-08-05-9ent-vn-blog-cms-design.md` (design gốc) để biết chi tiết kiến trúc.
