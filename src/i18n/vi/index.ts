/**
 * English → Vietnamese dictionary for the whole interface. Keys are the exact
 * English text as rendered (whitespace collapsed); matching is case-sensitive
 * first, then case-insensitive. Later files win on duplicate keys.
 */
import { COMPONENTS } from "./components";
import { SHELL } from "./shell";
import { DATA } from "./data";
import { PAGES1 } from "./pages1";
import { PAGES2 } from "./pages2";
import { PAGES3 } from "./pages3";
import { MIXED } from "./mixed";
import { RUNTIME } from "./runtime";

export const VI_DICTIONARY: Record<string, string> = {
  ...DATA,
  ...COMPONENTS,
  ...SHELL,
  ...PAGES1,
  ...PAGES2,
  ...PAGES3,
  ...MIXED,
  ...RUNTIME,
};
