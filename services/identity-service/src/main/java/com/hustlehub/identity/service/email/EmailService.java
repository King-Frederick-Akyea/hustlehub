package com.hustlehub.identity.service.email;

import com.hustlehub.identity.entity.User;

public interface EmailService {

    void sendVerificationCode(User user, String code);

    void sendPasswordResetToken(User user, String token);
}
