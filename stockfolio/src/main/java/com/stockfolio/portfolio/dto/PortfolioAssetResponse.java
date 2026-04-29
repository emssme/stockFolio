package com.stockfolio.portfolio.dto;

import java.math.BigDecimal;
import java.math.RoundingMode;

import com.stockfolio.asset.domain.Asset;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioAssetResponse {
    
    private Long assetId;
    private String name;
    private String ticker;
    private String assetType;
    private BigDecimal quantity;
    private BigDecimal avgPurchasePrice;
    private BigDecimal currentPrice;
    private BigDecimal purchaseAmount;
    private BigDecimal currentValue;
    private BigDecimal profit;
    private BigDecimal profitRate;

    public static PortfolioAssetResponse of(Asset asset, BigDecimal currentPrice) {
        BigDecimal purchaseAmount = asset.getQuantity().multiply(asset.getAvgPurchasePrice());
        BigDecimal currentValue = currentPrice.multiply(asset.getQuantity());
        BigDecimal profit = currentValue.subtract(purchaseAmount);
        BigDecimal profitRate = profit
            .divide(purchaseAmount, 4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100));

        return PortfolioAssetResponse.builder()
                .assetId(asset.getId())
                .name(asset.getName())
                .ticker(asset.getTicker())
                .assetType(asset.getAssetType().name())
                .quantity(asset.getQuantity())
                .avgPurchasePrice(asset.getAvgPurchasePrice())
                .currentPrice(currentPrice)
                .purchaseAmount(purchaseAmount)
                .currentValue(currentValue)
                .profit(profit)
                .profitRate(profitRate)
                .build();
    }
}
