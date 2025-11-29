# Build and Clean Guide

프로젝트 빌드 및 정리를 위한 가이드입니다.

## 📦 프로젝트 크기 관리

### 일반적인 크기

- **정상 상태**: ~5-6GB (node_modules 포함)
- **빌드 후**: ~13GB (빌드 아티팩트 포함)

### 주요 용량 차지 항목

```
node_modules:    ~4.9GB  (필수)
ios/build:       ~5GB    (빌드 시)
android/build:   ~2GB    (빌드 시)
coverage:        ~5MB    (테스트 후)
.expo:           ~1-2MB  (캐시)
```

## 🧹 Clean 스크립트

### 기본 정리 명령어

```bash
# 모든 빌드 아티팩트 정리 (권장)
npm run clean

# iOS 빌드만 정리
npm run clean:ios

# Android 빌드만 정리
npm run clean:android

# 캐시만 정리 (coverage, .expo, dist)
npm run clean:cache

# node_modules 제거
npm run clean:modules

# 전체 정리 (node_modules 포함)
npm run clean:all

# Metro bundler 캐시 정리
npm run reset

# 완전히 새로 시작 (정리 + 재설치)
npm run reinstall
```

### 상황별 사용 가이드

#### 1. 일반적인 빌드 아티팩트 정리

```bash
npm run clean
```

**제거 항목**:

- ios/build, ios/Pods, ios/DerivedData
- android/build, android/app/build, android/.gradle
- coverage, .expo, dist, node_modules/.cache

**용량 절감**: ~7-8GB

#### 2. 빌드 오류 발생 시

```bash
npm run clean
npm run reset
npm start
```

#### 3. 의존성 문제 발생 시

```bash
npm run reinstall
```

**주의**: 재설치 시간이 5-10분 소요됩니다.

#### 4. Metro bundler 오류 시

```bash
npm run reset
npm start
```

#### 5. 완전히 새로 시작

```bash
npm run clean:all
rm -rf .expo .metro-health-check*
npm install --legacy-peer-deps
```

## 🏗️ 빌드 스크립트

### 개발 빌드

#### iOS

```bash
# Expo Go에서 실행
npm run ios

# 개발 빌드 생성 (EAS)
eas build --profile development --platform ios
```

#### Android

```bash
# Expo Go에서 실행
npm run android

# 개발 빌드 생성 (EAS)
eas build --profile development --platform android
```

### 프로덕션 빌드

#### iOS

```bash
# 프로덕션 빌드
eas build --profile production --platform ios

# 앱스토어 제출
eas submit --platform ios --profile production
```

#### Android

```bash
# 프로덕션 빌드
eas build --profile production --platform android

# Play Store 제출
eas submit --platform android --profile production
```

## 📋 빌드 전 체크리스트

### 로컬 빌드 전

- [ ] `npm run clean` 실행
- [ ] 최신 의존성 확인 (`npm outdated`)
- [ ] 테스트 통과 확인 (`npm test`)
- [ ] 린트 통과 확인 (`npm run lint`)
- [ ] TypeScript 검사 (`npm run type-check`)

### EAS 빌드 전

- [ ] `eas build:configure` 실행 (초기 1회)
- [ ] app.json 버전 업데이트
- [ ] 환경 변수 설정 확인
- [ ] 빌드 프로필 확인 (eas.json)
- [ ] 크레덴셜 설정 (`eas credentials`)

## 🔧 문제 해결

### 1. "Metro bundler stopped" 오류

```bash
npm run reset
npm start
```

### 2. iOS Pod install 실패

```bash
npm run clean:ios
cd ios && pod install && cd ..
npm run ios
```

### 3. Android Gradle 오류

```bash
npm run clean:android
cd android && ./gradlew clean && cd ..
npm run android
```

### 4. "No space left on device"

```bash
npm run clean:all
```

### 5. "Cannot find module" 오류

```bash
npm run reinstall
```

### 6. Watchman 오류

```bash
watchman watch-del-all
npm run reset
```

## 📊 빌드 크기 최적화

### Android APK/AAB 크기 줄이기

1. **ProGuard 활성화** (android/app/build.gradle):

```gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

2. **앱 번들 사용** (AAB):

```bash
eas build --profile production --platform android
```

AAB는 APK보다 ~15-30% 작습니다.

### iOS IPA 크기 줄이기

1. **Bitcode 비활성화** (이미 기본값)
2. **On-Demand Resources 사용**
3. **Asset Catalog 최적화**

## 🚀 CI/CD에서의 빌드

### GitHub Actions 예시

```yaml
- name: Clean build artifacts
  run: npm run clean

- name: Install dependencies
  run: npm install --legacy-peer-deps

- name: Run tests
  run: npm test

- name: Build
  run: eas build --non-interactive --platform all
```

## 📦 의존성 관리

### 의존성 업데이트

```bash
# 업데이트 가능한 패키지 확인
npm outdated

# 특정 패키지 업데이트
npm update <package-name>

# 모든 패키지 업데이트 (주의!)
npm update

# Expo SDK 업데이트
expo upgrade
```

### 의존성 정리

```bash
# 사용하지 않는 패키지 제거
npm prune

# package-lock.json 재생성
rm package-lock.json
npm install --legacy-peer-deps
```

## 🎯 Best Practices

1. **정기적인 정리**: 주 1회 `npm run clean` 실행
2. **빌드 전 정리**: 항상 빌드 전에 정리
3. **Git 커밋 전**: 빌드 아티팩트가 포함되지 않았는지 확인
4. **디스크 공간**: 최소 20GB 여유 공간 유지
5. **node_modules**: 가능하면 프로젝트별로 유지 (global 설치 최소화)

## ⚠️ 주의사항

1. **ios/android 폴더 삭제 금지**: 프로젝트 설정이 포함되어 있습니다. 빌드 폴더만 정리하세요.
2. **node_modules 정리**: 재설치 시간이 오래 걸리므로 꼭 필요할 때만 실행
3. **Detox 테스트**: E2E 테스트 실행 시 별도 빌드 필요
4. **.env 파일**: 정리 시 .env 파일이 삭제되지 않도록 주의

## 📱 플랫폼별 특이사항

### iOS

- **Xcode 캐시**: `~/Library/Developer/Xcode/DerivedData` 수동 정리 필요
- **Pods**: `ios/Pods` 폴더가 크므로 정기적인 정리 필요
- **Simulator**: `xcrun simctl delete unavailable` 로 불필요한 시뮬레이터 제거

### Android

- **Gradle 캐시**: `~/.gradle/caches` 수동 정리 가능
- **.gradle 폴더**: 프로젝트 로컬 캐시 (정리 안전)
- **Emulator**: AVD 이미지가 크므로 불필요한 것 제거

## 🔍 디스크 사용량 확인

```bash
# 프로젝트 전체 크기
du -sh .

# 폴더별 크기 (상위 10개)
du -sh * .* 2>/dev/null | sort -hr | head -10

# node_modules 크기
du -sh node_modules

# iOS 빌드 크기
du -sh ios/build ios/Pods

# Android 빌드 크기
du -sh android/build android/app/build android/.gradle
```

## 📚 추가 리소스

- [Expo Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Build Configuration](https://docs.expo.dev/build/eas-json/)
- [React Native Performance](https://reactnative.dev/docs/performance)
- [Android App Bundle](https://developer.android.com/guide/app-bundle)

---

**마지막 업데이트**: 2024-11-29
**프로젝트 버전**: 1.0.0
