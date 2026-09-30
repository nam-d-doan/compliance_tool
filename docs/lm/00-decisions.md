# LM — Quyết định GĐ0 (chốt thiết kế)

> Trạng thái: NHÁP. Mục có "⏳ CHỜ DUYỆT" là tạm, code theo giá trị mặc định để không chặn tiến độ, nhưng phải sửa lại khi có xác nhận.

## 1. business_unit role ⏳ CHỜ NAM DUYỆT

**Quyết định tạm:** KHÔNG thêm role mới ở GĐ1. Đơn vị kinh doanh dùng tạm role `owner` sẵn có, lọc hồ sơ theo `ownerDepartmentId`. Lý do: thêm role mới đụng `Role` type, `ROLE_HIERARCHY`, `ROLE_PERMISSIONS`, `demo-users.ts`, `DashboardRedirect`, `ROUTE_PERMISSIONS` — ảnh hưởng toàn app, đảo ngược tốn công nếu Nam không đồng ý.

Nếu Nam duyệt thêm `business_unit`: làm ở nhánh riêng sau, không chặn GĐ1-4.

## 2. Nhóm vụ việc (case category) — cho KPI e

Đề xuất, dùng luôn (rủi ro thấp, sửa dễ vì chỉ là 1 enum):

- Nợ xấu tín dụng cá nhân
- Nợ xấu tín dụng doanh nghiệp
- Tranh chấp hợp đồng tín dụng
- Xử lý tài sản bảo đảm
- Thi hành án dân sự
- Khác

## 3. Loại hạn pháp lý + số ngày báo trước ⏳ CHỜ DÂN LUẬT XÁC NHẬN

**KHÔNG được coi số ngày dưới đây là đúng luật.** Chỉ là placeholder để `AlertRule` có giá trị chạy demo. Phải hỏi lại bộ phận pháp lý trước khi dùng thật.

| Loại hạn | Số ngày báo trước (placeholder) |
| --- | --- |
| Kháng cáo | 15 |
| Đóng án phí | 7 |
| Gia hạn thi hành án | 30 |
| Khác | 7 |

## 4. Danh mục tài liệu bắt buộc theo giai đoạn — cho KPI d

Đề xuất, sửa dễ (chỉ là danh sách hiển thị + check đủ/thiếu):

| Giai đoạn | Tài liệu bắt buộc |
| --- | --- |
| Khởi kiện | Đơn khởi kiện; Hợp đồng tín dụng; Chứng từ giải ngân |
| Thụ lý | Thông báo thụ lý của Tòa án |
| Hòa giải | Biên bản hòa giải (nếu có hòa giải) |
| Xét xử | Bản án/Quyết định của Tòa án |
| Thi hành án | Quyết định thi hành án; Biên bản thi hành án |

## 5. Cách tính tải công việc

Trọng số theo `PriorityLevel` sẵn có trong `constants/status.ts`, nhân với số hồ sơ đang mở của chuyên viên:

```
low = 1, medium = 2, high = 3, critical = 5
tải(người) = Σ trọng số ưu tiên của các hồ sơ đang mở được giao cho người đó
```

Người có tải thấp nhất được gợi ý khi phân công.

## 6. Định dạng mã vụ việc

`LM-YYYY-NNN` (ví dụ `LM-2026-001`), giống mã `OBG-YYYY-NNN` của Obligation. Sinh tự động trong handler.

## 7. Hạn nộp chào giá / ngày demo

**Chốt:** họp đầu tiên 05/10/2026. Nếu gấp, cắt theo thứ tự: AI giả lập → xuất KPI CSV → Core Banking giả lập (bỏ 3 cái này trước, giữ nguyên GĐ1-2 vì đó là lõi nghiệp vụ).
