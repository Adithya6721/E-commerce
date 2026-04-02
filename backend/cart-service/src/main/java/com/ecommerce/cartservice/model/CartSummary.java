package com.ecommerce.cartservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CartSummary {
    private long totalCarts;
    private long cartsWithItems;
    private int totalItemsInCarts;
    private double projectedRevenue;
}
