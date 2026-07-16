# StockFolio

실시간 주식·코인 포트폴리오 트래커

보유 자산을 등록하면 실시간 시세를 WebSocket으로 수신해 수익률을 자동 계산하고, 기간별 수익률 추이를 차트로 확인할 수 있습니다.

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Backend | Java 17, Spring Boot, Spring Security, JPA |
| Frontend | React |
| DB | MariaDB, Redis |
| 실시간 | WebSocket |
| 배포 | GCP |

---

## 주요 기능

- 이메일/비밀번호 회원가입 및 로그인 (JWT, Refresh Token)
- 국내주식 / 해외주식 / 코인 자산 등록·수정·삭제
- WebSocket 기반 실시간 시세 연동 및 수익률 자동 계산
- Redis 캐싱으로 외부 API 호출 최소화 (TTL 10s)
- 기간별 수익률 추이 차트 (일/주/월/분기/연)

---

## 문서

- [요구사항정의서](요구사항정의서.md)
- [ERD](ERD.md)

---

## Git 커밋 규칙

### 커밋 메시지 형식

```
[type] subject

body (선택)
```

### Type

| type | 설명 |
|------|------|
| `[feat]` | 새로운 기능 추가 |
| `[fix]` | 버그 수정 |
| `[refactor]` | 기능 변경 없는 코드 개선 |
| `[style]` | 포맷팅, 세미콜론 누락 등 코드 변경 없는 수정 |
| `[docs]` | 문서 작성 및 수정 |
| `[test]` | 테스트 코드 추가 및 수정 |
| `[chore]` | 빌드 설정, 패키지 업데이트 등 |

### 작성 규칙

- subject는 50자 이내, 마침표 없이
- 영어 또는 한글 모두 허용, 혼용 금지
- 과거형 사용 금지 (`Added` X → `Add` O / `추가했다` X → `추가` O)
- body가 필요한 경우 subject와 한 줄 띄우고 작성

### 예시

```bash
[feat] 포트폴리오 자산 등록 API 구현
[fix] Refresh Token 만료 시 무한 재발급 오류 수정
[refactor] 수익률 계산 로직 서비스 레이어로 분리
[docs] ERD 테이블 명세 업데이트
[chore] MySQL 드라이버 의존성 버전 업
```

### 브랜치 전략

```
main      -- 배포 브랜치
develop   -- 개발 완료 브랜치 (PR 후 머지)
feat/...  -- 로컬 개발 브랜치 (예: feat/jwt-auth, fix/token-refresh)
```

로컬 개발(`feat/...`) → PR → `develop` 머지 → 배포 시 `main` 머지

