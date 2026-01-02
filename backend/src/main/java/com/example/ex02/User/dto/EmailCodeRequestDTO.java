package com.example.ex02.User.dto;

import lombok.Data;

@Data
public class EmailCodeRequestDTO {
    private String email;
    private String code;
}

