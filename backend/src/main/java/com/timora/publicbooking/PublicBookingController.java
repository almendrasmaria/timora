package com.timora.publicbooking;

import com.timora.appointment.AppointmentService;
import com.timora.appointment.dto.AppointmentResponse;
import com.timora.publicbooking.dto.PublicBusinessResponse;
import com.timora.publicbooking.dto.PublicCreateAppointmentRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/businesses")
public class PublicBookingController {

    private final PublicBookingService publicBookingService;
    private final AppointmentService appointmentService;

    public PublicBookingController(
            PublicBookingService publicBookingService,
            AppointmentService appointmentService
    ) {
        this.publicBookingService = publicBookingService;
        this.appointmentService = appointmentService;
    }

    @GetMapping("/{slug}")
    public PublicBusinessResponse getBySlug(@PathVariable String slug) {
        return publicBookingService.getBySlug(slug);
    }

    @PostMapping("/{slug}/appointments")
    public AppointmentResponse createAppointment(
            @PathVariable String slug,
            @Valid @RequestBody PublicCreateAppointmentRequest request
    ) {
        var business = publicBookingService.requirePublishedBusiness(slug);
        return appointmentService.createPublic(business, request);
    }
}
