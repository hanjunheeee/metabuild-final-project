package com.example.ex02.Library.controller;

import com.example.ex02.Library.service.LibraryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/libraries")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class LibraryController {

    private final LibraryService libraryService;
}

