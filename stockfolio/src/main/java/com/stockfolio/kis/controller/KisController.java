package com.stockfolio.kis.controller;

import java.math.BigDecimal;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.stockfolio.global.response.ApiResponse;
import com.stockfolio.kis.service.KisStockService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/kis")
@RequiredArgsConstructor
public class KisController {

    private final KisStockService kisStockService;

    @GetMapping("/price/{ticker}")
    public ResponseEntity<ApiResponse<BigDecimal>> getCurrentPrice(@PathVariable String ticker) {
        BigDecimal price = kisStockService.getCurrentPrice(ticker);
        return ResponseEntity.ok(ApiResponse.success(price));
    }

}
