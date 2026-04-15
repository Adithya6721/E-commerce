package com.ecommerce.orderservice.model;

public enum OrderStatus {
    PLACED,
    CONFIRMED,
    PACKED,
    SHIPPED,
    DELIVERED,
    CANCELLED,
    RETURN_REQUESTED,
    RETURN_REJECTED,
    RETURN_APPROVED
}
