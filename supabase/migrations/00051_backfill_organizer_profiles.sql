-- 主催者登録済みだが organizer_profiles 行が無いケースを補完
INSERT INTO public.organizer_profiles (organizer_id)
SELECT o.id
FROM public.organizers o
LEFT JOIN public.organizer_profiles op ON op.organizer_id = o.id
WHERE op.organizer_id IS NULL
ON CONFLICT (organizer_id) DO NOTHING;
