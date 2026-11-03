// Generated from FrameOS docs/scene-guide.md (frontend/src/utils/appTypeDeclarations.ts)

type FrameOSJson = null | boolean | number | string | FrameOSJson[] | { [key: string]: FrameOSJson };

interface FrameOSAppConfig {
  [key: string]: any;
}

interface FrameOSImageSpec {
  width?: number;
  height?: number;
  color?: string;
  opacity?: number;
  svg?: string;
  dataUrl?: string;
  base64?: string;
  [key: string]: any;
}

interface FrameOSImageRef {
  __frameosType: "imageRef";
  id: number;
  width: number;
  height: number;
}

/** What frameos.canvas returns: an image ref an img's src takes, that frameos.draw and frameos.clear draw into. */
interface FrameOSCanvasRef extends FrameOSImageRef {
  canvas: string;
  version: number;
  fresh: boolean;
}

interface FrameOSNodeRef {
  __frameosType: "node";
  nodeId: number;
}

interface FrameOSSceneRef {
  __frameosType: "scene";
  sceneId: string;
}

interface FrameOSColorRef {
  __frameosType: "color";
  color: string;
}

interface FrameOSStreamRef {
  __frameosType: "streamRef";
  id: number;
}

/**
 * What JSX makes in an app (.tsx): get() can return it as its image. An <svg>
 * is drawn as it is; any other element is a UI laid out with Tailwind classes.
 */
interface FrameOSElement {
  type: string;
  props: Record<string, any>;
}

/** What a handler gets: the pointer event, and where in the element it was. */
interface FrameOSUiEvent {
  type: "tap" | "doubleTap" | "longPress" | "swipe" | "pointerDown" | "pointerUp" | "pointerMove" | "change" | "keyDown";
  x: number;
  y: number;
  localX: number;
  localY: number;
  width?: number;
  height?: number;
  pointerId?: number;
  pointerType?: "mouse" | "touch" | "pen";
  direction?: "left" | "right" | "up" | "down";
  value?: string;
  target?: { value: string };
  key?: string;
  [key: string]: any;
}

interface FrameOSElementProps {
  className?: string;
  children?: any;
  src?: FrameOSImageRef | { image: FrameOSImageRef | null } | null;
  onClick?: (event: FrameOSUiEvent) => void;
  onDoubleClick?: (event: FrameOSUiEvent) => void;
  onLongPress?: (event: FrameOSUiEvent) => void;
  onPointerDown?: (event: FrameOSUiEvent) => void;
  onPointerUp?: (event: FrameOSUiEvent) => void;
  onPointerMove?: (event: FrameOSUiEvent) => void;
  onSwipe?: (event: FrameOSUiEvent) => void;
  value?: string | number;
  placeholder?: string;
  type?: "text" | "password" | "number";
  onChange?: (event: FrameOSUiEvent) => void;
  onInput?: (event: FrameOSUiEvent) => void;
  onKeyDown?: (event: FrameOSUiEvent) => void;
  [attribute: string]: any;
}

declare namespace JSX {
  type Element = FrameOSElement;
  interface ElementChildrenAttribute {
    children: {};
  }
  interface IntrinsicElements {
    [tag: string]: FrameOSElementProps;
  }
}

declare function memo<P extends Record<string, any>>(
  component: (props: P) => any
): (props: P & { key?: string | number }) => any;

interface FrameOSApp {
  nodeId: number;
  nodeName: string;
  category: string;
  config: FrameOSAppConfig;
  state: Record<string, any>;
  frame: {
    width: number;
    height: number;
    rotate: number;
    assetsPath: string;
    timeZone: string;
    debug?: boolean;
    embedded?: boolean;
    scale?: number;
  };
  initialized?: boolean;
  log(...args: any[]): void;
  logError(...args: any[]): void;
  [key: string]: any;
}

interface FrameOSEventPayloads {
  init: Record<string, any>;
  render: Record<string, any>;
  open: { sceneId: string };
  close: Record<string, never>;
  keyDown: { code: string; key: string; repeat: boolean; shift: boolean; ctrl: boolean; alt: boolean; meta: boolean; linuxCode?: number };
  keyUp: { code: string; key: string; shift: boolean; ctrl: boolean; alt: boolean; meta: boolean; linuxCode?: number };
  textInput: { text: string };
  pointerMove: { x: number; y: number; pointerId: number; pointerType: string; buttons: number };
  pointerDown: { x: number; y: number; button: number; buttons: number; pointerId: number; pointerType: string };
  pointerUp: { x: number; y: number; button: number; buttons: number; pointerId: number; pointerType: string };
  pointerCancel: { x: number; y: number; pointerId: number; pointerType: string };
  mouseMove: { x: number; y: number };
  mouseDown: { button: number };
  mouseUp: { button: number };
  tap: { x: number; y: number; pointerId: number; pointerType: string };
  doubleTap: { x: number; y: number; pointerId: number; pointerType: string };
  longPress: { x: number; y: number; durationMs: number; pointerId: number; pointerType: string };
  swipe: { direction: string; x: number; y: number; startX: number; startY: number; pointerId: number; pointerType: string };
  edgeSwipe: { edge: string; direction: string; x: number; y: number; startX: number; startY: number; pointerId: number; pointerType: string };
  wheel: { deltaX: number; deltaY: number; x: number; y: number };
  turnOn: Record<string, never>;
  turnOff: Record<string, never>;
  toggleScreen: Record<string, never>;
  gpio: { pin: number; label: string; role: string; action: string; durationMs?: number; wake?: boolean; claimed?: boolean; atMs?: number; level?: number };
  button: { pin: number; label: string; role: string; action: string; durationMs?: number; wake?: boolean; atMs?: number };
  setSceneState: { state?: any; render?: boolean };
  setCurrentScene: { sceneId?: string; direction?: string; state?: any };
  sceneSwitcher: Record<string, never>;
  sceneSettings: Record<string, never>;
  back: Record<string, never>;
  forward: Record<string, never>;
}

interface FrameOSContext {
  event: keyof FrameOSEventPayloads | (string & {});
  payload: any;
  loopIndex: number;
  loopKey: string;
  hasImage: boolean;
  nextSleep: number;
  image?: FrameOSImageRef;
  imageWidth?: number;
  imageHeight?: number;
  targetWidth?: number;
  targetHeight?: number;
  targetFit?: string;
  [key: string]: any;
}

declare const frameos: {
  image(spec?: FrameOSImageSpec): FrameOSImageSpec & { __frameosType: "image" };
  svg(svg: string, spec?: FrameOSImageSpec): FrameOSImageSpec & { __frameosType: "image"; svg: string };
  node(nodeId: number): FrameOSNodeRef;
  scene(sceneId: string): FrameOSSceneRef;
  color(color: string): FrameOSColorRef;
  log(...args: any[]): void;
  error(...args: any[]): void;
  setNextSleep(seconds: number): void;
  fetchText(url: string): string;
  fetchJson(url: string): any;
  httpRequest(
    url: string,
    options?: {
      method?: string;
      headers?: Record<string, string>;
      body?: string;
      bodyBase64?: string;
      base64?: boolean;
      timeoutMs?: number;
      find?: string;
      findLength?: number;
      findLimit?: number;
    }
  ): { status: number; body?: string; bodyBase64?: string; found?: string[]; error?: string };
  fetchImage(
    url: string,
    options?: {
      headers?: Record<string, string>;
      saveAsset?: { name: string; extension?: string; mode?: "auto" | "always" };
      exif?: boolean;
      colors?: { [key: string]: any } | null;
      keep?: boolean;
      width?: number;
      height?: number;
      fit?: "cover" | "contain";
    }
  ): {
    image: FrameOSImageRef | null;
    width?: number;
    height?: number;
    error?: string;
    savedAs?: string;
    exif?: Record<string, any>;
    exifSummary?: string;
  };
  releaseImage(image: FrameOSImageRef | { image: FrameOSImageRef | null } | null): boolean;
  canvas(key: string, width: number, height: number, color?: string): FrameOSCanvasRef | null;
  draw(canvas: FrameOSCanvasRef, content: FrameOSElement | string): boolean;
  clear(canvas: FrameOSCanvasRef, color?: string): boolean;
  listAssets(dir?: string): string[];
  assetExists(path: string): boolean;
  assetSize(path: string): number;
  readAsset(path: string, options?: { offset?: number; length?: number }): string | null;
  writeAsset(path: string, base64: string): boolean;
  appendAsset(path: string, base64: string): boolean;
  deleteAsset(path: string): boolean;
  loadAssetImage(path: string): FrameOSImageRef | null;
  openAssetStream(path: string, mode?: "r" | "w" | "a"): FrameOSStreamRef | null;
  createStream(base64: string): FrameOSStreamRef | null;
  streamRead(stream: FrameOSStreamRef | number, length: number): string | null;
  streamWrite(stream: FrameOSStreamRef | number, base64: string): boolean;
  streamAtEnd(stream: FrameOSStreamRef | number): boolean;
  streamRewind(stream: FrameOSStreamRef | number): boolean;
  streamClose(stream: FrameOSStreamRef | number): boolean;
  getSetting(...path: string[]): any;
  setState(key: string, value: FrameOSJson): void;
  remember(key: string, value: FrameOSJson): boolean;
  recall(key: string): FrameOSJson | undefined;
};
