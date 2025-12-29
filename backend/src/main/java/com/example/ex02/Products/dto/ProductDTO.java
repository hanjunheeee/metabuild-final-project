package com.example.ex02.Products.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ProductDTO {
    
    private Long id;
    private String name;
    private String description;
    private Integer price;
    private String imageUrl;

    public ProductDTO(Long id, String name, String description, Integer price) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
    }
}

