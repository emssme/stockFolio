package com.stockfolio.global.jwt;

import java.util.Date;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.data.redis.core.RedisTemplate;

import com.stockfolio.global.exception.ErrorCode;
import com.stockfolio.global.exception.GlobalException;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class JwtProvider {
    
    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration.access}")
    private long accessExpiration;    // 1800 (초)

    @Value("${jwt.expiration.refresh}")
    private long refreshExpiration;   // 604800 (초)

    private final RedisTemplate<String, String> redisTemplate;

    public String generateAccessToken(Long userId, String email) {
        // Access Token 생성
        return Jwts.builder()
            .id(UUID.randomUUID().toString())  // jti: 같은 밀리초에 발급돼도 토큰이 겹치지 않도록 보장
            .subject(userId.toString())
            .claim("email", email)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + accessExpiration * 1000))
            .signWith(getSigningKey())
            .compact();

    }

    public String generateRefreshToken(Long userId) {
        // Refesh Token 생성
        return Jwts.builder()
            .id(UUID.randomUUID().toString())  // jti: 같은 밀리초에 재발급돼도 토큰이 겹치지 않도록 보장
            .subject(userId.toString())
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + refreshExpiration * 1000))
            .signWith(getSigningKey())
            .compact();
    }

    public boolean validateToken(String token) {
        // 토큰 유효성 검증
        try {
            Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            throw new GlobalException(ErrorCode.EXPIRED_ACCESS_TOKEN);
        } catch (JwtException e) {
            throw new GlobalException(ErrorCode.INVALID_REFRESH_TOKEN);
        }
    }

    public Long getUserIdFromToken(String token) {
        // 토큰에서 userId 추출
        String userId = Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload()
            .getSubject();
        return Long.parseLong(userId);
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // Refresh Token 저장
    public void saveRefreshToken(Long userId, String refreshToken) {
        redisTemplate.opsForValue()
            .set("refresh:" + userId, refreshToken, refreshExpiration, TimeUnit.SECONDS);
    }

    // Refresh Token 조회
    public String getRefreshToken(Long userId) {
        return redisTemplate.opsForValue().get("refresh:" + userId);
    }

    // Refresh Token 삭제
    public void deleteRefreshToken(Long userId) {
        redisTemplate.delete("refresh:" + userId);
    }
}
