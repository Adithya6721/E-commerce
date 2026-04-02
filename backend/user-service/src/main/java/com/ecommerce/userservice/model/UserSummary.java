package com.ecommerce.userservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserSummary {
    private long totalUsers;
    private long totalAdmins;
    private long totalCustomers;
}
