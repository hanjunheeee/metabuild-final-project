package com.example.ex02.Community.repository;

import com.example.ex02.Community.entity.CommunityImageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CommunityImageRepository extends JpaRepository<CommunityImageEntity, Long> {
}

