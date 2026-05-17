import { expect, test } from "./test";

import { addAuthSession, registerAccountByApi } from "./helpers";

test("authenticated user can create draft session and pick a player", async ({
  page,
  request,
}) => {
  const account = await registerAccountByApi(request);
  await addAuthSession(page, account.auth);

  await page.goto("/draft");

  await expect(page.getByTestId("draft-create-session")).toBeVisible();
  await page.getByTestId("formation-4-3-3").click();
  await page.getByTestId("draft-create-session").click();

  await expect(page.getByTestId("draft-slot-1")).toBeVisible();
  await page.getByTestId("draft-slot-1").click();

  await expect(page.getByTestId("pick-drawer")).toBeVisible();
  await expect(page.getByTestId("pick-option").first()).toBeVisible();
  await page.getByTestId("pick-option").first().click();

  await expect(page.getByTestId("draft-rating")).not.toHaveText("0");
});
