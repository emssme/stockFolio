package com.stockfolio.global.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Getter;
import lombok.Setter;

@Configuration
@ConfigurationProperties(prefix = "kis")
@Getter
@Setter
public class KisProperties {
    private String appKey;
    private String appSecret;
    private String baseUrl;
}