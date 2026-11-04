package com.blueprint.salesforce.pages;

import java.time.Duration;
import java.util.Objects;

import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebDriverException;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public final class LoginPage {
    private final WebDriver driver;
    private final WebDriverWait wait;

    @FindBy(xpath = "//input[@type='email']")
    private WebElement emailInput;

    @FindBy(xpath = "//input[@type='password']")
    private WebElement passwordInput;

    @FindBy(xpath = "//input[@type='checkbox']")
    private WebElement rememberMeCheckbox;

    @FindBy(xpath = "//button[normalize-space()='Continue']")
    private WebElement continueButton;

    @FindBy(xpath = "//button[normalize-space()='Log In' or normalize-space()='Continue']")
    private WebElement passwordSubmitButton;

    @FindBy(xpath = "//a[normalize-space()='Log In with Username']")
    private WebElement usernameLoginLink;

    public LoginPage(WebDriver driver) {
        this.driver = Objects.requireNonNull(driver, "WebDriver must not be null");
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(20));
        PageFactory.initElements(driver, this);
    }

    public void open(String url) {
        try {
            driver.get(url);
            wait.until(ExpectedConditions.visibilityOf(emailInput));
        } catch (WebDriverException exception) {
            throw new IllegalStateException("Unable to open the Salesforce email login page", exception);
        }
    }

    public boolean isLoginFormDisplayed() {
        try {
            return wait.until(ExpectedConditions.visibilityOf(emailInput)).isDisplayed()
                    && rememberMeCheckbox.isDisplayed()
                    && continueButton.isDisplayed()
                    && usernameLoginLink.isDisplayed();
        } catch (WebDriverException exception) {
            throw new IllegalStateException("Unable to verify the Salesforce login form", exception);
        }
    }

    public boolean isRememberMeSelected() {
        try {
            return rememberMeCheckbox.isSelected();
        } catch (WebDriverException exception) {
            throw new IllegalStateException("Unable to read the Remember Me control state", exception);
        }
    }

    public void enterEmail(String email) {
        try {
            WebElement field = wait.until(ExpectedConditions.visibilityOf(emailInput));
            field.clear();
            field.sendKeys(email);
        } catch (WebDriverException exception) {
            throw new IllegalStateException("Unable to enter the email address", exception);
        }
    }

    public void submitEmail() {
        try {
            wait.until(ExpectedConditions.elementToBeClickable(continueButton)).click();
        } catch (WebDriverException exception) {
            throw new IllegalStateException("Unable to continue from the email login step", exception);
        }
    }

    public boolean isEmailInputInvalid() {
        try {
            wait.until(ExpectedConditions.visibilityOf(emailInput));
            boolean browserMarksInputInvalid = Boolean.TRUE.equals(((JavascriptExecutor) driver)
                    .executeScript("return arguments[0].validity.valid === false;", emailInput));
            return browserMarksInputInvalid || "true".equalsIgnoreCase(emailInput.getAttribute("aria-invalid"));
        } catch (WebDriverException exception) {
            throw new IllegalStateException("Unable to validate the email input state", exception);
        }
    }

    public void login(String email, String password) {
        try {
            enterEmail(email);
            submitEmail();
            wait.until(ExpectedConditions.visibilityOf(passwordInput)).sendKeys(password);
            wait.until(ExpectedConditions.elementToBeClickable(passwordSubmitButton)).click();
        } catch (WebDriverException exception) {
            throw new IllegalStateException("Unable to complete the Salesforce login flow", exception);
        }
    }

    public boolean hasNavigatedAwayFromLogin() {
        try {
            wait.until(driver -> !driver.getCurrentUrl().contains("login.salesforce.com"));
            return true;
        } catch (org.openqa.selenium.TimeoutException exception) {
            return false;
        } catch (WebDriverException exception) {
            throw new IllegalStateException("Unable to verify the Salesforce login result", exception);
        }
    }
}
