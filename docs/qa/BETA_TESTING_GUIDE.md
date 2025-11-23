# Beta Testing Guide

## Overview

This guide outlines the beta testing process for Deyond Wallet, including TestFlight (iOS) and Google Play Beta (Android) distribution.

## 1. Beta Testing Phases

### Phase 1: Internal Beta (1 week)
- **Participants**: Team members, close stakeholders
- **Goal**: Catch critical bugs, validate core flows
- **Size**: 10-20 testers

### Phase 2: Closed Beta (2 weeks)
- **Participants**: Selected community members
- **Goal**: UX feedback, edge case discovery
- **Size**: 100-500 testers

### Phase 3: Open Beta (1-2 weeks)
- **Participants**: Public sign-up
- **Goal**: Scale testing, final validation
- **Size**: 1000+ testers

## 2. iOS TestFlight Setup

### App Store Connect Configuration

1. Create app in App Store Connect
2. Upload build via Xcode or EAS
3. Fill out test information
4. Add beta testers

### Build Distribution

```bash
# Build for TestFlight using EAS
eas build --platform ios --profile preview

# Submit to TestFlight
eas submit --platform ios

# Or via Xcode
# Product > Archive > Distribute App > TestFlight
```

### Tester Groups

| Group | Description | Limit |
|-------|-------------|-------|
| Internal | App Store Connect users | 100 |
| External | Email invitation | 10,000 |
| Public | TestFlight link | Unlimited |

### TestFlight Configuration

```json
// eas.json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    }
  },
  "submit": {
    "preview": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD1234"
      }
    }
  }
}
```

## 3. Android Beta Setup

### Google Play Console Configuration

1. Create app in Play Console
2. Set up closed/open testing track
3. Upload AAB file
4. Configure testers

### Build Distribution

```bash
# Build for internal testing
eas build --platform android --profile preview

# Submit to Play Store
eas submit --platform android --profile preview
```

### Testing Tracks

| Track | Description | Review |
|-------|-------------|--------|
| Internal | Team only | No |
| Closed | Invite only | Yes |
| Open | Public signup | Yes |

### Play Console Configuration

```json
// eas.json
{
  "submit": {
    "preview": {
      "android": {
        "serviceAccountKeyPath": "./pc-api-key.json",
        "track": "internal"
      }
    }
  }
}
```

## 4. Tester Recruitment

### Recruitment Channels

- Email newsletter
- Social media (Twitter, Discord)
- Community forums
- Landing page signup
- Referral from existing testers

### Ideal Tester Profile

- Crypto wallet experience
- Different device types
- Various geographic locations
- Mix of technical abilities
- Active and responsive

### Tester Agreement

All testers must agree to:
- Keep app confidential during closed beta
- Report bugs through official channels
- Not share screenshots publicly
- Provide constructive feedback
- Use testnet funds only

## 5. Feedback Collection

### In-App Feedback

```typescript
// Feedback component
const BetaFeedback = () => {
  return (
    <FeedbackButton
      onPress={() => {
        // Open feedback form
        Feedback.show({
          type: 'bug' | 'feature' | 'general',
          includeScreenshot: true,
          includeLogs: true,
        });
      }}
    />
  );
};
```

### Feedback Channels

| Channel | Use Case | Response Time |
|---------|----------|---------------|
| In-app | Bug reports, quick feedback | < 24h |
| Discord | Discussions, questions | < 4h |
| Email | Detailed reports | < 48h |
| Survey | Structured feedback | Weekly |

### Bug Report Template

```markdown
## Bug Report

**Device**: iPhone 14 Pro, iOS 17.1
**App Version**: 1.0.0 (build 42)
**Network**: Goerli Testnet

**Steps to Reproduce**:
1. Open wallet
2. Tap "Send"
3. Enter amount > balance
4. Tap "Continue"

**Expected**: Show insufficient balance error
**Actual**: App crashes

**Logs**: [Attached]
**Screenshot**: [Attached]
```

## 6. Beta Metrics

### Key Metrics to Track

| Metric | Target | Critical |
|--------|--------|----------|
| Crash rate | < 1% | > 5% |
| DAU | > 50% of testers | < 20% |
| Session length | > 2 min | < 30s |
| Feature adoption | > 60% | < 30% |
| NPS Score | > 30 | < 0 |

### Analytics Events

```typescript
// Beta-specific events
analytics.track('beta_onboarding_complete');
analytics.track('beta_feedback_submitted', { type: 'bug' });
analytics.track('beta_feature_used', { feature: 'send' });
analytics.track('beta_error_encountered', { error: '...' });
```

## 7. Release Criteria

### Exit Criteria for Each Phase

#### Internal Beta Exit
- [ ] All P0 bugs fixed
- [ ] Core flows working
- [ ] Team sign-off

#### Closed Beta Exit
- [ ] Crash rate < 2%
- [ ] P0/P1 bugs < 5
- [ ] NPS > 20
- [ ] 80% feature coverage tested

#### Open Beta Exit
- [ ] Crash rate < 1%
- [ ] No P0 bugs
- [ ] P1 bugs < 3
- [ ] NPS > 30
- [ ] Performance benchmarks met

## 8. Communication

### Beta Updates

Send weekly updates including:
- New features added
- Bugs fixed
- Known issues
- Upcoming changes
- Call for specific feedback

### Sample Update Email

```
Subject: Deyond Wallet Beta v1.0.0-beta.3

Hi [Name],

Thanks for testing Deyond Wallet! Here's what's new:

✨ New Features:
- WalletConnect v2 support
- Dark mode

🐛 Bug Fixes:
- Fixed crash on send confirmation
- Improved balance loading

🔜 Coming Soon:
- NFT support
- Hardware wallet integration

Please test the WalletConnect feature and let us know
if you encounter any issues connecting to DApps.

Report bugs: [In-app] or beta@deyond.io
Join discussion: discord.gg/deyond-beta

Thanks!
The Deyond Team
```

## 9. Incentives

### Beta Tester Rewards

| Contribution | Reward |
|--------------|--------|
| Join beta | Early access badge |
| Report valid bug | Credits / NFT |
| Report critical bug | Premium feature unlock |
| Complete all test cases | Exclusive NFT |
| Top contributor | Special recognition |

## 10. Timeline

### Sample 4-Week Beta Schedule

| Week | Phase | Activities |
|------|-------|------------|
| 1 | Internal | Core flow testing, critical bugs |
| 2 | Closed | Expanded testing, UX feedback |
| 3 | Closed | Bug fixes, polish |
| 4 | Open | Scale testing, final validation |

### Daily Activities

- Morning: Review crash reports
- Midday: Respond to feedback
- Afternoon: Test fixes
- Evening: Push updates (if needed)

## 11. Tools

| Purpose | Tool |
|---------|------|
| Distribution | TestFlight, Play Console |
| Crash Reporting | Sentry |
| Analytics | Mixpanel |
| Communication | Discord, Email |
| Bug Tracking | Linear |
| Feedback | In-app, TypeForm |

## 12. Checklist

### Pre-Beta Launch
- [ ] Beta build uploaded
- [ ] Test accounts created
- [ ] Documentation ready
- [ ] Support channels set up
- [ ] Analytics configured
- [ ] Crash reporting enabled
- [ ] Testers recruited
- [ ] Incentives defined

### Post-Beta
- [ ] Analyze all feedback
- [ ] Fix critical issues
- [ ] Document learnings
- [ ] Thank testers
- [ ] Distribute rewards
- [ ] Prepare for launch
