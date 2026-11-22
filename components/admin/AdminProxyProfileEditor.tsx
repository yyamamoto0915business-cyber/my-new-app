"use client";

import { useEffect, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";

type Profile = {
  name: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  shortBio: string;
  bio: string;
  area: string;
  websiteUrl: string;
  instagramUrl: string;
};

const input = "h-11 w-full rounded-lg border border-[#d8e4dc] px-3 text-sm";

/** 代わりに作った主催者ページのプロフィール（名前・アイコン・カバー・紹介）を運営が書く */
export function AdminProxyProfileEditor({ organizerId, onSaved }: { organizerId: string; onSaved: () => void }) {
  const [p, setP] = useState<Profile | null>(null);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/admin/proxy-organizers/${organizerId}/profile`, { cache: "no-store" });
      const json = (await res.json().catch(() => ({}))) as Profile & { error?: string };
      if (cancelled) return;
      if (!res.ok) {
        setMsg({ ok: false, text: json.error ?? "読み込めませんでした" });
        return;
      }
      setP(json);
    })();
    return () => {
      cancelled = true;
    };
  }, [organizerId]);

  const avatarPreview = avatar ? URL.createObjectURL(avatar) : p?.avatarUrl ?? null;
  const coverPreview = cover ? URL.createObjectURL(cover) : p?.coverUrl ?? null;

  async function save() {
    if (!p) return;
    setSaving(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.set("name", p.name);
      fd.set("shortBio", p.shortBio);
      fd.set("bio", p.bio);
      fd.set("area", p.area);
      fd.set("websiteUrl", p.websiteUrl);
      fd.set("instagramUrl", p.instagramUrl);
      if (avatar) fd.set("avatar", avatar);
      if (cover) fd.set("cover", cover);
      const res = await fetch(`/api/admin/proxy-organizers/${organizerId}/profile`, { method: "POST", body: fd });
      const json = (await res.json().catch(() => ({}))) as { avatarUrl?: string | null; coverUrl?: string | null; error?: string };
      if (!res.ok) {
        setMsg({ ok: false, text: json.error ?? "保存できませんでした" });
        return;
      }
      setP((cur) => (cur ? { ...cur, avatarUrl: json.avatarUrl ?? cur.avatarUrl, coverUrl: json.coverUrl ?? cur.coverUrl } : cur));
      setAvatar(null);
      setCover(null);
      setMsg({ ok: true, text: "保存しました" });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  if (!p) {
    return <p className="mt-2 text-xs text-[#6b776f]">{msg?.text ?? "読み込んでいます…"}</p>;
  }

  const set = (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setP((cur) => (cur ? { ...cur, [k]: e.target.value } : cur));

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-[#e6e2d6] bg-[#fbfaf6] p-3">
      {/* カバーとアイコン：押すと写真を選ぶ */}
      <label className="relative block h-24 cursor-pointer overflow-hidden rounded-lg border border-dashed border-[#c9d8cd] bg-white">
        {coverPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverPreview} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center gap-1 text-xs font-bold text-[#6b776f]">
            <ImagePlus className="h-4 w-4" aria-hidden />
            カバー写真を選ぶ
          </span>
        )}
        <input type="file" accept="image/*" className="sr-only" onChange={(e) => setCover(e.target.files?.[0] ?? null)} />
      </label>
      <div className="flex items-center gap-3">
        <label className="relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-full border border-dashed border-[#c9d8cd] bg-white">
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-[10px] font-bold text-[#6b776f]">アイコン</span>
          )}
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => setAvatar(e.target.files?.[0] ?? null)} />
        </label>
        <div className="min-w-0 flex-1 space-y-2">
          <input value={p.name} onChange={set("name")} maxLength={80} placeholder="団体名・店名" className={input} />
          <input value={p.area} onChange={set("area")} maxLength={80} placeholder="活動エリア（例：〇〇市）" className={input} />
        </div>
      </div>
      <input value={p.shortBio} onChange={set("shortBio")} maxLength={120} placeholder="ひとこと紹介（120字まで）" className={input} />
      <textarea
        value={p.bio}
        onChange={set("bio")}
        maxLength={2000}
        rows={4}
        placeholder="紹介文（お店の思い・メニュー・出店場所など）"
        className="w-full rounded-lg border border-[#d8e4dc] px-3 py-2 text-sm"
      />
      <div className="grid gap-2 min-[768px]:grid-cols-2">
        <input value={p.instagramUrl} onChange={set("instagramUrl")} maxLength={300} placeholder="Instagram の URL" className={input} />
        <input value={p.websiteUrl} onChange={set("websiteUrl")} maxLength={300} placeholder="ホームページの URL" className={input} />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || !p.name.trim()}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#173f2c] px-4 text-sm font-bold text-[#f6ebc8] disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          保存する
        </button>
        {msg ? <p className={`text-xs font-bold ${msg.ok ? "text-[#1f6a42]" : "text-red-600"}`}>{msg.text}</p> : null}
      </div>
    </div>
  );
}
