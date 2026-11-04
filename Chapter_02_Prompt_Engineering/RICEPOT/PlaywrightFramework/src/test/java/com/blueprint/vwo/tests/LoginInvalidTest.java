package com.blueprint.vwo.tests;

import org.testng.annotations.Test;

import static org.testng.Assert.assertFalse;
import static org.testng.Assert.assertTrue;

public final class LoginInvalidTest extends login {
    @Test(description = "Reject an email address with an invalid format")
    public void malformedEmailIsRejected() {
        loginPage.enterEmail("not-an-email");
        loginPage.enterPassword("invalid-password");

        assertFalse(loginPage.isEmailFormatValid(), "Malformed email should fail browser email validation");
        loginPage.submit();
        assertTrue(loginPage.isOnLoginPage(), "Malformed email must not navigate away from login");
    }

    @Test(description = "Display the observed authentication error for an empty login submission")
    public void emptyCredentialsAreRejected() {
        loginPage.submit();

        assertTrue(loginPage.isLoginErrorVisible(),
                "The observed invalid-login message should be displayed");
        assertTrue(loginPage.isOnLoginPage(), "Invalid credentials must remain on the login page");
    }
}
