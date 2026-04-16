# StockFolio API 명세서

**문서 버전:** 1.0  
**작성일:** 2026-04-15  
**Base URL:** `https://api.stockfolio.com`

---

## 목차

1. [공통 사항](#1-공통-사항)
2. [인증 API](#2-인증-api-auth)
3. [사용자 API](#3-사용자-api-users)
4. [자산 API](#4-자산-api-assets)
5. [거래 이력 API](#5-거래-이력-api-trades)
6. [포트폴리오 집계 API](#6-포트폴리오-집계-api-portfolio)
7. [차트 API](#7-차트-api-chart)
8. [WebSocket API](#8-websocket-api)
9. [에러 코드 정의](#9-에러-코드-정의)

---

## 1. 공통 사항

### 1.1 인증

JWT Bearer Token 방식을 사용합니다.

```
Authorization: Bearer {accessToken}
```

- Access Token 유효기간: **30분**
- Refresh Token 유효기간: **7일**
- 인증이 필요한 API에서 토큰이 없거나 만료된 경우 `401 Unauthorized` 반환

### 1.2 요청/응답 형식

- Content-Type: `application/json`
- 날짜/시간 형식: ISO 8601 (`yyyy-MM-dd'T'HH:mm:ss`)
- 통화 금액: `DECIMAL` 문자열로 반환 (부동소수점 오차 방지)

### 1.3 공통 응답 구조

**성공 응답**
```json
{
  "success": true,
  "data": { ... }
}
```

**실패 응답**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지"
  }
}
```

### 1.4 공통 HTTP 상태 코드

| 상태 코드 | 설명 |
|-----------|------|
| 200 OK | 요청 성공 |
| 201 Created | 리소스 생성 성공 |
| 204 No Content | 삭제 성공 (응답 본문 없음) |
| 400 Bad Request | 요청 파라미터 오류 |
| 401 Unauthorized | 인증 필요 또는 토큰 만료 |
| 403 Forbidden | 접근 권한 없음 (타 사용자 리소스) |
| 404 Not Found | 리소스 없음 |
| 409 Conflict | 리소스 충돌 (중복 데이터) |
| 500 Internal Server Error | 서버 오류 |

---

## 2. 인증 API (Auth)

### 2.1 회원가입

| 항목 | 내용 |
|------|------|
| Method | `POST` |
| URL | `/api/auth/signup` |
| 인증 | 불필요 |

**Request Body**

```json
{
  "email": "user@example.com",
  "password": "Password1!",
  "nickname": "홍길동"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| email | String | Y | 이메일 형식, 최대 255자 |
| password | String | Y | 8자 이상, 영문+숫자+특수문자 포함 |
| nickname | String | Y | 2~50자 |

**Response `201 Created`**

```json
{
  "success": true,
  "data": {
    "userId": 1,
    "email": "user@example.com",
    "nickname": "홍길동",
    "createdAt": "2026-04-15T10:00:00"
  }
}
```

**Error Cases**

| 상태 코드 | 에러 코드 | 설명 |
|-----------|-----------|------|
| 400 | `INVALID_INPUT` | 필드 형식 오류 |
| 409 | `DUPLICATE_EMAIL` | 이미 사용 중인 이메일 |

---

### 2.2 로그인

| 항목 | 내용 |
|------|------|
| Method | `POST` |
| URL | `/api/auth/login` |
| 인증 | 불필요 |

**Request Body**

```json
{
  "email": "user@example.com",
  "password": "Password1!"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| email | String | Y | 가입된 이메일 |
| password | String | Y | 비밀번호 |

**Request Header (선택)**

```
User-Agent: {브라우저/앱 정보}
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR...",
    "tokenType": "Bearer",
    "expiresIn": 1800
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| accessToken | String | JWT Access Token |
| refreshToken | String | JWT Refresh Token |
| tokenType | String | 항상 `"Bearer"` |
| expiresIn | Number | Access Token 유효시간 (초), `1800` = 30분 |

**Error Cases**

| 상태 코드 | 에러 코드 | 설명 |
|-----------|-----------|------|
| 400 | `INVALID_INPUT` | 필드 누락 |
| 401 | `INVALID_CREDENTIALS` | 이메일 또는 비밀번호 불일치 |
| 401 | `ACCOUNT_DELETED` | 탈퇴한 계정 |

---

### 2.3 Access Token 재발급

| 항목 | 내용 |
|------|------|
| Method | `POST` |
| URL | `/api/auth/reissue` |
| 인증 | 불필요 |

**Request Body**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR..."
}
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR...",
    "tokenType": "Bearer",
    "expiresIn": 1800
  }
}
```

> Refresh Token 로테이션 정책 적용: 재발급 시 기존 Refresh Token은 무효화되고 새 Refresh Token이 발급됩니다.

**Error Cases**

| 상태 코드 | 에러 코드 | 설명 |
|-----------|-----------|------|
| 400 | `INVALID_INPUT` | refreshToken 누락 |
| 401 | `INVALID_REFRESH_TOKEN` | 유효하지 않거나 만료된 Refresh Token |
| 401 | `REFRESH_TOKEN_REUSED` | 이미 사용된 Refresh Token (재사용 공격 감지) |

---

### 2.4 로그아웃

| 항목 | 내용 |
|------|------|
| Method | `POST` |
| URL | `/api/auth/logout` |
| 인증 | 필요 |

**Request Body**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR..."
}
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": null
}
```

**Error Cases**

| 상태 코드 | 에러 코드 | 설명 |
|-----------|-----------|------|
| 401 | `UNAUTHORIZED` | 인증 토큰 없음 또는 만료 |

---

## 3. 사용자 API (Users)

### 3.1 내 프로필 조회

| 항목 | 내용 |
|------|------|
| Method | `GET` |
| URL | `/api/users/mypage` |
| 인증 | 필요 |

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "userId": 1,
    "email": "user@example.com",
    "nickname": "홍길동",
    "role": "USER",
    "createdAt": "2026-04-15T10:00:00"
  }
}
```

---

### 3.2 닉네임 수정

| 항목 | 내용 |
|------|------|
| Method | `PATCH` |
| URL | `/api/users/mypage/nickname` |
| 인증 | 필요 |

**Request Body**

```json
{
  "nickname": "새닉네임"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| nickname | String | Y | 2~50자 |

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "userId": 1,
    "nickname": "새닉네임",
    "updatedAt": "2026-04-15T10:30:00"
  }
}
```

**Error Cases**

| 상태 코드 | 에러 코드 | 설명 |
|-----------|-----------|------|
| 400 | `INVALID_INPUT` | 닉네임 형식 오류 |
| 401 | `UNAUTHORIZED` | 인증 필요 |

---

### 3.3 비밀번호 변경

| 항목 | 내용 |
|------|------|
| Method | `PATCH` |
| URL | `/api/users/mypage/password` |
| 인증 | 필요 |

**Request Body**

```json
{
  "currentPassword": "OldPassword1!",
  "newPassword": "NewPassword2@"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| currentPassword | String | Y | 현재 비밀번호 |
| newPassword | String | Y | 새 비밀번호 (8자 이상, 영문+숫자+특수문자) |

**Response `200 OK`**

```json
{
  "success": true,
  "data": null
}
```

**Error Cases**

| 상태 코드 | 에러 코드 | 설명 |
|-----------|-----------|------|
| 400 | `INVALID_INPUT` | 비밀번호 형식 오류 |
| 401 | `WRONG_PASSWORD` | 현재 비밀번호 불일치 |

---

### 3.4 회원 탈퇴

| 항목 | 내용 |
|------|------|
| Method | `DELETE` |
| URL | `/api/users/mypage` |
| 인증 | 필요 |

> 소프트 삭제 처리 (users.deleted_at 설정)

**Request Body**

```json
{
  "password": "Password1!"
}
```

**Response `204 No Content`**

**Error Cases**

| 상태 코드 | 에러 코드 | 설명 |
|-----------|-----------|------|
| 401 | `WRONG_PASSWORD` | 비밀번호 불일치 |

---

## 4. 자산 API (Assets)

### 4.1 자산 목록 조회

| 항목 | 내용 |
|------|------|
| Method | `GET` |
| URL | `/api/assets` |
| 인증 | 필요 |

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| assetType | String | N | 필터: `STOCK_KR` / `STOCK_US` / `CRYPTO` |

**Response `200 OK`**

```json
{
  "success": true,
  "data": [
    {
      "assetId": 1,
      "assetType": "STOCK_KR",
      "ticker": "005930",
      "name": "삼성전자",
      "currency": "KRW",
      "quantity": "10.00000000",
      "avgPurchasePrice": "70000.00000000",
      "currentPrice": "75000.00000000",
      "evaluationAmount": "750000.00000000",
      "purchaseAmount": "700000.00000000",
      "profitAmount": "50000.00000000",
      "profitRate": "7.14",
      "updatedAt": "2026-04-15T10:00:00"
    }
  ]
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| assetId | Number | 자산 ID |
| assetType | String | `STOCK_KR` / `STOCK_US` / `CRYPTO` |
| ticker | String | 종목 코드 |
| name | String | 종목명 |
| currency | String | `KRW` / `USD` |
| quantity | String | 보유 수량 |
| avgPurchasePrice | String | 평균 매입가 |
| currentPrice | String | 현재 시세 (Redis 캐시) |
| evaluationAmount | String | 평가금액 (현재가 × 수량) |
| purchaseAmount | String | 매입금액 (평균매입가 × 수량) |
| profitAmount | String | 수익금액 |
| profitRate | String | 수익률 (%) |

---

### 4.2 자산 등록

| 항목 | 내용 |
|------|------|
| Method | `POST` |
| URL | `/api/assets` |
| 인증 | 필요 |

**Request Body**

```json
{
  "assetType": "STOCK_KR",
  "ticker": "005930",
  "name": "삼성전자",
  "quantity": "10",
  "purchasePrice": "70000",
  "tradedAt": "2026-04-01T09:30:00"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| assetType | String | Y | `STOCK_KR` / `STOCK_US` / `CRYPTO` |
| ticker | String | Y | 종목 코드 (최대 20자) |
| name | String | Y | 종목명 (최대 100자) |
| quantity | String | Y | 매수 수량 (양수) |
| purchasePrice | String | Y | 매수 단가 (양수) |
| tradedAt | String | Y | 매수 일시 (ISO 8601) |

> 동일 종목이 이미 존재하면 평균 매입가에 합산 처리됩니다. (trade_history에 BUY 이력 추가)

**Response `201 Created`**

```json
{
  "success": true,
  "data": {
    "assetId": 1,
    "assetType": "STOCK_KR",
    "ticker": "005930",
    "name": "삼성전자",
    "currency": "KRW",
    "quantity": "10.00000000",
    "avgPurchasePrice": "70000.00000000",
    "createdAt": "2026-04-15T10:00:00"
  }
}
```

**Error Cases**

| 상태 코드 | 에러 코드 | 설명 |
|-----------|-----------|------|
| 400 | `INVALID_INPUT` | 필드 형식 오류 또는 수량/가격 0 이하 |
| 400 | `INVALID_ASSET_TYPE` | 지원하지 않는 자산 유형 |

---

### 4.3 자산 수정

| 항목 | 내용 |
|------|------|
| Method | `PUT` |
| URL | `/api/assets/{assetId}` |
| 인증 | 필요 |

> 자산의 수량/평균매입가를 직접 수정합니다. (거래 이력과 별도로 관리)

**Path Parameters**

| 파라미터 | 설명 |
|----------|------|
| assetId | 자산 ID |

**Request Body**

```json
{
  "quantity": "15",
  "avgPurchasePrice": "68000"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| quantity | String | Y | 수정할 수량 (양수) |
| avgPurchasePrice | String | Y | 수정할 평균 매입가 (양수) |

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "assetId": 1,
    "ticker": "005930",
    "quantity": "15.00000000",
    "avgPurchasePrice": "68000.00000000",
    "updatedAt": "2026-04-15T11:00:00"
  }
}
```

**Error Cases**

| 상태 코드 | 에러 코드 | 설명 |
|-----------|-----------|------|
| 400 | `INVALID_INPUT` | 수량 또는 가격 0 이하 |
| 403 | `FORBIDDEN` | 타 사용자의 자산 |
| 404 | `ASSET_NOT_FOUND` | 존재하지 않는 자산 |

---

### 4.4 자산 삭제

| 항목 | 내용 |
|------|------|
| Method | `DELETE` |
| URL | `/api/assets/{assetId}` |
| 인증 | 필요 |


**Path Parameters**

| 파라미터 | 설명 |
|----------|------|
| assetId | 자산 ID |

**Response `204 No Content`**

**Error Cases**

| 상태 코드 | 에러 코드 | 설명 |
|-----------|-----------|------|
| 403 | `FORBIDDEN` | 타 사용자의 자산 |
| 404 | `ASSET_NOT_FOUND` | 존재하지 않는 자산 |

---

## 5. 거래 이력 API (Trades)

### 5.1 거래 이력 조회

| 항목 | 내용 |
|------|------|
| Method | `GET` |
| URL | `/api/assets/{assetId}/trades` |
| 인증 | 필요 |

**Path Parameters**

| 파라미터 | 설명 |
|----------|------|
| assetId | 자산 ID |

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| page | Number | N | 페이지 번호 (기본값: 0) |
| size | Number | N | 페이지 크기 (기본값: 20, 최대: 100) |

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "content": [
      {
        "tradeId": 1,
        "tradeType": "BUY",
        "quantity": "10.00000000",
        "price": "70000.00000000",
        "currency": "KRW",
        "tradedAt": "2026-04-01T09:30:00",
        "createdAt": "2026-04-15T10:00:00"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 1,
    "totalPages": 1
  }
}
```

**Error Cases**

| 상태 코드 | 에러 코드 | 설명 |
|-----------|-----------|------|
| 403 | `FORBIDDEN` | 타 사용자의 자산 |
| 404 | `ASSET_NOT_FOUND` | 존재하지 않는 자산 |

---

### 5.2 거래 이력 추가 (매수/매도)

| 항목 | 내용 |
|------|------|
| Method | `POST` |
| URL | `/api/assets/{assetId}/trades` |
| 인증 | 필요 |

**Path Parameters**

| 파라미터 | 설명 |
|----------|------|
| assetId | 자산 ID |

**Request Body**

```json
{
  "tradeType": "BUY",
  "quantity": "5",
  "price": "72000",
  "tradedAt": "2026-04-15T10:00:00"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| tradeType | String | Y | `BUY` / `SELL` |
| quantity | String | Y | 거래 수량 (양수) |
| price | String | Y | 거래 단가 (양수) |
| tradedAt | String | Y | 거래 일시 (ISO 8601) |

> `BUY` 시 평균 매입가를 재계산하여 assets 테이블에 반영합니다.  
> `SELL` 시 보유 수량을 차감하며, 전량 매도 시 자산은 소프트 삭제됩니다.

**Response `201 Created`**

```json
{
  "success": true,
  "data": {
    "tradeId": 2,
    "tradeType": "BUY",
    "quantity": "5.00000000",
    "price": "72000.00000000",
    "currency": "KRW",
    "tradedAt": "2026-04-15T10:00:00",
    "updatedAvgPurchasePrice": "70666.66666667",
    "updatedQuantity": "15.00000000"
  }
}
```

**Error Cases**

| 상태 코드 | 에러 코드 | 설명 |
|-----------|-----------|------|
| 400 | `INVALID_INPUT` | 필드 오류 또는 수량 0 이하 |
| 400 | `INSUFFICIENT_QUANTITY` | 매도 수량이 보유 수량 초과 |
| 403 | `FORBIDDEN` | 타 사용자의 자산 |
| 404 | `ASSET_NOT_FOUND` | 존재하지 않는 자산 |

---

## 6. 포트폴리오 집계 API (Portfolio)

### 6.1 포트폴리오 요약 조회

| 항목 | 내용 |
|------|------|
| Method | `GET` |
| URL | `/api/portfolio/summary` |
| 인증 | 필요 |

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| currency | String | N | 집계 통화 `KRW` / `USD` (기본값: `KRW`) |

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "baseCurrency": "KRW",
    "totalPurchaseAmount": "5000000.0000",
    "totalEvaluationAmount": "5500000.0000",
    "totalProfitAmount": "500000.0000",
    "totalProfitRate": "10.00",
    "assetCount": 3,
    "assetBreakdown": [
      {
        "assetType": "STOCK_KR",
        "evaluationAmount": "3000000.0000",
        "weight": "54.55"
      },
      {
        "assetType": "STOCK_US",
        "evaluationAmount": "1500000.0000",
        "weight": "27.27"
      },
      {
        "assetType": "CRYPTO",
        "evaluationAmount": "1000000.0000",
        "weight": "18.18"
      }
    ],
    "calculatedAt": "2026-04-15T10:00:00"
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| baseCurrency | String | 집계 기준 통화 |
| totalPurchaseAmount | String | 총 매입금액 |
| totalEvaluationAmount | String | 총 평가금액 |
| totalProfitAmount | String | 총 수익금액 |
| totalProfitRate | String | 총 수익률 (%) |
| assetCount | Number | 보유 자산 종목 수 |
| assetBreakdown | Array | 자산 유형별 비중 |
| weight | String | 비중 (%) |

---

## 7. 차트 API (Chart)

### 7.1 수익률 이력 차트 조회

| 항목 | 내용 |
|------|------|
| Method | `GET` |
| URL | `/api/chart/history` |
| 인증 | 필요 |

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| period | String | Y | `1D` / `1W` / `1M` / `3M` / `1Y` |
| currency | String | N | `KRW` / `USD` (기본값: `KRW`) |

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "period": "1M",
    "baseCurrency": "KRW",
    "snapshots": [
      {
        "snapshotAt": "2026-03-15T00:00:00",
        "totalPurchaseAmount": "4800000.0000",
        "totalValue": "4900000.0000",
        "totalProfit": "100000.0000",
        "totalProfitRate": "2.08"
      },
      {
        "snapshotAt": "2026-04-15T00:00:00",
        "totalPurchaseAmount": "5000000.0000",
        "totalValue": "5500000.0000",
        "totalProfit": "500000.0000",
        "totalProfitRate": "10.00"
      }
    ]
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| period | String | 조회 기간 |
| baseCurrency | String | 집계 기준 통화 |
| snapshots | Array | 스냅샷 목록 (시간 오름차순) |
| snapshotAt | String | 스냅샷 시각 |
| totalPurchaseAmount | String | 시점 기준 총 매입금액 |
| totalValue | String | 시점 기준 총 평가금액 |
| totalProfit | String | 시점 기준 총 수익금액 |
| totalProfitRate | String | 시점 기준 수익률 (%) |

**Error Cases**

| 상태 코드 | 에러 코드 | 설명 |
|-----------|-----------|------|
| 400 | `INVALID_PERIOD` | 지원하지 않는 기간 값 |

---

## 8. WebSocket API

### 8.1 실시간 시세 연결

| 항목 | 내용 |
|------|------|
| Protocol | WebSocket |
| URL | `wss://api.stockfolio.com/ws/quote` |
| 인증 | 연결 시 쿼리 파라미터로 토큰 전달 |

**연결 URL**
```
wss://api.stockfolio.com/ws/quote?token={accessToken}
```

---

#### 클라이언트 → 서버: 구독 요청

종목 시세 구독을 요청합니다.

```json
{
  "type": "SUBSCRIBE",
  "tickers": ["005930", "AAPL", "BTC"]
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| type | String | `SUBSCRIBE` / `UNSUBSCRIBE` |
| tickers | Array | 구독할 종목 코드 목록 |

---

#### 클라이언트 → 서버: 구독 해제

```json
{
  "type": "UNSUBSCRIBE",
  "tickers": ["005930"]
}
```

---

#### 서버 → 클라이언트: 시세 업데이트

구독 중인 종목의 시세가 변경되면 서버가 전송합니다. (최대 5초 간격)

```json
{
  "type": "QUOTE_UPDATE",
  "data": {
    "ticker": "005930",
    "currentPrice": "75500",
    "currency": "KRW",
    "changeAmount": "500",
    "changeRate": "0.67",
    "marketStatus": "OPEN",
    "updatedAt": "2026-04-15T10:00:05"
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| ticker | String | 종목 코드 |
| currentPrice | String | 현재 시세 |
| currency | String | 통화 |
| changeAmount | String | 전일 대비 변동금액 |
| changeRate | String | 전일 대비 변동률 (%) |
| marketStatus | String | `OPEN` / `CLOSED` |
| updatedAt | String | 시세 업데이트 시각 |

---

#### 서버 → 클라이언트: 에러 메시지

```json
{
  "type": "ERROR",
  "code": "INVALID_TICKER",
  "message": "존재하지 않는 종목 코드입니다."
}
```

---

#### WebSocket 연결 흐름

```
Client                        Server
  |                              |
  |-- 연결 요청 (?token=...) --> |
  |<-- 연결 수락 --------------- |
  |                              |
  |-- SUBSCRIBE (tickers) -----> |
  |<-- QUOTE_UPDATE (반복) ----- |
  |                              |
  |-- UNSUBSCRIBE -------------- |
  |                              |
  |-- 연결 끊김 ----------------> |
  | (클라이언트 자동 재연결 시도) |
```

> 연결이 끊겼을 때 클라이언트는 지수 백오프(1s → 2s → 4s → 최대 30s)로 자동 재연결을 시도합니다.

---

## 9. 에러 코드 정의

| 에러 코드 | 설명 | HTTP 상태 |
|-----------|------|-----------|
| `INVALID_INPUT` | 요청 필드 형식 오류 또는 필수값 누락 | 400 |
| `INVALID_PERIOD` | 지원하지 않는 차트 기간 | 400 |
| `INVALID_ASSET_TYPE` | 지원하지 않는 자산 유형 | 400 |
| `INSUFFICIENT_QUANTITY` | 매도 수량이 보유 수량 초과 | 400 |
| `UNAUTHORIZED` | 인증 토큰 없음 | 401 |
| `INVALID_CREDENTIALS` | 이메일 또는 비밀번호 불일치 | 401 |
| `ACCOUNT_DELETED` | 탈퇴한 계정으로 로그인 시도 | 401 |
| `WRONG_PASSWORD` | 현재 비밀번호 불일치 | 401 |
| `INVALID_REFRESH_TOKEN` | 유효하지 않거나 만료된 Refresh Token | 401 |
| `REFRESH_TOKEN_REUSED` | 이미 사용된 Refresh Token (재사용 공격) | 401 |
| `EXPIRED_ACCESS_TOKEN` | 만료된 Access Token | 401 |
| `FORBIDDEN` | 타 사용자 리소스 접근 시도 | 403 |
| `ASSET_NOT_FOUND` | 존재하지 않는 자산 | 404 |
| `USER_NOT_FOUND` | 존재하지 않는 사용자 | 404 |
| `DUPLICATE_EMAIL` | 이미 사용 중인 이메일 | 409 |
| `INTERNAL_SERVER_ERROR` | 서버 내부 오류 | 500 |
| `EXTERNAL_API_ERROR` | 외부 시세 API 호출 실패 | 500 |
| `INVALID_TICKER` | 존재하지 않는 종목 코드 (WebSocket) | — |
