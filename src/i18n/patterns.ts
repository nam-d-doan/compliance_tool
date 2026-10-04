/**
 * Patterns for English text built at runtime (dates, counts, "Label (3)" …).
 * Each pattern must match the whole text. A replacement is either a regex
 * replacement string or a function that gets the match and a `tr` helper to
 * translate a captured part through the dictionary.
 */
export type Replacement =
  string | ((m: RegExpExecArray, tr: (s: string) => string) => string);

const MONTHS: Record<string, string> = {
  Jan: "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  May: "05",
  Jun: "06",
  Jul: "07",
  Aug: "08",
  Sep: "09",
  Oct: "10",
  Nov: "11",
  Dec: "12",
  January: "01",
  February: "02",
  March: "03",
  April: "04",
  June: "06",
  July: "07",
  August: "08",
  September: "09",
  October: "10",
  November: "11",
  December: "12",
};
const MON = Object.keys(MONTHS).join("|");
const mon = (m: string) => MONTHS[m];
const dd = (d: string) => d.padStart(2, "0");

const DAYS: Record<string, string> = {
  Mon: "T2",
  Tue: "T3",
  Wed: "T4",
  Thu: "T5",
  Fri: "T6",
  Sat: "T7",
  Sun: "CN",
  Monday: "Thứ Hai",
  Tuesday: "Thứ Ba",
  Wednesday: "Thứ Tư",
  Thursday: "Thứ Năm",
  Friday: "Thứ Sáu",
  Saturday: "Thứ Bảy",
  Sunday: "Chủ nhật",
};
const DAY = Object.keys(DAYS).join("|");

const LEVEL: Record<string, string> = {
  HIGH: "CAO",
  MEDIUM: "TRUNG BÌNH",
  LOW: "THẤP",
  CRITICAL: "NGHIÊM TRỌNG",
};

export const VI_PATTERNS: [RegExp, Replacement][] = [
  // ── Risk levels in capitals ──
  [/^(HIGH|MEDIUM|LOW|CRITICAL)$/, (m) => LEVEL[m[1]]],
  [
    /^(HIGH|MEDIUM|LOW|CRITICAL) \((\d+)\/100\)$/,
    (m) => `${LEVEL[m[1]]} (${m[2]}/100)`,
  ],
  [
    /^Rated (HIGH|MEDIUM|LOW|CRITICAL) \(score ([\d.]+)\)$/,
    (m) => `Xếp hạng ${LEVEL[m[1]]} (điểm ${m[2]})`,
  ],

  // ── Left as they are: codes, acronyms, e-mails, IDs ──
  [/^[^a-z]+$/, "$&"],
  [/^\(?[\w.+-]+@[\w.-]+\)?$/, "$&"],
  [/^[a-z]{2,5}-[a-z0-9-]+$/, "$&"],
  [/^[0-9a-f]{1,4}(:[0-9a-f]{1,4}){3,7}$/, "$&"],
  [/^(vbpl\.vn|VietLex|FinTech|Teams|SMS|PDF|Excel|Email)$/, "$&"],
  [/^(GPT-4o|Claude 3\.5 Sonnet|Gemini 1\.5 Pro|Llama 3 70B|Cao)$/, "$&"],
  [/^[a-z]+(?:[/-][a-z]+)+$/, "$&"],
  [/^[\w.-]+\.(pdf|xlsx?|docx?|png|jpe?g|csv)$/i, "$&"],
  [/^(\S+) is overdue \((\d+) days?\)$/, "$1 quá hạn ($2 ngày)"],
  [
    /^Demo clock set to \+(\d+) day\(s\); (\d+) automatic event\(s\)$/,
    "Đồng hồ demo: +$1 ngày; $2 sự kiện tự động",
  ],
  [
    /^(.+) extracted and added to Legal Updates$/,
    "$1 đã được trích xuất và thêm vào Cập nhật pháp lý",
  ],
  [/^OCR upload – (.+)$/, "Tải lên OCR – $1"],
  [/^OCR \+ AI extraction from (.+)$/, "Trích xuất OCR + AI từ $1"],
  [/^Remove (.+\.\w{2,4})$/, "Xóa $1"],
  [/^articles, (\d+) mapping suggestions?$/, "điều khoản, $1 gợi ý liên kết"],
  // "… — Điều 15" (article reference after a sentence)
  [/^(.+) — (Điều [\d.–-]+)$/, (m, tr) => `${tr(m[1])} — ${m[2]}`],
  // Dashboard greeting (the name in the greeting is the family name, so drop it)
  [/^Good morning, .+$/, "Chào buổi sáng!"],
  [/^Good afternoon, .+$/, "Chào buổi chiều!"],
  [/^Good evening, .+$/, "Chào buổi tối!"],
  [/^Working late, .+\?$/, "Làm việc muộn vậy?"],
  // ── Scheduler / notification messages around record names ──
  [
    /^Escalated to (.+?) \((\d+) day\(s\) past the due date\)$/,
    (m, tr) => `Đã leo thang lên ${tr(m[1])} (quá hạn ${m[2]} ngày)`,
  ],
  [
    /^Escalated to (.+?) \((Rated .+)\)$/,
    (m, tr) => `Đã leo thang lên ${tr(m[1])} (${tr(m[2])})`,
  ],
  [/^Escalated to (.+)$/, (m, tr) => `Đã leo thang lên ${tr(m[1])}`],
  [
    /^Rated (HIGH|MEDIUM|LOW) \(score ([\d.]+)\)\. Escalated to (.+)$/,
    (m, tr) =>
      `Xếp hạng ${LEVEL[m[1]]} (điểm ${m[2]}). Đã leo thang lên ${tr(m[3])}`,
  ],
  [
    /^day\(s\) past the due date\. Escalated to (.+)$/,
    (m, tr) => `ngày quá hạn. Đã leo thang lên ${tr(m[1])}`,
  ],
  [
    /^day\(s\) past the committed date\. Escalated to (.+)$/,
    (m, tr) => `ngày quá ngày cam kết. Đã leo thang lên ${tr(m[1])}`,
  ],
  [/^(.+) is now overdue \((\d+) days?\)$/, "$1 đã quá hạn ($2 ngày)"],
  [
    /^(.+) escalated to (.+)$/,
    (m, tr) => `${m[1]} đã leo thang lên ${tr(m[2])}`,
  ],
  [/^(.+) flagged as late-issuance risk$/, "$1 có nguy cơ chậm ban hành"],
  [/^(.+) is due in (\d+) day\(s\)$/, "$1 đến hạn sau $2 ngày"],
  [/^(.+) is (\d+) day\(s\) overdue$/, "$1 quá hạn $2 ngày"],
  [
    /^(.+) is (\d+) day\(s\) past the committed date$/,
    "$1 quá ngày cam kết $2 ngày",
  ],
  [/^(.+) must be issued in (\d+) day\(s\)$/, "$1 phải ban hành trong $2 ngày"],
  [/^lead unit (.+)$/, "đơn vị chủ trì $1"],
  [/^Draft by lead unit \((.+)\)$/, "Dự thảo của đơn vị chủ trì ($1)"],
  [/^Compliance review \((.+)\)$/, "Tuân thủ thẩm định ($1)"],
  [/^Escalation acknowledged by (.+)$/, "Đã xác nhận leo thang bởi $1"],
  [/^Done by (.+)$/, "Hoàn tất bởi $1"],
  [/^signed by (.+)$/, "ký bởi $1"],
  [/^by (.+)$/, "bởi $1"],
  [
    /^Deep-dive AI impact assessment for (.+)$/,
    "Phân tích tác động chuyên sâu bằng AI cho $1",
  ],
  [/^Received from (.+)$/, "Tiếp nhận từ $1"],
  [/^Select (.+)$/, "Chọn $1"],
  // Audit log line: "<action> in <module>"
  [
    /^([a-z_]+) in ([a-z_]+)$/,
    (m, tr) => `${tr(m[1].replace(/_/g, " "))} — ${tr(m[2])}`,
  ],

  // ── Enum values shown raw (snake_case) ──
  [/^[a-z]+(?:_[a-z]+)+$/, (m, tr) => tr(m[0].replace(/_/g, " "))],

  // ── Deadlines and day counts (compact forms) ──
  [/^(\d+)d to deadline$/, "còn $1 ngày đến hạn"],
  [/^in force (\d+)d ago$/, "đã hiệu lực $1 ngày"],
  [/^in force in (\d+)d$/, "hiệu lực sau $1 ngày"],
  [/^(\d+)d overdue$/, "quá hạn $1 ngày"],
  [/^\+?(\d+)d late$/, "chậm $1 ngày"],
  [/^(\d+)d early$/, "sớm $1 ngày"],
  [/^(\d+)d left$/, "còn $1 ngày"],
  [/^avg (\d+) day\(s\) late$/, "trung bình chậm $1 ngày"],
  [/^Due (\d{2}\/\d{2}\/\d{4}) \((-?\d+)d\)$/, "Hạn $1 (còn $2 ngày)"],
  [/^(\d{2}\/\d{2}\/\d{4}) \(in force (\d+)d\)$/, "$1 (đã hiệu lực $2 ngày)"],
  [/^days left \((.+)\)$/, "ngày còn lại ($1)"],
  [/^From (\d{2}\/\d{2}\/\d{4})$/, "Từ $1"],
  [/^Current \(v(\d+)\)$/, "Hiện hành (v$1)"],
  [/^Score (\d) label$/, "Nhãn điểm $1"],
  [
    /^Evidence round (\d+) submitted \((.+)\)$/,
    "Đã nộp bằng chứng lần $1 ($2)",
  ],
  [/^(.+) legend icon$/, (m, tr) => `${tr(m[1])} (chú giải)`],
  [/^Relationship map of (.+)$/, "Bản đồ mối quan hệ của $1"],
  [
    /^Risk rated (HIGH|MEDIUM|LOW) \(score ([\d.]+), matrix v(\d+)\)$/,
    (m) => `Xếp hạng rủi ro ${LEVEL[m[1]]} (điểm ${m[2]}, ma trận v${m[3]})`,
  ],
  [
    /^Issue recorded from ([a-z_]+)$/,
    (m, tr) =>
      `Ghi nhận vấn đề từ nguồn ${tr(m[1].replace(/_/g, " ")).toLowerCase()}`,
  ],
  [
    /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (.+)$/,
    (m) => `${DAYS[m[1]]}, ${m[2]}`,
  ],

  // ── Dates (date-fns English formats → Vietnamese dd/MM/yyyy) ──
  [
    new RegExp(
      `^(${"January|February|March|April|May|June|July|August|September|October|November|December"}) (\\d{1,2})(?:st|nd|rd|th),? (\\d{4})$`,
    ),
    (m) => `${m[2].padStart(2, "0")}/${MONTHS[m[1]]}/${m[3]}`,
  ],
  [
    new RegExp(`^(${MON}) (\\d{1,2}),? (\\d{4})$`),
    (m) => `${dd(m[2])}/${mon(m[1])}/${m[3]}`,
  ],
  [
    new RegExp(
      `^(${MON}) (\\d{1,2}),? (\\d{4}),? (\\d{1,2}:\\d{2}(?::\\d{2})?)$`,
    ),
    (m) => `${dd(m[2])}/${mon(m[1])}/${m[3]} ${m[4]}`,
  ],
  [
    new RegExp(
      `^(${MON}) (\\d{1,2}),? (\\d{4}) (?:at )?(\\d{1,2}:\\d{2}) ?(AM|PM)$`,
      "i",
    ),
    (m) =>
      `${dd(m[2])}/${mon(m[1])}/${m[3]} ${m[4]} ${m[5].toUpperCase() === "AM" ? "SA" : "CH"}`,
  ],
  [
    new RegExp(`^(\\d{1,2}) (${MON}),? (\\d{4})$`),
    (m) => `${dd(m[1])}/${mon(m[2])}/${m[3]}`,
  ],
  [
    new RegExp(`^(${MON}) (\\d{1,2}),? (\\d{1,2}:\\d{2})$`),
    (m) => `${dd(m[2])}/${mon(m[1])} ${m[3]}`,
  ],
  [new RegExp(`^(${MON}) (\\d{1,2})$`), (m) => `${dd(m[2])}/${mon(m[1])}`],
  [new RegExp(`^(\\d{1,2}) (${MON})$`), (m) => `${dd(m[1])}/${mon(m[2])}`],
  [new RegExp(`^(${MON}) (\\d{4})$`), (m) => `T${mon(m[1])}/${m[2]}`],
  [new RegExp(`^(${MON}) '(\\d{2})$`), (m) => `T${mon(m[1])}/${m[2]}`],
  [new RegExp(`^(${MON})$`), (m) => `T${mon(m[1])}`],
  [
    new RegExp(`^(${DAY}),? (${MON}) (\\d{1,2}),? (\\d{4})$`),
    (m) => `${DAYS[m[1]]}, ${dd(m[3])}/${mon(m[2])}/${m[4]}`,
  ],
  [
    new RegExp(`^(${DAY}),? (${MON}) (\\d{1,2})$`),
    (m) => `${DAYS[m[1]]}, ${dd(m[3])}/${mon(m[2])}`,
  ],
  [new RegExp(`^(${DAY})$`), (m) => DAYS[m[1]]],
  [
    /^(\d{1,2}:\d{2}) ?(AM|PM)$/i,
    (m) => `${m[1]} ${m[2].toUpperCase() === "AM" ? "SA" : "CH"}`,
  ],

  // ── Relative time ──
  [
    /^(?:about )?(\d+|an?) (second|minute|hour|day|week|month|year)s? ago$/,
    (m) => `${/^an?$/.test(m[1]) ? 1 : m[1]} ${UNIT[m[2]]} trước`,
  ],
  [
    /^in (?:about )?(\d+|an?) (second|minute|hour|day|week|month|year)s?$/,
    (m) => `${/^an?$/.test(m[1]) ? 1 : m[1]} ${UNIT[m[2]]} nữa`,
  ],
  [/^less than a minute ago$/, "vừa xong"],
  [/^just now$/i, "vừa xong"],

  // ── Durations and counts ──
  [
    /^([+-]?\d+(?:[.,]\d+)?) ?(second|minute|hour|day|week|month|year)s?$/i,
    (m) => `${m[1]} ${UNIT[m[2].toLowerCase()]}`,
  ],
  [/^([+-]?\d+(?:[.,]\d+)?)(d|h|m|w)$/, (m) => `${m[1]} ${SHORT_UNIT[m[2]]}`],
  [
    /^(\d+) days? (overdue|late|left|remaining|to go)$/i,
    (m) =>
      `${m[2].toLowerCase() === "overdue" || m[2].toLowerCase() === "late" ? "Quá hạn" : "Còn"} ${m[1]} ngày`,
  ],
  [
    /^(\d+) days? past (?:the )?(.+)$/i,
    (m, tr) => `Quá ${m[1]} ngày so với ${tr(m[2])}`,
  ],
  [/^overdue by (\d+) days?$/i, (m) => `Quá hạn ${m[1]} ngày`],
  [/^due in (\d+) days?$/i, (m) => `Còn ${m[1]} ngày đến hạn`],
  [
    /^due (today|tomorrow)$/i,
    (m) =>
      m[1].toLowerCase() === "today" ? "Đến hạn hôm nay" : "Đến hạn ngày mai",
  ],
  [/^page (\d+) of (\d+)$/i, "Trang $1/$2"],
  [
    /^showing (\d+)\s*[–-]\s*(\d+) of (\d+)(.*)$/i,
    (m, tr) =>
      `Hiển thị ${m[1]}–${m[2]} trên ${m[3]}${m[4] ? " " + tr(m[4].trim()) : ""}`,
  ],
  [/^(\d+) of (\d+)$/, "$1/$2"],
  [/^(\d+) of (\d+) (.+)$/, (m, tr) => `${m[1]}/${m[2]} ${tr(m[3])}`],
  [/^\+(\d+) more$/i, "+$1 nữa"],
  [/^(\d+) more$/i, "thêm $1"],
  [/^v(\d+(?:\.\d+)*)$/, "v$1"],

  // "Effective Jul 1, 2026" — a label followed by a date
  [
    new RegExp(`^(.+?) ((?:${MON}) \\d{1,2}(?:st|nd|rd|th)?,? \\d{4})$`),
    (m, tr) => `${tr(m[1])} ${tr(m[2])}`,
  ],

  // ── Compositional fallbacks (translate the parts) ──
  // "Label (3)" / "Label: 3" / "3 label" / "Label · Label"
  [/^(.+?) \((\d+(?:[.,]\d+)?%?)\)$/, (m, tr) => `${tr(m[1])} (${m[2]})`],
  [/^(.+?): ([\d.,]+%?)$/, (m, tr) => `${tr(m[1])}: ${m[2]}`],
  [/^([+-]?[\d.,]+%?) (.+)$/, (m, tr) => `${m[1]} ${tr(m[2])}`],
  [/^(.+?) ([+-]?[\d.,]+%?)$/, (m, tr) => `${tr(m[1])} ${m[2]}`],
  [/^(.+?) · (.+)$/, (m, tr) => m[0].split(" · ").map(tr).join(" · ")],
  [/^(.+?) → (.+)$/, (m, tr) => m[0].split(" → ").map(tr).join(" → ")],
  [/^(.+?) \/ (.+)$/, (m, tr) => m[0].split(" / ").map(tr).join(" / ")],
  [/^(.+?): (.+)$/, (m, tr) => `${tr(m[1])}: ${tr(m[2])}`],
  [/^(.+?) — (.+)$/, (m, tr) => `${tr(m[1])} — ${tr(m[2])}`],
  [/^(.+?)([.:…])$/, (m, tr) => `${tr(m[1])}${m[2]}`],
];

const UNIT: Record<string, string> = {
  second: "giây",
  minute: "phút",
  hour: "giờ",
  day: "ngày",
  week: "tuần",
  month: "tháng",
  year: "năm",
};
const SHORT_UNIT: Record<string, string> = {
  d: "ngày",
  h: "giờ",
  m: "phút",
  w: "tuần",
};
