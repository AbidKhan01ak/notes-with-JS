const addBox = document.querySelector(".add-box"),
    popupBox = document.querySelector(".popup-box"),
    popupTitle = popupBox.querySelector("header p"),
    closeIcon = popupBox.querySelector("header i"),
    titleTag = popupBox.querySelector("input"),
    descTag = popupBox.querySelector("textarea"),
    addBtn = popupBox.querySelector("button"),
    exportBtn = document.getElementById("export-btn"),
    totalNotesElem = document.getElementById("total-notes"),
    totalCategoriesElem = document.getElementById("total-categories");

const months = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];

const notes = JSON.parse(localStorage.getItem("notes") || "[]");
const categories = new Set(JSON.parse(localStorage.getItem("categories") || "[]"));
updateCategoryFilter();

let isUpdate = false, updateId;

addBox.addEventListener("click", () => {
    popupTitle.innerText = "Add a new Note";
    addBtn.innerText = "Add Note";
    popupBox.classList.add("show");
    document.querySelector("body").style.overflow = "hidden";
    if (window.innerWidth > 660) titleTag.focus();
});

closeIcon.addEventListener("click", () => {
    isUpdate = false;
    titleTag.value = descTag.value = "";
    popupBox.classList.remove("show");
    document.querySelector("body").style.overflow = "auto";
});

document.getElementById("search-bar").addEventListener("input", e => {
    const searchTerm = e.target.value.toLowerCase();
    showNotes(searchTerm);
});

document.getElementById("category-filter").addEventListener("change", e => {
    const category = e.target.value;
    showNotes("", category);
});

const priorityOrder = { high: 1, medium: 2, low: 3 };

function showNotes(searchTerm = "", filterCategory = "") {
    if (!notes) return;
    notes.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    document.querySelectorAll(".note").forEach(li => li.remove());
    notes.forEach((note, id) => {
        if (
            (searchTerm && !note.title.toLowerCase().includes(searchTerm) &&
                !note.description.toLowerCase().includes(searchTerm)) ||
            (filterCategory && note.category !== filterCategory)
        ) {
            return;
        }
        let noteColor;
        if (note.priority === "high") noteColor = "#ffb3b3";
        else if (note.priority === "medium") noteColor = "#fff4b3";
        else noteColor = "#d4ffb3";

        let filterDesc = note.description.replaceAll("\n", '<br/>');
        let liTag = `<li class="note" style="background-color: ${noteColor}" draggable="true">
                        <div class="details">
                            <p>${note.title}</p>
                            <span>${filterDesc}</span>
                        </div>
                        <div class="bottom-content">
                            <span>${note.date}</span>
                            <span class="category">Category: ${note.category || ""}</span>
                            <span class="priority">Priority: ${note.priority || ""}</span>
                            <div class="settings">
                                <i onclick="showMenu(this)" class="uil uil-ellipsis-h"></i>
                                <ul class="menu">
                                    <li onclick="updateNote(${id}, '${note.title}', '${filterDesc}', '${note.category}', '${note.priority}')"><i class="uil uil-pen"></i>Edit</li>
                                    <li onclick="deleteNote(${id})"><i class="uil uil-trash"></i>Delete</li>
                                </ul>
                            </div>
                        </div>
                    </li>`;
        addBox.insertAdjacentHTML("afterend", liTag);
    });

    totalNotesElem.innerText = notes.length;
    totalCategoriesElem.innerText = categories.size;
}

showNotes();

function showMenu(elem) {
    elem.parentElement.classList.add("show");
    document.addEventListener("click", e => {
        if (e.target.tagName != "I" || e.target != elem) {
            elem.parentElement.classList.remove("show");
        }
    });
}

function deleteNote(noteId) {
    let confirmDel = confirm("Are you sure you want to delete this note?");
    if (!confirmDel) return;
    const deletedCategory = notes[noteId].category;
    notes.splice(noteId, 1);
    const isCategoryUsed = notes.some(note => note.category === deletedCategory);
    if (!isCategoryUsed && deletedCategory) {
        categories.delete(deletedCategory);
    }
    localStorage.setItem("notes", JSON.stringify(notes));
    localStorage.setItem("categories", JSON.stringify([...categories]));
    showNotes();
}

function updateNote(noteId, title, filterDesc, category, color) {
    let description = filterDesc.replaceAll('<br/>', '\r\n');
    updateId = noteId;
    isUpdate = true;
    addBox.click();
    titleTag.value = title;
    descTag.value = description;
    document.getElementById("category-input").value = category;
    popupTitle.innerText = "Update a Note";
    addBtn.innerText = "Update Note";
}
function updateCategoryFilter() {
    const filterDropdown = document.getElementById("category-filter");

    filterDropdown.innerHTML = '<option value="">All Categories</option>';

    const usedCategories = new Set();

    notes.forEach(note => {
        if (note.category) {
            usedCategories.add(note.category);
        }
    });
    categories.clear();
    usedCategories.forEach(category => categories.add(category));
    categories.forEach(category => {
        filterDropdown.innerHTML += `<option value="${category}">${category}</option>`;
    });

    localStorage.setItem("categories", JSON.stringify([...categories]));
}

addBtn.addEventListener("click", e => {
    e.preventDefault();
    let title = titleTag.value.trim(),
        description = descTag.value.trim(),
        category = document.getElementById("category-input").value.trim(),
        priority = document.getElementById("priority-select").value;
    if (title || description) {
        let currentDate = new Date(),
            month = months[currentDate.getMonth()],
            day = currentDate.getDate(),
            year = currentDate.getFullYear();

        let noteInfo = { title, description, category, priority, date: `${month} ${day}, ${year}` }
        if (!isUpdate) {
            notes.push(noteInfo);
            categories.add(category);
        } else {
            isUpdate = false;
            notes[updateId] = noteInfo;
            categories.add(category);
        }

        localStorage.setItem("notes", JSON.stringify(notes));
        updateCategoryFilter();
        showNotes();
        closeIcon.click();
    }
});

exportBtn.addEventListener("click", () => {
    const csvRows = [];
    csvRows.push("Title,Description,Category,Priority,Date");
    notes.forEach(note => {
        const escapedTitle = note.title.replace(/"/g, '""');
        const escapedDescription = note.description.replace(/"/g, '""');
        const escapedCategory = note.category.replace(/"/g, '""');
        csvRows.push(`"${escapedTitle}","${escapedDescription}","${escapedCategory}","${note.priority}","${note.date}"`);
    });
    const csvString = csvRows.join("\n");

    const blob = new Blob([csvString], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "notes.csv";
    link.click();
});
