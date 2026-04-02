package com.ecommerce.userservice.service;

import com.ecommerce.userservice.model.User;
import com.ecommerce.userservice.model.UserSummary;
import com.ecommerce.userservice.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    public User registerUser(User user) {
        user.setId(null);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        if (user.getRole() == null || user.getRole().isBlank()) {
            user.setRole("CUSTOMER");
        }
        return hidePassword(repository.save(user));
    }

    public Optional<User> loginUser(String username, String password) {
        return repository.findByUsername(username)
                .filter(user -> passwordEncoder.matches(password, user.getPassword()));
    }

    public List<User> getAllUsers() {
        List<User> users = new ArrayList<>();
        for (User user : repository.findAll()) {
            users.add(hidePassword(user));
        }
        return users;
    }

    public UserSummary getSummary() {
        List<User> users = repository.findAll();
        long totalAdmins = users.stream()
                .filter(user -> "ADMIN".equalsIgnoreCase(user.getRole()))
                .count();
        long totalCustomers = users.stream()
                .filter(user -> !"ADMIN".equalsIgnoreCase(user.getRole()))
                .count();

        return new UserSummary(users.size(), totalAdmins, totalCustomers);
    }

    private User hidePassword(User user) {
        return new User(user.getId(), user.getUsername(), null, user.getRole());
    }
}
