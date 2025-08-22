// app.js — Student Management (localStorage)
// Author: Trung (@minhtrungv212-prog)

const STORAGE_KEY = "students.v1";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const state = {
  students: [],
  query: "",
  sort: "name.asc",
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function load() {
  const s = localStorage.getItem(STORAGE_KEY);
  state.students = s ? JSON.parse(s) : [];
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.students));
}

function render() {
  const tbody = $("#tbody");
  const empty = $("#empty");
  tbody.innerHTML = "";

  let rows = [...state.students];

  // search filter
  const q = state.query.trim().toLowerCase();
  if (q) {
    rows = rows.filter((s) =>
      [s.name, s.code, s.major].some((x) => (x || "").toLowerCase().includes(q))
    );
  }

  // sorting
  const [field, dir] = state.sort.split(".");
  rows.sort((a, b) => {
    const va = (a[field] ?? "").toString().toLowerCase();
    const vb = (b[field] ?? "").toString().toLowerCase();
    if (field === "gpa") {
      return dir === "asc" ? (a.gpa ?? 0) - (b.gpa ?? 0) : (b.gpa ?? 0) - (a.gpa ?? 0);
    }
    if (va < vb) return dir === "asc" ? -1 : 1;
    if (va > vb) return dir === "asc" ? 1 : -1;
    return 0;
  });

  rows.forEach((s, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${escapeHTML(s.name)} ${badgeIfLowGpa(s.gpa)}</td>
      <td><code>${escapeHTML(s.code)}</code></td>
      <td>${escapeHTML(s.major || "-")}</td>
      <td>${s.gpa ?? "-"}</td>
      <td>
        <div class="row-actions">
          <button data-action="edit" data-id="${s.id}">Edit</button>
          <button data-action="delete" class="danger" data-id="${s.id}">Delete</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  empty.style.display = rows.length ? "none" : "block";
}

function badgeIfLowGpa(gpa) {
  if (typeof gpa !== "number") return "";
  if (gpa < 2.0) return ` <span class="badge">Needs support</span>`;
  if (gpa >= 3.6) return ` <span class="badge">Honor</span>`;
  return "";
}

function escapeHTML(str) {
  return (str || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));
}

function resetForm() {
  $("#student-id").value = "";
  $("#name").value = "";
  $("#code").value = "";
  $("#major").value = "";
  $("#gpa").value = "";
  $("#save-btn").textContent = "Save";
}

function upsertStudent(payload) {
  const idx = state.students.findIndex((x) => x.id === payload.id);
  if (idx >= 0) state.students[idx] = payload;
  else state.students.push(payload);
  save(); render(); resetForm();
}

function deleteStudent(id) {
  state.students = state.students.filter((s) => s.id !== id);
  save(); render();
}

function seed() {
  if (state.students.length) return;
  state.students = [
    { id: uid(), name: "Nguyen Van A", code: "SV2025001", major: "Computer Science", gpa: 3.2 },
    { id: uid(), name: "Tran Thi B", code: "SV2025002", major: "Information Systems", gpa: 2.1 },
    { id: uid(), name: "Vo Minh Trung", code: "SV2025003", major: "Software Engineering", gpa: 3.8 },
  ];
  save(); render();
}

function clearAll() {
  if (!confirm("Clear all students?")) return;
  state.students = []; save(); render(); resetForm();
}

function handleSubmit(e) {
  e.preventDefault();
  const id = $("#student-id").value || uid();
  const name = $("#name").value.trim();
  const code = $("#code").value.trim();
  const major = $("#major").value.trim();
  const gpaStr = $("#gpa").value.trim();

  if (!name || !code) {
    alert("Name and Student ID are required.");
    return;
  }

  let gpa = gpaStr === "" ? null : Number(gpaStr);
  if (gpa !== null && (isNaN(gpa) || gpa < 0 || gpa > 4)) {
    alert("GPA must be a number between 0.0 and 4.0.");
    return;
  }

  upsertStudent({ id, name, code, major, gpa });
}

function handleTableClick(e) {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id = btn.getAttribute("data-id");
  const action = btn.getAttribute("data-action");
  const student = state.students.find((s) => s.id === id);

  if (action === "edit" && student) {
    $("#student-id").value = student.id;
    $("#name").value = student.name;
    $("#code").value = student.code;
    $("#major").value = student.major || "";
    $("#gpa").value = student.gpa ?? "";
    $("#save-btn").textContent = "Update";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  if (action === "delete") {
    if (confirm(`Delete ${student?.name || "this student"}?`)) deleteStudent(id);
  }
}

function init() {
  load(); render();

  $("#student-form").addEventListener("submit", handleSubmit);
  $("#reset-btn").addEventListener("click", resetForm);

  $("#tbody").addEventListener("click", handleTableClick);

  $("#search").addEventListener("input", (e) => {
    state.query = e.target.value; render();
  });

  $("#sort").addEventListener("change", (e) => {
    state.sort = e.target.value; render();
  });

  $("#seed-btn").addEventListener("click", () => seed());
  $("#clear-btn").addEventListener("click", () => clearAll());
}

document.addEventListener("DOMContentLoaded", init);
