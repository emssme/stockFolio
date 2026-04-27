package com.stockfolio.auth.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.stockfolio.global.response.ApiResponse;
import com.stockfolio.user.dto.LoginRequest;
import com.stockfolio.user.dto.LoginResponse;
import com.stockfolio.user.dto.ReissueRequest;
import com.stockfolio.user.dto.SignUpRequest;
import com.stockfolio.user.dto.SignUpResponse;
import com.stockfolio.user.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<SignUpResponse>> signup(@RequestBody @Valid SignUpRequest req) {
        SignUpResponse res = userService.signup(req);
        return ResponseEntity.status(201).body(ApiResponse.success(res));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@RequestBody @Valid LoginRequest req) {
        LoginResponse res = userService.login(req);
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        Long userId = (Long) SecurityContextHolder.getContext()
                            .getAuthentication().getPrincipal();
        userService.logout(userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/reissue")
    public ResponseEntity<ApiResponse<LoginResponse>> reissue(@RequestBody @Valid ReissueRequest req) {
        LoginResponse res = userService.reissue(req.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success(res));
    }
}
