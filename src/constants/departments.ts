/**
 * Vietnamese department and sub-office directory used by the assignment
 * create flow. Departments that operate across regional branches expose
 * a list of sub-offices; headquarters-only departments have an empty list.
 */

export interface OfficeOption {
  id: string;
  name: string;
}

export interface DepartmentOption {
  id: string;
  name: string;
  offices: OfficeOption[];
}

export const VIETNAMESE_DEPARTMENTS: DepartmentOption[] = [
  {
    id: "dept-credit",
    name: "Khối Quản lý Tín dụng",
    offices: [
      { id: "off-credit-hn", name: "CN Hà Nội" },
      { id: "off-credit-hcm", name: "CN TP.HCM" },
      { id: "off-credit-dn", name: "Chi nhánh Đà Nẵng" },
    ],
  },
  {
    id: "dept-legal",
    name: "Khối Pháp chế",
    offices: [],
  },
  {
    id: "dept-risk",
    name: "Khối Quản lý Rủi ro",
    offices: [
      { id: "off-risk-hn", name: "CN Hà Nội" },
      { id: "off-risk-hcm", name: "CN TP.HCM" },
    ],
  },
  {
    id: "dept-operations",
    name: "Khối Vận hành",
    offices: [
      { id: "off-ops-hn", name: "CN Hà Nội" },
      { id: "off-ops-hcm", name: "CN TP.HCM" },
      { id: "off-ops-dn", name: "Chi nhánh Đà Nẵng" },
      { id: "off-ops-ct", name: "Chi nhánh Cần Thơ" },
    ],
  },
  {
    id: "dept-audit",
    name: "Khối Kiểm toán nội bộ",
    offices: [],
  },
];

export function getDepartmentById(id: string): DepartmentOption | undefined {
  return VIETNAMESE_DEPARTMENTS.find((d) => d.id === id);
}

export function getOfficesForDepartment(departmentId: string): OfficeOption[] {
  return getDepartmentById(departmentId)?.offices ?? [];
}
