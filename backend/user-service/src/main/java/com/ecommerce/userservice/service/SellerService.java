package com.ecommerce.userservice.service;

import com.ecommerce.userservice.model.*;
import com.ecommerce.userservice.repository.SellerProfileRepository;
import com.ecommerce.userservice.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class SellerService {

    private final SellerProfileRepository sellerProfileRepository;
    private final UserRepository userRepository;

    public SellerService(SellerProfileRepository sellerProfileRepository, UserRepository userRepository) {
        this.sellerProfileRepository = sellerProfileRepository;
        this.userRepository = userRepository;
    }

    public SellerProfile applyToBecomeSeller(String username, SellerApplyRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        // Check if already has a pending/verified application
        Optional<SellerProfile> existing = sellerProfileRepository.findByUserId(user.getId());
        if (existing.isPresent()) {
            SellerProfile profile = existing.get();

            if (profile.getVerificationStatus() == SellerVerificationStatus.VERIFIED) {
                throw new RuntimeException("You are already a verified seller.");
            }

            if (profile.getVerificationStatus() == SellerVerificationStatus.PENDING
                    || profile.getVerificationStatus() == SellerVerificationStatus.UNDER_REVIEW) {
                throw new RuntimeException("You already have a pending application.");
            }

            // REJECTED — check 7-day cooldown
            if (profile.getVerificationStatus() == SellerVerificationStatus.REJECTED) {
                if (profile.getReviewedAt() != null
                        && profile.getReviewedAt().plus(7, ChronoUnit.DAYS).isAfter(Instant.now())) {
                    throw new RuntimeException("You can reapply after 7 days from rejection.");
                }

                // Allow reapplication — update existing profile
                profile.setBusinessName(request.getBusinessName());
                profile.setGstNumber(request.getGstNumber());
                profile.setBankAccountNumber(request.getBankAccountNumber());
                profile.setBankIfsc(request.getBankIfsc());
                profile.setPhoneNumber(request.getPhoneNumber());
                profile.setVerificationStatus(SellerVerificationStatus.PENDING);
                profile.setAppliedAt(Instant.now());
                profile.setReviewedAt(null);
                profile.setReviewedBy(null);
                profile.setRejectionReason(null);
                return sellerProfileRepository.save(profile);
            }
        }

        // New application
        SellerProfile profile = new SellerProfile();
        profile.setUserId(user.getId());
        profile.setUsername(username);
        profile.setBusinessName(request.getBusinessName());
        profile.setGstNumber(request.getGstNumber());
        profile.setBankAccountNumber(request.getBankAccountNumber());
        profile.setBankIfsc(request.getBankIfsc());
        profile.setPhoneNumber(request.getPhoneNumber());
        profile.setVerificationStatus(SellerVerificationStatus.PENDING);
        profile.setAppliedAt(Instant.now());

        return sellerProfileRepository.save(profile);
    }

    public Optional<SellerProfile> getMySellerProfile(String username) {
        return sellerProfileRepository.findByUsername(username);
    }

    public List<SellerProfile> getAllSellerProfiles() {
        return sellerProfileRepository.findAll();
    }

    public List<SellerProfile> getPendingApplications() {
        return sellerProfileRepository.findByVerificationStatus(SellerVerificationStatus.PENDING);
    }

    public SellerProfile verifyOrRejectSeller(String profileId, SellerVerifyRequest request, String adminUsername) {
        SellerProfile profile = sellerProfileRepository.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Seller profile not found: " + profileId));

        SellerVerificationStatus newStatus;
        try {
            newStatus = SellerVerificationStatus.valueOf(request.getStatus());
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Invalid status: " + request.getStatus()
                    + ". Must be VERIFIED, REJECTED, or UNDER_REVIEW.");
        }

        profile.setVerificationStatus(newStatus);
        profile.setReviewedAt(Instant.now());
        profile.setReviewedBy(adminUsername);

        if (newStatus == SellerVerificationStatus.REJECTED) {
            profile.setRejectionReason(request.getRejectionReason());
        } else {
            profile.setRejectionReason(null);
        }

        SellerProfile saved = sellerProfileRepository.save(profile);

        // If VERIFIED, update user role to SELLER
        if (newStatus == SellerVerificationStatus.VERIFIED) {
            userRepository.findById(profile.getUserId()).ifPresent(user -> {
                user.setRole("SELLER");
                userRepository.save(user);
            });
        }

        return saved;
    }
}
