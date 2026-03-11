import type { ModuleDefinition, ResolvedSchoolConfig } from "./types.js";
import type { ModuleRegistry } from "./moduleRegistry.js";
import { resolveTransitiveDependencies, buildDependencyTree } from "./dependencyGraph.js";
import { resolveTerminology } from "./terminology.js";

/**
 * Resolve the full configuration for a school of a given type.
 *
 * This is the "define once, derive everything" function. Given a school type
 * and a registry of modules, it produces:
 * - Which modules are enabled (including transitive dependencies)
 * - Resolved terminology labels
 * - Merged roles
 * - Seed data blueprints
 * - The full dependency tree
 *
 * @example
 * ```ts
 * const config = resolveSchoolConfig(registry, "dance");
 * config.enabledModules;  // Set { "students", "attendance", "fees", ... }
 * config.terminology;     // { session: "Check-in", grade: "Level", ... }
 * config.roles;           // ["Owner", "Instructor", "Front Desk"]
 * config.seed;            // { attendance: { statuses: [...] }, ... }
 * ```
 *
 * @param moduleOverrides - Optional list of module IDs to use instead of the
 *   school type's defaults. Useful when a school has customized its modules.
 */
export function resolveSchoolConfig(
  registry: ModuleRegistry,
  schoolType: string,
  moduleOverrides?: readonly string[]
): ResolvedSchoolConfig {
  const schoolTypeDef = registry.getSchoolType(schoolType);

  // Determine which modules to enable
  const requestedModules = moduleOverrides
    ?? schoolTypeDef?.modules
    ?? [];

  if (requestedModules.length === 0) {
    return emptyConfig(schoolType);
  }

  // Resolve transitive dependencies
  const allModules = registry.getAllModules();
  const { resolved, errors } = resolveTransitiveDependencies(requestedModules, allModules);

  if (errors.length > 0) {
    // Filter out unknown modules rather than failing
    // The consumer can validate() separately if they want strict mode
    for (const err of errors) {
      if (err.type === "unknown_module") {
        resolved.delete(err.moduleId);
      }
    }
  }

  // Build enabled module map
  const enabledModuleMap = new Map<string, ModuleDefinition>();
  for (const id of resolved) {
    const mod = allModules.get(id);
    if (mod) enabledModuleMap.set(id, mod);
  }

  // Resolve terminology
  const enabledModuleDefs = Array.from(enabledModuleMap.values());
  const terminology = resolveTerminology(schoolType, enabledModuleDefs);

  // Merge roles: school type roles + module-declared roles
  const roleSet = new Set<string>();
  if (schoolTypeDef) {
    for (const role of schoolTypeDef.roles) {
      roleSet.add(role);
    }
  }
  for (const mod of enabledModuleDefs) {
    for (const roleList of Object.values(mod.roles)) {
      for (const role of roleList) {
        roleSet.add(role);
      }
    }
  }

  // Collect seed blueprints
  const seed: Record<string, unknown> = {};
  for (const mod of enabledModuleDefs) {
    const moduleSeed = mod.seed[schoolType] ?? mod.seed["default"] ?? null;
    if (moduleSeed !== null) {
      seed[mod.id] = moduleSeed;
    }
  }

  // Build dependency tree
  const dependencyTree = buildDependencyTree(resolved, allModules);

  return {
    schoolType,
    enabledModules: resolved,
    modules: enabledModuleMap,
    terminology,
    roles: Object.freeze(Array.from(roleSet)),
    seed: Object.freeze(seed),
    dependencyTree,
  };
}

function emptyConfig(schoolType: string): ResolvedSchoolConfig {
  return {
    schoolType,
    enabledModules: new Set(),
    modules: new Map(),
    terminology: {},
    roles: [],
    seed: {},
    dependencyTree: new Map(),
  };
}
