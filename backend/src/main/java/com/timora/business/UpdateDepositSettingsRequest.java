package com.timora.business;

import java.math.BigDecimal;

public record UpdateDepositSettingsRequest(
        boolean depositEnabled,
        DepositType depositType,
        BigDecimal depositAmount
) {
}
