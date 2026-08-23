import { describe, expect, it } from "vitest";
import { PERMISSIONS, ROLE_PERMISSIONS, hasPermission, permissionsForRoles, primaryRole } from "@/lib/rbac";

describe("role permissions", () => {
  it("gives an employee only their own learning", () => {
    const perms = permissionsForRoles(["EMPLOYEE"]);
    expect(perms.has("learning.self")).toBe(true);
    expect(perms.has("users.view")).toBe(false);
    expect(perms.has("analytics.executive")).toBe(false);
    expect(perms.has("settings.manage")).toBe(false);
    expect(perms.size).toBe(1);
  });

  it("gives a manager team visibility but no administration", () => {
    const perms = permissionsForRoles(["MANAGER"]);
    expect(perms.has("team.view")).toBe(true);
    expect(perms.has("analytics.team")).toBe(true);
    expect(perms.has("users.manage")).toBe(false);
    expect(perms.has("catalog.manage")).toBe(false);
    expect(perms.has("audit.view")).toBe(false);
  });

  it("gives an admin the academy but not the system controls", () => {
    const perms = permissionsForRoles(["ADMIN"]);
    expect(perms.has("catalog.manage")).toBe(true);
    expect(perms.has("assessments.manage")).toBe(true);
    expect(perms.has("reports.export")).toBe(true);
    expect(perms.has("settings.manage")).toBe(false);
    expect(perms.has("integrations.manage")).toBe(false);
    expect(perms.has("roles.manage")).toBe(false);
    expect(perms.has("audit.view")).toBe(false);
  });

  it("gives the super admin everything", () => {
    const perms = permissionsForRoles(["SUPER_ADMIN"]);
    expect(perms.size).toBe(Object.keys(PERMISSIONS).length);
  });

  it("unions permissions across multiple roles", () => {
    const perms = permissionsForRoles(["EMPLOYEE", "MANAGER"]);
    expect(perms.has("learning.self")).toBe(true);
    expect(perms.has("team.view")).toBe(true);
  });

  it("ignores unknown roles instead of throwing", () => {
    expect(permissionsForRoles(["NOT_A_ROLE"]).size).toBe(0);
  });

  it("every role permission exists in the catalog", () => {
    for (const [role, keys] of Object.entries(ROLE_PERMISSIONS)) {
      for (const key of keys) {
        expect(Object.keys(PERMISSIONS), `${role} → ${key}`).toContain(key);
      }
    }
  });
});

describe("primary role", () => {
  it("picks the highest-ranked role", () => {
    expect(primaryRole(["EMPLOYEE"])).toBe("EMPLOYEE");
    expect(primaryRole(["EMPLOYEE", "MANAGER"])).toBe("MANAGER");
    expect(primaryRole(["MANAGER", "SUPER_ADMIN"])).toBe("SUPER_ADMIN");
    expect(primaryRole(["ADMIN", "MANAGER"])).toBe("ADMIN");
  });

  it("falls back to employee when nothing is assigned", () => {
    expect(primaryRole([])).toBe("EMPLOYEE");
  });
});

describe("hasPermission", () => {
  it("checks membership without granting anything extra", () => {
    expect(hasPermission(["learning.self"], "learning.self")).toBe(true);
    expect(hasPermission(["learning.self"], "users.manage")).toBe(false);
  });
});
