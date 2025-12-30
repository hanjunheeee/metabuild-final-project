package com.example.ex02.Products.repository;

import com.example.ex02.Products.entity.ProductEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<ProductEntity, Long> {
    
    // 이름으로 상품 검색
    List<ProductEntity> findByNameContaining(String name);
    
    // 가격 범위로 상품 검색
    List<ProductEntity> findByPriceBetween(Integer minPrice, Integer maxPrice);
}

