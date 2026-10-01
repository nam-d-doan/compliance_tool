# LAW — Kế hoạch triển khai (Phụ lục 3)

> Trạng thái: NHÁP. Mục có "⏳ CHỜ DUYỆT" là tạm, code theo giá trị mặc định để không chặn tiến độ, nhưng phải sửa lại khi có xác nhận. Khuôn file này giống `docs/lm/00-decisions.md` — tái dùng tối đa pattern đã có từ module LM.

## 0. Tổng quan

Hệ thống Quản lý Yêu cầu Tư vấn Pháp lý (Legal Advisory Workflow — LAW,
Phụ lục 3) là module thứ 2 trong hồ sơ chào giá, cùng đợt với LM (Phụ lục 2).
Nguồn: Phụ lục 2 và 3 + Thông báo mời chào giá 2698/2026/TB-NHNA-P.11
(14/9/2026).

**Giả định** (giống LM): mục tiêu trước mắt là bản demo cho hồ sơ chào giá,
viết theo đúng cách compliance_tool đang làm (types → mock → service → hook
→ trang). GĐ0-4 cho bản demo chạy dữ liệu giả; GĐ5 (SSO/Core Banking/kênh
thông báo thật) chỉ làm sau khi trúng thầu, có hạ tầng Nam A Bank thật.

**Điểm giống LM, tái dùng được trực tiếp:**
- Cơ cấu 3 cấp phân quyền (Quản lý/Chuyên viên/Đơn vị gửi yêu cầu) —
  **y hệt** cơ cấu đã làm cho LM (Quản lý/Chuyên viên/Đơn vị kinh doanh).
  Dùng lại đúng quyết định đã chốt ở `docs/lm/00-decisions.md` mục 1: role
  `executive` = Quản lý, `owner` = Chuyên viên, `business_unit` (pending,
  tạm dùng `owner` lọc theo đơn vị) = Đơn vị gửi yêu cầu.
- Audit trail, Notification, FileAttachment, AuditLog — dùng lại nguyên
  entity, chỉ thêm field liên kết (`requestId` thay vì `caseId`).
- Cảnh báo đỏ theo SLA — dùng lại nguyên lý `evaluateDeadlines`/`AlertRule`
  của LM (xem `lib/lm-alerts.ts`), chỉ đổi input.
- Dashboard/KPI — khuôn `LMDashboardPage` + `KPICard`/`PieChartCard`/
  `BarChartCard` dùng lại gần như nguyên.

**Điểm khác LM, phải viết mới:**
- Không có 5-mốc tiến trình (Khởi kiện→...→Thi hành án). LAW chỉ có 1 vòng
  đời đơn giản: Mới → Đang xử lý → Hoàn thành (+ Quá hạn tính riêng).
- Mức ưu tiên LAW gắn với CĂN CỨ PHÁP LÝ (Bắt buộc theo Luật / Quy định
  NHNN / Nội bộ), không phải mức độ nghiêm trọng chung chung như
  `PriorityLevel` hiện có (low/medium/high/critical) — cần enum riêng.
- Khai thác Tri thức (Knowledge Base): kho ý kiến tư vấn mẫu + án lệ nội
  bộ, tra cứu theo từ khóa. Không có tiền lệ trong code hiện tại — module
  mới hoàn toàn.
- KPI b của LAW là "chất lượng hồ sơ" (đạt yêu cầu ngay lần đầu, ít sửa
  lại) — khác KPI b của LM (cập nhật tiến độ đầy đủ).

## 1. Thực thể dữ liệu cần xây

Đặt trong `src/types/law.ts`, theo đúng khuôn `types/lm.ts`.

| Thực thể | Trường chính | Ghi chú |
| --- | --- | --- |
| `AdviceRequest` (yêu cầu tư vấn) | Mã (`LAW-2026-001`), tiêu đề, mô tả, đơn vị gửi yêu cầu, mức ưu tiên (`law_mandatory`/`sbv_regulation`/`internal`), ngày gửi, hạn SLA (tính từ mức ưu tiên), trạng thái (`new`/`in_progress`/`completed`/`overdue`), chuyên viên phụ trách, cấp quản lý, lần gửi có bị trả lại sửa không (cho KPI b) | Thực thể trung tâm, tương đương `LitigationCase` |
| `AdvisoryOpinion` (ý kiến tư vấn) | Yêu cầu, nội dung, file đính kèm, người ra ý kiến, thời điểm | Bằng chứng "đã đưa ra ý kiến tư vấn" — mục phi chức năng b |
| `LawEvent` (lịch sử thao tác) | Yêu cầu, loại thao tác, người làm, thời điểm, giá trị trước/sau | Giống `CaseEvent`, bất biến |
| `SlaRule` (cấu hình SLA) | Mức ưu tiên, số ngày xử lý, số ngày báo trước khi quá hạn | Giống `AlertRule` của LM — Admin chỉnh được |
| `KnowledgeBaseEntry` (tri thức) | Tiêu đề, danh mục, từ khóa/tag, tóm tắt, nội dung hoặc file đính kèm, người đăng, thời điểm | Module mới — không có tiền lệ |
| Dùng lại | `FileAttachment` (thêm `requestId`), `Notification`, `AuditLog`, `UserProfile` | Không tạo kiểu mới |

## 2. Phân quyền

| Cấp theo Phụ lục 3 | Role trong app | Quyền LAW | Thấy yêu cầu nào |
| --- | --- | --- | --- |
| Cấp Quản lý (Trưởng phòng/Ban) | `executive` (đã có) | Toàn quyền phê duyệt, xem Dashboard toàn hàng, điều phối nguồn lực | Toàn hệ thống |
| Cấp Chuyên viên | `owner` (đã có) | Quản lý chi tiết yêu cầu được giao, cập nhật tiến độ, ra ý kiến tư vấn | Yêu cầu được giao |
| Đơn vị gửi yêu cầu | `business_unit` (mới, giống LM) | Gửi yêu cầu, theo dõi trạng thái, nhận kết quả tư vấn | Yêu cầu của đơn vị mình |
| Quản trị hệ thống | `admin` (đã có) | Toàn quyền, cấu hình SLA | Toàn hệ thống |

Quyết định `business_unit` role dùng CHUNG cho cả LM và LAW (không tách 2
role riêng) — nếu Nam duyệt thêm role này cho LM thì LAW thừa hưởng luôn,
không cần xin duyệt lần 2.

## 3. Các giai đoạn

Mỗi giai đoạn kết thúc bằng 1 thứ demo được. Ước tính ngày công 1 người,
tính thô — LAW ước thấp hơn LM ở GĐ1-2 (vòng đời đơn giản hơn, không có
5-mốc) nhưng GĐ3 cao hơn (Knowledge Base là module mới).

| GĐ | Nội dung | Demo được gì khi xong | Ước tính |
| --- | --- | --- | --- |
| 0 | Chốt thiết kế | Các quyết định ở mục 5 đã chốt | 0,5 ngày |
| 1 | Nền tảng yêu cầu, lịch sử, phân quyền | Tạo/xem/sửa yêu cầu tư vấn; mọi thao tác có lịch sử | 2,5–3 ngày |
| 2 | SLA & phân công | Hạn tự tính theo mức ưu tiên, phân công theo tải, đôn đốc | 1,5–2 ngày |
| 3 | Cảnh báo đỏ & Khai thác tri thức | Cờ đỏ theo SLA; trang Knowledge Base tạo/tra cứu theo từ khóa | 2,5–3 ngày |
| 4 | Màn hình điều hành, KPI | Dashboard quản lý, báo cáo KPI a-c | 1,5–2 ngày |
| 5 | Lên hệ thống thật | Backend, SSO, Core Banking, kênh thông báo, UAT | Tùy hạ tầng Nam A Bank |

**Tổng GĐ0-4 (bản demo): ~8,5–10,5 ngày công.**

### GĐ 0: Chốt thiết kế
- [ ] Tạo nhánh `feat/law` từ `dev` (hoặc từ `feat/lm` nếu muốn kế thừa luôn code LM đã có)
- [ ] Chốt các mục ở phần 5 "Việc cần chốt trước khi code"
- [ ] Soạn bộ dữ liệu mẫu: ~20-25 yêu cầu trải đủ 3 trạng thái, đủ 3 mức ưu tiên, có yêu cầu sắp quá hạn/quá hạn, vài mục Knowledge Base mẫu

### GĐ 1: Nền tảng yêu cầu
- [ ] `types/law.ts`; hằng số mức ưu tiên, trạng thái trong `constants/law.ts`
- [ ] Dữ liệu mẫu trong `mocks/db.ts` (hoặc file riêng `mocks/law-db.ts` nếu `db.ts` đã quá dài — cân nhắc lúc code)
- [ ] `mocks/handlers/law_handlers.ts`: CRUD + lịch sử, theo khuôn `lm_handlers.ts` (bao gồm `recordEvent`)
- [ ] Đăng ký endpoint ở cả `mocks/handlers/index.ts` (MSW) và `mocks/directApi.ts` (dev) — thiếu 1 trong 2 chỉ chạy được 1 chế độ, đã gặp lỗi này ở LM
- [ ] `constants/api.ts`, `services/law_service.ts`, hooks, `lawKeys` trong `hooks/query-keys.ts`
- [ ] `pages/law/`: danh sách, chi tiết (tab Tổng quan/Ý kiến tư vấn/Lịch sử), tạo
- [ ] Route trong `routes/index.tsx`, tab "Tư vấn pháp lý" trong `navPills.ts`, quyền `law:*` trong `rbac.ts`

### GĐ 2: SLA & phân công
- [ ] Hạn SLA tự tính khi tạo yêu cầu, theo `SlaRule` của mức ưu tiên
- [ ] Đổi trạng thái `new` → `in_progress` → `completed`; ghi lịch sử mỗi lần đổi
- [ ] Hộp thoại phân công: tái dùng nguyên `computeOwnerWorkload`/`AssignList` của LM (đổi nguồn case sang request)
- [ ] Nút "Đôn đốc" — tái dùng nguyên cơ chế `handleRemindLMCase`

### GĐ 3: Cảnh báo đỏ & Khai thác tri thức
- [ ] Tái dùng `evaluateDeadlines`/`deadlineSeverity` của LM — tổng quát hoá
      `lib/lm-alerts.ts` thành `lib/deadline-alerts.ts` dùng chung cho cả 2
      module (tránh copy 2 bản logic giống hệt nhau)
- [ ] Trang cấu hình SLA trong mục Admin
- [ ] Nút "Đã tiếp nhận"/"Đã xử lý" trên cảnh báo
- [ ] `KnowledgeBaseEntry`: trang danh sách + tạo mới + tìm theo từ khóa/tag (client-side filter đủ cho demo, không cần search engine thật)

### GĐ 4: Màn hình điều hành, KPI
- [ ] Dashboard LAW cho cấp Quản lý: số yêu cầu theo trạng thái/mức ưu tiên, cờ đỏ, hiệu quả từng chuyên viên — tái dùng khuôn `LMDashboardPage`
- [ ] Trang báo cáo KPI a-c (xem mục 4)
- [ ] Kiểm tra trên điện thoại; `pnpm build`, `pnpm lint`; mở PR vào `dev`

### GĐ 5: Lên hệ thống thật
- Backend thay mock, giữ nguyên endpoint `/api/law/*`
- SSO, tích hợp Core Banking (dư nợ, thông tin khách hàng thời gian thực)
- Kênh thông báo thật (Email/SMS/Teams) — dùng chung hạ tầng gửi với LM nếu GĐ5 của LM đã làm trước
- Audit log lưu nơi không sửa được; rà soát bảo mật
- UAT, đào tạo, tài liệu hướng dẫn (giao phẩm)

## 4. KPI: công thức và dữ liệu

| KPI (Phụ lục 3, mục 3.2) | Công thức đề xuất | Dữ liệu phải ghi nhận |
| --- | --- | --- |
| a. Tỷ lệ hoàn thành đúng hạn | Số yêu cầu hoàn thành trong SLA ÷ tổng số yêu cầu hoàn thành trong kỳ | `submittedAt`, hạn SLA, `completedAt` |
| b. Chất lượng hồ sơ | Số yêu cầu không bị trả lại sửa ÷ tổng số yêu cầu hoàn thành | Cờ "có bị yêu cầu chỉnh sửa lại không" mỗi lần trả về (proxy demo — không có nghiệp vụ "review" thật) |
| c. Tỷ lệ xử lý Cảnh báo đỏ | Số cảnh báo được xử lý trước hạn ÷ tổng cảnh báo | Lúc bật cờ, lúc tiếp nhận, lúc xử lý xong — y hệt KPI c của LM |

## 5. Việc cần chốt trước khi code ⏳

- [ ] Role `business_unit`: dùng chung quyết định với LM hay LAW cần ngữ
      nghĩa khác? (đề xuất: dùng chung)
- [ ] Số ngày SLA mặc định cho mỗi mức ưu tiên (1/2/3) — **chưa có số nào
      trong Phụ lục 3**, cần hỏi Nam/bộ phận pháp chế trước khi đặt
      placeholder, không tự suy diễn như đã làm với `DEADLINE_TYPE_DEFAULT_DAYS_BEFORE`
      của LM (lần đó ít nhất có gợi ý ngữ cảnh, lần này Phụ lục 3 không
      nêu số ngày nào cả)
- [ ] Knowledge Base: nội dung mẫu lấy từ đâu (tự bịa án lệ demo hay cần
      Nam cung cấp ví dụ thật)? Mức độ "thông minh" của tra cứu cho demo —
      lọc từ khóa/tag đơn giản có đủ, hay cần thử nghiệm semantic search?
- [ ] Định dạng mã yêu cầu (đề xuất `LAW-YYYY-NNN`, giống LM)
- [ ] Làm trong nhánh `feat/law` riêng hay gộp chung `feat/lm` (2 module
      cùng 1 PR)? Đề xuất nhánh riêng, PR riêng — dễ review hơn.
- [ ] Hạn demo: giống LM, chốt theo ngày họp 05/10/2026. Nếu gấp, cắt theo
      thứ tự: Knowledge Base tra cứu nâng cao → xuất KPI CSV → Core
      Banking giả lập (giữ nguyên GĐ1-2, đó là lõi nghiệp vụ).
