# InspireExam

Practice theoretical **MCQ exams** for the Inspire Leadership Academy **Personal Fitness Coach** program, based on the Nov 2025 learners guidebook.

## What’s included

### Full exams (100 questions)
- **Exam 1** and **Exam 2** — same domain mix, different questions
- Domain scoring and incorrect-answer review

### Session exams (50 questions each)
- **40 session exams** matching the guidebook sessions
- Filterable session list on the home page
- Lazy-loaded per session for faster mobile loads

### Mobile-friendly UI
- Responsive layout, large tap targets, sticky exam controls
- Collapsible question map, safe-area padding

> Study aid only — not an official Inspire certification exam.

## Full-exam domain distribution

| Domain | Questions |
| --- | ---: |
| Professional Practice | 8 |
| Functional Anatomy | 18 |
| Biomechanics | 10 |
| Exercise Physiology | 14 |
| Nutrition | 12 |
| Evidence-Based Practice | 6 |
| Coaching & Behavior Change | 8 |
| Exercise Techniques | 8 |
| Fitness Assessment | 8 |
| Program Design | 8 |
| **Total** | **100** |

## GitHub Pages

The site lives in [`docs/`](docs/).

1. **Settings → Pages**
2. Deploy from branch: `main` (or default), folder **/docs**
3. Open the published URL after the Pages build finishes

Local preview:

```bash
cd docs && python3 -m http.server 8080
```

Regenerate session banks (optional):

```bash
python3 scripts/generate_session_exams.py
```

## Source material

`HKEYmZPASc6ANKTqBfvH_Inspire Leadership Academy - GUIDEBOOK FINALE - NOV 2025 - Learners version.pdf`
