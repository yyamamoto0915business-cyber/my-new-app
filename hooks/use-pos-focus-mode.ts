"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "org-pos-focus";
const HTML_ATTR = "data-org-pos-focus";

function applyHtmlFlag(on: boolean) {
  const root = document.documentElement;
  if (on) root.setAttribute(HTML_ATTR, "1");
  else root.removeAttribute(HTML_ATTR);
}

/** スタッフ向けレジ全体表示。サイトメニューを隠して会計面を広くする。 */
export function usePosFocusMode() {
  const [focus, setFocus] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === "1") setFocus(true);
  }, []);

  useEffect(() => {
    applyHtmlFlag(focus);
    if (focus) sessionStorage.setItem(STORAGE_KEY, "1");
    else sessionStorage.removeItem(STORAGE_KEY);
    return () => applyHtmlFlag(false);
  }, [focus]);

  useEffect(() => {
    if (!focus) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocus(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus]);

  const toggleFocus = useCallback(() => {
    setFocus((v) => !v);
  }, []);

  return { focus, toggleFocus };
}
