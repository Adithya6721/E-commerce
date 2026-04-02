package com.ecommerce.cartservice.controller;

import com.ecommerce.cartservice.model.Cart;
import com.ecommerce.cartservice.model.CartItem;
import com.ecommerce.cartservice.model.CartSummary;
import com.ecommerce.cartservice.service.CartService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/cart")
public class CartController {

    private final CartService service;

    public CartController(CartService service) {
        this.service = service;
    }

    @PostMapping("/{userId}/items")
    public Cart addItemToCart(@PathVariable String userId, @RequestBody CartItem item) {
        return service.addItemToCart(userId, item);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<Cart> getCartByUserId(@PathVariable String userId) {
        return service.getCartByUserId(userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/admin/all")
    public java.util.List<Cart> getAllCarts() {
        return service.getAllCarts();
    }

    @GetMapping("/admin/summary")
    public CartSummary getCartSummary() {
        return service.getSummary();
    }

    @PutMapping("/{userId}/items/{productId}")
    public ResponseEntity<Cart> updateQuantity(@PathVariable String userId,
                                               @PathVariable String productId,
                                               @RequestBody CartItem item) {
        return service.updateQuantity(userId, productId, item.getQuantity())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{userId}/items/{productId}")
    public ResponseEntity<Cart> removeItem(@PathVariable String userId, @PathVariable String productId) {
        return service.removeItem(userId, productId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
