package com.stockfolio.asset.service;

import org.springframework.stereotype.Service;

import com.stockfolio.asset.domain.Asset;
import com.stockfolio.asset.dto.AssetRequest;
import com.stockfolio.asset.dto.AssetResponse;
import com.stockfolio.asset.repository.AssetRepository;
import com.stockfolio.global.exception.ErrorCode;
import com.stockfolio.global.exception.GlobalException;
import com.stockfolio.user.domain.User;
import com.stockfolio.user.repository.UserRepository;

import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AssetService {

    private final AssetRepository assetRepository;
    private final UserRepository userRepository;

    public AssetResponse registerAsset(Long userId, AssetRequest req) {
        // 자산 등록
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GlobalException(ErrorCode.USER_NOT_FOUND));
        
        // 중복 등록 확인
        boolean assetExists = assetRepository.existsByUserIdAndAssetTypeAndTickerAndDeletedAtIsNull (
                userId, req.getAssetType(), req.getTicker());

        if (assetExists) {
            throw new GlobalException(ErrorCode.DUPLICATE_ASSET);
        }

        // Asset 엔티티 생성 및 저장
        Asset savedAsset = assetRepository.save(Asset.builder()
                .user(user)
                .assetType(req.getAssetType())
                .ticker(req.getTicker())
                .name(req.getName())
                .currency(req.getCurrency())
                .quantity(req.getQuantity())
                .avgPurchasePrice(req.getAvgPurchasePrice())
                .build());

        // 자산 등록 로직 추가
        return AssetResponse.from(savedAsset);
    }
}
