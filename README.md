# Technical Copilot Signal Lab

Static dashboard for the CI-303 success metric:

`punted company-knowledge question moments / all company-knowledge question moments`

The unit is a distinct external question, not a call. One call may contribute zero, one, or many question moments. A question is attributed once, to the selected Nooks employee who gives the first substantive answer or deferred-answer response.

## Run locally

```sh
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173`.

## Import reviewed results

Imports are processed locally in the browser and saved to `localStorage`.

CSV columns:

```text
dataset_name,start_date,end_date,total_calls_searched,user,knowledge_question_moments,punted_question_moments,quality
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

The checked-in seed data deliberately leaves `knowledgeQuestions` null. Gong's web assistant returned retrieved examples rather than an exhaustive question census, so displaying a percentage from those results would be misleading.
