package com.stockfolio.binance;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.WebSocketClient;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BinanceWebSocketService  {
    
    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    // 중복 구독 방지용 Set
    private final Set<String> subscribedSymbols = ConcurrentHashMap.newKeySet();

    public void subscribe(String symbol) {
        // 이미 구독 중이면 종료
        if(subscribedSymbols.contains(symbol)) {
            return;
        }

        // subscribedSymbols에 추가
        subscribedSymbols.add(symbol);
        
        // WebSocket 연결 및 메시지 처리
        WebSocketClient client = new StandardWebSocketClient();
        String url = "wss://stream.binance.com:9443/ws/" + symbol.toLowerCase() + "@miniTicker";

        client.execute(new TextWebSocketHandler() {
            @Override
            protected void handleTextMessage(WebSocketSession session,  TextMessage message) throws Exception {

                // JSON 파싱
                Map<String, Object> data = objectMapper.readValue(
                    message.getPayload(),
                    new TypeReference<Map<String, Object>>() {}
                );

                String price = (String) data.get("c");
                String open  = (String) data.get("o");

                if (price != null) {
                    redisTemplate.opsForValue()
                        .set("binance:price:" + symbol, price, 60, TimeUnit.SECONDS);
                }

                if (price != null && open != null) {
                    BigDecimal c = new BigDecimal(price);
                    BigDecimal o = new BigDecimal(open);
                    if (o.compareTo(BigDecimal.ZERO) != 0) {
                        BigDecimal changeRate = c.subtract(o)
                            .divide(o, 4, java.math.RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100));
                        redisTemplate.opsForValue()
                            .set("binance:change:" + symbol, changeRate.toString(), 60, TimeUnit.SECONDS);
                    }
                }
            }
        }, url);
        
    }

    public BigDecimal getPrice(String symbol) {
        String price = redisTemplate.opsForValue().get("binance:price:" + symbol);
        if (price == null) {
            return BigDecimal.ZERO;
        }
        return new BigDecimal(price);
    }

    public BigDecimal getPriceChangeRate(String symbol) {
        String changeRate = redisTemplate.opsForValue().get("binance:change:" + symbol);
        if (changeRate == null) {
            return BigDecimal.ZERO;
        }
        return new BigDecimal(changeRate);
    }

}
