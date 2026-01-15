package com.example.ex02.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        
        String authHeader = request.getHeader("Authorization");
        String requestUri = request.getRequestURI();
        String method = request.getMethod();
        
        // POST/PUT/DELETE 요청만 로깅 (디버깅용)
        if (!method.equals("GET")) {
            log.info("Request: {} {} - Auth header present: {}", method, requestUri, authHeader != null);
        }
        
        // Bearer 토큰이 있는지 확인
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7); // "Bearer " 제거
            
            try {
                // 토큰 유효성 검증
                if (jwtUtil.validateToken(token)) {
                    String email = jwtUtil.getEmailFromToken(token);
                    Long userId = jwtUtil.getUserIdFromToken(token);
                    String role = jwtUtil.getRoleFromToken(token);
                    
                    log.info("JWT valid for user: {} (userId: {}, role: {})", email, userId, role);
                    
                    // role에 따른 권한 설정 (ADMIN -> ROLE_ADMIN, USER -> ROLE_USER)
                    String authority = "ROLE_" + (role != null ? role : "USER");
                    
                    // 인증 객체 생성 및 SecurityContext에 저장
                    UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(
                            email,
                            userId, // credentials에 userId 저장
                            Collections.singletonList(new SimpleGrantedAuthority(authority))
                        );
                    
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                } else {
                    log.warn("JWT validation failed for request: {} {}", method, requestUri);
                }
            } catch (Exception e) {
                // 토큰이 유효하지 않으면 인증 정보 없이 진행
                log.error("JWT processing error: {}", e.getMessage());
                SecurityContextHolder.clearContext();
            }
        }
        
        filterChain.doFilter(request, response);
    }
}

