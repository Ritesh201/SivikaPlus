package com.multimart.order.service;

import com.multimart.auth.repository.SellerProfileRepository;
import com.multimart.auth.repository.UserRepository;
import com.multimart.exception.BadRequestException;
import com.multimart.exception.ResourceNotFoundException;
import com.multimart.exception.UnauthorizedException;
import com.multimart.listing.model.Listing;
import com.multimart.listing.repository.ListingRepository;
import com.multimart.listing.service.ListingService;
import com.multimart.order.dto.OrderDto.*;
import com.multimart.order.model.*;
import com.multimart.order.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartItemRepository cartItemRepository;
    private final AddressRepository addressRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ListingService listingService;
    // ---- CART ----

    @Transactional
    public CartResponse addToCart(String email, AddToCartRequest req) {
        var user = userRepository.findActiveByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Listing listing = listingRepository.findById(req.getListingId())
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found"));

        if (!listing.isActive())
            throw new BadRequestException("Listing is no longer available");
        if (listing.getStockQuantity() < req.getQuantity())
            throw new BadRequestException("Only " + listing.getStockQuantity() + " items in stock");

        CartItem item = cartItemRepository
                .findByUserIdAndListingId(user.getId(), listing.getId())
                .orElse(CartItem.builder().user(user).listing(listing).build());

        item.setQuantity(req.getQuantity());
        cartItemRepository.save(item);
        return buildCart(user.getId());
    }

    @Transactional
    public CartResponse updateCartItem(String email, UUID cartItemId, int quantity) {
        var user = userRepository.findActiveByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        if (!item.getUser().getId().equals(user.getId()))
            throw new UnauthorizedException("Not your cart item");

        if (quantity <= 0) {
            cartItemRepository.delete(item);
        } else {
            if (item.getListing().getStockQuantity() < quantity)
                throw new BadRequestException("Not enough stock");
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }
        return buildCart(user.getId());
    }

    @Transactional
    public void removeFromCart(String email, UUID cartItemId) {
        var user = userRepository.findActiveByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));
        if (!item.getUser().getId().equals(user.getId()))
            throw new UnauthorizedException("Not your cart item");
        cartItemRepository.delete(item);
    }

    public CartResponse getCart(String email) {
        var user = userRepository.findActiveByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return buildCart(user.getId());
    }

    // ---- ORDERS ----

    @Transactional
    public OrderResponse placeOrder(String email, PlaceOrderRequest req) {
        var user = userRepository.findActiveByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<CartItem> cartItems = cartItemRepository.findByUserId(user.getId());
        if (cartItems.isEmpty())
            throw new BadRequestException("Cart is empty");

        Address address = addressRepository.findById(req.getAddressId())
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));
        if (!address.getUser().getId().equals(user.getId()))
            throw new UnauthorizedException("Not your address");

        // Validate stock and compute total
        BigDecimal total = BigDecimal.ZERO;
        for (CartItem ci : cartItems) {
            if (!ci.getListing().isActive())
                throw new BadRequestException("Item unavailable: " + ci.getListing().getProduct().getName());
            if (ci.getListing().getStockQuantity() < ci.getQuantity())
                throw new BadRequestException("Insufficient stock: " + ci.getListing().getProduct().getName());
            total = total.add(ci.getListing().getPrice().multiply(BigDecimal.valueOf(ci.getQuantity())));
        }

        Order order = Order.builder()
                .orderNumber("MM-" + System.currentTimeMillis())
                .customer(user)
                .addressId(address.getId())
                .totalAmount(total)
                .finalAmount(total)
                .notes(req.getNotes())
                .build();
        order = orderRepository.save(order);

        for (CartItem ci : cartItems) {
            Listing listing = ci.getListing();
            BigDecimal itemTotal = listing.getPrice().multiply(BigDecimal.valueOf(ci.getQuantity()));

            orderItemRepository.save(OrderItem.builder()
                    .order(order)
                    .listing(listing)
                    .seller(listing.getSeller())
                    .product(listing.getProduct())
                    .quantity(ci.getQuantity())
                    .unitPrice(listing.getPrice())
                    .totalPrice(itemTotal)
                    .build());

            listing.setStockQuantity(listing.getStockQuantity() - ci.getQuantity());
            if (listing.getStockQuantity() == 0) {
                listing.setActive(false);
            }
            listingRepository.save(listing);
            // sync product prices after stock change
            listingService.syncProductPrices(listing.getProduct().getId());
        }

        cartItemRepository.deleteByUserId(user.getId());

        try {
            kafkaTemplate.send("order.placed", order.getId().toString(), order.getOrderNumber());
        } catch (Exception e) {
            log.warn("Kafka unavailable: {}", e.getMessage());
        }

        return toOrderResponse(orderRepository.findById(order.getId()).orElseThrow());
    }

    public Page<OrderResponse> getMyOrders(String email, Pageable pageable) {
        var user = userRepository.findActiveByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(this::toOrderResponse);
    }

    public OrderResponse getOrder(String email, UUID orderId) {
        var user = userRepository.findActiveByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (!order.getCustomer().getId().equals(user.getId()))
            throw new UnauthorizedException("Not your order");
        return toOrderResponse(order);
    }

    public Page<SellerOrderDto> getSellerOrders(String email, Pageable pageable) {
        var user = userRepository.findActiveByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return orderItemRepository.findOrdersBySellerIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(order -> toSellerOrderDto(order, user.getId()));
    }

    private SellerOrderDto toSellerOrderDto(Order order, UUID sellerId) {
        SellerOrderDto dto = new SellerOrderDto();
        dto.setOrderId(order.getId());
        dto.setOrderNumber(order.getOrderNumber());
        dto.setOrderStatus(order.getStatus().name());
        dto.setCreatedAt(order.getCreatedAt().toLocalDateTime());

        // Only items belonging to this seller
        List<OrderItemDto> items = order.getItems().stream()
                .filter(oi -> oi.getSeller().getId().equals(sellerId))
                .map(this::toOrderItemDto)
                .collect(Collectors.toList());

        dto.setItems(items);
        dto.setOrderTotal(items.stream()
                .map(OrderItemDto::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        return dto;
    }

    // ---- ADDRESSES ----

    @Transactional
    public AddressDto addAddress(String email, CreateAddressRequest req) {
        var user = userRepository.findActiveByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (req.isDefaultAddress()) {
            addressRepository.findByUserIdAndDefaultAddressTrue(user.getId())
                    .ifPresent(a -> { a.setDefaultAddress(false); addressRepository.save(a); });
        }

        Address address = Address.builder()
                .user(user)
                .fullName(req.getFullName())
                .phone(req.getPhone())
                .addressLine1(req.getAddressLine1())
                .addressLine2(req.getAddressLine2())
                .city(req.getCity())
                .state(req.getState())
                .pincode(req.getPincode())
                .country(req.getCountry())
                .defaultAddress(req.isDefaultAddress())
                .build();

        return toAddressDto(addressRepository.save(address));
    }

    public List<AddressDto> getAddresses(String email) {
        var user = userRepository.findActiveByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return addressRepository.findByUserId(user.getId())
                .stream().map(this::toAddressDto).collect(Collectors.toList());
    }


    @Transactional
    public void updateOrderItemStatus(String email, UUID orderItemId, String newStatus) {
        var user = userRepository.findActiveByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        OrderItem item = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Order item not found"));

        if (!item.getSeller().getId().equals(user.getId()))
            throw new UnauthorizedException("Not your order item");
        item.setStatus(OrderItem.ItemStatus.valueOf(newStatus));
        orderItemRepository.save(item);
    }


    // ---- Mappers ----

    private CartResponse buildCart(UUID userId) {
        List<CartItem> items = cartItemRepository.findByUserId(userId);
        CartResponse cart = new CartResponse();
        cart.setItems(items.stream().map(this::toCartItemDto).collect(Collectors.toList()));
        cart.setSubtotal(cart.getItems().stream()
                .map(CartItemDto::getItemTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        cart.setTotalItems(items.stream().mapToInt(CartItem::getQuantity).sum());
        return cart;
    }

    private CartItemDto toCartItemDto(CartItem ci) {
        CartItemDto dto = new CartItemDto();
        dto.setId(ci.getId());
        dto.setListingId(ci.getListing().getId());
        dto.setProductId(ci.getListing().getProduct().getId());
        dto.setProductName(ci.getListing().getProduct().getName());
        dto.setProductSlug(ci.getListing().getProduct().getSlug());
        dto.setPrice(ci.getListing().getPrice());
        dto.setQuantity(ci.getQuantity());
        dto.setItemTotal(ci.getListing().getPrice().multiply(BigDecimal.valueOf(ci.getQuantity())));
        dto.setAvailableStock(ci.getListing().getStockQuantity());
        sellerProfileRepository.findByUserId(ci.getListing().getSeller().getId())
                .ifPresent(sp -> dto.setSellerName(sp.getBusinessName()));
        ci.getListing().getProduct().getImages().stream()
                .filter(img -> img.isPrimary()).findFirst()
                .ifPresent(img -> dto.setImageUrl(img.getImageUrl()));
        return dto;
    }

    private OrderResponse toOrderResponse(Order o) {
        OrderResponse r = new OrderResponse();
        r.setId(o.getId());
        r.setOrderNumber(o.getOrderNumber());
        r.setStatus(o.getStatus().name());
        r.setTotalAmount(o.getTotalAmount());
        r.setDiscountAmount(o.getDiscountAmount());
        r.setFinalAmount(o.getFinalAmount());
        r.setNotes(o.getNotes());
        r.setCreatedAt(o.getCreatedAt());
        r.setUpdatedAt(o.getUpdatedAt());
        r.setItems(o.getItems().stream().map(this::toOrderItemDto).collect(Collectors.toList()));
        if (o.getAddressId() != null)
            addressRepository.findById(o.getAddressId()).ifPresent(a -> r.setAddress(toAddressDto(a)));
        return r;
    }

    private OrderItemDto toOrderItemDto(OrderItem oi) {
        OrderItemDto dto = new OrderItemDto();
        dto.setId(oi.getId());
        dto.setProductId(oi.getProduct().getId());
        dto.setProductName(oi.getProduct().getName());
        dto.setQuantity(oi.getQuantity());
        dto.setUnitPrice(oi.getUnitPrice());
        dto.setTotalPrice(oi.getTotalPrice());
        dto.setStatus(oi.getStatus().name());
        dto.setTrackingId(oi.getTrackingId());
        sellerProfileRepository.findByUserId(oi.getSeller().getId())
                .ifPresent(sp -> dto.setSellerName(sp.getBusinessName()));
        oi.getProduct().getImages().stream().filter(img -> img.isPrimary()).findFirst()
                .ifPresent(img -> dto.setImageUrl(img.getImageUrl()));
        return dto;
    }

    private AddressDto toAddressDto(Address a) {
        AddressDto dto = new AddressDto();
        dto.setId(a.getId());
        dto.setFullName(a.getFullName());
        dto.setPhone(a.getPhone());
        dto.setAddressLine1(a.getAddressLine1());
        dto.setAddressLine2(a.getAddressLine2());
        dto.setCity(a.getCity());
        dto.setState(a.getState());
        dto.setPincode(a.getPincode());
        dto.setCountry(a.getCountry());
        dto.setDefaultAddress(a.isDefaultAddress());
        return dto;
    }
}
