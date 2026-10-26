# One - Offline Productivity Workspace (PWA)

An all-in-one installable Progressive Web App (PWA) designed for static deployment to **GitHub Pages** with zero backend or server costs.

## Key Features

- **100% Static & Client-Side**: No backend, no Express server, and no cloud database required.
- **Offline-First Resilience**: Workbox service worker precaches application assets; all tasks, notes, habits, and focus logs persist locally in your browser's Indexed/Local Storage.
- **Zero Secrets or API Keys**: Safe for public GitHub repositories without risk of token leakage.
- **Refresh Resilience on GitHub Pages**: Hash-based routing (`#today`, `#tasks`, `#notes`, `#focus`, `#habits`, `#settings`) combined with `public/404.html` ensures page reloads and deep links never trigger 404 errors on GitHub Pages subpaths.
- **Full PWA Compliance**:
  - Web App Manifest with `192x192`, `512x512`, and `maskable` icons.
  - Apple touch icon and iOS meta tags.
  - In-app install banner with iOS Safari guidance modal.
  - Standalone display mode.

---

## Instructions for Publishing to GitHub Pages

### Step 1: Push Repository to GitHub
```bash
git add .
git commit -m "Configure installable PWA for GitHub Pages deployment"
git push origin main
```

### Step 2: Enable GitHub Pages in Repository Settings
1. Navigate to your repository on GitHub.
2. Click **Settings** (tab at the top).
3. On the left sidebar, click **Pages** (under "Code and automation").
4. Under **Build and deployment > Source**, select **GitHub Actions** from the dropdown.

### Step 3: Automated Deployment
- The workflow in `.github/workflows/deploy.yml` triggers automatically on pushes to `main` (or via the **Actions** tab > **Run workflow**).
- Once the action completes (typically ~45 seconds), your application is live at:
  ```
  https://<your-username>.github.io/<your-repo-name>/
  ```

---

## Key Repository Files to Review

1. **`vite.config.ts`**:
   - `base: './'`: Configures relative paths so all scripts, styles, and assets resolve properly regardless of the repository name or domain subpath.
   - `VitePWA`: Injects service worker, asset precaching, and web app manifest.
2. **`.github/workflows/deploy.yml`**:
   - Automated GitHub Actions workflow using Node 22, `npm ci`, `npm run build`, and `actions/deploy-pages@v4`.
3. **`public/404.html`**:
   - SPA redirect script to preserve routes if direct path URLs are accessed on GitHub Pages.
4. **`public/` Icons**:
   - `icon.svg` & `icon-maskable.svg`
   - `pwa-192x192.png`, `pwa-512x512.png`, `pwa-maskable-512x512.png`
   - `apple-touch-icon.png` (iOS Safari compliant)
   - `favicon.ico`
5. **`src/hooks/usePWAInstall.ts` & `src/components/PWAInstallButton.tsx`**:
   - In-app install trigger supporting Chromium, Android, and iOS Safari.
6. **`src/hooks/useOnlineStatus.ts` & `src/components/OfflineIndicator.tsx`**:
   - Monitors network connectivity and notifies users when running offline with cached data.
7. **`src/utils/workspace.test.ts`**:
   - Automated unit tests covering core logic run with `node --test`.

---

## Local Development & Testing

```bash
# Run local development server
npm run dev

# Run unit tests
node --test src/utils/workspace.test.ts

# Test production static build
npm run build
npm run preview
```
