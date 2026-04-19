package com.sivikaplus.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@Slf4j
public class Msg91Service {

    @Value("${msg91.auth-key}")
    private String authKey;

    @Value("${msg91.widget-id}")
    private String widgetId;

    @Value("${msg91.url}")
    private String apiUrl;

    private final RestTemplate restTemplate;

    public Msg91Service(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public String sendOtp(String mobile) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("authkey", authKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> body = Map.of(
                    "widgetId", widgetId,
                    "identifier", "91" + mobile
            );

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    apiUrl + "/sendOtp",
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            log.info("MSG91 sendOtp response: {}", response.getBody());

            Map<String, Object> responseBody = response.getBody();
            if (responseBody != null && "success".equals(responseBody.get("type"))) {
                return (String) responseBody.get("message"); // ← reqId is in "message" field
            }
            throw new RuntimeException("MSG91 sendOtp failed: " + responseBody);

        } catch (Exception e) {
            log.error("Failed to send OTP to {}: {}", mobile, e.getMessage());
            throw new RuntimeException("OTP sending failed: " + e.getMessage());
        }
    }

    // ── Verify OTP ─────────────────────────────────────
    public boolean verifyOtp(String reqId, String otp) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("authkey", authKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> body = Map.of(
                    "widgetId", widgetId,
                    "reqId", reqId,
                    "otp", otp
            );

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    apiUrl + "/verifyOtp",
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            log.info("MSG91 verifyOtp response: {}", response.getBody());

            Map<String, Object> responseBody = response.getBody();
            if (responseBody != null) {
                return "true".equals(String.valueOf(responseBody.get("type")))
                        || "success".equals(String.valueOf(responseBody.get("type")));
            }
            return false;

        } catch (Exception e) {
            log.error("OTP verification failed: {}", e.getMessage());
            return false;
        }
    }

}