import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLMT } from "@/constants/lm-i18n";

/**
 * Nút đổi EN/VI cho các trang LM. Nhãn hiện NGÔN NGỮ SẼ CHUYỂN SANG (bấm
 * "VI" khi đang xem tiếng Anh để đổi sang tiếng Việt), không phải ngôn ngữ
 * hiện tại — cùng quy ước với các toggle ngôn ngữ phổ biến khác.
 */
export function LMLangToggle() {
  const { t, toggleLang } = useLMT();
  return (
    <Button variant="outline" size="sm" onClick={toggleLang}>
      <Languages className="size-4" aria-hidden="true" />
      {t("langToggleLabel")}
    </Button>
  );
}
