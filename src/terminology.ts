import type { ModuleDefinition } from "./types.js";

/**
 * Resolve terminology labels for a school type from a set of modules.
 *
 * Merge order:
 * 1. Each module's terminology for the specific school type
 * 2. Falls back to "default" if no school-type-specific label
 * 3. Falls back to the term key itself if no label defined at all
 *
 * @example
 * ```ts
 * const terms = resolveTerminology("dance", [attendanceModule, academicsModule]);
 * // { session: "Check-in", grade: "Level", ... }
 * ```
 */
export function resolveTerminology(
  schoolType: string,
  modules: readonly ModuleDefinition[]
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const mod of modules) {
    for (const [termKey, labels] of Object.entries(mod.terminology)) {
      // School-type-specific label takes priority
      if (labels[schoolType]) {
        result[termKey] = labels[schoolType];
      } else if (labels["default"] && !(termKey in result)) {
        // Fall back to default only if not already set by another module
        result[termKey] = labels["default"];
      }
    }
  }

  return result;
}

/**
 * Create a term resolver function for a specific school's resolved terminology.
 *
 * Returns a function that looks up a term key and returns the display label.
 * If the key isn't found, returns the key itself (no crashes, graceful fallback).
 *
 * @example
 * ```ts
 * const t = createTermResolver({ session: "Check-in", grade: "Level" });
 * t("session");  // "Check-in"
 * t("unknown");  // "unknown"
 * ```
 */
export function createTermResolver(
  terminology: Readonly<Record<string, string>>
): (key: string) => string {
  return (key: string) => terminology[key] ?? key;
}
