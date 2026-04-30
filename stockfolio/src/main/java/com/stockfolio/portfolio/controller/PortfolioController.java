package com.stockfolio.portfolio.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.stockfolio.global.response.ApiResponse;
import com.stockfolio.portfolio.dto.PortfolioResponse;
import com.stockfolio.portfolio.service.PortfolioService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/portfolio")
@RequiredArgsConstructor
public class PortfolioController {
    
    private final PortfolioService portfolioService;

    @GetMapping
    public ResponseEntity<ApiResponse<PortfolioResponse>> getPortfolio() {
        Long userId = (Long) SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();
        PortfolioResponse portfolio = portfolioService.getPortfolio(userId);
        return ResponseEntity.ok(ApiResponse.success(portfolio));
    }

}
