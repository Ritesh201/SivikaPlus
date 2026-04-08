package com.multimart.seller.service;

import com.multimart.auth.model.SellerProfile.VerificationStatus;
import com.multimart.auth.model.User;
import com.multimart.auth.repository.SellerProfileRepository;
import com.multimart.auth.repository.UserRepository;
import com.multimart.exception.BadRequestException;
import com.multimart.exception.ResourceNotFoundException;
import com.multimart.listing.model.Listing;
import com.multimart.listing.repository.ListingRepository;
import com.multimart.product.dto.ProductDto;
import com.multimart.product.model.Product;
import com.multimart.product.repository.CategoryRepository;
import com.multimart.product.repository.ProductRepository;
import com.multimart.seller.dto.SellerProductDto.*;
import com.multimart.seller.model.SellerProduct;
import com.multimart.seller.repository.SellerProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class SellerProductService {

    private final SellerProductRepository repo;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final ProductRepository productRepository;
    private final ListingRepository listingRepository;

    @Transactional(readOnly = true)
    public Page<Response> getAll(String sellerEmail, Pageable pageable) {
        var seller = findSeller(sellerEmail);
        return repo.findBySellerId(seller.getId(), pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Response getOne(String sellerEmail, UUID productId) {
        var seller = findSeller(sellerEmail);
        return toResponse(repo.findByIdAndSellerId(productId, seller.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found")));
    }

    @Transactional
    public Response create(String sellerEmail, CreateRequest req) {
        var seller = findSeller(sellerEmail);
        requireApproved(seller);

        String slug = uniqueSlug(req.getName());

        SellerProduct product = SellerProduct.builder()
                .seller(seller)
                .name(req.getName())
                .slug(slug)
                .description(req.getDescription())
                .brand(req.getBrand())
                .build();

        if (req.getCategoryId() != null)
            product.setCategory(categoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found")));

        return toResponse(repo.save(product));
    }

    @Transactional
    public Response update(String sellerEmail, UUID productId, UpdateRequest req) {
        var seller = findSeller(sellerEmail);
        SellerProduct product = repo.findByIdAndSellerId(productId, seller.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (req.getName() != null && !req.getName().isBlank()) {
            product.setName(req.getName());
            product.setSlug(uniqueSlug(req.getName()));
        }
        if (req.getDescription() != null) product.setDescription(req.getDescription());
        if (req.getBrand() != null) product.setBrand(req.getBrand());
        if (req.getActive() != null) product.setActive(req.getActive());
        if (req.getCategoryId() != null)
            product.setCategory(categoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found")));

        return toResponse(repo.save(product));
    }

    @Transactional
    public void delete(String sellerEmail, UUID productId) {
        var seller = findSeller(sellerEmail);
        SellerProduct product = repo.findByIdAndSellerId(productId, seller.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        repo.delete(product);
    }

    // ---- helpers ----

    private User findSeller(String email) {
        return userRepository.findActiveByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found"));
    }

    /** Block PENDING or REJECTED sellers from creating products */
    private void requireApproved(User seller) {
        sellerProfileRepository.findByUserId(seller.getId()).ifPresent(sp -> {
            if (sp.getVerificationStatus() != VerificationStatus.APPROVED)
                throw new BadRequestException(
                        "Your seller account is " + sp.getVerificationStatus().name() +
                        ". Admin approval is required before you can add products.");
        });
    }

    private String uniqueSlug(String name) {
        String base = toSlug(name);
        String slug = base;
        int i = 1;
        while (repo.existsBySlug(slug)) slug = base + "-" + (i++);
        return slug;
    }

    private Response toResponse(SellerProduct p) {
        Response r = new Response();
        r.setId(p.getId());
        r.setName(p.getName());
        r.setSlug(p.getSlug());
        r.setDescription(p.getDescription());
        r.setBrand(p.getBrand());
        r.setActive(p.isActive());
        r.setCreatedAt(p.getCreatedAt());
        r.setUpdatedAt(p.getUpdatedAt());
        if (p.getCategory() != null) r.setCategoryName(p.getCategory().getName());
        return r;
    }

    private static final Pattern NON_LATIN = Pattern.compile("[^\\w-]");
    private static final Pattern SPACES    = Pattern.compile("\\s+");

    private String toSlug(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        return NON_LATIN.matcher(SPACES.matcher(normalized.toLowerCase(Locale.ENGLISH)).replaceAll("-"))
                .replaceAll("").replaceAll("-+", "-");
    }

    @Transactional
    public ProductDto.SellerProductResponse createProductAndListing(String email, ProductDto.SellerCreateRequest req) {
        var user = userRepository.findActiveByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Create product with PENDING status
        Product product = Product.builder()
                .name(req.getName())
                .description(req.getDescription())
                .brand(req.getBrand())
                .slug(generateSlug(req.getName()))
                .status(Product.ProductStatus.PENDING)
                .build();

        if (req.getCategoryId() != null) {
            categoryRepository.findById(req.getCategoryId())
                    .ifPresent(product::setCategory);
        }

        product = productRepository.save(product);

        // Create listing — inactive until product approved
        Listing listing = Listing.builder()
                .seller(user)
                .product(product)
                .price(req.getPrice())
                .originalPrice(req.getOriginalPrice())
                .stockQuantity(req.getStockQuantity())
                .sku(req.getSku())
                .customDescription(req.getCustomDescription())
                .active(false) // goes active only after admin approves product
                .build();

        listing = listingRepository.save(listing);

        ProductDto.SellerProductResponse res = new ProductDto.SellerProductResponse();
        res.setProductId(product.getId());
        res.setProductName(product.getName());
        res.setStatus(product.getStatus().name());
        res.setListingId(listing.getId());
        return res;
    }

    private String generateSlug(String name) {
        return name.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "")
                + "-" + System.currentTimeMillis();
    }
}
