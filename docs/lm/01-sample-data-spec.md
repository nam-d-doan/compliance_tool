# LM — Spec dữ liệu mẫu (30 hồ sơ)

Dùng để sinh dữ liệu trong `mocks/db.ts` ở GĐ1. Ngày tính theo offset so với `DEMO_TODAY` (2026-07-11, hằng số có sẵn trong `mocks/db.ts`), không dùng `new Date()`, để demo ổn định qua thời gian — theo đúng quy ước curated-data.ts hiện có.

## Phân bổ theo giai đoạn (mỗi giai đoạn 6 hồ sơ = 30)

| Giai đoạn | Số hồ sơ | Trạng thái mốc |
| --- | --- | --- |
| Khởi kiện | 6 | 4 đúng tiến độ, 1 trễ kế hoạch (đã dời ngày), 1 mới tạo hôm nay |
| Thụ lý | 6 | 4 đúng tiến độ, 2 trễ kế hoạch |
| Hòa giải | 6 | 5 đúng tiến độ, 1 sắp quá hạn hòa giải |
| Xét xử | 6 | 4 đúng tiến độ, 2 đã dời ngày xét xử |
| Thi hành án | 6 | 3 đang xử lý, 3 sắp hoàn thành (mốc thi hành án gần xong) |

## Cảnh báo đỏ (Red Flag) — phải có đủ 3 trạng thái để test

- **5 hồ sơ quá hạn** (deadline đã qua, chưa xử lý) — trải đều loại hạn: kháng cáo, án phí, gia hạn thi hành án
- **5 hồ sơ sắp đến hạn** (còn 1-3 ngày, trong ngưỡng cảnh báo placeholder ở `00-decisions.md`)
- **5 hồ sơ đã xử lý cảnh báo** (có lịch sử tiếp nhận + xử lý xong, để test KPI c)
- Còn lại: không có hạn pháp lý nào sắp tới (baseline không nhiễu)

## Phân bổ ưu tiên (cho test trọng số tải công việc)

- critical: 3 hồ sơ
- high: 8 hồ sơ
- medium: 14 hồ sơ
- low: 5 hồ sơ

## Phân bổ chuyên viên / đơn vị (cho KPI e — hiệu quả theo người/đơn vị)

- 5 chuyên viên (`owner` role), tải lệch nhau rõ: người A 10 hồ sơ, người B 8, người C 6, người D 4, người E 2 — để hộp thoại phân công có sự khác biệt rõ khi gợi ý người ít việc nhất
- Đơn vị/phòng ban: dùng lại danh mục có sẵn trong `mocks/db.ts` — ưu tiên `Legal`, `Retail Banking`, `Corporate Banking`, `Credit Risk`, `Operations`
- Nhóm vụ việc: rải đều 6 nhóm ở `00-decisions.md` mục 2 (khoảng 5 hồ sơ/nhóm)

## Tài liệu đính kèm (cho KPI d)

- 20 hồ sơ: đủ tài liệu bắt buộc theo giai đoạn hiện tại (theo danh mục ở `00-decisions.md` mục 4)
- 10 hồ sơ: thiếu ít nhất 1 tài liệu bắt buộc — để KPI d không ra 100% giả tạo

## Lịch sử thao tác (CaseEvent) — cho audit trail + KPI b

- Mỗi hồ sơ: tối thiểu 1 sự kiện "tạo mới"
- Hồ sơ đã qua ≥ 2 mốc: có sự kiện "cập nhật tiến độ" cho mỗi mốc đã qua
- 3 hồ sơ CỐ Ý thiếu sự kiện cập nhật cho 1 mốc đã qua — để KPI b (cập nhật tiến độ đầy đủ) không ra 100%

## Dư nợ và tài sản bảo đảm (chỉ để hiển thị, không tính KPI)

- Dư nợ: random 500 triệu đến 15 tỷ VND, lệch theo `nhóm vụ việc` (doanh nghiệp cao hơn cá nhân)
- Tài sản bảo đảm: mô tả ngắn kiểu có sẵn trong `curated-data.ts` (bất động sản, ô tô, sổ tiết kiệm...)

## Việc cần làm khi seed (GĐ1)

- [ ] Viết hàm sinh 30 `LitigationCase` theo bảng trên trong `mocks/db.ts`, seed bằng `faker.seed(42)` giống các entity khác
- [ ] Sinh `CaseMilestone` con cho mỗi hồ sơ theo giai đoạn hiện tại
- [ ] Sinh `LegalDeadline` theo mục "Cảnh báo đỏ" ở trên
- [ ] Sinh `CaseEvent` theo mục "Lịch sử thao tác"
- [ ] Gắn `fileIds` cho 20 hồ sơ đủ tài liệu, để trống hoặc thiếu cho 10 hồ sơ còn lại
