# Deploying RecipeShare to GitHub Pages

This document explains how to deploy this application to GitHub Pages using GitHub Actions.

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
