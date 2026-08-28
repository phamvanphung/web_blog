# Deploy lên Ubuntu (VPS) — Fresh Setup Guide

> **Mục đích:** Hướng dẫn từng bước deploy project `9ent-blog` lên một máy Ubuntu **mới hoàn toàn** (clean VPS), database MySQL **mới hoàn toàn**. Thực hiện theo thứ tự, copy-paste từng khối lệnh.

**Stack:** Next.js 15 (App Router) + React 19 + Prisma 7 (driver `mariadb`) + MySQL 8 + pnpm 9 + Node 20+

**Tài khoản admin mặc định** (sau khi seed): `admin@9ent.vn` / `changeme123!` → **đổi ngay sau khi login đầu tiên**.

---

## 0. Chuẩn bị

Yêu cầu tối thiểu:

| Thành phần | Version | Ghi chú |
|---|---|---|
| Ubuntu | 22.04 LTS hoặc 24.04 LTS | Test trên cả 2 |
| CPU / RAM | 1 vCPU / 1 GB RAM | Tối thiểu cho site nhỏ |
| Disk | 20 GB | Sau build ~500 MB + uploads |
| Domain (optional) | trỏ A record về IP VPS | Cần cho HTTPS |
| Node.js | **>=20** | Dùng nvm cho sạch |
| pnpm | **9.x** | `corepack enable` có sẵn |
| MySQL | **8.x** | Có thể dùng Docker, MariaDB 10.6+ cũng OK |
| Nginx | latest | Reverse proxy + serve `/uploads/*` static |

---

## 1. Cài đặt môi trường cơ bản

```bash
# Đăng nhập với user không-root (vd: deploy), KHÔNG dùng root trực tiếp
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw nginx mysql-server certbot python3-certbot-nginx
```

### Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'      # 80 + 443
sudo ufw enable
sudo ufw status
```

### Node.js 20 + pnpm 9

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v          # phải >= v20.x
npm -v

# Bật pnpm qua corepack (Node 16.13+ có sẵn)
corepack enable
corepack prepare pnpm@9.0.0 --activate
pnpm -v         # phải 9.x
```

---

## 2. Tạo database + user MySQL

### Option A — MySQL local

```bash
sudo mysql_secure_installation
# Đặt root password, remove anonymous users, disallow remote root login → Yes hết.
```

Tạo database + user riêng cho app (KHÔNG dùng root):

```bash
sudo mysql <<SQL
CREATE DATABASE 9ent_blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER '9ent'@'localhost' IDENTIFIED BY 'CHANGE_ME_DB_PASSWORD';
GRANT ALL PRIVILEGES ON 9ent_blog.* TO '9ent'@'localhost';
FLUSH PRIVILEGES;
SQL
```

Lưu lại `CHANGE_ME_DB_PASSWORD` — sẽ paste vào `.env`.

### Option B — MySQL trong Docker

```bash
sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
# logout/login lại để group docker có hiệu lực
```

Tạo `/opt/9ent/docker-compose.yml`:

```yaml
services:
  mysql:
    image: mysql:8.0
    container_name: 9ent-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: 9ent_blog
      MYSQL_USER: 9ent
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
    volumes:
      - mysql-data:/var/lib/mysql
    ports:
      - "127.0.0.1:3306:3306"

volumes:
  mysql-data:
```

Tạo `/opt/9ent/.env` (cho docker-compose, **khác** với app .env):

```bash
MYSQL_ROOT_PASSWORD=root_pass_dont_use_for_app
MYSQL_PASSWORD=CHANGE_ME_DB_PASSWORD
```

```bash
cd /opt/9ent && docker compose up -d
docker compose ps    # status = running/healthy
```

**Lưu ý URL khi connect từ app vào Docker MySQL:** `localhost:3306` vẫn dùng được vì port đã publish ra `127.0.0.1`.

---

## 3. Tạo user hệ thống cho app

```bash
sudo useradd --system --create-home --shell /bin/bash 9ent
sudo mkdir -p /srv/9ent
sudo chown 9ent:9ent /srv/9ent
```

Mọi lệnh dưới đây chạy với `9ent`:

```bash
sudo -u 9ent -i
```

---

## 4. Clone source + cấu hình .env

```bash
cd /srv/9ent
git clone <your-git-remote-url> app
# hoặc: git clone git@github.com:your-org/9ent-blog.git app
cd app
```

Tạo `.env` từ template:

```bash
cp .env.example .env
nano .env   # hoặc vim
```

**Điền các giá trị production sau:**

```env
# === 1. DATABASE ===
DATABASE_URL="mysql://9ent:CHANGE_ME_DB_PASSWORD@localhost:3306/9ent_blog"

# === 2. APP ===
NODE_ENV="production"
APP_URL="https://your-domain.vn"            # KHÔNG trailing slash
NEXT_PUBLIC_SITE_URL="https://your-domain.vn"

# === 3. AUTH ===
SESSION_COOKIE_NAME="sid"
SESSION_TTL_DAYS="14"
# Generate pepper (bắt buộc, 64 hex chars):
SESSION_IP_PEPPER="$(node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))")"
# Đổi admin defaults — KHÔNG dùng giá trị mặc định ở prod
SEED_ADMIN_EMAIL="admin@your-domain.vn"
SEED_ADMIN_PASSWORD="$(openssl rand -base64 18)"

# === 4. STORAGE ===
UPLOAD_ROOT="/srv/9ent/storage/uploads"
UPLOAD_PUBLIC_BASE="/uploads"

# === 5. LOGGING ===
LOG_LEVEL="info"

# === 6. KHÔNG CẦN BASE_URL trên prod ===
```

Kiểm tra file:

```bash
grep -v '^#' .env | grep -v '^$'
```

---

## 5. Cài đặt dependencies + generate Prisma

```bash
pnpm install --frozen-lockfile
# postinstall hook tự chạy `prisma generate`
```

Nếu lỗi permission liên quan đến file `.env` (prisma cần đọc để introspect), đảm bảo `.env` readable:

```bash
chmod 640 .env
```

---

## 6. Migrate database + seed

```bash
pnpm db:migrate         # apply tất cả migrations có sẵn trong repo
                         # KHÔNG cần --name (project đã có init migration)
pnpm db:seed             # tạo admin user + 1 DRAFT popup demo
```

**Output mong đợi** từ `pnpm db:seed`:

```
Seeded admin: admin@your-domain.vn
Seeded default settings: site.name, site.tagline, ...
Seeded 1 DRAFT demo popup (seed-popup-demo)
```

Verify:

```bash
mysql -u9ent -p9ent_blog -e "SHOW TABLES;"  # nhập password khi hỏi
mysql -u9ent -p9ent_blog -e "SELECT id, name, status FROM Popup;" 9ent_blog
```

---

## 7. Storage directory

```bash
sudo mkdir -p /srv/9ent/storage/uploads
sudo chown -R 9ent:9ent /srv/9ent/storage
# .gitkeep đã có sẵn trong repo để giữ structure
```

---

## 8. Build

```bash
pnpm build
```

**Output mong đợi:** Next.js in route summary, không có lỗi TypeScript / lỗi build. Build artifacts nằm trong `.next/`.

Nếu fail do thiếu env vars, kiểm tra lại `.env` đã điền đủ `DATABASE_URL`, `SESSION_IP_PEPPER`, `APP_URL`.

---

## 9. Chạy app bằng systemd

Tạo `/etc/systemd/system/9ent.service`:

```ini
[Unit]
Description=9ent-blog Next.js server
After=network.target mysql.service

[Service]
Type=simple
User=9ent
Group=9ent
WorkingDirectory=/srv/9ent/app
# EnvironmentFile load mọi biến từ .env (bao gồm PORT, DATABASE_URL, ...).
# Set PORT=4000 trong .env để đổi port — KHÔNG pin PORT ở đây.
EnvironmentFile=/srv/9ent/app/.env
Environment=NODE_ENV=production
ExecStart=/usr/bin/pnpm start
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

# Hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/srv/9ent/storage /srv/9ent/app/.next /srv/9ent/app/node_modules

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable 9ent
sudo systemctl start 9ent
sudo systemctl status 9ent
```

Check log:

```bash
sudo journalctl -u 9ent -f --since "5 min ago"
```

---

## 10. Nginx reverse proxy + serve static uploads

Tạo `/etc/nginx/sites-available/9ent`:

```nginx
# Redirect HTTP → HTTPS (sau khi đã có cert ở bước 11)
server {
    listen 80;
    server_name your-domain.vn www.your-domain.vn;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.vn www.your-domain.vn;

    # SSL certs (Let's Encrypt — bước 11)
    ssl_certificate     /etc/letsencrypt/live/your-domain.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.vn/privkey.pem;

    # Security headers (giữ mặc định Next.js + thêm HSTS)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Serve uploads trực tiếp từ disk — KHÔNG qua Next.js
    location /uploads/ {
        alias /srv/9ent/storage/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Proxy mọi request còn lại → Next.js.
    # ⚠️  Phải khớp với PORT trong .env. Đổi PORT ở .env → đổi luôn ở đây
    # rồi `sudo systemctl reload nginx`.
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host  $host;
        proxy_read_timeout 60s;
    }

    # Tăng body size cho upload (default 1MB)
    client_max_body_size 25m;
}
```

Kích hoạt:

```bash
sudo ln -s /etc/nginx/sites-available/9ent /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 11. HTTPS với Let's Encrypt

```bash
sudo certbot --nginx -d your-domain.vn -d www.your-domain.vn
# Trả lời:
#   - Email: your-email@example.com
#   - Agree ToS: Y
#   - Share email: N (tuỳ chọn)
#   - Redirect HTTP → HTTPS: 2 (yes)
```

Cert tự gia hạn qua systemd timer. Test:

```bash
sudo certbot renew --dry-run
```

---

## 12. Verification

Checklist sau khi deploy xong:

```bash
# 0. PORT khớp giữa app + Nginx
grep -E '^PORT=' /srv/9ent/app/.env          # vd: PORT=3000 hoặc PORT=4000
grep proxy_pass /etc/nginx/sites-enabled/9ent  # phải trỏ cùng port

# 1. Process chạy
sudo systemctl is-active 9ent

# 2. HTTP 200 trên health endpoint
curl -s -o /dev/null -w "%{http_code}\n" https://your-domain.vn/api/health
# → 200

# 3. Health JSON
curl -s https://your-domain.vn/api/health
# → {"ok":true,"db":"up","ts":"..."}

# 4. Site render
curl -s https://your-domain.vn | grep -o '<title>[^<]*</title>'

# 5. Admin login page
curl -s -o /dev/null -w "%{http_code}\n" https://your-domain.vn/admin/login
# → 200

# 6. Uploads serve qua Nginx
curl -sI https://your-domain.vn/uploads/.gitkeep | head -1
# → HTTP/1.1 200 OK
```

**Login admin đầu tiên:**

1. Truy cập `https://your-domain.vn/admin/login`
2. Email + password từ `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` trong `.env`
3. **ĐỔI PASSWORD NGAY** trong `/admin/users`
4. Xóa DRAFT demo popup (`/admin/popups` → Sửa → Xóa)

---

## 13. Cập nhật / redeploy

```bash
sudo -u 9ent -i
cd /srv/9ent/app
git pull
pnpm install --frozen-lockfile
pnpm db:migrate                  # nếu có migration mới
pnpm build
sudo systemctl restart 9ent
sudo journalctl -u 9ent -f --since "1 min ago"
```

---

## 14. Backup database

```bash
# Cron mỗi ngày 3h sáng, giữ 14 ngày
sudo tee /etc/cron.d/9ent-db-backup <<'CRON'
0 3 * * * 9ent /usr/bin/mysqldump -u9ent -pCHANGE_ME_DB_PASSWORD 9ent_blog \
  | gzip > /srv/9ent/backups/db-$(date +\%Y\%m\%d-\%H\%M).sql.gz
CRON

sudo mkdir -p /srv/9ent/backups && sudo chown 9ent:9ent /srv/9ent/backups

# Test restore
gunzip < backup.sql.gz | mysql -u9ent -pCHANGE_ME_DB_PASSWORD 9ent_blog
```

---

## Troubleshooting thường gặp

| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| `Can't connect to MySQL server` | Sai host/port hoặc MySQL chưa listen | `sudo ss -tlnp \| grep 3306` — phải thấy mysqld. Kiểm tra `DATABASE_URL` |
| `PrismaClientInitializationError: P1001` | DB timeout | Kiểm tra firewall + bind-address trong `/etc/mysql/mysql.conf.d/mysqld.cnf` (default `127.0.0.1` — OK) |
| `EACCES: permission denied, mkdir '/srv/9ent/app/.next/...'` | User `9ent` không sở hữu `.next` | `sudo chown -R 9ent:9ent /srv/9ent/app` |
| `Port 3000 is in use` | Service khác | `sudo lsof -i :3000` hoặc đổi `PORT=3001` trong `.env` + cập nhật Nginx `proxy_pass` + `sudo systemctl daemon-reload && sudo systemctl restart 9ent && sudo nginx -s reload` |
| `502 Bad Gateway` từ Nginx | Next.js chưa start hoặc crash, hoặc port lệch giữa app + Nginx | `sudo journalctl -u 9ent -n 50 --no-pager` + verify `PORT` trong `.env` khớp `proxy_pass` |
| Upload bị 404 | Nginx chưa serve `/uploads/` đúng path | Verify `location /uploads/` block có `alias` trỏ đúng `/srv/9ent/storage/uploads/` |
| Cookie không persist | Thiếu HTTPS / Secure flag | Kiểm tra `APP_URL` bắt đầu bằng `https://` + Nginx đang serve 443 |
| `ECONNREFUSED 127.0.0.1:3000` trong Nginx log | App chưa listen, hoặc app listen port khác | `sudo systemctl status 9ent` + `ss -tlnp \| grep -E '3000\|4000'` |

---

## Tóm tắt lệnh (cheat sheet)

```bash
# 1. Môi trường
sudo apt update && sudo apt install -y curl git ufw nginx mysql-server
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs && corepack enable && corepack prepare pnpm@9.0.0 --activate

# 2. DB + user
sudo mysql_secure_installation
sudo mysql -e "CREATE DATABASE 9ent_blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE USER '9ent'@'localhost' IDENTIFIED BY 'PASS'; GRANT ALL ON 9ent_blog.* TO '9ent'@'localhost'; FLUSH PRIVILEGES;"

# 3. App
sudo useradd --system --create-home --shell /bin/bash 9ent
sudo mkdir -p /srv/9ent && sudo chown 9ent:9ent /srv/9ent
sudo -u 9ent -i
cd /srv/9ent && git clone <url> app && cd app
cp .env.example .env && nano .env       # sửa DATABASE_URL + SESSION_IP_PEPPER + ADMIN_PASSWORD + PORT (optional)
pnpm install --frozen-lockfile
pnpm db:migrate && pnpm db:seed
pnpm build

# 4. systemd (chạy với sudo)
# Tạo /etc/systemd/system/9ent.service như trên, rồi:
sudo systemctl daemon-reload && sudo systemctl enable --now 9ent

# 5. Nginx + SSL
# Tạo /etc/nginx/sites-available/9ent rồi:
sudo ln -s /etc/nginx/sites-available/9ent /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d your-domain.vn
```

---

## Out of scope

- CDN / Cloudflare — không cần cho traffic nhỏ
- Docker Compose cho cả app (chỉ MySQL)
- CI/CD auto-deploy — set up sau nếu cần
- Sentry / monitoring — add khi cần
- HA / load balancer — single VPS đủ cho blog