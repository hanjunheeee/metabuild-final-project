package com.example.ex02.User.dto;

import lombok.Data;

@Data
public class SignupRequestDTO {
    private String email;
    private String password;
    private String nickname;
    private String userPhoto;
}

