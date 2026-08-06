package com.stockfolio.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.stockfolio.global.exception.ErrorCode;
import com.stockfolio.global.exception.GlobalException;
import com.stockfolio.global.jwt.JwtProvider;
import com.stockfolio.user.domain.User;
import com.stockfolio.user.dto.LoginRequest;
import com.stockfolio.user.dto.LoginResponse;
import com.stockfolio.user.dto.SignUpRequest;
import com.stockfolio.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtProvider jwtProvider;

    @InjectMocks
    private UserService userService;

    @Test
    @DisplayName("이메일이 중복되지 않으면 회원가입에 성공한다")
    void signup_success() {
        SignUpRequest req = SignUpRequest.builder()
                .email("new@stockfolio.com")
                .password("password1!")
                .nickname("홍길동")
                .build();
        given(userRepository.existsByEmailAndDeletedAtIsNull(req.getEmail())).willReturn(false);
        given(passwordEncoder.encode(req.getPassword())).willReturn("encoded-password");
        given(userRepository.save(any(User.class)))
                .willAnswer(invocation -> invocation.getArgument(0));

        userService.signup(req);

        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("이미 가입된 이메일로 회원가입하면 DUPLICATE_EMAIL 예외를 던진다")
    void signup_duplicateEmail_throwsException() {
        SignUpRequest req = SignUpRequest.builder()
                .email("dup@stockfolio.com")
                .password("password1!")
                .nickname("홍길동")
                .build();
        given(userRepository.existsByEmailAndDeletedAtIsNull(req.getEmail())).willReturn(true);

        assertThatThrownBy(() -> userService.signup(req))
                .isInstanceOf(GlobalException.class)
                .extracting(ex -> ((GlobalException) ex).getErrorCode())
                .isEqualTo(ErrorCode.DUPLICATE_EMAIL);

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("비밀번호가 일치하지 않으면 INVALID_CREDENTIALS 예외를 던진다")
    void login_wrongPassword_throwsException() {
        User user = User.builder()
                .id(1L)
                .email("user@stockfolio.com")
                .password("encoded-password")
                .nickname("홍길동")
                .build();
        LoginRequest req = LoginRequest.builder()
                .email(user.getEmail())
                .password("wrongPassword1!")
                .build();
        given(userRepository.findByEmailAndDeletedAtIsNull(req.getEmail())).willReturn(Optional.of(user));
        given(passwordEncoder.matches(req.getPassword(), user.getPassword())).willReturn(false);

        assertThatThrownBy(() -> userService.login(req))
                .isInstanceOf(GlobalException.class)
                .extracting(ex -> ((GlobalException) ex).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_CREDENTIALS);
    }

    @Test
    @DisplayName("로그인에 성공하면 토큰을 발급하고 Refresh Token을 저장한다")
    void login_success_issuesTokens() {
        User user = User.builder()
                .id(1L)
                .email("user@stockfolio.com")
                .password("encoded-password")
                .nickname("홍길동")
                .build();
        LoginRequest req = LoginRequest.builder()
                .email(user.getEmail())
                .password("password1!")
                .build();
        given(userRepository.findByEmailAndDeletedAtIsNull(req.getEmail())).willReturn(Optional.of(user));
        given(passwordEncoder.matches(req.getPassword(), user.getPassword())).willReturn(true);
        given(jwtProvider.generateAccessToken(user.getId(), user.getEmail())).willReturn("access-token");
        given(jwtProvider.generateRefreshToken(user.getId())).willReturn("refresh-token");

        LoginResponse res = userService.login(req);

        assertThat(res.getAccessToken()).isEqualTo("access-token");
        assertThat(res.getRefreshToken()).isEqualTo("refresh-token");
        verify(jwtProvider).saveRefreshToken(user.getId(), "refresh-token");
    }

    @Test
    @DisplayName("저장된 Refresh Token과 요청 토큰이 다르면 재사용 공격으로 간주해 예외를 던진다")
    void reissue_tokenMismatch_throwsReusedException() {
        Long userId = 1L;
        String requestToken = "old-refresh-token";
        given(jwtProvider.getUserIdFromToken(requestToken)).willReturn(userId);
        given(jwtProvider.getRefreshToken(userId)).willReturn("newer-refresh-token");

        assertThatThrownBy(() -> userService.reissue(requestToken))
                .isInstanceOf(GlobalException.class)
                .extracting(ex -> ((GlobalException) ex).getErrorCode())
                .isEqualTo(ErrorCode.REFRESH_TOKEN_REUSED);
    }

    @Test
    @DisplayName("로그아웃된 사용자의 Refresh Token으로 재발급을 시도하면 INVALID_REFRESH_TOKEN 예외를 던진다")
    void reissue_noStoredToken_throwsInvalidException() {
        Long userId = 1L;
        String requestToken = "refresh-token";
        given(jwtProvider.getUserIdFromToken(requestToken)).willReturn(userId);
        given(jwtProvider.getRefreshToken(userId)).willReturn(null);

        assertThatThrownBy(() -> userService.reissue(requestToken))
                .isInstanceOf(GlobalException.class)
                .extracting(ex -> ((GlobalException) ex).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_REFRESH_TOKEN);
    }
}
