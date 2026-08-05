# Kết luận đề xuất

Với yêu cầu **website blog + CMS trong cùng một source**, dùng **MySQL**, ảnh lưu trên ổ đĩa và database chỉ lưu đường dẫn, phương án phù hợp nhất là:

> **Next.js App Router + TypeScript + MySQL + Prisma + Tiptap Editor + Tailwind CSS**, chạy trên một VPS với **Nginx + Node.js**.

Không cần WordPress, không cần tách riêng frontend/backend, không cần microservice. Toàn bộ trang người đọc, CMS, API và xử lý database nằm trong một ứng dụng.

## Phần website người đọc

### Trang chủ

Trang chủ thiên về giới thiệu thương hiệu cá nhân:

- Logo và tên website.
- Đoạn giới thiệu ngắn.
- Hình ảnh tác giả.
- Liên kết sang Blog, YouTube, Podcast, Shop.
- Khu vực đăng ký nhận bản tin.

Trang chủ không phải dạng portal tin tức phức tạp mà giống một landing page nhẹ, tập trung vào thương hiệu cá nhân.

### Thanh menu

Menu có thể chứa cả liên kết nội bộ và liên kết ra bên ngoài:

- Blog.
- YouTube.
- Podcast.
- Shop.

  - Shopee.
  - Tiki.
  - Store quốc tế.

- Bản tin.
- Mục lục.
- Giới thiệu.

  - Về tác giả.
  - Về blog.
  - Truyền thông.

Do đó CMS nên có chức năng **quản lý menu nhiều cấp**, thay vì viết cứng menu trong code.

### Trang danh sách bài viết

Mỗi bài trong danh sách hiển thị:

- Tiêu đề.
- Ngày đăng.
- Tác giả.
- Số bình luận.
- Đoạn mô tả hoặc trích nội dung.
- Nút đọc tiếp.
- Danh mục bài viết.
- Phân trang.

Blog hiện có hàng chục trang phân trang, cho thấy cấu trúc archive và URL phân trang cần được xử lý tốt cho SEO. ([The Present Writer][3])

### Trang chi tiết bài viết

Một bài viết gồm:

- Tiêu đề.
- Ngày xuất bản.
- Tác giả.
- Nội dung dài.
- Heading H2, H3.
- Danh sách.
- Trích dẫn.
- Hình ảnh.
- Liên kết nội bộ và bên ngoài.
- Danh mục.
- Bình luận.
- Trả lời bình luận theo luồng cha–con.

Trang tham khảo có bình luận nhiều cấp, số lượng bình luận và phần tác giả phản hồi trực tiếp. ([The Present Writer][4])

### Mục lục nội dung

Trang “Mục lục” có ba cách tìm nội dung:

- Tìm kiếm từ khóa.
- Duyệt theo chủ đề.
- Duyệt theo tháng và năm.

Danh mục có cấu trúc cha–con, ví dụ:

- Tối ưu hóa cuộc sống.

  - Hiệu suất làm việc.
  - Tài chính cá nhân.

    - Độc lập tài chính.

Vì vậy database phải hỗ trợ **category phân cấp bằng `parent_id`**, không nên thiết kế danh mục một cấp. ([The Present Writer][5])

### Trang danh mục

Mỗi danh mục có một trang archive riêng, hiển thị:

- Danh sách bài thuộc danh mục.
- Tiêu đề.
- Trích đoạn.
- Ngày đăng.
- Số bình luận.
- Phân trang.

Một bài có thể nằm trong nhiều danh mục, nên quan hệ phù hợp là **many-to-many** giữa bài viết và danh mục. ([The Present Writer][6])

### Trang tĩnh

Các trang như:

- Giới thiệu tác giả.
- Giới thiệu website.
- Truyền thông.
- Bản quyền.
- Hướng dẫn.
- Q&A.
- Gợi ý sản phẩm.

Các trang này có thể dùng chung editor với bài viết nhưng không cần ngày đăng, danh mục và bình luận.

### Bản tin

Trang tham khảo nhúng form đăng ký từ dịch vụ bên ngoài. Từ ngày **22 tháng 4 năm 2026**, bản tin mới được chuyển sang Substack; các bản tin cũ vẫn được lưu thành danh sách archive trên website. ([The Present Writer][7])

Vì vậy phiên bản đầu **không cần tự xây hệ thống gửi email**. Chỉ cần:

- Ô nhập link hoặc mã iframe của Substack/Brevo/Mailchimp.
- Trang danh sách bản tin cũ.
- Nút đăng ký nhận bản tin.
- Liên kết sang nền tảng bản tin.

Đây là cách giảm rất nhiều độ phức tạp.

---

# 2. Các chức năng CMS nên có

## Dashboard

Hiển thị nhanh:

- Tổng số bài viết.
- Bài nháp.
- Bài đã xuất bản.
- Bài lên lịch.
- Tổng số bình luận.
- Bình luận đang chờ duyệt.
- Dung lượng media.
- Bài mới cập nhật.

Không cần dashboard analytics quá phức tạp trong bản đầu.

## Quản lý bài viết

Mỗi bài viết nên có:

- Tiêu đề.
- Slug.
- Mô tả ngắn.
- Nội dung.
- Ảnh đại diện.
- Tác giả.
- Danh mục.
- Thẻ tag.
- Trạng thái:

  - Nháp.
  - Chờ duyệt.
  - Đã lên lịch.
  - Đã xuất bản.
  - Đã ẩn.

- Ngày xuất bản.
- Cho phép hoặc tắt bình luận.
- Bài nổi bật.
- SEO title.
- SEO description.
- Canonical URL.
- Ảnh Open Graph.
- Xem trước trước khi đăng.

Nên có thêm:

- Tự động lưu.
- Lịch sử chỉnh sửa.
- Nhân bản bài viết.
- Thùng rác.
- Đổi slug và tự tạo redirect 301.

## Trình soạn thảo

Đề xuất dùng **Tiptap** với các block:

- Paragraph.
- H1–H4.
- In đậm, nghiêng, gạch chân.
- Danh sách số và danh sách thường.
- Trích dẫn.
- Đường phân cách.
- Hình ảnh.
- Chú thích ảnh.
- Link.
- Video YouTube.
- Bảng.
- Code block.
- Mục lục tự động.
- Nút CTA tùy chọn.

Nên lưu `content_json` làm dữ liệu gốc. Tiptap cũng khuyến nghị JSON vì dễ phân tích, mở rộng và chỉnh sửa hơn HTML; nội dung JSON có thể được render thành HTML ở phía server mà không cần tải editor cho người đọc. ([Tiptap][8])

Có thể lưu đồng thời:

```text
content_json    Dữ liệu gốc của editor
content_html    HTML được tạo sẵn để hiển thị
content_text    Văn bản thuần để tìm kiếm
```

## Quản lý trang tĩnh

Dùng cho:

- Giới thiệu.
- Liên hệ.
- Bản quyền.
- Chính sách riêng tư.
- Điều khoản.
- Trang hướng dẫn.

Có thể sử dụng cùng Tiptap Editor nhưng loại bỏ danh mục và ngày xuất bản.

## Quản lý danh mục

- Tạo, sửa, xóa danh mục.
- Danh mục cha–con.
- Slug.
- Mô tả.
- Ảnh đại diện tùy chọn.
- SEO title và description.
- Sắp xếp thứ tự.

## Quản lý tag

Tag nên độc lập với category:

- Category dùng cho nhóm nội dung chính.
- Tag dùng cho từ khóa nhỏ hơn.

Không nên cho khách hàng tạo quá nhiều tag không kiểm soát vì dễ tạo nhiều trang SEO mỏng.

## Thư viện media

- Upload nhiều ảnh.
- Tìm kiếm theo tên.
- Xem dạng lưới.
- Chọn ảnh đã upload để chèn vào bài.
- Sửa alt text.
- Sửa caption.
- Xem kích thước và dung lượng.
- Xóa ảnh chưa được sử dụng.
- Kiểm tra ảnh đang được bài nào sử dụng.

## Quản lý menu

Mỗi menu item có:

- Tên hiển thị.
- Loại liên kết:

  - Trang.
  - Bài viết.
  - Danh mục.
  - URL bên ngoài.

- Mở tab mới.
- Menu cha.
- Thứ tự.
- Trạng thái hiển thị.

## Quản lý bình luận

Nếu khách hàng thực sự cần giống trang mẫu:

- Bình luận khách.
- Trả lời nhiều cấp.
- Chờ duyệt.
- Đã duyệt.
- Spam.
- Thùng rác.
- Khóa bình luận từng bài.
- Chặn IP hoặc email.
- Rate limit.
- Honeypot hoặc CAPTCHA.

Bình luận tạo thêm khá nhiều công việc chống spam. Nếu không phải yêu cầu bắt buộc, nên để sang giai đoạn sau.

## Cài đặt website

- Tên website.
- Slogan.
- Logo.
- Favicon.
- Email liên hệ.
- Ảnh mặc định khi chia sẻ.
- Link mạng xã hội.
- Mã Google Analytics.
- Mã Facebook Pixel.
- Nội dung footer.
- Cấu hình bản tin.
- Số bài mỗi trang.
- Bật hoặc tắt bình luận.
- Múi giờ.
- Cấu hình SEO mặc định.

---

# 3. Kiến trúc đề xuất

## Một source, một ứng dụng

Không cần làm:

```text
frontend/
backend/
```

Đề xuất tổ chức:

```text
src/
├── app/
│   ├── (website)/
│   │   ├── page.tsx
│   │   ├── blog/
│   │   ├── bai-viet/
│   │   ├── chu-de/
│   │   ├── tag/
│   │   ├── tim-kiem/
│   │   ├── muc-luc/
│   │   └── gioi-thieu/
│   │
│   ├── admin/
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── posts/
│   │   ├── pages/
│   │   ├── categories/
│   │   ├── tags/
│   │   ├── media/
│   │   ├── comments/
│   │   ├── menus/
│   │   └── settings/
│   │
│   └── api/
│       ├── auth/
│       ├── uploads/
│       ├── posts/
│       ├── comments/
│       └── search/
│
├── components/
├── modules/
│   ├── posts/
│   ├── media/
│   ├── auth/
│   ├── seo/
│   └── comments/
│
├── lib/
│   ├── db.ts
│   ├── auth.ts
│   ├── storage.ts
│   └── validation.ts
│
└── styles/

prisma/
├── schema.prisma
└── migrations/
```

Next.js hỗ trợ route group để tách phần website và CMS về layout, code và quyền truy cập nhưng vẫn nằm trong cùng một ứng dụng. ([Next.js][9])

---

# 4. Công nghệ nên dùng

| Thành phần     | Lựa chọn                               |
| -------------- | -------------------------------------- |
| Framework      | Next.js App Router                     |
| Ngôn ngữ       | TypeScript                             |
| Giao diện      | React + Tailwind CSS                   |
| Component CMS  | shadcn/ui hoặc component tự viết       |
| Database       | MySQL 8+                               |
| ORM            | Prisma ORM                             |
| Editor         | Tiptap                                 |
| Validation     | Zod                                    |
| Xử lý ảnh      | Sharp                                  |
| Authentication | Session lưu database + cookie HttpOnly |
| Tìm kiếm       | MySQL FULLTEXT                         |
| Reverse proxy  | Nginx                                  |
| Chạy Node      | systemd hoặc PM2                       |
| Triển khai     | VPS Ubuntu                             |
| Backup         | Cron + mysqldump + nén thư mục uploads |

Prisma hỗ trợ trực tiếp MySQL/MariaDB, có migration và truy vấn type-safe, phù hợp với một project TypeScript duy nhất. ([Prisma][10])

Next.js phù hợp với blog vì có thể:

- Render nội dung phía server.
- Tạo metadata động.
- Tạo sitemap và robots.
- Tạo ảnh Open Graph.
- Dùng ISR để cache bài viết và cập nhật lại khi CMS xuất bản nội dung.

Các khả năng này đều có sẵn trong App Router. ([Next.js][11])

---

# 5. Thiết kế database - Đây là cấu trúc đề xuất, trong quá trình thực hiện cần cập nhật thêm

## Bảng `users`

```text
id
name
email
password_hash
role
status
last_login_at
created_at
updated_at
```

Role ban đầu chỉ cần:

```text
ADMIN
EDITOR
```

## Bảng `posts`

```text
id
title
slug
excerpt
content_json
content_html
content_text
featured_media_id
author_id
status
allow_comments
is_featured
published_at
scheduled_at
seo_title
seo_description
canonical_url
created_at
updated_at
deleted_at
```

## Bảng `post_revisions`

```text
id
post_id
title
content_json
editor_id
created_at
```

## Bảng `categories`

```text
id
parent_id
name
slug
description
sort_order
seo_title
seo_description
created_at
updated_at
```

`parent_id` cho phép tạo danh mục nhiều cấp.

## Bảng liên kết bài viết–danh mục

```text
post_categories
- post_id
- category_id
```

## Bảng `tags`

```text
id
name
slug
created_at
updated_at
```

## Bảng liên kết bài viết–tag

```text
post_tags
- post_id
- tag_id
```

## Bảng `media`

```text
id
original_name
stored_name
path
url
mime_type
file_size
width
height
alt_text
caption
uploaded_by
created_at
```

## Bảng `comments`

```text
id
post_id
parent_id
user_id
guest_name
guest_email
guest_website
content
status
ip_hash
user_agent
created_at
updated_at
```

## Bảng `pages`

```text
id
title
slug
content_json
content_html
status
seo_title
seo_description
created_at
updated_at
```

## Các bảng còn lại

```text
menus
menu_items
settings
redirects
sessions
audit_logs
newsletter_issues
```

---

# 6. Cách lưu hình ảnh

Không nên lưu ảnh trong thư mục source như:

```text
project/public/uploads
```

Vì lúc deploy hoặc thay source có thể làm mất hoặc ghi đè dữ liệu.

Nên đặt bên ngoài project:

```text
/srv/customer-blog/
├── app/
├── storage/
│   └── uploads/
│       └── 2026/
│           └── 08/
│               ├── 550e8400-original.webp
│               ├── 550e8400-large.webp
│               ├── 550e8400-medium.webp
│               └── 550e8400-thumb.webp
└── backups/
```

Database chỉ lưu:

```text
/uploads/2026/08/550e8400-original.webp
```

Nginx phục vụ trực tiếp:

```text
https://domain.com/uploads/2026/08/550e8400-original.webp
```

## Quy trình upload

1. CMS gửi file lên API.
2. Kiểm tra quyền admin/editor.
3. Kiểm tra MIME thật của file.
4. Giới hạn dung lượng.
5. Đổi thành tên UUID.
6. Xoay ảnh theo EXIF.
7. Resize ảnh.
8. Chuyển sang WebP.
9. Tạo thumbnail.
10. Lưu thông tin vào bảng `media`.

Không sử dụng tên file khách hàng gửi làm tên thật trên server. OWASP khuyến nghị kiểm tra extension, xác minh loại file thay vì tin vào header, tạo lại tên file và giới hạn kích thước upload. ([OWASP Cheat Sheet Series][12])

## Điều kiện quan trọng

Lưu local disk rất phù hợp khi:

- Website chạy trên một VPS.
- Chỉ có một instance ứng dụng.
- Không deploy serverless.
- Có backup định kỳ.

Nếu sau này chạy nhiều server, chỉ cần thay module `storage` sang S3 hoặc MinIO; database vẫn giữ URL/path theo cùng mô hình.

---

# 7. Tìm kiếm

Với quy mô một blog cá nhân, chưa cần Elasticsearch hoặc Meilisearch.

Dùng MySQL:

```sql
FULLTEXT(title, excerpt, content_text)
```

Trang tìm kiếm hỗ trợ:

- Từ khóa.
- Danh mục.
- Tag.
- Khoảng thời gian.
- Sắp xếp mới nhất.
- Phân trang.

Khi lưu bài, lấy văn bản thuần từ `content_json` và cập nhật vào `content_text`.

---

# 8. SEO bắt buộc

Một blog sống chủ yếu nhờ Google nên SEO không phải phần phụ.

Cần triển khai:

- URL thân thiện.
- Meta title.
- Meta description.
- Canonical URL.
- Open Graph.
- Twitter card.
- Sitemap XML.
- Robots.txt.
- RSS feed.
- Schema `Article`.
- Schema `Person`.
- Schema `BreadcrumbList`.
- Breadcrumb.
- Alt text ảnh.
- Heading đúng thứ tự.
- Redirect 301 khi đổi slug.
- Trang category có metadata riêng.
- Không index trang CMS.
- Không index URL preview.
- Không index trang tìm kiếm nội bộ.
- Tối ưu Core Web Vitals.

URL nên dùng dạng:

```text
/blog
/blog/ten-bai-viet
/chu-de/tai-chinh-ca-nhan
/tag/toi-gian
/luu-tru/2026/08
/tim-kiem?q=keyword
/admin
```

Trang tham khảo đặt bài viết trực tiếp ở root như `/viet/`, nhưng với website mới, `/blog/[slug]` dễ quản lý hơn và tránh xung đột với trang tĩnh.

---

# 9. Bảo mật CMS

Nên sử dụng session phía server, không lưu token đăng nhập trong `localStorage`.

Cookie:

```text
HttpOnly
Secure
SameSite=Lax hoặc Strict
```

OWASP cảnh báo không nên lưu session token hoặc credential trong `localStorage`; session ID cần ngẫu nhiên, không dự đoán được và thông tin quyền hạn nên được lưu phía server. ([OWASP Cheat Sheet Series][13])

Các lớp bảo vệ cần có:

- HTTPS.
- Hash mật khẩu bằng Argon2id hoặc bcrypt.
- Rate limit đăng nhập.
- Khóa tạm sau nhiều lần sai.
- CSRF protection.
- Kiểm tra quyền trên server.
- Không chỉ ẩn nút ở frontend.
- Sanitize nội dung HTML.
- Giới hạn file upload.
- Audit log thao tác admin.
- Backup database và media.
- Không cho upload script, PHP, HTML hoặc SVG chưa được sanitize.

---

# 10. Phạm vi phiên bản đầu

## Nên có ngay

- Đăng nhập CMS.
- Quản lý admin/editor.
- Quản lý bài viết.
- Tiptap Editor.
- Nháp và xuất bản.
- Xem trước bài.
- Danh mục nhiều cấp.
- Tag.
- Trang tĩnh.
- Thư viện ảnh.
- Menu nhiều cấp.
- Cài đặt website.
- Trang blog.
- Trang chi tiết.
- Trang danh mục.
- Tìm kiếm.
- Phân trang.
- Mục lục theo chủ đề và thời gian.
- Sitemap, RSS, robots, metadata.
- Redirect khi đổi slug.
- Backup.
- Responsive mobile.

## Có thể để giai đoạn sau

- Bình luận nội bộ.
- Đăng bài theo lịch.
- Nhiều ngôn ngữ.
- Newsletter tự gửi.
- Analytics riêng.
- Push notification.
- Thành viên đăng ký.
- Bookmark bài viết.
- Dark mode.
- Page builder kéo thả.
- AI hỗ trợ viết bài.

---

# 11. Những công nghệ không cần dùng

Đối với dự án này, không cần:

- Microservice.
- NestJS tách riêng backend.
- Redis.
- Elasticsearch.
- Kafka.
- GraphQL.
- Kubernetes.
- Headless CMS lớn.
- Page builder phức tạp.
- Lưu ảnh trong database.
- Tách riêng hai repository CMS và website.

Những thành phần đó chỉ làm dự án nặng hơn mà không tạo thêm giá trị rõ ràng cho một blog cá nhân.

---

## Phương án nên chọn: Next.js full-stack

Ưu điểm:

- Một source.
- Một lần deploy.
- SEO tốt.
- Dùng Node.js, phù hợp với các project bạn đang làm.
- Chia sẻ type giữa CMS, API và database.
- Giao diện CMS hiện đại.
- Có thể mở rộng API sau này.
- Không cần duy trì Express server riêng.

# Kiến trúc cuối cùng

```text
Browser
   │
   ▼
Nginx
   ├── /uploads/* ─────────► Local disk
   └── /* ─────────────────► Next.js
                                ├── Website public
                                ├── CMS /admin
                                ├── API
                                ├── Authentication
                                ├── SEO/RSS/Sitemap
                                └── Prisma
                                      │
                                      ▼
                                    MySQL
```

Đây là kiến trúc gọn nhất: **một source, một ứng dụng, một database, một VPS**, nhưng vẫn đủ sạch để sau này chuyển ảnh sang S3, thêm app mobile hoặc tách API mà không phải làm lại toàn bộ.

[1]: https://thepresentwriter.com/mycpanel/ 'Log In ‹ The Present Writer — WordPress'
[2]: https://thepresentwriter.com/ 'The Present Writer - A Minimalist Blog that Maximizes Your Life'
[3]: https://thepresentwriter.com/blog/ 'BLOG - The Present Writer'
[4]: https://thepresentwriter.com/viet/ 'Tại sao tôi ngừng viết & Tương lai The Present Writer - The Present Writer'
[5]: https://thepresentwriter.com/menu/ 'MỤC LỤC - The Present Writer'
[6]: https://thepresentwriter.com/category/hanh-trinh-cua-toi/cong-viec/ 'Công việc Archives - The Present Writer'
[7]: https://thepresentwriter.com/theo-doi/ 'Bản tin "Bài học thứ Tư" - The Present Writer'
[8]: https://tiptap.dev/docs/editor/core-concepts/persistence 'Persistence | Tiptap Editor Docs'
[9]: https://nextjs.org/docs/app/api-reference/file-conventions/route-groups?utm_source=chatgpt.com 'File-system conventions: Route Groups - Next.js'
[10]: https://www.prisma.io/docs/orm/core-concepts/supported-databases/mysql?utm_source=chatgpt.com 'MySQL database connector | Prisma Documentation'
[11]: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap?utm_source=chatgpt.com 'Metadata Files: sitemap.xml - Next.js'
[12]: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html?utm_source=chatgpt.com 'File Upload - OWASP Cheat Sheet Series'
[13]: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html?utm_source=chatgpt.com 'Session Management - OWASP Cheat Sheet Series'
