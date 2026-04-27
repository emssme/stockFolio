package com.stockfolio.user.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.stockfolio.global.response.ApiResponse;
import com.stockfolio.user.dto.UserResponse;
import com.stockfolio.user.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getMe() {
        Long userId = (Long) SecurityContextHolder.getContext()
                            .getAuthentication().getPrincipal();
        UserResponse res = userService.getMe(userId);
        return ResponseEntity.ok(ApiResponse.success(res));
    }
    
}
