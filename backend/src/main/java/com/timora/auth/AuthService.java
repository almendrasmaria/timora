package com.timora.auth;

import com.timora.auth.dto.AuthResponse;
import com.timora.auth.dto.ForgotPasswordRequest;
import com.timora.auth.dto.LoginRequest;
import com.timora.auth.dto.RegisterRequest;
import com.timora.auth.dto.ResetPasswordRequest;
import com.timora.business.Business;
import com.timora.business.BusinessRepository;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;
import com.timora.user.AppUser;
import com.timora.user.AppUserRepository;
import com.timora.user.UserRole;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;

@Service
public class AuthService {

    private static final int RESET_TOKEN_TTL_MINUTES = 30;

    private final AppUserRepository appUserRepository;
    private final BusinessRepository businessRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final MailService mailService;
    private final String frontendBaseUrl;

    public AuthService(
            AppUserRepository appUserRepository,
            BusinessRepository businessRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            PasswordResetTokenRepository passwordResetTokenRepository,
            MailService mailService,
            @Value("${timora.frontend.base-url}") String frontendBaseUrl
    ) {
        this.appUserRepository = appUserRepository;
        this.businessRepository = businessRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.mailService = mailService;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();

        if (appUserRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una cuenta con ese email");
        }

        Business business = new Business();
        business.setName("Mi negocio");
        business.setSlug("tmp-" + UUID.randomUUID().toString().substring(0, 8));
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

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        String email = request.email().trim().toLowerCase();

        appUserRepository.findByEmailIgnoreCase(email).ifPresent(user -> {
            passwordResetTokenRepository.deleteByUserAndUsedAtIsNull(user);

            String rawToken = generateSecureToken();

            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setUser(user);
            resetToken.setTokenHash(hashToken(rawToken));
            resetToken.setExpiresAt(Instant.now().plus(RESET_TOKEN_TTL_MINUTES, ChronoUnit.MINUTES));
            passwordResetTokenRepository.save(resetToken);

            String resetLink = frontendBaseUrl + "/auth/reset-password?token=" + rawToken;
            mailService.sendPasswordResetEmail(user.getEmail(), resetLink);
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String tokenHash = hashToken(request.token());

        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "El enlace no es válido o expiró"));

        if (resetToken.getUsedAt() != null || resetToken.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El enlace no es válido o expiró");
        }

        AppUser user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        appUserRepository.save(user);

        resetToken.setUsedAt(Instant.now());
        passwordResetTokenRepository.save(resetToken);
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 not available", ex);
        }
    }

    private AuthResponse buildAuthResponse(AppUser user) {
        String token = jwtService.generateToken(user);
        Business business = user.getBusiness();
        return AuthResponse.of(
                token,
                user.getEmail(),
                business.getId(),
                business.getSlug(),
                business.isOnboardingCompleted(),
                business.getOnboardingStep()
        );
    }
}
