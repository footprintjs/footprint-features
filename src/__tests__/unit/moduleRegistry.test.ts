import { describe, it, expect } from "vitest";
import { defineModule } from "../../defineModule.js";
import { defineSchoolType } from "../../defineSchoolType.js";
import { createModuleRegistry } from "../../moduleRegistry.js";

const students = defineModule({ id: "students", name: "Students", domain: "people" });
const academics = defineModule({ id: "academics", name: "Academics", domain: "academics", requires: ["students"] });
const attendance = defineModule({ id: "attendance", name: "Attendance", domain: "academics", requires: ["students", "academics"] });

const k12 = defineSchoolType({ type: "k12", displayName: "K-12", modules: ["students", "academics", "attendance"] });
const dance = defineSchoolType({ type: "dance", displayName: "Dance", modules: ["students", "attendance"] });

describe("createModuleRegistry", () => {
  it("creates a registry with modules", () => {
    const registry = createModuleRegistry({ modules: [students, academics] });
    expect(registry.getModule("students")).toBe(students);
    expect(registry.getModule("academics")).toBe(academics);
    expect(registry.getModule("unknown")).toBeUndefined();
  });

  it("creates a registry with school types", () => {
    const registry = createModuleRegistry({ modules: [students, academics, attendance], schoolTypes: [k12, dance] });
    expect(registry.getSchoolType("k12")).toBe(k12);
    expect(registry.getSchoolType("dance")).toBe(dance);
    expect(registry.getSchoolType("unknown")).toBeUndefined();
  });

  it("lists module IDs", () => {
    const registry = createModuleRegistry({ modules: [students, academics] });
    expect(registry.moduleIds()).toEqual(["students", "academics"]);
  });

  it("lists school type IDs", () => {
    const registry = createModuleRegistry({ modules: [students], schoolTypes: [k12, dance] });
    expect(registry.schoolTypeIds()).toEqual(["k12", "dance"]);
  });

  it("throws on duplicate module IDs", () => {
    const dup = defineModule({ id: "students", name: "Dup", domain: "x" });
    expect(() => createModuleRegistry({ modules: [students, dup] })).toThrow("Duplicate module");
  });

  it("throws on duplicate school types", () => {
    const dup = defineSchoolType({ type: "k12", displayName: "Dup", modules: ["students"] });
    expect(() => createModuleRegistry({ modules: [students], schoolTypes: [k12, dup] })).toThrow("Duplicate school type");
  });

  it("validates successfully for consistent registry", () => {
    const registry = createModuleRegistry({ modules: [students, academics, attendance], schoolTypes: [k12] });
    const errors = registry.validate();
    expect(errors).toEqual([]);
  });

  it("detects school type referencing unknown module", () => {
    const badType = defineSchoolType({ type: "bad", displayName: "Bad", modules: ["nonexistent"] });
    const registry = createModuleRegistry({ modules: [students], schoolTypes: [badType] });
    const errors = registry.validate();

    expect(errors.some((e) => e.type === "unknown_module" && e.moduleId === "nonexistent")).toBe(true);
  });

  it("returns all modules as a map", () => {
    const registry = createModuleRegistry({ modules: [students, academics] });
    const all = registry.getAllModules();
    expect(all.size).toBe(2);
    expect(all.get("students")).toBe(students);
  });
});
