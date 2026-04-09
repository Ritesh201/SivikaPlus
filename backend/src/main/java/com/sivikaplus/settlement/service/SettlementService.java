package com.sivikaplus.settlement.service;

import com.sivikaplus.auth.repository.UserRepository;
import com.sivikaplus.exception.ResourceNotFoundException;
import com.sivikaplus.order.model.OrderItem;
import com.sivikaplus.payment.model.Payment;
import com.sivikaplus.settlement.model.Settlement;
import com.sivikaplus.settlement.repository.SettlementRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.ZonedDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SettlementService {

    private static final BigDecimal PLATFORM_FEE_PCT = new BigDecimal("0.02"); // 2%

    private final SettlementRepository settlementRepository;
    private final UserRepository userRepository;

    @Transactional
    public Settlement create(OrderItem item, Payment payment) {
        BigDecimal gross = item.getTotalPrice();
        BigDecimal fee = gross.multiply(PLATFORM_FEE_PCT).setScale(2, RoundingMode.HALF_UP);
        BigDecimal net = gross.subtract(fee);

        Settlement s = Settlement.builder()
                .seller(item.getSeller())
                .orderItem(item)
                .payment(payment)
                .grossAmount(gross)
                .platformFee(fee)
                .netAmount(net)
                .build();

        s = settlementRepository.save(s);
        log.info("Settlement created for seller {} — net ₹{}", item.getSeller().getEmail(), net);
        return s;
    }

    public Page<SettlementDto> getBySellerEmail(String email, Pageable pageable) {
        var user = userRepository.findActiveByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return settlementRepository.findBySellerIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(this::toDto);
    }

    public SummaryDto getSummary(String email) {
        var user = userRepository.findActiveByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        SummaryDto dto = new SummaryDto();
        dto.setTotalPaid(settlementRepository.totalPaid(user.getId()));
        dto.setTotalPending(settlementRepository.totalPending(user.getId()));
        return dto;
    }

    private SettlementDto toDto(Settlement s) {
        SettlementDto dto = new SettlementDto();
        dto.setId(s.getId());
        dto.setGrossAmount(s.getGrossAmount());
        dto.setPlatformFee(s.getPlatformFee());
        dto.setNetAmount(s.getNetAmount());
        dto.setStatus(s.getStatus().name());
        dto.setPayoutReference(s.getPayoutReference());
        dto.setSettledAt(s.getSettledAt());
        dto.setCreatedAt(s.getCreatedAt());
        if (s.getOrderItem() != null) {
            dto.setProductName(s.getOrderItem().getProduct().getName());
            dto.setOrderNumber(s.getOrderItem().getOrder().getOrderNumber());
        }
        return dto;
    }

    // ---- Inner DTOs ----

    @Data
    public static class SettlementDto {
        private UUID id;
        private BigDecimal grossAmount;
        private BigDecimal platformFee;
        private BigDecimal netAmount;
        private String status;
        private String payoutReference;
        private String productName;
        private String orderNumber;
        private ZonedDateTime settledAt;
        private ZonedDateTime createdAt;
    }

    @Data
    public static class SummaryDto {
        private BigDecimal totalPaid;
        private BigDecimal totalPending;
    }
}
