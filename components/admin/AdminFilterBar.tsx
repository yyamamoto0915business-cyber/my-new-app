"use client";

import type { FormEvent, ReactNode } from "react";

export function AdminSearchInput({
  name = "q",
  defaultValue,
  placeholder = "検索…",
}: {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <input
      type="search"
      name={name}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="h-8 w-full min-w-[180px] flex-1 rounded-md border border-[#c8dcd0] bg-white px-2.5 text-xs text-[#0e1610] outline-none ring-[#1e3848] placeholder:text-[#9ab0a0] focus:ring-2"
    />
  );
}

export function AdminFilterBar({
  children,
  action,
}: {
  children: ReactNode;
  action?: string;
}) {
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    // allow default GET navigation for server pages
    void e;
  }

  return (
    <form
      method="get"
      action={action}
      onSubmit={onSubmit}
      className="mb-2 flex flex-wrap items-center gap-1.5 rounded-lg border border-[#d8e8dc] bg-white p-1.5"
    >
      {children}
      <button
        type="submit"
        className="h-8 rounded-md bg-[#1e3848] px-3 text-xs font-medium text-white hover:bg-[#152836]"
      >
        絞り込む
      </button>
    </form>
  );
}
