package com.stockfolio.kis.service;

import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;

import org.springframework.web.client.RestClient;

import com.stockfolio.global.config.KisProperties;

import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class KisTokenService {
    
    private final RestClient restClient = RestClient.create();
    private final KisProperties kisProperties;
    private final RedisTemplate<String, String> redisTemplate;

    public String getAccessToken() {

        String token = redisTemplate.opsForValue().get("kis:token");

        if (token != null) {
            // Redis에 토큰이 존재하면 반환
            return token;
        }

        token = issueAccessToken();
        redisTemplate.opsForValue()
            .set("kis:token", token, 23, TimeUnit.HOURS);
        
        return token;

    }

    private String issueAccessToken() {

        // 요청 바디 Map으로 구성
        Map<String, String> body = Map.of(
            "grant_type", "client_credentials",
            "appkey", kisProperties.getAppKey(),
            "appsecret", kisProperties.getAppSecret()
        );

        // RestClient로 POST 요청
        Map<String, Object> response = restClient.post()
            .uri(kisProperties.getBaseUrl() + "/oauth2/tokenP")
            .contentType(MediaType.APPLICATION_JSON)
            .body(body)
            .retrieve()
            .body(Map.class);

        // 응답에서 access_token 추출
        String token = (String) response.get("access_token");

        return token;
    }
}