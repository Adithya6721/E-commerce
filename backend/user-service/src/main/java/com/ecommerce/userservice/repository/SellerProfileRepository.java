package com.ecommerce.userservice.repository;

import com.ecommerce.userservice.model.SellerProfile;
import com.ecommerce.userservice.model.SellerVerificationStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface SellerProfileRepository extends MongoRepository<SellerProfile, String> {

    Optional<SellerProfile> findByUserId(String userId);

    Optional<SellerProfile> findByUsername(String username);

    List<SellerProfile> findByVerificationStatus(SellerVerificationStatus status);
}
