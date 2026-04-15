package com.ecommerce.orderservice.service;

import com.ecommerce.orderservice.model.*;
import com.ecommerce.orderservice.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class OrderService {

    private final OrderRepository repository;
    private final RestTemplate restTemplate;
    private final String productServiceUrl;

    public OrderService(
            OrderRepository repository,
            @Value("${product.service.url}") String productServiceUrl
    ) {
        this.repository = repository;
        this.restTemplate = new RestTemplate();
        this.productServiceUrl = productServiceUrl;
    }

    public Order createOrder(OrderRequest request, String authenticatedUser, String jwtToken) {
        // Decrement stock atomically via product-service for each item
        List<OrderItem> decrementedItems = new ArrayList<>();

        try {
            for (OrderItem item : request.getItems()) {
                decrementStock(item.getProductId(), item.getQuantity(), jwtToken);
                item.setItemStatus(OrderStatus.PLACED);
                decrementedItems.add(item);
            }
        } catch (Exception ex) {
            // Rollback already-decremented stock
            for (OrderItem decremented : decrementedItems) {
                try {
                    incrementStock(decremented.getProductId(), decremented.getQuantity(), jwtToken);
                } catch (Exception rollbackEx) {
                    // Log rollback failure silently — in production this would go to a dead letter queue
                }
            }
            throw new RuntimeException("Order creation failed: " + ex.getMessage());
        }

        Order order = new Order();
        order.setUserId(request.getUserId());
        order.setItems(request.getItems());
        order.setTotalAmount(request.getTotalAmount());
        order.setPaymentMethod(request.getPaymentMethod());
        order.setShippingDetails(request.getShippingDetails());
        order.setStatus(OrderStatus.PLACED);
        order.setCreatedAt(Instant.now());
        order.setEstimatedDelivery(Instant.now().plus(5, ChronoUnit.DAYS));

        StatusHistoryEntry initialEntry = new StatusHistoryEntry(
                OrderStatus.PLACED, Instant.now(), authenticatedUser
        );
        order.setStatusHistory(new ArrayList<>(List.of(initialEntry)));

        return repository.save(order);
    }

    public List<Order> getOrdersByUser(String userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Order> getAllOrders() {
        return repository.findAll();
    }

    public List<Order> getOrdersBySeller(String sellerUsername) {
        return repository.findAll().stream()
                .filter(order -> order.getItems().stream()
                        .anyMatch(item -> sellerUsername.equals(item.getSellerId())))
                .toList();
    }

    public Optional<Order> getOrderById(String id) {
        return repository.findById(id);
    }

    public Order updateOrderStatus(String orderId, OrderStatus newStatus, String changedBy) {
        Order order = repository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        order.setStatus(newStatus);
        order.getStatusHistory().add(
                new StatusHistoryEntry(newStatus, Instant.now(), changedBy)
        );

        return repository.save(order);
    }

    public Order updateOrderItemStatus(String orderId, String productId, OrderStatus newStatus, String trackingId, String courierName, String changedBy) {
        Order order = repository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        boolean updated = false;
        for (OrderItem item : order.getItems()) {
            if (item.getProductId().equals(productId)) {
                item.setItemStatus(newStatus);
                if (trackingId != null) item.setTrackingId(trackingId);
                if (courierName != null) item.setCourierName(courierName);
                updated = true;
                break;
            }
        }

        if (!updated) {
            throw new RuntimeException("Item not found in order");
        }

        // Add history entry indicating item status change
        order.getStatusHistory().add(
                new StatusHistoryEntry(newStatus, Instant.now(), changedBy + " (Item: " + productId + ")")
        );

        return repository.save(order);
    }

    private void decrementStock(String productId, int quantity, String jwtToken) {
        String url = productServiceUrl + "/products/" + productId;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + jwtToken);

        // First, get current stock
        HttpEntity<Void> getEntity = new HttpEntity<>(headers);
        ResponseEntity<Map> productResponse = restTemplate.exchange(
                url, HttpMethod.GET, getEntity, Map.class
        );

        if (!productResponse.getStatusCode().is2xxSuccessful() || productResponse.getBody() == null) {
            throw new RuntimeException("Product not found: " + productId);
        }

        int currentStock = ((Number) productResponse.getBody().get("stock")).intValue();
        if (currentStock < quantity) {
            throw new RuntimeException("Insufficient stock for product " + productId
                    + ". Available: " + currentStock + ", Requested: " + quantity);
        }

        // Update stock via PUT /products/{id}/stock
        int newStock = currentStock - quantity;
        Map<String, Integer> stockBody = Map.of("stock", newStock);
        HttpEntity<Map<String, Integer>> putEntity = new HttpEntity<>(stockBody, headers);
        restTemplate.exchange(
                url + "/stock", HttpMethod.PUT, putEntity, Map.class
        );
    }

    private void incrementStock(String productId, int quantity, String jwtToken) {
        String url = productServiceUrl + "/products/" + productId;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + jwtToken);

        HttpEntity<Void> getEntity = new HttpEntity<>(headers);
        ResponseEntity<Map> productResponse = restTemplate.exchange(
                url, HttpMethod.GET, getEntity, Map.class
        );

        if (productResponse.getStatusCode().is2xxSuccessful() && productResponse.getBody() != null) {
            int currentStock = ((Number) productResponse.getBody().get("stock")).intValue();
            int newStock = currentStock + quantity;
            Map<String, Integer> stockBody = Map.of("stock", newStock);
            HttpEntity<Map<String, Integer>> putEntity = new HttpEntity<>(stockBody, headers);
            restTemplate.exchange(
                    url + "/stock", HttpMethod.PUT, putEntity, Map.class
            );
        }
    }
}
