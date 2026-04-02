package com.ecommerce.cartservice.service;

import com.ecommerce.cartservice.model.Cart;
import com.ecommerce.cartservice.model.CartItem;
import com.ecommerce.cartservice.model.CartSummary;
import com.ecommerce.cartservice.model.Product;
import com.ecommerce.cartservice.repository.CartRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class CartService {

    private final CartRepository repository;
    private final RestTemplate restTemplate;
    private final String productServiceUrl;

    public CartService(CartRepository repository, RestTemplate restTemplate,
                       @Value("${product.service.url}") String productServiceUrl) {
        this.repository = repository;
        this.restTemplate = restTemplate;
        this.productServiceUrl = productServiceUrl;
    }

    public Cart addItemToCart(String userId, CartItem item) {
        if (item.getQuantity() == 0) {
            return repository.findByUserId(userId).orElseGet(() -> {
                Cart emptyCart = new Cart();
                emptyCart.setUserId(userId);
                emptyCart.setItems(new ArrayList<>());
                emptyCart.setTotalPrice(0);
                return emptyCart;
            });
        }

        Cart cart = repository.findByUserId(userId)
                .orElseGet(() -> {
                    Cart newCart = new Cart();
                    newCart.setUserId(userId);
                    newCart.setItems(new ArrayList<>());
                    newCart.setTotalPrice(0);
                    return newCart;
                });

        boolean itemUpdated = false;
        for (CartItem cartItem : cart.getItems()) {
            if (cartItem.getProductId().equals(item.getProductId())) {
                cartItem.setQuantity(cartItem.getQuantity() + item.getQuantity());
                itemUpdated = true;
                break;
            }
        }

        if (!itemUpdated) {
            if (item.getQuantity() > 0) {
                cart.getItems().add(item);
            }
        } else {
            cart.getItems().removeIf(cartItem -> cartItem.getQuantity() <= 0);
        }

        cart.setTotalPrice(calculateTotalPrice(cart));
        return repository.save(cart);
    }

    public Optional<Cart> getCartByUserId(String userId) {
        return repository.findByUserId(userId);
    }

    public Optional<Cart> updateQuantity(String userId, String productId, int quantity) {
        Optional<Cart> optionalCart = repository.findByUserId(userId);
        if (optionalCart.isEmpty()) {
            return Optional.empty();// user has no cart
        }

        Cart cart = optionalCart.get();
        CartItem existingItem = null;
        for (CartItem item : cart.getItems()) {
            if (item.getProductId().equals(productId)) {
                existingItem = item;
                break;
            }
        }

        if (existingItem == null) {
            return Optional.empty();//product is not found in the cart
        }

        if (quantity <= 0) {
            cart.getItems().removeIf(cartItem -> cartItem.getProductId().equals(productId));
        } else {
            existingItem.setQuantity(quantity);
        }

        cart.setTotalPrice(calculateTotalPrice(cart));
        return Optional.of(repository.save(cart));//product is found and updated
    }

    public Optional<Cart> removeItem(String userId, String productId) {
        Optional<Cart> optionalCart = repository.findByUserId(userId);
        if (optionalCart.isEmpty()) {
            return Optional.empty();
        }

        Cart cart = optionalCart.get();
        boolean removed = cart.getItems().removeIf(item -> item.getProductId().equals(productId));
        if (!removed) {
            return Optional.empty();
        }

        cart.setTotalPrice(calculateTotalPrice(cart));
        return Optional.of(repository.save(cart));
    }

    public List<Cart> getAllCarts() {
        return repository.findAll();
    }

    public CartSummary getSummary() {
        List<Cart> carts = repository.findAll();
        long cartsWithItems = carts.stream()
                .filter(cart -> cart.getItems() != null && !cart.getItems().isEmpty())
                .count();
        int totalItemsInCarts = carts.stream()
                .flatMap(cart -> cart.getItems().stream())
                .mapToInt(CartItem::getQuantity)
                .sum();
        double projectedRevenue = carts.stream()
                .mapToDouble(Cart::getTotalPrice)
                .sum();

        return new CartSummary(carts.size(), cartsWithItems, totalItemsInCarts, projectedRevenue);
    }

    private double calculateTotalPrice(Cart cart) {//product service url is present in the application properties
        double total = 0;
        for (CartItem item : cart.getItems()) {
            Product product = restTemplate.getForObject(productServiceUrl + "/" + item.getProductId(), Product.class);
            if (product != null) {
                total += product.getPrice() * item.getQuantity();
            }
        }
        return total;
    }
}
