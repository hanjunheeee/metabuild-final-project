package com.example.ex02.User.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class UserDTO {
    
    private Long userId;
    private String email;
    private String nickname;
    private String role;
    private String isActive;
    private LocalDateTime createdAt;
    private String userPhoto;
}

