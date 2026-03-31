package com.ecommerce.cartservice.service;

import com.ecommerce.cartservice.model.Cart;
import com.ecommerce.cartservice.model.CartItem;
import com.ecommerce.cartservice.model.Product;
import com.ecommerce.cartservice.repository.CartRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
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
            cart.getItems().add(item);
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
        for (CartItem item : cart.getItems()) {
            if (item.getProductId().equals(productId)) {
                item.setQuantity(quantity);
                cart.setTotalPrice(calculateTotalPrice(cart));
                return Optional.of(repository.save(cart));//product is found and updated
            }
        }

        return Optional.empty();//product is not found in the cart 
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
