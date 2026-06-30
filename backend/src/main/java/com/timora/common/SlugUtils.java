package com.timora.common;

import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

public final class SlugUtils {

    private static final Pattern NON_SLUG_CHARS = Pattern.compile("[^a-z0-9]+");
    private static final Pattern DUPLICATE_HYPHENS = Pattern.compile("-{2,}");

    private SlugUtils() {
    }

    public static String slugify(String value) {
        String normalized = NON_SLUG_CHARS.matcher(value.toLowerCase(Locale.ROOT).trim()).replaceAll("-");
        normalized = DUPLICATE_HYPHENS.matcher(normalized).replaceAll("-");
        normalized = normalized.replaceAll("^-|-$", "");
        return normalized.isBlank() ? "negocio" : normalized;
    }

    public static String uniqueSlug(String base, SlugAvailabilityChecker checker) {
        String candidate = truncate(base, 60);
        if (!checker.exists(candidate)) {
            return candidate;
        }

        String suffix = UUID.randomUUID().toString().substring(0, 8);
        candidate = truncate(base, 60 - suffix.length() - 1) + "-" + suffix;
        return candidate;
    }

    private static String truncate(String value, int maxLength) {
        if (value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength).replaceAll("-$", "");
    }

    @FunctionalInterface
    public interface SlugAvailabilityChecker {
        boolean exists(String slug);
    }
}
