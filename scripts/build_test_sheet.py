#!/usr/bin/env python3
"""Builds test-design/Test_Case_Design_Sheet.xlsx from test-design/test-cases.json (run: npm run export:testdesign first).
Counts, traceability and summaries are Excel formulas, so they stay correct if you edit the sheet."""
import json, sys
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter as L
from openpyxl.worksheet.datavalidation import DataValidation

root = Path(__file__).resolve().parent.parent
d = json.loads((root / 'test-design' / 'test-cases.json').read_text())
cases, risks, issues, expl = d['cases'], d['risks'], d['reportedIssues'], d['exploration']
out = root / 'test-design' / 'Test_Case_Design_Sheet.xlsx'

F = 'Arial'
NAVY, GREY, INPUT = '1F3864', 'F2F2F2', 'FFF2CC'
thin = Side(style='thin', color='BFBFBF'); BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)
hfont = Font(name=F, bold=True, color='FFFFFF', size=10); bfont = Font(name=F, size=10)
hfill = PatternFill('solid', fgColor=NAVY)
wrap = Alignment(wrap_text=True, vertical='top')
RATING = {'Critical': 'F4B6B6', 'High': 'F9D5A7', 'Medium': 'FFF2B3', 'Low': 'D5E8D4'}

wb = Workbook()

def header(ws, row, titles, widths):
    for i, (t, w) in enumerate(zip(titles, widths), 1):
        c = ws.cell(row=row, column=i, value=t); c.font = hfont; c.fill = hfill; c.border = BORDER
        c.alignment = Alignment(wrap_text=True, vertical='center'); ws.column_dimensions[L(i)].width = w
    ws.row_dimensions[row].height = 32

def put(ws, row, vals, fills=None):
    for i, v in enumerate(vals, 1):
        c = ws.cell(row=row, column=i, value=v); c.font = bfont; c.alignment = wrap; c.border = BORDER
        if fills and i in fills: c.fill = PatternFill('solid', fgColor=fills[i])

def title(ws, text, sub=None):
    ws['A1'] = text; ws['A1'].font = Font(name=F, bold=True, size=14, color=NAVY)
    if sub: ws['A2'] = sub; ws['A2'].font = Font(name=F, italic=True, size=9, color='595959')

ri_desc = {i['id']: i['description'] for i in issues}
ri_code = {i['id']: i['catalogCode'] for i in issues}
def RUNFILL(v):
    return {'Passed': 'D5E8D4', 'Failed': 'F4B6B6', 'Not passed - investigate': 'F9D5A7'}.get(v, 'FFFFFF')
YN = lambda b: 'Y' if b else 'N'

# ---------------------------------------------------------------- Test Cases
tc = wb.active; tc.title = 'Test Cases'
cols = [('Test Case ID', 14), ('Title', 42), ('Module', 22), ('Scenario ID', 11), ('Source', 8), ('Requirement / Risk Link (Submission 1 risk IDs)', 16),
        ('Seeded Defect Theme (reported issue)', 34), ('Seeded Defect Candidate / Catalog Code', 18), ('Test Type', 14), ('Layer', 12),
        ('Preconditions', 40), ('Test Steps', 50), ('Test Data', 30), ('Expected Result', 48), ('Severity', 10),
        ('Priority (P1 = release gate)', 12), ('Submission 1 Priority', 11), ('Release Gate', 8), ('Smoke', 7), ('Sensitive Data (no trace/video)', 11),
        ('Evidence Required', 30), ('Automation Status', 12), ('Automated In', 30), ('Run Conditions / TBC', 30), ('Open Questions', 12),
        ('Blocked Reason', 40), ('Tags', 36),
        ('Live run 1 - smoke 26-Oct 11:38 (old code)', 18), ('Live run 2 - full 26-Oct 11:51 (old code)', 18), ('Live run 3 - smoke after fixes', 18), ('Defect Log IDs', 14)]
title(tc, 'Test Case Design Sheet - Insurance Order Entry Platform (Submission 2)',
      'Generated from test-design/testCases.js. Edit the .js file (single source of truth) and re-run: npm run export:testdesign && python scripts/build_test_sheet.py')
H = 4; header(tc, H, [c[0] for c in cols], [c[1] for c in cols])
for r, c in enumerate(cases, H + 1):
    steps = '\n'.join(f'{i}. {s}' for i, s in enumerate(c['steps'], 1))
    defects = '\n'.join(f"{x}: {ri_desc[x]}" for x in c['defects'])
    sev = {'Critical': RATING['Critical'], 'High': RATING['High'], 'Medium': RATING['Medium'], 'Low': RATING['Low']}[c['severity']]
    codes = ', '.join(dict.fromkeys(ri_code[x] for x in c['defects'] if ri_code.get(x)))
    put(tc, r, [c['tcId'], c['title'], c['module'], c['id'], c['source'], ', '.join(c['risks']), defects, codes, c['type'], c['layer'], c['pre'], steps, c['data'],
                c['expected'], c['severity'], c['priority'], c['submission1Priority'], YN(c['gate']), YN(c['smoke']), YN(c['sensitive']), c['evidence'],
                c['automationStatus'], c['spec'], c['cond'], ', '.join(c['explore']), c['blockedReason'], ' '.join(c['tags']),
                c['run1'], c['run2'], c['run3'], ', '.join(c['defectLogIds'])],
        fills={15: sev, 16: RATING['Critical'] if c['priority'] == 'P1' else 'FFFFFF', 8: INPUT,
               22: {'Automated': 'D5E8D4', 'Blocked': 'F4B6B6'}.get(c['automationStatus'], 'FFF2B3'),
               28: RUNFILL(c['run1']), 29: RUNFILL(c['run2']), 30: RUNFILL(c['run3'])})
last = H + len(cases)
tc.freeze_panes = tc.cell(row=H + 1, column=3); tc.auto_filter.ref = f'A{H}:{L(len(cols))}{last}'
TCR = lambda col: f"'Test Cases'!${col}${H+1}:${col}${last}"

# ---------------------------------------------------------------- Release Gate
why = {
 'AUTH-V01': 'If valid agents cannot sign in, nothing else is usable.', 'AUTH-V05': 'Protected pages must not be reachable without a session.',
 'AUTH-V06': 'Locked agents must stay locked out, with the correct message.', 'DASH-V02': "An agent must never see another agent's applications (confidentiality).",
 'CLI-V05': 'A future date of birth would create an invalid policy.', 'CLI-V08': 'Unmasked SSN is a compliance / privacy breach.',
 'PROD-V01': 'Agents cannot sell if the product catalogue does not load.', 'PROD-V05': 'Wrong premium after a configuration change misprices the policy.',
 'PROD-V06': 'Premium on review must equal what the agent configured.', 'RIDER-V02': 'Rider cover above the base face value is an invalid coverage.',
 'BEN-V02': 'Allocations must total 100% or payouts are disputed.', 'BEN-V05': 'A minor beneficiary without a guardian is a legal gap.',
 'DOC-V04': 'Missing mandatory KYC documents must block submission (compliance).', 'VAL-V03': 'Submit must be blocked while validation errors exist.',
 'WF-V01': 'Agents must not lose work: drafts must save.', 'WF-V03': 'The core journey must complete and return a reference number.',
 'WF-V06': 'Dashboard status must reflect the submission.', 'API-V02': 'The API must refuse unauthenticated calls.', 'API-V05': 'The submit API must refuse incomplete applications.'}
rg = wb.create_sheet('Release Gate')
title(rg, 'Release Gate (P1) - the scenarios that MUST pass for a release',
      'Submission 1 rated 52 of 105 scenarios P1. P1 is now limited to these. Everything else is regression (P2) or P3. Run: npm run test:gate')
header(rg, 4, ['Test Case ID', 'Title', 'Why a failure blocks the release', 'Layer', 'Automation Status', 'Linked Risks'], [14, 48, 56, 12, 14, 18])
gates = [c for c in cases if c['gate']]
for r, c in enumerate(gates, 5):
    put(rg, r, [c['tcId'], c['title'], why[c['id']], c['layer'], c['automationStatus'], ', '.join(c['risks'])])
r = 5 + len(gates) + 1
rg.cell(row=r, column=1, value='Gate size').font = Font(name=F, bold=True)
rg.cell(row=r, column=2, value=f"=COUNTIF({TCR('P')},\"P1\")").font = bfont
rg.cell(row=r + 1, column=1, value='Target').font = Font(name=F, bold=True)
rg.cell(row=r + 1, column=2, value='15 to 20 scenarios').font = bfont
rg.cell(row=r + 2, column=1, value='Within target?').font = Font(name=F, bold=True)
rg.cell(row=r + 2, column=2, value=f'=IF(AND(B{r}>=15,B{r}<=20),"Yes","No - review")').font = bfont

# ---------------------------------------------------------------- Traceability - Risks
tr = wb.create_sheet('Traceability - Risks')
title(tr, 'Traceability: Submission 1 risk register (R01-R41) to test cases', 'Linked test cases are counted by formula from the Test Cases sheet.')
header(tr, 4, ['Risk ID', 'Module', 'Layer', 'Risk', 'Likelihood', 'Impact', 'Rating', 'Covered by (Submission 1)', 'Linked Test Cases', '# Test Cases'], [9, 20, 11, 56, 11, 9, 10, 28, 60, 11])
for r, k in enumerate(risks, 5):
    linked = ', '.join(c['tcId'] for c in cases if k['id'] in c['risks'])
    put(tr, r, [k['id'], k['module'], k['layer'], k['risk'], k['likelihood'], k['impact'], k['rating'], k['coveredBy'], linked, f"=COUNTIF({TCR('F')},\"*\"&A{r}&\"*\")"], fills={7: RATING[k['rating']]})
rl = 5 + len(risks)
tr.cell(row=rl + 1, column=1, value='Risks with no test case').font = Font(name=F, bold=True)
tr.cell(row=rl + 1, column=4, value=f'=COUNTIF(J5:J{rl-1},0)').font = bfont
tr.freeze_panes = 'B5'

# ---------------------------------------------------------------- Traceability - Defects
td = wb.create_sheet('Traceability - Defects')
title(td, 'Traceability: seeded-defect themes (20 reported issues) to test cases',
      d['sdcNote'] + ' Column D holds the SDC id where a tagged test matches the theme; RI-03, RI-09, RI-11 and RI-20 have none yet. Detection status is only set from evidence: the live runs never reached the validation rules, so almost everything is Not run.')
header(td, 4, ['Reported Issue ID', 'Module', 'Description', 'Seeded Defect Catalog Code (fill)', 'Linked Test Cases', '# Test Cases', 'Detected in run? (fill: Detected / Not detected / Not run)', 'Defect Log ID (fill)'], [12, 22, 52, 20, 60, 11, 22, 16])
for r, i in enumerate(issues, 5):
    linked = ', '.join(c['tcId'] for c in cases if i['id'] in c['defects'])
    logged = ', '.join(x['id'] for x in d['defectLog'] if i['id'] in x['defects'])
    seen = 'Not detected' if i['id'] == 'RI-01' else 'Not run'   # RI-01: AUTH-V01 passed in both live runs; every other theme was not reached
    put(td, r, [i['id'], i['module'], i['description'], i['catalogCode'], linked, f"=COUNTIF({TCR('G')},\"*\"&A{r}&\"*\")", seen, logged], fills={4: INPUT, 7: INPUT, 8: INPUT})
dv = DataValidation(type='list', formula1='"Detected,Not detected,Not run"', allow_blank=True); td.add_data_validation(dv); dv.add(f'G5:G{4+len(issues)}')
dr = 5 + len(issues)
td.cell(row=dr + 1, column=1, value='Detection rate').font = Font(name=F, bold=True)
td.cell(row=dr + 1, column=3, value=f'=IF(COUNTIF(G5:G{dr-1},"Detected")+COUNTIF(G5:G{dr-1},"Not detected")=0,"n/a",COUNTIF(G5:G{dr-1},"Detected")/(COUNTIF(G5:G{dr-1},"Detected")+COUNTIF(G5:G{dr-1},"Not detected")))').font = bfont
td.cell(row=dr + 1, column=3).number_format = '0%'
td.freeze_panes = 'B5'

# ---------------------------------------------------------------- Run Results
rr = wb.create_sheet('Run Results')
title(rr, 'Live run results (lab VM) and failure classification',
      'Only runs observed on the lab VM are recorded. Offline dry-runs against a mock application are NOT evidence about the application and are not listed.')
header(rr, 4, ['Run', 'When', 'Scope', 'Code under test', 'Total', 'Passed', 'Failed', 'Skipped', 'Pass rate', 'Duration (min)', 'Notes', 'Itemised Passed (formula)', 'Itemised Failed (formula)'],
       [9, 17, 26, 40, 8, 8, 8, 9, 10, 12, 70, 14, 14])
runcol = {'RUN-1': 'AB', 'RUN-2': 'AC', 'RUN-3': 'AD'}
for r, x in enumerate(d['liveRuns'], 5):
    col = runcol[x['id']]
    put(rr, r, [x['id'], x['when'], x['scope'], x['code'], x['total'], x['passed'], x['failed'], x['skipped'], f'=IF(E{r}=0,"n/a",F{r}/E{r})', x['durationMin'], x['note'],
                f"=COUNTIF({TCR(col)},\"Passed\")", f"=COUNTIF({TCR(col)},\"Failed\")"], fills={5: INPUT, 6: INPUT, 7: INPUT, 8: INPUT})
    rr.cell(row=r, column=9).number_format = '0%'
n = 5 + len(d['liveRuns'])
rr.cell(row=n + 1, column=1, value='Classification of the failures (from the Defect Log)').font = Font(name=F, bold=True, size=11)
header(rr, n + 2, ['Type', 'Count', 'Meaning'], [9, 17, 26])
meaning = {'Automation defect': 'The test or page object was wrong (locator, flow, API contract).', 'Test-data issue': 'Data or account choice made a correct test fail.', 'Environment issue': 'Lab VM, URL, port or timing - not a product defect.',
           'Application defect (candidate)': 'Possible application defect, NOT yet reproduced on the lab.', 'Clarification': 'Needs a product-owner answer before it can be called a defect.'}
for k, (typ, mean) in enumerate(meaning.items(), n + 3):
    put(rr, k, [typ, f"=COUNTIF('Defect Log'!$B$5:$B${4+len(d['defectLog'])},A{k})", mean])
q = n + 3 + len(meaning)
put(rr, q, ['Confirmed application defects', f"=COUNTIFS('Defect Log'!$B$5:$B${4+len(d['defectLog'])},\"Application defect*\",'Defect Log'!$K$5:$K${4+len(d['defectLog'])},\"Confirmed*\")",
            'None yet: the live runs so far failed before any validation rule was reached. Re-run after the fixes, then update this sheet.'])
rr.column_dimensions['C'].width = 26

# ---------------------------------------------------------------- Defect Log
dl = wb.create_sheet('Defect Log')
title(dl, 'Defect Log - classified before logging (README section 6)',
      'Yellow cells are for you: record the live re-run result and date after each fix. "PROBABLE" or "HYPOTHESIS" in the analysis means the failure text was not captured.')
header(dl, 4, ['Defect ID', 'Type', 'Module', 'Title', 'Affected test cases', 'Reported issue (RI)', 'Evidence', 'Analysis / root cause', 'Severity', 'Priority', 'Status', 'Fix / where', 'Live re-run result (fill)', 'Re-test date (fill)'],
       [10, 22, 22, 46, 34, 14, 52, 60, 10, 9, 28, 44, 24, 14])
for r, x in enumerate(d['defectLog'], 5):
    put(dl, r, [x['id'], x['type'], x['module'], x['title'], ', '.join('TC-' + c for c in x['cases']), ', '.join(x['defects']), x['evidence'], x['analysis'],
                x['severity'], x['priority'], x['status'], x['fix'], '', ''], fills={9: RATING.get(x['severity'], 'FFFFFF'), 13: INPUT, 14: INPUT})
dv3 = DataValidation(type='list', formula1='"Passed,Failed,Not re-run"', allow_blank=True); dl.add_data_validation(dv3); dv3.add(f'M5:M{4+len(d["defectLog"])}')
dl.freeze_panes = 'B5'; dl.auto_filter.ref = f'A4:N{4+len(d["defectLog"])}'

# ---------------------------------------------------------------- Exploration Log
ex = wb.create_sheet('Exploration Log')
title(ex, 'Exploration Log - hands-on walkthrough of the LIVE application BEFORE trusting the scripts',
      'Time-boxed (see total). Yellow cells are for you. Walk the full journey once, then resolve each open item and record it where the last-but-one column says.')
header(ex, 4, ['Item', 'What to find out', 'Record the answer in', 'Time-box (min)', 'Dependent test cases', '# Dependent', 'Status', 'Value found (fill)', 'Date (fill)', 'Notes (fill)'], [9, 60, 44, 10, 46, 10, 14, 30, 12, 30])
for r, e in enumerate(expl, 5):
    put(ex, r, [e['q'], e['find'], e['record'], e['minutes'], ', '.join('TC-' + x for x in e['dependents']), f'=IF(E{r}="",0,LEN(E{r})-LEN(SUBSTITUTE(E{r},"TC-",""))' + '' + ')/3', 'Not started', '', '', ''], fills={7: INPUT, 8: INPUT, 9: INPUT, 10: INPUT})
dv2 = DataValidation(type='list', formula1='"Not started,In progress,Done,Not possible"', allow_blank=False); ex.add_data_validation(dv2); dv2.add(f'G5:G{4+len(expl)}')
er = 5 + len(expl)
ex.cell(row=er + 1, column=1, value='Total time-box (min)').font = Font(name=F, bold=True); ex.cell(row=er + 1, column=4, value=f'=SUM(D5:D{er-1})').font = bfont
ex.cell(row=er + 2, column=1, value='Items done').font = Font(name=F, bold=True); ex.cell(row=er + 2, column=4, value=f'=COUNTIF(G5:G{er-1},"Done")&" of "&COUNTA(A5:A{er-1})').font = bfont
ex.cell(row=er + 4, column=1, value='Exit rule: do not start broad automation until ROUTES, Q02, Q03 and Q06 are Done. Other items may stay open - their tests skip with a reason instead of failing falsely.').font = Font(name=F, italic=True, size=9)
ex.freeze_panes = 'B5'

# ---------------------------------------------------------------- Summary
sm = wb.create_sheet('Summary', 0)
title(sm, 'Summary', 'All figures are formulas over the Test Cases sheet.')
mods = []
for c in cases:
    if c['module'] not in mods: mods.append(c['module'])
header(sm, 4, ['Module', 'Total', 'P1 (release gate)', 'P2', 'P3', 'Smoke', 'Seeded-defect checks', 'Automated', 'Blocked', 'Sensitive'], [40, 9, 14, 8, 8, 8, 16, 11, 9, 10])
for r, m in enumerate(mods, 5):
    a = f'A{r}'
    put(sm, r, [m, f"=COUNTIF({TCR('C')},{a})", f"=COUNTIFS({TCR('C')},{a},{TCR('P')},\"P1\")", f"=COUNTIFS({TCR('C')},{a},{TCR('P')},\"P2\")",
                f"=COUNTIFS({TCR('C')},{a},{TCR('P')},\"P3\")", f"=COUNTIFS({TCR('C')},{a},{TCR('S')},\"Y\")", f"=COUNTIFS({TCR('C')},{a},{TCR('G')},\"?*\")",
                f"=COUNTIFS({TCR('C')},{a},{TCR('V')},\"Automated\")", f"=COUNTIFS({TCR('C')},{a},{TCR('V')},\"Blocked\")", f"=COUNTIFS({TCR('C')},{a},{TCR('T')},\"Y\")"])
t = 5 + len(mods)
put(sm, t, ['Total'] + [f'=SUM({L(c)}5:{L(c)}{t-1})' for c in range(2, 11)], fills={i: GREY for i in range(1, 11)})
for c in range(1, 11): sm.cell(row=t, column=c).font = Font(name=F, bold=True, size=10)
k = t + 2
rows = [('P1 share of all cases (Submission 1: 50%)', f'=C{t}/B{t}', '0%'), ('Release gate within 15-20?', f'=IF(AND(C{t}>=15,C{t}<=20),"Yes","No - review")', None),
        ('Automation coverage (automated / total)', f'=H{t}/B{t}', '0%'), ('Risks covered', f"=COUNTIF('Traceability - Risks'!J5:J{4+len(risks)},\">0\")&\" of {len(risks)}\"", None),
        ('Reported issues covered', f"=COUNTIF('Traceability - Defects'!F5:F{4+len(issues)},\">0\")&\" of {len(issues)}\"", None)]
for i, (lbl, f, nf) in enumerate(rows):
    sm.cell(row=k + i, column=1, value=lbl).font = Font(name=F, bold=True, size=10)
    c = sm.cell(row=k + i, column=2, value=f); c.font = bfont
    if nf: c.number_format = nf
sm.cell(row=k + 6, column=1, value='Notes').font = Font(name=F, bold=True)
for i, n in enumerate(['Automated = a Playwright test exists for the case. Blocked = cannot be automated yet (database access, Q04).',
                       'Three live runs exist (Run Results sheet): v1 passed 5/15 smoke and 10/96 overall; after the first round of fixes the smoke run passed 7/15. The latest fixes (product choice, API base URL, session timeout) have NOT yet been re-run on the lab.']):
    sm.cell(row=k + 7 + i, column=1, value=n).font = Font(name=F, size=9, italic=True)

# ---------------------------------------------------------------- Limitations
lm = wb.create_sheet('Limitations')
title(lm, 'Known limitations and blocked areas')
header(lm, 3, ['#', 'Area', 'Limitation / blocked item', 'Impact', 'Resolution'], [5, 22, 70, 40, 46])
items = [
 ('Execution', 'Live runs on 26 Oct (smoke 5/15 passed; full 10/96) used the first code version. The fixes in the Defect Log have only been exercised against an offline mock of the application, which proves internal consistency, not live behaviour.', 'Selectors and flows are consistent with the application markup but are unproven on the lab', 'Re-run npm run test:smoke on the lab, then npm run verify:selectors; record results in the Defect Log'),
 ('Selectors', 'Login and dashboard ids are proven by live runs. All other ids come from the application markup as captured in the third project\'s page objects and are not yet proven live.', 'A wrong id fails a test for an automation reason', 'npm run discover then npm run verify:selectors; config/selectors.js is the only file to edit'),
 ('Database', 'No DB engine, schema or access (Q04). DB-01..DB-10 are Blocked.', '10 cases not automated', 'API reads are used as a proxy where the linked scenario has an API test'),
 ('Business rules', 'Max riders (4), upload size (5 MB) and lockout (5 attempts) are confirmed. Face value limits, age boundary and affordability rule are still TBC.', 'Dependent tests skip with a reason instead of failing', 'Resolve in exploration and set the .env values'),
 ('Users', 'Seeded accounts agent.valid/locked/new/mfa/draft/submitted, admin and learner001-030 are confirmed. Disposable lockout and reset users are not (Q06).', 'Lockout and reset tests skip until disposable users are set', 'Set AGENT_LOCKOUT_* and AGENT_RESET_* in .env'),
 ('Destructive tests', 'AUTH-V07 locks an account; AUTH-V08/V13 may change a password if the app is defective.', 'Disposable users required', 'Use AGENT_LOCKOUT_* and AGENT_RESET_* only with throw-away users'),
 ('API payloads', 'API field names are unconfirmed (Q03). Tests send a valid control request first and skip if it is rejected.', 'No false defects, but some API tests may skip', 'Adjust api/helpers.js after exploration'),
 ('Shared lab', 'One worker by default. Parallel runs add load and can collide on shared data.', 'Slower runs', 'Raise WORKERS only after a stable single-worker baseline'),
 ('Evidence', 'Traces and videos cannot be masked, so they are disabled for KYC / SSN tests. Masked screenshots are attached instead.', 'Less debug detail for 4 sensitive tests', 'Use the masked screenshot and diagnostics.json'),
 ('Cross-browser', 'Chromium primary. Firefox / WebKit smoke only when CROSS_BROWSER=true.', 'Limited cross-browser coverage', 'Enable per the plan before release'),
 ('Priorities', 'P1 re-cut from 52 to 19 cases by author judgement.', 'Mentor / product owner should confirm the gate', 'Review the Release Gate sheet'),
 ('Risk links', '36 cases were not named in the Submission 1 "Covered by" column and were linked to the closest risk by judgement.', 'Traceability partly judgemental', 'Review in the Traceability - Risks sheet'),
 ('Agent dashboard access', 'The starter project proved agents are not LANDED on /dashboard after login; it did not prove they cannot open it. Journeys and DASH-* cases start from the dashboard.', 'If agents are redirected away, many UI cases fail for one reason', 'Verify on the lab first; if redirected, start journeys from the draft application page'),
 ('Merged projects', 'Built from two projects. Confirmed lab facts from the starter project override Submission 2 guesses (login ids, X-API-Key auth, seeded users, landing page). AUTH-V14 was carried over from the starter as AUTH-V01b.', 'None if the lab matches the starter project documentation', 'See docs/confirmed-environment-facts.md'),
]
for r, it in enumerate(items, 4): put(lm, r, [r - 3, *it])

for ws in wb.worksheets:
    ws.sheet_view.showGridLines = False
    ws.sheet_properties.tabColor = NAVY
wb.save(out); print('saved', out)
