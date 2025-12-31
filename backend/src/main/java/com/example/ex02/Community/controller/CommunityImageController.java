package com.example.ex02.Community.controller;

import com.example.ex02.Community.service.CommunityImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/community-images")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class CommunityImageController {

    private final CommunityImageService communityImageService;
}

