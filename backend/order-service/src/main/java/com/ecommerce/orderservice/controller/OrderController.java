package com.ecommerce.orderservice.controller;

import com.ecommerce.orderservice.model.*;
import com.ecommerce.orderservice.service.EmailService;
import com.ecommerce.orderservice.service.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderService service;
    private final EmailService emailService;

    public OrderController(OrderService service, EmailService emailService) {
        this.service = service;
        this.emailService = emailService;
    }

    @PostMapping
    public ResponseEntity<?> createOrder(
            @RequestBody OrderRequest request,
            Authentication authentication,
            @RequestHeader("Authorization") String authHeader
    ) {
        try {
            String username = authentication.getName();
            String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
            Order order = service.createOrder(request, username, token);

            // Automatically look up the customer's email from user-service — no frontend change needed
            String customerEmail = service.lookupCustomerEmail(username, token);
            if (!customerEmail.isBlank()) {
                emailService.sendOrderConfirmation(order, customerEmail);
            }

            return ResponseEntity.status(HttpStatus.CREATED).body(order);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyOrders(Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(service.getOrdersByUser(username));
    }

    @GetMapping("/admin/all")
    public ResponseEntity<?> getAllOrders() {
        return ResponseEntity.ok(service.getAllOrders());
    }

    @GetMapping("/seller/my")
    public ResponseEntity<?> getSellerOrders(Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(service.getOrdersBySeller(username));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable String id,
            @RequestBody StatusUpdateRequest request,
            Authentication authentication
    ) {
        try {
            OrderStatus newStatus = OrderStatus.valueOf(request.getStatus());
            String changedBy = authentication.getName();
            Order updated = service.updateOrderStatus(id, newStatus, changedBy);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body("Invalid status: " + request.getStatus());
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PutMapping("/{id}/items/{productId}/status")
    public ResponseEntity<?> updateItemStatus(
            @PathVariable String id,
            @PathVariable String productId,
            @RequestBody StatusUpdateRequest request,
            Authentication authentication
    ) {
        try {
            OrderStatus newStatus = OrderStatus.valueOf(request.getStatus());
            String changedBy = authentication.getName();
            Order updated = service.updateOrderItemStatus(
                id, 
                productId, 
                newStatus, 
                request.getTrackingId(), 
                request.getCourierName(), 
                changedBy
            );
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body("Invalid status: " + request.getStatus());
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderById(
            @PathVariable String id,
            Authentication authentication
    ) {
        Optional<Order> optionalOrder = service.getOrderById(id);
        if (optionalOrder.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Order order = optionalOrder.get();
        String username = authentication.getName();
        String role = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("");

        // Admin can see all orders
        if (role.equals("ROLE_ADMIN")) {
            return ResponseEntity.ok(order);
        }

        // Customer can see their own orders
        if (order.getUserId().equals(username)) {
            return ResponseEntity.ok(order);
        }

        // Seller can see orders containing their products
        if (role.equals("ROLE_SELLER")) {
            boolean hasSellerItems = order.getItems().stream()
                    .anyMatch(item -> username.equals(item.getSellerId()));
            if (hasSellerItems) {
                return ResponseEntity.ok(order);
            }
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
    }
}
