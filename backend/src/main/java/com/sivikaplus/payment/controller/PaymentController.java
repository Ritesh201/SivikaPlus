package com.sivikaplus.payment.controller;

import com.sivikaplus.payment.dto.PaymentDto.*;
import com.sivikaplus.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create")
    public ResponseEntity<CreateResponse> create(@Valid @RequestBody CreateRequest req) {
//        return ResponseEntity.ok(paymentService.createPayment(req));
        return ResponseEntity.ok(new CreateResponse());
    }

    @PostMapping("/verify")
    public ResponseEntity<PaymentResponse> verify(@Valid @RequestBody VerifyRequest req) {
        return ResponseEntity.ok(paymentService.verifyPayment(req));
    }
}
