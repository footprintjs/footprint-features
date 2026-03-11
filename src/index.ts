/**
 * footprint-features — Declarative feature module system.
 *
 * Define once, derive everything: modules, school types, terminology,
 * feature gates, seed data, roles, and dependency trees.
 *
 * @example
 * ```ts
 * import {
 *   defineModule,
 *   defineSchoolType,
 *   createModuleRegistry,
 *   resolveSchoolConfig,
 *   createFeatureGate,
 *   createTermResolver,
 * } from "footprint-features";
 *
 * // 1. Define modules
 * const students = defineModule({ id: "students", name: "Students", domain: "people" });
 * const attendance = defineModule({
 *   id: "attendance", name: "Attendance", domain: "academics",
 *   requires: ["students"],
 *   terminology: { session: { default: "Session", dance: "Check-in" } },
 * });
 *
 * // 2. Define school types
 * const dance = defineSchoolType({
 *   type: "dance", displayName: "Dance School",
 *   modules: ["students", "attendance"],
 *   roles: ["Owner", "Instructor"],
 * });
 *
 * // 3. Create registry
 * const registry = createModuleRegistry({
 *   modules: [students, attendance],
 *   schoolTypes: [dance],
 * });
 *
 * // 4. Resolve config for a school
 * const config = resolveSchoolConfig(registry, "dance");
 *
 * // 5. Use feature gate
 * const gate = createFeatureGate(config);
 * gate.isEnabled("attendance"); // true
 *
 * // 6. Use terminology
 * const t = createTermResolver(config.terminology);
 * t("session"); // "Check-in"
 * ```
 */

// Types
export type {
  ModuleDefinition,
  SchoolTypeDefinition,
  ResolvedSchoolConfig,
  GateResult,
  ValidationError,
} from "./types.js";

// Define functions
export { defineModule } from "./defineModule.js";
export type { ModuleInput } from "./defineModule.js";
export { defineSchoolType } from "./defineSchoolType.js";
export type { SchoolTypeInput } from "./defineSchoolType.js";

// Registry
export { createModuleRegistry } from "./moduleRegistry.js";
export type { ModuleRegistry, ModuleRegistryInput } from "./moduleRegistry.js";

// Resolution
export { resolveSchoolConfig } from "./resolveConfig.js";

// Feature gate
export { createFeatureGate } from "./featureGate.js";
export type { FeatureGate } from "./featureGate.js";

// Terminology
export { resolveTerminology, createTermResolver } from "./terminology.js";

// Dependency graph (advanced)
export {
  resolveTransitiveDependencies,
  buildDependencyTree,
  validateRegistry,
} from "./dependencyGraph.js";
