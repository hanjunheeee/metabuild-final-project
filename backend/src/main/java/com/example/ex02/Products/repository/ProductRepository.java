package com.example.ex02.Products.repository;

import com.example.ex02.Products.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    // 이름으로 상품 검색
    List<Product> findByNameContaining(String name);
    
    // 가격 범위로 상품 검색
    List<Product> findByPriceBetween(Integer minPrice, Integer maxPrice);
}

