package com.stockfolio.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    INVALID_INPUT(400, "요청 필드 형식 오류 또는 필수값 누락"),
    INVALID_PERIOD(400, "지원하지 않는 차트 기간"),
    INVALID_ASSET_TYPE(400, "지원하지 않는 자산 유형"),
    INSUFFICIENT_QUANTITY(400, "매도 수량이 보유 수량 초과"),
    UNAUTHORIZED(401, "인증 토큰 없음"),
    INVALID_REFRESH_TOKEN(401, "유효하지 않거나 만료된 Refresh Token"),
    REFRESH_TOKEN_REUSED(401, "이미 사용된 Refresh Token"),
    EXPIRED_ACCESS_TOKEN(401, "만료된 Access Token"),
    INVALID_CREDENTIALS(401, "이메일 또는 비밀번호 불일치"),
    WRONG_PASSWORD(401, "현재 비밀번호 불일치"),
    FORBIDDEN(403, "타 사용자 리소스 접근 시도"),
    USER_NOT_FOUND(404, "사용자 정보 없음"),
    ASSET_NOT_FOUND(404, "자산 정보 없음"),
    DUPLICATE_EMAIL(409, "이미 사용 중인 이메일"),
    DUPLICATE_ASSET(409, "이미 등록된 자산"),
    INTERNAL_SERVER_ERROR(500, "서버 내부 오류"),
    EXTERNAL_API_ERROR(500, "외부 API 통신 오류"),
    INVALID_TICKER(0, "존재하지 않는 종목 코드");

    private final int status;
    private final String message;
}
