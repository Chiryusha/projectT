import { expect, test } from "./test";

import {
  addAuthSession,
  createCompletedDraftByApi,
  registerAccountByApi,
  saveSquadByApi,
} from "./helpers";

test("saved squad is visible on lineups page", async ({ page, request }) => {
  const account = await registerAccountByApi(request);
  const sessionState = await createCompletedDraftByApi(request, account.auth);
  const squadName = `E2E saved squad ${Date.now()}`;

  await saveSquadByApi(request, account.auth, sessionState.session.id, squadName);
  await addAuthSession(page, account.auth);

  await page.goto("/lineups");

  await expect(page.getByTestId("lineups-page")).toBeVisible();
  await expect(page.getByTestId("saved-squad-card").first()).toContainText(
    squadName,
  );
  await expect(page.getByTestId("saved-squad-preview")).toBeVisible();
});
