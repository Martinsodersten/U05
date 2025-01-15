import { initializeApp } from "firebase/app"
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth"
import { getDatabase, ref, set, push, onValue } from "firebase/database"
import "./style.css"

interface Todo {
  id: string
  text: string
  completed: boolean
}

// Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCYxdjJMVNtddqF9qR5FG3PCb6ER5qa4uY",
  authDomain: "todolist-u05.firebaseapp.com",
  databaseURL: "https://todolist-u05-default-rtdb.firebaseio.com/",
  projectId: "todolist-u05",
  storageBucket: "todolist-u05.appspot.com",
  messagingSenderId: "907400157472",
  appId: "1:907400157472:web:c563de6724192ee0285f45",
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getDatabase(app)

let todos: Todo[] = []
// Fix these as
const loginContainer = document.getElementById("login-container")!
const todoContainer = document.getElementById("todo-container")!
const todoListElement = document.getElementById("todo-list")!
const todoInput = document.getElementById("todo-input") as HTMLInputElement
const addButton = document.getElementById("add-btn")!
const clearButton = document.getElementById("clear-btn")!
const loginForm = document.getElementById("login-form")!
const emailInput = document.getElementById("email") as HTMLInputElement
const passwordInput = document.getElementById("password") as HTMLInputElement
const logoutButton = document.getElementById("logout-btn")!

// Render todos
function renderTodos() {
  todoListElement.innerHTML = ""
  todos.forEach((todo) => {
    const listItem = document.createElement("li")
    listItem.className = "todo-item"

    const checkbox = document.createElement("input")
    checkbox.type = "checkbox"
    checkbox.checked = todo.completed
    checkbox.className = "styled-checkbox"
    checkbox.addEventListener("change", () => toggleCompleted(todo.id))

    const textSpan = document.createElement("span")
    textSpan.textContent = todo.text
    textSpan.contentEditable = "true"
    textSpan.addEventListener("blur", () =>
      editTodoText(todo.id, textSpan.textContent || "")
    )

    const deleteButton = document.createElement("button")
    deleteButton.textContent = "X"
    deleteButton.className = "delete-button"
    deleteButton.addEventListener("click", () => deleteTodo(todo.id))

    listItem.appendChild(checkbox)
    listItem.appendChild(textSpan)
    listItem.appendChild(deleteButton)
    todoListElement.appendChild(listItem)
  })
}

// Add todo
function addTodo() {
  const text = todoInput.value.trim()
  if (text && auth.currentUser) {
    const todoRef = push(ref(db, `users/${auth.currentUser.uid}/todos`))
    const newTodo = { id: todoRef.key!, text, completed: false }
    set(todoRef, newTodo).catch((error) => {
      console.error("Failed to save todo:", error.message)
    })
    todoInput.value = ""
  }
}

// Change current todo
function editTodoText(id: string, newText: string) {
  if (auth.currentUser) {
    set(
      ref(db, `users/${auth.currentUser.uid}/todos/${id}/text`),
      newText
    ).catch((error) => {
      console.error("Failed to update todo text:", error.message)
    })
  }
}

// Checkbox for todo
function toggleCompleted(id: string) {
  const todo = todos.find((todo) => todo.id === id)
  if (todo && auth.currentUser) {
    set(
      ref(db, `users/${auth.currentUser.uid}/todos/${id}/completed`),
      !todo.completed
    ).catch((error) => {
      console.error("Failed to toggle completion:", error.message)
    })
  }
}

// Delete todo
function deleteTodo(id: string) {
  if (auth.currentUser) {
    set(ref(db, `users/${auth.currentUser.uid}/todos/${id}`), null).catch(
      (error) => {
        console.error("Failed to delete todo:", error.message)
      }
    )
  }
}

// Clear the list
function clearTodos() {
  if (auth.currentUser) {
    set(ref(db, `users/${auth.currentUser.uid}/todos`), null).catch((error) => {
      console.error("Failed to clear todos:", error.message)
    })
  }
}

// Fetch data from Firebase
function fetchTodos() {
  if (auth.currentUser) {
    const todosRef = ref(db, `users/${auth.currentUser.uid}/todos`)
    onValue(todosRef, (snapshot) => {
      todos = []
      snapshot.forEach((childSnapshot) => {
        const todo = childSnapshot.val()
        todos.push({ ...todo, id: childSnapshot.key! })
      })
      renderTodos()
    })
  } else {
    console.warn("No authenticated user. Skipping fetchTodos.")
  }
}

// Login
loginForm.addEventListener("submit", (e) => {
  e.preventDefault()
  const email = emailInput.value.trim()
  const password = passwordInput.value.trim()

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      console.log("Login successful")
      loginContainer.style.display = "none"
      todoContainer.style.display = "block"
      fetchTodos()
    })
    .catch((error) => {
      console.error("Login failed:", error.message)
    })
})

// Logout
logoutButton.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      console.log("Logout successful")
      loginContainer.style.display = "block"
      todoContainer.style.display = "none"
      emailInput.value = ""
      passwordInput.value = ""
      todos = []
      renderTodos()
    })
    .catch((error) => {
      console.error("Logout failed:", error.message)
    })
})

// Event Listeners
addButton.addEventListener("click", addTodo)
clearButton.addEventListener("click", clearTodos)

renderTodos()
