import { expect, type Page } from "@playwright/test"

export interface CreateRoomOptions {
  /** The host's display name — mandatory now that the host holds a seat. */
  hostName?: string
  /** Character id from shared/characters.ts. */
  hostCharacter?: string
  /** Listed in the public room browser. */
  isPublic?: boolean
  /** Park every newcomer in the host's queue instead of seating them. */
  requireApproval?: boolean
}

/**
 * Walk the create-room flow from the home stage to a live admin room and hand
 * back the room code. Room creation now goes through the host setup dialog, so
 * every spec needs the same four clicks.
 */
export async function createRoom(page: Page, opts: CreateRoomOptions = {}): Promise<string> {
  const { hostName = "Host", hostCharacter = "ace", isPublic = false, requireApproval = false } = opts

  await page.goto("/")
  await page.click(".cta-create")
  await page.locator(".create-picker-option").first().click()
  await page.locator(".gi-hero .gi-cta-primary").click()

  await expect(page.locator("#hostSetupOverlay")).toBeVisible()
  await page.fill("#hostNameInput", hostName)
  await page.locator(`#hostSetupOverlay .char-tile[data-character="${hostCharacter}"]`).click()
  await page.locator("#hostPublicInput").setChecked(isPublic)
  await page.locator("#hostApprovalInput").setChecked(requireApproval)
  await page.locator(".host-setup-actions .btn-primary").click()

  await expect(page.locator("#roomCodeText")).not.toHaveText("-----")
  return page.locator("#roomCodeText").innerText()
}

/** Type a code in the room browser to reach that room's doorstep. */
export async function openDoorstep(page: Page, code: string): Promise<void> {
  await page.goto("/")
  await page.click(".cta-join")
  await page.fill("#joinCodeInput", code)
  await page.click("#joinBtn")
  await expect(page.locator("#joinSetupView.active-view")).toBeVisible()
}

/** Walk the doorstep: name, character, submit. */
export async function submitJoin(page: Page, code: string, name: string, character = "ruby"): Promise<void> {
  await openDoorstep(page, code)
  await page.fill("#joinSetupName", name)
  await page.locator(`#joinSetupCharacters .char-tile[data-character="${character}"]`).click()
  await page.click("#joinSetupSubmit")
}

/** Join a room that seats players immediately, and wait until they are in. */
export async function joinAs(page: Page, code: string, name: string, character = "ruby"): Promise<void> {
  await submitJoin(page, code, name, character)
  await expect(page.locator("#playerWelcome")).toContainText(name)
}
