package com.ecommerce.orderservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StatusHistoryEntry {
    private OrderStatus status;
    private Instant timestamp;
    private String changedBy;
}
