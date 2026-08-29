package com.timora.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender mailSender;
    private final String fromAddress;

    public MailService(JavaMailSender mailSender, @Value("${timora.mail.from}") String fromAddress) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
    }

    public void sendPasswordResetEmail(String to, String resetLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(to);
        message.setSubject("Restablecé tu contraseña en Timora");
        message.setText("""
                Recibimos una solicitud para restablecer tu contraseña.

                Hacé clic en el siguiente enlace para elegir una nueva contraseña (válido por 30 minutos):
                %s

                Si vos no solicitaste este cambio, podés ignorar este mensaje.
                """.formatted(resetLink));

        try {
            mailSender.send(message);
        } catch (MailException ex) {
            log.error("No se pudo enviar el email de restablecimiento de contraseña a {}", to, ex);
        }
    }
}
