package com.timora.onboarding;

import com.timora.business.Branch;
import com.timora.business.BranchRepository;
import com.timora.business.Business;
import com.timora.business.BusinessCategory;
import com.timora.business.BusinessRepository;
import com.timora.business.PaymentMethod;
import com.timora.business.PaymentMethodRepository;
import com.timora.business.Professional;
import com.timora.business.ProfessionalRepository;
import com.timora.business.ServiceOffering;
import com.timora.business.ServiceOfferingRepository;
import com.timora.common.SlugUtils;
import com.timora.onboarding.dto.CreateBranchRequest;
import com.timora.onboarding.dto.CreatePaymentMethodRequest;
import com.timora.onboarding.dto.CreateProfessionalRequest;
import com.timora.onboarding.dto.CreateServiceRequest;
import com.timora.onboarding.dto.OnboardingStateResponse;
import com.timora.onboarding.dto.UpdateBrandRequest;
import com.timora.onboarding.dto.UpdateBusinessRequest;
import com.timora.onboarding.dto.UpdateContactRequest;
import com.timora.user.AppUser;
import com.timora.user.CurrentUserService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class OnboardingService {

    private final CurrentUserService currentUserService;
    private final BusinessRepository businessRepository;
    private final BranchRepository branchRepository;
    private final ProfessionalRepository professionalRepository;
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final PaymentMethodRepository paymentMethodRepository;

    public OnboardingService(
            CurrentUserService currentUserService,
            BusinessRepository businessRepository,
            BranchRepository branchRepository,
            ProfessionalRepository professionalRepository,
            ServiceOfferingRepository serviceOfferingRepository,
            PaymentMethodRepository paymentMethodRepository
    ) {
        this.currentUserService = currentUserService;
        this.businessRepository = businessRepository;
        this.branchRepository = branchRepository;
        this.professionalRepository = professionalRepository;
        this.serviceOfferingRepository = serviceOfferingRepository;
        this.paymentMethodRepository = paymentMethodRepository;
    }

    @Transactional(readOnly = true)
    public OnboardingStateResponse getState() {
        Business business = requireBusiness();
        return buildState(business);
    }

    @Transactional
    public OnboardingStateResponse updateBusiness(UpdateBusinessRequest request) {
        Business business = requireBusiness();
        business.setName(request.name().trim());
        business.setCategory(request.category());
        business.setSpecialty(requiresSpecialty(request.category())
                ? normalizeOptional(request.specialty())
                : null);

        if (requiresSpecialty(request.category()) && business.getSpecialty() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Elegí una especialidad");
        }

        business.setOnboardingStep(Math.max(business.getOnboardingStep(), 2));
        return buildState(business);
    }

    @Transactional
    public OnboardingStateResponse updateContact(UpdateContactRequest request) {
        Business business = requireBusiness();
        business.setWhatsapp(request.whatsapp().trim());
        business.setInstagram(normalizeOptional(request.instagram()));
        business.setOnboardingStep(Math.max(business.getOnboardingStep(), 3));
        return buildState(business);
    }

    @Transactional
    public OnboardingStateResponse updateBrand(UpdateBrandRequest request) {
        Business business = requireBusiness();
        String slug = SlugUtils.slugify(request.slug());

        if (slug.length() < 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El link debe tener al menos 3 caracteres");
        }

        if (!slug.equals(business.getSlug()) && businessRepository.existsBySlug(slug)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ese link ya está en uso");
        }

        business.setSlug(slug);
        business.setBrandColor(normalizeOptional(request.brandColor()));
        business.setOnboardingStep(Math.max(business.getOnboardingStep(), 4));
        return buildState(business);
    }

    @Transactional
    public OnboardingStateResponse addBranch(CreateBranchRequest request) {
        Business business = requireBusiness();
        Branch branch = new Branch();
        branch.setBusiness(business);
        branch.setName(request.name().trim());
        branch.setAddress(request.address().trim());
        branchRepository.save(branch);
        business.setOnboardingStep(Math.max(business.getOnboardingStep(), 5));
        return buildState(business);
    }

    @Transactional
    public OnboardingStateResponse deleteBranch(Long branchId) {
        Business business = requireBusiness();
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (!branch.getBusiness().getId().equals(business.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        branchRepository.delete(branch);
        return buildState(business);
    }

    @Transactional
    public OnboardingStateResponse addProfessional(CreateProfessionalRequest request) {
        Business business = requireBusiness();
        Professional professional = new Professional();
        professional.setBusiness(business);
        professional.setFirstName(request.firstName().trim());
        professional.setLastName(request.lastName().trim());
        professional.setAvailabilityJson(normalizeOptional(request.availabilityJson()));

        java.util.Set<Branch> branches = new java.util.HashSet<>();
        if (request.branchIds() != null) {
            for (Long branchId : request.branchIds()) {
                Branch branch = branchRepository.findById(branchId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Branch not found"));
                if (!branch.getBusiness().getId().equals(business.getId())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Branch does not belong to business");
                }
                branches.add(branch);
            }
        }
        professional.setBranches(branches);

        professionalRepository.save(professional);
        business.setOnboardingStep(Math.max(business.getOnboardingStep(), 6));
        return buildState(business);
    }

    @Transactional
    public OnboardingStateResponse deleteProfessional(Long professionalId) {
        Business business = requireBusiness();
        Professional professional = professionalRepository.findById(professionalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (!professional.getBusiness().getId().equals(business.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        professionalRepository.delete(professional);
        return buildState(business);
    }

    @Transactional
    public OnboardingStateResponse addService(CreateServiceRequest request) {
        Business business = requireBusiness();
        ServiceOffering service = new ServiceOffering();
        service.setBusiness(business);
        service.setName(request.name().trim());
        service.setDurationMinutes(request.durationMinutes());
        service.setPrice(request.price());
        service.setDepositAmount(request.depositAmount());
        serviceOfferingRepository.save(service);
        business.setOnboardingStep(Math.max(business.getOnboardingStep(), 7));
        return buildState(business);
    }

    @Transactional
    public OnboardingStateResponse deleteService(Long serviceId) {
        Business business = requireBusiness();
        ServiceOffering service = serviceOfferingRepository.findById(serviceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (!service.getBusiness().getId().equals(business.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        serviceOfferingRepository.delete(service);
        return buildState(business);
    }

    @Transactional
    public OnboardingStateResponse addPaymentMethod(CreatePaymentMethodRequest request) {
        Business business = requireBusiness();

        if (paymentMethodRepository.findByBusinessIdOrderByIdAsc(business.getId()).stream()
                .anyMatch(method -> method.getType() == request.type())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Esa forma de cobro ya está agregada");
        }

        PaymentMethod paymentMethod = new PaymentMethod();
        paymentMethod.setBusiness(business);
        paymentMethod.setType(request.type());
        paymentMethodRepository.save(paymentMethod);
        return buildState(business);
    }

    @Transactional
    public OnboardingStateResponse deletePaymentMethod(Long paymentMethodId) {
        Business business = requireBusiness();
        PaymentMethod paymentMethod = paymentMethodRepository.findById(paymentMethodId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (!paymentMethod.getBusiness().getId().equals(business.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        paymentMethodRepository.delete(paymentMethod);
        return buildState(business);
    }

    @Transactional
    public OnboardingStateResponse finish() {
        Business business = requireBusiness();
        validateReadyToFinish(business);
        business.setOnboardingCompleted(true);
        return buildState(business);
    }

    @Transactional
    public OnboardingStateResponse updateBranch(Long id, CreateBranchRequest request) {
        Business business = requireBusiness();
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sucursal no encontrada"));

        if (!branch.getBusiness().getId().equals(business.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tenés permiso para editar esta sucursal");
        }

        branch.setName(request.name().trim());
        branch.setAddress(request.address().trim());
        branchRepository.save(branch);
        return buildState(business);
    }

    @Transactional
    public OnboardingStateResponse updateProfessional(Long id, CreateProfessionalRequest request) {
        Business business = requireBusiness();
        Professional professional = professionalRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profesional no encontrado"));

        if (!professional.getBusiness().getId().equals(business.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tenés permiso para editar este profesional");
        }

        professional.setFirstName(request.firstName().trim());
        professional.setLastName(request.lastName().trim());
        professional.setAvailabilityJson(normalizeOptional(request.availabilityJson()));

        java.util.Set<Branch> branches = new java.util.HashSet<>();
        if (request.branchIds() != null) {
            for (Long branchId : request.branchIds()) {
                Branch branch = branchRepository.findById(branchId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Branch not found"));
                if (!branch.getBusiness().getId().equals(business.getId())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Branch does not belong to business");
                }
                branches.add(branch);
            }
        }
        professional.setBranches(branches);

        professionalRepository.save(professional);
        return buildState(business);
    }

    @Transactional
    public OnboardingStateResponse updateService(Long id, CreateServiceRequest request) {
        Business business = requireBusiness();
        ServiceOffering service = serviceOfferingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Servicio no encontrado"));

        if (!service.getBusiness().getId().equals(business.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tenés permiso para editar este servicio");
        }

        service.setName(request.name().trim());
        service.setDurationMinutes(request.durationMinutes());
        service.setPrice(request.price());
        service.setDepositAmount(request.depositAmount());
        serviceOfferingRepository.save(service);
        return buildState(business);
    }

    private void validateReadyToFinish(Business business) {
        Long businessId = business.getId();

        if (business.getName() == null || business.getName().isBlank() || business.getCategory() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Completá los datos de tu negocio");
        }
        if (business.getWhatsapp() == null || business.getWhatsapp().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Agregá un WhatsApp de contacto");
        }
        if (business.getSlug() == null || business.getSlug().startsWith("tmp-")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Configurá tu link público");
        }
        if (branchRepository.countByBusinessId(businessId) < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Agregá al menos una sucursal");
        }
        if (professionalRepository.countByBusinessId(businessId) < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Agregá al menos un profesional");
        }
        if (serviceOfferingRepository.countByBusinessId(businessId) < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Agregá al menos un servicio");
        }
        if (paymentMethodRepository.countByBusinessId(businessId) < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Agregá al menos una forma de cobro");
        }
    }

    private Business requireBusiness() {
        AppUser user = currentUserService.requireCurrentUser();
        return user.getBusiness();
    }

    private OnboardingStateResponse buildState(Business business) {
        Long businessId = business.getId();

        List<OnboardingStateResponse.BranchState> branches = branchRepository.findByBusinessIdOrderByIdAsc(businessId)
                .stream()
                .map(branch -> new OnboardingStateResponse.BranchState(branch.getId(), branch.getName(), branch.getAddress()))
                .toList();

        List<OnboardingStateResponse.ProfessionalState> professionals =
                professionalRepository.findByBusinessIdOrderByIdAsc(businessId).stream()
                        .map(pro -> new OnboardingStateResponse.ProfessionalState(
                                pro.getId(),
                                pro.getFirstName(),
                                pro.getLastName(),
                                pro.getAvailabilityJson(),
                                pro.getBranches().stream().map(Branch::getId).toList()))
                        .toList();

        List<OnboardingStateResponse.ServiceState> services =
                serviceOfferingRepository.findByBusinessIdOrderByIdAsc(businessId).stream()
                        .map(service -> new OnboardingStateResponse.ServiceState(
                                service.getId(),
                                service.getName(),
                                service.getDurationMinutes(),
                                service.getPrice(),
                                service.getDepositAmount()))
                        .toList();

        List<OnboardingStateResponse.PaymentMethodState> paymentMethods =
                paymentMethodRepository.findByBusinessIdOrderByIdAsc(businessId).stream()
                        .map(method -> new OnboardingStateResponse.PaymentMethodState(method.getId(), method.getType()))
                        .toList();

        return new OnboardingStateResponse(
                business.isOnboardingCompleted(),
                business.getOnboardingStep(),
                new OnboardingStateResponse.BusinessState(
                        business.getName(),
                        business.getCategory(),
                        business.getSpecialty(),
                        business.getWhatsapp(),
                        business.getInstagram(),
                        business.getSlug(),
                        business.getBrandColor(),
                        business.getLogoUrl(),
                        business.isShowWhatsappToClients(),
                        business.getReminderTemplate(),
                        business.getBioLinkText(),
                        business.isBioShowBooking(),
                        business.isBioShowLocation(),
                        business.isBioShowWhatsapp(),
                        business.isDepositEnabled(),
                        business.getDepositType(),
                        business.getDepositAmount()),
                branches,
                professionals,
                services,
                paymentMethods
        );
    }

    private boolean requiresSpecialty(BusinessCategory category) {
        return category == BusinessCategory.ESTETICA
                || category == BusinessCategory.SALUD
                || category == BusinessCategory.SERVICIOS;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
