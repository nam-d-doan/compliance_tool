export function AuroraBackground() {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{ background: "var(--page-gradient)" }}
      aria-hidden="true"
    >
      <div
        className="animate-drift1 absolute -top-56 -left-40 size-[620px] rounded-full opacity-25 blur-[120px]"
        style={{ background: "var(--blob-1)" }}
      />
      <div
        className="animate-drift2 absolute -right-40 -bottom-52 size-[560px] rounded-full opacity-20 blur-[130px]"
        style={{ background: "var(--blob-2)" }}
      />
      <div
        className="animate-drift3 absolute -top-24 right-[5%] size-[480px] rounded-full opacity-15 blur-[120px]"
        style={{ background: "var(--blob-3)" }}
      />
    </div>
  );
}
