package com.stockfolio.asset.dto;

import java.math.BigDecimal;

import com.stockfolio.asset.domain.AssetType;
import com.stockfolio.asset.domain.Currency;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetRequest {

    @NotNull(message = "자산 종류를 입력해주세요.")
    private AssetType assetType;

    @NotBlank(message = "티커를 입력해주세요.")
    private String ticker;

    @NotBlank(message = "자산명을 입력해주세요.")
    private String name;

    @NotNull(message = "통화를 입력해주세요.")
    private Currency currency;

    @NotNull(message = "수량을 입력해주세요.")
    @Positive(message = "수량은 양수여야 합니다.")
    private BigDecimal quantity;

    @NotNull(message = "평균 단가를 입력해주세요.")
    @Positive(message = "평균단가는 양수여야 합니다.")
    private BigDecimal avgPurchasePrice;

    private String exchange;

    private String brokerage;
}
