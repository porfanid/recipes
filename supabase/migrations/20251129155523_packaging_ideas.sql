-- Create packaging_ideas table (similar structure to recipes but simpler)
CREATE TABLE packaging_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  materials TEXT[] NOT NULL,
  steps TEXT[] NOT NULL,
  image_url TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status recipe_status DEFAULT 'pending' NOT NULL,
  moderator_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  approved_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE packaging_ideas ENABLE ROW LEVEL SECURITY;

-- Packaging ideas RLS policies (same as recipes)
CREATE POLICY "Everyone can view approved packaging ideas"
  ON packaging_ideas FOR SELECT
  USING (status = 'approved' OR author_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create packaging ideas"
  ON packaging_ideas FOR INSERT
  WITH CHECK (auth.uid() = author_id AND status = 'pending');

CREATE POLICY "Users can update own pending packaging ideas"
  ON packaging_ideas FOR UPDATE
  USING (auth.uid() = author_id AND status = 'pending');

CREATE POLICY "Admins can update any packaging idea"
  ON packaging_ideas FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own packaging ideas"
  ON packaging_ideas FOR DELETE
  USING (auth.uid() = author_id);

CREATE POLICY "Admins can delete packaging ideas"
  ON packaging_ideas FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Trigger to update packaging_ideas updated_at
CREATE TRIGGER update_packaging_ideas_updated_at
  BEFORE UPDATE ON packaging_ideas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create indexes for performance
CREATE INDEX idx_packaging_ideas_status ON packaging_ideas(status);
CREATE INDEX idx_packaging_ideas_author ON packaging_ideas(author_id);
