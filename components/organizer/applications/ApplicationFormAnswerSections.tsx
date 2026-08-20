"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { listFormAnswerEntries, type ApplicationFormConfig } from "@/lib/recruitment-application-form";
import type { Application } from "./ApplicationCard";

const FORM_CONTACT_KEYS = new Set(["phone", "age", "emergency_contact"]);
const FORM_CONTENT_SHORT_KEYS = new Set([
  "available_time",
  "available_time_note",
  "terms",
  "portrait",
]);
const FORM_CONTENT_LONG_KEYS = new Set(["experience", "self_intro"]);

export type FormAnswerRow = { key: string; label: string; display: string };

export function getApplicationFormViewModel(
  application: Application,
  formConfig?: ApplicationFormConfig | null
) {
  const formAnswers = listFormAnswerEntries(application.form_answers, formConfig);
  const desiredFromForm = formAnswers.find((e) => e.key === "desired_role")?.display;
  const roleLabel =
    application.role_assigned?.trim() || desiredFromForm || "未指定";
  const messageFromForm = formAnswers.find((e) => e.key === "message")?.display;
  const message =
    application.message?.trim() || messageFromForm || null;
  const formPending = application.form_completed_at == null;
  const formAnswerRows = formAnswers.filter(
    (e) => e.key !== "message" && e.key !== "desired_role"
  );
  const contactRows = formAnswerRows.filter((e) => FORM_CONTACT_KEYS.has(e.key));
  const contentShortRows = formAnswerRows.filter((e) => FORM_CONTENT_SHORT_KEYS.has(e.key));
  const contentLongRows = formAnswerRows.filter((e) => FORM_CONTENT_LONG_KEYS.has(e.key));
  const otherRows = formAnswerRows.filter(
    (e) =>
      !FORM_CONTACT_KEYS.has(e.key) &&
      !FORM_CONTENT_SHORT_KEYS.has(e.key) &&
      !FORM_CONTENT_LONG_KEYS.has(e.key)
  );
  const hasFormBody =
    contactRows.length +
      contentShortRows.length +
      contentLongRows.length +
      otherRows.length >
    0;

  return {
    roleLabel,
    message,
    formPending,
    contactRows,
    contentShortRows,
    contentLongRows,
    otherRows,
    hasFormBody,
  };
}

function FormAnswerGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="text-[11px] font-semibold tracking-wide text-[#3f5a3c]">{title}</h3>
      <div className="mt-1.5 overflow-hidden rounded-xl border border-[#e8ebe3] bg-white">
        {children}
      </div>
    </section>
  );
}

function FieldCell({ row }: { row: FormAnswerRow }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-medium leading-none text-[#5f6f5c]">{row.label}</dt>
      <dd className="mt-1 break-words text-[13px] font-medium leading-snug text-[#1a2818]">
        {row.display}
      </dd>
    </div>
  );
}

function isFullWidthField(row: FormAnswerRow): boolean {
  return (
    row.key === "emergency_contact" ||
    row.display.length > 28 ||
    row.label.length > 12
  );
}

/** 2列ペア／全幅を行単位に分け、余りは全幅にして空きマスを出さない */
function buildFieldRows(rows: FormAnswerRow[]): FormAnswerRow[][] {
  const result: FormAnswerRow[][] = [];
  let i = 0;
  while (i < rows.length) {
    const cur = rows[i]!;
    if (isFullWidthField(cur)) {
      result.push([cur]);
      i += 1;
      continue;
    }
    const next = rows[i + 1];
    if (next && !isFullWidthField(next)) {
      result.push([cur, next]);
      i += 2;
      continue;
    }
    result.push([cur]);
    i += 1;
  }
  return result;
}

function FormAnswerShortBlocks({ rows }: { rows: FormAnswerRow[] }) {
  if (rows.length === 0) return null;
  const groups = buildFieldRows(rows);
  return (
    <>
      {groups.map((group) => (
        <dl
          key={group.map((r) => r.key).join("-")}
          className={cn(
            "grid gap-x-3 px-3 py-2.5",
            group.length === 2 ? "grid-cols-2" : "grid-cols-1"
          )}
        >
          {group.map((row) => (
            <FieldCell key={row.key} row={row} />
          ))}
        </dl>
      ))}
    </>
  );
}

/** 長いテキストを2行で畳む（モバイル向け） */
export function ExpandableText({
  text,
  className,
  collapsedLines = 2,
}: {
  text: string;
  className?: string;
  collapsedLines?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const needsToggle = text.length > 60 || text.includes("\n");

  useEffect(() => {
    setExpanded(false);
  }, [text]);

  if (!needsToggle) {
    return (
      <p className={cn("whitespace-pre-wrap text-[13px] leading-relaxed text-[#2c3428]", className)}>
        {text}
      </p>
    );
  }

  return (
    <div>
      <p
        className={cn(
          "whitespace-pre-wrap text-[13px] leading-relaxed text-[#2c3428]",
          !expanded && (collapsedLines === 2 ? "line-clamp-2" : "line-clamp-3"),
          className
        )}
      >
        {text}
      </p>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-1 text-[11px] font-semibold text-[#3a633d] underline-offset-2 hover:underline"
      >
        {expanded ? "閉じる" : "もっと見る"}
      </button>
    </div>
  );
}

function FormAnswerLongBlock({
  row,
  collapsible,
}: {
  row: FormAnswerRow;
  collapsible?: boolean;
}) {
  return (
    <div className="px-3 py-2.5">
      <p className="text-[10px] font-medium leading-none text-[#5f6f5c]">{row.label}</p>
      <div className="mt-1">
        {collapsible ? (
          <ExpandableText text={row.display} />
        ) : (
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[#2c3428]">
            {row.display}
          </p>
        )}
      </div>
    </div>
  );
}

function DividedCardBody({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-[#f0f2ec]">{children}</div>;
}

/** 応募フォーム回答ブロック（PC詳細・モバイル詳細で共用） */
export function ApplicationFormAnswerSections({
  application,
  formConfig,
  collapsibleLongText = false,
}: {
  application: Application;
  formConfig?: ApplicationFormConfig | null;
  /** モバイル向け：長文を折りたたむ */
  collapsibleLongText?: boolean;
}) {
  const {
    formPending,
    contactRows,
    contentShortRows,
    contentLongRows,
    otherRows,
    hasFormBody,
  } = getApplicationFormViewModel(application, formConfig);

  if (formPending) {
    return (
      <section>
        <h3 className="text-[11px] font-semibold tracking-wide text-[#3f5a3c]">応募フォーム</h3>
        <div
          className="mt-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-3"
          role="status"
        >
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <AlertCircle className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-amber-900">フォーム未提出</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-amber-800/90">
                応募者はまだ詳細を入力していません。お知らせの入力案内をお待ちください。
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!hasFormBody) {
    return (
      <section>
        <h3 className="text-[11px] font-semibold tracking-wide text-[#3f5a3c]">応募フォーム</h3>
        <p className="mt-1.5 rounded-xl border border-[#e8ebe3] bg-[#fafcf8] px-3 py-2.5 text-[12px] text-[#8a9e80]">
          回答項目はありません
        </p>
      </section>
    );
  }

  const otherShort = otherRows.filter((r) => r.display.length <= 40 && !isFullWidthField(r));
  const otherLong = otherRows.filter((r) => r.display.length > 40 || isFullWidthField(r));

  return (
    <div className="space-y-3.5">
      {contactRows.length > 0 ? (
        <FormAnswerGroup title="連絡先">
          <DividedCardBody>
            <FormAnswerShortBlocks rows={contactRows} />
          </DividedCardBody>
        </FormAnswerGroup>
      ) : null}
      {contentShortRows.length > 0 || contentLongRows.length > 0 ? (
        <FormAnswerGroup title="応募内容">
          <DividedCardBody>
            <FormAnswerShortBlocks rows={contentShortRows} />
            {contentLongRows.map((row) => (
              <FormAnswerLongBlock
                key={row.key}
                row={row}
                collapsible={collapsibleLongText}
              />
            ))}
          </DividedCardBody>
        </FormAnswerGroup>
      ) : null}
      {otherRows.length > 0 ? (
        <FormAnswerGroup title="追加の回答">
          <DividedCardBody>
            <FormAnswerShortBlocks rows={otherShort} />
            {otherLong.map((row) => (
              <FormAnswerLongBlock
                key={row.key}
                row={row}
                collapsible={collapsibleLongText}
              />
            ))}
          </DividedCardBody>
        </FormAnswerGroup>
      ) : null}
    </div>
  );
}
