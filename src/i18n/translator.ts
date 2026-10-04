/**
 * Vietnamese interface layer.
 *
 * The app is written in English. Rather than threading a t() call through
 * every screen, this layer watches the rendered page and swaps each English
 * text (and placeholder / title / aria-label) for its Vietnamese translation
 * from the dictionary in ./vi. React keeps working on its own text nodes: when
 * it changes one, the new English value is picked up and translated again.
 * Switching back to English restores the original text in place, so no reload
 * is needed (a reload would reset the demo data).
 *
 * Mark an element with `data-no-translate` to leave its contents untouched.
 */
import { VI_DICTIONARY } from "./vi";
import { VI_PATTERNS } from "./patterns";
import type { Language } from "./languageStore";

const ATTRIBUTES = ["placeholder", "title", "aria-label", "alt"] as const;
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "NOSCRIPT", "CODE"]);
/** English words that give away an untranslated text even with Vietnamese terms in it. */
const ENGLISH_HINT =
  /\b(the|and|of|for|with|from|is|are|by|all|new|open|overdue|issues?|units?|laws?|days?|review|tracker|board|search|level|revisions?|reports?|risk|items?|pending|awaiting|due)\b/i;
const VIETNAMESE =
  /[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;

const exact = new Map<string, string>(Object.entries(VI_DICTIONARY));
const lower = new Map<string, string>();
for (const [k, v] of exact)
  if (!lower.has(k.toLowerCase())) lower.set(k.toLowerCase(), v);

/** Source (English) text of each node, and the value this layer last wrote. */
const sourceText = new WeakMap<Text, string>();
const writtenText = new WeakMap<Text, string>();
const sourceAttr = new WeakMap<Element, Map<string, string>>();
const writtenAttr = new WeakMap<Element, Map<string, string>>();

let language: Language = "vi";
let observer: MutationObserver | null = null;

/** Dev aid: English strings seen on screen without a translation. */
const missing = new Map<string, Set<string>>();

function lookup(core: string): string | undefined {
  const t = exact.get(core) ?? lower.get(core.toLowerCase());
  if (t !== undefined) return t;
  for (const [re, rep] of VI_PATTERNS) {
    re.lastIndex = 0;
    const m = re.exec(core);
    if (m && m[0] === core) {
      return typeof rep === "string"
        ? core.replace(re, rep)
        : rep(m, (s) => translateString(s) ?? s);
    }
  }
  return undefined;
}

/**
 * Vietnamese for a text node: a `data-vi` label on its element wins (used
 * where space is tight, e.g. the top menu), else the dictionary.
 */
function translateNode(node: Text, text: string): string | null {
  const own = node.parentElement?.getAttribute("data-vi");
  if (own && node.parentElement?.childNodes.length === 1) return own;
  return translateString(text);
}

/** Vietnamese for a piece of English UI text, or null if there is none. */
export function translateString(text: string): string | null {
  const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(text);
  if (!m) return null;
  const core = m[2].replace(/\s+/g, " ");
  if (!core) return null;
  const t = lookup(core);
  if (t === undefined) {
    if (
      import.meta.env.DEV &&
      /[A-Za-z]{3}/.test(core) &&
      (!VIETNAMESE.test(core) || ENGLISH_HINT.test(core)) &&
      core.length < 400
    ) {
      const where = missing.get(core) ?? new Set<string>();
      where.add(location.pathname);
      missing.set(core, where);
    }
    return null;
  }
  return m[1] + t + m[3];
}

function skipped(el: Element | null): boolean {
  if (!el) return true;
  if (SKIP_TAGS.has(el.tagName)) return true;
  return !!el.closest("[data-no-translate],[contenteditable='true']");
}

function processText(node: Text) {
  if (skipped(node.parentElement)) return;
  const current = node.nodeValue ?? "";
  // Our own write coming back through the observer.
  if (writtenText.get(node) === current) return;
  sourceText.set(node, current);
  writtenText.delete(node);
  if (language !== "vi") return;
  const t = translateNode(node, current);
  if (t !== null && t !== current) {
    writtenText.set(node, t);
    node.nodeValue = t;
  }
}

function processAttr(el: Element, name: string) {
  if (attrsSkipped(el)) return;
  const current = el.getAttribute(name);
  if (current === null) return;
  const written = writtenAttr.get(el);
  if (written?.get(name) === current) return;
  const sources = sourceAttr.get(el) ?? new Map<string, string>();
  sources.set(name, current);
  sourceAttr.set(el, sources);
  written?.delete(name);
  if (language !== "vi") return;
  const t = translateString(current);
  if (t !== null && t !== current) {
    const w = written ?? new Map<string, string>();
    w.set(name, t);
    writtenAttr.set(el, w);
    el.setAttribute(name, t);
  }
}

/** Attributes are translated even on text boxes (their placeholder). */
function attrsSkipped(el: Element): boolean {
  if (el.tagName === "SCRIPT" || el.tagName === "STYLE") return true;
  return !!el.closest("[data-no-translate],[contenteditable='true']");
}

function processElement(el: Element) {
  if (attrsSkipped(el)) return;
  for (const a of ATTRIBUTES) if (el.hasAttribute(a)) processAttr(el, a);
}

function processTree(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    processText(root as Text);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  processElement(root as Element);
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
  );
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) processText(n as Text);
    else processElement(n as Element);
  }
}

/** Re-render every text in the new language, using the stored English source. */
function applyAll() {
  const walker = document.createTreeWalker(
    document.documentElement,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
  );
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) {
      const node = n as Text;
      if (skipped(node.parentElement)) continue;
      const current = node.nodeValue ?? "";
      const src =
        writtenText.get(node) === current
          ? (sourceText.get(node) ?? current)
          : current;
      sourceText.set(node, src);
      const next = language === "vi" ? (translateNode(node, src) ?? src) : src;
      writtenText.set(node, next);
      if (next !== current) node.nodeValue = next;
    } else {
      const el = n as Element;
      if (attrsSkipped(el)) continue;
      for (const a of ATTRIBUTES) {
        const current = el.getAttribute(a);
        if (current === null) continue;
        const written = writtenAttr.get(el) ?? new Map<string, string>();
        const sources = sourceAttr.get(el) ?? new Map<string, string>();
        const src =
          written.get(a) === current ? (sources.get(a) ?? current) : current;
        sources.set(a, src);
        sourceAttr.set(el, sources);
        const next = language === "vi" ? (translateString(src) ?? src) : src;
        written.set(a, next);
        writtenAttr.set(el, written);
        if (next !== current) el.setAttribute(a, next);
      }
    }
  }
}

export function setTranslatorLanguage(next: Language) {
  document.documentElement.lang = next;
  if (next === language && observer) return;
  language = next;
  if (observer) applyAll();
}

export function startTranslator(initial: Language) {
  language = initial;
  document.documentElement.lang = initial;
  if (observer) return;
  observer = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === "characterData") processText(r.target as Text);
      else if (r.type === "attributes")
        processAttr(r.target as Element, r.attributeName!);
      else r.addedNodes.forEach(processTree);
    }
  });
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...ATTRIBUTES],
  });
  processTree(document.documentElement);

  if (import.meta.env.DEV) {
    Object.assign(window, {
      __i18nMissing: () =>
        [...missing.entries()].map(([text, where]) => ({
          text,
          where: [...where],
        })),
      __i18nClearMissing: () => missing.clear(),
    });
  }
}
