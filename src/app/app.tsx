import { getCard, getDeckCount } from "./vocab";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatShortDate(d: Date): string {
  const dayName = DAYS[d.getDay()] || "Sun";
  const monthName = MONTHS[d.getMonth()] || "Jan";
  return `${dayName}, ${monthName} ${d.getDate()}`;
}

export function get(app: FrameOSApp, context: FrameOSContext) {
  const W = context.imageWidth ?? app.frame.width ?? 800;
  const H = context.imageHeight ?? app.frame.height ?? 480;
  const isPortrait = H > W;

  const lang = String(app.state.language || app.config.defaultLanguage || "es");
  const mode = String(app.state.mode || "flashcard");
  const showReading = String(app.state.showReading ?? "true") !== "false";
  const useNativeCjk =
    app.state.useNativeCjk === true || app.state.useNativeCjk === "true";
  const revealed =
    mode === "wordOfTheDay" ||
    app.state.revealed === true ||
    app.state.revealed === "true";

  // In "wordOfTheDay" mode, default to a daily rotating index if cardIndex isn't manually moved
  const daySeed = Math.floor(Date.now() / 86400000);
  const rawIndex =
    app.state.cardIndex !== undefined && app.state.cardIndex !== ""
      ? Number(app.state.cardIndex)
      : daySeed;

  const card = getCard(lang, isNaN(rawIndex) ? 0 : rawIndex, useNativeCjk);

  // Read node-private mastered set via frameos.recall()
  const masteredStr = String(frameos.recall("mastered") || "");
  const cardKey = `${lang}:${card.index}`;
  const isMastered = masteredStr.split(",").indexOf(cardKey) !== -1;

  const markJsxTapHandled = () => {
    const tapId = String(
      context.payload?.atMs ?? `${context.payload?.x ?? -1},${context.payload?.y ?? -1}`
    );
    frameos.setState("_jsxTapAt", tapId);
  };

  const handlePrev = () => {
    markJsxTapHandled();
    const total = getDeckCount(lang);
    const nextIdx = ((card.index - 1) % total + total) % total;
    frameos.setState("cardIndex", nextIdx);
    if (mode === "flashcard") {
      frameos.setState("revealed", false);
    }
  };

  const handleNext = () => {
    markJsxTapHandled();
    const total = getDeckCount(lang);
    const nextIdx = (card.index + 1) % total;
    frameos.setState("cardIndex", nextIdx);
    if (mode === "flashcard") {
      frameos.setState("revealed", false);
    }
  };

  const handleToggleReveal = () => {
    markJsxTapHandled();
    frameos.setState("revealed", !revealed);
  };

  const handleToggleMastered = () => {
    markJsxTapHandled();
    const list = masteredStr ? masteredStr.split(",").filter(Boolean) : [];
    const pos = list.indexOf(cardKey);
    if (pos >= 0) {
      list.splice(pos, 1);
    } else {
      list.push(cardKey);
    }
    frameos.remember("mastered", list.join(","));
  };

  const handleCycleLanguage = () => {
    markJsxTapHandled();
    const order = ["es", "fr", "de", "ja", "ko"];
    const nextLang = order[(order.indexOf(lang) + 1) % order.length];
    frameos.setState("language", nextLang);
    frameos.setState("cardIndex", 0);
    frameos.setState("revealed", false);
  };

  const dateLabel = formatShortDate(new Date());

  return (
    <div className="flex flex-col justify-between w-full h-full p-5 bg-white text-black">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b-2 border-black pb-3">
        <div className="flex items-center gap-3">
          <div
            onClick={handleCycleLanguage}
            className="px-3 py-1 bg-black text-white text-sm font-bold uppercase rounded"
          >
            {card.languageLabel} (2x UP)
          </div>
          <div className="px-2.5 py-0.5 border-2 border-black text-xs font-bold uppercase rounded">
            {card.level} • {card.pos}
          </div>
          {isMastered ? (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-200 border border-black text-xs font-bold uppercase rounded">
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5">
                <polygon
                  points="8,1 10.2,5.5 15.2,6.2 11.6,9.7 12.4,14.7 8,12.3 3.6,14.7 4.4,9.7 0.8,6.2 5.8,5.5"
                  fill="currentColor"
                />
              </svg>
              <span>Mastered</span>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-4 text-sm font-bold">
          <span>{dateLabel}</span>
          <span className="px-2.5 py-0.5 border-2 border-black rounded">
            {card.index + 1} / {card.total}
          </span>
        </div>
      </div>

      {/* Main Content Area: Branches on Orientation (800x480 Landscape vs 480x800 Portrait) */}
      <div
        className={
          isPortrait
            ? "flex flex-col justify-between flex-1 py-4 gap-4"
            : "flex flex-row items-stretch justify-between flex-1 py-4 gap-5"
        }
      >
        {/* Primary Word Panel */}
        <div
          onClick={handleToggleReveal}
          className="flex flex-col justify-center items-center flex-1 p-5 border-2 border-black rounded-xl bg-white"
        >
          <div className="text-xs font-bold uppercase text-slate-600 mb-2">
            {mode === "wordOfTheDay" ? "Word of the Day" : "Tap Card to Flip"}
          </div>
          <div className="text-5xl font-bold text-center leading-tight">
            {card.word}
          </div>
          {showReading ? (
            <div className="text-xl font-semibold text-slate-700 mt-3 text-center">
              {card.reading}
            </div>
          ) : null}
        </div>

        {/* Translation & Context Sentence Panel */}
        <div
          onClick={handleToggleReveal}
          className="flex flex-col justify-between flex-1 p-5 border-2 border-black rounded-xl bg-slate-100"
        >
          {revealed ? (
            <div className="flex flex-col justify-between h-full">
              <div>
                <div className="text-xs font-bold uppercase text-slate-600 mb-1">
                  Meaning
                </div>
                <div className="text-2xl font-bold leading-snug">
                  {card.meaning}
                </div>
              </div>

              <div className="border-t-2 border-black pt-3 mt-3">
                <div className="text-xs font-bold uppercase text-slate-600 mb-1">
                  Example in Context
                </div>
                <div className="text-lg font-semibold leading-snug">
                  {card.example}
                </div>
                <div className="text-sm text-slate-700 mt-1 italic">
                  {card.translation}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <div className="text-2xl font-bold mb-2">[ ? ]</div>
              <div className="text-lg font-bold">
                Recall the meaning &amp; example
              </div>
              <div className="text-sm text-slate-600 mt-2">
                Tap card, press AI, or double-press DOWN to reveal
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Touch & Hardware Control Bar */}
      <div className="flex items-center justify-between border-t-2 border-black pt-3 gap-3">
        <div
          onClick={handlePrev}
          className="flex items-center gap-1.5 px-4 py-2 border-2 border-black rounded-lg text-sm font-bold uppercase bg-white"
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5">
            <polygon points="11,2 4,8 11,14" fill="currentColor" />
          </svg>
          <span>Prev (UP)</span>
        </div>

        <div className="flex items-center gap-2">
          <div
            onClick={handleToggleReveal}
            className="px-5 py-2 bg-black text-white rounded-lg text-sm font-bold uppercase"
          >
            {revealed ? "Hide Answer (AI / 2x DOWN)" : "Reveal (AI / 2x DOWN)"}
          </div>
          <div
            onClick={handleToggleMastered}
            className="flex items-center gap-1.5 px-4 py-2 border-2 border-black rounded-lg text-sm font-bold uppercase bg-white"
          >
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5">
              <polygon
                points="8,1 10.2,5.5 15.2,6.2 11.6,9.7 12.4,14.7 8,12.3 3.6,14.7 4.4,9.7 0.8,6.2 5.8,5.5"
                fill={isMastered ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            <span>{isMastered ? "Saved" : "Mark Known"}</span>
          </div>
        </div>

        <div
          onClick={handleNext}
          className="flex items-center gap-1.5 px-4 py-2 border-2 border-black rounded-lg text-sm font-bold uppercase bg-white"
        >
          <span>Next (DOWN)</span>
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5">
            <polygon points="5,2 12,8 5,14" fill="currentColor" />
          </svg>
        </div>
      </div>
    </div>
  );
}
