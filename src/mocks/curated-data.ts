/**
 * Curated mock data based on Vietnam banking compliance research.
 *
 * Source: docs/deep-research-report.md — Basel III (Circular 14/2025,
 * Circular 83/2025), AML/CFT (Law 14/2022, Circular 27/2025), and
 * Fraud Risk Management.
 *
 * All dates are ISO strings. Due-date offsets (days from "today") keep
 * the demo relevant regardless of when it runs: negative = past/overdue,
 * positive = future. Dynamic fields (ownerId, approverId, etc.) are
 * filled in by db.ts generator functions at runtime.
 */

// ---------------------------------------------------------------------------
// Regulations
// ---------------------------------------------------------------------------

export interface CuratedArticle {
  number: string;
  title: string;
  summary: string;
}

export interface CuratedRegulation {
  id: string;
  title: string;
  description: string;
  category: string;
  regulatoryBody: string;
  effectiveDate: string;
  expirationDate?: string;
  status: string;
  priority: string;
  source: "internal" | "external";
  articles: CuratedArticle[];
}

export const CURATED_REGULATIONS: CuratedRegulation[] = [
  {
    id: "reg-law-ci-2024",
    title: "Luật Tổ chức tín dụng 2024 (No. 32/2024/QH15)",
    description:
      "Luật Tổ chức tín dụng 2024 quy định về thành lập, tổ chức, hoạt động, kiểm soát nội bộ, quản trị rủi ro của các tổ chức tín dụng. Thay thế Luật Tổ chức tín dụng 2010, đặt nền móng cho Thông tư 14/2025 và Thông tư 83/2025.",
    category: "Quản trị nội bộ",
    regulatoryBody: "Quốc hội Việt Nam (National Assembly)",
    effectiveDate: "2024-07-01T00:00:00.000Z",
    status: "Effective",
    priority: "critical",
    source: "internal",
    articles: [
      {
        number: "1",
        title: "Phạm vi điều chỉnh",
        summary:
          "Quy định về tổ chức, hoạt động, kiểm soát nội bộ của tổ chức tín dụng.",
      },
      {
        number: "10",
        title: "Thành lập ngân hàng thương mại",
        summary: "Điều kiện, thủ tục thành lập ngân hàng thương mại.",
      },
      {
        number: "28",
        title: "Quản trị của ngân hàng",
        summary: "Hội đồng quản trị, ban kiểm soát, ban tổng giám đốc.",
      },
      {
        number: "33",
        title: "Kiểm soát nội bộ",
        summary: "Yêu cầu chung về hệ thống kiểm soát nội bộ.",
      },
      {
        number: "55",
        title: "Kiểm soát rủi ro gian lận và hoạt động",
        summary:
          "Ngân hàng phải áp dụng biện pháp kiểm soát để ngăn ngừa, phát hiện, xử lý hành vi gian lận trong hoạt động.",
      },
      {
        number: "57",
        title: "Hệ thống kiểm soát nội bộ",
        summary:
          "Ngân hàng phải thiết lập hệ thống kiểm soát nội bộ gồm kiểm soát hoạt động quản lý rủi ro, kiểm toán nội bộ. Áp dụng ba tuyến phòng vệ.",
      },
      {
        number: "58",
        title: "Quản lý rủi ro",
        summary:
          "Yêu cầu nhận diện, đo lường, kiểm soát các loại rủi ro trọng yếu.",
      },
      {
        number: "60",
        title: "Kiểm toán nội bộ",
        summary:
          "Kiểm toán nội bộ hoạt động độc lập, đánh giá hiệu quả hệ thống kiểm soát nội bộ.",
      },
      {
        number: "72",
        title: "Cấp tín dụng",
        summary:
          "Quy định về hoạt động cấp tín dụng, thẩm định, quản lý rủi ro tín dụng.",
      },
      {
        number: "91",
        title: "Xử lý rủi ro",
        summary: "Phân loại nợ, trích lập dự phòng, xử lý rủi ro tín dụng.",
      },
      {
        number: "120",
        title: "Xử lý vi phạm",
        summary: "Các chế tài xử lý vi phạm của tổ chức tín dụng.",
      },
      {
        number: "135",
        title: "Hiệu lực thi hành",
        summary: "Quy định chuyển tiếp và hiệu lực thi hành.",
      },
    ],
  },
  {
    id: "reg-cir14-2025",
    title: "Thông tư 14/2025/TT-NHNN — Tỷ lệ an toàn vốn (Basel III)",
    description:
      "Quy định tỷ lệ an toàn vốn theo Basel III đối với ngân hàng thương mại, chi nhánh ngân hàng nước ngoài. Thay thế Thông tư 41/2016 và Thông tư 13/2018. Áp dụng từ 15/09/2025, lộ trình chuyển đổi đến 01/01/2030.",
    category: "An toàn vốn",
    regulatoryBody: "Ngân hàng Nhà nước Việt Nam (SBV)",
    effectiveDate: "2025-09-15T00:00:00.000Z",
    status: "Effective",
    priority: "critical",
    source: "internal",
    articles: [
      {
        number: "1",
        title: "Phạm vi điều chỉnh và đối tượng áp dụng",
        summary:
          "Áp dụng cho tất cả ngân hàng thương mại và chi nhánh ngân hàng nước ngoài. Ngân hàng dưới kiểm soát đặc biệt được miễn một số quy định.",
      },
      {
        number: "2",
        title: "Giải thích từ ngữ",
        summary:
          "Định nghĩa các thuật ngữ về vốn, tài sản có rủi ro, hệ số rủi ro.",
      },
      {
        number: "5",
        title: "Tỷ lệ an toàn vốn tối thiểu",
        summary: "CET1 ≥ 4.5%, Tier 1 ≥ 6%, Tổng vốn ≥ 8% RWA theo Basel III.",
      },
      {
        number: "7",
        title: "Vốn cấp 1 cơ bản (CET1)",
        summary:
          "Định nghĩa và cách tính vốn cấp 1 cơ bản, các khoản giảm trừ.",
      },
      {
        number: "9",
        title: "Vốn cấp 1 bổ sung (AT1)",
        summary: "Định nghĩa và cách tính vốn cấp 1 bổ sung.",
      },
      {
        number: "11",
        title: "Vốn cấp 2",
        summary: "Định nghĩa và cách tính vốn cấp 2.",
      },
      {
        number: "13",
        title: "Bộ đệm bảo toàn vốn (CCB) và bộ đệm chống chu kỳ (CCyB)",
        summary:
          "CCB 2.5% CET1, CCyB theo quy định. Ngân hàng phải duy trì vốn bổ sung trên mức tối thiểu.",
      },
      {
        number: "15",
        title: "Tài sản có rủi ro (RWA)",
        summary:
          "Phương pháp tính RWA cho rủi ro tín dụng, rủi ro thị trường, rủi ro hoạt động.",
      },
      {
        number: "17",
        title: "Cho vay bất động sản và hệ số rủi ro theo LTV",
        summary:
          "Hệ số rủi ro tín dụng cho vay bất động sản theo tỷ lệ LTV, vay nhà ở xã hội được giảm hệ số.",
      },
      {
        number: "18",
        title: "Rủi ro tín dụng — Tiếp cận chuẩn",
        summary: "Phương pháp tiếp cận chuẩn (SA) cho rủi ro tín dụng.",
      },
      {
        number: "20",
        title: "Rủi ro hoạt động — Phương pháp chỉ số cơ bản (SMA)",
        summary:
          "Tính tỷ lệ rủi ro hoạt động theo phương pháp đơn giản dựa trên doanh thu.",
      },
      {
        number: "21",
        title: "Rủi ro thị trường",
        summary: "Phương pháp tính rủi ro thị trường.",
      },
      {
        number: "23",
        title:
          "Tỷ lệ đủ vốn ngắn hạn (LCR), tỷ lệ vốn dài hạn ổn định (NSFR) và tỷ lệ đòn bẩy",
        summary: "LCR ≥ 100%, NSFR ≥ 100%, tỷ lệ đòn bẩy tối thiểu 3%.",
      },
      {
        number: "25",
        title: "Tỷ lệ tập trung rủi ro",
        summary:
          "Giới hạn tập trung rủi ro đối với một khách hàng, nhóm khách hàng liên quan.",
      },
      {
        number: "28",
        title: "Quy trình đánh giá mức đủ vốn (ICAAP)",
        summary: "Ngân hàng phải thực hiện ICAAP định kỳ, báo cáo NHNN.",
      },
      {
        number: "30",
        title: "Kiểm định sức chịu đựng (Stress Testing)",
        summary:
          "Yêu cầu kiểm tra sức chịu đựng về vốn trong các kịch bản áp lực.",
      },
      {
        number: "35",
        title: "Công bố thông tin (Pillar 3)",
        summary:
          "Ngân hàng công bố tỷ lệ vốn, cơ cấu vốn, kết quả kiểm định mức đủ vốn theo quy định.",
      },
      {
        number: "38",
        title: "Báo cáo định kỳ",
        summary: "Mẫu biểu và thời hạn báo cáo tỷ lệ an toàn vốn định kỳ.",
      },
      {
        number: "40",
        title: "Lộ trình chuyển đổi",
        summary: "Lộ trình áp dụng Basel III: 2025-2030, các mốc giai đoạn.",
      },
      {
        number: "42",
        title: "Quy định chuyển tiếp",
        summary: "Quy định chuyển tiếp cho các ngân hàng chưa đáp ứng đầy đủ.",
      },
    ],
  },
  {
    id: "reg-cir83-2025",
    title: "Thông tư 83/2025/TT-NHNN — Hệ thống kiểm soát nội bộ",
    description:
      "Quy định về hệ thống kiểm soát nội bộ của ngân hàng thương mại, thực hiện Điều 57 Luật Tổ chức tín dụng 2024. Áp dụng ba tuyến phòng vệ, quản trị rủi ro toàn diện. Có hiệu lực từ 01/07/2026, một số quy định trì hoãn đến 2028.",
    category: "Quản trị nội bộ",
    regulatoryBody: "Ngân hàng Nhà nước Việt Nam (SBV)",
    effectiveDate: "2026-07-01T00:00:00.000Z",
    status: "Effective",
    priority: "critical",
    source: "internal",
    articles: [
      {
        number: "1",
        title: "Phạm vi điều chỉnh",
        summary:
          "Quy định hệ thống kiểm soát nội bộ cho tất cả ngân hàng thương mại, trừ ngân hàng dưới kiểm soát đặc biệt một số quy định.",
      },
      {
        number: "2",
        title: "Nguyên tắc chung",
        summary:
          "Hệ thống kiểm soát nội bộ theo thông lệ quốc tế, bao phủ tất cả loại rủi ro trọng yếu.",
      },
      {
        number: "4",
        title: "Chức năng quản lý rủi ro độc lập",
        summary:
          "Ngân hàng phải có bộ phận quản lý rủi ro độc lập thực hiện nhận diện, đo lường, kiểm soát các loại rủi ro trọng yếu.",
      },
      {
        number: "8",
        title: "Khẩu vị rủi ro",
        summary:
          "Ngân hàng phải xây dựng khẩu vị rủi ro được Hội đồng quản trị thông qua.",
      },
      {
        number: "12",
        title: "Nhận diện và đo lường rủi ro",
        summary:
          "Yêu cầu nhận diện, đo lường rủi ro tín dụng, thị trường, hoạt động, thanh khoản, tập trung, IRRBB, mô hình.",
      },
      {
        number: "15",
        title: "Kiểm soát rủi ro hoạt động",
        summary:
          "Kiểm soát rủi ro hoạt động bao gồm gian lận nội bộ, gian lận bên ngoài, sai sót hệ thống.",
      },
      {
        number: "18",
        title: "Kiểm toán nội bộ",
        summary:
          "Kiểm toán nội bộ hoạt động độc lập, đánh giá hiệu quả hệ thống kiểm soát nội bộ, báo cáo Hội đồng/Ban kiểm soát.",
      },
      {
        number: "19",
        title: "Tuyên bố khẩu vị rủi ro (Risk Appetite Statement)",
        summary:
          "Ngân hàng phải xây dựng khẩu vị rủi ro với các ngưỡng định lượng được HĐQT thông qua.",
      },
      {
        number: "20",
        title: "Quản lý rủi ro tín dụng",
        summary:
          "Yêu cầu quản lý rủi ro tín dụng: chấm điểm, phân loại, hạn mức, giám sát.",
      },
      {
        number: "21",
        title: "Quản lý rủi ro thị trường",
        summary:
          "Yêu cầu quản lý rủi ro thị trường: giá trị chịu rủi ro, giới hạn.",
      },
      {
        number: "22",
        title: "Kiểm tra sức chịu đựng — Rủi ro tín dụng và thị trường",
        summary:
          "Kiểm tra sức chịu đựng về rủi ro tín dụng, thị trường, hoạt động, thanh khoản, IRRBB.",
      },
      {
        number: "23",
        title: "Kiểm tra sức chịu đựng — Thanh khoản và IRRBB",
        summary: "Kịch bản áp lực thanh khoản và rủi ro lãi suất.",
      },
      {
        number: "24",
        title: "Kiểm tra sức chịu đựng ngược (Reverse Stress Test)",
        summary: "Yêu cầu thực hiện kiểm tra sức chịu đựng ngược.",
      },
      {
        number: "26",
        title: "Hoạt động kiểm soát nội bộ",
        summary:
          "Ngân hàng phải xây dựng hệ thống chính sách, quy trình kiểm soát nội bộ theo thông lệ quốc tế (COSO, Basel).",
      },
      {
        number: "29",
        title: "Quản lý rủi ro tập trung",
        summary: "Yêu cầu giám sát và kiểm soát rủi ro tập trung.",
      },
      {
        number: "32",
        title: "Quản lý rủi ro mô hình (Model Risk Management)",
        summary:
          "Ngân hàng phải quản lý rủi ro mô hình: lập danh mục, kiểm định độc lập, theo dõi hiệu quả mô hình.",
      },
      {
        number: "35",
        title: "Quản lý chất lượng dữ liệu",
        summary: "Yêu cầu về chất lượng dữ liệu phục vụ quản trị rủi ro.",
      },
      {
        number: "44",
        title: "Quy định chuyển tiếp",
        summary:
          "Một số quy định (ICAAP nâng cao, mô hình IRB) được trì hoãn đến 2028.",
      },
    ],
  },
  {
    id: "reg-cir41-2016",
    title: "Thông tư 41/2016/TT-NHNN — Tỷ lệ an toàn vốn (Basel II)",
    description:
      "Quy định tỷ lệ an toàn vốn theo Basel II đối với ngân hàng thương mại. Đã bị thay thế bởi Thông tư 14/2025 từ 15/09/2025.",
    category: "An toàn vốn",
    regulatoryBody: "Ngân hàng Nhà nước Việt Nam (SBV)",
    effectiveDate: "2016-12-30T00:00:00.000Z",
    expirationDate: "2025-09-15T00:00:00.000Z",
    status: "Superseded",
    priority: "low",
    source: "internal",
    articles: [
      {
        number: "1",
        title: "Phạm vi điều chỉnh",
        summary:
          "Áp dụng cho ngân hàng thương mại, chi nhánh ngân hàng nước ngoài.",
      },
      {
        number: "5",
        title: "Tỷ lệ an toàn vốn tối thiểu (Basel II)",
        summary: "CAR ≥ 8%, vốn cấp 1 ≥ 4% theo Basel II.",
      },
      {
        number: "10",
        title: "Hệ số rủi ro tín dụng",
        summary: "Bảng hệ số rủi ro tín dụng theo nhóm khách hàng.",
      },
      {
        number: "15",
        title: "Rủi ro hoạt động",
        summary: "Phương pháp tính rủi ro hoạt động.",
      },
      {
        number: "20",
        title: "Báo cáo định kỳ",
        summary: "Mẫu biểu báo cáo tỷ lệ an toàn vốn.",
      },
    ],
  },
  {
    id: "reg-cir13-2018",
    title: "Thông tư 13/2018/TT-NHNN — Hệ số rủi ro tín dụng (Basel II)",
    description:
      "Hướng dẫn hệ số rủi ro tín dụng theo Basel II. Đã bị thay thế bởi Thông tư 14/2025.",
    category: "An toàn vốn",
    regulatoryBody: "Ngân hàng Nhà nước Việt Nam (SBV)",
    effectiveDate: "2018-06-30T00:00:00.000Z",
    expirationDate: "2025-09-15T00:00:00.000Z",
    status: "Superseded",
    priority: "low",
    source: "internal",
    articles: [
      {
        number: "1",
        title: "Phạm vi điều chỉnh",
        summary: "Hệ số rủi ro tín dụng cho ngân hàng thương mại.",
      },
      {
        number: "5",
        title: "Hệ số rủi ro theo nhóm khách hàng",
        summary: "Bảng hệ số rủi ro chuẩn.",
      },
      {
        number: "8",
        title: "Giảm trừ vốn",
        summary: "Quy định giảm trừ vốn cấp 1, cấp 2.",
      },
    ],
  },
  {
    id: "reg-aml-law-2022",
    title: "Luật Phòng chống rửa tiền 14/2022/QH15",
    description:
      "Luật Phòng chống rửa tiền 2022 quy định các biện pháp phòng ngừa, phát hiện, ngăn chặn, xử lý hành vi rửa tiền. Thay thế Luật 51/2012. Có hiệu lực từ 01/03/2023. Mở rộng phạm vi sang tài trợ khủng bố (CFT).",
    category: "Rửa tiền",
    regulatoryBody: "Quốc hội Việt Nam (National Assembly)",
    effectiveDate: "2023-03-01T00:00:00.000Z",
    status: "Effective",
    priority: "critical",
    source: "internal",
    articles: [
      {
        number: "1",
        title: "Phạm vi điều chỉnh",
        summary:
          "Quy định biện pháp phòng ngừa, phát hiện, ngăn chặn, xử lý hành vi rửa tiền.",
      },
      {
        number: "2",
        title: "Đối tượng báo cáo",
        summary:
          "Tổ chức tín dụng và các tổ chức phi tài chính là đối tượng báo cáo.",
      },
      {
        number: "5",
        title: "Đánh giá rủi ro rửa tiền",
        summary: "Đối tượng báo cáo phải đánh giá rủi ro rửa tiền định kỳ.",
      },
      {
        number: "10",
        title: "Nhận diện khách hàng (KYC)",
        summary:
          "Thu thập thông tin nhận dạng khách hàng: tên, ngày sinh, số ID, địa chỉ. Đối với pháp nhân: tên doanh nghiệp, mã số thuế.",
      },
      {
        number: "11",
        title: "Xác minh khách hàng",
        summary: "Xác minh thông tin khách hàng bằng tài liệu hợp lệ.",
      },
      {
        number: "13",
        title: "Xác định người hưởng lợi (UBO)",
        summary:
          "Phải xác định và thu thập thông tin người hưởng lợi của khách hàng tổ chức (≥25% cổ phần hoặc quyền kiểm soát).",
      },
      {
        number: "14",
        title: "Biện pháp due diligence đơn giản hóa",
        summary: "Áp dụng cho khách hàng rủi ro thấp.",
      },
      {
        number: "16",
        title: "Phân loại khách hàng theo rủi ro",
        summary:
          "Phân loại khách hàng theo mức độ rủi ro thấp, trung bình, cao và áp dụng biện pháp tương ứng.",
      },
      {
        number: "17",
        title: "Due diligence tăng cường",
        summary:
          "Áp dụng cho khách hàng rủi ro cao (PEP, vùng địa lý rủi ro cao).",
      },
      {
        number: "18",
        title: "Ngân hàng đại lý (Correspondent Banking)",
        summary:
          "Thu thập thông tin về ngân hàng đối tác, đánh giá năng lực AML, đảm bảo không làm việc với shell bank.",
      },
      {
        number: "20",
        title: "Giám sát giao dịch",
        summary: "Giám sát giao dịch liên tục để phát hiện hoạt động đáng ngờ.",
      },
      {
        number: "25",
        title: "Báo cáo giao dịch có giá trị lớn (CTR)",
        summary:
          "Báo cáo giao dịch tiền mặt trên ngưỡng do Thủ tướng quy định.",
      },
      {
        number: "26",
        title: "Báo cáo giao dịch đáng ngờ (STR)",
        summary:
          "Báo cáo giao dịch đáng ngờ cho NHNN (FIU) khi có chỉ báo rửa tiền.",
      },
      {
        number: "28",
        title: "Lưu trữ hồ sơ",
        summary: "Lưu trữ hồ sơ giao dịch và thông tin KYC tối thiểu 5 năm.",
      },
      {
        number: "30",
        title: "Trách nhiệm của người có chức vụ",
        summary:
          "Trách nhiệm của người có chức vụ quản lý trong phòng chống rửa tiền.",
      },
    ],
  },
  {
    id: "reg-cir27-2025",
    title: "Thông tư 27/2025/TT-NHNN — Hướng dẫn phòng chống rửa tiền",
    description:
      "Hướng dẫn chi tiết Luật Phòng chống rửa tiền 2022: đánh giá rủi ro, CDD, phân loại khách hàng, báo cáo giao dịch. Thay thế Thông tư 09/2023. Có hiệu lực từ 01/11/2025. Bổ sung quy định về tài sản ảo (virtual asset) và báo cáo điện tử.",
    category: "Rửa tiền",
    regulatoryBody: "Ngân hàng Nhà nước Việt Nam (SBV)",
    effectiveDate: "2025-11-01T00:00:00.000Z",
    status: "Effective",
    priority: "critical",
    source: "internal",
    articles: [
      {
        number: "1",
        title: "Phạm vi điều chỉnh",
        summary:
          "Quy định đánh giá rủi ro rửa tiền, quản lý rủi ro, phân loại khách hàng, báo cáo giao dịch.",
      },
      {
        number: "3",
        title: "Đánh giá rủi ro rửa tiền — Phương pháp chấm điểm",
        summary:
          "Phương pháp chấm điểm 1-5: ≤1 rủi ro thấp, >4 rủi ro cao. Đánh giá rủi ro tiềm ẩn và hiệu quả kiểm soát.",
      },
      {
        number: "5",
        title: "Quy trình quản lý rủi ro rửa tiền",
        summary: "Xây dựng quy trình quản lý rủi ro rửa tiền toàn ngân hàng.",
      },
      {
        number: "6",
        title: "Báo cáo giao dịch có giá trị lớn",
        summary:
          "Báo cáo CTR bằng dữ liệu điện tử cho Cục PCRT. Bao gồm giao dịch tiền mặt qua ATM.",
      },
      {
        number: "7",
        title: "Báo cáo giao dịch đáng ngờ (STR)",
        summary:
          "Báo cáo STR bằng dữ liệu điện tử hoặc văn bản theo mẫu Phụ lục III. Không dùng form STR để báo cáo cơ quan khác.",
      },
      {
        number: "8",
        title: "Giao dịch chuyển tiền điện tử và tài sản ảo",
        summary:
          "Đảm bảo thông tin điện chuyển tiền duy trì trong suốt quá trình. Giao dịch tài sản ảo không đầy đủ thông tin bị coi là đáng ngờ.",
      },
      {
        number: "10",
        title: "Báo cáo điện tử và nộp dữ liệu",
        summary:
          "CTR/STR phải báo cáo bằng dữ liệu điện tử (CSV/XML) với thời hạn theo loại dữ liệu.",
      },
      {
        number: "12",
        title: "Nhận diện khách hàng — Yêu cầu chi tiết",
        summary: "Hướng dẫn chi tiết thu thập và xác minh thông tin KYC.",
      },
      {
        number: "13",
        title: "Xác định người hưởng lợi — Hướng dẫn",
        summary: "Hướng dẫn xác định UBO theo ngưỡng 25%.",
      },
      {
        number: "15",
        title: "Lưu trữ hồ sơ",
        summary:
          "Lưu trữ hồ sơ giao dịch, thông tin KYC tối thiểu 5 năm sau khi đóng tài khoản.",
      },
      {
        number: "18",
        title: "Đào tạo nhân sự",
        summary: "Yêu cầu đào tạo nhân sự về phòng chống rửa tiền định kỳ.",
      },
      {
        number: "20",
        title: "Kiểm tra và thanh tra",
        summary: "Kiểm tra nội bộ và thanh tra bởi NHNN.",
      },
    ],
  },
  {
    id: "reg-cir09-2023",
    title: "Thông tư 09/2023/TT-NHNN — Hướng dẫn phòng chống rửa tiền (cũ)",
    description:
      "Hướng dẫn phòng chống rửa tiền theo Luật 51/2012. Đã bị thay thế bởi Thông tư 27/2025 từ 01/11/2025.",
    category: "Rửa tiền",
    regulatoryBody: "Ngân hàng Nhà nước Việt Nam (SBV)",
    effectiveDate: "2023-06-01T00:00:00.000Z",
    expirationDate: "2025-11-01T00:00:00.000Z",
    status: "Superseded",
    priority: "low",
    source: "internal",
    articles: [
      {
        number: "1",
        title: "Phạm vi điều chỉnh",
        summary: "Hướng dẫn phòng chống rửa tiền theo Luật 51/2012.",
      },
      {
        number: "5",
        title: "Phân loại khách hàng",
        summary: "Phân loại khách hàng theo rủi ro.",
      },
      {
        number: "10",
        title: "Báo cáo giao dịch",
        summary: "Báo cáo CTR và STR.",
      },
    ],
  },
  {
    id: "reg-cir18-2019",
    title: "Thông tư 18/2019/TT-NHNN — Ngân hàng điện tử",
    description:
      "Quy định về hoạt động ngân hàng điện tử: bảo mật thông tin, kiểm soát giao dịch trực tuyến, ngăn ngừa gian lận. Yêu cầu mã hóa, xác thực, giới hạn giao dịch.",
    category: "Quản lý rủi ro hoạt động",
    regulatoryBody: "Ngân hàng Nhà nước Việt Nam (SBV)",
    effectiveDate: "2019-10-01T00:00:00.000Z",
    status: "Effective",
    priority: "high",
    source: "internal",
    articles: [
      {
        number: "1",
        title: "Phạm vi điều chỉnh",
        summary:
          "Quy định về hoạt động ngân hàng điện tử của tổ chức tín dụng.",
      },
      {
        number: "5",
        title: "Bảo mật thông tin",
        summary: "Yêu cầu mã hóa, bảo mật hạ tầng mạng, chứng thực điện tử.",
      },
      {
        number: "8",
        title: "Kiểm soát giao dịch trực tuyến",
        summary:
          "Ngân hàng bảo đảm an toàn hạ tầng, kiểm soát giao dịch trực tuyến, ngăn ngừa giao dịch gian lận.",
      },
      {
        number: "10",
        title: "Xác thực khách hàng",
        summary: "Yêu cầu xác thực đa yếu tố (2FA) cho giao dịch điện tử.",
      },
      {
        number: "12",
        title: "Giới hạn giao dịch",
        summary: "Cấu hình hạn mức giao dịch theo kênh và loại khách hàng.",
      },
      {
        number: "15",
        title: "Giám sát và phát hiện gian lận",
        summary: "Hệ thống giám sát giao dịch bất thường, cảnh báo gian lận.",
      },
      {
        number: "18",
        title: "Báo cáo sự cố",
        summary: "Báo cáo sự cố an ninh mạng và gian lận cho NHNN.",
      },
      {
        number: "22",
        title: "Quy định chuyển tiếp",
        summary: "Lộ trình áp dụng cho các ngân hàng.",
      },
    ],
  },
  {
    id: "reg-cir40-2024",
    title: "Thông tư 40/2024/TT-NHNN — Dịch vụ thanh toán",
    description:
      "Quy định về dịch vụ thanh toán: đảm bảo an toàn thông tin, ngăn ngừa gian lận, báo cáo sự cố. Áp dụng cho tổ chức cung ứng dịch vụ thanh toán.",
    category: "Quản lý rủi ro hoạt động",
    regulatoryBody: "Ngân hàng Nhà nước Việt Nam (SBV)",
    effectiveDate: "2024-07-01T00:00:00.000Z",
    status: "Effective",
    priority: "high",
    source: "internal",
    articles: [
      {
        number: "1",
        title: "Phạm vi điều chỉnh",
        summary:
          "Quy định về dịch vụ thanh toán của tổ chức cung ứng dịch vụ thanh toán.",
      },
      {
        number: "5",
        title: "An toàn thông tin và ngăn ngừa gian lận",
        summary:
          "Tổ chức cung ứng dịch vụ thanh toán phải đảm bảo an toàn thông tin, ngăn ngừa gian lận.",
      },
      {
        number: "8",
        title: "Xác thực mạnh (SCA)",
        summary:
          "Yêu cầu xác thực mạnh cho giao dịch thanh toán: 2FA, OTP, device binding.",
      },
      {
        number: "10",
        title: "Giới hạn giao dịch",
        summary: "Cấu hình hạn mức giao dịch theo loại dịch vụ và khách hàng.",
      },
      {
        number: "12",
        title: "Báo cáo sự cố",
        summary: "Báo cáo sự cố thanh toán, gian lận cho NHNN.",
      },
      {
        number: "15",
        title: "Quản lý rủi ro đối tác",
        summary:
          "Due diligence đối với đối tác fintech và nhà cung cấp dịch vụ thanh toán.",
      },
      {
        number: "18",
        title: "Bảo vệ khách hàng",
        summary: "Quy định về bảo vệ người tiêu dùng trong dịch vụ thanh toán.",
      },
      {
        number: "20",
        title: "Kiểm toán và giám sát",
        summary: "Kiểm toán nội bộ hoạt động thanh toán định kỳ.",
      },
    ],
  },
  {
    id: "reg-cir19-2016",
    title: "Thông tư 19/2016/TT-NHNN — Dịch vụ trung gian thanh toán",
    description:
      "Quy định về hoạt động cung ứng dịch vụ trung gian thanh toán. Yêu cầu bảo mật, kiểm soát gian lận.",
    category: "Quản lý rủi ro hoạt động",
    regulatoryBody: "Ngân hàng Nhà nước Việt Nam (SBV)",
    effectiveDate: "2016-08-01T00:00:00.000Z",
    status: "Effective",
    priority: "medium",
    source: "internal",
    articles: [
      {
        number: "1",
        title: "Phạm vi điều chỉnh",
        summary: "Quy định về dịch vụ trung gian thanh toán.",
      },
      {
        number: "5",
        title: "Điều kiện cung ứng dịch vụ",
        summary: "Điều kiện, thủ tục cung ứng dịch vụ trung gian thanh toán.",
      },
      {
        number: "8",
        title: "Bảo mật và an toàn",
        summary: "Yêu cầu bảo mật thông tin, kiểm soát gian lận.",
      },
      {
        number: "10",
        title: "Báo cáo định kỳ",
        summary: "Báo cáo hoạt động dịch vụ trung gian thanh toán.",
      },
      {
        number: "12",
        title: "Xử lý vi phạm",
        summary: "Xử lý vi phạm quy định về dịch vụ trung gian thanh toán.",
      },
      {
        number: "15",
        title: "Hiệu lực thi hành",
        summary: "Quy định chuyển tiếp và hiệu lực thi hành.",
      },
    ],
  },
  {
    id: "reg-cyberlaw-2015",
    title: "Luật An ninh mạng 2015",
    description:
      "Luật An ninh mạng quy định bảo đảm an ninh mạng, xử lý sự cố mạng, bảo mật thông tin. Ngân hàng thuộc nhóm cơ sở hạ tầng thông tin trọng yếu, phải tuân thủ yêu cầu an ninh mạng và phản ứng sự cố.",
    category: "Bảo mật thông tin",
    regulatoryBody: "Quốc hội Việt Nam (National Assembly)",
    effectiveDate: "2016-07-01T00:00:00.000Z",
    status: "Effective",
    priority: "high",
    source: "internal",
    articles: [
      {
        number: "1",
        title: "Phạm vi điều chỉnh",
        summary: "Quy định về an ninh mạng, bảo mật thông tin.",
      },
      {
        number: "8",
        title: "Bảo vệ cơ sở hạ tầng thông tin trọng yếu",
        summary:
          "Ngân hàng thuộc nhóm cơ sở hạ tầng trọng yếu, phải bảo đảm an ninh mạng.",
      },
      {
        number: "10",
        title: "Phản ứng sự cố mạng",
        summary: "Quy trình phát hiện, phản ứng, xử lý sự cố mạng.",
      },
      {
        number: "12",
        title: "Báo cáo sự cố",
        summary: "Báo cáo sự cố an ninh mạng cho cơ quan chức năng.",
      },
      {
        number: "15",
        title: "Quản lý rủi ro an ninh mạng",
        summary: "Đánh giá và quản lý rủi ro an ninh mạng định kỳ.",
      },
      {
        number: "18",
        title: "Kiểm tra và thanh tra",
        summary: "Kiểm tra, thanh tra an ninh mạng.",
      },
      {
        number: "20",
        title: "Hợp tác quốc tế",
        summary: "Hợp tác quốc tế về an ninh mạng.",
      },
      {
        number: "25",
        title: "Xử lý vi phạm",
        summary: "Chế tài xử lý vi phạm về an ninh mạng.",
      },
    ],
  },
  {
    id: "reg-basel3",
    title: "Basel III Framework — International Capital Standards",
    description:
      "Khung quốc tế về tỷ lệ an toàn vốn, quản lý rủi ro và giám sát ngân hàng toàn cầu do Basel Committee on Banking Supervision ban hành. Là cơ sở cho Thông tư 14/2025 của NHNN.",
    category: "An toàn vốn",
    regulatoryBody: "Basel Committee on Banking Supervision",
    effectiveDate: "2017-01-01T00:00:00.000Z",
    status: "Effective",
    priority: "high",
    source: "external",
    articles: [
      {
        number: "1",
        title: "Scope of application",
        summary: "Scope of consolidation and application of the framework.",
      },
      {
        number: "2",
        title: "Definition of capital",
        summary: "CET1, AT1, Tier 2 capital definitions.",
      },
      {
        number: "3",
        title: "Capital adequacy ratios",
        summary: "Minimum CET1 4.5%, Tier 1 6%, Total 8% of RWA.",
      },
      {
        number: "4",
        title: "Capital buffers",
        summary: "Capital Conservation Buffer 2.5%, Countercyclical Buffer.",
      },
      {
        number: "5",
        title: "Credit risk — Standardized approach",
        summary: "Risk weights for credit risk under SA.",
      },
      {
        number: "6",
        title: "Operational risk — SMA",
        summary: "Standardized Measurement Approach for operational risk.",
      },
      {
        number: "7",
        title: "Liquidity ratios (LCR/NSFR)",
        summary: "Liquidity Coverage Ratio and Net Stable Funding Ratio.",
      },
      {
        number: "8",
        title: "Leverage ratio",
        summary: "Minimum leverage ratio 3%.",
      },
      {
        number: "9",
        title: "Disclosure requirements (Pillar 3)",
        summary: "Public disclosure of capital, RWA, risk metrics.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Regulation dependencies
// ---------------------------------------------------------------------------

export interface CuratedDependency {
  from: string;
  to: string;
  type: "amends" | "repeals" | "supersedes" | "references";
  description: string;
  notes?: string;
}

export const CURATED_DEPENDENCIES: CuratedDependency[] = [
  {
    from: "reg-cir14-2025",
    to: "reg-cir41-2016",
    type: "supersedes",
    description:
      "Thông tư 14/2025 thay thế toàn bộ Thông tư 41/2016 về tỷ lệ an toàn vốn, áp dụng khung Basel III thay thế Basel II.",
    notes: "Lộ trình chuyển đổi đến 01/01/2030.",
  },
  {
    from: "reg-cir14-2025",
    to: "reg-cir13-2018",
    type: "supersedes",
    description:
      "Thông tư 14/2025 thay thế các quy định về hệ số rủi ro tín dụng của Thông tư 13/2018.",
  },
  {
    from: "reg-cir14-2025",
    to: "reg-basel3",
    type: "references",
    description:
      "Thông tư 14/2025 áp dụng các nguyên tắc tỷ lệ an toàn vốn theo khung Basel III của Basel Committee.",
    notes: "Basel III là cơ sở quốc tế cho quy định nội địa.",
  },
  {
    from: "reg-cir14-2025",
    to: "reg-law-ci-2024",
    type: "references",
    description:
      "Thông tư 14/2025 được ban hành theo thẩm quyền của Luật Tổ chức tín dụng 2024.",
  },
  {
    from: "reg-cir83-2025",
    to: "reg-law-ci-2024",
    type: "references",
    description:
      "Thông tư 83/2025 thực hiện Điều 57 Luật Tổ chức tín dụng 2024 về hệ thống kiểm soát nội bộ.",
    notes: "Áp dụng ba tuyến phòng vệ.",
  },
  {
    from: "reg-cir27-2025",
    to: "reg-cir09-2023",
    type: "supersedes",
    description:
      "Thông tư 27/2025 thay thế Thông tư 09/2023, hướng dẫn Luật Phòng chống rửa tiền 2022.",
  },
  {
    from: "reg-cir27-2025",
    to: "reg-aml-law-2022",
    type: "references",
    description:
      "Thông tư 27/2025 hướng dẫn chi tiết các điều khoản của Luật Phòng chống rửa tiền 14/2022.",
  },
  {
    from: "reg-aml-law-2022",
    to: "reg-law-ci-2024",
    type: "references",
    description:
      "Luật Phòng chống rửa tiền 2022 bổ sung nghĩa vụ cho tổ chức tín dụng theo Luật Tổ chức tín dụng 2024.",
  },
  {
    from: "reg-cir18-2019",
    to: "reg-law-ci-2024",
    type: "references",
    description:
      "Thông tư 18/2019 về ngân hàng điện tử thực hiện yêu cầu kiểm soát nội bộ theo Luật Tổ chức tín dụng.",
  },
  {
    from: "reg-cir40-2024",
    to: "reg-cir19-2016",
    type: "amends",
    description:
      "Thông tư 40/2024 sửa đổi, bổ sung quy định về dịch vụ thanh toán và trung gian thanh toán.",
  },
  {
    from: "reg-cir40-2024",
    to: "reg-cyberlaw-2015",
    type: "references",
    description:
      "Thông tư 40/2024 tham chiếu yêu cầu an ninh mạng theo Luật An ninh mạng 2015.",
  },
];

// ---------------------------------------------------------------------------
// Compliance obligations (Obligations page — ComplianceObligation)
// ---------------------------------------------------------------------------

export interface CuratedComplianceObligation {
  regulationId: string;
  title: string;
  description: string;
  department: string;
  criticality: "low" | "medium" | "high" | "critical";
  frequency: "once" | "monthly" | "quarterly" | "biannually" | "annually";
  penalty: string;
  tags: string[];
  dueOffset: number;
  status: string;
  progress: number;
}

export const CURATED_COMPLIANCE_OBLIGATIONS: CuratedComplianceObligation[] = [
  // --- Basel III / Capital Adequacy (Circular 14/2025) ---
  {
    regulationId: "reg-cir14-2025",
    title: "Nâng cấp hệ thống tính toán CAR theo Basel III",
    description:
      "Cập nhật công cụ tính toán tỷ lệ an toàn vốn theo định nghĩa vốn Basel III mới (CET1, AT1, T2). Điều chỉnh bảng hệ số rủi ro có trọng số (RWA) theo Thông tư 14/2025 Điều 5.",
    department: "Risk Management",
    criticality: "critical",
    frequency: "once",
    penalty: "Đình chỉ hoạt động, phạt đến 2 tỷ VND",
    tags: ["basel3", "capital", "reporting"],
    dueOffset: -15,
    status: "Submitted",
    progress: 65,
  },
  {
    regulationId: "reg-cir14-2025",
    title: "Duy trì CET1 ≥ 4.5%, Tier 1 ≥ 6%, Tổng vốn ≥ 8% RWA",
    description:
      "Đảm bảo duy trì các tỷ lệ vốn tối thiểu theo Basel III. Phân loại công cụ vốn theo Basel III, tái phân loại dự trữ và goodwill theo quy định giảm trừ mới.",
    department: "Finance",
    criticality: "critical",
    frequency: "quarterly",
    penalty: "Hạn chế chia cổ tức, yêu cầu tăng vốn",
    tags: ["basel3", "capital"],
    dueOffset: 30,
    status: "Approved",
    progress: 90,
  },
  {
    regulationId: "reg-cir14-2025",
    title:
      "Thiết lập bộ đệm bảo toàn vốn (CCB 2.5%) và bộ đệm chống chu kỳ (CCyB)",
    description:
      "Xây dựng và công bố yêu cầu bộ đệm vốn. Tích lũy vốn bổ sung CET1 vượt mức tối thiểu. HĐQT phê duyệt trigger cho chính sách cổ tức khi vi phạm bộ đệm.",
    department: "Treasury & ALM",
    criticality: "high",
    frequency: "annually",
    penalty: "Hạn chế phân phối lợi nhuận",
    tags: ["basel3", "capital", "buffer"],
    dueOffset: 75,
    status: "Pending Review",
    progress: 40,
  },
  {
    regulationId: "reg-cir14-2025",
    title: "Áp dụng hệ số rủi ro mới cho cho vay bất động sản theo LTV",
    description:
      "Điều chỉnh hệ thống tín dụng áp dụng hệ số rủi ro mới cho vay bất động sản theo tỷ lệ LTV. Tái phân loại khoản vay hiện tại theo danh mục mới. Vay nhà ở xã hội được giảm hệ số.",
    department: "Credit Risk",
    criticality: "high",
    frequency: "once",
    penalty: "Sai lệch RWA, phạt hành chính",
    tags: ["basel3", "credit", "realestate"],
    dueOffset: -30,
    status: "Rejected",
    progress: 20,
  },
  {
    regulationId: "reg-cir14-2025",
    title: "Duy trì LCR ≥ 100% và NSFR ≥ 100%",
    description:
      "Thu thập dữ liệu tài sản thanh khoản chất lượng cao (HQLA). Thử nghiệm áp lực thanh khoản. Nâng cấp hệ thống treasury để giám sát LCR/NSFR theo Thông tư 14 Điều 23.",
    department: "Treasury & ALM",
    criticality: "critical",
    frequency: "monthly",
    penalty: "Yêu cầu kế hoạch cấp vốn khẩn cấp",
    tags: ["basel3", "liquidity", "reporting"],
    dueOffset: -7,
    status: "Submitted",
    progress: 55,
  },
  {
    regulationId: "reg-cir14-2025",
    title: "Công bố thông tin Pillar 3 theo Basel III",
    description:
      "Phát triển mẫu công bố thông tin Pillar 3: tỷ lệ vốn, RWA, chỉ số rủi ro, kết quả ICAAP. Tự động hóa trích xuất dữ liệu. Phối hợp với Investor Relations cho báo cáo công khai.",
    department: "Finance",
    criticality: "medium",
    frequency: "annually",
    penalty: "Thiếu minh bạch, khiển trách",
    tags: ["basel3", "reporting", "disclosure"],
    dueOffset: 120,
    status: "Draft",
    progress: 15,
  },
  {
    regulationId: "reg-cir14-2025",
    title: "Thực hiện ICAAP và kiểm tra sức chịu đựng vốn định kỳ",
    description:
      "Thực hiện quy trình đánh giá mức đủ vốn (ICAAP) định kỳ. Kiểm tra sức chịu đựng vốn trong các kịch bản áp lực. Báo cáo kết quả cho NHNN theo Thông tư 14 Điều 28 và 30.",
    department: "Risk Management",
    criticality: "high",
    frequency: "annually",
    penalty: "Yêu cầu tăng vốn, giám sát đặc biệt",
    tags: ["basel3", "stress", "icaap"],
    dueOffset: 60,
    status: "Assigned",
    progress: 35,
  },
  {
    regulationId: "reg-cir14-2025",
    title: "Tính toán rủi ro hoạt động theo phương pháp SMA",
    description:
      "Đảm bảo tổng hợp P&L chính xác theo khối để tính phí rủi ro hoạt động theo phương pháp chỉ số cơ bản (SMA). Nâng cấp cơ sở dữ liệu sự cố thất thoát để hỗ trợ phân tích Pillar 2.",
    department: "Finance",
    criticality: "medium",
    frequency: "quarterly",
    penalty: "Sai lệch RWA",
    tags: ["basel3", "operational", "reporting"],
    dueOffset: 45,
    status: "Completed",
    progress: 100,
  },

  // --- Internal Control System (Circular 83/2025 & Law CI 2024) ---
  {
    regulationId: "reg-cir83-2025",
    title: "Thiết lập ba tuyến phòng vệ (3LoD) cho hệ thống kiểm soát nội bộ",
    description:
      "Tái cấu trúc quản trị: định nghĩa tuyến 1 (business), tuyến 2 (risk/compliance), tuyến 3 (internal audit). Áp dụng taxonomy rủi ro, định nghĩa KRI, gắn khẩu vị rủi ro với ICS.",
    department: "Internal Control",
    criticality: "critical",
    frequency: "once",
    penalty: "Khiển trách, yêu cầu tái cơ cấu",
    tags: ["ics", "governance", "3lod"],
    dueOffset: -20,
    status: "Submitted",
    progress: 50,
  },
  {
    regulationId: "reg-cir83-2025",
    title: "Thành lập bộ phận quản lý rủi ro độc lập và bổ nhiệm CRO",
    description:
      "Thiết lập/bổ sung bộ phận quản lý rủi ro độc lập. Bổ nhiệm Chief Risk Officer đủ năng lực. Triển khai mô hình lượng hóa rủi ro (VaR, chấm điểm tín dụng, stress engine). Báo cáo cho HĐQT.",
    department: "Risk Management",
    criticality: "critical",
    frequency: "once",
    penalty: "Vi phạm Điều 4, phạt hành chính",
    tags: ["ics", "risk", "governance"],
    dueOffset: 90,
    status: "Pending Review",
    progress: 70,
  },
  {
    regulationId: "reg-cir83-2025",
    title:
      "RCSA — Đánh giá tự kiểm soát rủi ro (Risk and Control Self-Assessment)",
    description:
      "Phát triển quy trình RCSA toàn ngân hàng. Xây dựng thư viện kiểm soát (control library). Đảm bảo phân chia trách nhiệm và dual control khi cần thiết. Theo Thông tư 83 Điều 26.",
    department: "Internal Control",
    criticality: "high",
    frequency: "annually",
    penalty: "Kiểm soát không đầy đủ, khiển trách",
    tags: ["ics", "rcsa", "control"],
    dueOffset: -45,
    status: "Returned",
    progress: 30,
  },
  {
    regulationId: "reg-cir83-2025",
    title: "Khung quản lý rủi ro mô hình (Model Risk Management)",
    description:
      "Xây dựng khung MRM: lập danh mục mô hình rủi ro, thiết lập quy trình kiểm định độc lập, theo dõi hiệu suất và drift. Lên lịch backtesting và benchmarking. Theo Thông tư 83 Điều 32.",
    department: "Risk Management",
    criticality: "high",
    frequency: "annually",
    penalty: "Mô hình không được kiểm định, sai lệch kết quả",
    tags: ["ics", "model", "risk"],
    dueOffset: 100,
    status: "Draft",
    progress: 10,
  },
  {
    regulationId: "reg-cir83-2025",
    title:
      "Tuyên bố khẩu vị rủi ro (Risk Appetite Statement) được HĐQT phê duyệt",
    description:
      "Soạn thảo tuyên bố khẩu vị rủi ro với các ngưỡng định lượng: vốn, tập trung, thanh khoản, tín dụng, tổn thất hoạt động. Phê duyệt qua HĐQT. Tích hợp vào ICAAP và lập kế hoạch chiến lược.",
    department: "Risk Management",
    criticality: "high",
    frequency: "annually",
    penalty: "Thiếu khẩu vị rủi ro, khiển trách",
    tags: ["ics", "risk", "governance"],
    dueOffset: 15,
    status: "Approved",
    progress: 85,
  },
  {
    regulationId: "reg-cir83-2025",
    title: "Chương trình kiểm tra sức chịu đựng đa rủi ro (Stress Testing)",
    description:
      "Xây dựng đội kiểm tra sức chịu đựng. Phát triển thư viện kịch bản. Tích hợp trigger CCyB. Liên kết với kế hoạch cấp vốn khẩn cấp. Bao gồm reverse stress test. Theo Điều 22-24.",
    department: "Risk Management",
    criticality: "high",
    frequency: "biannually",
    penalty: "Thiếu kịch bản áp lực, khiển trách",
    tags: ["ics", "stress", "risk"],
    dueOffset: -10,
    status: "Submitted",
    progress: 60,
  },
  {
    regulationId: "reg-cir83-2025",
    title: "Kiểm toán nội bộ đánh giá hiệu quả ICS",
    description:
      "Bảo đảm charter kiểm toán nội bộ. Thực hiện kiểm toán dựa trên rủi ro hàng năm. Báo cáo phát hiện cho HĐQT/Ban kiểm soát. Theo dõi khắc phục phát hiện kiểm toán. Theo Điều 18.",
    department: "Internal Audit",
    criticality: "high",
    frequency: "annually",
    penalty: "Kiểm toán không đầy đủ, khiển trách",
    tags: ["ics", "audit", "governance"],
    dueOffset: 50,
    status: "Assigned",
    progress: 25,
  },
  {
    regulationId: "reg-law-ci-2024",
    title: "Hệ thống kiểm soát nội bộ theo Điều 57 Luật TCTD 2024",
    description:
      "Xây dựng khung kiểm soát nội bộ toàn doanh nghiệp (three lines of defense) và kiểm toán nội bộ độc lập. Bao gồm quản trị (HĐQT/Ban Rủi ro), chính sách quy trình, định nghĩa vai trò, đăng ký rủi ro/gian lận.",
    department: "Internal Control",
    criticality: "critical",
    frequency: "once",
    penalty: "Vi phạm Luật, phạt đến 5 tỷ VND",
    tags: ["ics", "governance", "law"],
    dueOffset: -60,
    status: "Completed",
    progress: 100,
  },
  {
    regulationId: "reg-law-ci-2024",
    title: "Kiểm soát rủi ro gian lận và hoạt động theo Điều 55",
    description:
      "Nhận diện rủi ro gian lận trên các sản phẩm (thẻ, IB, IBT, treasury). Triển khai kiểm soát phát hiện (alert rules, authentication, transaction monitoring). Định nghĩa quy trình điều tra.",
    department: "Operations",
    criticality: "high",
    frequency: "quarterly",
    penalty: "Tổn thất gian lận, khiển trách",
    tags: ["fraud", "operational", "law"],
    dueOffset: -5,
    status: "Assigned",
    progress: 45,
  },

  // --- AML/CFT (AML Law 14/2022 & Circular 27/2025) ---
  {
    regulationId: "reg-aml-law-2022",
    title: "CDD/KYC — Thu thập đầy đủ thông tin nhận dạng khách hàng",
    description:
      "Cập nhật quy trình onboarding để thu thập tất cả dữ liệu KYC: tên, ngày sinh, số ID, địa chỉ. Đối với pháp nhân: tên doanh nghiệp, mã số thuế. Nâng cấp eKYC (quét ID). Theo Điều 10.",
    department: "AML Compliance",
    criticality: "critical",
    frequency: "once",
    penalty: "Phạt đến 1 tỷ VND, đình chỉ giao dịch",
    tags: ["aml", "kyc", "cdd"],
    dueOffset: -25,
    status: "Submitted",
    progress: 75,
  },
  {
    regulationId: "reg-aml-law-2022",
    title: "Xác định người hưởng lợi (UBO) cho khách hàng tổ chức",
    description:
      "Thiết lập quy trình xác định UBO (≥25% cổ phần hoặc quyền kiểm soát). Thu thập tài liệu UBO. Thêm trường UBO vào form KYC. Hướng dẫn RM teams. Tích hợp vào risk rating. Theo Điều 13.",
    department: "AML Compliance",
    criticality: "high",
    frequency: "quarterly",
    penalty: "Phạt đến 500 triệu VND",
    tags: ["aml", "kyc", "ubo"],
    dueOffset: 20,
    status: "Approved",
    progress: 80,
  },
  {
    regulationId: "reg-aml-law-2022",
    title: "Phân loại khách hàng theo rủi ro AML (Customer Risk Rating)",
    description:
      "Phát triển và áp dụng mô hình chấm điểm rủi ro khách hàng (thấp/trung bình/cao). Áp dụng EDD cho khách hàng cao rủi ro (PEP, vùng địa lý rủi ro). Cập nhật chính sách SDD vs EDD. Theo Điều 16.",
    department: "AML Compliance",
    criticality: "critical",
    frequency: "annually",
    penalty: "Phạt đến 2 tỷ VND, khiển trách",
    tags: ["aml", "risk", "cdd"],
    dueOffset: -12,
    status: "Submitted",
    progress: 65,
  },
  {
    regulationId: "reg-aml-law-2022",
    title: "Due diligence ngân hàng đại lý (Correspondent Banking)",
    description:
      "Trước khi mở tài khoản L/Corr, thực hiện EDD về năng lực AML của ngân hàng đối tác. Yêu cầu tài liệu AML (chính sách, kiểm toán). Áp dụng quy tắc không làm việc với shell bank. Theo Điều 18.",
    department: "AML Compliance",
    criticality: "high",
    frequency: "annually",
    penalty: "Phạt đến 1 tỷ VND, đình chỉ quan hệ",
    tags: ["aml", "correspondent", "cdd"],
    dueOffset: 55,
    status: "Pending Review",
    progress: 50,
  },
  {
    regulationId: "reg-aml-law-2022",
    title: "Báo cáo giao dịch có giá trị lớn (CTR)",
    description:
      "Cấu hình core banking phát hiện/báo cáo giao dịch tiền mặt trên ngưỡng. Định nghĩa workflow báo cáo NHNN. Đào tạo teller front-line. Theo Điều 25 và Thông tư 27 Điều 6.",
    department: "AML Compliance",
    criticality: "high",
    frequency: "monthly",
    penalty: "Phạt đến 500 triệu VND mỗi vi phạm",
    tags: ["aml", "reporting", "ctr"],
    dueOffset: -3,
    status: "Completed",
    progress: 100,
  },
  {
    regulationId: "reg-aml-law-2022",
    title: "Báo cáo giao dịch đáng ngờ (STR)",
    description:
      "Thiết lập quy trình nội bộ nhận diện và báo cáo STR. Triển khai red-flag rules tự động. Bổ nhiệm AML Compliance Officer. Định nghĩa workflow escalation. Báo cáo điện tử cho FIU. Theo Điều 26.",
    department: "AML Compliance",
    criticality: "critical",
    frequency: "monthly",
    penalty: "Phạt đến 2 tỷ VND, truy cứu hình sự",
    tags: ["aml", "reporting", "str"],
    dueOffset: -8,
    status: "Submitted",
    progress: 70,
  },
  {
    regulationId: "reg-cir27-2025",
    title: "Đánh giá rủi ro rửa tiền theo phương pháp chấm điểm (Cir27 Điều 3)",
    description:
      "Phát triển công cụ chấm điểm rủi ro AML nội bộ (thang 1-5) dựa trên Cir27: rủi ro tiềm ẩn × hiệu quả kiểm soát. Gán trọng số và điểm. Tính và phê duyệt AML risk rating hàng năm.",
    department: "AML Compliance",
    criticality: "high",
    frequency: "annually",
    penalty: "Đánh giá không đầy đủ, khiển trách",
    tags: ["aml", "risk", "assessment"],
    dueOffset: 35,
    status: "Draft",
    progress: 20,
  },
  {
    regulationId: "reg-cir27-2025",
    title: "Báo cáo điện tử CTR/STR cho FIU (e-reporting)",
    description:
      "Tích hợp hệ thống ngân hàng với cổng báo cáo AML của FIU. Chuẩn bị form dự phòng thủ công. Định nghĩa data field mapping. Đảm bảo nộp đúng thời hạn (CTR hàng tháng, STR ngay lập tức). Theo Điều 6-7, 10.",
    department: "Information Technology",
    criticality: "high",
    frequency: "monthly",
    penalty: "Báo cáo chậm trễ, phạt đến 500 triệu VND",
    tags: ["aml", "reporting", "fiu"],
    dueOffset: -18,
    status: "Returned",
    progress: 40,
  },
  {
    regulationId: "reg-cir27-2025",
    title: "Giám sát giao dịch tài sản ảo (Virtual Asset)",
    description:
      "Mở rộng quy tắc giám sát cho dòng tiền tài sản ảo xuyên biên giới. Đảm bảo giao dịch crypto có đầy đủ thông tin originator/beneficiary. Xử lý giao dịch crypto không đầy đủ là đáng ngờ. Theo Điều 8.",
    department: "AML Compliance",
    criticality: "medium",
    frequency: "quarterly",
    penalty: "Bỏ sót giao dịch rửa tiền, phạt",
    tags: ["aml", "crypto", "monitoring"],
    dueOffset: 80,
    status: "Draft",
    progress: 5,
  },
  {
    regulationId: "reg-cir27-2025",
    title: "Lưu trữ hồ sơ KYC và giao dịch tối thiểu 5 năm",
    description:
      "Kiểm tra hệ thống lưu trữ tài liệu. Lưu trữ hồ sơ khách hàng và giao dịch điện tử tối thiểu 5 năm sau khi đóng tài khoản. Đảm bảo business continuity của dữ liệu AML. Theo Điều 15.",
    department: "Operations",
    criticality: "medium",
    frequency: "annually",
    penalty: "Phạt đến 300 triệu VND",
    tags: ["aml", "retention", "records"],
    dueOffset: 65,
    status: "Approved",
    progress: 95,
  },
  {
    regulationId: "reg-aml-law-2022",
    title: "Giám sát giao dịch liên tục (Ongoing Monitoring)",
    description:
      "Nâng cấp hệ thống giám sát giao dịch: alert rules, scenario detection, anomaly detection. Phân loại trigger từ Luật và nguồn nội bộ. Workflow cho trường hợp KYC chưa hoàn thành dẫn đến STR.",
    department: "AML Compliance",
    criticality: "high",
    frequency: "quarterly",
    penalty: "Bỏ sót giao dịch đáng ngờ, phạt",
    tags: ["aml", "monitoring", "transaction"],
    dueOffset: -35,
    status: "Rejected",
    progress: 25,
  },

  // --- Fraud Risk Management ---
  {
    regulationId: "reg-law-ci-2024",
    title: "Chính sách và quản trị chống gian lận (Anti-Fraud Policy)",
    description:
      "Xây dựng chương trình chống gian lận toàn doanh nghiệp (HĐQT phê duyệt). Thành lập Ban/Ban phụ trách gian lận dưới HĐQT. Tích hợp vào ICS. Bao gồm identity theft, phishing, card skimming, money mule, internal collusion.",
    department: "Risk Management",
    criticality: "high",
    frequency: "annually",
    penalty: "Tổn thất gian lận, khiển trách",
    tags: ["fraud", "governance", "policy"],
    dueOffset: 25,
    status: "Pending Review",
    progress: 55,
  },
  {
    regulationId: "reg-cir18-2019",
    title:
      "Hệ thống giám sát gian lận thời gian thực (Real-time Fraud Monitoring)",
    description:
      "Triển khai hệ thống phát hiện gian lận thời gian thực: anomaly detection, rule-based + ML models. Giám sát trên tất cả kênh (thẻ, IB, mobile, ATM). Device fingerprinting, velocity checks. Theo Thông tư 18/2019.",
    department: "Information Technology",
    criticality: "critical",
    frequency: "once",
    penalty: "Tổn thất gian lận lớn, đình chỉ kênh",
    tags: ["fraud", "monitoring", "realtime"],
    dueOffset: -40,
    status: "Submitted",
    progress: 60,
  },
  {
    regulationId: "reg-cir40-2024",
    title: "Xác thực mạnh khách hàng (Strong Customer Authentication)",
    description:
      "Thực thi 2FA, OTP, device binding, EMV chip cho thẻ. Đảm bảo xác thực đa yếu tố cho tất cả giao dịch thanh toán điện tử. Theo Thông tư 40/2024 và quy định thanh toán.",
    department: "Information Technology",
    criticality: "high",
    frequency: "once",
    penalty: "Gian lận thanh toán, phạt",
    tags: ["fraud", "authentication", "payment"],
    dueOffset: 10,
    status: "Approved",
    progress: 88,
  },
  {
    regulationId: "reg-cir40-2024",
    title: "Cấu hình giới hạn giao dịch và velocity checks",
    description:
      "Cấu hình hạn mức giao dịch hàng ngày/theo giao dịch. Workflow ngoại lệ. Velocity checks cho IB/mobile. Dual control cho thao tác giá trị cao. Theo quy định SBV.",
    department: "Operations",
    criticality: "high",
    frequency: "quarterly",
    penalty: "Gian lận do thiếu kiểm soát, phạt",
    tags: ["fraud", "limits", "control"],
    dueOffset: -2,
    status: "Completed",
    progress: 100,
  },
  {
    regulationId: "reg-law-ci-2024",
    title: "Nền tảng phân tích dữ liệu và AI cho phát hiện gian lận",
    description:
      "Xây dựng nền tảng analytics: anomaly detection, graph database cho link-analysis (mules). AI cho typology detection. Centralized transaction data lake. Đảm bảo model validation. Tránh bias.",
    department: "Information Technology",
    criticality: "medium",
    frequency: "once",
    penalty: "Thiếu năng lực phát hiện, khiển trách",
    tags: ["fraud", "ai", "analytics"],
    dueOffset: 150,
    status: "Draft",
    progress: 10,
  },
  {
    regulationId: "reg-law-ci-2024",
    title: "Đào tạo chống gian lận và kiểm soát nhân viên",
    description:
      "Đào tạo anti-fraud cho nhân viên. Chính sách quà tặng. Background checks. Thực thi chính sách misconduct nghiêm ngặt. Theo Law/Best Practice.",
    department: "Compliance",
    criticality: "high",
    frequency: "annually",
    penalty: "Gian lận nội bộ, khiển trách",
    tags: ["fraud", "training", "hr"],
    dueOffset: 40,
    status: "Assigned",
    progress: 30,
  },
  {
    regulationId: "reg-cyberlaw-2015",
    title: "Kế hoạch phản ứng sự cố và báo cáo (Incident Response)",
    description:
      "Kế hoạch IR cho breach an ninh mạng. Phối hợp với CERT/LEA khi cần. Báo cáo sự cố cho cơ quan chức năng theo Luật An ninh mạng. Ngân hàng thuộc cơ sở hạ tầng trọng yếu.",
    department: "Information Technology",
    criticality: "high",
    frequency: "biannually",
    penalty: "Báo cáo chậm trễ, phạt đến 1 tỷ VND",
    tags: ["fraud", "incident", "cyber"],
    dueOffset: -50,
    status: "Returned",
    progress: 35,
  },
  {
    regulationId: "reg-law-ci-2024",
    title: "Kênh whistleblower và đảm bảo 3LoD",
    description:
      "Thiết lập hotline, kênh whistleblower. Phân chia trách nhiệm (segregation of duties). Đảm bảo 3LoD assurance. Theo Luật TCTD 2024.",
    department: "Internal Audit",
    criticality: "medium",
    frequency: "annually",
    penalty: "Thiếu kênh báo cáo, khiển trách",
    tags: ["fraud", "whistleblower", "3lod"],
    dueOffset: 70,
    status: "Pending Review",
    progress: 45,
  },
];

// ---------------------------------------------------------------------------
// Assignments (review assignments — link regulations to departments)
// ---------------------------------------------------------------------------

export interface CuratedAssignment {
  regulationId: string;
  title: string;
  description: string;
  departmentIds: string[];
  priority: "low" | "medium" | "high" | "critical";
  dueOffset: number;
  status: string;
  notes?: string;
}

export const CURATED_ASSIGNMENTS: CuratedAssignment[] = [
  {
    regulationId: "reg-cir14-2025",
    title: "Đánh giá triển khai Basel III — Tỷ lệ an toàn vốn",
    description:
      "Đánh giá toàn diện tiến độ triển khai Thông tư 14/2025: nâng cấp công cụ tính CAR, phân loại vốn, RWA, bộ đệm, LCR/NSFR. Yêu cầu các khối liên quan báo cáo tiến độ và kế hoạch hoàn thành.",
    departmentIds: ["dept-risk", "dept-finance", "dept-treasury", "dept-it"],
    priority: "critical",
    dueOffset: -10,
    status: "in_progress",
    notes: "Ưu tiên cao nhất — deadline lộ trình Basel III 2030.",
  },
  {
    regulationId: "reg-cir83-2025",
    title: "Đánh giá hệ thống kiểm soát nội bộ theo Thông tư 83/2025",
    description:
      "Đánh giá hệ thống kiểm soát nội bộ: ba tuyến phòng vệ, quản trị rủi ro, RCSA, model risk, stress testing. Yêu cầu đánh giá gap so với yêu cầu Thông tư 83 và kế hoạch khắc phục.",
    departmentIds: [
      "dept-risk",
      "dept-compliance",
      "dept-audit",
      "dept-internal-control",
    ],
    priority: "critical",
    dueOffset: 30,
    status: "acknowledged",
    notes: "Thông tư 83 có hiệu lực từ 01/07/2026 — cần đánh giá ngay.",
  },
  {
    regulationId: "reg-aml-law-2022",
    title: "Rà soát chương trình AML/CFT theo Luật 14/2022",
    description:
      "Rà soát toàn bộ chương trình AML/CFT: KYC/CDD, UBO, customer risk rating, correspondent banking, CTR/STR, ongoing monitoring. Đánh giá tuân thủ từng điều khoản của Luật Phòng chống rửa tiền 2022.",
    departmentIds: ["dept-aml", "dept-compliance", "dept-risk"],
    priority: "critical",
    dueOffset: -20,
    status: "in_progress",
    notes: "Luật có hiệu lực từ 03/2023 — cần rà soát tuân thủ đầy đủ.",
  },
  {
    regulationId: "reg-cir27-2025",
    title: "Sẵn sàng báo cáo điện tử AML theo Thông tư 27/2025",
    description:
      "Đánh giá sẵn sàng hệ thống báo cáo điện tử CTR/STR cho FIU. Mapping data fields. Kiểm tra kết nối cổng báo cáo. Đào tạo nhân sự về quy trình e-reporting mới. Áp dụng từ 01/11/2025.",
    departmentIds: ["dept-aml", "dept-it", "dept-operations"],
    priority: "high",
    dueOffset: -5,
    status: "in_progress",
    notes: "Thông tư 27 có hiệu lực từ 01/11/2025.",
  },
  {
    regulationId: "reg-cir18-2019",
    title: "Rà soát bảo mật và kiểm soát gian lận ngân hàng điện tử",
    description:
      "Rà soát kiểm soát ngân hàng điện tử: mã hóa, xác thực 2FA, giới hạn giao dịch, giám sát gian lận. Đánh giá hệ thống phát hiện gian lận thời gian thực. Theo Thông tư 18/2019.",
    departmentIds: ["dept-it", "dept-operations", "dept-risk"],
    priority: "high",
    dueOffset: 15,
    status: "published",
  },
  {
    regulationId: "reg-cir40-2024",
    title: "Rà soát tuân thủ dịch vụ thanh toán theo Thông tư 40/2024",
    description:
      "Rà soát dịch vụ thanh toán: SCA, giới hạn giao dịch, báo cáo sự cố, due diligence đối tác fintech. Đánh giá bảo vệ người tiêu dùng trong thanh toán.",
    departmentIds: ["dept-operations", "dept-it", "dept-compliance"],
    priority: "high",
    dueOffset: 45,
    status: "acknowledged",
  },
  {
    regulationId: "reg-cyberlaw-2015",
    title: "Đánh giá an ninh mạng và kế hoạch phản ứng sự cố",
    description:
      "Đánh giá an ninh mạng: ngân hàng thuộc cơ sở hạ tầng trọng yếu. Rà soát kế hoạch phản ứng sự cố, báo cáo sự cố, quản lý rủi ro an ninh mạng. Theo Luật An ninh mạng 2015.",
    departmentIds: ["dept-it", "dept-risk", "dept-operations"],
    priority: "high",
    dueOffset: -30,
    status: "in_progress",
  },
  {
    regulationId: "reg-law-ci-2024",
    title: "Rà soát tuân thủ Luật Tổ chức tín dụng 2024",
    description:
      "Rà soát toàn diện tuân thủ Luật TCTD 2024: kiểm soát nội bộ (Điều 57), kiểm soát gian lận (Điều 55), quản trị, quản lý rủi ro. Đánh giá gap và kế hoạch khắc phục.",
    departmentIds: ["dept-legal", "dept-risk", "dept-compliance", "dept-board"],
    priority: "critical",
    dueOffset: 60,
    status: "published",
    notes: "Luật nền tảng — tất cả thông tư SBV đều dựa trên Luật này.",
  },
  {
    regulationId: "reg-cir14-2025",
    title: "Đánh giá quản lý rủi ro thanh khoản (LCR/NSFR)",
    description:
      "Đánh giá riêng rủi ro thanh khoản: thu thập dữ liệu HQLA, thử nghiệm áp lực thanh khoản, nâng cấp hệ thống treasury. Đảm bảo LCR ≥ 100%, NSFR ≥ 100%. Theo Thông tư 14 Điều 23.",
    departmentIds: ["dept-treasury", "dept-risk", "dept-finance"],
    priority: "high",
    dueOffset: 20,
    status: "acknowledged",
  },
  {
    regulationId: "reg-cir83-2025",
    title: "Triển khai khung quản lý rủi ro mô hình (MRM)",
    description:
      "Đánh giá và triển khai khung MRM: danh mục mô hình, kiểm định độc lập, backtesting. Bao gồm mô hình chấm điểm tín dụng, VaR, ALM. Theo Thông tư 83 Điều 32.",
    departmentIds: ["dept-risk", "dept-it", "dept-finance"],
    priority: "high",
    dueOffset: 90,
    status: "published",
    notes: "Một số quy định trì hoãn đến 2028 (Điều 44).",
  },
  {
    regulationId: "reg-cir14-2025",
    title: "Chuẩn bị công bố thông tin Pillar 3",
    description:
      "Chuẩn bị mẫu công bố Pillar 3: tỷ lệ vốn, RWA, chỉ số rủi ro, ICAAP. Tự động hóa trích xuất dữ liệu. Phối hợp Investor Relations. Theo Thông tư 14 Chương VI.",
    departmentIds: ["dept-finance", "dept-risk", "dept-compliance"],
    priority: "medium",
    dueOffset: 110,
    status: "published",
  },
  {
    regulationId: "reg-aml-law-2022",
    title: "Triển khai mô hình phân loại khách hàng theo rủi ro AML",
    description:
      "Triển khai Customer Risk Rating model: scorecard, PEP screening, risk-based CDD. Đào tạo nhân sự về risk-based approach. Theo Luật AML Điều 16.",
    departmentIds: ["dept-aml", "dept-compliance", "dept-it"],
    priority: "high",
    dueOffset: -15,
    status: "in_progress",
  },
];

// ---------------------------------------------------------------------------
// Obligations (assignment-linked, article-level)
// ---------------------------------------------------------------------------

export interface CuratedObligation {
  assignmentIndex: number;
  articleRef: string;
  title: string;
  description: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  dueOffset: number;
  status: string;
}

export const CURATED_OBLIGATIONS: CuratedObligation[] = [
  // Assignment 0: Basel III CAR Implementation
  {
    assignmentIndex: 0,
    articleRef: "Điều 5",
    title: "Tính toán CET1, Tier 1, Total Capital Ratio theo Basel III",
    description:
      "Cập nhật công cụ tính CAR với định nghĩa vốn Basel III mới. Phân loại công cụ vốn, giảm trừ goodwill và dự trữ.",
    riskLevel: "critical",
    dueOffset: -10,
    status: "cap_in_progress",
  },
  {
    assignmentIndex: 0,
    articleRef: "Điều 13",
    title: "Thiết lập CCB 2.5% và CCyB",
    description:
      "Xây dựng chính sách bộ đệm vốn. HĐQT phê duyệt trigger cổ tức. Báo cáo bộ đệm định kỳ.",
    riskLevel: "high",
    dueOffset: 30,
    status: "submitted",
  },
  {
    assignmentIndex: 0,
    articleRef: "Điều 17",
    title: "Áp dụng hệ số rủi ro cho vay bất động sản theo LTV",
    description:
      "Tái phân loại khoản vay BĐS theo LTV. Áp dụng hệ số rủi ro mới. Vay nhà ở xã hội được giảm hệ số.",
    riskLevel: "high",
    dueOffset: -25,
    status: "review_required",
  },
  {
    assignmentIndex: 0,
    articleRef: "Điều 23",
    title: "Đảm bảo LCR ≥ 100% và NSFR ≥ 100%",
    description:
      "Thu thập dữ liệu HQLA. Nâng cấp hệ thống treasury. Thử nghiệm áp lực thanh khoản.",
    riskLevel: "critical",
    dueOffset: -5,
    status: "cap_in_progress",
  },
  {
    assignmentIndex: 0,
    articleRef: "Điều 20",
    title: "Tính phí rủi ro hoạt động theo SMA",
    description:
      "Tổng hợp P&L theo khối. Tính phí rủi ro hoạt động theo phương pháp chỉ số cơ bản.",
    riskLevel: "medium",
    dueOffset: 15,
    status: "completed",
  },
  {
    assignmentIndex: 0,
    articleRef: "Chương VI",
    title: "Công bố thông tin Pillar 3",
    description:
      "Phát triển mẫu công bố. Tự động hóa trích xuất dữ liệu. Phối hợp Investor Relations.",
    riskLevel: "medium",
    dueOffset: 100,
    status: "draft",
  },

  // Assignment 1: ICS Assessment (Circular 83)
  {
    assignmentIndex: 1,
    articleRef: "Điều 1",
    title: "Thiết lập ba tuyến phòng vệ (3LoD)",
    description:
      "Định nghĩa tuyến 1 (business), tuyến 2 (risk/compliance), tuyến 3 (audit). Áp dụng risk taxonomy.",
    riskLevel: "critical",
    dueOffset: -15,
    status: "cap_in_progress",
  },
  {
    assignmentIndex: 1,
    articleRef: "Điều 4",
    title: "Bổ nhiệm CRO và bộ phận quản lý rủi ro độc lập",
    description:
      "Bổ nhiệm CRO đủ năng lực. Thiết lập bộ phận risk độc lập. Triển khai mô hình lượng hóa rủi ro.",
    riskLevel: "critical",
    dueOffset: 25,
    status: "submitted",
  },
  {
    assignmentIndex: 1,
    articleRef: "Điều 19",
    title: "Tuyên bố khẩu vị rủi ro được HĐQT phê duyệt",
    description:
      "Soạn thảo RAS với ngưỡng định lượng. Phê duyệt HĐQT. Tích hợp ICAAP.",
    riskLevel: "high",
    dueOffset: 10,
    status: "completed",
  },
  {
    assignmentIndex: 1,
    articleRef: "Điều 26",
    title: "RCSA và thư viện kiểm soát",
    description:
      "Phát triển quy trình RCSA. Xây dựng control library. Segregation of duties, dual control.",
    riskLevel: "high",
    dueOffset: -40,
    status: "review_required",
  },
  {
    assignmentIndex: 1,
    articleRef: "Điều 32",
    title: "Khung quản lý rủi ro mô hình (MRM)",
    description:
      "Lập danh mục mô hình. Kiểm định độc lập. Backtesting và benchmarking.",
    riskLevel: "high",
    dueOffset: 85,
    status: "draft",
  },
  {
    assignmentIndex: 1,
    articleRef: "Điều 22-24",
    title: "Chương trình kiểm tra sức chịu đựng đa rủi ro",
    description:
      "Thư viện kịch bản. Reverse stress test. Tích hợp CCyB trigger. Kế hoạch cấp vốn khẩn cấp.",
    riskLevel: "high",
    dueOffset: -8,
    status: "cap_in_progress",
  },

  // Assignment 2: AML/CFT Program Review
  {
    assignmentIndex: 2,
    articleRef: "Điều 10",
    title: "CDD/KYC đầy đủ cho tất cả khách hàng",
    description:
      "Thu thập thông tin nhận dạng. Nâng cấp eKYC. Lưu trữ trường KYC bắt buộc.",
    riskLevel: "critical",
    dueOffset: -20,
    status: "cap_in_progress",
  },
  {
    assignmentIndex: 2,
    articleRef: "Điều 13",
    title: "Xác định UBO cho khách hàng tổ chức",
    description:
      "Quy trình UBO (≥25%). Thêm trường UBO vào KYC. Hướng dẫn RM teams.",
    riskLevel: "high",
    dueOffset: 15,
    status: "submitted",
  },
  {
    assignmentIndex: 2,
    articleRef: "Điều 16",
    title: "Customer Risk Rating model",
    description:
      "Scorecard rủi ro. PEP screening. EDD cho high-risk. SDD cho low-risk.",
    riskLevel: "critical",
    dueOffset: -10,
    status: "cap_in_progress",
  },
  {
    assignmentIndex: 2,
    articleRef: "Điều 18",
    title: "Due diligence ngân hàng đại lý",
    description:
      "EDD ngân hàng đối tác. Tài liệu AML. Không làm việc với shell bank.",
    riskLevel: "high",
    dueOffset: 50,
    status: "submitted",
  },
  {
    assignmentIndex: 2,
    articleRef: "Điều 26",
    title: "Quy trình STR và báo cáo FIU",
    description:
      "Red-flag rules tự động. AML Compliance Officer. Workflow escalation. Báo cáo điện tử.",
    riskLevel: "critical",
    dueOffset: -5,
    status: "cap_in_progress",
  },

  // Assignment 3: AML e-reporting readiness
  {
    assignmentIndex: 3,
    articleRef: "Điều 3",
    title: "Đánh giá rủi ro AML theo phương pháp chấm điểm",
    description:
      "Công cụ chấm điểm 1-5. Rủi ro tiềm ẩn × hiệu quả kiểm soát. Phê duyệt hàng năm.",
    riskLevel: "high",
    dueOffset: 25,
    status: "draft",
  },
  {
    assignmentIndex: 3,
    articleRef: "Điều 6-7",
    title: "Kết nối hệ thống với cổng báo cáo FIU",
    description:
      "Tích hợp cổng FIU. Data field mapping. Form dự phòng. Thời hạn nộp.",
    riskLevel: "high",
    dueOffset: -12,
    status: "review_required",
  },
  {
    assignmentIndex: 3,
    articleRef: "Điều 8",
    title: "Giám sát giao dịch tài sản ảo",
    description:
      "Mở rộng monitoring cho crypto. Thông tin originator/beneficiary. Xử lý giao dịch không đầy đủ.",
    riskLevel: "medium",
    dueOffset: 70,
    status: "draft",
  },
  {
    assignmentIndex: 3,
    articleRef: "Điều 15",
    title: "Lưu trữ hồ sơ KYC 5 năm",
    description: "Kiểm tra hệ thống lưu trữ. Business continuity dữ liệu AML.",
    riskLevel: "medium",
    dueOffset: 55,
    status: "completed",
  },

  // Assignment 4: E-Banking security
  {
    assignmentIndex: 4,
    articleRef: "Điều 5",
    title: "Mã hóa và bảo mật hạ tầng ngân hàng điện tử",
    description: "Mã hóa end-to-end. Chứng thực điện tử. Bảo mật hạ tầng mạng.",
    riskLevel: "high",
    dueOffset: 5,
    status: "submitted",
  },
  {
    assignmentIndex: 4,
    articleRef: "Điều 8",
    title: "Kiểm soát giao dịch trực tuyến và ngăn ngừa gian lận",
    description:
      "Giám sát giao dịch bất thường. Cảnh báo gian lận. Hệ thống phát hiện real-time.",
    riskLevel: "critical",
    dueOffset: -30,
    status: "cap_in_progress",
  },
  {
    assignmentIndex: 4,
    articleRef: "Điều 10",
    title: "Xác thực đa yếu tố (2FA) cho giao dịch điện tử",
    description:
      "2FA cho tất cả giao dịch. OTP, device binding. EMV chip cho thẻ.",
    riskLevel: "high",
    dueOffset: 0,
    status: "completed",
  },
  {
    assignmentIndex: 4,
    articleRef: "Điều 12",
    title: "Cấu hình hạn mức giao dịch theo kênh",
    description: "Hạn mức theo kênh và loại khách hàng. Workflow ngoại lệ.",
    riskLevel: "medium",
    dueOffset: -3,
    status: "completed",
  },

  // Assignment 5: Payment Services compliance
  {
    assignmentIndex: 5,
    articleRef: "Điều 5",
    title: "An toàn thông tin và ngăn ngừa gian lận thanh toán",
    description:
      "Đảm bảo an toàn thông tin. Ngăn ngừa gian lận. Kiểm soát giao dịch.",
    riskLevel: "high",
    dueOffset: 35,
    status: "submitted",
  },
  {
    assignmentIndex: 5,
    articleRef: "Điều 8",
    title: "Xác thực mạnh (SCA) cho giao dịch thanh toán",
    description: "2FA, OTP, device binding cho thanh toán. EMV chip.",
    riskLevel: "high",
    dueOffset: 8,
    status: "completed",
  },
  {
    assignmentIndex: 5,
    articleRef: "Điều 15",
    title: "Due diligence đối tác fintech và PSP",
    description: "DD đối tác fintech. Hợp đồng anti-fraud. Giám sát đối tác.",
    riskLevel: "medium",
    dueOffset: 60,
    status: "draft",
  },

  // Assignment 6: Cybersecurity
  {
    assignmentIndex: 6,
    articleRef: "Điều 8",
    title: "Bảo vệ cơ sở hạ tầng thông tin trọng yếu",
    description:
      "Ngân hàng thuộc CIIP. Đảm bảo an ninh mạng. Đánh giá rủi ro định kỳ.",
    riskLevel: "high",
    dueOffset: -25,
    status: "cap_in_progress",
  },
  {
    assignmentIndex: 6,
    articleRef: "Điều 10",
    title: "Quy trình phản ứng sự cố mạng",
    description: "Phát hiện, phản ứng, xử lý sự cố. IR plan. Phối hợp CERT.",
    riskLevel: "high",
    dueOffset: -45,
    status: "review_required",
  },
  {
    assignmentIndex: 6,
    articleRef: "Điều 12",
    title: "Báo cáo sự cố an ninh mạng",
    description: "Báo cáo sự cố cho cơ quan chức năng. Thời hạn báo cáo.",
    riskLevel: "high",
    dueOffset: -15,
    status: "cap_in_progress",
  },

  // Assignment 7: Law CI 2024 compliance
  {
    assignmentIndex: 7,
    articleRef: "Điều 57",
    title: "Hệ thống kiểm soát nội bộ theo Luật TCTD",
    description:
      "ICS toàn doanh nghiệp. Three lines of defense. Kiểm toán nội bộ độc lập.",
    riskLevel: "critical",
    dueOffset: -50,
    status: "completed",
  },
  {
    assignmentIndex: 7,
    articleRef: "Điều 55",
    title: "Kiểm soát rủi ro gian lận và hoạt động",
    description:
      "Nhận diện rủi ro gian lận. Kiểm soát phát hiện. Quy trình điều tra.",
    riskLevel: "high",
    dueOffset: -5,
    status: "cap_in_progress",
  },
  {
    assignmentIndex: 7,
    articleRef: "Điều 58",
    title: "Quản lý rủi ro trọng yếu",
    description:
      "Nhận diện, đo lường, kiểm soát rủi ro tín dụng, thị trường, hoạt động, thanh khoản.",
    riskLevel: "high",
    dueOffset: 40,
    status: "submitted",
  },

  // Assignment 8: Liquidity risk
  {
    assignmentIndex: 8,
    articleRef: "Điều 23",
    title: "Đảm bảo LCR ≥ 100%",
    description: "Dữ liệu HQLA. Hệ thống giám sát LCR. Báo cáo hàng ngày.",
    riskLevel: "critical",
    dueOffset: -7,
    status: "cap_in_progress",
  },
  {
    assignmentIndex: 8,
    articleRef: "Điều 23",
    title: "Đảm bảo NSFR ≥ 100%",
    description:
      "Cơ cấu cấp vốn ổn định. Giám sát NSFR. Điều chỉnh chiến lược funding.",
    riskLevel: "high",
    dueOffset: 12,
    status: "submitted",
  },
  {
    assignmentIndex: 8,
    articleRef: "Điều 30",
    title: "Kiểm tra sức chịu đựng thanh khoản",
    description:
      "Kịch bản áp lực thanh khoản. Kế hoạch cấp vốn khẩn cấp. Contingency funding plan.",
    riskLevel: "high",
    dueOffset: 18,
    status: "draft",
  },

  // Assignment 9: MRM framework
  {
    assignmentIndex: 9,
    articleRef: "Điều 32",
    title: "Lập danh mục mô hình rủi ro",
    description:
      "Inventory tất cả mô hình: credit scoring, VaR, ALM, IFRS 9. Phân loại theo rủi ro.",
    riskLevel: "high",
    dueOffset: 75,
    status: "draft",
  },
  {
    assignmentIndex: 9,
    articleRef: "Điều 32",
    title: "Kiểm định độc lập mô hình",
    description:
      "Team kiểm định độc lập. Backtesting. Benchmarking. Model governance.",
    riskLevel: "high",
    dueOffset: 80,
    status: "draft",
  },

  // Assignment 10: Pillar 3 disclosure
  {
    assignmentIndex: 10,
    articleRef: "Chương VI",
    title: "Phát triển mẫu công bố Pillar 3",
    description: "Mẫu công bố: tỷ lệ vốn, RWA, rủi ro. Tự động hóa trích xuất.",
    riskLevel: "medium",
    dueOffset: 95,
    status: "draft",
  },
  {
    assignmentIndex: 10,
    articleRef: "Chương VI",
    title: "Tích hợp ICAAP vào công bố",
    description: "Công bố kết quả ICAAP. Pillar 3 disclosure templates.",
    riskLevel: "medium",
    dueOffset: 105,
    status: "draft",
  },

  // Assignment 11: Customer Risk Rating
  {
    assignmentIndex: 11,
    articleRef: "Điều 16",
    title: "Xây dựng scorecard phân loại khách hàng AML",
    description: "Scorecard rủi ro. Trọng số. Điểm cắt low/medium/high.",
    riskLevel: "critical",
    dueOffset: -12,
    status: "cap_in_progress",
  },
  {
    assignmentIndex: 11,
    articleRef: "Điều 17",
    title: "EDD cho khách hàng high-risk (PEP)",
    description:
      "PEP screening. EDD procedures. Approval workflow cho high-risk.",
    riskLevel: "high",
    dueOffset: 5,
    status: "submitted",
  },
  {
    assignmentIndex: 11,
    articleRef: "Điều 14",
    title: "SDD cho khách hàng low-risk",
    description: "Simplified due diligence. Danh mục khách hàng low-risk.",
    riskLevel: "low",
    dueOffset: 20,
    status: "completed",
  },
];

// ---------------------------------------------------------------------------
// CAPs (Corrective Action Plans)
// ---------------------------------------------------------------------------

export interface CuratedCAP {
  complianceIndex: number;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  rootCause: string;
  actionTitles: string[];
  dueOffset: number;
  status: string;
  estimatedCost: number;
}

export const CURATED_CAPS: CuratedCAP[] = [
  {
    complianceIndex: 0,
    title: "Khắc phục chậm trễ nâng cấp hệ thống tính CAR Basel III",
    description:
      "Hệ thống tính CAR chưa được cập nhật đầy đủ theo định nghĩa vốn Basel III. RWA tính sai do hệ số rủi ro cũ. Cần nâng cấp gấp để đáp ứng deadline Thông tư 14/2025.",
    priority: "critical",
    rootCause:
      "Thiếu nguồn lực IT và chưa phân bổ ngân sách kịp thời cho dự án nâng cấp capital engine.",
    actionTitles: [
      "Thuê cố vấn Basel III để rà soát gap công cụ tính CAR",
      "Nâng cấp capital calculation engine với định nghĩa vốn CET1/AT1/T2 mới",
      "Cập nhật bảng hệ số rủi ro RWA theo Thông tư 14 Điều 15-18",
      "Kiểm thử song song cũ/mới và đối chiếu kết quả với NHNN",
      "Triển khai production và đào tạo nhân viên báo cáo CAR",
    ],
    dueOffset: 30,
    status: "Open",
    estimatedCost: 450000,
  },
  {
    complianceIndex: 3,
    title: "Khắc phục sai lệch hệ số rủi ro cho vay bất động sản",
    description:
      "Hệ thống tín dụng chưa áp dụng hệ số rủi ro mới cho vay BĐS theo LTV. Khoản vay hiện tại chưa được tái phân loại. RWA bị sai lệch đáng kể.",
    priority: "high",
    rootCause:
      "Bộ phận Credit Risk chưa cập nhật policy và hệ thống chấm điểm theo LTV mới.",
    actionTitles: [
      "Cập nhật policy cho vay BĐS theo LTV categories mới",
      "Tái phân loại toàn bộ danh mục cho vay BĐS hiện tại",
      "Nâng cấp hệ thống chấm điểm tín dụng áp dụng RW mới",
      "Tính lại RWA và báo cáo điều chỉnh cho NHNN",
    ],
    dueOffset: -10,
    status: "Open",
    estimatedCost: 180000,
  },
  {
    complianceIndex: 4,
    title: "Khắc phục LCR dưới ngưỡng 100%",
    description:
      "Tỷ lệ đủ vốn ngắn hạn (LCR) giảm xuống dưới 100% do thiếu dữ liệu HQLA chính xác và chiến lược cấp vốn chưa tối ưu. Cần kế hoạch khắc phục gấp.",
    priority: "critical",
    rootCause:
      "Hệ thống treasury chưa theo dõi HQLA real-time; chiến lược funding quá phụ thuộc vào nguồn vốn ngắn hạn.",
    actionTitles: [
      "Nâng cấp hệ thống treasury để giám sát LCR hàng ngày",
      "Mở rộng danh mục HQLA (government bonds, cash reserves)",
      "Thử nghiệm áp lực thanh khoản theo kịch bản NHNN",
      "Xây dựng contingency funding plan và phê duyệt HĐQT",
      "Báo cáo kế hoạch khắc phục cho NHNN",
    ],
    dueOffset: 15,
    status: "Open",
    estimatedCost: 320000,
  },
  {
    complianceIndex: 8,
    title: "Thiết lập ba tuyến phòng vệ (3LoD) cho ICS",
    description:
      "Cấu trúc quản trị chưa phân chia rõ 3LoD. Tuyến 1 và tuyến 2 chồng chéo trách nhiệm. Tuyến 3 thiếu độc lập. Cần tái cơ cấu theo Thông tư 83/2025.",
    priority: "critical",
    rootCause:
      "Tổ chức hiện tại không phân chia rõ ràng vai trò business (1LoD), risk/compliance (2LoD), và audit (3LoD).",
    actionTitles: [
      "Soạn thảo charter 3LoD và phê duyệt HĐQT",
      "Định nghĩa RACI matrix cho từng tuyến phòng vệ",
      "Áp dụng risk taxonomy toàn ngân hàng",
      "Định nghĩa KRI cho từng loại rủi ro trọng yếu",
      "Đào tạo nhân sự về vai trò 3LoD",
    ],
    dueOffset: 45,
    status: "Open",
    estimatedCost: 250000,
  },
  {
    complianceIndex: 10,
    title: "Khắc phục RCSA không đầy đủ",
    description:
      "Quy trình RCSA chưa được triển khai toàn diện. Control library thiếu. Segregation of duties chưa được thực hiện nhất quán. Báo cáo RCSA bị trả về do thiếu chi tiết.",
    priority: "high",
    rootCause:
      "Thiếu quy trình RCSA chuẩn hóa và thư viện kiểm soát; các khối business tự thực hiện không đồng bộ.",
    actionTitles: [
      "Phát triển quy trình RCSA chuẩn toàn ngân hàng",
      "Xây dựng control library với 200+ controls theo COSO",
      "Đào tạo risk champions tại từng khối",
      "Thực hiện RCSA pilot tại 3 khối trọng yếu",
      "Triển khai RCSA toàn ngân hàng và báo cáo kết quả",
    ],
    dueOffset: -5,
    status: "Open",
    estimatedCost: 150000,
  },
  {
    complianceIndex: 18,
    title: "Khắc phục thiếu hụt dữ liệu KYC cho khách hàng hiện tại",
    description:
      "Nhiều khách hàng hiện tại thiếu thông tin KYC đầy đủ theo Điều 10 Luật AML 2022. Cần bổ sung gấp để đáp ứng yêu cầu CDD.",
    priority: "critical",
    rootCause:
      "Quy trình onboarding cũ không thu thập đủ trường KYC; thiếu hệ thống eKYC tự động.",
    actionTitles: [
      "Rà soát toàn bộ hồ sơ khách hàng và xác định gap KYC",
      "Triển khai eKYC với quét ID và OCR tự động",
      "Liên hệ khách hàng bổ sung thông tin thiếu",
      "Cập nhật core banking với trường KYC bắt buộc mới",
      "Đào tạo teller/RM về quy trình KYC mới",
    ],
    dueOffset: 20,
    status: "Open",
    estimatedCost: 280000,
  },
  {
    complianceIndex: 20,
    title: "Khắc phục Customer Risk Rating chưa được phê duyệt",
    description:
      "Mô hình phân loại khách hàng theo rủi ro AML chưa hoàn thiện. Scorecard thiếu trọng số. PEP screening chưa tích hợp. Cần hoàn thiện và phê duyệt gấp.",
    priority: "critical",
    rootCause:
      "Thiếu chuyên gia AML analytics; mô hình scorecard được phát triển nội bộ nhưng chưa được validate độc lập.",
    actionTitles: [
      "Thuê cố vấn AML để rà soát và hoàn thiện scorecard",
      "Tích hợp PEP screening database (WorldCheck hoặc tương đương)",
      "Validate mô hình với dữ liệu lịch sử và backtesting",
      "Phê duyệt mô hình qua AML Committee và HĐQT",
      "Triển khai vào core banking và giám sát hiệu suất",
    ],
    dueOffset: 25,
    status: "Open",
    estimatedCost: 200000,
  },
  {
    complianceIndex: 22,
    title: "Khắc phục quy trình STR không đáp ứng thời hạn",
    description:
      "Quy trình STR hiện tại thủ công, không đáp ứng thời hạn báo cáo FIU. Thiếu red-flag rules tự động. Cần tự động hóa toàn bộ workflow STR.",
    priority: "critical",
    rootCause:
      "Hệ thống AML monitoring cũ, thiếu rules engine tự động; STR được soạn thủ công bởi AML team.",
    actionTitles: [
      "Triển khai AML transaction monitoring system với rules engine",
      "Cấu hình 50+ red-flag rules theo Cir27 và FATF guidance",
      "Tự động hóa workflow STR: alert → investigation → filing",
      "Kết nối hệ thống với cổng báo cáo FIU (e-reporting)",
      "Đào tạo AML team về quy trình STR mới",
    ],
    dueOffset: -15,
    status: "Open",
    estimatedCost: 380000,
  },
  {
    complianceIndex: 24,
    title: "Khắc phục kết nối e-reporting FIU không ổn định",
    description:
      "Kết nối với cổng báo cáo FIU thường xuyên lỗi. Data field mapping sai. Báo cáo bị trả về. Cần khắc phục kỹ thuật và quy trình.",
    priority: "high",
    rootCause:
      "API integration với FIU được phát triển vội vàng, thiếu testing; data mapping không đồng bộ với thay đổi mẫu báo cáo.",
    actionTitles: [
      "Rà soát và cập nhật data field mapping theo mẫu FIU mới nhất",
      "Nâng cấp API integration với retry và error handling",
      "Triển khai form dự phòng thủ công (paper) khi hệ thống lỗi",
      "Kiểm thử end-to-end với FIU test environment",
      "Thiết lập monitoring và alerting cho kết nối FIU",
    ],
    dueOffset: 5,
    status: "Open",
    estimatedCost: 120000,
  },
  {
    complianceIndex: 27,
    title:
      "Khắc phục hệ thống giám sát gian lận thời gian thực chưa hoàn thiện",
    description:
      "Hệ thống fraud monitoring hiện tại chỉ rule-based, thiếu ML models. Không giám sát real-time trên tất cả kênh. Tỷ lệ false positive cao.",
    priority: "critical",
    rootCause:
      "Hệ thống fraud detection cũ, chỉ dựa trên static rules; thiếu đầu tư vào ML/analytics và data lake.",
    actionTitles: [
      "Đánh giá và chọn vendor fraud detection platform (Featurespace/NICE Actimize)",
      "Triển khai ML anomaly detection models cho cards, IB, mobile",
      "Xây dựng centralized transaction data lake",
      "Triển khai device fingerprinting và velocity checks",
      "Đào tạo fraud analysts về quy trình điều tra mới",
    ],
    dueOffset: 60,
    status: "Open",
    estimatedCost: 500000,
  },
  {
    complianceIndex: 30,
    title: "Khắc phục kế hoạch phản ứng sự cố an ninh mạng lỗi thời",
    description:
      "Kế hoạch IR chưa được cập nhật depuis 2022. Không có playbook cho ransomware. Báo cáo sự cố chậm trễ. Cần cập nhật theo Luật An ninh mạng.",
    priority: "high",
    rootCause:
      "IR plan không được review định kỳ; thiếu chuyên gia IR; không có tabletop exercise.",
    actionTitles: [
      "Cập nhật IR plan với playbook ransomware, phishing, DDoS",
      "Tổ chức tabletop exercise hàng năm với IT, Risk, Legal",
      "Thiết lập SOC 24/7 hoặc thuê MSSP",
      "Thiết lập quy trình báo cáo sự cố cho NHNN/CERT trong 24h",
      "Ký hợp đồng với IR retainer (forensics firm)",
    ],
    dueOffset: -20,
    status: "Open",
    estimatedCost: 220000,
  },
  {
    complianceIndex: 25,
    title: "Khắc phục chính sách chống gian lận chưa được HĐQT phê duyệt",
    description:
      "Chính sách anti-fraud đã soạn thảo nhưng chưa được HĐQT phê duyệt. Thiếu Fraud Committee. Tích hợp ICS chưa hoàn tất.",
    priority: "high",
    rootCause:
      "Chính sách bị đình trệ tại khâu review do thay đổi thành viên HĐQT; thiếu sponsor cấp cao.",
    actionTitles: [
      "Rà soát và cập nhật chính sách anti-fraud theo best practice",
      "Thành lập Fraud Risk Committee dưới HĐQT",
      "Trình HĐQT phê duyệt trong kỳ họp gần nhất",
      "Tích hợp chính sách vào ICS framework",
      "Công bố chính sách và đào tạo toàn ngân hàng",
    ],
    dueOffset: 10,
    status: "Pending Approval",
    estimatedCost: 75000,
  },
  {
    complianceIndex: 23,
    title: "Khắc phục thiếu EDD cho correspondent banking",
    description:
      "Due diligence cho ngân hàng đại lý chưa đầy đủ. Thiếu tài liệu AML từ đối tác. Chưa có quy trình review định kỳ. Cần khắc phục theo Điều 18.",
    priority: "high",
    rootCause:
      "Quy trình onboarding correspondent bank thiếu bước EDD; thiếu checklist AML documentation.",
    actionTitles: [
      "Xây dựng Correspondent Banking DD checklist theo Điều 18",
      "Yêu cầu tài liệu AML từ tất cả ngân hàng đối tác hiện tại",
      "Review và re-rating tất cả correspondent relationships",
      "Thiết lập lịch review định kỳ (hàng năm)",
      "Triển khai hệ thống quản lý correspondent banking data",
    ],
    dueOffset: 40,
    status: "Open",
    estimatedCost: 95000,
  },
  {
    complianceIndex: 21,
    title: "Khắc phục giám sát giao dịch liên tục không hiệu quả",
    description:
      "Hệ thống monitoring hiện tại thiếu scenario detection. Nhiều giao dịch đáng ngờ bị bỏ sót. Cần nâng cấp theo Luật AML và Cir27.",
    priority: "high",
    rootCause:
      "Hệ thống monitoring cũ với ít scenarios; thiếu cập nhật typology; AML team thiếu nhân lực.",
    actionTitles: [
      "Cập nhật 100+ monitoring scenarios theo FATF và Cir27 typologies",
      "Nâng cấp AML engine với scenario tuning và threshold optimization",
      "Bổ sung nhân lực AML investigation team",
      "Thiết lập quarterly scenario review và tuning",
      "Tích hợp KYC incomplete alerts vào monitoring workflow",
    ],
    dueOffset: -8,
    status: "Open",
    estimatedCost: 290000,
  },
  {
    complianceIndex: 14,
    title: "Khắc phục khung MRM chưa được triển khai",
    description:
      "Khung quản lý rủi ro mô hình chưa được thiết lập. Không có model inventory. Kiểm định độc lập thiếu. Cần triển khai theo Thông tư 83 Điều 32.",
    priority: "high",
    rootCause:
      "Thiếu đội model validation độc lập; model risk chưa được nhận diện là rủi ro trọng yếu trước Cir83.",
    actionTitles: [
      "Xây dựng MRM policy và framework theo Cir83 Điều 32",
      "Lập danh mục toàn bộ mô hình (credit, VaR, ALM, IFRS9)",
      "Thành lập đội model validation độc lập",
      "Lên lịch backtesting và benchmarking cho từng mô hình",
      "Triển khai model governance tool",
    ],
    dueOffset: 90,
    status: "Open",
    estimatedCost: 310000,
  },
];
