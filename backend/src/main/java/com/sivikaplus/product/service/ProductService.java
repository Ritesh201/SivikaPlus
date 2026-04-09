package com.sivikaplus.product.service;

import com.sivikaplus.exception.ResourceNotFoundException;
import com.sivikaplus.listing.repository.ListingRepository;
import com.sivikaplus.product.dto.ProductDto.*;
import com.sivikaplus.product.model.Product;
import com.sivikaplus.product.model.ProductImage;
import com.sivikaplus.product.repository.CategoryRepository;
import com.sivikaplus.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ListingRepository listingRepository;

//    @Cacheable("products")
    public Page<Summary> getAll(Pageable pageable) {
        int page = pageable.getPageNumber();
        int size = pageable.getPageSize();

        List<Summary> summaries = productRepository.findActiveProducts()
                .stream()
                .map(this::toSummary)
                .collect(Collectors.toList());

        int start = page * size;
        int end = Math.min(start + size, summaries.size());

        return new PageImpl<>(
                summaries.subList(start, end),
                PageRequest.of(page, size),
                summaries.size()
        );
    }

    public Page<Summary> getByCategory(UUID categoryId, Pageable pageable) {
        return productRepository.findByCategoryIdAndActiveTrue(categoryId, pageable).map(this::toSummary);
    }

    public Page<Summary> search(String q, Pageable pageable) {
        return productRepository.search(q, pageable).map(this::toSummary);
    }

    public Detail getBySlug(String slug) {
        return toDetail(productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + slug)));
    }

    public Detail getById(UUID id) {
        return toDetail(productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id)));
    }

    public Page<Summary> getTopDeals(Pageable pageable) {
        return productRepository.findTopDeals(pageable).map(this::toSummary);
    }

    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public Detail create(CreateRequest req) {
        String slug = toSlug(req.getName());
        if (productRepository.findBySlug(slug).isPresent()) slug += "-" + System.currentTimeMillis();

        Product p = Product.builder()
                .name(req.getName())
                .slug(slug)
                .description(req.getDescription())
                .brand(req.getBrand())
                .build();

        if (req.getCategoryId() != null) {
            p.setCategory(categoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found")));
        }

        return toDetail(productRepository.save(p));
    }

    @Cacheable("categories")
    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findByActiveTrue().stream().map(c -> {
            CategoryDto dto = new CategoryDto();
            dto.setId(c.getId());
            dto.setName(c.getName());
            dto.setSlug(c.getSlug());
            return dto;
        }).collect(Collectors.toList());
    }

    // ---- mappers ----

    public Summary toSummary(Product p) {
        Summary s = new Summary();
        s.setId(p.getId());
        s.setName(p.getName());
        s.setSlug(p.getSlug());
        s.setBrand(p.getBrand());
        s.setMinPrice(p.getMinPrice());
        s.setMaxPrice(p.getMaxPrice());
        s.setTotalListings(p.getTotalListings());
        if (p.getCategory() != null) s.setCategoryName(p.getCategory().getName());
        p.getImages().stream().filter(ProductImage::isPrimary).findFirst()
                .or(() -> p.getImages().stream().findFirst())
                .ifPresent(img -> s.setPrimaryImageUrl(img.getImageUrl()));
        return s;
    }

    public Detail toDetail(Product p) {
        Detail d = new Detail();
        d.setId(p.getId());
        d.setName(p.getName());
        d.setSlug(p.getSlug());
        d.setDescription(p.getDescription());
        d.setBrand(p.getBrand());
        d.setMinPrice(p.getMinPrice());
        d.setMaxPrice(p.getMaxPrice());
        d.setTotalListings(p.getTotalListings());
        d.setCreatedAt(p.getCreatedAt());
        if (p.getCategory() != null) {
            CategoryDto cat = new CategoryDto();
            cat.setId(p.getCategory().getId());
            cat.setName(p.getCategory().getName());
            cat.setSlug(p.getCategory().getSlug());
            d.setCategory(cat);
        }
        d.setImages(p.getImages().stream().map(img -> {
            ImageDto i = new ImageDto();
            i.setId(img.getId());
            i.setImageUrl(img.getImageUrl());
            i.setAltText(img.getAltText());
            i.setPrimary(img.isPrimary());
            i.setSortOrder(img.getSortOrder());
            return i;
        }).collect(Collectors.toList()));
        return d;
    }

    private static final Pattern NON_LATIN = Pattern.compile("[^\\w-]");
    private static final Pattern SPACES = Pattern.compile("\\s+");

    private String toSlug(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        return NON_LATIN.matcher(SPACES.matcher(normalized.toLowerCase(Locale.ENGLISH)).replaceAll("-"))
                .replaceAll("").replaceAll("-+", "-");
    }
    @Transactional
    public void approveProduct(UUID productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        product.setStatus(Product.ProductStatus.ACTIVE);
        productRepository.save(product);
        // activate all listings for this product
        listingRepository.findByProductId(productId)
                .forEach(l -> { l.setActive(true); listingRepository.save(l); });
    }

    @Transactional
    public void rejectProduct(UUID productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        product.setStatus(Product.ProductStatus.REJECTED);
        productRepository.save(product);
    }
}
