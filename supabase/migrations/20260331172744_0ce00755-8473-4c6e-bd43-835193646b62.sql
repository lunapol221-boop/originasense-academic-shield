
CREATE POLICY "Service can delete matched sources for re-analysis"
ON public.matched_sources
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM submissions s
    WHERE s.id = matched_sources.submission_id
    AND (
      s.user_id = auth.uid()
      OR has_role(auth.uid(), 'super_admin'::app_role)
    )
  )
);
