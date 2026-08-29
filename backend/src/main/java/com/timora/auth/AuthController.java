package com.timora.auth;

import com.timora.auth.dto.AuthResponse;
import com.timora.auth.dto.ForgotPasswordRequest;
import com.timora.auth.dto.GoogleAuthRequest;
import com.timora.auth.dto.LoginRequest;
import com.timora.auth.dto.RegisterRequest;
import com.timora.auth.dto.ResetPasswordRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/google")
    public AuthResponse google(@Valid @RequestBody GoogleAuthRequest request) {
        return authService.loginOrRegisterWithGoogle(request);
    }

    @PostMapping("/forgot-password")
    @ResponseStatus(HttpStatus.OK)
    public void forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
    }

    @PostMapping("/reset-password")
    @ResponseStatus(HttpStatus.OK)
    public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
    }
}
