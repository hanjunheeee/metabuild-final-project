package com.example.ex02.Library.controller;

import com.example.ex02.Library.service.LibraryBookService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/library-books")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001")
public class LibraryBookController {

    private final LibraryBookService libraryBookService;
}

