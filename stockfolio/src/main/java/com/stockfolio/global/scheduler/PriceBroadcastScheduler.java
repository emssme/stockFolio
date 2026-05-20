package com.stockfolio.global.scheduler;

import java.util.Set;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.stockfolio.asset.repository.AssetRepository;
import com.stockfolio.kis.service.KisStockService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class PriceBroadcastScheduler {

    private final SimpMessagingTemplate messagingTemplate;
    private final RedisTemplate<String, String> redisTemplate;
    private final AssetRepository assetRepository;
    private final KisStockService kisStockService;

    
    @Scheduled(fixedDelay = 3000)
    public void broadcastPrices() {
        // Redis에서 "kis:price:*", "binance:price:*" 키 목록 조회
        Set<String> kisKeys = redisTemplate.keys("kis:price:*");
        Set<String> binanceKeys = redisTemplate.keys("binance:price:*");


        if (kisKeys != null) {
            for (String key : kisKeys) {
                String price = redisTemplate.opsForValue().get(key);

                if (price == null) continue;

                // 키에서 티커 정보 추출 (예: "kis:price:005930" -> "005930")
                String ticker = key.substring(key.lastIndexOf(":") + 1);
                messagingTemplate.convertAndSend("/topic/price/" + ticker, price);
            }
        }

        if (binanceKeys != null) {
            for (String key : binanceKeys) {
                String price = redisTemplate.opsForValue().get(key);

                if (price == null) continue;

                // 키에서 티커 정보 추출 (예: "binance:price:BTCUSDT" -> "BTCUSDT")
                String ticker = key.substring(key.lastIndexOf(":") + 1);
                messagingTemplate.convertAndSend("/topic/price/" + ticker, price);
            }
        }
    }

    @Scheduled(fixedDelay = 12000)
    public void refreshKisPrices() {
        assetRepository.findAllByDeletedAtIsNull().forEach(asset -> {
            try {
                switch (asset.getAssetType()) {
                    case STOCK_KR -> kisStockService.getCurrentPrice(asset.getTicker());
                    case STOCK_US -> kisStockService.getOverseasCurrentPrice(
                        asset.getTicker(), asset.getExchange());
                    default -> {}
                }
                Thread.sleep(300); // KIS API 초당 요청 제한 방지
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } catch (Exception e) {
                log.warn("KIS 가격 갱신 실패: {} - {}", asset.getTicker(), e.getMessage());
            }
        });
    }
}
