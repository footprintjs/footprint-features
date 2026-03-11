import type { ModuleDefinition, SchoolTypeDefinition, ValidationError } from "./types.js";
import { validateRegistry } from "./dependencyGraph.js";

/**
 * A registry of module and school type definitions.
 *
 * The registry is the central catalog — all resolution, gating, and
 * terminology lookups go through it.
 *
 * @example
 * ```ts
 * const registry = createModuleRegistry({
 *   modules: [students, attendance, fees],
 *   schoolTypes: [k12, danceSchool],
 * });
 *
 * registry.getModule("attendance");
 * registry.getSchoolType("dance");
 * registry.validate(); // checks all dependencies
 * ```
 */
export type ModuleRegistry = {
  /** Get a module definition by ID */
  getModule(id: string): ModuleDefinition | undefined;
  /** Get all registered module definitions */
  getAllModules(): ReadonlyMap<string, ModuleDefinition>;
  /** Get a school type definition by type */
  getSchoolType(type: string): SchoolTypeDefinition | undefined;
  /** Get all registered school type definitions */
  getAllSchoolTypes(): ReadonlyMap<string, SchoolTypeDefinition>;
  /** Validate all definitions for consistency (missing deps, circular deps) */
  validate(): ValidationError[];
  /** List all registered module IDs */
  moduleIds(): readonly string[];
  /** List all registered school type IDs */
  schoolTypeIds(): readonly string[];
};

export type ModuleRegistryInput = {
  modules: readonly ModuleDefinition[];
  schoolTypes?: readonly SchoolTypeDefinition[];
};

/**
 * Create a module registry from a set of definitions.
 *
 * The registry itself is immutable — you cannot add or remove modules
 * after creation. This prevents runtime mutations that would make
 * behavior unpredictable.
 */
export function createModuleRegistry(input: ModuleRegistryInput): ModuleRegistry {
  const modules = new Map<string, ModuleDefinition>();
  const schoolTypes = new Map<string, SchoolTypeDefinition>();

  for (const mod of input.modules) {
    if (modules.has(mod.id)) {
      throw new Error(`Duplicate module ID: "${mod.id}"`);
    }
    modules.set(mod.id, mod);
  }

  for (const st of input.schoolTypes ?? []) {
    if (schoolTypes.has(st.type)) {
      throw new Error(`Duplicate school type: "${st.type}"`);
    }
    schoolTypes.set(st.type, st);
  }

  const frozenModuleIds = Object.freeze(Array.from(modules.keys()));
  const frozenSchoolTypeIds = Object.freeze(Array.from(schoolTypes.keys()));

  return {
    getModule(id: string) {
      return modules.get(id);
    },
    getAllModules() {
      return modules;
    },
    getSchoolType(type: string) {
      return schoolTypes.get(type);
    },
    getAllSchoolTypes() {
      return schoolTypes;
    },
    validate() {
      const errors: ValidationError[] = [];

      // Validate module dependency graph
      errors.push(...validateRegistry(modules));

      // Validate school types reference existing modules
      for (const [type, st] of schoolTypes) {
        for (const modId of st.modules) {
          if (!modules.has(modId)) {
            errors.push({
              type: "unknown_module",
              moduleId: modId,
              message: `School type "${type}" references unknown module "${modId}"`,
              details: { schoolType: type },
            });
          }
        }
      }

      return errors;
    },
    moduleIds() {
      return frozenModuleIds;
    },
    schoolTypeIds() {
      return frozenSchoolTypeIds;
    },
  };
}
