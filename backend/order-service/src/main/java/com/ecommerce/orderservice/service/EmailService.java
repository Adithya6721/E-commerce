package com.ecommerce.orderservice.service;

import com.ecommerce.orderservice.model.Order;
import com.ecommerce.orderservice.model.OrderItem;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String fromEmail;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${spring.mail.username}") String fromEmail
    ) {
        this.mailSender = mailSender;
        this.fromEmail = fromEmail;
    }

    /**
     * Sends an HTML order confirmation email to the customer.
     * Runs asynchronously so it never blocks order placement.
     */
    @Async
    public void sendOrderConfirmation(Order order, String customerEmail) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(customerEmail);
            helper.setSubject("Order Confirmed — #" + order.getId());
            helper.setText(buildHtml(order), true);

            mailSender.send(message);
        } catch (Exception e) {
            // Log the failure but do NOT throw — order is already saved
            System.err.println("[EmailService] Failed to send confirmation email: " + e.getMessage());
        }
    }

    // ── HTML template ────────────────────────────────────────────────────────
    private String buildHtml(Order order) {
        DateTimeFormatter fmt = DateTimeFormatter
                .ofPattern("dd MMM yyyy, hh:mm a")
                .withZone(ZoneId.of("Asia/Kolkata"));

        String itemRows = order.getItems().stream().map(item ->
                "<tr>" +
                "  <td style='padding:8px 0;border-bottom:1px solid #f1f5f9;'>" + escHtml(item.getName()) + "</td>" +
                "  <td style='padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:center;'>" + item.getQuantity() + "</td>" +
                "  <td style='padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:right;'>Rs " +
                    String.format("%.0f", item.getPrice() * item.getQuantity()) + "</td>" +
                "</tr>"
        ).collect(Collectors.joining());

        String shippingName = order.getShippingDetails() != null
                ? escHtml(order.getShippingDetails().getFullName())
                : order.getUserId();

        String shippingAddress = order.getShippingDetails() != null
                ? escHtml(order.getShippingDetails().getAddress() + ", " +
                          order.getShippingDetails().getCity() + " - " +
                          order.getShippingDetails().getPincode())
                : "N/A";

        return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
              <div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

                <!-- Header -->
                <div style="background:linear-gradient(135deg,#4338ca,#6366f1);padding:32px 40px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Order Confirmed ✓</h1>
                  <p style="margin:8px 0 0;color:#c7d2fe;font-size:14px;">Thank you for shopping with us!</p>
                </div>

                <!-- Body -->
                <div style="padding:32px 40px;">
                  <p style="margin:0 0 4px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Order ID</p>
                  <p style="margin:0 0 24px;font-size:14px;font-weight:700;color:#0f172a;font-family:monospace;">%s</p>

                  <p style="margin:0 0 4px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Placed On</p>
                  <p style="margin:0 0 24px;font-size:14px;color:#0f172a;">%s</p>

                  <p style="margin:0 0 4px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Estimated Delivery</p>
                  <p style="margin:0 0 24px;font-size:14px;color:#0f172a;">%s</p>

                  <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px;">

                  <!-- Items table -->
                  <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.08em;">Items Ordered</p>
                  <table style="width:100%%;border-collapse:collapse;font-size:14px;color:#0f172a;">
                    <thead>
                      <tr style="color:#64748b;font-size:12px;">
                        <th style="text-align:left;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">Product</th>
                        <th style="text-align:center;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">Qty</th>
                        <th style="text-align:right;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      %s
                    </tbody>
                  </table>

                  <!-- Total -->
                  <div style="margin-top:16px;display:flex;justify-content:flex-end;">
                    <div style="background:#f8fafc;border-radius:12px;padding:12px 20px;text-align:right;">
                      <span style="font-size:13px;color:#64748b;">Total Paid</span><br>
                      <span style="font-size:22px;font-weight:800;color:#4338ca;">Rs %.0f</span>
                    </div>
                  </div>

                  <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">

                  <!-- Shipping -->
                  <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.08em;">Shipping To</p>
                  <p style="margin:0;font-size:14px;color:#334155;line-height:1.6;"><strong>%s</strong><br>%s</p>
                </div>

                <!-- Footer -->
                <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                  <p style="margin:0;font-size:12px;color:#94a3b8;">Questions? Reply to this email or contact support.</p>
                  <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1;">© 2025 ShopApp. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(
                order.getId(),
                fmt.format(order.getCreatedAt()),
                order.getEstimatedDelivery() != null ? fmt.format(order.getEstimatedDelivery()) : "4–5 business days",
                itemRows,
                order.getTotalAmount(),
                shippingName,
                shippingAddress
        );
    }

    private String escHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;");
    }
}
