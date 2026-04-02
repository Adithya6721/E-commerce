package com.ecommerce.productservice.service;

import com.ecommerce.productservice.model.Product;
import com.ecommerce.productservice.model.ProductSummary;
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
        sanitizeProduct(product);
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
        sanitizeProduct(product);
        return repo.save(product);
    }

    public Optional<Product> updateStock(String id, int stock) {
        return repo.findById(id)
                .map(product -> {
                    product.setStock(Math.max(stock, 0));
                    return repo.save(product);
                });
    }

    public void deleteProduct(String id) {
        repo.deleteById(id);
    }

    public ProductSummary getSummary() {
        List<Product> products = repo.findAll();
        int totalUnitsInStock = products.stream()
                .mapToInt(product -> Math.max(product.getStock(), 0))
                .sum();
        long lowStockProducts = products.stream()
                .filter(product -> product.getStock() <= 5)
                .count();
        double totalInventoryValue = products.stream()
                .mapToDouble(product -> product.getPrice() * Math.max(product.getStock(), 0))
                .sum();

        return new ProductSummary(
                products.size(),
                totalUnitsInStock,
                lowStockProducts,
                totalInventoryValue
        );
    }

    private void sanitizeProduct(Product product) {
        product.setName(product.getName() == null ? "" : product.getName().trim());
        product.setDescription(product.getDescription() == null ? "" : product.getDescription().trim());
        product.setCategory(product.getCategory() == null ? "General" : product.getCategory().trim());
        product.setImage(product.getImage() == null ? "" : product.getImage().trim());
        product.setStock(Math.max(product.getStock(), 0));
    }
}
