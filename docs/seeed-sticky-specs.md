# Seeed Studio reTerminal Sticky — FrameOS Hardware & Design Reference

## Hardware Specifications

| Feature | Specification |
|---|---|
| **Device Preset** | `seeed_reterminal_sticky` (ESP32-S3 architecture) |
| **Display** | 3.97" Monochrome (Black & White) E-Ink Panel |
| **Resolution** | `800 × 480` px (Landscape) / `480 × 800` px (Portrait) |
| **MCU & Memory** | ESP32-S3 with 8 MB PSRAM, 32 MB Flash (`app.frame.embedded === true`) |
| **Scene Storage Budget** | 512 KiB across all installed scenes on device; max 512 KB `frameos.remember()` per node |
| **Touch Input** | Capacitive glass touch panel (`tap`, `doubleTap`, `longPress`, `swipe`, `edgeSwipe`) |
| **Physical Buttons** | **AI Key** (`GPIO 4`), **UP Key** (`GPIO 5`), **DOWN Key** (`GPIO 6`) |
| **Audio / Feedback** | 4 kHz Buzzer (`GPIO 48`, clicks on button press) + Onboard Microphone |
| **Power & Storage** | 750 mAh LiPo battery with fuel gauge + MicroSD / TF card slot (`/srv/assets`) |

---

## E-Ink Design Guidelines for 800×480 (`3.97"`)

1. **High Contrast Monochrome First**
   - Because the Seeed Studio Sticky uses a crisp black-and-white e-paper display, prefer solid black (`#000000` / `slate-950`) and pure white (`#ffffff`) with bold borders (`border-2 border-black`) rather than subtle translucent fills or low-contrast grays that dither poorly.
2. **Typography & Sizing**
   - At `800×480` on a 3.97" screen (~235 PPI), body text reads best at `24px–36px` (`text-2xl` to `text-4xl`), labels at `14px–18px` (`text-sm` to `text-lg` uppercase bold), and hero target-language words/kanji at `56px–84px` (`text-6xl` to `text-7xl`).
   - Keep an outer margin/padding of ~4% of the shorter edge (`p-5` / `20px` on 800×480).
3. **Responsive Orientation (`800×480` vs `480×800`)**
   - Always inspect `context.imageWidth` and `context.imageHeight` (or `app.frame.width` / `app.frame.height`).
   - Branch layout when `H > W` (portrait sticky note orientation) vs `W >= H` (landscape desk/fridge card orientation).
4. **Touch + Physical Button Ergonomics**
   - Make touch targets at least `48×48` px with clear borders so they look tactile on e-ink.
   - Support `back` / `forward` events (triggered by left/right edge swipes) and `button` events (`GPIO 5` UP / `GPIO 6` DOWN) so the frame can be navigated both by touch and physical side keys.
5. **ESP32-S3 Memory Discipline**
   - Module-level variables reset on every render on ESP32. Store persistent state in `frameos.setState(key, value)` (shared scene state) or `frameos.remember(key, value)` (node-private storage).
   - Store vocabulary lists as compact delimited strings (`"word|reading|meaning|example|translation"`) and parse only the active item during a render.
