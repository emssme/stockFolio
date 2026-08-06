package com.stockfolio.auth.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockfolio.binance.BinanceWebSocketService;
import com.stockfolio.kis.service.KisStockService;
import com.stockfolio.user.domain.User;
import com.stockfolio.user.repository.UserRepository;

/**
 * 인증 흐름을 실제 Security 필터 체인 + DB/Redis를 통해 검증하는 통합 테스트.
 * KIS/Binance는 네트워크 호출을 막기 위해 MockitoBean으로 대체한다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private KisStockService kisStockService;
    @MockitoBean
    private BinanceWebSocketService binanceWebSocketService;

    @Test
    @DisplayName("이미 가입된 이메일로 다시 회원가입하면 409 DUPLICATE_EMAIL을 반환한다")
    void signup_duplicateEmail_returns409() throws Exception {
        Map<String, String> req = Map.of(
                "email", "dup-test@stockfolio.com",
                "password", "password1!",
                "nickname", "홍길동");

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("DUPLICATE_EMAIL"));
    }

    @Test
    @DisplayName("존재하지 않는 이메일로 로그인하면 401 INVALID_CREDENTIALS를 반환한다")
    void login_unknownEmail_returns401() throws Exception {
        Map<String, String> req = Map.of(
                "email", "no-such-user@stockfolio.com",
                "password", "password1!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    @DisplayName("가입된 이메일이라도 비밀번호가 틀리면 401 INVALID_CREDENTIALS를 반환한다")
    void login_wrongPassword_returns401() throws Exception {
        userRepository.save(User.builder()
                .email("wrong-pw-test@stockfolio.com")
                .password(passwordEncoder.encode("correctPassword1!"))
                .nickname("홍길동")
                .build());

        Map<String, String> req = Map.of(
                "email", "wrong-pw-test@stockfolio.com",
                "password", "wrongPassword1!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    @DisplayName("Refresh Token은 재발급할 때마다 새 값으로 교체되고, 이미 폐기된 예전 토큰으로 재시도하면 재사용 공격으로 거부된다")
    void reissue_rotatesTokenAndRejectsReuse() throws Exception {
        String email = "rotate-test@stockfolio.com";
        userRepository.save(User.builder()
                .email(email)
                .password(passwordEncoder.encode("password1!"))
                .nickname("로테이션")
                .build());

        String loginBody = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("email", email, "password", "password1!"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String oldRefreshToken = objectMapper.readTree(loginBody).path("data").path("refreshToken").asText();

        String reissueBody = mockMvc.perform(post("/api/auth/reissue")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("refreshToken", oldRefreshToken))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String newRefreshToken = objectMapper.readTree(reissueBody).path("data").path("refreshToken").asText();

        assertThat(newRefreshToken).isNotBlank().isNotEqualTo(oldRefreshToken);

        // 이미 로테이션되어 폐기된 예전 Refresh Token으로 다시 재발급을 시도
        mockMvc.perform(post("/api/auth/reissue")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("refreshToken", oldRefreshToken))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("REFRESH_TOKEN_REUSED"));
    }
}
