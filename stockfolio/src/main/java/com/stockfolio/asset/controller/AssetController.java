package com.stockfolio.asset.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.stockfolio.asset.dto.AssetRequest;
import com.stockfolio.asset.dto.AssetResponse;
import com.stockfolio.asset.dto.AssetUpdateRequest;
import com.stockfolio.asset.service.AssetService;
import com.stockfolio.global.response.ApiResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
public class AssetController {
    
    private final AssetService assetService;

    // 자산 등록
    @PostMapping
    public ResponseEntity<ApiResponse<AssetResponse>> registerAsset(@RequestBody @Valid AssetRequest req) {
        Long userId = (Long) SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();
        AssetResponse res = assetService.registerAsset(userId, req);
        return ResponseEntity.status(201).body(ApiResponse.success(res));
    }

    // 자산(목록) 조회
    @GetMapping
    public ResponseEntity<ApiResponse<List<AssetResponse>>> getAssetList() {
        Long userId = (Long) SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();
                    
        List<AssetResponse> res = assetService.getAssetList(userId);
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    // 자산(단건) 조회
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AssetResponse>> getAsset(@PathVariable Long id) {
        Long userId = (Long) SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();
        AssetResponse res = assetService.getAsset(userId, id);
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    // 자산 수정
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AssetResponse>> updateAsset(
            @PathVariable Long id, 
            @RequestBody @Valid AssetUpdateRequest req) {
        Long userId = (Long) SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();
        AssetResponse res = assetService.updateAsset(userId, id, req);
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    // 자산 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAsset(@PathVariable Long id) {
        Long userId = (Long) SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();
        assetService.deleteAsset(userId, id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
