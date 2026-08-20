package com.timora.business;

import com.timora.common.FileStorageService;
import com.timora.user.AppUser;
import com.timora.user.CurrentUserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class BusinessConfigService {

    private final BusinessRepository businessRepository;
    private final CurrentUserService currentUserService;
    private final FileStorageService fileStorageService;

    public BusinessConfigService(
            BusinessRepository businessRepository,
            CurrentUserService currentUserService,
            FileStorageService fileStorageService) {
        this.businessRepository = businessRepository;
        this.currentUserService = currentUserService;
        this.fileStorageService = fileStorageService;
    }

    @Transactional
    public Business updateSettings(UpdateSettingsRequest request) {
        AppUser user = currentUserService.requireCurrentUser();
        Business business = user.getBusiness();
        
        if (business == null) {
            throw new IllegalStateException("User does not have a business");
        }

        business.setName(request.name());
        business.setWhatsapp(request.whatsapp());
        business.setInstagram(request.instagram());
        business.setBrandColor(request.brandColor());
        business.setShowWhatsappToClients(request.showWhatsappToClients());
        business.setReminderTemplate(request.reminderTemplate());
        business.setBioLinkText(request.bioLinkText());
        business.setBioShowBooking(request.bioShowBooking());
        business.setBioShowLocation(request.bioShowLocation());
        business.setBioShowWhatsapp(request.bioShowWhatsapp());
        
        return businessRepository.save(business);
    }

    @Transactional
    public Business updateDepositSettings(UpdateDepositSettingsRequest request) {
        AppUser user = currentUserService.requireCurrentUser();
        Business business = user.getBusiness();

        if (business == null) {
            throw new IllegalStateException("User does not have a business");
        }

        business.setDepositEnabled(request.depositEnabled());
        business.setDepositType(request.depositType());
        business.setDepositAmount(request.depositAmount());

        return businessRepository.save(business);
    }

    @Transactional
    public Business uploadLogo(MultipartFile file) {
        AppUser user = currentUserService.requireCurrentUser();
        Business business = user.getBusiness();
        
        if (business == null) {
            throw new IllegalStateException("User does not have a business");
        }

        String url = fileStorageService.storeFile(file);
        business.setLogoUrl(url);
        return businessRepository.save(business);
    }
}
