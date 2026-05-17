import { expect, test } from "./test";

import { createUniqueCredentials } from "./helpers";

test("user can register and then log in through the UI", async ({ page }) => {
  const credentials = createUniqueCredentials();

  await page.goto("/register");

  await page.getByTestId("register-nickname").fill(credentials.nickname);
  await page.getByTestId("register-email").fill(credentials.email);
  await page.getByTestId("register-password").fill(credentials.password);
  await page.getByTestId("register-password-repeat").fill(credentials.password);
  await page.getByTestId("register-submit").click();

  await expect(page).toHaveURL(/\/draft$/);
  await expect(page.getByTestId("draft-create-session")).toBeVisible();

  await page.evaluate(() => window.localStorage.clear());
  await page.goto("/login");

  await page.getByTestId("login-email").fill(credentials.email);
  await page.getByTestId("login-password").fill(credentials.password);
  await page.getByTestId("login-submit").click();

  await expect(page).toHaveURL(/\/draft$/);
  await expect(page.getByTestId("draft-create-session")).toBeVisible();
});

test("guest is redirected from protected draft route to login page", async ({
  page,
}) => {
  await page.goto("/draft");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByTestId("login-submit")).toBeVisible();
});
