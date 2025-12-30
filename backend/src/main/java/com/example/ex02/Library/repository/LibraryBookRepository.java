package com.example.ex02.Library.repository;

import com.example.ex02.Library.entity.LibraryBookEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LibraryBookRepository extends JpaRepository<LibraryBookEntity, Long> {
}

