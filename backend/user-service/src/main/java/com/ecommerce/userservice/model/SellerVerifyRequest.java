package com.ecommerce.userservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SellerVerifyRequest {
    private String status; // VERIFIED or REJECTED
    private String rejectionReason;
}
