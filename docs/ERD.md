# StockFolio ERD

작성일: 2026-04-13  
DB: MariaDB 11.0.2

---

## 테이블 개요

| 테이블 | 역할 |
|--------|------|
| users | 회원 계정. 탈퇴 시 개인정보 익명화 + 소프트 삭제 적용 |
| refresh_tokens | JWT Refresh Token 저장. 기기별 로그아웃 지원 |
| assets | 사용자 보유 자산 (국내주식 / 해외주식 / 코인). 소프트 삭제 적용 |
| trade_history | 자산별 매수/매도 이력. 수정·삭제 없는 불변 레코드 |
| portfolio_snapshots | 수익률 차트용 시계열 스냅샷. 스케줄러가 주기적으로 적재 |

---

## 테이블 명세

### users

| 컬럼명 | 타입 | 제약조건 | 비고 |
|--------|------|----------|------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 탈퇴 시 `deleted_{id}@unknown.com`으로 익명화 |
| password | VARCHAR(255) | NOT NULL | bcrypt. 탈퇴 시 `DELETED`로 대체 |
| nickname | VARCHAR(50) | NOT NULL | 탈퇴 시 `탈퇴한 사용자`로 대체 |
| role | ENUM('USER','ADMIN') | NOT NULL, DEFAULT 'USER' | |
| created_at | DATETIME | NOT NULL | UTC |
| created_ip | VARCHAR(45) | NULL | IPv6 대응, 내부 처리 시 NULL |
| updated_at | DATETIME | NOT NULL | UTC |
| updated_ip | VARCHAR(45) | NULL | |
| deleted_at | DATETIME | NULL | NULL = 활성. 탈퇴 시 현재 시각 기록 |

> **탈퇴 처리 정책**: 개인정보보호법 준수를 위해 완전 삭제 대신 익명화 방식 적용.
> email / password / nickname 을 식별 불가 값으로 대체 후 `deleted_at` 기록.
> 연관 테이블(assets, trade_history 등) FK 참조 무결성 유지를 위해 레코드는 보존.
> Refresh Token은 탈퇴 즉시 삭제.
> 익명화 후 30일이 경과한 레코드는 배치 작업으로 완전 삭제.

```
PK(id) / UNIQUE(email) / idx_users_deleted_at(deleted_at)
```

---

### refresh_tokens

| 컬럼명 | 타입 | 제약조건 | 비고 |
|--------|------|----------|------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| user_id | BIGINT | FK → users.id, NOT NULL | CASCADE |
| token | VARCHAR(1000) | NOT NULL | JWT 원문, 클라이언트 반환용 |
| token_hash | CHAR(64) | UNIQUE, NOT NULL | SHA-256, DB 조회·검증용 |
| device_info | VARCHAR(255) | NULL | User-Agent, 기기별 로그아웃용 |
| expires_at | DATETIME | NOT NULL | 발급 후 7일 |
| created_at | DATETIME | NOT NULL | |
| created_ip | VARCHAR(45) | NULL | |
| updated_at | DATETIME | NOT NULL | 토큰 로테이션 시 갱신 |
| updated_ip | VARCHAR(45) | NULL | |

```
PK(id) / UNIQUE(token_hash) / idx_refresh_tokens_user_id(user_id)
```

---

### assets

| 컬럼명 | 타입 | 제약조건 | 비고 |
|--------|------|----------|------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| user_id | BIGINT | FK → users.id, NOT NULL | CASCADE |
| asset_type | ENUM('STOCK_KR','STOCK_US','CRYPTO') | NOT NULL | |
| ticker | VARCHAR(20) | NOT NULL | |
| name | VARCHAR(100) | NOT NULL | |
| currency | ENUM('KRW','USD') | NOT NULL | CHECK로 asset_type과 묶음 |
| quantity | DECIMAL(18,8) | NOT NULL, CHECK > 0 | 전량 매도 시 deleted_at 처리 |
| avg_purchase_price | DECIMAL(18,8) | NOT NULL, CHECK > 0 | trade_history 기반 계산값 |
| active_key | VARCHAR(70) | GENERATED VIRTUAL, UNIQUE | 소프트 삭제 + 유니크 충돌 방지 |
| created_at | DATETIME | NOT NULL | |
| created_ip | VARCHAR(45) | NULL | |
| updated_at | DATETIME | NOT NULL | |
| updated_ip | VARCHAR(45) | NULL | |
| deleted_at | DATETIME | NULL | NULL = 보유중 |

```
PK(id) / UNIQUE(active_key) / idx_assets_user_id(user_id)
idx_assets_type_ticker(asset_type, ticker) / idx_assets_deleted_at(deleted_at)
```

---

### trade_history

| 컬럼명 | 타입 | 제약조건 | 비고 |
|--------|------|----------|------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| asset_id | BIGINT | FK → assets.id, NOT NULL | RESTRICT (이력 보호) |
| user_id | BIGINT | FK → users.id, NOT NULL | RESTRICT, 조회 성능용 역정규화 |
| trade_type | ENUM('BUY','SELL') | NOT NULL | |
| quantity | DECIMAL(18,8) | NOT NULL, CHECK > 0 | |
| price | DECIMAL(18,8) | NOT NULL, CHECK > 0 | 거래 단가 |
| currency | ENUM('KRW','USD') | NOT NULL | assets.currency 일치는 서비스 검증 |
| traded_at | DATETIME | NOT NULL | 실제 매매 일시 |
| created_at | DATETIME | NOT NULL | |
| created_ip | VARCHAR(45) | NULL | |
| updated_at | DATETIME | NOT NULL | |
| updated_ip | VARCHAR(45) | NULL | |

```
PK(id) / idx_trade_asset_id(asset_id) / idx_trade_user_traded_at(user_id, traded_at)
```

---

### portfolio_snapshots

| 컬럼명 | 타입 | 제약조건 | 비고 |
|--------|------|----------|------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| user_id | BIGINT | FK → users.id, NOT NULL | CASCADE |
| base_currency | ENUM('KRW','USD') | NOT NULL, DEFAULT 'KRW' | 집계 기준 통화 |
| total_purchase_amount | DECIMAL(18,4) | NOT NULL | |
| total_value | DECIMAL(18,4) | NOT NULL | |
| total_profit | DECIMAL(18,4) | NOT NULL | |
| total_profit_rate | DECIMAL(12,4) | NOT NULL | 코인 고수익 대응 |
| snapshot_at | DATETIME | NOT NULL | 비즈니스 기준 시각 |
| created_at | DATETIME | NOT NULL | |
| created_ip | VARCHAR(45) | NULL | |
| updated_at | DATETIME | NOT NULL | |
| updated_ip | VARCHAR(45) | NULL | |

```
PK(id) / idx_snapshots_user_snapshot_at(user_id, snapshot_at)
```

---

## Redis 캐시

| Key | TTL | 용도 |
|-----|-----|------|
| `quote:{ticker}` | 10s | 종목 시세. 외부 API 호출 최소화 |
| `refresh:{userId}` | 7d | Refresh Token (DB 대신 Redis 사용 시) |

---

## DDL

```sql
CREATE TABLE user (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    email       VARCHAR(255) NOT NULL,
    password    VARCHAR(255) NOT NULL,
    nickname    VARCHAR(50)  NOT NULL,
    role        ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_ip  VARCHAR(45)  NULL,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_ip  VARCHAR(45)  NULL,
    deleted_at  DATETIME     NULL,  -- NULL = 활성. 탈퇴 시 익명화 후 기록
    PRIMARY KEY (id),
    UNIQUE INDEX uq_users_email (email),
    INDEX idx_users_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE refresh_tokens (
    id          BIGINT        NOT NULL AUTO_INCREMENT,
    user_id     BIGINT        NOT NULL,
    token       VARCHAR(1000) NOT NULL,
    token_hash  CHAR(64)      NOT NULL,  -- SHA-256 hex, 길이 제한으로 원문엔 UNIQUE 불가
    device_info VARCHAR(255)  NULL,
    expires_at  DATETIME      NOT NULL,
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_ip  VARCHAR(45)   NULL,
    updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_ip  VARCHAR(45)   NULL,
    PRIMARY KEY (id),
    UNIQUE INDEX uq_refresh_tokens_hash (token_hash),
    INDEX idx_refresh_tokens_user_id (user_id),
    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE assets (
    id                 BIGINT        NOT NULL AUTO_INCREMENT,
    user_id            BIGINT        NOT NULL,
    asset_type         ENUM('STOCK_KR','STOCK_US','CRYPTO') NOT NULL,
    ticker             VARCHAR(20)   NOT NULL,
    name               VARCHAR(100)  NOT NULL,
    currency           ENUM('KRW','USD') NOT NULL,
    quantity           DECIMAL(18,8) NOT NULL,
    avg_purchase_price DECIMAL(18,8) NOT NULL,
    -- 소프트 삭제 + UNIQUE 충돌 방지: 활성이면 값, 삭제되면 NULL
    -- MySQL UNIQUE INDEX는 NULL 중복을 허용하므로 삭제 후 재등록 가능
    active_key         VARCHAR(70)   GENERATED ALWAYS AS (
                           IF(deleted_at IS NULL, CONCAT(user_id,'_',asset_type,'_',ticker), NULL)
                       ) VIRTUAL,
    created_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_ip         VARCHAR(45)   NULL,
    updated_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_ip         VARCHAR(45)   NULL,
    deleted_at         DATETIME      NULL,
    PRIMARY KEY (id),
    UNIQUE INDEX uq_assets_active_key (active_key),
    INDEX idx_assets_user_id (user_id),
    INDEX idx_assets_type_ticker (asset_type, ticker),
    INDEX idx_assets_deleted_at (deleted_at),
    CONSTRAINT fk_assets_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_assets_quantity
        CHECK (quantity > 0),
    CONSTRAINT chk_assets_price
        CHECK (avg_purchase_price > 0),
    CONSTRAINT chk_assets_currency
        CHECK (
            (asset_type = 'STOCK_KR' AND currency = 'KRW') OR
            (asset_type = 'STOCK_US' AND currency = 'USD') OR
            asset_type = 'CRYPTO'
        )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE trade_history (
    id          BIGINT        NOT NULL AUTO_INCREMENT,
    asset_id    BIGINT        NOT NULL,
    user_id     BIGINT        NOT NULL,  -- 역정규화, assets.user_id와 일치 보장은 서비스에서
    trade_type  ENUM('BUY','SELL') NOT NULL,
    quantity    DECIMAL(18,8) NOT NULL,
    price       DECIMAL(18,8) NOT NULL,
    currency    ENUM('KRW','USD') NOT NULL,
    traded_at   DATETIME      NOT NULL,
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_ip  VARCHAR(45)   NULL,
    updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_ip  VARCHAR(45)   NULL,
    PRIMARY KEY (id),
    INDEX idx_trade_asset_id (asset_id),
    INDEX idx_trade_user_traded_at (user_id, traded_at),
    CONSTRAINT fk_trade_asset
        FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE RESTRICT,  -- CASCADE 금지, 이력 보호
    CONSTRAINT fk_trade_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_trade_quantity CHECK (quantity > 0),
    CONSTRAINT chk_trade_price    CHECK (price > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE portfolio_snapshots (
    id                    BIGINT        NOT NULL AUTO_INCREMENT,
    user_id               BIGINT        NOT NULL,
    base_currency         ENUM('KRW','USD') NOT NULL DEFAULT 'KRW',
    total_purchase_amount DECIMAL(18,4) NOT NULL,
    total_value           DECIMAL(18,4) NOT NULL,
    total_profit          DECIMAL(18,4) NOT NULL,
    total_profit_rate     DECIMAL(12,4) NOT NULL,  -- 코인 수익률 999% 초과 대응
    snapshot_at           DATETIME      NOT NULL,
    created_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_ip            VARCHAR(45)   NULL,
    updated_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_ip            VARCHAR(45)   NULL,
    PRIMARY KEY (id),
    INDEX idx_snapshots_user_snapshot_at (user_id, snapshot_at),
    CONSTRAINT fk_snapshots_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
