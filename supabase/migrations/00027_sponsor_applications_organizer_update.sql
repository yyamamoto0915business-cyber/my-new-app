-- 主催者が自イベントの SponsorApplication の status を更新できるようにする
CREATE POLICY "sponsor_applications_update_organizer" ON public.sponsor_applications
FOR UPDATE USING (
  event_id IN (
    SELECT id FROM public.events
    WHERE organizer_id IN (SELECT id FROM public.organizers WHERE profile_id = auth.uid())
  )
);
