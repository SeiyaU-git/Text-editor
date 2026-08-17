


const editor = document.getElementById("editor")

let document_info = new Map();
let current_tab = "current_tab";


const tab = document.createElement("button");
const createTab = document.getElementById("createTab");

const documentTabList = document.getElementsByClassName("document_tab_list")[0];

// createTab.addEventListener("click", () => {
//     editor.innerHTML = "";
//     // create a new tab
//     const newTab = editor.cloneNode(true);
// }




const shortcuts = {
  'b': () => document.execCommand('bold'),
  'i': () => document.execCommand('italic'),
  'u': () => document.execCommand('underline'),
  'h': () => document.execCommand('formatBlock', false, '<h1>'),
  '8': () => document.execCommand('insertUnorderedList'),
  's': () => saveToLocalStorage()
}

editor.addEventListener('keydown', (e) => {
    if (e.ctrlKey && shortcuts[e.key]) {
        e.preventDefault();
        shortcuts[e.key]();
    }
})

const document_context_menu = document.getElementsByClassName("document_context_menu")[0];

editor.addEventListener("contextmenu", (e) =>{
    if (document_context_menu) {
        e.preventDefault();
        document_context_menu.classList.add("active");
        
        document_context_menu.style.left = e.clientX + "px";
        document_context_menu.style.top = e.clientY + "px";
    }
})

window.addEventListener("click", () => {
    document_context_menu.classList.remove("active")
})

//#region Document functions
function saveToLocalStorage() {
    localStorage.setItem("document_info", JSON.stringify(Array.from(document_info.entries())));
    console.log("SAVED TO LOCAL")
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem("document_info");

    if (savedData) {
        document_info = new Map(JSON.parse(savedData));
    }
}

function saveTab() {
    if(!current_tab){
        return
    }
    document_info.set(current_tab, editor.innerHTML);
}

function renderDocument(){
    if (!current_tab && document_info.size > 0) {
        current_tab = document_info.keys().next().value;
    }

    if (!document_info.has(current_tab)) {
        current_tab = "current_tab";
    }

    documentTabList.innerHTML = ""
    for (const [key, value] of document_info) {

        const newTabButton = document.createElement("button");
        newTabButton.classList.add("document_tab_btn");
        newTabButton.dataset.tabName = key;
        newTabButton.innerHTML = `<i class='bx bxs-file-doc'></i> ${key}`;
        documentTabList.appendChild(newTabButton);
        
        if (key === current_tab) newTabButton.classList.add("active");

        newTabButton.addEventListener('click', function() {
            saveTab();
            current_tab = this.dataset.tabName;
            renderDocument();
        });
    }

    const text_content = document_info.get(current_tab) || "";
    editor.innerHTML = text_content;
}

function downlaodDocument() {
    saveTab()
    const text = editor.innerHTML
    const blob = new Blob([text], {type : "text/plain"})
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `${current_tab}.txt`
    link.click()
    URL.revokeObjectURL(link.href)
}

//#endregion

window.onbeforeunload = function(){
   saveToLocalStorage()
}

window.onload = function exampleFunction(){
    // localStorage.clear()
    loadFromLocalStorage()
    renderDocument()
}


var intervalId = setInterval(function() {
  saveToLocalStorage();
}, 25000);



const createDocumentButton = document.getElementById("create_document_btn");
const deleteDocumentButton = document.getElementById("delete_document_btn");
const saveDocumentButton = document.getElementById("save_document_btn");
const loadDocumentButton = document.getElementById("load_document_btn");
const renameDocumentButton = document.getElementById("rename_document_btn")



createDocumentButton.addEventListener("click", () => {
    const newTabName = prompt("Enter a name for the new document:");

    if (newTabName) {
        saveTab();
        document_info.set(newTabName, "");
        current_tab = newTabName;

        localStorage.setItem("document_info", JSON.stringify(Array.from(document_info.entries())));

        renderDocument();
    }
});

renameDocumentButton.addEventListener("click", () => {
    const newName = prompt("Enter a name for the document")

    if (newName){
        document_info.delete(current_tab)
        document_info.set(newName, editor.innerHTML)
        current_tab = newName
        
        renderDocument();
    }
});

deleteDocumentButton.addEventListener("click", () => {
    if (confirm(`Are you sure you want to delete the document "${current_tab}"?`)) {
        document_info.delete(current_tab);
        current_tab = document_info.keys().next().value || "Title tab"; // Set to the first available tab or a default name if none exist
        renderDocument();
    }
});

// TODO
// ADD SAVE TAB
// ADD RELOAD INFO
// ADD SAVE LOCAL STORAGE
// ADD LOAD LOCAL STORAGE
// RENAME VARIABLES

saveDocumentButton.addEventListener("click", () => {
    downlaodDocument();
});

const fileInput = document.getElementById("fileInput");

loadDocumentButton.addEventListener("click", () => {
    fileInput.click();
});

fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        const file_name = file.name.replace(/\.[^/.]+$/, "");
        document_info.set(file_name, reader.result);
        current_tab = file_name;
        renderDocument();
    }
    reader.readAsText(file);
});








