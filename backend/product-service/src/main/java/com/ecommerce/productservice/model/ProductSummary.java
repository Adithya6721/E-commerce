package com.ecommerce.productservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ProductSummary {
    private long totalProducts;
    private int totalUnitsInStock;
    private long lowStockProducts;
    private double totalInventoryValue;
}
