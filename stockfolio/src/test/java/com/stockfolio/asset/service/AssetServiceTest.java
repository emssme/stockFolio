package com.stockfolio.asset.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.stockfolio.asset.domain.Asset;
import com.stockfolio.asset.domain.AssetType;
import com.stockfolio.asset.domain.Currency;
import com.stockfolio.asset.dto.AssetRequest;
import com.stockfolio.asset.dto.AssetResponse;
import com.stockfolio.asset.dto.AssetUpdateRequest;
import com.stockfolio.asset.repository.AssetRepository;
import com.stockfolio.binance.BinanceWebSocketService;
import com.stockfolio.global.exception.ErrorCode;
import com.stockfolio.global.exception.GlobalException;
import com.stockfolio.user.domain.User;
import com.stockfolio.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class AssetServiceTest {

    @Mock
    private AssetRepository assetRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private BinanceWebSocketService binanceWebSocketService;

    @InjectMocks
    private AssetService assetService;

    private User owner;
    private Asset asset;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .id(1L)
                .email("owner@stockfolio.com")
                .password("encoded-password")
                .nickname("owner")
                .build();
        asset = Asset.builder()
                .id(100L)
                .user(owner)
                .assetType(AssetType.STOCK_KR)
                .ticker("005930")
                .name("삼성전자")
                .currency(Currency.KRW)
                .quantity(BigDecimal.TEN)
                .avgPurchasePrice(BigDecimal.valueOf(70000))
                .build();
    }

    @Test
    @DisplayName("소유자 본인은 자산을 정상적으로 단건 조회할 수 있다")
    void getAsset_owner_success() {
        given(assetRepository.findByIdAndDeletedAtIsNull(asset.getId())).willReturn(Optional.of(asset));

        AssetResponse res = assetService.getAsset(owner.getId(), asset.getId());

        assertThat(res.getId()).isEqualTo(asset.getId());
        assertThat(res.getTicker()).isEqualTo(asset.getTicker());
    }

    @Test
    @DisplayName("다른 사용자의 자산을 단건 조회하면 FORBIDDEN 예외를 던진다")
    void getAsset_notOwner_throwsForbidden() {
        Long attackerId = 2L;
        given(assetRepository.findByIdAndDeletedAtIsNull(asset.getId())).willReturn(Optional.of(asset));

        assertThatThrownBy(() -> assetService.getAsset(attackerId, asset.getId()))
                .isInstanceOf(GlobalException.class)
                .extracting(ex -> ((GlobalException) ex).getErrorCode())
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    @DisplayName("다른 사용자의 자산을 수정하려 하면 FORBIDDEN 예외를 던지고 값은 변경되지 않는다")
    void updateAsset_notOwner_throwsForbiddenAndLeavesAssetUnchanged() {
        Long attackerId = 2L;
        BigDecimal originalQuantity = asset.getQuantity();
        given(assetRepository.findByIdAndDeletedAtIsNull(asset.getId())).willReturn(Optional.of(asset));
        AssetUpdateRequest req = new AssetUpdateRequest(BigDecimal.valueOf(999), BigDecimal.ONE, "다른증권사");

        assertThatThrownBy(() -> assetService.updateAsset(attackerId, asset.getId(), req))
                .isInstanceOf(GlobalException.class)
                .extracting(ex -> ((GlobalException) ex).getErrorCode())
                .isEqualTo(ErrorCode.FORBIDDEN);

        assertThat(asset.getQuantity()).isEqualByComparingTo(originalQuantity);
    }

    @Test
    @DisplayName("다른 사용자의 자산을 삭제하려 하면 FORBIDDEN 예외를 던지고 삭제되지 않는다")
    void deleteAsset_notOwner_throwsForbiddenAndDoesNotDelete() {
        Long attackerId = 2L;
        given(assetRepository.findByIdAndDeletedAtIsNull(asset.getId())).willReturn(Optional.of(asset));

        assertThatThrownBy(() -> assetService.deleteAsset(attackerId, asset.getId()))
                .isInstanceOf(GlobalException.class)
                .extracting(ex -> ((GlobalException) ex).getErrorCode())
                .isEqualTo(ErrorCode.FORBIDDEN);

        assertThat(asset.getDeletedAt()).isNull();
    }

    @Test
    @DisplayName("이미 등록된 종목을 다시 등록하면 DUPLICATE_ASSET 예외를 던진다")
    void registerAsset_duplicate_throwsException() {
        AssetRequest req = AssetRequest.builder()
                .assetType(AssetType.STOCK_KR)
                .ticker("005930")
                .name("삼성전자")
                .currency(Currency.KRW)
                .quantity(BigDecimal.TEN)
                .avgPurchasePrice(BigDecimal.valueOf(70000))
                .build();
        given(userRepository.findById(owner.getId())).willReturn(Optional.of(owner));
        given(assetRepository.existsByUserIdAndAssetTypeAndTickerAndDeletedAtIsNull(
                owner.getId(), req.getAssetType(), req.getTicker())).willReturn(true);

        assertThatThrownBy(() -> assetService.registerAsset(owner.getId(), req))
                .isInstanceOf(GlobalException.class)
                .extracting(ex -> ((GlobalException) ex).getErrorCode())
                .isEqualTo(ErrorCode.DUPLICATE_ASSET);

        verify(assetRepository, never()).save(any());
    }

    @Test
    @DisplayName("코인 자산을 등록하면 티커를 USDT 페어로 정규화하고 Binance 시세를 구독한다")
    void registerAsset_crypto_normalizesTickerAndSubscribesBinance() {
        AssetRequest req = AssetRequest.builder()
                .assetType(AssetType.CRYPTO)
                .ticker("btc")
                .name("비트코인")
                .currency(Currency.USD)
                .quantity(BigDecimal.ONE)
                .avgPurchasePrice(BigDecimal.valueOf(50000))
                .build();
        given(userRepository.findById(owner.getId())).willReturn(Optional.of(owner));
        given(assetRepository.existsByUserIdAndAssetTypeAndTickerAndDeletedAtIsNull(
                owner.getId(), AssetType.CRYPTO, "BTCUSDT")).willReturn(false);
        given(assetRepository.save(any(Asset.class))).willAnswer(invocation -> invocation.getArgument(0));

        AssetResponse res = assetService.registerAsset(owner.getId(), req);

        assertThat(res.getTicker()).isEqualTo("BTCUSDT");
        verify(binanceWebSocketService).subscribe("BTCUSDT");
    }
}
