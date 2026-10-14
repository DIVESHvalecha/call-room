export default function MockMapModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6" onClick={onClose}>
      <div className="panel panel-edge volt mx-auto max-w-md p-5 text-sm" onClick={(e) => e.stopPropagation()}>
        <h3 className="cond text-xl font-bold text-[var(--volt)]">Mock-Map (Architecture Disclosure)</h3>
        <p className="mt-2 text-xs" style={{ color: "var(--text-2)" }}>
          Score: ball-by-ball delivery replay (disclosed). Room: simulated 128 bots. Qs: Gemini 2.0 Flash + dynamic contextual fallback. Board: local state + localStorage. Rarity scoring: pure auditable math.
        </p>
        <button onClick={onClose} className="btn-volt mt-4 w-full min-h-[44px]">Close</button>
      </div>
    </div>
  );
}
