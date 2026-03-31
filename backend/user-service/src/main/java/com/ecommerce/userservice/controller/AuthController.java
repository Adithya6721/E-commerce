package com.ecommerce.userservice.controller;

import com.ecommerce.userservice.model.User;
import com.ecommerce.userservice.security.JwtUtil;
import com.ecommerce.userservice.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    public AuthController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User request) {
        Optional<User> user = userService.loginUser(request.getUsername(), request.getPassword());
        if (user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password");
        }

        User loggedInUser = user.get();
        Map<String, String> response = new LinkedHashMap<>();
        response.put("token", jwtUtil.generateToken(loggedInUser.getUsername(), loggedInUser.getRole()));
        response.put("username", loggedInUser.getUsername());
        response.put("role", loggedInUser.getRole());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        String token = jwtUtil.extractTokenFromHeader(authHeader);
        if (token == null || !jwtUtil.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("valid", true);
        response.put("username", jwtUtil.extractUsername(token));
        response.put("role", jwtUtil.extractRole(token));
        return ResponseEntity.ok(response);
    }
}
