package com.stockfolio.asset.dto;

import java.math.BigDecimal;

import com.stockfolio.asset.domain.Asset;
import com.stockfolio.asset.domain.AssetType;
import com.stockfolio.asset.domain.Currency;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetResponse {
    
    private Long id;
    private AssetType assetType;
    private String ticker;
    private String name;
    private Currency currency;
    private BigDecimal quantity;
    private BigDecimal avgPurchasePrice;
    private String brokerage;

    public static AssetResponse from(Asset asset) {
        return AssetResponse.builder()
                .id(asset.getId())
                .assetType(asset.getAssetType())
                .ticker(asset.getTicker())
                .name(asset.getName())
                .currency(asset.getCurrency())
                .quantity(asset.getQuantity())
                .avgPurchasePrice(asset.getAvgPurchasePrice())
                .brokerage(asset.getBrokerage())
                .build();
    }
}
