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

    // 국내주식 현재가 (캐시 없으면 API 호출 → 현재가+등락률 동시 캐싱)
    public BigDecimal getCurrentPrice(String ticker) {
        String cached = redisTemplate.opsForValue().get("kis:price:" + ticker);
        if (cached != null) return new BigDecimal(cached);
        fetchAndCacheDomestic(ticker);
        return new BigDecimal(redisTemplate.opsForValue().get("kis:price:" + ticker));
    }

    // 국내주식 등락률 (현재가와 같은 API → 캐시 공유)
    public BigDecimal getDomesticPriceChangeRate(String ticker) {
        String cached = redisTemplate.opsForValue().get("kis:change:" + ticker);
        if (cached != null) return new BigDecimal(cached);
        fetchAndCacheDomestic(ticker);
        return new BigDecimal(redisTemplate.opsForValue().get("kis:change:" + ticker));
    }

    // 단일 API 호출로 현재가 + 등락률 동시 캐싱
    private void fetchAndCacheDomestic(String ticker) {
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
        if (output == null) throw new GlobalException(ErrorCode.EXTERNAL_API_ERROR);

        String price = (String) output.get("stck_prpr");
        String changeRate = (String) output.get("prdy_ctrt");
        if (price == null || price.isBlank() || changeRate == null || changeRate.isBlank()) {
            throw new GlobalException(ErrorCode.EXTERNAL_API_ERROR);
        }

        redisTemplate.opsForValue().set("kis:price:" + ticker, price, 10, TimeUnit.SECONDS);
        redisTemplate.opsForValue().set("kis:change:" + ticker, changeRate, 10, TimeUnit.SECONDS);
        sleepToRespectKisRateLimit();
    }

    // 해외주식 현재가 (캐시 없으면 API 호출 → 현재가+등락률 동시 캐싱)
    public BigDecimal getOverseasCurrentPrice(String ticker, String exchange) {
        String cached = redisTemplate.opsForValue().get("kis:price:overseas:" + exchange + ":" + ticker);
        if (cached != null) return new BigDecimal(cached);
        fetchAndCacheOverseas(ticker, exchange);
        return new BigDecimal(redisTemplate.opsForValue().get("kis:price:overseas:" + exchange + ":" + ticker));
    }

    // 해외주식 등락률 (현재가와 같은 API → 캐시 공유)
    public BigDecimal getOverseasPriceChangeRate(String ticker, String exchange) {
        String cached = redisTemplate.opsForValue().get("kis:change:overseas:" + exchange + ":" + ticker);
        if (cached != null) return new BigDecimal(cached);
        fetchAndCacheOverseas(ticker, exchange);
        return new BigDecimal(redisTemplate.opsForValue().get("kis:change:overseas:" + exchange + ":" + ticker));
    }

    // 단일 API 호출로 현재가 + 등락률 동시 캐싱
    private void fetchAndCacheOverseas(String ticker, String exchange) {
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

        Map<String, Object> output = (Map<String, Object>) response.get("output");
        if (output == null) throw new GlobalException(ErrorCode.EXTERNAL_API_ERROR);

        String price = (String) output.get("last");
        String changeRate = (String) output.get("rate");
        if (price == null || price.isBlank() || changeRate == null || changeRate.isBlank()) {
            throw new GlobalException(ErrorCode.EXTERNAL_API_ERROR);
        }

        redisTemplate.opsForValue().set("kis:price:overseas:" + exchange + ":" + ticker, price, 10, TimeUnit.SECONDS);
        redisTemplate.opsForValue().set("kis:change:overseas:" + exchange + ":" + ticker, changeRate, 10, TimeUnit.SECONDS);
        sleepToRespectKisRateLimit();
    }

    // KIS API 초당 요청 제한 방지 (스케줄러와 동일한 방식)
    private void sleepToRespectKisRateLimit() {
        try {
            Thread.sleep(300);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
