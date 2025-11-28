-- Create enum for recipe status
CREATE TYPE recipe_status AS ENUM ('pending', 'approved', 'rejected');

-- Create enum for user roles
CREATE TYPE app_role AS ENUM ('user', 'admin');

-- Create enum for report reasons
CREATE TYPE report_reason AS ENUM ('spam', 'offensive', 'dangerous', 'copyright', 'other');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create user_roles table (separate for security)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, role)
);

-- Create recipes table
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  ingredients TEXT[] NOT NULL,
  steps TEXT[] NOT NULL,
  prep_time INTEGER,
  cook_time INTEGER,
  servings INTEGER,
  tags TEXT[],
  image_url TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status recipe_status DEFAULT 'pending' NOT NULL,
  moderator_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  approved_at TIMESTAMPTZ
);

-- Create recipe_reports table
CREATE TABLE recipe_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason report_reason NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(recipe_id, reporter_id)
);

-- Create saved_recipes table (favorites)
CREATE TABLE saved_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, recipe_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles RLS policies
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User roles RLS policies
CREATE POLICY "Admins can view all roles"
  ON user_roles FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON user_roles FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Recipes RLS policies
CREATE POLICY "Everyone can view approved recipes"
  ON recipes FOR SELECT
  USING (status = 'approved' OR author_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create recipes"
  ON recipes FOR INSERT
  WITH CHECK (auth.uid() = author_id AND status = 'pending');

CREATE POLICY "Users can update own pending recipes"
  ON recipes FOR UPDATE
  USING (auth.uid() = author_id AND status = 'pending');

CREATE POLICY "Admins can update any recipe"
  ON recipes FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete recipes"
  ON recipes FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Recipe reports RLS policies
CREATE POLICY "Users can create reports"
  ON recipe_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
  ON recipe_reports FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reports"
  ON recipe_reports FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Saved recipes RLS policies
CREATE POLICY "Users can view own saved recipes"
  ON saved_recipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save recipes"
  ON saved_recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave recipes"
  ON saved_recipes FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, username)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  
  -- Assign default user role
  INSERT INTO user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger to update recipes updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create indexes for performance
CREATE INDEX idx_recipes_status ON recipes(status);
CREATE INDEX idx_recipes_author ON recipes(author_id);
CREATE INDEX idx_recipes_tags ON recipes USING GIN(tags);
CREATE INDEX idx_recipe_reports_recipe ON recipe_reports(recipe_id);
CREATE INDEX idx_recipe_reports_status ON recipe_reports(status);
CREATE INDEX idx_saved_recipes_user ON saved_recipes(user_id);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);