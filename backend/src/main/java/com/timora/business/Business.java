package com.timora.business;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "businesses")
public class Business {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 80, unique = true)
    private String slug;

    @Enumerated(EnumType.STRING)
    @Column(length = 32)
    private BusinessCategory category;

    @Column(length = 32)
    private String whatsapp;

    @Column(length = 80)
    private String instagram;

    @Column(name = "brand_color", length = 32)
    private String brandColor;

    @Column(length = 80)
    private String specialty;

    @Column(name = "logo_url", length = 255)
    private String logoUrl;

    @Column(name = "show_whatsapp_to_clients", nullable = false)
    private boolean showWhatsappToClients = true;

    @Column(name = "reminder_template", length = 500)
    private String reminderTemplate;

    @Column(name = "onboarding_step", nullable = false)
    private int onboardingStep = 1;

    @Column(name = "onboarding_completed", nullable = false)
    private boolean onboardingCompleted = false;

    @Column(name = "bio_link_text", length = 280)
    private String bioLinkText;

    @Column(name = "bio_show_booking", nullable = false)
    private boolean bioShowBooking = true;

    @Column(name = "bio_show_location", nullable = false)
    private boolean bioShowLocation = true;

    @Column(name = "bio_show_whatsapp", nullable = false)
    private boolean bioShowWhatsapp = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public BusinessCategory getCategory() {
        return category;
    }

    public void setCategory(BusinessCategory category) {
        this.category = category;
    }

    public String getWhatsapp() {
        return whatsapp;
    }

    public void setWhatsapp(String whatsapp) {
        this.whatsapp = whatsapp;
    }

    public String getInstagram() {
        return instagram;
    }

    public void setInstagram(String instagram) {
        this.instagram = instagram;
    }

    public String getBrandColor() {
        return brandColor;
    }

    public void setBrandColor(String brandColor) {
        this.brandColor = brandColor;
    }

    public String getSpecialty() {
        return specialty;
    }

    public void setSpecialty(String specialty) {
        this.specialty = specialty;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }

    public boolean isShowWhatsappToClients() {
        return showWhatsappToClients;
    }

    public void setShowWhatsappToClients(boolean showWhatsappToClients) {
        this.showWhatsappToClients = showWhatsappToClients;
    }

    public String getReminderTemplate() {
        return reminderTemplate;
    }

    public void setReminderTemplate(String reminderTemplate) {
        this.reminderTemplate = reminderTemplate;
    }

    public int getOnboardingStep() {
        return onboardingStep;
    }

    public void setOnboardingStep(int onboardingStep) {
        this.onboardingStep = onboardingStep;
    }

    public boolean isOnboardingCompleted() {
        return onboardingCompleted;
    }

    public void setOnboardingCompleted(boolean onboardingCompleted) {
        this.onboardingCompleted = onboardingCompleted;
    }

    public String getBioLinkText() {
        return bioLinkText;
    }

    public void setBioLinkText(String bioLinkText) {
        this.bioLinkText = bioLinkText;
    }

    public boolean isBioShowBooking() {
        return bioShowBooking;
    }

    public void setBioShowBooking(boolean bioShowBooking) {
        this.bioShowBooking = bioShowBooking;
    }

    public boolean isBioShowLocation() {
        return bioShowLocation;
    }

    public void setBioShowLocation(boolean bioShowLocation) {
        this.bioShowLocation = bioShowLocation;
    }

    public boolean isBioShowWhatsapp() {
        return bioShowWhatsapp;
    }

    public void setBioShowWhatsapp(boolean bioShowWhatsapp) {
        this.bioShowWhatsapp = bioShowWhatsapp;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
