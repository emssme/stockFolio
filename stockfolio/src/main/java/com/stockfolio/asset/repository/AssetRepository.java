package com.stockfolio.asset.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.stockfolio.asset.domain.Asset;
import com.stockfolio.asset.domain.AssetType;

public interface AssetRepository extends JpaRepository<Asset, Long> {
    
    // 자산 조회(목록)
    List<Asset> findAllByUserIdAndDeletedAtIsNull(Long userId);
    
    // 자산 조회(단건)
    Optional<Asset> findByIdAndDeletedAtIsNull(Long id);

    // 중복등록방지
    boolean existsByUserIdAndAssetTypeAndTickerAndDeletedAtIsNull(Long userId, AssetType assetType, String ticker);

     List<Asset> findAllByAssetTypeAndDeletedAtIsNull(AssetType assetType);
}
