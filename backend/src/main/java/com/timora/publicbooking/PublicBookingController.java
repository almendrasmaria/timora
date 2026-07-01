package com.timora.publicbooking;

import com.timora.publicbooking.dto.PublicBusinessResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/businesses")
public class PublicBookingController {

    private final PublicBookingService publicBookingService;

    public PublicBookingController(PublicBookingService publicBookingService) {
        this.publicBookingService = publicBookingService;
    }

    @GetMapping("/{slug}")
    public PublicBusinessResponse getBySlug(@PathVariable String slug) {
        return publicBookingService.getBySlug(slug);
    }
}
