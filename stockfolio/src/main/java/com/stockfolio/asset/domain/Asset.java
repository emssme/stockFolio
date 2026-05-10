package com.stockfolio.asset.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.stockfolio.user.domain.User;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "assets")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Asset {
    
    // 아이디
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user; 

    // 자산 종류
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssetType assetType;

    // 거래소
    private String exchange;

    // 티커
    @Column(nullable = false)
    private String ticker;

    // 자산명
    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Currency currency;

    private BigDecimal  quantity;

    private BigDecimal  avgPurchasePrice;

    private String brokerage;

    // 생성 일시
    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    // 생성 IP
    private String createdIp;

    // 수정 일시
    @LastModifiedDate
    private LocalDateTime updatedAt;

    // 수정 IP
    private String updatedIp;

    private LocalDateTime deletedAt;

    public void update(BigDecimal quantity, BigDecimal avgPurchasePrice, String brokerage) {
        this.quantity = quantity;
        this.avgPurchasePrice = avgPurchasePrice;
        this.brokerage = brokerage;
    }

    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }
}
