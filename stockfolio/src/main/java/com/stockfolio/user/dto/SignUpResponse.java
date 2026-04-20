package com.stockfolio.user.dto;

import java.time.LocalDateTime;

import com.stockfolio.user.domain.User;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignUpResponse {

    private Long userId;       // 생성된 사용자 ID
    private String email;      // 이메일
    private String nickname;   // 닉네임
    private LocalDateTime createdAt;  // 가입 일시

    public static SignUpResponse from(User user) {
        return SignUpResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .createdAt(user.getCreatedAt())
                .build();
    }
}