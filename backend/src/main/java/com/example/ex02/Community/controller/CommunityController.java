package com.example.ex02.Community.controller;

import com.example.ex02.Community.service.CommunityService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/communities")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001")
public class CommunityController {

    private final CommunityService communityService;
}

