
package com.sivikaplus.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@Slf4j
public class Msg91Service {

    @Value("${msg91.sender-id}")
    private String senderId;

    @Value("${msg91.auth-key}")
    private String authKey;

    @Value("${msg91.template-id}")
    private String templateId;

    @Value("${msg91.url}")
    private String apiUrl;

    private final RestTemplate restTemplate;

    public Msg91Service(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }


    public void sendOtp(String mobile, String otp) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("authkey", authKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            String url = apiUrl
                    + "?template_id=" + templateId
                    + "&mobile=91" + mobile
                    + "&otp=" + otp;  // ← add this

            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, String.class
            );

            log.info("MSG91 response: {}", response.getBody());

        } catch (Exception e) {
            log.error("Failed to send OTP to {}: {}", mobile, e.getMessage());
            throw new RuntimeException("OTP sending failed");
        }
    }
}
