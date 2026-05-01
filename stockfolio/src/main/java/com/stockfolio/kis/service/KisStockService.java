package com.stockfolio.kis.service;

import java.math.BigDecimal;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.stockfolio.global.config.KisProperties;
import com.stockfolio.global.exception.ErrorCode;
import com.stockfolio.global.exception.GlobalException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class KisStockService {

    private final KisTokenService kisTokenService;
    private final KisProperties kisProperties;
    private final RedisTemplate<String, String> redisTemplate;
    private final RestClient restClient = RestClient.create();

    public BigDecimal getCurrentPrice(String ticker) {
        // Redis 캐시 확인
        String cached = redisTemplate.opsForValue().get("kis:price:" + ticker);
        if (cached != null) {
            return new BigDecimal(cached);
        }

        // API 호출
        BigDecimal price = fetchCurrentPrice(ticker);

        // Redis 저장 (TTL 10초)
        redisTemplate.opsForValue()
            .set("kis:price:" + ticker, price.toString(), 10, TimeUnit.SECONDS);

        return price;
    }

    private BigDecimal fetchCurrentPrice(String ticker) {

        Map<String, Object> response = restClient.get()
            .uri(kisProperties.getBaseUrl() 
                + "/uapi/domestic-stock/v1/quotations/inquire-price"
                + "?fid_cond_mrkt_div_code=J"
                + "&fid_input_iscd=" + ticker)
            .header("authorization", "Bearer " + kisTokenService.getAccessToken())
            .header("appkey", kisProperties.getAppKey())
            .header("appsecret", kisProperties.getAppSecret())
            .header("tr_id", "FHKST01010100")
            .retrieve()
            .body(new ParameterizedTypeReference<Map<String, Object>>() {});

        Map<String, Object> output = (Map<String, Object>) response.get("output");
        if (output == null) {
            throw new GlobalException(ErrorCode.EXTERNAL_API_ERROR);
        }

        String priceStr = (String) output.get("stck_prpr");
        if (priceStr == null || priceStr.isBlank()) {
            throw new GlobalException(ErrorCode.EXTERNAL_API_ERROR);
        }

        return new BigDecimal(priceStr);
    }

    public BigDecimal getOverseasCurrentPrice(String ticker, String exchange) {
                // Redis 캐시 확인
        String cached = redisTemplate.opsForValue().get("kis:price:overseas:" + exchange + ":" + ticker);
        if (cached != null) {
            return new BigDecimal(cached);
        }

        // API 호출
        BigDecimal price = fetchOverSeasCurrentPrice(ticker, exchange);

        // Redis 저장 (TTL 10초)
        redisTemplate.opsForValue()
            .set("kis:price:overseas:" + exchange + ":" + ticker, price.toString(), 10, TimeUnit.SECONDS);

        return price;
    }

        private BigDecimal fetchOverSeasCurrentPrice(String ticker, String exchange) {

        Map<String, Object> response = restClient.get()
            .uri(kisProperties.getBaseUrl() 
                + "/uapi/overseas-price/v1/quotations/price"
                + "?EXCD=" + exchange
                + "&SYMB=" + ticker)
            .header("authorization", "Bearer " + kisTokenService.getAccessToken())
            .header("appkey", kisProperties.getAppKey())
            .header("appsecret", kisProperties.getAppSecret())
            .header("tr_id", "HHDFS00000300")
            .retrieve()
            .body(new ParameterizedTypeReference<Map<String, Object>>() {});

        Map<String, Object> output = (Map<String, Object>) response.get("output");  // ✅ output 먼저
        if (output == null) throw new GlobalException(ErrorCode.EXTERNAL_API_ERROR);

        String priceStr = (String) output.get("last");
        if (priceStr == null || priceStr.isBlank()) {
            throw new GlobalException(ErrorCode.EXTERNAL_API_ERROR);
        }

        return new BigDecimal(priceStr);
    }
}