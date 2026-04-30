package com.ecommerce.productservice.controller;

import com.ecommerce.productservice.model.Review;
import com.ecommerce.productservice.model.ReviewRequest;
import com.ecommerce.productservice.service.ReviewService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    /**
     * POST /reviews/{productId}
     * Submit a star rating + comment for a product.
     * Requires CUSTOMER role (JWT secured at gateway / security config).
     */
    @PostMapping("/{productId}")
    public ResponseEntity<?> submitReview(
            @PathVariable String productId,
            @RequestBody ReviewRequest request,
            Authentication authentication
    ) {
        try {
            String username = authentication.getName();
            Review review = reviewService.submitReview(productId, username, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(review);
        } catch (IllegalStateException ex) {
            // Already reviewed
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    /**
     * GET /reviews/{productId}
     * Fetch all reviews for a product — public, no auth needed.
     */
    @GetMapping("/{productId}")
    public ResponseEntity<List<Review>> getReviews(@PathVariable String productId) {
        return ResponseEntity.ok(reviewService.getReviewsForProduct(productId));
    }

    /**
     * GET /reviews/{productId}/check
     * Check if the current user has already reviewed this product.
     */
    @GetMapping("/{productId}/check")
    public ResponseEntity<Map<String, Boolean>> checkUserReview(
            @PathVariable String productId,
            Authentication authentication
    ) {
        if (authentication == null) {
            return ResponseEntity.ok(Map.of("reviewed", false));
        }
        boolean reviewed = reviewService.hasUserReviewed(productId, authentication.getName());
        return ResponseEntity.ok(Map.of("reviewed", reviewed));
    }
}
