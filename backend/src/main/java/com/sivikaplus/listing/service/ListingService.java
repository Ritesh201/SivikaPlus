package com.sivikaplus.listing.service;

import com.sivikaplus.auth.repository.SellerProfileRepository;
import com.sivikaplus.auth.repository.UserRepository;
import com.sivikaplus.exception.BadRequestException;
import com.sivikaplus.exception.ResourceNotFoundException;
import com.sivikaplus.exception.UnauthorizedException;
import com.sivikaplus.listing.dto.ListingDto.*;
import com.sivikaplus.listing.model.Listing;
import com.sivikaplus.listing.repository.ListingRepository;
import com.sivikaplus.product.model.Product;
import com.sivikaplus.product.model.ProductImage;
import com.sivikaplus.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ListingService {

    private final ListingRepository listingRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;

    @Transactional
    public Response create(String sellerEmail, CreateRequest req) {
        var seller = userRepository.findActiveByEmail(sellerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found"));

        if (listingRepository.existsBySellerIdAndProductId(seller.getId(), req.getProductId()))
            throw new BadRequestException("You already have a listing for this product");

        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        Listing listing = Listing.builder()
                .seller(seller)
                .product(product)
                .price(req.getPrice())
                .originalPrice(req.getOriginalPrice())
                .stockQuantity(req.getStockQuantity())
                .customDescription(req.getCustomDescription())
                .sku(req.getSku())
                .build();

        listing = listingRepository.save(listing);
        syncProductPrices(product.getId());
        return toResponse(listing);
    }

    @Transactional
    public Response update(String sellerEmail, UUID listingId, UpdateRequest req) {
        var seller = userRepository.findActiveByEmail(sellerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found"));

        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found"));

        if (!listing.getSeller().getId().equals(seller.getId()))
            throw new UnauthorizedException("Not your listing");

        if (req.getPrice() != null) listing.setPrice(req.getPrice());
        if (req.getOriginalPrice() != null) listing.setOriginalPrice(req.getOriginalPrice());
        if (req.getStockQuantity() != null) listing.setStockQuantity(req.getStockQuantity());
        if (req.getCustomDescription() != null) listing.setCustomDescription(req.getCustomDescription());
        if (req.getSku() != null) listing.setSku(req.getSku());
        if (req.getActive() != null) listing.setActive(req.getActive());

        listing = listingRepository.save(listing);
        syncProductPrices(listing.getProduct().getId());
        return toResponse(listing);
    }

    @Transactional
    public void delete(String sellerEmail, UUID listingId) {
        var seller = userRepository.findActiveByEmail(sellerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found"));

        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found"));

        if (!listing.getSeller().getId().equals(seller.getId()))
            throw new UnauthorizedException("Not your listing");

        UUID productId = listing.getProduct().getId();
        listingRepository.delete(listing);
        syncProductPrices(productId);
    }

    public Page<Response> getBySellerEmail(String sellerEmail, Pageable pageable) {
        var seller = userRepository.findActiveByEmail(sellerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found"));
        return listingRepository.findBySellerIdAndActiveTrue(seller.getId(), pageable)
                .map(this::toResponse);
    }

    public List<Response> getByProduct(UUID productId) {
        return listingRepository.findByProductIdAndActiveTrueAndStockQuantityGreaterThanOrderByPriceAsc(productId,0)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public void syncProductPrices(UUID productId) {
        productRepository.findById(productId).ifPresent(p -> {
            listingRepository.findMinPrice(productId).ifPresent(p::setMinPrice);
            listingRepository.findMaxPrice(productId).ifPresent(p::setMaxPrice);
            p.setTotalListings((int) listingRepository.countActive(productId));
            productRepository.save(p);
        });
    }

    private Response toResponse(Listing l) {
        Response r = new Response();
        r.setId(l.getId());
        r.setProductId(l.getProduct().getId());
        r.setProductName(l.getProduct().getName());
        r.setProductSlug(l.getProduct().getSlug());
        r.setPrice(l.getPrice());
        r.setOriginalPrice(l.getOriginalPrice());
        r.setStockQuantity(l.getStockQuantity());
        r.setCustomDescription(l.getCustomDescription());
        r.setSku(l.getSku());
        r.setActive(l.isActive());
        r.setTotalSold(l.getTotalSold());
        r.setCreatedAt(l.getCreatedAt());
        r.setUpdatedAt(l.getUpdatedAt());

        l.getProduct().getImages().stream()
                .filter(ProductImage::isPrimary).findFirst()
                .or(() -> l.getProduct().getImages().stream().findFirst())
                .ifPresent(img -> r.setPrimaryImageUrl(img.getImageUrl()));

        sellerProfileRepository.findByUserId(l.getSeller().getId()).ifPresent(sp -> {
            SellerInfo info = new SellerInfo();
            info.setId(l.getSeller().getId());
            info.setBusinessName(sp.getBusinessName());
            info.setRating(sp.getRating().doubleValue());
            info.setVerificationStatus(sp.getVerificationStatus().name());
            r.setSeller(info);
        });

        return r;
    }
}
