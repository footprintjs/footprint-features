import { describe, it, expect } from "vitest";
import { defineModule } from "../../defineModule.js";
import { defineSchoolType } from "../../defineSchoolType.js";
import { createModuleRegistry } from "../../moduleRegistry.js";
import { resolveSchoolConfig } from "../../resolveConfig.js";

const students = defineModule({
  id: "students", name: "Students", domain: "people",
  terminology: { student: { default: "Student" } },
  roles: { canEnroll: ["Admin", "Front Desk"] },
  seed: { default: { fields: ["name", "dob"] } },
});
const academics = defineModule({
  id: "academics", name: "Academics", domain: "academics",
  requires: ["students"],
  terminology: { grade: { default: "Grade", dance: "Level" } },
  seed: { k12: { grades: 12 }, dance: { grades: 3 } },
});
const attendance = defineModule({
  id: "attendance", name: "Attendance", domain: "academics",
  requires: ["students", "academics"],
  terminology: { session: { default: "Session", dance: "Check-in" } },
  roles: { canMark: ["Teacher", "Instructor"] },
  seed: { default: { statuses: ["present", "absent"] } },
});
const departments = defineModule({ id: "departments", name: "Departments", domain: "org" });
const fees = defineModule({
  id: "fees", name: "Fees", domain: "finance",
  requires: ["students"],
  seed: { dance: { model: "per-class" }, k12: { model: "per-term" } },
});

const k12 = defineSchoolType({
  type: "k12", displayName: "K-12",
  modules: ["students", "academics", "attendance", "departments", "fees"],
  roles: ["Principal", "Vice Principal", "Teacher", "Admin"],
  schedulingPattern: "fixed-timetable",
});
const dance = defineSchoolType({
  type: "dance", displayName: "Dance School",
  modules: ["students", "attendance", "fees"],
  roles: ["Owner", "Instructor", "Front Desk"],
  schedulingPattern: "time-slots",
});

const registry = createModuleRegistry({
  modules: [students, academics, attendance, departments, fees],
  schoolTypes: [k12, dance],
});

describe("resolveSchoolConfig", () => {
  it("resolves enabled modules with transitive deps for dance school", () => {
    const config = resolveSchoolConfig(registry, "dance");

    expect(config.schoolType).toBe("dance");
    expect(config.enabledModules).toContain("students");
    expect(config.enabledModules).toContain("attendance");
    expect(config.enabledModules).toContain("academics"); // transitive
    expect(config.enabledModules).toContain("fees");
    expect(config.enabledModules).not.toContain("departments");
  });

  it("resolves enabled modules for K-12 school", () => {
    const config = resolveSchoolConfig(registry, "k12");

    expect(config.enabledModules).toContain("students");
    expect(config.enabledModules).toContain("academics");
    expect(config.enabledModules).toContain("attendance");
    expect(config.enabledModules).toContain("departments");
    expect(config.enabledModules).toContain("fees");
  });

  it("resolves terminology for dance school", () => {
    const config = resolveSchoolConfig(registry, "dance");

    expect(config.terminology.grade).toBe("Level");
    expect(config.terminology.session).toBe("Check-in");
    expect(config.terminology.student).toBe("Student"); // default
  });

  it("resolves terminology for K-12 school", () => {
    const config = resolveSchoolConfig(registry, "k12");

    expect(config.terminology.grade).toBe("Grade"); // default
    expect(config.terminology.session).toBe("Session"); // default
  });

  it("merges roles from school type and modules", () => {
    const config = resolveSchoolConfig(registry, "dance");

    // From school type
    expect(config.roles).toContain("Owner");
    expect(config.roles).toContain("Instructor");
    expect(config.roles).toContain("Front Desk");
    // From module roles
    expect(config.roles).toContain("Admin"); // from students.canEnroll
    expect(config.roles).toContain("Teacher"); // from attendance.canMark
  });

  it("resolves seed data for dance school", () => {
    const config = resolveSchoolConfig(registry, "dance");

    expect(config.seed.academics).toEqual({ grades: 3 }); // dance-specific
    expect(config.seed.fees).toEqual({ model: "per-class" }); // dance-specific
    expect(config.seed.attendance).toEqual({ statuses: ["present", "absent"] }); // default
    expect(config.seed.students).toEqual({ fields: ["name", "dob"] }); // default
  });

  it("resolves seed data for K-12 school", () => {
    const config = resolveSchoolConfig(registry, "k12");

    expect(config.seed.academics).toEqual({ grades: 12 }); // k12-specific
    expect(config.seed.fees).toEqual({ model: "per-term" }); // k12-specific
  });

  it("builds dependency tree", () => {
    const config = resolveSchoolConfig(registry, "dance");

    expect(config.dependencyTree.get("students")).toEqual([]);
    expect(config.dependencyTree.get("academics")).toEqual(["students"]);
    expect(config.dependencyTree.get("attendance")).toContain("students");
    expect(config.dependencyTree.get("attendance")).toContain("academics");
  });

  it("returns empty config for unknown school type", () => {
    const config = resolveSchoolConfig(registry, "unknown");

    expect(config.schoolType).toBe("unknown");
    expect(config.enabledModules.size).toBe(0);
    expect(config.roles).toEqual([]);
  });

  it("accepts module overrides", () => {
    const config = resolveSchoolConfig(registry, "dance", ["students", "fees"]);

    // Only students and fees (and students as transitive dep of fees)
    expect(config.enabledModules).toContain("students");
    expect(config.enabledModules).toContain("fees");
    expect(config.enabledModules).not.toContain("attendance");
    expect(config.enabledModules).not.toContain("departments");
  });

  it("provides module definitions in config", () => {
    const config = resolveSchoolConfig(registry, "dance");

    expect(config.modules.get("students")).toBe(students);
    expect(config.modules.get("attendance")).toBe(attendance);
    expect(config.modules.has("departments")).toBe(false);
  });
});
