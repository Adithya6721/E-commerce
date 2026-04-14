package com.ecommerce.orderservice.controller;

import com.ecommerce.orderservice.model.*;
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

    public OrderController(OrderService service) {
        this.service = service;
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
