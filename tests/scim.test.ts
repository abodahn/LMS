import { describe, expect, it } from "vitest";
import { applyPatch, ENTERPRISE, fromScim } from "@/lib/scim";

const current = {
  userName: "sara@tc.com",
  displayName: "Sara Anwar",
  active: true,
  title: "Procurement Officer",
  [ENTERPRISE]: { employeeNumber: "E100", department: "Supply Chain", manager: { value: "m1" } },
};

describe("SCIM parsing", () => {
  it("reads core and enterprise attributes", () => {
    expect(fromScim(current)).toMatchObject({
      email: "sara@tc.com", fullName: "Sara Anwar", employeeCode: "E100", active: true,
      title: "Procurement Officer", department: "Supply Chain", manager: "m1",
    });
    expect(fromScim({ emails: [{ value: "X@TC.com", primary: true }], name: { givenName: "A", familyName: "B" } }))
      .toMatchObject({ email: "x@tc.com", fullName: "A B", title: undefined, department: undefined });
  });
});

describe("SCIM patch", () => {
  it("handles what Entra sends for a leaver and a mover", () => {
    const leaver = fromScim(applyPatch(current, { Operations: [{ op: "Replace", path: "active", value: "False" }] }));
    expect(leaver.active).toBe(false);
    const mover = fromScim(applyPatch(current, { Operations: [
      { op: "replace", path: `${ENTERPRISE}:department`, value: "Quality" },
      { op: "remove", path: `${ENTERPRISE}:manager` },
      { op: "replace", path: 'emails[type eq "work"].value', value: "s.anwar@tc.com" },
      { op: "replace", value: { title: "Quality Engineer" } },
    ] }));
    expect(mover).toMatchObject({ department: "Quality", manager: null, email: "s.anwar@tc.com", title: "Quality Engineer" });
  });
  it("rejects what it does not understand", () => {
    expect(() => applyPatch(current, {})).toThrow();
    expect(() => applyPatch(current, { Operations: [{ op: "move", path: "x" }] })).toThrow();
  });
});
