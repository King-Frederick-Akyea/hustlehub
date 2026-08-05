package com.hustlehub.identity.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** The single hardcoded admin login (no admin_users table) - see AdminAuthController. Both values have no default on purpose, same reasoning as JWT_SECRET/INTERNAL_API_KEY. */
@ConfigurationProperties(prefix = "app.admin")
public class AdminProperties {

    private String username;
    private String password;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
