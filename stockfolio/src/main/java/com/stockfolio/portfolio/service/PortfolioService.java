package com.stockfolio.portfolio.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.stockfolio.asset.domain.Asset;
import com.stockfolio.asset.repository.AssetRepository;
import com.stockfolio.kis.service.KisStockService;
import com.stockfolio.portfolio.dto.PortfolioAssetResponse;
import com.stockfolio.portfolio.dto.PortfolioResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PortfolioService {
    private final AssetRepository assetRepository;
    private final KisStockService kisStockService;

    public PortfolioResponse getPortfolio(Long userId) {

        // 내 자산 목록 조회
        List<Asset> assets = assetRepository.findAllByUserIdAndDeletedAtIsNull(userId);

        // 각 자산별 현재가 조회 후 PortfolioAssetResponse 변환
        List<PortfolioAssetResponse> assetResponses = assets.stream()
            .map(asset -> {
                BigDecimal currentPrice = getCurrentPrice(asset);
                return PortfolioAssetResponse.of(asset, currentPrice);
            })
            .collect(Collectors.toList());

        // 3. 전체 합산
        return PortfolioResponse.of(assetResponses);
    }

    private BigDecimal getCurrentPrice(Asset asset) {
        return switch (asset.getAssetType()) {
            case STOCK_KR -> kisStockService.getCurrentPrice(asset.getTicker());
            case STOCK_US -> kisStockService.getOverseasCurrentPrice(asset.getTicker(), asset.getExchange());
            case CRYPTO   -> BigDecimal.ZERO;  // 추후 Binance 연동
        };
    }

}
