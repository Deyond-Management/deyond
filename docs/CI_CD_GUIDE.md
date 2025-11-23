# CI/CD Guide

## 📋 Overview

This project uses GitHub Actions for continuous integration and deployment. The CI/CD pipeline is optimized to **save EAS build quota** by running free tests on every PR while conditionally triggering builds only when needed.

## 🚀 Workflow Behavior

### Always Run (FREE, Unlimited)

These checks run on **every** push and pull request:

```yaml
✅ Code Quality Checks
- TypeScript type check
- ESLint
- Prettier

✅ Unit Tests
- 1341 tests with coverage
- Coverage uploaded to Codecov

✅ Security Audit
- npm audit for vulnerabilities
```

**Cost**: $0 (uses GitHub Actions free tier: 2,000 minutes/month)

### Conditional Build (USES EAS BUILD QUOTA)

EAS builds are triggered **only** in these cases:

1. **Push to `main` branch**

   ```bash
   git push origin main
   # → Triggers: Tests + EAS Build (Android + iOS)
   ```

2. **Version tags**

   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   # → Triggers: Tests + EAS Build (Android + iOS)
   ```

3. **Manual trigger** (recommended)
   - Go to GitHub → Actions tab → CI workflow
   - Click "Run workflow"
   - Choose platform (Android, iOS, or both)
   - Click "Run workflow" button

**Cost**: Uses EAS build quota (30 builds/month on free tier)

## 📱 Usage Examples

### Scenario 1: Normal Development (FREE)

```bash
# Create a feature branch
git checkout -b feat/new-feature

# Make changes and push
git push origin feat/new-feature

# Create PR
# → Only tests run (FREE)
# → No build triggered
```

**Result**: ✅ Tests pass, no build quota used

### Scenario 2: Merge to Main (USES QUOTA)

```bash
# Merge PR to main
git checkout main
git merge feat/new-feature
git push origin main

# → Tests + EAS Build triggered
# → Uses 1-2 builds from quota
```

**Result**: ✅ Tests pass, app built, 2 builds used

### Scenario 3: Manual Build (USES QUOTA)

**When to use**: Testing a PR with actual app build before merging

1. Go to https://github.com/[your-repo]/actions
2. Click "CI" workflow
3. Click "Run workflow" dropdown
4. Select options:
   - **Run EAS Build**: ✅ Yes
   - **Platform**: Android (saves iOS quota)
5. Click "Run workflow"

**Result**: ✅ Tests pass, Android app built, 1 build used

### Scenario 4: Release (USES QUOTA)

```bash
# Create and push a version tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# → Tests + Full build (Android + iOS)
# → Uses 2 builds from quota
```

**Result**: ✅ Production builds created

## 🎯 Build Quota Management

### Free Tier: 30 builds/month

**Recommended allocation:**

```
Weekly release to main:    8 builds/month  (4 weeks × 2 platforms)
Manual testing:            10 builds/month (occasional PR testing)
Emergency fixes:            5 builds/month (hotfixes)
Buffer:                     7 builds/month (safety margin)
────────────────────────────────────────────────────
Total:                     30 builds/month ✅
```

### Check Your Usage

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Check build history
eas build:list --limit 30

# Or visit
https://expo.dev/accounts/[your-account]/settings/billing
```

## 🔧 Configuration

### Required Secrets

Add these to GitHub repository settings (Settings → Secrets and variables → Actions):

```yaml
EXPO_TOKEN:
  Description: Expo authentication token
  How to get: Run `eas login` then `eas whoami --json`

CODECOV_TOKEN: (optional)
  Description: Code coverage upload token
  How to get: https://codecov.io
```

### EAS Build Profiles

The workflow uses the `preview` profile. To customize:

```json
// eas.json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "simulator": false
      }
    }
  }
}
```

## 📊 Workflow Status

### Check CI Status

- **GitHub PR**: Status checks appear automatically
- **Actions Tab**: See detailed logs and artifacts
- **Summary**: Each workflow run includes a summary table

### Example Summary

```
| Check          | Status  |
|----------------|---------|
| Code Quality   | ✅ Pass |
| Tests          | ✅ Pass |
| Security       | ✅ Pass |
| Build Triggered| false   |
```

## 🚨 Troubleshooting

### Build Not Triggered

**Problem**: Expected build but didn't run

**Check**:

1. Is this the `main` branch?
2. Did you push a version tag?
3. Did you enable "Run EAS Build" in manual trigger?

### Build Quota Exceeded

**Problem**: "Build quota exceeded" error

**Solutions**:

1. **Wait**: Quota resets monthly
2. **Upgrade**: EAS Production plan ($29/month, unlimited builds)
3. **Local build**: `eas build --local` (free but slower)
4. **Priority**: Only build on `main` and tags

### Tests Failing

**Problem**: Tests fail but work locally

**Common causes**:

- Missing environment variables
- Different Node.js version
- Missing `--legacy-peer-deps` flag

**Fix**:

```bash
# Test locally with same config
npm ci --legacy-peer-deps
npm test -- --ci --maxWorkers=2
```

## 📝 Best Practices

### 1. Save Build Quota

```bash
# ✅ Good: Test changes locally first
npm run type-check
npm test
npm run lint

# ✅ Good: Use manual trigger for specific testing
# → GitHub Actions → Run workflow → Select platform

# ❌ Bad: Push to main frequently
# → Each push uses 2 builds

# ❌ Bad: Create many version tags
# → Each tag uses 2 builds
```

### 2. PR Workflow

```bash
# 1. Create feature branch
git checkout -b feat/new-feature

# 2. Develop and test locally
npm test

# 3. Push and create PR
git push origin feat/new-feature
# → Only tests run (FREE)

# 4. If app testing needed, use manual trigger
# → Actions → Run workflow → Android only

# 5. Merge to main when ready
# → Automatic build triggered
```

### 3. Release Process

```bash
# 1. All tests pass on main
# 2. Create version tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# 3. Builds trigger automatically
# 4. Download artifacts from Actions tab
# 5. Test builds before store submission
```

## 🔗 Related Documentation

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Expo Updates (OTA)](https://docs.expo.dev/eas-update/introduction/)

## 💡 Tips

- **Use Expo Updates for hotfixes**: Deploy JS-only changes without rebuilding

  ```bash
  eas update --branch production
  # FREE, instant deployment
  ```

- **Test on simulators first**: iOS simulator builds are faster than device builds

- **Combine PRs**: Merge multiple features before building to save quota

- **Monitor quota**: Check remaining builds before month end
  ```bash
  eas build:list --limit 30 | wc -l
  ```
