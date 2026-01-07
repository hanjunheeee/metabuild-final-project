package com.example.ex02.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> {})
            // 세션 사용 안 함 (JWT 방식)
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                // === 공개 API ===
                .requestMatchers("/api/books/**").permitAll()
                // 인증 관련 (로그인, 회원가입, 이메일 확인, 비밀번호 재설정 등)
                .requestMatchers("/api/users/login", "/api/users/signup", "/api/users/check-email").permitAll()
                .requestMatchers("/api/users/forgot-password", "/api/users/verify-reset-token", "/api/users/reset-password").permitAll()
                // 이메일 인증 API
                .requestMatchers("/api/email/**").permitAll()
                // 파일 업로드 API
                .requestMatchers("/api/files/**").permitAll()
                // 업로드된 파일 접근
                .requestMatchers("/uploads/**").permitAll()
                
                // 모든 GET 요청은 공개 (조회는 누구나 가능)
                .requestMatchers(HttpMethod.GET, "/api/**").permitAll()
                
                // Swagger, H2, Actuator
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/h2-console/**", "/actuator/**").permitAll()
                
                // === 인증 필요 API ===
                // POST, PUT, DELETE는 인증 필요 (생성, 수정, 삭제)
                .requestMatchers(HttpMethod.POST, "/api/**").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/**").authenticated()
                
                // 나머지 요청
                .anyRequest().authenticated()
            )
            .headers(headers -> headers.frameOptions(frame -> frame.disable()))
            // JWT 필터 추가
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}
