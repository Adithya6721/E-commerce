package com.ecommerce.userservice.controller;

import com.ecommerce.userservice.model.SellerApplyRequest;
import com.ecommerce.userservice.model.SellerProfile;
import com.ecommerce.userservice.model.SellerVerifyRequest;
import com.ecommerce.userservice.service.SellerService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/sellers")
public class SellerController {

    private final SellerService sellerService;

    public SellerController(SellerService sellerService) {
        this.sellerService = sellerService;
    }

    @PostMapping("/apply")
    public ResponseEntity<?> applyToBecomeSeller(
            @RequestBody SellerApplyRequest request,
            Authentication authentication
    ) {
        try {
            String username = authentication.getName();
            SellerProfile profile = sellerService.applyToBecomeSeller(username, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(profile);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMySellerProfile(Authentication authentication) {
        String username = authentication.getName();
        Optional<SellerProfile> profile = sellerService.getMySellerProfile(username);
        return profile.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/admin/all")
    public ResponseEntity<List<SellerProfile>> getAllSellerProfiles() {
        return ResponseEntity.ok(sellerService.getAllSellerProfiles());
    }

    @GetMapping("/admin/pending")
    public ResponseEntity<List<SellerProfile>> getPendingApplications() {
        return ResponseEntity.ok(sellerService.getPendingApplications());
    }

    @PutMapping("/admin/{id}/verify")
    public ResponseEntity<?> verifyOrRejectSeller(
            @PathVariable String id,
            @RequestBody SellerVerifyRequest request,
            Authentication authentication
    ) {
        try {
            String adminUsername = authentication.getName();
            SellerProfile updated = sellerService.verifyOrRejectSeller(id, request, adminUsername);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
}
