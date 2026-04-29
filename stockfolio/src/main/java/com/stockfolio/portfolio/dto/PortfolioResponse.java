package com.stockfolio.portfolio.dto;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioResponse {
    private BigDecimal totalPurchaseAmount;
    private BigDecimal totalCurrentValue;
    private BigDecimal totalProfit;
    private BigDecimal totalProfitRate;
    private List<PortfolioAssetResponse> assets;

    public static PortfolioResponse of(List<PortfolioAssetResponse> assets) {
        BigDecimal totalPurchaseAmount = assets.stream()
                .map(PortfolioAssetResponse::getPurchaseAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCurrentValue = assets.stream()
                .map(PortfolioAssetResponse::getCurrentValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalProfit = assets.stream()
                .map(PortfolioAssetResponse::getProfit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalProfitRate = totalPurchaseAmount.compareTo(BigDecimal.ZERO) != 0 ? totalProfit
                .divide(totalPurchaseAmount, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100)) : BigDecimal.ZERO;

        return PortfolioResponse.builder()
                .totalPurchaseAmount(totalPurchaseAmount)
                .totalCurrentValue(totalCurrentValue)
                .totalProfit(totalProfit)
                .totalProfitRate(totalProfitRate)
                .assets(assets)
                .build();
    }
}
