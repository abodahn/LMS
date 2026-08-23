"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";

export function EmployeePicker({
  employees,
  selected,
  label,
}: {
  employees: { id: string; label: string }[];
  selected: string;
  label: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();

  return (
    <label className="block max-w-lg">
      <span className="label">{label}</span>
      <select
        className="field bg-white"
        value={selected}
        disabled={pending}
        onChange={(e) => {
          const id = e.target.value;
          start(() => router.replace(id ? `${pathname}?userId=${id}` : pathname));
        }}
      >
        <option value="">—</option>
        {employees.map((e) => (
          <option key={e.id} value={e.id}>
            {e.label}
          </option>
        ))}
      </select>
    </label>
  );
}
