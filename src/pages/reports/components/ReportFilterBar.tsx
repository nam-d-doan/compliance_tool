import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ReportFilterBarProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  businessUnit?: string;
  department?: string;
  regulation?: string;
  status?: string;
  businessUnits?: string[];
  departments?: string[];
  regulations?: string[];
  statuses?: string[];
  onBusinessUnitChange?: (value: string) => void;
  onDepartmentChange?: (value: string) => void;
  onRegulationChange?: (value: string) => void;
  onStatusChange?: (value: string) => void;
  onExport?: () => void;
  className?: string;
}

function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
}: {
  label: string;
  value?: string;
  options?: string[];
  onChange?: (value: string) => void;
  placeholder?: string;
}) {
  if (!options || !onChange) return null;
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-foreground">{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/50"
      >
        <option value="">{placeholder ?? `All ${label}s`}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ReportFilterBar({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  businessUnit,
  department,
  regulation,
  status,
  businessUnits,
  departments,
  regulations,
  statuses,
  onBusinessUnitChange,
  onDepartmentChange,
  onRegulationChange,
  onStatusChange,
  onExport,
  className,
}: ReportFilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-foreground">
            Date range
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/50"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/50"
            />
          </div>
        </div>

        <SelectField
          label="Business Unit"
          value={businessUnit}
          options={businessUnits}
          onChange={onBusinessUnitChange}
        />
        <SelectField
          label="Department"
          value={department}
          options={departments}
          onChange={onDepartmentChange}
        />
        <SelectField
          label="Regulation"
          value={regulation}
          options={regulations}
          onChange={onRegulationChange}
        />
        <SelectField
          label="Status"
          value={status}
          options={statuses}
          onChange={onStatusChange}
        />

        {onExport && (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={onExport}
          >
            <Download className="size-3.5" aria-hidden="true" />
            Export
          </Button>
        )}
      </div>
    </div>
  );
}
