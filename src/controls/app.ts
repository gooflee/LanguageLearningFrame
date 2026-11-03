const DECK_SIZE = 5;
const LANG_ORDER = ["es", "fr", "de", "ja", "ko"];

export function run(app: FrameOSApp, context: FrameOSContext) {
  const configuredAction = String(app.config.action || "auto");
  const currentIdx = Number(app.state.cardIndex ?? 0) || 0;
  const revealed = app.state.revealed === true || app.state.revealed === "true";
  const currentLang = String(app.state.language || "es");

  let action = configuredAction;

  if (action === "auto") {
    if (context.event === "back") {
      action = "prev";
    } else if (context.event === "forward") {
      action = "next";
    } else if (context.event === "button") {
      const pin = Number(context.payload?.pin ?? -1);
      const label = String(context.payload?.label || "").toLowerCase();
      const btnAction = String(context.payload?.action || "press");
      // Seeed Studio reTerminal Sticky preset pins:
      // GPIO 4 = AI button, GPIO 5 = UP button, GPIO 6 = DOWN button
      // - Single press UP (5)   -> Previous card
      // - Single press DOWN (6) -> Next card
      // - Single press AI (4) or Double-press DOWN (6) -> Flip / Reveal card
      // - Double-press UP (5) or Double-press AI (4)   -> Cycle language
      const isUp = pin === 5 || label.indexOf("up") !== -1;
      const isDown = pin === 6 || label.indexOf("down") !== -1;
      if (btnAction === "doublePress") {
        action = isUp ? "cycleLang" : "flip";
      } else if (isUp) {
        action = "prev";
      } else if (isDown) {
        action = "next";
      } else {
        action = "flip";
      }
    } else if (context.event === "tap") {
      // If the JSX onClick handler in src/app/app.tsx already ran for this tap,
      // skip duplicate handling here.
      const tapId = String(
        context.payload?.atMs ?? `${context.payload?.x ?? -1},${context.payload?.y ?? -1}`
      );
      if (String(app.state._jsxTapAt || "") === tapId) {
        frameos.setState("_jsxTapAt", "");
        return;
      }
      // Fallback scene-level tap handler (when QuickJS was released after deep sleep):
      const x = Number(context.payload?.x ?? -1);
      const y = Number(context.payload?.y ?? -1);
      const w = Number(context.payload?.width ?? app.frame.width ?? 800);
      const h = Number(context.payload?.height ?? app.frame.height ?? 480);

      if (x >= 0 && y >= 0) {
        if (y < h * 0.16 && x < w * 0.35) {
          action = "cycleLang";
        } else if (y > h * 0.8) {
          if (x < w * 0.28) {
            action = "prev";
          } else if (x > w * 0.72) {
            action = "next";
          } else {
            action = "flip";
          }
        } else {
          action = "flip";
        }
      } else {
        action = "flip";
      }
    }
  }

  frameos.log(
    `[stickyControls] event=${context.event} action=${action} payload=${JSON.stringify(
      context.payload || {}
    )} idx=${currentIdx} revealed=${revealed}`
  );

  if (action === "prev") {
    const prevIdx = ((currentIdx - 1) % DECK_SIZE + DECK_SIZE) % DECK_SIZE;
    frameos.setState("cardIndex", prevIdx);
    frameos.setState("revealed", false);
  } else if (action === "next") {
    const nextIdx = (currentIdx + 1) % DECK_SIZE;
    frameos.setState("cardIndex", nextIdx);
    frameos.setState("revealed", false);
  } else if (action === "flip") {
    frameos.setState("revealed", !revealed);
  } else if (action === "cycleLang") {
    const nextLang =
      LANG_ORDER[(LANG_ORDER.indexOf(currentLang) + 1) % LANG_ORDER.length];
    frameos.setState("language", nextLang);
    frameos.setState("cardIndex", 0);
    frameos.setState("revealed", false);
  }
}
