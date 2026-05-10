package com.stockfolio.asset.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.stockfolio.asset.domain.Asset;
import com.stockfolio.asset.domain.AssetType;
import com.stockfolio.asset.dto.AssetRequest;
import com.stockfolio.asset.dto.AssetResponse;
import com.stockfolio.asset.dto.AssetUpdateRequest;
import com.stockfolio.asset.repository.AssetRepository;
import com.stockfolio.binance.BinanceWebSocketService;
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
    private final BinanceWebSocketService binanceWebSocketService;

    public AssetResponse registerAsset(Long userId, AssetRequest req) {
        // 자산 등록
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GlobalException(ErrorCode.USER_NOT_FOUND));
        
        // STOCK_US는 거래소 필수
        if (req.getAssetType() == AssetType.STOCK_US && 
            (req.getExchange() == null || req.getExchange().isBlank())) {
            throw new GlobalException(ErrorCode.INVALID_INPUT);
        }

        String ticker = req.getTicker();  // 기본값
        if (req.getAssetType() == AssetType.CRYPTO) {
            ticker = req.getTicker().toUpperCase() + "USDT";
            binanceWebSocketService.subscribe(ticker);  
        }


        // 중복 등록 확인
        boolean assetExists = assetRepository.existsByUserIdAndAssetTypeAndTickerAndDeletedAtIsNull (
                userId, req.getAssetType(),ticker);

        if (assetExists) {
            throw new GlobalException(ErrorCode.DUPLICATE_ASSET);
        }

        // Asset 엔티티 생성 및 저장
        Asset savedAsset = assetRepository.save(Asset.builder()
                .user(user)
                .assetType(req.getAssetType())
                .ticker(ticker)
                .name(req.getName())
                .currency(req.getCurrency())
                .quantity(req.getQuantity())
                .avgPurchasePrice(req.getAvgPurchasePrice())
                .exchange(req.getExchange())
                .brokerage(req.getBrokerage())
                .build());

        // 자산 등록 로직 추가
        return AssetResponse.from(savedAsset);
    }

    public List<AssetResponse> getAssetList(Long userId) {
        // 자산 조회(목록)
        return assetRepository.findAllByUserIdAndDeletedAtIsNull(userId)
                .stream()
                .map(AssetResponse::from)
                .collect(Collectors.toList());
    }

    public AssetResponse getAsset(Long userId, Long id) {
        // 자산 조회(단건)
        Asset asset = assetRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new GlobalException(ErrorCode.ASSET_NOT_FOUND));

        // 사용자 권한 확인
        if (!asset.getUser().getId().equals(userId)) {
            throw new GlobalException(ErrorCode.FORBIDDEN);
        }

        return AssetResponse.from(asset);
    }

    public AssetResponse updateAsset(Long userId, Long id, AssetUpdateRequest req) {
        // 자산 수정
        Asset asset = assetRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new GlobalException(ErrorCode.ASSET_NOT_FOUND));

        // 사용자 권한 확인
        if (!asset.getUser().getId().equals(userId)) {
            throw new GlobalException(ErrorCode.FORBIDDEN);
        }
        
        // 수정된 값으로 엔티티 업데이트
        asset.update(req.getQuantity(), req.getAvgPurchasePrice(), req.getBrokerage());

        return AssetResponse.from(asset);
    }

    public void deleteAsset(Long userId, Long id) {
        // 자산 삭제
        Asset asset = assetRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new GlobalException(ErrorCode.ASSET_NOT_FOUND));

        // 사용자 권한 확인
        if (!asset.getUser().getId().equals(userId)) {
            throw new GlobalException(ErrorCode.FORBIDDEN);
        }

        asset.delete();
    }
}