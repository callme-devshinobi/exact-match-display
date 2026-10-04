CREATE POLICY "Promotional images have no direct browser access"
ON storage.objects
FOR SELECT
TO public
USING (false);