# Device Testing Matrix

## iOS Devices

### Primary Test Devices (Required)
| Device | iOS Version | Priority | Notes |
|--------|------------|----------|-------|
| iPhone 15 Pro | iOS 17.x | P0 | Latest flagship |
| iPhone 14 | iOS 17.x | P0 | Previous gen |
| iPhone 13 | iOS 16.x | P1 | Popular model |
| iPhone SE (3rd gen) | iOS 17.x | P1 | Small screen |
| iPhone 12 mini | iOS 16.x | P2 | Smallest screen |
| iPad Pro 12.9" | iOS 17.x | P2 | Tablet support |

### Secondary Test Devices (Recommended)
| Device | iOS Version | Priority | Notes |
|--------|------------|----------|-------|
| iPhone 11 | iOS 15.x | P2 | Older hardware |
| iPhone XR | iOS 15.x | P3 | Budget model |
| iPad Air | iOS 16.x | P3 | Mid-range tablet |

### Minimum Supported
- iOS 14.0+
- iPhone 6s and newer

## Android Devices

### Primary Test Devices (Required)
| Device | Android Version | Priority | Notes |
|--------|----------------|----------|-------|
| Google Pixel 8 | Android 14 | P0 | Stock Android |
| Samsung Galaxy S24 | Android 14 | P0 | Most popular OEM |
| OnePlus 12 | Android 14 | P1 | Popular alternative |
| Google Pixel 7a | Android 14 | P1 | Mid-range Pixel |
| Samsung Galaxy A54 | Android 13 | P1 | Mid-range Samsung |
| Samsung Galaxy Tab S9 | Android 13 | P2 | Tablet support |

### Secondary Test Devices (Recommended)
| Device | Android Version | Priority | Notes |
|--------|----------------|----------|-------|
| Google Pixel 6 | Android 13 | P2 | Older Pixel |
| Samsung Galaxy S22 | Android 13 | P2 | Previous flagship |
| Xiaomi 14 | Android 14 | P3 | China market |
| Samsung Galaxy A34 | Android 13 | P3 | Budget segment |

### Minimum Supported
- Android 8.0 (API 26)+
- 2GB RAM minimum
- ARM64 architecture

## Screen Size Categories

### Mobile
| Category | Size Range | Example Devices |
|----------|-----------|-----------------|
| Small | < 5.5" | iPhone SE, Pixel 4a |
| Medium | 5.5" - 6.2" | iPhone 14, Pixel 8 |
| Large | 6.2" - 6.7" | iPhone 15 Pro Max, Galaxy S24+ |
| X-Large | > 6.7" | Galaxy Ultra series |

### Tablet
| Category | Size Range | Example Devices |
|----------|-----------|-----------------|
| Small | 7" - 8" | iPad mini |
| Medium | 10" - 11" | iPad Air, Galaxy Tab S7 |
| Large | 12"+ | iPad Pro 12.9", Galaxy Tab S9+ |

## Test Configurations

### Display Modes
- [ ] Light mode
- [ ] Dark mode
- [ ] System default
- [ ] High contrast
- [ ] Reduced motion

### Accessibility
- [ ] VoiceOver (iOS)
- [ ] TalkBack (Android)
- [ ] Dynamic text size
- [ ] Bold text
- [ ] Color filters

### Regional Settings
- [ ] English (US)
- [ ] English (UK)
- [ ] Korean
- [ ] Japanese
- [ ] Chinese (Simplified)
- [ ] Spanish
- [ ] RTL languages (Arabic)

## Network Conditions

### Connection Types
| Type | Down | Up | Latency | Use Case |
|------|------|-----|---------|----------|
| WiFi (Fast) | 50 Mbps | 20 Mbps | 10ms | Home/Office |
| WiFi (Slow) | 5 Mbps | 1 Mbps | 50ms | Public WiFi |
| 5G | 100 Mbps | 50 Mbps | 10ms | Urban mobile |
| 4G/LTE | 20 Mbps | 5 Mbps | 50ms | Standard mobile |
| 3G | 1 Mbps | 500 Kbps | 200ms | Poor coverage |
| Edge | 240 Kbps | 100 Kbps | 500ms | Very poor |
| Offline | 0 | 0 | ∞ | No connection |

### Network Scenarios
- [ ] Strong connection → Weak → Strong
- [ ] Connection drop mid-transaction
- [ ] VPN connected
- [ ] Proxy settings
- [ ] IPv6 only

## Hardware Features

### Biometrics
- [ ] Face ID (iPhone X+)
- [ ] Touch ID (iPhone SE, older)
- [ ] Fingerprint (Android various)
- [ ] Face Unlock (Android)

### Other Features
- [ ] NFC support
- [ ] Camera (QR scanning)
- [ ] Clipboard access
- [ ] Push notifications
- [ ] Background refresh

## Cloud Testing Services

### Recommended Platforms
| Service | Use Case | Coverage |
|---------|----------|----------|
| BrowserStack | Real devices | 3000+ devices |
| AWS Device Farm | CI integration | 200+ devices |
| Firebase Test Lab | Android focus | Virtual & physical |
| Sauce Labs | Enterprise | Full coverage |

### CI/CD Integration
```yaml
# Example: BrowserStack integration
- name: Run E2E Tests
  run: |
    npx detox test -c ios.sim.release
    npx detox test -c android.emu.release
  env:
    BROWSERSTACK_USERNAME: ${{ secrets.BS_USERNAME }}
    BROWSERSTACK_ACCESS_KEY: ${{ secrets.BS_KEY }}
```

## Testing Priorities

### P0 - Must Test Every Release
1. iPhone latest (current iOS)
2. iPhone previous gen (previous iOS)
3. Google Pixel latest
4. Samsung Galaxy S latest
5. One mid-range Android

### P1 - Test for Major Releases
- All P0 devices
- Plus 3-4 additional from each platform

### P2 - Test Quarterly
- Edge devices (small screens, old models)
- Tablets
- Less common OEMs

## Sign-off Requirements

### Before Release
- [ ] All P0 devices tested
- [ ] No critical issues on any device
- [ ] Performance benchmarks met
- [ ] Accessibility checks passed

### Documentation
- Test results for each device
- Screenshots of key screens
- Performance metrics
- Known device-specific issues
