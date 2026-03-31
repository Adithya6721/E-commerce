package com.ecommerce.productservice.service;

import com.ecommerce.productservice.model.Product;
import com.ecommerce.productservice.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    private final ProductRepository repo;

    public ProductService(ProductRepository repo) {
        this.repo = repo;
    }

    public Product addProduct(Product product) {
        return repo.save(product);
    }

    public List<Product> getAllProducts() {
        return repo.findAll();
    }

    public Optional<Product> getProductById(String id) {
        return repo.findById(id);
    }

    public Product updateProduct(String id, Product product) {
        product.setId(id);
        return repo.save(product);
    }

    public void deleteProduct(String id) {
        repo.deleteById(id);
    }
}
