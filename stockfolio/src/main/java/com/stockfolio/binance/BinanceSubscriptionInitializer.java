package com.stockfolio.binance;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import com.stockfolio.asset.domain.AssetType;
import com.stockfolio.asset.repository.AssetRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class BinanceSubscriptionInitializer {

    private final AssetRepository assetRepository;
    private final BinanceWebSocketService binanceWebSocketService;

    @EventListener(ApplicationReadyEvent.class)
    public void initializeSubscriptions() {
        // Binance WebSocket 구독 초기화 로직
        assetRepository.findAllByAssetTypeAndDeletedAtIsNull(AssetType.CRYPTO)
            .forEach(asset -> {
                String ticker = asset.getTicker();
                binanceWebSocketService.subscribe(ticker);
            }
        );
    }
}
