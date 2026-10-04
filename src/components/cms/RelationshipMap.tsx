import { useNavigate } from "react-router-dom";
import { MAPPING_ACTION_SHORT } from "@/lib/cms-rules";
import type { LegalMapping, LegalRelation, LegalUpdate } from "@/types";

const RELATION_LABEL: Record<LegalRelation["type"], string> = {
  amends: "amends",
  replaces: "replaces",
  guides: "guides",
  repeals: "repeals",
  guided_by: "based on",
};

const ACTION_COLOR: Record<LegalMapping["action"], string> = {
  amend: "#d97706",
  supplement: "#2563eb",
  replace: "#dc2626",
  repeal: "#6b7280",
  new: "#16a34a",
};

/**
 * "Lược đồ" — relationship map of a legal document: its family tree on the
 * left (amends / replaces / guided by), the internal regulations it affects
 * in the middle-right, and the lead units on the far right (RFQ 1.2).
 */
export function RelationshipMap({
  update,
  unitNames,
}: {
  update: LegalUpdate;
  unitNames: Record<string, string>;
}) {
  const navigate = useNavigate();
  const mappings = update.mappings.filter((m) => m.status !== "rejected");
  const relations = update.relations;
  const units = Array.from(
    new Set(mappings.map((m) => m.leadUnitId).filter(Boolean) as string[]),
  );

  const rowH = 58;
  const rows = Math.max(mappings.length, relations.length, units.length, 1);
  const height = Math.max(220, rows * rowH + 40);
  const W = 1000;
  const colX = { rel: 20, law: 300, qdnb: 560, unit: 830 };
  const boxW = { rel: 220, law: 200, qdnb: 230, unit: 150 };
  const centerY = height / 2;
  const yFor = (i: number, n: number) =>
    centerY - ((n - 1) * rowH) / 2 + i * rowH;

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-muted/20 p-2">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        className="h-auto w-full min-w-[720px] text-foreground"
        role="img"
        aria-label={`Relationship map of ${update.docNumber}`}
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" opacity="0.5" />
          </marker>
        </defs>

        {/* column headers */}
        {[
          ["Family tree (Lược đồ)", colX.rel],
          ["New document", colX.law],
          ["Internal regulations (QĐNB)", colX.qdnb],
          ["Lead unit", colX.unit],
        ].map(([label, x]) => (
          <text
            key={label as string}
            x={x as number}
            y={16}
            fontSize={11}
            fill="currentColor"
            opacity={0.55}
            fontWeight={600}
          >
            {label}
          </text>
        ))}

        {/* relations → law */}
        {relations.map((r, i) => {
          const y = yFor(i, relations.length);
          return (
            <g key={r.docNumber}>
              <path
                d={`M ${colX.rel + boxW.rel} ${y} C ${colX.law - 40} ${y}, ${colX.rel + boxW.rel + 40} ${centerY}, ${colX.law} ${centerY}`}
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.3}
                strokeDasharray="4 3"
              />
              <rect
                x={colX.rel}
                y={y - 20}
                width={boxW.rel}
                height={40}
                rx={8}
                className="fill-card stroke-border"
              />
              <text
                x={colX.rel + 10}
                y={y - 4}
                fontSize={11}
                fontWeight={700}
                fill="currentColor"
              >
                {r.docNumber}
              </text>
              <text
                x={colX.rel + 10}
                y={y + 11}
                fontSize={9.5}
                fill="currentColor"
                opacity={0.6}
              >
                {RELATION_LABEL[r.type]} ·{" "}
                {r.title.length > 30 ? `${r.title.slice(0, 30)}…` : r.title}
              </text>
            </g>
          );
        })}

        {/* law node */}
        <g>
          <rect
            x={colX.law}
            y={centerY - 34}
            width={boxW.law}
            height={68}
            rx={12}
            fill="#0c3767"
          />
          <text x={colX.law + 12} y={centerY - 12} fontSize={10} fill="#dcecff">
            {update.docType} · {update.issuer}
          </text>
          <text
            x={colX.law + 12}
            y={centerY + 6}
            fontSize={14}
            fontWeight={800}
            fill="#ffffff"
          >
            {update.docNumber}
          </text>
          <text
            x={colX.law + 12}
            y={centerY + 22}
            fontSize={9.5}
            fill="#dcecff"
          >
            Effective{" "}
            {new Date(update.effectiveDate).toLocaleDateString("vi-VN")}
          </text>
        </g>

        {/* law → qdnb */}
        {mappings.map((m, i) => {
          const y = yFor(i, mappings.length);
          const color = ACTION_COLOR[m.action];
          const unitIdx = units.indexOf(m.leadUnitId ?? "");
          const uy = unitIdx >= 0 ? yFor(unitIdx, units.length) : y;
          return (
            <g key={m.id}>
              <path
                d={`M ${colX.law + boxW.law} ${centerY} C ${colX.qdnb - 50} ${centerY}, ${colX.law + boxW.law + 50} ${y}, ${colX.qdnb} ${y}`}
                fill="none"
                stroke={color}
                strokeWidth={m.status === "accepted" ? 2.2 : 1.4}
                strokeDasharray={m.status === "suggested" ? "5 4" : undefined}
              />
              <rect
                x={colX.qdnb - 4}
                y={y - 9}
                width={62}
                height={16}
                rx={8}
                fill={color}
                transform={`translate(${-70} 0)`}
              />
              <text
                x={colX.qdnb - 70}
                y={y + 3}
                fontSize={9}
                fontWeight={700}
                fill="#fff"
                textAnchor="start"
              >
                {MAPPING_ACTION_SHORT[m.action]}
              </text>
              <g
                className={m.qdnbId ? "cursor-pointer" : undefined}
                onClick={() => m.qdnbId && navigate(`/qdnb/${m.qdnbId}`)}
              >
                <rect
                  x={colX.qdnb}
                  y={y - 21}
                  width={boxW.qdnb}
                  height={42}
                  rx={8}
                  className="fill-card"
                  stroke={color}
                  strokeOpacity={0.6}
                />
                <text
                  x={colX.qdnb + 10}
                  y={y - 4}
                  fontSize={11}
                  fontWeight={700}
                  fill="currentColor"
                >
                  {m.qdnbCode}
                </text>
                <text
                  x={colX.qdnb + 10}
                  y={y + 11}
                  fontSize={9.5}
                  fill="currentColor"
                  opacity={0.65}
                >
                  {m.qdnbTitle.length > 36
                    ? `${m.qdnbTitle.slice(0, 36)}…`
                    : m.qdnbTitle}
                </text>
              </g>
              {unitIdx >= 0 && (
                <path
                  d={`M ${colX.qdnb + boxW.qdnb} ${y} C ${colX.unit - 30} ${y}, ${colX.qdnb + boxW.qdnb + 30} ${uy}, ${colX.unit} ${uy}`}
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity={0.25}
                  markerEnd="url(#arrow)"
                />
              )}
            </g>
          );
        })}

        {/* units */}
        {units.map((u, i) => {
          const y = yFor(i, units.length);
          const name = unitNames[u] ?? u;
          return (
            <g key={u}>
              <rect
                x={colX.unit}
                y={y - 16}
                width={boxW.unit}
                height={32}
                rx={16}
                className="fill-muted stroke-border"
              />
              <text
                x={colX.unit + boxW.unit / 2}
                y={y + 4}
                fontSize={10}
                fontWeight={600}
                textAnchor="middle"
                fill="currentColor"
              >
                {name.length > 24 ? `${name.slice(0, 24)}…` : name}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-3 px-2 pt-1 text-[11px] text-muted-foreground">
        {(Object.keys(ACTION_COLOR) as LegalMapping["action"][]).map((a) => (
          <span key={a} className="inline-flex items-center gap-1">
            <span
              className="h-0.5 w-4"
              style={{ background: ACTION_COLOR[a] }}
            />
            {MAPPING_ACTION_SHORT[a]}
          </span>
        ))}
        <span className="inline-flex items-center gap-1">
          <span className="h-0 w-4 border-t border-dashed border-current" /> AI
          suggestion (not yet confirmed)
        </span>
      </div>
    </div>
  );
}
