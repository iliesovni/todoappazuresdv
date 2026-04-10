const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'todos.json');

app.use(express.json());
app.use(express.static('public'));

// Initialize file
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

function readTodos() {
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function writeTodos(todos) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2));
}

// API
app.get('/api/todos', (req, res) => {
  res.json(readTodos());
});

app.post('/api/todos', (req, res) => {
  const todos = readTodos();
  const newTodo = {
    id: Date.now(),
    text: req.body.text,
    done: false
  };
  todos.push(newTodo);
  writeTodos(todos);
  res.json(newTodo);
});

app.put('/api/todos/:id', (req, res) => {
  let todos = readTodos();
  todos = todos.map(todo =>
    todo.id == req.params.id ? { ...todo, done: !todo.done } : todo
  );
  writeTodos(todos);
  res.json({ success: true });
});

app.delete('/api/todos/:id', (req, res) => {
  let todos = readTodos();
  todos = todos.filter(todo => todo.id != req.params.id);
  writeTodos(todos);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});