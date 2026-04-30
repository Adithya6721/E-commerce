package com.ecommerce.userservice.controller;

import com.ecommerce.userservice.model.User;
import com.ecommerce.userservice.model.UserSummary;
import com.ecommerce.userservice.repository.UserRepository;
import com.ecommerce.userservice.service.UserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
public class UserController {
    @Autowired
    private UserService service;
    UserRepository userRepository;

    public UserController(UserService service, UserRepository userRepository) {
        this.service = service;
        this.userRepository = userRepository;
    }

    @PostMapping
    public User registerUser(@RequestBody User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new RuntimeException("User already exists");
        }
        return service.registerUser(user);
    }

    @GetMapping
    public List<User> getAllUsers() {
        return service.getAllUsers();
    }

    @GetMapping("/admin/all")
    public List<User> getAllUsersForAdmin() {
        return service.getAllUsers();
    }

    @GetMapping("/summary")
    public UserSummary getUserSummary() {
        return service.getSummary();
    }

    /**
     * Internal endpoint: order-service calls this to get the customer's email
     * so it can send the order confirmation without the frontend needing to pass it.
     * GET /users/email/{username}
     */
    @GetMapping("/email/{username}")
    public ResponseEntity<?> getUserEmail(@PathVariable String username) {
        return userRepository.findByUsername(username)
                .map(u -> ResponseEntity.ok(Map.of("email", u.getEmail() != null ? u.getEmail() : "")))
                .orElse(ResponseEntity.notFound().build());
    }
}
