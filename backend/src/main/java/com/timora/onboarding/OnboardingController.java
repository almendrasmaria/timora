package com.timora.onboarding;

import com.timora.onboarding.dto.CreateBranchRequest;
import com.timora.onboarding.dto.CreatePaymentMethodRequest;
import com.timora.onboarding.dto.CreateProfessionalRequest;
import com.timora.onboarding.dto.CreateServiceRequest;
import com.timora.onboarding.dto.OnboardingStateResponse;
import com.timora.onboarding.dto.UpdateBrandRequest;
import com.timora.onboarding.dto.UpdateBusinessRequest;
import com.timora.onboarding.dto.UpdateContactRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/onboarding")
public class OnboardingController {

    private final OnboardingService onboardingService;

    public OnboardingController(OnboardingService onboardingService) {
        this.onboardingService = onboardingService;
    }

    @GetMapping
    public OnboardingStateResponse getState() {
        return onboardingService.getState();
    }

    @PutMapping("/business")
    public OnboardingStateResponse updateBusiness(@Valid @RequestBody UpdateBusinessRequest request) {
        return onboardingService.updateBusiness(request);
    }

    @PutMapping("/contact")
    public OnboardingStateResponse updateContact(@Valid @RequestBody UpdateContactRequest request) {
        return onboardingService.updateContact(request);
    }

    @PutMapping("/brand")
    public OnboardingStateResponse updateBrand(@Valid @RequestBody UpdateBrandRequest request) {
        return onboardingService.updateBrand(request);
    }

    @PostMapping("/branches")
    public OnboardingStateResponse addBranch(@Valid @RequestBody CreateBranchRequest request) {
        return onboardingService.addBranch(request);
    }

    @DeleteMapping("/branches/{id}")
    public OnboardingStateResponse deleteBranch(@PathVariable Long id) {
        return onboardingService.deleteBranch(id);
    }

    @PostMapping("/professionals")
    public OnboardingStateResponse addProfessional(@Valid @RequestBody CreateProfessionalRequest request) {
        return onboardingService.addProfessional(request);
    }

    @DeleteMapping("/professionals/{id}")
    public OnboardingStateResponse deleteProfessional(@PathVariable Long id) {
        return onboardingService.deleteProfessional(id);
    }

    @PostMapping("/services")
    public OnboardingStateResponse addService(@Valid @RequestBody CreateServiceRequest request) {
        return onboardingService.addService(request);
    }

    @DeleteMapping("/services/{id}")
    public OnboardingStateResponse deleteService(@PathVariable Long id) {
        return onboardingService.deleteService(id);
    }

    @PostMapping("/payment-methods")
    public OnboardingStateResponse addPaymentMethod(@Valid @RequestBody CreatePaymentMethodRequest request) {
        return onboardingService.addPaymentMethod(request);
    }

    @DeleteMapping("/payment-methods/{id}")
    public OnboardingStateResponse deletePaymentMethod(@PathVariable Long id) {
        return onboardingService.deletePaymentMethod(id);
    }

    @PostMapping("/finish")
    public OnboardingStateResponse finish() {
        return onboardingService.finish();
    }
}
