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

                // 현재가 추출
                String price = (String) data.get("c");

                // Redis 저장
                if (price != null) {
                    redisTemplate.opsForValue()
                        .set("binance:price:" + symbol, price, 60, TimeUnit.SECONDS);
                }
            }
        }, url);
        
    }

    public BigDecimal getPrice(String symbol) {
        String price = redisTemplate.opsForValue().get("binance:price:" + symbol);
        if (price == null) {
            return BigDecimal.ZERO;  // 아직 수신 전
        }
        return new BigDecimal(price);
    }

}
