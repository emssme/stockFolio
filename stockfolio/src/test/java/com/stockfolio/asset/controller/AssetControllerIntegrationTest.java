package com.stockfolio.asset.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
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
import com.stockfolio.global.jwt.JwtProvider;
import com.stockfolio.kis.service.KisStockService;
import com.stockfolio.user.domain.User;
import com.stockfolio.user.repository.UserRepository;

/**
 * 자산 CRUD의 소유권 검증(타인 자산 접근 차단), 입력 검증, 중복/소프트삭제 처리를
 * 실제 Security 필터 체인 + DB를 통해 검증하는 통합 테스트.
 * KIS/Binance는 네트워크 호출을 막기 위해 MockitoBean으로 대체한다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AssetControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtProvider jwtProvider;

    @MockitoBean
    private KisStockService kisStockService;
    @MockitoBean
    private BinanceWebSocketService binanceWebSocketService;

    private String ownerToken;
    private String attackerToken;
    private Long ownerAssetId;

    private static final Map<String, Object> SAMSUNG_STOCK = Map.of(
            "assetType", "STOCK_KR",
            "ticker", "005930",
            "name", "삼성전자",
            "currency", "KRW",
            "quantity", 10,
            "avgPurchasePrice", 70000);

    @BeforeEach
    void setUp() throws Exception {
        User owner = userRepository.save(User.builder()
                .email("asset-owner@stockfolio.com")
                .password(passwordEncoder.encode("password1!"))
                .nickname("owner")
                .build());
        User attacker = userRepository.save(User.builder()
                .email("asset-attacker@stockfolio.com")
                .password(passwordEncoder.encode("password1!"))
                .nickname("attacker")
                .build());
        ownerToken = jwtProvider.generateAccessToken(owner.getId(), owner.getEmail());
        attackerToken = jwtProvider.generateAccessToken(attacker.getId(), attacker.getEmail());

        String body = mockMvc.perform(post("/api/assets")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(SAMSUNG_STOCK)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        ownerAssetId = objectMapper.readTree(body).path("data").path("id").asLong();
    }

    @Test
    @DisplayName("다른 사용자의 자산을 단건 조회하면 403 FORBIDDEN을 반환한다")
    void getAsset_asOtherUser_returns403() throws Exception {
        mockMvc.perform(get("/api/assets/" + ownerAssetId)
                        .header("Authorization", "Bearer " + attackerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("다른 사용자의 자산을 수정하려 하면 403 FORBIDDEN을 반환한다")
    void updateAsset_asOtherUser_returns403() throws Exception {
        Map<String, Object> updateReq = Map.of(
                "quantity", 999,
                "avgPurchasePrice", 1);

        mockMvc.perform(put("/api/assets/" + ownerAssetId)
                        .header("Authorization", "Bearer " + attackerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("다른 사용자의 자산을 삭제하려 하면 403 FORBIDDEN을 반환한다")
    void deleteAsset_asOtherUser_returns403() throws Exception {
        mockMvc.perform(delete("/api/assets/" + ownerAssetId)
                        .header("Authorization", "Bearer " + attackerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("소유자 본인은 자산을 정상적으로 조회할 수 있다")
    void getAsset_asOwner_returns200() throws Exception {
        mockMvc.perform(get("/api/assets/" + ownerAssetId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.ticker").value("005930"));
    }

    @Test
    @DisplayName("수량이 0 이하이면 400 INVALID_INPUT을 반환한다")
    void registerAsset_nonPositiveQuantity_returns400() throws Exception {
        Map<String, Object> req = Map.of(
                "assetType", "STOCK_KR",
                "ticker", "000660",
                "name", "SK하이닉스",
                "currency", "KRW",
                "quantity", -5,
                "avgPurchasePrice", 100000);

        mockMvc.perform(post("/api/assets")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_INPUT"));
    }

    @Test
    @DisplayName("동일 유형·티커 자산을 중복 등록하면 409 DUPLICATE_ASSET을 반환한다")
    void registerAsset_duplicate_returns409() throws Exception {
        mockMvc.perform(post("/api/assets")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(SAMSUNG_STOCK)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("DUPLICATE_ASSET"));
    }

    @Test
    @DisplayName("자산을 삭제(소프트 삭제)한 뒤 같은 유형·티커로 다시 등록하면 정상적으로 재등록된다")
    void registerAsset_afterSoftDelete_succeedsAgain() throws Exception {
        mockMvc.perform(delete("/api/assets/" + ownerAssetId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/assets")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(SAMSUNG_STOCK)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.ticker").value("005930"));
    }
}
