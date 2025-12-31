package com.example.ex02.Community.service;

import com.example.ex02.Community.repository.CommunityImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommunityImageService {

    private final CommunityImageRepository communityImageRepository;
}

