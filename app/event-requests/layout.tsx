import { notFound } from "next/navigation";

/**
 * 「イベントのお願い」は、作りかけ（詳細が見本・支援しても記録されない・通報の入り口がない）のため、
 * いったん公開を止めている（2026-11-09）。作り直すときは、このファイルを消す。
 * 作り直す案：お金ではなく「行きたい」の数を集める・通報とブロックをつける（docs/AFTER_APP_REVIEW_TASKS.md）。
 */
export default function EventRequestsLayout(): never {
  notFound();
}
