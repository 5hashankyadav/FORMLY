import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const STORAGE_KEY = 'dynamic-question-form-state';

const QUESTION_TYPES = [
  { value: 'short', label: 'Short Answer' },
  { value: 'boolean', label: 'True/False' }
];

function createQuestion() {
  return {
    id: crypto.randomUUID(),
    text: '',
    type: 'short',
    answer: 'true',
    children: []
  };
}

function updateQuestionTree(questions, id, updater) {
  return questions.map((question) => {
    if (question.id === id) {
      return updater(question);
    }

    return {
      ...question,
      children: updateQuestionTree(question.children, id, updater)
    };
  });
}

function removeQuestionFromTree(questions, id) {
  return questions
    .filter((question) => question.id !== id)
    .map((question) => ({
      ...question,
      children: removeQuestionFromTree(question.children, id)
    }));
}

function moveItem(items, fromIndex, toIndex) {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

function getQuestionNumber(path) {
  return `Q${path.join('.')}`;
}

function QuestionEditor({
  question,
  path,
  isParent,
  onUpdate,
  onDelete,
  onAddChild,
  onDragStart,
  onDragOver,
  onDrop
}) {
  const number = getQuestionNumber(path);
  const canAddChild = question.type === 'boolean' && question.answer === 'true';

  return (
    <section
      className="question"
      draggable={isParent}
      onDragStart={isParent ? onDragStart : undefined}
      onDragOver={isParent ? onDragOver : undefined}
      onDrop={isParent ? onDrop : undefined}
    >
      <div className="questionHeader">
        <div className="questionNumber">{number}</div>
        {isParent && <div className="dragHint">Drag to reorder</div>}
        <button className="deleteButton" type="button" onClick={() => onDelete(question.id)}>
          Delete
        </button>
      </div>

      <div className="fieldGrid">
        <label>
          Question
          <input
            type="text"
            value={question.text}
            placeholder="Enter question text"
            onChange={(event) =>
              onUpdate(question.id, (current) => ({
                ...current,
                text: event.target.value
              }))
            }
          />
        </label>

        <label>
          Type
          <select
            value={question.type}
            onChange={(event) =>
              onUpdate(question.id, (current) => ({
                ...current,
                type: event.target.value,
                answer: event.target.value === 'boolean' ? current.answer : 'true',
                children: event.target.value === 'boolean' ? current.children : []
              }))
            }
          >
            {QUESTION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        {question.type === 'boolean' && (
          <label>
            Answer
            <select
              value={question.answer}
              onChange={(event) =>
                onUpdate(question.id, (current) => ({
                  ...current,
                  answer: event.target.value,
                  children: event.target.value === 'true' ? current.children : []
                }))
              }
            >
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </label>
        )}
      </div>

      {canAddChild && (
        <button className="secondaryButton" type="button" onClick={() => onAddChild(question.id)}>
          Add Child Question
        </button>
      )}

      {question.children.length > 0 && (
        <div className="children">
          {question.children.map((child, index) => (
            <QuestionEditor
              key={child.id}
              question={child}
              path={[...path, index + 1]}
              isParent={false}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function QuestionReview({ questions }) {
  if (questions.length === 0) {
    return <p className="emptyState">No questions submitted yet.</p>;
  }

  return (
    <ol className="reviewList">
      {questions.map((question, index) => (
        <ReviewItem key={question.id} question={question} path={[index + 1]} />
      ))}
    </ol>
  );
}

function ReviewItem({ question, path }) {
  const number = getQuestionNumber(path);
  const typeLabel = QUESTION_TYPES.find((type) => type.value === question.type)?.label;

  return (
    <li>
      <div className="reviewQuestion">
        <strong>{number}</strong>
        <span>{question.text || 'Untitled question'}</span>
        <small>
          {typeLabel}
          {question.type === 'boolean' ? `, answer: ${question.answer === 'true' ? 'True' : 'False'}` : ''}
        </small>
      </div>

      {question.children.length > 0 && (
        <ol>
          {question.children.map((child, index) => (
            <ReviewItem key={child.id} question={child} path={[...path, index + 1]} />
          ))}
        </ol>
      )}
    </li>
  );
}

function App() {
  const [questions, setQuestions] = useState(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);

    if (!savedState) {
      return [createQuestion()];
    }

    try {
      const parsedState = JSON.parse(savedState);
      return Array.isArray(parsedState) ? parsedState : [createQuestion()];
    } catch {
      return [createQuestion()];
    }
  });
  const [submittedQuestions, setSubmittedQuestions] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
  }, [questions]);

  const hasQuestions = questions.length > 0;
  const questionCount = useMemo(() => questions.length, [questions]);

  function handleAddQuestion() {
    setQuestions((currentQuestions) => [...currentQuestions, createQuestion()]);
  }

  function handleUpdateQuestion(id, updater) {
    setQuestions((currentQuestions) => updateQuestionTree(currentQuestions, id, updater));
  }

  function handleDeleteQuestion(id) {
    setQuestions((currentQuestions) => removeQuestionFromTree(currentQuestions, id));
  }

  function handleAddChild(parentId) {
    setQuestions((currentQuestions) =>
      updateQuestionTree(currentQuestions, parentId, (question) => ({
        ...question,
        children: [...question.children, createQuestion()]
      }))
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSubmittedQuestions(questions);
  }

  function handleReset() {
    setQuestions([createQuestion()]);
    setSubmittedQuestions([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  function handleParentDrop(targetIndex) {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    setQuestions((currentQuestions) => moveItem(currentQuestions, draggedIndex, targetIndex));
    setDraggedIndex(null);
  }

  return (
    <main className="appShell">
      <header className="appHeader">
        <div>
          <p className="eyebrow">Question Builder</p>
          <h1>FORMLY</h1>
        </div>
        <div className="questionTotal">{questionCount} parent question{questionCount === 1 ? '' : 's'}</div>
      </header>

      <form className="builder" onSubmit={handleSubmit}>
        <div className="toolbar">
          <button type="button" onClick={handleAddQuestion}>
            Add New Question
          </button>
          <button className="secondaryButton" type="button" onClick={handleReset}>
            Reset
          </button>
          <button className="submitButton" type="submit" disabled={!hasQuestions}>
            Submit Form
          </button>
        </div>

        <div className="questionStack">
          {hasQuestions ? (
            questions.map((question, index) => (
              <QuestionEditor
                key={question.id}
                question={question}
                path={[index + 1]}
                isParent
                onUpdate={handleUpdateQuestion}
                onDelete={handleDeleteQuestion}
                onAddChild={handleAddChild}
                onDragStart={() => setDraggedIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleParentDrop(index)}
              />
            ))
          ) : (
            <p className="emptyState">Add a question to start building the form.</p>
          )}
        </div>
      </form>

      <section className="reviewPanel" aria-live="polite">
        <div className="reviewHeader">
          <p className="eyebrow">Submission Review</p>
          <h2>Hierarchical output</h2>
        </div>
        <QuestionReview questions={submittedQuestions} />
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
