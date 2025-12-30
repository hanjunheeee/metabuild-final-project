package com.example.ex02.Library.service;

import com.example.ex02.Library.repository.LibraryBookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LibraryBookService {

    private final LibraryBookRepository libraryBookRepository;
}

