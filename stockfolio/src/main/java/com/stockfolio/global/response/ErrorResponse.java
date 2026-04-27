package com.stockfolio.global.response;

import com.stockfolio.global.exception.ErrorCode;

import lombok.*;

@Data
@NoArgsConstructor
public class ErrorResponse {
    
    private String code;
    private String message;

    public ErrorResponse(ErrorCode errorCode) {
        this.code = errorCode.name();
        this.message = errorCode.getMessage();
    }
}
