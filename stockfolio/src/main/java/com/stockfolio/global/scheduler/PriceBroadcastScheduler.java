package com.stockfolio.global.scheduler;

import java.util.Set;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@EnableScheduling
@RequiredArgsConstructor
public class PriceBroadcastScheduler {

    private final SimpMessagingTemplate messagingTemplate;
    private final RedisTemplate<String, String> redisTemplate;
    
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
}
