const STORAGE_KEY = 'dynamic-question-form-state';

const QUESTION_TYPES = {
  short: 'Short Answer',
  boolean: 'True/False'
};

let questions = loadQuestions();
let submittedQuestions = [];
let draggedIndex = null;

function createQuestion() {
  return {
    id: crypto.randomUUID(),
    text: '',
    type: 'short',
    answer: 'true',
    children: []
  };
}

function loadQuestions() {
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
}

function saveQuestions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
}

function getQuestionNumber(path) {
  return `Q${path.join('.')}`;
}

function updateQuestionTree(items, id, updater) {
  return items.map((question) => {
    if (question.id === id) {
      return updater(question);
    }

    return {
      ...question,
      children: updateQuestionTree(question.children, id, updater)
    };
  });
}

function removeQuestionFromTree(items, id) {
  return items
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

function cloneQuestions(items) {
  return JSON.parse(JSON.stringify(items));
}

function submitQuestions() {
  submittedQuestions = cloneQuestions(questions);
  render();

  document.querySelector('.reviewPanel')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

function el(tagName, attributes = {}, ...children) {
  const element = document.createElement(tagName);

  Object.entries(attributes).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) {
      return;
    }

    if (key === 'className') {
      element.className = value;
      return;
    }

    if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.slice(2).toLowerCase(), value);
      return;
    }

    element.setAttribute(key, value);
  });

  children.flat().forEach((child) => {
    if (child === undefined || child === null || child === false) {
      return;
    }

    element.append(child instanceof Node ? child : document.createTextNode(String(child)));
  });

  return element;
}

function render() {
  saveQuestions();

  const root = document.getElementById('root');
  root.replaceChildren(
    el(
      'main',
      { className: 'appShell' },
      renderHeader(),
      renderBuilder(),
      renderReview()
    )
  );
}

function renderHeader() {
  return el(
    'header',
    { className: 'appHeader' },
    el('div', {}, el('p', { className: 'eyebrow' }, 'Question Builder'), el('h1', {}, 'FORMLY')),
    el(
      'div',
      { className: 'questionTotal' },
      `${questions.length} parent question${questions.length === 1 ? '' : 's'}`
    )
  );
}

function renderBuilder() {
  return el(
    'form',
    {
      className: 'builder',
      onsubmit: (event) => {
        event.preventDefault();
        submitQuestions();
      }
    },
    el(
      'div',
      { className: 'toolbar' },
      el(
        'button',
        {
          type: 'button',
          onclick: () => {
            questions = [...questions, createQuestion()];
            render();
          }
        },
        'Add New Question'
      ),
      el(
        'button',
        {
          className: 'secondaryButton',
          type: 'button',
          onclick: () => {
            questions = [createQuestion()];
            submittedQuestions = [];
            localStorage.removeItem(STORAGE_KEY);
            render();
          }
        },
        'Reset'
      ),
      el(
        'button',
        {
          className: 'submitButton',
          type: 'button',
          disabled: questions.length === 0,
          onclick: submitQuestions
        },
        'Submit Form'
      )
    ),
    el(
      'div',
      { className: 'questionStack' },
      questions.length
        ? questions.map((question, index) => renderQuestion(question, [index + 1], true, index))
        : el('p', { className: 'emptyState' }, 'Add a question to start building the form.')
    )
  );
}

function renderQuestion(question, path, isParent, parentIndex) {
  const canAddChild = question.type === 'boolean' && question.answer === 'true';

  return el(
    'section',
    {
      className: 'question',
      draggable: isParent ? 'true' : undefined,
      ondragstart: isParent
        ? () => {
            draggedIndex = parentIndex;
          }
        : undefined,
      ondragover: isParent
        ? (event) => {
            event.preventDefault();
          }
        : undefined,
      ondrop: isParent
        ? () => {
            if (draggedIndex !== null && draggedIndex !== parentIndex) {
              questions = moveItem(questions, draggedIndex, parentIndex);
            }
            draggedIndex = null;
            render();
          }
        : undefined
    },
    el(
      'div',
      { className: 'questionHeader' },
      el('div', { className: 'questionNumber' }, getQuestionNumber(path)),
      isParent ? el('div', { className: 'dragHint' }, 'Drag to reorder') : null,
      el(
        'button',
        {
          className: 'deleteButton',
          type: 'button',
          onclick: () => {
            questions = removeQuestionFromTree(questions, question.id);
            render();
          }
        },
        'Delete'
      )
    ),
    el(
      'div',
      { className: 'fieldGrid' },
      el(
        'label',
        {},
        'Question',
        el('input', {
          type: 'text',
          value: question.text,
          placeholder: 'Enter question text',
          oninput: (event) => {
            questions = updateQuestionTree(questions, question.id, (current) => ({
              ...current,
              text: event.target.value
            }));
            saveQuestions();
          }
        })
      ),
      el(
        'label',
        {},
        'Type',
        el(
          'select',
          {
            onchange: (event) => {
              questions = updateQuestionTree(questions, question.id, (current) => ({
                ...current,
                type: event.target.value,
                answer: event.target.value === 'boolean' ? current.answer : 'true',
                children: event.target.value === 'boolean' ? current.children : []
              }));
              render();
            }
          },
          el('option', { value: 'short', selected: question.type === 'short' }, QUESTION_TYPES.short),
          el('option', { value: 'boolean', selected: question.type === 'boolean' }, QUESTION_TYPES.boolean)
        )
      ),
      question.type === 'boolean'
        ? el(
            'label',
            {},
            'Answer',
            el(
              'select',
              {
                onchange: (event) => {
                  questions = updateQuestionTree(questions, question.id, (current) => ({
                    ...current,
                    answer: event.target.value,
                    children: event.target.value === 'true' ? current.children : []
                  }));
                  render();
                }
              },
              el('option', { value: 'true', selected: question.answer === 'true' }, 'True'),
              el('option', { value: 'false', selected: question.answer === 'false' }, 'False')
            )
          )
        : null
    ),
    canAddChild
      ? el(
          'button',
          {
            className: 'secondaryButton',
            type: 'button',
            onclick: () => {
              questions = updateQuestionTree(questions, question.id, (current) => ({
                ...current,
                children: [...current.children, createQuestion()]
              }));
              render();
            }
          },
          'Add Child Question'
        )
      : null,
    question.children.length
      ? el(
          'div',
          { className: 'children' },
          question.children.map((child, index) => renderQuestion(child, [...path, index + 1], false))
        )
      : null
  );
}

function renderReview() {
  return el(
    'section',
    { className: 'reviewPanel', 'aria-live': 'polite' },
    el(
      'div',
      { className: 'reviewHeader' },
      el('p', { className: 'eyebrow' }, 'Submission Review'),
      el('h2', {}, 'Hierarchical output')
    ),
    submittedQuestions.length
      ? el('ol', { className: 'reviewList' }, submittedQuestions.map((question, index) => renderReviewItem(question, [index + 1])))
      : el('p', { className: 'emptyState' }, 'No questions submitted yet.')
  );
}

function renderReviewItem(question, path) {
  return el(
    'li',
    {},
    el(
      'div',
      { className: 'reviewQuestion' },
      el('strong', {}, getQuestionNumber(path)),
      el('span', {}, question.text || 'Untitled question'),
      el(
        'small',
        {},
        QUESTION_TYPES[question.type],
        question.type === 'boolean' ? `, answer: ${question.answer === 'true' ? 'True' : 'False'}` : ''
      )
    ),
    question.children.length
      ? el('ol', {}, question.children.map((child, index) => renderReviewItem(child, [...path, index + 1])))
      : null
  );
}

render();
