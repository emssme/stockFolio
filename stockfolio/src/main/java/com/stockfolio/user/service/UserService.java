package com.stockfolio.user.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stockfolio.global.exception.ErrorCode;
import com.stockfolio.global.exception.GlobalException;
import com.stockfolio.global.jwt.JwtProvider;
import com.stockfolio.user.repository.UserRepository;
import com.stockfolio.user.domain.User;
import com.stockfolio.user.dto.LoginRequest;
import com.stockfolio.user.dto.LoginResponse;
import com.stockfolio.user.dto.SignUpRequest;
import com.stockfolio.user.dto.SignUpResponse;
import com.stockfolio.user.dto.UserResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    public SignUpResponse signup(SignUpRequest request) {
        // 이메일 중복 확인
        if (userRepository.existsByEmailAndDeletedAtIsNull(request.getEmail())) {
            throw new GlobalException(ErrorCode.DUPLICATE_EMAIL);
        }
        // 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // User 엔티티 생성 및 저장
        User user = User.builder()
                .email(request.getEmail())
                .password(encodedPassword)
                .nickname(request.getNickname())
                .build();

        // 저장 후 응답 반환
        User savedUser = userRepository.save(user);
        return SignUpResponse.from(savedUser);
    }

    public LoginResponse login(LoginRequest req) {
        User user = userRepository.findByEmailAndDeletedAtIsNull(req.getEmail())
                .orElseThrow(() -> new GlobalException(ErrorCode.INVALID_CREDENTIALS));
        
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new GlobalException(ErrorCode.INVALID_CREDENTIALS);
        }

        String accessToken = jwtProvider.generateAccessToken(user.getId(), user.getEmail());
        String refreshToken = jwtProvider.generateRefreshToken(user.getId());

        return LoginResponse.of(accessToken, refreshToken);
    }

    public UserResponse getMe(Long userId) { 
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GlobalException(ErrorCode.USER_NOT_FOUND));
        return UserResponse.from(user);
    }
}

