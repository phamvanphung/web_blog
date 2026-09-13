# Iframe-Safe HTML — Paste Rules cho `RawHtmlBlock`

> **Date:** 2026-09-13
> **Status:** ✅ Approved (brainstorming complete)
> **Scope:** Áp dụng cho HTML paste vào `RawHtmlBlock` (Section `rawhtml` ở admin)
> **Author:** Brainstorming session với user — fix 3 UX issues khi nhúng landing page vào iframe

---

## Context

Khi admin paste một HTML landing page (full document, có `<!DOCTYPE>` + `<html>` + `<body>`) vào block `rawhtml`, nó được render bên trong `<iframe srcdoc={...}>` của [`components/site/blocks/RawHtmlBlock.tsx`](../../components/site/blocks/RawHtmlBlock.tsx).

Iframe wrapper có sẵn:
- **Two-way scroll sync** (outer → inner qua `outerToInner()` + wheel/touch redirect về outer)
- **Wrapper grow tự động** theo `measure()` — không cần user scroll iframe
- **`100vh` pin** (`vhPin.ts`) — ngăn feedback loop giữa wrapper height và iframe content
- **`touch-action: none`** trên iframe html/body — touch event đã redirect sang outer page

3 UX issues user gặp khi paste HTML standalone vào iframe:

| # | Issue | Why |
|---|---|---|
| 1 | Click "Khám phá nội dung" (`<a href="#topics">`) hiển thị **2 header** (của parent + của iframe) | Iframe tự scroll nội bộ tới `#topics`; parent page không scroll. Nếu section ở deep trong page, iframe vẫn hiển thị header section riêng (offset khác 0) → user thấy 2 header. |
| 2 | Mobile scroll giật / không mượt | HTML có `html { scroll-behavior: smooth }` + `IntersectionObserver` + cursor/tilt mousemove; wrapper có `touch-action: none` + `touchmove.preventDefault()` + sync. Hai bên **cùng chiếm quyền điều khiển scroll** → fight. |
| 3 | Sau click button, iframe "tối hơn" / flicker như reload | `<a href="#hash">` trong iframe srcdoc đổi URL thành `about:srcdoc#hash`. Một số Chromium-version re-parse lại document khi hash đổi → brief dark/blank frame. |

**Root cause chung**: HTML files được thiết kế cho standalone viewing, nhưng thực tế bị nhúng vào iframe có wrapper riêng. Hai bên không hiểu nhau.

---

## Goal

Thiết lập **bộ rule đơn giản, dễ kiểm tra** cho HTML paste vào `rawhtml`, sao cho:

1. Iframe wrapper có **một scroll surface duy nhất** (parent page), không fight với HTML nội bộ.
2. Anchor clicks từ HTML **navigate parent page** (không phải iframe internally).
3. Không có flash trắng/đen khi load hoặc khi click.
4. HTML vẫn work được standalone nếu tách ra khỏi iframe (tức là rule "iframe-safe" không phá standalone use case).

## Non-Goals

- **Không tự động rewrite HTML ở wrapper**. Plan user-chosen: "HTML tự adapt". Wrapper chỉ warn console; không có HTML transformer / sanitizer magic.
- **Không enforce bằng cách block HTML paste**. Admin paste được mọi HTML, chỉ nhận warning để tự fix.
- **Không optimize cho raw fragment** (HTML ngắn không phải full document). Fragment render qua `dangerouslySetInnerHTML`, không có iframe wrapper.

---

## User Decisions (đã chốt)

| # | Câu hỏi | Quyết định |
|---|---|---|
| 1 | Ai phải adapt ai? (HTML files hay wrapper rewrite) | **HTML files tự adapt** theo rule. Wrapper không sửa nhiều. |
| 2 | Khi nào enforce? | **Warning only**, không block. Console.warn kèm link tới spec để admin tự đọc. |
| 3 | Đối với anchor `#hash` trong HTML, fix thế nào? | **Đổi sang real URL hoặc `target="_top"`** (xem Rule 2). |
| 4 | Scope của spec? | **Spec này + console warnings trong setup()**. Không cần CI check. |

---

## The 8 Rules

Mỗi rule có: **Tại sao** (vì sao wrapper conflict), **DO** (pattern đúng), **DON'T** (pattern vi phạm).

### Rule 1: Không `html { scroll-behavior: smooth }`

**Tại sao**: Wrapper đã dùng `scrollTo({ top, behavior: 'instant' })` cho programmatic scroll. Nhưng user scroll thủ công (trackpad swipe, mouse wheel, touch) browser vẫn respect CSS preference → animation chậm → wrapper sync drift.

```html
<!-- DO -->
<style>
  html, body { scroll-behavior: auto; }
</style>

<!-- DON'T -->
<style>
  html, body { scroll-behavior: smooth; }
</style>
```

> **Note**: Đây là 1 trong 4 patterns mà `RawHtmlBlock.setup()` console.warn khi detect (xem [Detection](#detection--rawhtmlblock-warnings)).

### Rule 2: Anchor links — 3 patterns hợp lệ

| Use case | DO | DON'T |
|---|---|---|
| Click navigate tới page khác của site | `<a href="/chu-de" target="_top">` | `<a href="/chu-de">` (parent page sẽ navigate, nhưng navigation chậm và mất scroll context iframe) |
| Click mở URL ngoài | `<a href="https://google.com">` | Trộn với iframe navigation |
| Section ngay trong iframe | `<button data-scroll-to="#topics">` + JS custom xử lý | `<a href="#topics">` (trigger iframe re-parse trên Chromium) |

**Lý do từng rule**:

- `target="_top"`: bắt browser navigate parent page (escape khỏi iframe hoàn toàn). Click "Xem chủ đề" → load lại `/chu-de` ở parent tab.
- In-page anchor `#hash` trong iframe srcdoc: đổi URL thành `about:srcdoc#hash` → **Chromium re-parse document** (dark/blank frame). User thấy như reload.
- Real URL không `target`: parent navigate, nhưng không có visual cue rằng đây là nav (button styling giống anchor nội bộ).

```html
<!-- DO: navigate parent page -->
<a href="/chu-de" target="_top" class="cta-btn">Xem chủ đề</a>

<!-- DON'T: trigger iframe re-parse -->
<a href="#topics">Khám phá nội dung</a>
```

### Rule 3: Không `body { overflow: hidden }`

**Tại sao**: Iframe cần internal scroll để `wrapper-grow measurement` walk DOM. Nếu body overflow hidden:
- `scrollHeight = innerHeight` → `measure()` return 100vh → wrapper không grow → outer page không có scroll length.
- User phải scroll iframe internally, không scroll được outer page.

```css
/* DO */
body { overflow: visible; overflow-x: clip; }  /* ngăn horizontal scroll */

/* DON'T */
body { overflow: hidden; }
```

### Rule 4: Theme color set trong `<html>` (no white flash)

**Tại sao**: Khi `<body>` chưa CSS-ready, browser default = white. Dark theme sẽ flash trắng → đen. Đặt background **inline trên `<html>`** để browser apply ngay lúc parse.

```html
<!-- DO: inline style ngay khi parse -->
<html style="background: #140707">
  <head><style>body { background: inherit; }</style></head>
  <body>...</body>
</html>

<!-- DO: đặt <style> TRƯỚC <body> trong <head> -->
<html>
  <head>
    <style>html, body { background: #140707; }</style>
  </head>
  <body>...</body>
</html>

<!-- DON'T: chỉ set background ở <body> -->
<html>
  <body style="background: #140707">...</body>
</html>
```

> **Note**: Tín hiệu nhận biết là `getComputedStyle(htmlElement).backgroundColor === 'rgba(0, 0, 0, 0)'` (transparent). `RawHtmlBlock.setup()` sẽ warn khi detect.

### Rule 5: Touch/mousemove handlers — scope chặt

**Tại sao**: Wrapper đã có wheel/touch handler riêng trên iframe window. Nếu HTML thêm `window.addEventListener('mousemove')`, nó chạy SONG SONG:
- CPU spike (chạy `IntersectionObserver` + cursor light + tilt card + wrapper sync).
- Touch event fight trên mobile (iOS bounce trigger cả hai handler).

```js
// DO: scope vào element cụ thể, passive khi không preventDefault
const card = document.querySelector('.visual-card');
card.addEventListener('mousemove', (e) => {
  const rect = card.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  card.style.setProperty('--tilt', x);
}, { passive: true });

// DON'T: window-level mousemove
window.addEventListener('mousemove', (e) => {
  // cursor light + tilt card + observer fires 60+ Hz
  document.body.style.setProperty('--mx', e.clientX);
});
```

**Filter trick** nếu cần track chỉ một số element:

```js
// DO: respect data-no-track
document.addEventListener('mousemove', (e) => {
  if (e.target.closest('[data-no-track]')) return;
  // …
}, { passive: true });
```

### Rule 6: `position: sticky` chỉ trên element BÊN TRONG iframe body

**Tại sao**: Iframe viewport cố định ở 100vh (wrapper grow = wrapper height, không phải iframe height). Sticky bên trong iframe work OK vì iframe có internal scroll. Nhưng `position: sticky` trên wrapper lớn (body, main, section root) sẽ conflict với `position: sticky; top: 0` của iframe element.

```css
/* DO: sticky cho element cụ thể bên trong */
.stage { position: sticky; top: 0; height: 100vh; }
.card  { position: sticky; top: 80px; }

/* DON'T: sticky ngay trên body */
body, main, .root { position: sticky; top: 0; }
```

### Rule 7: Tránh `100vh` trên element non-hero

**Tại sao**: `vhPin` ([components/site/blocks/vhPin.ts](../../components/site/blocks/vhPin.ts)) đã pin mọi `vh` value ở viewport height ban đầu. Nếu HTML có nhiều `100vh` (gallery full-screen, modal), pin sẽ tạo nhiều section đúng 100vh viewport → OK. Nhưng dùng `100vh` cho **element nền content** (không phải full-screen) sẽ bị pin lock ở viewport đầu tiên → reponsive break.

```css
/* DO: full-screen hero dùng 100vh (đã pinned) */
.hero { min-height: 100vh; }

/* DO: section ngắn dùng min-height linh hoạt */
.about { min-height: 480px; }

/* DON'T: section ngắn lock ở 100vh */
.about { height: 100vh; }
```

### Rule 8: Asset URLs phải tuyệt đối hoặc data URI

**Tại sao**: Iframe srcdoc có origin `about:srcdoc`, không có base path. Relative URLs như `./style.css`, `../image.png` resolve thành `about:srcdoc/./style.css` → fail (404).

```html
<!-- DO -->
<link rel="stylesheet" href="https://cdn.example.com/style.css">
<img src="https://cdn.example.com/hero.jpg" alt="hero">
<style>/* inline */</style>

<!-- DO: data URI cho ảnh nhỏ -->
<img src="data:image/png;base64,iVBORw0KGgo…" alt="logo">

<!-- DON'T -->
<link rel="stylesheet" href="./style.css">
<img src="../images/hero.jpg" alt="hero">
```

---

## Architecture

### Files changed

| Action | File | LOC | Purpose |
|---|---|---|---|
| Create | `docs/superpowers/specs/2026-09-13-iframe-html-guidelines.md` | ~280 | Spec này |
| Modify | `components/site/blocks/RawHtmlBlock.tsx` | +15 | JSDoc note referencing spec + 4 console warnings trong `setup()` |

### Detection — `RawHtmlBlock` warnings

Sau khi iframe load, `setup()` scan DOM và `console.warn()` cho 4 patterns vi phạm (mapping tới Rule 1, 3, 4, 2). Mỗi warning kèm spec rule reference:

| Pattern check | Maps to | Console message shape |
|---|---|---|
| `getComputedStyle(htmlEl).scrollBehavior === 'smooth'` | Rule 1 | `[RawHtmlBlock] html { scroll-behavior: smooth } detected — see Rule 1 in iframe-html-guidelines.md` |
| `getComputedStyle(bodyEl).overflow` chứa `'hidden'` | Rule 3 | `[RawHtmlBlock] body { overflow: hidden } detected — see Rule 3` |
| `getComputedStyle(htmlEl).backgroundColor === 'rgba(0, 0, 0, 0)'` | Rule 4 | `[RawHtmlBlock] <html> has no background set — dark theme may flash white. See Rule 4` |
| `idoc.querySelectorAll('a[href^="#"]:not([target])')` count > 0 | Rule 2 | `[RawHtmlBlock] Found N naked #anchor link(s) — see Rule 2` |

**Implementation pattern**: scan 1 lần sau `overrideVhUnits()` + `injectScrollbarHider()`, log mỗi violation riêng, không throw, không re-style. Production cũng warn (giúp dev thấy khi test thực tế).

> **Out of scope**: Auto-fix (sửa HTML ngay trong wrapper). User chọn "HTML tự adapt".

### JSDoc update trong `RawHtmlBlock.tsx`

Thêm 1 paragraph vào block comment ở đầu file (sau phần giải thích về `100vh` pinning), referencing spec này:

```
Pasted HTML rules. HTML authors paste must follow 8 rules in
docs/superpowers/specs/2026-09-13-iframe-html-guidelines.md
(wrapper KHÔNG rewrite HTML). setup() below emits 4 console.warn()
khi detect phổ biến nhất (smooth scroll, overflow:hidden, missing
bg, naked #anchor).
```

---

## Behavior Spec — Warning semantics

| Tình huống | Hành vi |
|---|---|
| HTML clean, không vi phạm rule nào | Không có warning. Page works bình thường. |
| HTML vi phạm Rule 1 (smooth scroll) | Console.warn khi iframe load. Iframe vẫn render. User đọc console fix. |
| HTML vi phạm nhiều rule | Nhiều warning riêng biệt, đủ để user biết. Không aggregate thành 1 message. |
| React Strict Mode double `setup()` (dev mode) | Warning fire 2 lần. OK — user dev sẽ thấy và fix. **Không suppress bằng `setupDone` flag** vì user cần thấy dev. |
| Fragment HTML (không phải full document) | `isFullDocument(html)` return false → không vào `setup()`, không có warning. |
| Re-navigation in-iframe (`location.replace`) | `setup()` chạy lại, warning fire lại. Acceptable. |

---

## Testing Strategy

### Static check (sau khi author xong spec + code)

- [ ] Mỗi rule có ≥ 1 DO/DON'T code block
- [ ] JSDoc paragraph trong `RawHtmlBlock.tsx` reference spec file path
- [ ] 4 console.warn() calls trong `setup()` đúng pattern

### Dynamic check

- [ ] `pnpm typecheck` pass
- [ ] `pnpm test` pass (không thêm test mới — warnings là runtime-only)
- [ ] Manual trong dev: paste HTML landing page vi phạm Rule 1, 2, 4 vào admin → mở page → console có đúng 3 warning
- [ ] Manual mobile: fix HTML theo rules → mở page trên mobile → scroll mượt, không có header lạ, click button không flicker

### Rule validation (vitest unit test — optional)

Test function `lintPastedHtml(html: string)` exposed từ `RawHtmlBlock.tsx`:
- Input: HTML string
- Output: array of `{ rule: number, message: string }`
- 1 test / rule covering positive + negative case

> **Deferred**: cho vào backlog. Warnings chạy runtime là đủ cho P0.

---

## Critical Files Reference

| File | Role |
|---|---|
| [components/site/blocks/RawHtmlBlock.tsx](../../components/site/blocks/RawHtmlBlock.tsx) | Iframe wrapper (~1060 lines). Modify JSDoc + thêm 4 warnings trong `setup()` |
| [components/site/blocks/vhPin.ts](../../components/site/blocks/vhPin.ts) | vh pin regex (32 lines). NO change — đã cover Rule 7 partial |
| [docs/superpowers/specs/2026-09-13-iframe-html-guidelines.md](2026-09-13-iframe-html-guidelines.md) | NEW: spec này |

---

## Out of Scope

- **Auto-rewrite HTML** ở wrapper (parse + replace anchor, smooth → auto). Lý do loại: fragile parser, dễ break HTML không chuẩn, magic behavior khó debug. User chọn "HTML tự adapt".
- **CI lint check** cho HTML trong DB. Snapshot paste vào admin qua form, không có commit hook. Drift detection ở runtime là đủ.
- **Different wrapper cho fragment HTML**. Fragment KHÔNG qua iframe → rule này không apply.
- **Force `overflow: visible` injection**. Wrapper có thể inject style override, nhưng sẽ surprise HTML authors (Rule 3 đã rõ).
- **Force background color injection**. Same lý do.

---

## Trade-off

**Pro**:
- Tách rõ trách nhiệm: HTML author biết rule, wrapper không magic rewrite.
- HTML vẫn work standalone nếu tách ra khỏi iframe (rules cũng là best practice cho standalone).
- Warning nhẹ, không block creative paste (admin vẫn paste được HTML chưa clean).

**Con**:
- HTML authors phải đọc spec trước khi paste.
- Console warnings không chặn được HTML sai, chỉ cảnh báo.
- User phải sửa 2 HTML files hiện có (manual, không có migration script).

**Alternative đã loại trừ**: Wrapper rewrite HTML trước khi inject (anchor → target_top, smooth → auto, body overflow override). Lý do loại: parser edge cases (CDATA, comments, inline `<style>` quirks), magic dễ vỡ, debug khó.


Có. Nếu mục tiêu là không chỉ “iframe-safe” mà còn mobile UX tốt như trang About, tôi sẽ bổ sung thêm một nhóm rule riêng gọi là Mobile UX Rules.

Rule 9: Mobile-first layout collapse
Desktop có thể 2–3 cột, nhưng trên mobile phải về 1 cột rõ ràng.

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

Tránh cố giữ 2 cột chỉ vì “vẫn còn đủ chỗ”.

Rule 10: Decorative elements phải được giảm hoặc bỏ trên mobile
Các thứ như orbit, floating chip, blur ball, mouse-follow glow, 3D tilt không nên giữ nguyên trên màn hình nhỏ.

@media (max-width: 768px) {
  .visual-orbit,
  .floating-chip,
  .cursor-light {
    display: none;
  }
}

Đây là một trong những lý do About cho cảm giác nhẹ hơn Home.

Rule 11: Không giữ min-height lớn chỉ để phục vụ desktop visual
Ví dụ Home có hero-visual { min-height: 365px; } trên mobile thì vẫn chiếm khá nhiều không gian.

@media (max-width: 768px) {
  .hero,
  .hero-visual {
    min-height: auto;
  }
}

Rule 12: CTA trên mobile ưu tiên stack
Hai button cạnh nhau trên desktop thì được, nhưng mobile nên chuyển thành:

@media (max-width: 640px) {
  .hero-actions {
    flex-direction: column;
  }

  .hero-actions .btn {
    width: 100%;
  }
}

Đây là pattern UX an toàn hơn flex: 1 nhưng vẫn nằm cùng hàng.

Rule 13: Font size không phụ thuộc quá mạnh vào vw
14vw có thể đẹp ở một số máy nhưng dễ quá lớn hoặc nhảy layout.
Nên dùng:

font-size: clamp(38px, 10vw, 58px);

Tức là có min và max rõ ràng.

Rule 14: Mobile spacing phải giảm theo hệ thống
Không chỉ đổi grid, mà phải giảm cả:

section padding
gap
card padding
margin title
khoảng cách CTA

Ví dụ:

section {
  padding: 88px 0;
}

@media (max-width: 768px) {
  section {
    padding: 56px 0;
  }
}

Rule 15: Interactive effects phải theo input capability
Không chỉ theo width.

@media (hover: none), (pointer: coarse) {
  .magnetic,
  .tilt-card {
    transform: none !important;
  }
}

Mobile touch không cần magnetic button, hover tilt hay mouse glow.

Rule 16: Nội dung phụ có thể ẩn trên mobile
Không phải mọi thứ desktop có đều cần tồn tại trên mobile.
Ví dụ:

@media (max-width: 640px) {
  .quiet-note,
  .decorative-copy,
  .secondary-chip {
    display: none;
  }
}

About đang làm điều này tốt hơn Home.

Rule 17: Touch target tối thiểu 44–48px
Button/link phải đủ lớn để bấm bằng ngón tay:

.btn {
  min-height: 48px;
}
Rule 18: Không dùng absolute positioning cho content chính trên mobile
position:absolute chỉ nên dành cho decoration. Nội dung chính, CTA, text, card nên ở normal flow để tránh overlap khi chữ tiếng Việt xuống dòng.
Rule 19: Mobile không nên phụ thuộc hover để hiểu UI
Nếu card chỉ hiện thông tin hoặc đổi trạng thái khi hover thì mobile sẽ không có trải nghiệm tương đương.

Rule 20: Respect prefers-reduced-motion và chủ động giảm animation trên mobile
Rule hiện tại của bạn đã có prefers-reduced-motion, nhưng có thể thêm:

@media (max-width: 768px) {
  .floating,
  .orbit,
  .word-animation {
    animation: none;
  }
}

Tức là không cần đợi user bật reduced motion mới giảm hiệu ứng.

Tôi sẽ chia spec của bạn thành 2 tầng:

Rule 1–8 = Iframe Safety

đảm bảo iframe không lỗi scroll, navigation, flicker, asset.

Rule 9–20 = Responsive & Mobile UX