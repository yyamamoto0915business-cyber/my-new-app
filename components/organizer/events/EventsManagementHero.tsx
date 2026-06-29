"use client";

import type { ReactNode } from "react";

type Props = {
  actions?: ReactNode;
};

/** ダッシュボードと同系統のコンパクトヒーロー（PC） */
export function EventsManagementHero({ actions }: Props) {
  return (
    <section className="org-events-mgmt__hero" aria-label="イベント管理">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="org-events-mgmt__title">イベント管理</h1>
          <p className="org-events-mgmt__desc">
            公開・編集・募集・売上受取の設定をまとめて管理できます。
          </p>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}
