/**
 * Side menu and the three CMS modules (Document Library, Task Management,
 * Compliance Issues) added in the 3-module restructure of 09/10/2026.
 */
export const MODULES: Record<string, string> = {
  // Side menu & shell
  "CMS · Nam A Bank": "CMS · Nam A Bank",
  "Document Library": "Thư viện văn bản",
  "Task Management": "Quản lý công việc",
  "Compliance Issues": "Vấn đề tuân thủ",
  "Signed in as": "Đăng nhập với vai trò",
  "Compliance (CMS owner)": "Bộ phận Tuân thủ (CMS owner)",
  Department: "Phòng/Ban",
  "System admin": "Quản trị hệ thống",
  Executive: "Ban lãnh đạo",
  "Open menu": "Mở menu",
  "Search laws, QĐNB, tasks and issues…":
    "Tìm văn bản, QĐNB, công việc, vấn đề…",
  "Search laws, QĐNB, tasks and issues": "Tìm văn bản, QĐNB, công việc, vấn đề",
  "Search documents": "Tra cứu văn bản",
  "Compliance obligations": "Nghĩa vụ tuân thủ",
  "Task list": "Danh sách công việc",
  "Late-issuance alerts": "Cảnh báo chậm ban hành",
  "Issue list": "Danh sách vấn đề",
  "Users & roles": "Người dùng & phân quyền",
  "Task workflow setup": "Cấu hình luồng công việc",
  "Task Workflow": "Luồng công việc",

  // Library
  "Loading the library…": "Đang tải thư viện…",
  "Loading the library": "Đang tải thư viện",
  "Laws and regulations from the authorities together with Nam A Bank's internal regulations (QĐNB), in one place.":
    "Văn bản pháp luật của cơ quan quản lý và quy định nội bộ (QĐNB) của Nam A Bank, tập trung một nơi.",
  "Laws and regulations from the authorities together with Nam A Bank's internal regulations (QĐNB), in one place":
    "Văn bản pháp luật của cơ quan quản lý và quy định nội bộ (QĐNB) của Nam A Bank, tập trung một nơi",
  "Check official feeds": "Kiểm tra nguồn chính thức",
  "Add document (OCR)": "Thêm văn bản (OCR)",
  "Search by number, title or content — e.g. “cho vay bất động sản”":
    "Tìm theo số hiệu, tên hoặc nội dung — vd. “cho vay bất động sản”",
  "Search by number, title or content": "Tìm theo số hiệu, tên hoặc nội dung",
  "Semantic search understands meaning and banking synonyms (RFQ 5.1)":
    "Tìm kiếm ngữ nghĩa hiểu ý nghĩa và từ đồng nghĩa ngân hàng (RFQ 5.1)",
  "AI semantic search": "Tìm kiếm ngữ nghĩa AI",
  "AI semantic search on": "Tìm kiếm ngữ nghĩa AI: bật",
  "AI semantic search off": "Tìm kiếm ngữ nghĩa AI: tắt",
  "Laws & regulations": "Văn bản pháp luật",
  "Internal regulations": "Quy định nội bộ",
  "All issuers": "Mọi cơ quan ban hành",
  "All fields": "Mọi lĩnh vực",
  "Any validity": "Mọi hiệu lực",
  "In force": "Đang có hiệu lực",
  "Not yet in force": "Chưa có hiệu lực",
  "Any year": "Mọi năm",
  "Clear search": "Xoá tìm kiếm",
  "Try:": "Thử:",
  "document(s)": "văn bản",
  "Newest first": "Mới nhất trước",
  "By effective date": "Theo ngày hiệu lực",
  "AI is reading the documents…": "AI đang đọc văn bản…",
  "No document matches. Try other words or switch on AI semantic search.":
    "Không có văn bản phù hợp. Thử từ khoá khác hoặc bật tìm kiếm ngữ nghĩa AI.",
  "Law / regulation": "Văn bản pháp luật",
  "Internal regulation": "Quy định nội bộ",
  "Being revised": "Đang sửa đổi",
  "New & amended documents": "Văn bản mới ban hành / sửa đổi",
  "Alerts from the official feeds (NHNN, Chính phủ, Quốc hội…) and newly issued QĐNB versions":
    "Cảnh báo từ nguồn chính thức (NHNN, Chính phủ, Quốc hội…) và phiên bản QĐNB mới ban hành",
  Amendment: "Sửa đổi",
  "QĐNB issued": "QĐNB đã ban hành",
  "AI relevance to Nam A Bank": "Mức liên quan đến Nam A Bank (AI)",
  "Sources: vbpl.vn, Công báo, NHNN, VietLex":
    "Nguồn: vbpl.vn, Công báo, NHNN, VietLex",

  // Law & QĐNB detail
  "Back to the Document Library": "Quay lại Thư viện văn bản",
  Download: "Tải về",
  "Assign task": "Giao việc",
  Obligations: "Nghĩa vụ",
  "Internal regulations affected": "QĐNB bị ảnh hưởng",
  "Basic info": "Thông tin cơ bản",
  Scope: "Phạm vi",
  "Basic information": "Thông tin cơ bản",
  Number: "Số hiệu",
  "Field (AI)": "Lĩnh vực (AI)",
  "Relevance to Nam A Bank": "Mức liên quan đến Nam A Bank",
  "Why it matters": "Lý do quan trọng",
  "Related documents": "Văn bản liên quan",
  "Documents this one amends, replaces or guides":
    "Văn bản được sửa đổi, thay thế hoặc hướng dẫn",
  "Full text": "Toàn văn",
  "article(s)": "điều",
  "Tasks created from this document": "Công việc tạo từ văn bản này",
  "Open Task Management": "Mở Quản lý công việc",
  "Compliance obligations from this document":
    "Nghĩa vụ tuân thủ từ văn bản này",
  "What the bank must do to comply, tracked in the obligation register":
    "Những việc ngân hàng phải làm để tuân thủ, theo dõi trong sổ nghĩa vụ",
  "Add obligation": "Thêm nghĩa vụ",
  "Not in the obligation register yet": "Chưa có trong sổ nghĩa vụ",
  "Register the document to create and track its obligations.":
    "Đăng ký văn bản để tạo và theo dõi nghĩa vụ.",
  "Register the document to create and track its obligations":
    "Đăng ký văn bản để tạo và theo dõi nghĩa vụ",
  Register: "Đăng ký",
  "Registered — obligations can now be added":
    "Đã đăng ký — có thể thêm nghĩa vụ",
  "No obligation recorded yet. Use the AI suggestions below or “Add obligation”.":
    "Chưa có nghĩa vụ. Dùng gợi ý AI bên dưới hoặc “Thêm nghĩa vụ”.",
  "AI-suggested obligations": "Nghĩa vụ do AI gợi ý",
  "One per article that sets a requirement — confirm before adding":
    "Mỗi điều khoản đặt ra yêu cầu là một nghĩa vụ — xác nhận trước khi thêm",
  "One per article that sets a requirement": "Mỗi điều khoản đặt ra yêu cầu",
  "confirm before adding": "xác nhận trước khi thêm",
  "Every action on this document (audit trail)":
    "Mọi thao tác trên văn bản này (nhật ký)",
  "Internal regulation of Nam A Bank": "Quy định nội bộ của Nam A Bank",
  "Current version": "Phiên bản hiện hành",
  "Latest change": "Thay đổi gần nhất",
  "Who and what this regulation covers": "Đối tượng và phạm vi áp dụng",
  "Business field": "Lĩnh vực nghiệp vụ",
  "Units involved in revisions": "Đơn vị tham gia sửa đổi",
  "Laws implemented": "Số văn bản pháp luật thực thi",
  Articles: "Số điều",
  "Applies to": "Áp dụng cho",
  "Head office and all branches": "Hội sở và toàn bộ chi nhánh",
  "Laws mapped to this regulation":
    "Văn bản pháp luật liên kết với quy định này",
  "Only the links of this document": "Chỉ các liên kết của văn bản này",
  "Tasks that changed this regulation": "Công việc đã sửa đổi quy định này",
  "Open a task to see its workflow": "Mở công việc để xem luồng xử lý",
  "No task yet.": "Chưa có công việc.",
  "No task yet": "Chưa có công việc",
  "Every action on this regulation and its revisions":
    "Mọi thao tác trên quy định này và các lần sửa đổi",
  "Open revision task": "Mở công việc sửa đổi",
  "Open task": "Mở công việc",

  // Task list
  "Loading tasks…": "Đang tải công việc…",
  "Loading tasks": "Đang tải công việc",
  "Work Compliance has assigned to departments to update or issue internal regulations, and how far each task has come.":
    "Công việc Bộ phận Tuân thủ đã giao cho các phòng/ban để cập nhật, ban hành quy định nội bộ và tiến độ từng việc.",
  "Work Compliance has assigned to departments to update or issue internal regulations, and how far each task has come":
    "Công việc Bộ phận Tuân thủ đã giao cho các phòng/ban để cập nhật, ban hành quy định nội bộ và tiến độ từng việc",
  "Assign from a law": "Giao việc từ văn bản",
  "Department view: tasks where": "Góc nhìn phòng/ban: công việc mà",
  "is the lead or a supporting unit.": "chủ trì hoặc phối hợp.",
  "My department only": "Chỉ phòng/ban của tôi",
  "Not started": "Chưa thực hiện",
  "In progress": "Đang thực hiện",
  "Review & approval": "Rà soát & phê duyệt",
  "Issued — to complete": "Đã ban hành — chờ hoàn tất",
  "Issued / completed": "Đã ban hành / hoàn thành",
  "waiting to be closed": "chờ đóng",
  "Late-issuance risk": "Nguy cơ chậm ban hành",
  "deadline request(s) pending": "đề nghị gia hạn đang chờ",
  "Tasks by lead department": "Công việc theo đơn vị chủ trì",
  "Open, overdue and done": "Đang mở, quá hạn và hoàn thành",
  "Tasks by status": "Công việc theo trạng thái",
  Open: "Đang mở",
  Done: "Hoàn thành",
  "Search task, QĐNB, law, department or officer…":
    "Tìm công việc, QĐNB, văn bản, phòng/ban hoặc cán bộ…",
  "All departments": "Tất cả phòng/ban",
  "All statuses": "Tất cả trạng thái",
  "Any deadline": "Mọi thời hạn",
  "Due within 7 days": "Đến hạn trong 7 ngày",
  "Due within 30 days": "Đến hạn trong 30 ngày",
  "All source laws": "Mọi văn bản nguồn",
  "Deadline request pending": "Có đề nghị gia hạn",
  "task(s)": "công việc",
  Task: "Công việc",
  Departments: "Phòng/Ban",
  "Current step": "Bước hiện tại",
  "(returned)": "(bị trả lại)",
  "Deadline request": "Đề nghị gia hạn",
  "No task matches these filters.": "Không có công việc phù hợp bộ lọc.",
  "Deadlines ahead": "Hạn sắp tới",
  "Committed dates of open tasks": "Hạn cam kết của công việc đang mở",
  "No open task.": "Không có công việc đang mở.",

  // Task detail
  "Back to Task Management": "Quay lại Quản lý công việc",
  "Lead unit (chủ trì)": "Đơn vị chủ trì",
  "Supporting units (phối hợp)": "Đơn vị phối hợp",
  "Responsible officer": "Cán bộ phụ trách",
  Deadline: "Hạn chót",
  "Response deadline": "Hạn phản hồi",
  "Task completed": "Công việc đã hoàn thành",
  "The issued regulation and its version history are kept in the Document Library.":
    "Quy định đã ban hành và lịch sử phiên bản được lưu trong Thư viện văn bản.",
  "Returned for changes": "Bị trả lại để chỉnh sửa",
  "Waiting for": "Đang chờ",
  "Switch to the Compliance (CMS owner) role to continue.":
    "Chuyển sang vai trò Bộ phận Tuân thủ để tiếp tục.",
  "Switch to the Department role to continue.":
    "Chuyển sang vai trò Phòng/Ban để tiếp tục.",
  "Switch to the Executive role to approve.":
    "Chuyển sang vai trò Ban lãnh đạo để phê duyệt.",
  Compliance: "Bộ phận Tuân thủ",
  "Lead department": "Phòng/ban chủ trì",
  "Approver (TGĐ / HĐQT)": "Cấp phê duyệt (TGĐ / HĐQT)",
  "What Compliance asks": "Nội dung Tuân thủ giao",
  "Note to Compliance (optional)": "Ghi chú gửi Tuân thủ (không bắt buộc)",
  "Accept task": "Tiếp nhận công việc",
  "Task accepted — drafting can start": "Đã tiếp nhận — bắt đầu dự thảo",
  "Need more time? Use “Request deadline change” on the right.":
    "Cần thêm thời gian? Dùng “Đề nghị gia hạn” ở bên phải.",
  "Compliance returned the draft": "Tuân thủ đã trả lại dự thảo",
  "Upload draft": "Tải lên dự thảo",
  "What changed in this draft (optional)":
    "Nội dung thay đổi của dự thảo (không bắt buộc)",
  "Save draft": "Lưu dự thảo",
  "Update progress": "Cập nhật tiến độ",
  "Progress updated": "Đã cập nhật tiến độ",
  "Forecast issue date": "Ngày ban hành dự kiến",
  "Submit draft": "Gửi dự thảo",
  "for review": "để rà soát",
  "Upload at least one draft first.": "Cần tải lên ít nhất một dự thảo.",
  "Review comment — required to return the draft":
    "Ý kiến rà soát — bắt buộc khi trả lại dự thảo",
  "Pass review, send for approval": "Đạt rà soát, trình phê duyệt",
  "Return to department": "Trả lại phòng/ban",
  "Review passed — sent for approval": "Đạt rà soát — đã trình phê duyệt",
  "Draft returned to the department": "Đã trả dự thảo cho phòng/ban",
  "Approval note (optional)": "Ghi chú phê duyệt (không bắt buộc)",
  "Approve for issuance": "Phê duyệt ban hành",
  "Approved — the department can issue it":
    "Đã phê duyệt — phòng/ban có thể ban hành",
  "Record the decision number, the issue and effective dates and the signed file. The internal regulation gets a new version in the Document Library.":
    "Ghi nhận số quyết định, ngày ban hành, ngày hiệu lực và file đã ký. Quy định nội bộ sẽ có phiên bản mới trong Thư viện văn bản.",
  "Record issuance & evidence": "Ghi nhận ban hành & bằng chứng",
  "Link every internal regulation issued for this task. The task cannot be completed without at least one.":
    "Liên kết mọi quy định nội bộ đã ban hành cho công việc này. Phải có ít nhất một văn bản mới được hoàn tất.",
  "Add another issued QĐNB…": "Thêm QĐNB đã ban hành khác…",
  "Remove link": "Bỏ liên kết",
  Link: "Liên kết",
  "Complete task": "Hoàn tất công việc",
  "Mark step as done": "Đánh dấu hoàn thành bước",
  "Step marked as done": "Đã hoàn thành bước",
  Workflow: "Luồng xử lý",
  "Every step with who did it and when; drafts and evidence are kept":
    "Từng bước, ai thực hiện và khi nào; dự thảo và bằng chứng được lưu lại",
  "evidence required": "bắt buộc bằng chứng",
  Waiting: "Đang chờ",
  "Linked documents": "Văn bản liên kết",
  "Open them in the Document Library": "Mở trong Thư viện văn bản",
  "Because of (law)": "Căn cứ (văn bản pháp luật)",
  "Internal regulation to change": "Quy định nội bộ cần thay đổi",
  "Deadline changes": "Điều chỉnh thời hạn",
  "Who asked, who approved": "Ai đề nghị, ai phê duyệt",
  "Request change": "Đề nghị gia hạn",
  Reason: "Lý do",
  "Send request": "Gửi đề nghị",
  "Request sent to Compliance": "Đã gửi đề nghị cho Tuân thủ",
  "The deadline has not been changed.": "Thời hạn chưa được điều chỉnh.",
  "The deadline has not been changed": "Thời hạn chưa được điều chỉnh",
  Pending: "Đang chờ",
  Approved: "Đã duyệt",
  Rejected: "Từ chối",
  "Asked by": "Đề nghị bởi",
  "Decision note (optional)": "Ghi chú quyết định (không bắt buộc)",
  "New deadline approved": "Đã duyệt thời hạn mới",
  "Request rejected": "Đã từ chối đề nghị",
  "Waiting for Compliance to decide.": "Đang chờ Tuân thủ quyết định.",
  "Sent 30, 14, 7 and 1 day(s) before the deadline, then daily when overdue.":
    "Gửi trước hạn 30, 14, 7 và 1 ngày, sau đó hằng ngày khi quá hạn.",
  "Sent 30, 14, 7 and 1 day(s) before the deadline, then daily when overdue":
    "Gửi trước hạn 30, 14, 7 và 1 ngày, sau đó hằng ngày khi quá hạn",
  "Every action on this task (audit trail)":
    "Mọi thao tác trên công việc này (nhật ký)",
  "Risk of late issuance": "Nguy cơ chậm ban hành",
  "Reminders and escalation follow the overdue rules.":
    "Nhắc hạn và leo thang theo quy tắc quá hạn.",
  "Reminders and escalation follow the overdue rules":
    "Nhắc hạn và leo thang theo quy tắc quá hạn",

  // Workflow template step names (seed)
  "Compliance assigns the task": "Tuân thủ giao việc",
  "Department accepts": "Phòng/ban tiếp nhận",
  "Draft the new text": "Dự thảo văn bản",
  "Compliance review": "Tuân thủ rà soát",
  "Approval (TGĐ / HĐQT)": "Phê duyệt (TGĐ / HĐQT)",
  "Issue & record evidence": "Ban hành & lưu bằng chứng",
  "Complete — link issued QĐNB": "Hoàn tất — liên kết QĐNB đã ban hành",
  "Source law(s), the QĐNB to change, what to do, lead and support units, deadlines.":
    "Văn bản nguồn, QĐNB cần thay đổi, nội dung công việc, đơn vị chủ trì/phối hợp, thời hạn.",
  "The lead unit confirms the task or asks to change the deadline.":
    "Đơn vị chủ trì xác nhận công việc hoặc đề nghị điều chỉnh thời hạn.",
  "The lead unit confirms the task or asks to change the deadline":
    "Đơn vị chủ trì xác nhận công việc hoặc đề nghị điều chỉnh thời hạn",
  "Draft 1, 2… are uploaded and kept.":
    "Dự thảo 1, 2… được tải lên và lưu lại.",
  "Draft 1, 2… are uploaded and kept": "Dự thảo 1, 2… được tải lên và lưu lại",
  "Compliance checks the draft against the law, or returns it.":
    "Tuân thủ đối chiếu dự thảo với quy định pháp luật hoặc trả lại.",
  "Compliance checks the draft against the law, or returns it":
    "Tuân thủ đối chiếu dự thảo với quy định pháp luật hoặc trả lại",
  "The signing level approves the final draft.":
    "Cấp ký phê duyệt dự thảo cuối cùng.",
  "Decision number, dates and the signed file; the QĐNB gets a new version.":
    "Số quyết định, ngày và file đã ký; QĐNB có phiên bản mới.",
  "The task is linked to one or more issued QĐNB in the Library before it can be completed.":
    "Công việc phải liên kết với một hoặc nhiều QĐNB đã ban hành trong Thư viện trước khi hoàn tất.",
  "The task is linked to one or more issued QĐNB in the Library before it can be completed":
    "Công việc phải liên kết với một hoặc nhiều QĐNB đã ban hành trong Thư viện trước khi hoàn tất",

  // Admin — task workflow
  "Loading the task workflow…": "Đang tải luồng công việc…",
  "The steps every assigned task goes through, from Compliance's assignment to the issued internal regulation. Set each step like a rule.":
    "Các bước mọi công việc được giao phải trải qua, từ khi Tuân thủ giao việc đến khi quy định nội bộ được ban hành. Thiết lập từng bước như cấu hình rule.",
  "The steps every assigned task goes through, from Compliance's assignment to the issued internal regulation. Set each step like a rule":
    "Các bước mọi công việc được giao phải trải qua, từ khi Tuân thủ giao việc đến khi quy định nội bộ được ban hành. Thiết lập từng bước như cấu hình rule",
  Discard: "Huỷ thay đổi",
  "Save workflow": "Lưu luồng công việc",
  "Workflow saved — applies to every task":
    "Đã lưu — áp dụng cho mọi công việc",
  "How it works": "Cách hoạt động",
  "A task moves to the next step only when the responsible party finishes the current one. Built-in steps (lock icon) can be renamed and re-timed but not removed. Extra steps":
    "Công việc chỉ chuyển bước khi bên phụ trách hoàn thành bước hiện tại. Các bước mặc định (biểu tượng khoá) có thể đổi tên, đổi thời hạn nhưng không xoá được. Có thể thêm bước",
  "for example “Collect opinions from supporting units”":
    "ví dụ “Lấy ý kiến đơn vị phối hợp”",
  "can be added between them and appear on every task straight away.":
    "vào giữa và bước mới hiển thị ngay trên mọi công việc.",
  "can be added between them and appear on every task straight away":
    "vào giữa và bước mới hiển thị ngay trên mọi công việc",
  Steps: "Các bước",
  "steps ·": "bước ·",
  "working days in total": "ngày làm việc tổng cộng",
  "New step": "Bước mới",
  "Description shown on the task": "Mô tả hiển thị trên công việc",
  Responsible: "Phụ trách",
  Days: "Số ngày",
  "Evidence required": "Bắt buộc bằng chứng",
  "Built-in": "Mặc định",
  "Move up": "Lên",
  "Move down": "Xuống",
  "Remove step": "Xoá bước",
  "Add a step here": "Thêm bước tại đây",

  // Issues
  "Issues that have been reported or assigned.":
    "Các vấn đề đã được ghi nhận hoặc giao xử lý.",
  "Every compliance issue that has been reported or assigned — from inspections, audits (incl. P.KTKSNB), self-checks and monitoring — rated with the bank's risk matrix.":
    "Mọi vấn đề tuân thủ đã được ghi nhận hoặc giao xử lý — từ thanh tra, kiểm toán (gồm P.KTKSNB), tự kiểm tra và giám sát — xếp hạng theo ma trận rủi ro của ngân hàng.",
  "Every compliance issue that has been reported or assigned":
    "Mọi vấn đề tuân thủ đã được ghi nhận hoặc giao xử lý",
  "from inspections, audits (incl. P.KTKSNB), self-checks and monitoring":
    "từ thanh tra, kiểm toán (gồm P.KTKSNB), tự kiểm tra và giám sát",
  "rated with the bank's risk matrix.":
    "xếp hạng theo ma trận rủi ro của ngân hàng.",
  "rated with the bank's risk matrix":
    "xếp hạng theo ma trận rủi ro của ngân hàng",
  "Every issue follows one path: Record → Receive → Submit evidence → Compliance review → Approve closure. High-risk and overdue issues escalate automatically.":
    "Mọi vấn đề theo một luồng: Ghi nhận → Tiếp nhận → Nộp bằng chứng → Thẩm định → Phê duyệt đóng. Vấn đề rủi ro cao và quá hạn tự động leo thang.",
  "Every issue follows one path": "Mọi vấn đề theo một luồng",
  "Approve closure. High-risk and overdue issues escalate automatically":
    "Phê duyệt đóng. Vấn đề rủi ro cao và quá hạn tự động leo thang",
  Record: "Ghi nhận",
  Receive: "Tiếp nhận",
  "Issue workflow": "Luồng xử lý vấn đề",
  "Unit confirms the finding": "Đơn vị xác nhận phát hiện",
  "confirm the finding with the unit": "xác nhận phát hiện với đơn vị",
  "Action plan": "Kế hoạch hành động",
  "Add action": "Thêm hành động",
  "Action to take": "Hành động cần thực hiện",
  "No action yet.": "Chưa có hành động.",
  "Action added": "Đã thêm hành động",
  "Action marked done": "Đã hoàn thành hành động",
  "Action reopened": "Đã mở lại hành động",
  done: "hoàn thành",
  due: "hạn",
  overdue: "quá hạn",
  "· evidence required": "· bắt buộc bằng chứng",
  "· signed": "· ký",
  "· proof": "· bằng chứng",
  "· due": "· hạn",
  "· overdue": "· quá hạn",
  "The deadline": "Hạn chót",
  "has passed": "đã qua",
  "the bank is exposed until the regulation is issued":
    "ngân hàng chịu rủi ro cho đến khi quy định được ban hành",
  "is after the": "muộn hơn",
  "or too little is done with the deadline close":
    "hoặc tiến độ còn thấp khi sắp đến hạn",
  "Legal mapping (": "Liên kết pháp lý (",
  "Tasks (": "Công việc (",
  "Versions (": "Phiên bản (",
  "Full text —": "Toàn văn —",
  Step: "Bước",
};
