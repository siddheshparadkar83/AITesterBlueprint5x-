package com.blueprint.vwo.tests;

import org.testng.SkipException;
import org.testng.annotations.Test;

import static org.testng.Assert.assertTrue;

public final class LoginValidTest extends login {
    @Test(description = "Verify the VWO login form and log in with configured valid credentials")
    public void validLogin() {
        assertTrue(loginPage.isLoginFormVisible(), "Expected login controls were not visible");

        String email = System.getenv("VWO_EMAIL");
        String password = System.getenv("VWO_PASSWORD");
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            throw new SkipException("Set VWO_EMAIL and VWO_PASSWORD to run the valid-login test");
        }

        loginPage.login(email, password);
        assertTrue(loginPage.waitForSuccessfulNavigation(),
                "A successful login should navigate away from the VWO login page");
    }
}
