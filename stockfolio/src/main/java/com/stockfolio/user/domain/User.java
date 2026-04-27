package com.stockfolio.user.domain;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    // 아이디
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 이메일
    @Column(unique = true, nullable = false)
    private String email;

    // 비밀번호
    @Column(nullable = false)
    private String password;

    // 닉네임
    @Column(nullable = false)
    private String nickname;

    // 회원 타입
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.USER;

    // 생성 일시
    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    // 생성 IP
    private String createdIp;

    // 수정 일시
    @LastModifiedDate
    private LocalDateTime updatedAt;

    // 수정 IP
    private String updatedIp;

    // 삭제 일시
    private LocalDateTime deletedAt;

}
