package com.stockfolio.global.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.stockfolio.global.exception.ErrorCode;

import lombok.*;

// success: true/false
// data: 성공 시 실제 데이터
// error: 실패 시 에러 정보

@Getter
@Builder
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    
    private final boolean success;
    private final T data;
    private final ErrorResponse error;

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null);
    }

    public static <T> ApiResponse<T> success() {
        return new ApiResponse<>(true, null, null);
    }

    public static <T> ApiResponse<T> error(ErrorCode errorCode) {
        return new ApiResponse<>(false, null, new ErrorResponse(errorCode));
    }
}
