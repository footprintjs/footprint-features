import type { SchoolTypeDefinition } from "./types.js";

/**
 * Input shape for defineSchoolType — allows optional fields with sensible defaults.
 */
export type SchoolTypeInput = {
  type: string;
  displayName: string;
  modules: string[];
  roles?: string[];
  schedulingPattern?: string;
  meta?: Record<string, unknown>;
};

/**
 * Define a school type preset.
 *
 * A school type is a template that says "schools of this kind get
 * these modules, these roles, and this scheduling pattern by default."
 *
 * @example
 * ```ts
 * const danceSchool = defineSchoolType({
 *   type: "dance",
 *   displayName: "Dance School",
 *   modules: ["students", "employees", "attendance", "fees"],
 *   roles: ["Owner", "Instructor", "Front Desk"],
 *   schedulingPattern: "time-slots",
 * });
 * ```
 */
export function defineSchoolType(input: SchoolTypeInput): SchoolTypeDefinition {
  if (!input.type || typeof input.type !== "string") {
    throw new Error("School type is required and must be a non-empty string");
  }
  if (!input.displayName || typeof input.displayName !== "string") {
    throw new Error(`School type "${input.type}": displayName is required`);
  }
  if (!Array.isArray(input.modules) || input.modules.length === 0) {
    throw new Error(`School type "${input.type}": at least one module is required`);
  }

  const type = input.type.trim();
  if (!/^[a-z][a-z0-9-]*$/.test(type)) {
    throw new Error(`School type "${type}" must start with a lowercase letter and contain only lowercase letters, digits, and hyphens`);
  }

  const definition: SchoolTypeDefinition = {
    type,
    displayName: input.displayName.trim(),
    modules: Object.freeze([...input.modules]),
    roles: Object.freeze([...(input.roles ?? [])]),
    schedulingPattern: (input.schedulingPattern ?? "default").trim(),
    meta: Object.freeze({ ...(input.meta ?? {}) }),
  };

  return Object.freeze(definition);
}
