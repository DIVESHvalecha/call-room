export default function Ticker() {
  const line = "LIVE • IND v WI • TARGET 406 • CHASE ON • TOP CALLER: RAHUL  • >>> ";
  return (
    <div className="ticker" aria-hidden>
      <div className="ticker-inner">{line.repeat(4)}</div>
    </div>
  );
}
