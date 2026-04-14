package com.ecommerce.userservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "SellerProfile")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class SellerProfile {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    private String username;
    private String businessName;
    private String gstNumber;
    private String bankAccountNumber;
    private String bankIfsc;
    private String phoneNumber;

    private SellerVerificationStatus verificationStatus;
    private Instant appliedAt;
    private Instant reviewedAt;
    private String reviewedBy;
    private String rejectionReason;
}
