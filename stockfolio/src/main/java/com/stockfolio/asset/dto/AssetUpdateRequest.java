package com.stockfolio.asset.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AssetUpdateRequest {
    
    @NotNull(message = "자산 수량은 필수입니다.")
    @Positive(message = "자산 수량은 양수여야 합니다.")
    private BigDecimal quantity;
    
    @NotNull(message = "매수 가격은 필수입니다.")
    @Positive(message = "매수 가격은 양수여야 합니다.")
    private BigDecimal avgPurchasePrice;
}
