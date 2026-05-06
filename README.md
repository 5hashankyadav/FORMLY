# FORMLY

FORMLY is a Flask-backed dynamic question form builder. Users can create parent questions, add recursively nested child questions, reorder parent questions, and submit the form to review the final hierarchy.

## Features

- Add, edit, and delete parent or child questions.
- Support `Short Answer` and `True/False` question types.
- Add child questions when a `True/False` question is answered `True`.
- Nest questions across multiple levels.
- Auto-number questions as `Q1`, `Q1.1`, `Q1.1.1`, `Q2`, etc.
- Save form progress in browser local storage.
- Reorder parent questions with drag-and-drop.
- Submit and display questions in a hierarchical review.

## Tech Stack

- Python
- Flask
- HTML, CSS, JavaScript

## Project Structure

```text
backend/app.py       Flask server
templates/index.html Flask-served page
static/app.js        Main form logic
static/styles.css    App styling
requirements.txt     Python dependencies
```

## Run With Flask

From the project root:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python backend/app.py
```

Open:

```text
http://127.0.0.1:5000
```

Health check:

```text
http://127.0.0.1:5000/api/health
```

## Verification

- Refresh the browser after editing questions to confirm local storage persistence.
- Drag parent question cards to confirm reordering.
- Submit the form to confirm hierarchical output.
- Use `Reset` to clear saved local storage state.
