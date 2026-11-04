package com.blueprint.vwo.tests;

import java.util.Locale;

import org.testng.annotations.AfterTest;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.BeforeTest;

import com.blueprint.vwo.pages.LoginPage;
import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import com.microsoft.playwright.PlaywrightException;
import org.testng.annotations.AfterMethod;

public abstract class login {
    protected Playwright playwright;
    protected Browser browser;
    protected Page page;
    protected LoginPage loginPage;

    @BeforeTest(alwaysRun = true)
    public void startBrowser() {
        try {
            playwright = Playwright.create();
            BrowserType browserType = switch (
                    System.getProperty("browser", "chromium").toLowerCase(Locale.ROOT)) {
                case "chromium" -> playwright.chromium();
                case "firefox" -> playwright.firefox();
                case "webkit" -> playwright.webkit();
                default -> throw new IllegalArgumentException(
                        "Unsupported browser. Choose chromium, firefox, or webkit.");
            };
            boolean headless = Boolean.parseBoolean(System.getProperty("headless", "false"));
            browser = browserType.launch(new BrowserType.LaunchOptions().setHeadless(headless));
        } catch (PlaywrightException | IllegalArgumentException exception) {
            if (playwright != null) {
                playwright.close();
            }
            throw new IllegalStateException("Unable to start the selected Playwright browser", exception);
        }
    }

    @BeforeMethod(alwaysRun = true)
    public void openLoginPage() {
        try {
            page = browser.newPage();
            loginPage = new LoginPage(page);
            loginPage.open();
        } catch (PlaywrightException | IllegalStateException exception) {
            throw new IllegalStateException("Unable to prepare the VWO login test", exception);
        }
    }

    @AfterMethod(alwaysRun = true)
    public void closePage() {
        if (page != null && !page.isClosed()) {
            try {
                page.close();
            } catch (PlaywrightException exception) {
                throw new IllegalStateException("Unable to close the VWO test page", exception);
            }
        }
    }

    @AfterTest(alwaysRun = true)
    public void closeBrowser() {
        if (playwright != null) {
            try {
                playwright.close();
            } catch (PlaywrightException exception) {
                throw new IllegalStateException("Unable to close the Playwright browser", exception);
            }
        }
    }
}
