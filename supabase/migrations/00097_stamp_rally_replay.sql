-- スタンプラリーの周回。何度でも参加できるときは、クリア後に次の周へ進む

ALTER TABLE public.organizer_game_players
  ADD COLUMN IF NOT EXISTS play_round INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.organizer_game_stamps
  ADD COLUMN IF NOT EXISTS round INTEGER NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.organizer_game_stamps'::regclass
      AND conname = 'organizer_game_stamps_pkey'
      AND pg_get_constraintdef(oid) NOT LIKE '%round%'
  ) THEN
    ALTER TABLE public.organizer_game_stamps DROP CONSTRAINT organizer_game_stamps_pkey;
    ALTER TABLE public.organizer_game_stamps
      ADD CONSTRAINT organizer_game_stamps_pkey PRIMARY KEY (player_id, spot_id, round);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
