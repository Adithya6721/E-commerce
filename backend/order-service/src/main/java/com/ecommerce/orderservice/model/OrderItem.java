package com.ecommerce.orderservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderItem {
    private String productId;
    private String name;
    private double price;
    private int quantity;
    private String image;
    private String category;
    private String sellerId;
    
    // Item-level Fulfillment fields
    private OrderStatus itemStatus;
    private String trackingId;
    private String courierName;
}
