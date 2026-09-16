# Technical Copilot Signal Lab

Static dashboard for the CI-303 success metric, recalculated from the Nooks2-indexed transcript corpus:

`punted company-knowledge question moments / all company-knowledge question moments`

The unit is a distinct external question, not a call. One call may contribute zero, one, or many question moments. A question is attributed once, to the selected Nooks employee who gives the first substantive answer or deferred-answer response.

## Run locally

```sh
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173`.

## Checked-in results

The dashboard includes two directional question-level evaluations:

- May 1–July 31, 2026
- September 1–15, 2026

The checked-in comparison uses the Nooks2 dialer corpus for a consistent population in both periods. It is limited to substantive external human conversations, and missing, short, machine-only, and low-signal transcripts remain documented coverage limitations. Nooks Meetings / Conversations Intelligence records are not blended into these rates because historical meeting coverage varies by capture provider and employee; mixing them would make the two periods and the per-user rows incomparable.

The strict numerator requires a clear commitment to a later answer or action. Commercial, scheduling, collateral, general-discovery, and non-company-knowledge questions are excluded. Results remain `directional` because the classification is AI-assisted and not every searched record contains a usable or reviewed transcript.

## Import additional results

Imports are processed locally in the browser and saved to `localStorage`.

CSV columns:

```text
dataset_name,start_date,end_date,total_calls_searched,calls_with_transcripts,calls_analyzed,user,knowledge_question_moments,punted_question_moments,quality
```

JSON shape:

```json
{
  "name": "May–July baseline",
  "start": "2026-05-01",
  "end": "2026-07-31",
  "total_calls_searched": 2118,
  "quality": "reviewed",
  "rows": [
    {
      "user": "JP Campbell",
      "knowledge_question_moments": 42,
      "punted_question_moments": 2
    }
  ]
}
```

Imported data is processed locally in the browser and does not replace the checked-in Nooks2 result unless the source file is committed.
