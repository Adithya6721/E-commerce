package com.ecommerce.orderservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "Order")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Order {

    @Id
    private String id;
    private String userId;
    private List<OrderItem> items = new ArrayList<>();
    private double totalAmount;
    private OrderStatus status;
    private String paymentMethod;
    private ShippingDetails shippingDetails;
    private List<StatusHistoryEntry> statusHistory = new ArrayList<>();
    private Instant createdAt;
    private Instant estimatedDelivery;
}
