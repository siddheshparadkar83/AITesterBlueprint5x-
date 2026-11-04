package com.blueprint.vwo.pages;

import java.util.Objects;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.PlaywrightException;
import com.microsoft.playwright.options.AriaRole;

public final class LoginPage {
    private static final String LOGIN_URL = "https://app.wingify.com/#/login";
    private static final String LOGIN_ERROR = "Your email, password, IP address or location did not match";

    private final Page page;
    private final Locator emailInput;
    private final Locator passwordInput;
    private final Locator signInButton;
    private final Locator loginError;
    private final Locator rememberMeLabel;

    public LoginPage(Page page) {
        this.page = Objects.requireNonNull(page, "Page must not be null");
        this.emailInput = page.getByLabel("Email address",
                new Page.GetByLabelOptions().setExact(true))
                .filter(new Locator.FilterOptions().setVisible(true));
        this.passwordInput = page.getByPlaceholder("Enter password",
                new Page.GetByPlaceholderOptions().setExact(true));
        this.signInButton = page.getByRole(AriaRole.BUTTON,
                new Page.GetByRoleOptions().setName("Sign in").setExact(true));
        this.loginError = page.getByText(LOGIN_ERROR, new Page.GetByTextOptions().setExact(true));
        this.rememberMeLabel = page.getByText("Remember me",
                new Page.GetByTextOptions().setExact(true));
    }

    public void open() {
        try {
            page.navigate(LOGIN_URL, new Page.NavigateOptions().setWaitUntil(
                    com.microsoft.playwright.options.WaitUntilState.DOMCONTENTLOADED));
            emailInput.waitFor();
        } catch (PlaywrightException exception) {
            throw new IllegalStateException("Unable to open the VWO login page", exception);
        }
    }

    public boolean isLoginFormVisible() {
        try {
            return emailInput.isVisible()
                    && passwordInput.isVisible()
                    && signInButton.isVisible()
                    && rememberMeLabel.isVisible();
        } catch (PlaywrightException exception) {
            throw new IllegalStateException("Unable to verify the VWO login form", exception);
        }
    }

    public void enterEmail(String email) {
        try {
            emailInput.fill(email);
        } catch (PlaywrightException exception) {
            throw new IllegalStateException("Unable to enter the email address", exception);
        }
    }

    public void enterPassword(String password) {
        try {
            passwordInput.fill(password);
        } catch (PlaywrightException exception) {
            throw new IllegalStateException("Unable to enter the password", exception);
        }
    }

    public boolean isEmailFormatValid() {
        try {
            return Boolean.TRUE.equals(emailInput.evaluate(
                    "element => element.validity.valid"));
        } catch (PlaywrightException exception) {
            throw new IllegalStateException("Unable to validate the email address", exception);
        }
    }

    public void submit() {
        try {
            signInButton.click();
        } catch (PlaywrightException exception) {
            throw new IllegalStateException("Unable to submit the VWO login form", exception);
        }
    }

    public boolean isLoginErrorVisible() {
        try {
            loginError.waitFor(new Locator.WaitForOptions().setTimeout(15_000));
            return loginError.isVisible();
        } catch (PlaywrightException exception) {
            throw new IllegalStateException("Unable to verify the VWO login error", exception);
        }
    }

    public boolean isOnLoginPage() {
        try {
            return page.url().contains("#/login");
        } catch (PlaywrightException exception) {
            throw new IllegalStateException("Unable to verify the current VWO page", exception);
        }
    }

    public boolean waitForSuccessfulNavigation() {
        try {
            page.waitForURL(url -> !url.contains("#/login"),
                    new Page.WaitForURLOptions().setTimeout(30_000));
            return true;
        } catch (PlaywrightException exception) {
            throw new IllegalStateException("VWO did not navigate away from the login page", exception);
        }
    }

    public void login(String email, String password) {
        enterEmail(email);
        enterPassword(password);
        submit();
    }
}
