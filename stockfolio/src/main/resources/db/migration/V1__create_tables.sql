CREATE TABLE users (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    email       VARCHAR(255) NOT NULL,
    password    VARCHAR(255) NOT NULL,
    nickname    VARCHAR(50)  NOT NULL,
    role        ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_ip  VARCHAR(45)  NULL,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_ip  VARCHAR(45)  NULL,
    deleted_at  DATETIME     NULL,
    PRIMARY KEY (id),
    UNIQUE INDEX uq_users_email (email),
    INDEX idx_users_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE refresh_tokens (
    id          BIGINT        NOT NULL AUTO_INCREMENT,
    user_id     BIGINT        NOT NULL,
    token       VARCHAR(1000) NOT NULL,
    token_hash  CHAR(64)      NOT NULL,
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
    user_id     BIGINT        NOT NULL,
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
        FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE RESTRICT,
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
    total_profit_rate     DECIMAL(12,4) NOT NULL,
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
