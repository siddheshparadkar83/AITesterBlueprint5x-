package com.blueprint.salesforce.tests;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebDriverException;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.testng.SkipException;
import org.testng.annotations.AfterTest;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.BeforeTest;
import org.testng.annotations.Test;

import com.blueprint.salesforce.pages.LoginPage;

import static org.testng.Assert.assertTrue;

public class SalesforceLoginTest {
    private static final String LOGIN_URL = "https://login.salesforce.com/?locale=in&email_login=1";

    private WebDriver driver;
    private LoginPage loginPage;

    @BeforeTest(alwaysRun = true)
    public void setUpBrowser() {
        try {
            ChromeOptions options = new ChromeOptions();
            options.addArguments("--window-size=1440,1000");
            if (Boolean.parseBoolean(System.getProperty("headless", "false"))) {
                options.addArguments("--headless=new");
            }
            driver = new ChromeDriver(options);
            loginPage = new LoginPage(driver);
        } catch (WebDriverException exception) {
            throw new IllegalStateException("Unable to start Chrome for the Salesforce tests", exception);
        }
    }

    @BeforeMethod(alwaysRun = true)
    public void openLoginPage() {
        loginPage.open(LOGIN_URL);
    }

    @Test(description = "Verify the email login controls and Remember Me default state")
    public void loginPageDisplaysExpectedControls() {
        assertTrue(loginPage.isLoginFormDisplayed(), "Expected email login controls were not displayed");
        assertTrue(loginPage.isRememberMeSelected(), "Remember Me should be selected by default");
    }

    @Test(description = "Reject an invalid email address before submitting the login form")
    public void invalidEmailIsRejectedByTheLoginForm() {
        loginPage.enterEmail("not-an-email");
        loginPage.submitEmail();

        assertTrue(loginPage.isEmailInputInvalid(), "The form should mark the malformed email as invalid");
        assertTrue(loginPage.isLoginFormDisplayed(), "The email login form should remain visible after validation");
    }

    @Test(description = "Log in with configured valid Salesforce credentials")
    public void validCredentialsCanLogIn() {
        String email = System.getenv("SALESFORCE_USERNAME");
        String password = System.getenv("SALESFORCE_PASSWORD");
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            throw new SkipException(
                    "Set SALESFORCE_USERNAME and SALESFORCE_PASSWORD in the local environment to run this test");
        }

        loginPage.login(email, password);
        assertTrue(loginPage.hasNavigatedAwayFromLogin(),
                "Expected Salesforce to navigate away from the login page after successful authentication");
    }

    @AfterTest(alwaysRun = true)
    public void tearDownBrowser() {
        if (driver != null) {
            try {
                driver.quit();
            } catch (WebDriverException exception) {
                throw new IllegalStateException("Unable to close the Chrome browser", exception);
            }
        }
    }
}
