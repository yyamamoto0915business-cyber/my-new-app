-- events テーブルにチェックイン用カラムを追加
alter table events
  add column if not exists checkin_enabled boolean default true,
  add column if not exists checkin_token  text unique,
  add column if not exists checkin_code   text unique;

-- event_checkins テーブル
create table if not exists event_checkins (
  id             uuid        primary key default gen_random_uuid(),
  event_id       uuid        not null references events(id) on delete cascade,
  user_id        uuid        null references auth.users(id),
  guest_name     text        null,
  checked_in_at  timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

-- ログイン済みの重複防止
create unique index if not exists unique_event_user_checkin
  on event_checkins(event_id, user_id)
  where user_id is not null;

-- RLS
alter table event_checkins enable row level security;

-- 来場者: 自分のチェックインだけ作成
create policy "checkin_insert_own" on event_checkins
  for insert
  with check (
    user_id = auth.uid()
    or user_id is null  -- ゲスト
  );

-- 来場者: 自分のチェックインだけ参照
create policy "checkin_select_own" on event_checkins
  for select
  using (user_id = auth.uid());

-- 主催者: 自分のイベントのチェックイン一覧を参照
create policy "checkin_select_organizer" on event_checkins
  for select
  using (
    exists (
      select 1 from events e
      join organizer_profiles op on op.id = e.organizer_id
      where e.id = event_checkins.event_id
        and op.profile_id = auth.uid()
    )
  );
