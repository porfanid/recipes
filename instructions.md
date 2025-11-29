# RecipeShare Instructions

This document provides instructions for deploying this application and migrating data between Supabase instances.

---

## Table of Contents

1. [Migrating from Lovable Cloud to New Supabase Instance](#migrating-from-lovable-cloud-to-new-supabase-instance)
2. [Deploying RecipeShare to GitHub Pages](#deploying-recipeshare-to-github-pages)

---

## Migrating from Lovable Cloud to New Supabase Instance

This section explains how to migrate users and recipes from the old Lovable Cloud Supabase instance to the new Supabase instance.

### Prerequisites

- Access to the **old Supabase project** (Lovable Cloud instance): `dlmdbncjpffrevdaeshs`
- Access to the **new Supabase project**: `vrnlztosfbrtsbcaqsmd`
- Supabase CLI installed (`npm install -g supabase`)
- PostgreSQL client (psql) installed

### Step 1: Set Up the New Supabase Instance

1. Go to the [Supabase Dashboard](https://supabase.com/dashboard) and navigate to the new project (`vrnlztosfbrtsbcaqsmd`)

2. Run the database migrations to set up the schema. You can do this via the Supabase Dashboard SQL Editor by running the migrations in order:
   - `supabase/migrations/20251128173323_d914b8b0-f2cf-47f0-b0f7-25d5c27fe137.sql` (creates tables, enums, RLS policies)
   - `supabase/migrations/20251128173345_014b844f-060c-4fe4-82ea-d06b493b22a9.sql` (fixes update_updated_at function)
   - `supabase/migrations/20251129084447_1aa3fb85-efae-4750-bdb7-08472a055bf8.sql` (storage policies for avatars)
   - `supabase/migrations/20251129093123_recipe_images_storage.sql` (storage policies for recipe images)

3. Create the `avatars` storage bucket:
   - Go to **Storage** in the Supabase Dashboard
   - Click **New Bucket**
   - Name it `avatars`
   - Enable **Public bucket** option

4. Create the `recipe-images` storage bucket:
   - Go to **Storage** in the Supabase Dashboard
   - Click **New Bucket**
   - Name it `recipe-images`
   - Enable **Public bucket** option

### Step 2: Export Data from Old Instance

#### Option A: Using Supabase Dashboard (Recommended for smaller datasets)

1. **Export Recipes:**
   - Go to the old Supabase project's SQL Editor
   - Run: `SELECT * FROM recipes;`
   - Click **Download CSV** to export the data

2. **Export Profiles:**
   - Run: `SELECT * FROM profiles;`
   - Download CSV

3. **Export User Roles:**
   - Run: `SELECT * FROM user_roles;`
   - Download CSV

4. **Export Saved Recipes:**
   - Run: `SELECT * FROM saved_recipes;`
   - Download CSV

5. **Export Recipe Reports (if any):**
   - Run: `SELECT * FROM recipe_reports;`
   - Download CSV

#### Option B: Using pg_dump (Recommended for larger datasets)

1. Get the database connection string from the old Supabase project:
   - Go to **Settings** > **Database** > **Connection string** > **URI**

2. Export the public schema data:
   ```bash
   pg_dump "postgresql://postgres:[PASSWORD]@db.dlmdbncjpffrevdaeshs.supabase.co:5432/postgres" \
     --data-only \
     --schema=public \
     --table=profiles \
     --table=user_roles \
     --table=recipes \
     --table=saved_recipes \
     --table=recipe_reports \
     > data_export.sql
   ```

### Step 3: Migrate User Accounts

**Important:** User authentication data is stored in `auth.users` which cannot be directly exported. You have two options:

#### Option A: Users Re-register (Simplest)
- Ask users to create new accounts on the new instance
- This is the cleanest approach but loses user account history

#### Option B: Using Supabase Auth Admin API (Preserves user IDs)

1. Export user data from the old instance using the Supabase Management API or Dashboard
2. Use the Supabase Admin API to create users in the new instance with the same UUIDs:

   ```javascript
   // Example script (run with Node.js)
   const { createClient } = require('@supabase/supabase-js');

   const supabaseAdmin = createClient(
     'https://vrnlztosfbrtsbcaqsmd.supabase.co',
     'YOUR_SERVICE_ROLE_KEY' // Use service role key, not anon key
   );

   // For each user from the old instance
   const { data, error } = await supabaseAdmin.auth.admin.createUser({
     email: 'user@example.com',
     password: 'temporary_password', // User will need to reset
     email_confirm: true,
     user_metadata: { username: 'original_username' },
     // Optionally specify the same UUID if you need to preserve references
     // id: 'original-uuid-here'
   });
   ```

3. After creating users, send password reset emails:
   ```javascript
   await supabaseAdmin.auth.admin.generateLink({
     type: 'recovery',
     email: 'user@example.com'
   });
   ```

### Step 4: Import Data to New Instance

#### Using Supabase Dashboard (for CSV exports):

1. Go to the new Supabase project's Table Editor
2. For each table (in order to respect foreign keys):
   - **profiles** first (depends on auth.users)
   - **user_roles** (depends on auth.users)
   - **recipes** (depends on auth.users)
   - **saved_recipes** (depends on auth.users and recipes)
   - **recipe_reports** (depends on auth.users and recipes)

3. Use **Import CSV** feature or manually insert via SQL Editor

#### Using psql (for pg_dump exports):

```bash
psql "postgresql://postgres:[PASSWORD]@db.vrnlztosfbrtsbcaqsmd.supabase.co:5432/postgres" \
  < data_export.sql
```

### Step 5: Migrate Storage (Avatars and Recipe Images)

1. Download all files from the old `avatars` and `recipe-images` buckets
2. Upload them to the new buckets maintaining the same folder structure

You can use the Supabase JS client to automate this:

```javascript
const oldSupabase = createClient('OLD_URL', 'OLD_KEY');
const newSupabase = createClient('NEW_URL', 'NEW_SERVICE_ROLE_KEY');

// Migrate avatars
const { data: avatarFiles } = await oldSupabase.storage.from('avatars').list('', { limit: 1000 });
for (const file of avatarFiles) {
  const { data: blob } = await oldSupabase.storage.from('avatars').download(file.name);
  await newSupabase.storage.from('avatars').upload(file.name, blob);
}

// Migrate recipe images
const { data: recipeImageFiles } = await oldSupabase.storage.from('recipe-images').list('', { limit: 1000 });
for (const file of recipeImageFiles) {
  const { data: blob } = await oldSupabase.storage.from('recipe-images').download(file.name);
  await newSupabase.storage.from('recipe-images').upload(file.name, blob);
}
```

### Step 6: Update Environment Variables

Update your deployment environment (GitHub Secrets) with the new Supabase credentials:

- `VITE_SUPABASE_URL`: `https://vrnlztosfbrtsbcaqsmd.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZybmx6dG9zZmJydHNiY2Fxc21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNDgxMjAsImV4cCI6MjA3OTkyNDEyMH0.pnQwOCbp01sBUaIIxaN_S8zKUrbJ0AKVZ2tO6GssVKk`

### Step 7: Verify Migration

1. Deploy the application with the new environment variables
2. Test user login (if users were migrated with Option B)
3. Verify recipes appear correctly
4. Check that saved recipes and user profiles work
5. Test image uploads to the avatars bucket

### Troubleshooting

- **Foreign key violations during import:** Ensure you import tables in the correct order (users/profiles first, then dependent tables)
- **UUID conflicts:** If using `pg_dump`, ensure the old and new schemas match exactly
- **RLS blocking imports:** Use the service role key or temporarily disable RLS when importing

---

## Deploying RecipeShare to GitHub Pages

This section explains how to deploy this application to GitHub Pages using GitHub Actions.

## Changes Made

### 1. Hash Router Implementation
The application now uses `HashRouter` instead of `BrowserRouter` in `src/App.tsx`. This is necessary because GitHub Pages serves static files and doesn't support client-side routing with the History API. Hash routing uses URL fragments (e.g., `https://username.github.io/repository-name/#/auth`) which work perfectly with static hosting.

### 2. GitHub Actions Workflow
A deployment workflow has been added at `.github/workflows/deploy.yml` that automatically builds and deploys the application to GitHub Pages when you push to the `main` branch.

## Setup Instructions

### Step 1: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings** (the gear icon)
3. In the left sidebar, click **Pages** under "Code and automation"
4. Under **Build and deployment**:
   - For **Source**, select **GitHub Actions**
5. Click **Save** if prompted

### Step 2: Push Changes to Main Branch

Once GitHub Pages is configured to use GitHub Actions:

1. Merge this PR to the `main` branch
2. The GitHub Actions workflow will automatically trigger
3. Wait for the workflow to complete (you can check progress in the **Actions** tab)

### Step 3: Access Your Deployed Site

After the workflow completes successfully:

1. Go to **Settings** > **Pages**
2. You'll see a message like: "Your site is live at `https://username.github.io/repository-name/`"
3. Click the URL to visit your deployed application

## How It Works

1. When you push to `main`, the workflow triggers automatically
2. The workflow:
   - Checks out the code
   - Sets up Node.js 20
   - Installs dependencies with `npm ci`
   - Builds the application with `npm run build`
   - Uploads the `dist` folder as an artifact
   - Deploys to GitHub Pages

## Manual Deployment

You can also trigger a deployment manually:

1. Go to the **Actions** tab in your repository
2. Select **Deploy to GitHub Pages** from the workflow list
3. Click **Run workflow**
4. Select the `main` branch
5. Click **Run workflow**

## Troubleshooting

### Build Failures
- Check the workflow logs in the **Actions** tab
- Ensure all dependencies are properly listed in `package.json`
- Verify there are no TypeScript compilation errors

### 404 Errors on Routes
- Make sure you're using hash-based URLs (e.g., `/#/auth` instead of `/auth`)
- All links in the application should work automatically since they use React Router's `<Link>` component

### Environment Variables
- If your application requires environment variables (like Supabase keys), you need to add them as repository secrets:
  1. Go to **Settings** > **Secrets and variables** > **Actions**
  2. Click **New repository secret**
  3. Add your secrets (e.g., `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
  4. Update the workflow to use these secrets in the build step if needed

Example for adding environment variables to the workflow (update the Build step in `.github/workflows/deploy.yml`):

    - name: Build
      run: npm run build
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

## Notes

- The hash router means URLs will look like `https://username.github.io/repository-name/#/recipe/123` instead of `https://username.github.io/repository-name/recipe/123`
- This is a trade-off for simplicity - the alternative would require a custom 404.html workaround
- All internal navigation and deep linking will work correctly with hash routing
