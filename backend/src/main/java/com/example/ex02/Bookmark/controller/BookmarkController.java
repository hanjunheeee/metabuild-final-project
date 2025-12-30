package com.example.ex02.Bookmark.controller;

import com.example.ex02.Bookmark.service.BookmarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookmarks")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class BookmarkController {

    private final BookmarkService bookmarkService;
}

