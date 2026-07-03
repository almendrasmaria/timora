package com.timora.business;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/business-config")
public class BusinessConfigController {

    private final BusinessConfigService businessConfigService;

    public BusinessConfigController(BusinessConfigService businessConfigService) {
        this.businessConfigService = businessConfigService;
    }

    @PutMapping("/settings")
    public ResponseEntity<Business> updateSettings(
            @Valid @RequestBody UpdateSettingsRequest request) {
        return ResponseEntity.ok(businessConfigService.updateSettings(request));
    }

    @PostMapping("/logo")
    public ResponseEntity<Business> uploadLogo(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(businessConfigService.uploadLogo(file));
    }
}
