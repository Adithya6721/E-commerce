package com.ecommerce.productservice.service;

import com.ecommerce.productservice.model.Product;
import com.ecommerce.productservice.model.Review;
import com.ecommerce.productservice.model.ReviewRequest;
import com.ecommerce.productservice.repository.ProductRepository;
import com.ecommerce.productservice.repository.ReviewRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;

    public ReviewService(ReviewRepository reviewRepository, ProductRepository productRepository) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
    }

    /**
     * Submit a review for a product.
     * Each user can only review a product once.
     */
    public Review submitReview(String productId, String username, ReviewRequest request) {
        if (request.getRating() < 1 || request.getRating() > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5.");
        }

        if (reviewRepository.existsByProductIdAndUsername(productId, username)) {
            throw new IllegalStateException("You have already reviewed this product.");
        }

        Review review = new Review();
        review.setProductId(productId);
        review.setUsername(username);
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setCreatedAt(Instant.now());

        Review saved = reviewRepository.save(review);

        // Re-compute average rating on the product
        recalculateProductRating(productId);

        return saved;
    }

    public List<Review> getReviewsForProduct(String productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }

    public boolean hasUserReviewed(String productId, String username) {
        return reviewRepository.existsByProductIdAndUsername(productId, username);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private void recalculateProductRating(String productId) {
        List<Review> reviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
        if (reviews.isEmpty()) return;

        double avg = reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);

        // Round to 1 decimal place
        double rounded = Math.round(avg * 10.0) / 10.0;

        productRepository.findById(productId).ifPresent(product -> {
            product.setAverageRating(rounded);
            productRepository.save(product);
        });
    }
}
