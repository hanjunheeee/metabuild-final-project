package com.example.ex02.Review.controller;

import com.example.ex02.Review.service.ReviewImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/review-images")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class ReviewImageController {

    private final ReviewImageService reviewImageService;
}

