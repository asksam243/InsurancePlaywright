/**
 * Reusable multi-screen flows. Tests that begin mid-journey (riders, beneficiaries, documents ...)
 * call progressTo() instead of repeating the earlier steps - this keeps specs short and independent.
 */
const { expect } = require('@playwright/test');
const { S } = require('../config/selectors');
const { buildApplication } = require('./dataBuilder');
const { files } = require('./files');

const STEPS = ['client', 'address', 'kyc', 'product', 'riders', 'beneficiaries', 'documents', 'review'];

/**
 * Presses Next and waits until the browser has actually moved on (step title or URL changed).
 * If it cannot leave the step, fails with the validation messages on screen - far easier to debug than a downstream timeout.
 */
async function advance(pages) {
  const title = await pages.client.stepTitle();
  const url = pages.page.url();
  await pages.client.next();
  try {
    await expect
      .poll(async () => pages.page.url() !== url || (await pages.client.stepTitle().catch(() => title)) !== title, { timeout: 10_000 })
      .toBe(true);
  } catch {
    const msgs = await pages.page.locator(S.common.anyError.css).allInnerTexts();
    throw new Error(`Flow could not leave the step "${title}". Visible messages: ${JSON.stringify(msgs.filter(Boolean))}`);
  }
}

async function startApplication(pages) {
  await pages.dashboard.goto();
  return pages.dashboard.startNewApplication();
}

/** Fills one step with the data for it (does not press Next). */
async function fillStep(pages, step, data) {
  switch (step) {
    case 'client':
      return pages.client.fill(data.client);
    case 'address':
      return pages.address.fill(data.address);
    case 'kyc':
      return pages.kyc.fill(data.kyc);
    case 'product':
      await pages.product.select(data.product.namePattern);
      await pages.product.configure(data.product);
      return undefined;
    case 'riders':
      for (const r of data.riders) await pages.rider.add(r);
      return undefined;
    case 'beneficiaries':
      for (const b of data.beneficiaries) await pages.beneficiary.add(b);
      return undefined;
    case 'documents':
      if (data.documents) await pages.documents.uploadAllRequired(files.validPdf());
      return undefined;
    default:
      return undefined;
  }
}

/**
 * Starts a NEW application and completes every step before `target`, leaving the browser on `target`.
 * @param {string} target one of STEPS ('client' = just open the first step)
 * @returns {{ id: string|null, data: object }}
 */
async function progressTo(pages, target, overrides = {}) {
  if (!STEPS.includes(target)) throw new Error(`Unknown step "${target}". Use one of: ${STEPS.join(', ')}`);
  const data = buildApplication(overrides);
  const id = await startApplication(pages);
  for (const step of STEPS) {
    if (step === target) break;
    await fillStep(pages, step, data);
    await advance(pages);
  }
  return { id, data };
}

/**
 * Completes every step from `fromStep` up to and including documents (pressing Next after each), landing on review.
 * Use after progressTo()/fillStep() when a test needs to do something custom at an earlier step first.
 */
async function finishFrom(pages, fromStep, data) {
  const start = STEPS.indexOf(fromStep);
  for (const step of STEPS.slice(start, STEPS.indexOf('review'))) {
    await fillStep(pages, step, data);
    await advance(pages);
  }
}

/** Complete valid journey to the review screen (the "smoke path"). */
const reachReview = (pages, overrides) => progressTo(pages, 'review', overrides);

module.exports = { STEPS, startApplication, fillStep, advance, progressTo, finishFrom, reachReview };
