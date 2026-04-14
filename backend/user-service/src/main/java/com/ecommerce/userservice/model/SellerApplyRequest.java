package com.ecommerce.userservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SellerApplyRequest {
    private String businessName;
    private String gstNumber;
    private String bankAccountNumber;
    private String bankIfsc;
    private String phoneNumber;
}
