package com.timora.appointment;

import com.timora.appointment.dto.AppointmentResponse;
import com.timora.appointment.dto.AppointmentSummaryResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.timora.appointment.dto.CreateAppointmentRequest;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping("/summary")
    public AppointmentSummaryResponse getSummary(@RequestParam(defaultValue = "today") String period) {
        return appointmentService.getSummary(period);
    }

    @GetMapping("/today")
    public List<AppointmentResponse> listToday() {
        return appointmentService.listToday();
    }

    @GetMapping("/recent")
    public List<AppointmentResponse> listRecent() {
        return appointmentService.listRecent();
    }

    @GetMapping
    public List<AppointmentResponse> list(
            @RequestParam(defaultValue = "week") String view,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) AppointmentStatus status
    ) {
        var range = appointmentService.resolveViewRange(view, date);
        return appointmentService.listForRange(range.from(), range.to(), status);
    }

    @PatchMapping("/{id}/no-show")
    public AppointmentResponse markNoShow(@PathVariable Long id) {
        return appointmentService.markNoShow(id);
    }

    @PutMapping("/{id}")
    public AppointmentResponse update(
            @PathVariable Long id,
            @RequestBody com.timora.appointment.dto.UpdateAppointmentRequest request
    ) {
        return appointmentService.update(id, request);
    }

    @PatchMapping("/{id}/cancel")
    public AppointmentResponse cancel(@PathVariable Long id) {
        return appointmentService.cancel(id);
    }

    @PostMapping
    public AppointmentResponse create(@Valid @RequestBody CreateAppointmentRequest request) {
        return appointmentService.createAdmin(request);
    }
}
