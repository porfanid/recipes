-- Storage policies for recipe-images bucket
-- Note: The bucket must be created manually in Supabase Dashboard:
-- 1. Go to Storage in the Supabase Dashboard
-- 2. Click "New Bucket"
-- 3. Name it "recipe-images"
-- 4. Enable "Public bucket" option

CREATE POLICY "Recipe images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'recipe-images');

CREATE POLICY "Authenticated users can upload recipe images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'recipe-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own recipe images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'recipe-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own recipe images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'recipe-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
