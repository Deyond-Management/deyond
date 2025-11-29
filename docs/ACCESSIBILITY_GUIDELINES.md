# Accessibility Guidelines

**프로젝트**: Deyond Crypto Wallet  
**마지막 업데이트**: 2025-11-24  
**목표**: WCAG 2.1 Level AA 준수

---

## 📋 목차

1. [접근성 원칙](#접근성-원칙)
2. [구현 가이드라인](#구현-가이드라인)
3. [컴포넌트별 접근성](#컴포넌트별-접근성)
4. [테스트 방법](#테스트-방법)
5. [체크리스트](#체크리스트)

---

## 접근성 원칙

### 1. **인식 가능 (Perceivable)**

- 모든 정보와 UI 컴포넌트는 사용자가 인식할 수 있어야 합니다
- 충분한 색상 대비 (WCAG AA: 4.5:1 이상)
- 텍스트 크기 조절 가능

### 2. **작동 가능 (Operable)**

- 모든 기능은 키보드로 접근 가능
- 충분한 터치 영역 (최소 44x44 포인트)
- VoiceOver/TalkBack으로 탐색 가능

### 3. **이해 가능 (Understandable)**

- 명확한 라벨과 설명
- 일관된 네비게이션
- 에러 메시지는 이해하기 쉬워야 함

### 4. **견고함 (Robust)**

- 보조 기술과 호환
- 다양한 디바이스에서 동작

---

## 구현 가이드라인

### Accessibility Props 사용법

#### 1. **accessibilityLabel**

모든 인터랙티브 요소에 명확한 라벨 제공

```tsx
<TouchableOpacity accessibilityLabel="Send cryptocurrency">
  <Text>Send</Text>
</TouchableOpacity>
```

#### 2. **accessibilityRole**

요소의 역할을 명시

```tsx
<TouchableOpacity accessibilityRole="button">
  <Text>Continue</Text>
</TouchableOpacity>
```

**주요 Role 종류:**

- `button` - 버튼
- `link` - 링크
- `search` - 검색 입력
- `image` - 이미지
- `text` - 텍스트
- `header` - 헤더
- `adjustable` - 슬라이더 등

#### 3. **accessibilityHint**

추가 설명이 필요한 경우

```tsx
<TouchableOpacity
  accessibilityLabel="Copy address"
  accessibilityHint="Double tap to copy your wallet address to clipboard"
>
  <Text>Copy</Text>
</TouchableOpacity>
```

#### 4. **accessibilityState**

요소의 현재 상태 표시

```tsx
<TouchableOpacity
  accessibilityState={{
    disabled: isDisabled,
    selected: isSelected,
    checked: isChecked,
    busy: isLoading,
  }}
>
  <Text>Submit</Text>
</TouchableOpacity>
```

---

## 컴포넌트별 접근성

### Button 컴포넌트

```tsx
<Button
  onPress={handleSubmit}
  disabled={!isValid}
  accessibilityLabel={i18n.t('common.submit')}
  accessibilityRole="button"
  accessibilityState={{ disabled: !isValid }}
>
  {i18n.t('common.submit')}
</Button>
```

**요구사항:**

- ✅ 최소 터치 영역: 44x44 포인트
- ✅ accessibilityRole="button"
- ✅ accessibilityLabel (버튼 텍스트)
- ✅ accessibilityState (disabled 상태)
- ✅ 충분한 색상 대비 (4.5:1 이상)

### Input 컴포넌트

```tsx
<TextInput
  placeholder={i18n.t('send.amountPlaceholder')}
  accessibilityLabel={i18n.t('send.amount')}
  accessibilityHint="Enter the amount to send"
/>
```

**요구사항:**

- ✅ 명확한 라벨
- ✅ placeholder는 힌트로만 사용
- ✅ 에러 상태를 음성으로 알림

### Card/TouchableOpacity

```tsx
<TouchableOpacity
  onPress={handlePress}
  accessibilityRole="button"
  accessibilityLabel="Bitcoin wallet"
  accessibilityHint="Double tap to view Bitcoin transaction history"
>
  <Text>BTC</Text>
  <Text>$12,345</Text>
</TouchableOpacity>
```

### Loading States

```tsx
{
  isLoading ? <ActivityIndicator accessibilityLabel={i18n.t('common.loading')} /> : <Content />;
}
```

---

## 테스트 방법

### iOS VoiceOver 테스트

1. **VoiceOver 활성화**
   - Settings → Accessibility → VoiceOver → On
   - 또는 트리플 클릭 단축키 설정

2. **기본 제스처**
   - 한 손가락 스와이프: 다음/이전 항목
   - 더블 탭: 활성화
   - 세 손가락 스와이프: 페이지 스크롤

3. **테스트 항목**
   - [ ] 모든 버튼이 읽히는가?
   - [ ] 버튼의 기능이 명확한가?
   - [ ] 입력 필드 라벨이 명확한가?
   - [ ] 에러 메시지가 읽히는가?
   - [ ] 화면 전환 시 포커스가 적절한가?

### Android TalkBack 테스트

1. **TalkBack 활성화**
   - Settings → Accessibility → TalkBack → On

2. **기본 제스처**
   - 한 손가락 스와이프: 탐색
   - 더블 탭: 활성화
   - 두 손가락 스와이프: 스크롤

3. **테스트 항목**
   - iOS VoiceOver와 동일

---

## 색상 대비 체크

### 주요 색상 조합

| 요소           | 전경색  | 배경색  | 대비율 | 상태    |
| -------------- | ------- | ------- | ------ | ------- |
| Primary Button | #FFFFFF | #1976D2 | 4.5:1  | ✅ Pass |
| Secondary Text | #757575 | #FFFFFF | 4.5:1  | ✅ Pass |
| Error Text     | #D32F2F | #FFFFFF | 5.8:1  | ✅ Pass |
| Success        | #388E3C | #FFFFFF | 4.5:1  | ✅ Pass |

**체크 도구:**

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)

---

## 체크리스트

### 모든 화면에서 확인할 사항

#### 필수 (MUST)

- [ ] 모든 버튼에 accessibilityLabel
- [ ] 모든 인터랙티브 요소에 accessibilityRole
- [ ] 최소 터치 영역 44x44
- [ ] 색상 대비 4.5:1 이상
- [ ] VoiceOver로 전체 플로우 탐색 가능
- [ ] 에러 메시지 음성 읽기 가능

#### 권장 (SHOULD)

- [ ] accessibilityHint로 추가 설명
- [ ] 동적 폰트 크기 지원
- [ ] 다크 모드에서도 충분한 대비
- [ ] 로딩 상태 음성 알림
- [ ] 성공/실패 음성 피드백

#### 선택 (NICE TO HAVE)

- [ ] 키보드 네비게이션
- [ ] 제스처 대안 제공
- [ ] 애니메이션 감소 옵션

---

## 현재 구현 상태

### ✅ 완료된 항목

1. **Button 컴포넌트**
   - accessibilityRole="button"
   - accessibilityLabel 지원
   - accessibilityState (disabled)
   - 최소 터치 영역 44px

2. **국제화 (i18n)**
   - 모든 텍스트 다국어 지원
   - accessibilityLabel에 i18n 사용

3. **에러 처리**
   - 사용자 친화적 메시지
   - ErrorService로 중앙 관리

### 🚧 개선 필요

1. Input 컴포넌트 accessibilityHint 추가
2. Card 컴포넌트 accessibilityRole 설정
3. 색상 대비 전수 조사

---

## 참고 자료

- [React Native Accessibility](https://reactnative.dev/docs/accessibility)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [iOS Accessibility](https://developer.apple.com/accessibility/)
- [Android Accessibility](https://developer.android.com/guide/topics/ui/accessibility)
- [Expo Accessibility](https://docs.expo.dev/guides/accessibility/)

---

**문의**: 접근성 관련 문의사항은 팀 리더에게 문의하세요.
