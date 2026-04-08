package com.multimart.settlement.controller;

import com.multimart.settlement.service.SettlementService;
import com.multimart.settlement.service.SettlementService.SettlementDto;
import com.multimart.settlement.service.SettlementService.SummaryDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/seller/settlements")
@RequiredArgsConstructor
public class SettlementController {

    private final SettlementService settlementService;

    @GetMapping
    public ResponseEntity<Page<SettlementDto>> list(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(settlementService.getBySellerEmail(user.getUsername(), PageRequest.of(page, size)));
    }

    @GetMapping("/summary")
    public ResponseEntity<SummaryDto> summary(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(settlementService.getSummary(user.getUsername()));
    }
}
