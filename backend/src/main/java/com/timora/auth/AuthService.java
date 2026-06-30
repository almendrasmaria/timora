package com.timora.auth;

import com.timora.auth.dto.AuthResponse;
import com.timora.auth.dto.LoginRequest;
import com.timora.auth.dto.RegisterRequest;
import com.timora.business.Business;
import com.timora.business.BusinessRepository;
import com.timora.common.SlugUtils;
import com.timora.user.AppUser;
import com.timora.user.AppUserRepository;
import com.timora.user.UserRole;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final BusinessRepository businessRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            AppUserRepository appUserRepository,
            BusinessRepository businessRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.appUserRepository = appUserRepository;
        this.businessRepository = businessRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();

        if (appUserRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una cuenta con ese email");
        }

        Business business = new Business();
        business.setName(defaultBusinessName(email));
        business.setSlug(generateUniqueSlug(email));
        businessRepository.save(business);

        AppUser user = new AppUser();
        user.setBusiness(business);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(UserRole.OWNER);
        appUserRepository.save(user);

        return buildAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase();

        AppUser user = appUserRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email o contraseña incorrectos"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email o contraseña incorrectos");
        }

        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(AppUser user) {
        String token = jwtService.generateToken(user);
        Business business = user.getBusiness();
        return AuthResponse.of(token, user.getEmail(), business.getId(), business.getSlug());
    }

    private String defaultBusinessName(String email) {
        String localPart = email.substring(0, email.indexOf('@'));
        return localPart.isBlank() ? "Mi negocio" : localPart;
    }

    private String generateUniqueSlug(String email) {
        String localPart = email.substring(0, email.indexOf('@'));
        String base = SlugUtils.slugify(localPart);
        return SlugUtils.uniqueSlug(base, businessRepository::existsBySlug);
    }
}
