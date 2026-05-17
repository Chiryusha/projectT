import { expect, test } from "./test";

import {
  addAuthSession,
  createCompletedDraftByApi,
  registerAccountByApi,
  startTournamentByApi,
} from "./helpers";

test("started tournament opens bracket and first match", async ({ page, request }) => {
  const account = await registerAccountByApi(request);
  const sessionState = await createCompletedDraftByApi(request, account.auth);

  await startTournamentByApi(request, account.auth, sessionState.session.id);
  await addAuthSession(page, account.auth);

  await page.goto(`/tournament?sessionId=${sessionState.session.id}`);

  await expect(page.getByTestId("tournament-bracket")).toBeVisible();
  await expect(page.getByTestId("tournament-start-match")).toBeVisible();

  await page.getByTestId("tournament-start-match").click();

  await expect(page.getByTestId("match-page")).toBeVisible();
});
