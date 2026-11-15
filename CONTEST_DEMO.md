# Challenge demonstration

Latest release / presentation preparation: **15 November 2026**.

Confirmed local event: **Accra, Ghana**, supplied by the team.

Local programme supplied by the team: submit the completed project to the global Space Apps portal by **13:00 Ghana time on Sunday, 15 November 2026**. No further changes after 13:00. Judging calls begin at 14:30 and allow 5–10 minutes for pitch and questions. The longer narrative below is presentation preparation, not a substitute for the portal’s required demonstration asset.

The contribution to demonstrate is an inspectable, reproducible experiment for cross-sensor consistency. News and weather are supporting context and do not validate the method.

## Suggested two-minute narrative

1. **Problem:** Satellite fire records span different instruments. Raw detection counts can change because the instrument changes, so a bigger count alone does not establish more fires.
2. **Real inputs:** Open Guided Demo or Open harmonization study. Show the Ghana extent, 75,823 original standard-processing observations, and the exact five-day January/July windows across 2021–2025. State that this is a sparse sample, not five complete years.
3. **Experiment:** Show daily occupied 0.1-degree cells, Aqua as the reference, and the training-only zero-intercept scale. Fit on 2021–2023, check 2024 and test on 2025. Original records remain available.
4. **Evidence:** On 10 test days, show raw MAE 266.1, adjusted MAE 70.9 and the simpler seasonal baseline MAE 76.9 cells/day. Say “closer to the reference sensor,” never “73% more accurate.” Show January and July separately and the signed bias. Mention the small sample and unknown cloud-free opportunity.
5. **Useful output:** Open the adjusted calendar in the test year. Show a represented day, then an unsampled date marked unknown. Export the daily comparison and evidence JSON with source checksums and fixed year roles.
6. **Next science:** Explain that independent reference events, continuous coverage, geographic transfer and uncertainty evaluation are needed before a harmonized long-term record, anomalies or critical-period predictions. Show an honest method with reproducible progress rather than an unsupported operational claim.

## Before presenting

Run `npm test`, `npm run build`, `npm start` and `node scripts/verify-case-study.mjs`. The local production demonstration uses port 4173. Keep the saved observational artifacts available so the core study does not depend on live NASA requests. External map tiles, news and weather can still be unavailable.

Confirm the team's actual event rules, project page requirements and permitted demonstration length. This document proposes a narrative, not a statement of official submission limits. No competition result is guaranteed.
