package com.ecommerce.orderservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderRequest {
    private String userId;
    private List<OrderItem> items;
    private double totalAmount;
    private String paymentMethod;
    private ShippingDetails shippingDetails;
}
