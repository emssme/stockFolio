package com.stockfolio.asset.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.stockfolio.asset.dto.AssetRequest;
import com.stockfolio.asset.dto.AssetResponse;
import com.stockfolio.asset.service.AssetService;
import com.stockfolio.global.response.ApiResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
public class AssetController {
    
    private final AssetService assetService;

    @PostMapping
    public ResponseEntity<ApiResponse<AssetResponse>> registerAsset(@RequestBody @Valid AssetRequest req) {
        Long userId = (Long) SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();
        AssetResponse res = assetService.registerAsset(userId, req);
        return ResponseEntity.status(201).body(ApiResponse.success(res));
    }
}
