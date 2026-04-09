package com.sivikaplus.payment.service;

import com.sivikaplus.exception.BadRequestException;
import com.sivikaplus.exception.ResourceNotFoundException;
import com.sivikaplus.order.model.Order;
import com.sivikaplus.order.repository.OrderItemRepository;
import com.sivikaplus.order.repository.OrderRepository;
import com.sivikaplus.payment.dto.PaymentDto.*;
import com.sivikaplus.payment.model.Payment;
import com.sivikaplus.payment.repository.PaymentRepository;
import com.sivikaplus.settlement.service.SettlementService;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

@Service
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final SettlementService settlementService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    @Value("${razorpay.currency:INR}")
    private String currency;

    public PaymentService(PaymentRepository paymentRepository,
                          OrderRepository orderRepository,
                          OrderItemRepository orderItemRepository,
                          SettlementService settlementService,
                          KafkaTemplate<String, Object> kafkaTemplate) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.settlementService = settlementService;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Transactional
    public CreateResponse createPayment(CreateRequest req) {
        Order order = orderRepository.findById(req.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() != Order.OrderStatus.PENDING)
            throw new BadRequestException("Order is not in PENDING state");

        paymentRepository.findByOrderId(order.getId()).ifPresent(p -> {
            if (p.getStatus() == Payment.PaymentStatus.CAPTURED)
                throw new BadRequestException("Order already paid");
        });

        try {
            RazorpayClient client = new RazorpayClient(keyId, keySecret);

            JSONObject orderReq = new JSONObject();
            orderReq.put("amount", order.getFinalAmount().multiply(BigDecimal.valueOf(100)).longValue());
            orderReq.put("currency", currency);
            orderReq.put("receipt", order.getOrderNumber());

            com.razorpay.Order rzpOrder = client.orders.create(orderReq);

            paymentRepository.save(Payment.builder()
                    .order(order)
                    .razorpayOrderId(rzpOrder.get("id"))
                    .amount(order.getFinalAmount())
                    .currency(currency)
                    .build());

            CreateResponse res = new CreateResponse();
            res.setRazorpayOrderId(rzpOrder.get("id"));
            res.setAmount(order.getFinalAmount());
            res.setCurrency(currency);
            res.setKeyId(keyId);
            res.setOrderId(order.getId());
            res.setOrderNumber(order.getOrderNumber());
            return res;

        } catch (RazorpayException e) {
            log.error("Razorpay error: {}", e.getMessage());
            throw new BadRequestException("Payment gateway error: " + e.getMessage());
        }
    }

    @Transactional
    public PaymentResponse verifyPayment(VerifyRequest req) {
        Payment payment = paymentRepository.findByRazorpayOrderId(req.getRazorpayOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        String generated = hmac256(req.getRazorpayOrderId() + "|" + req.getRazorpayPaymentId(), keySecret);

        if (!generated.equals(req.getRazorpaySignature())) {
            payment.setStatus(Payment.PaymentStatus.FAILED);
            payment.setFailureReason("Signature mismatch");
            paymentRepository.save(payment);
            throw new BadRequestException("Payment signature verification failed");
        }

        payment.setRazorpayPaymentId(req.getRazorpayPaymentId());
        payment.setRazorpaySignature(req.getRazorpaySignature());
        payment.setStatus(Payment.PaymentStatus.CAPTURED);
        paymentRepository.save(payment);

        Order order = payment.getOrder();
        order.setStatus(Order.OrderStatus.CONFIRMED);
        orderRepository.save(order);

        // Create settlement for each order item
        orderItemRepository.findByOrderId(order.getId())
                .forEach(item -> settlementService.create(item, payment));

        try {
            kafkaTemplate.send("payment.captured", order.getId().toString(), payment.getRazorpayPaymentId());
        } catch (Exception e) {
            log.warn("Kafka unavailable: {}", e.getMessage());
        }

        return toResponse(payment);
    }

    private String hmac256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new RuntimeException("HMAC error", e);
        }
    }

    private PaymentResponse toResponse(Payment p) {
        PaymentResponse r = new PaymentResponse();
        r.setId(p.getId());
        r.setRazorpayOrderId(p.getRazorpayOrderId());
        r.setRazorpayPaymentId(p.getRazorpayPaymentId());
        r.setAmount(p.getAmount());
        r.setCurrency(p.getCurrency());
        r.setStatus(p.getStatus().name());
        r.setPaymentMethod(p.getPaymentMethod());
        r.setCreatedAt(p.getCreatedAt());
        return r;
    }
}
