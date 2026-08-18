


const editor = document.getElementById("editor")

let document_info = new Map();
let current_tab = "current_tab";


const tab = document.createElement("button");
const createTab = document.getElementById("createTab");

const documentTabList = document.getElementsByClassName("document_tab_list")[0];

const sidebar = document.getElementsByClassName("sidebar")[0];

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
  's': () => saveToLocalStorage(),
  'f': () => highlight(),
}

editor.addEventListener('keydown', (e) => {
    if (e.ctrlKey && shortcuts[e.key]) {
        e.preventDefault();
        shortcuts[e.key]();
    }
})


function highlight(){
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    if (selection.isCollapsed) return; // No text selected

    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    
    span.classList.add('highlight');
    range.surroundContents(span);

    selection.removeAllRanges();
    selection.addRange(range);
    
}



const document_context_menu = document.getElementsByClassName("document_context_menu")[0];
const tab_context_menu = document.getElementsByClassName("tab_context_menu")[0]

var selected_tab = ""

document.addEventListener("contextmenu", (e) => {
  tab_context_menu.classList.remove("active");
  document_context_menu.classList.remove("active");
  const tabButtons = document.getElementsByClassName("document_tab_btn");
  Array.from(tabButtons).forEach((tabButton) => {
    tabButton.classList.remove("selected");
  });

  if (editor.contains(e.target)){
    e.preventDefault();
    document_context_menu.style.left = `${e.clientX}px`;
    document_context_menu.style.top = `${e.clientY}px`;
    document_context_menu.classList.add("active"); 
    
  }else if (e.target.classList.contains("document_tab_btn")){
    e.preventDefault();
    tab_context_menu.style.left = "200px";
    tab_context_menu.style.top = `${e.clientY}px`;
    tab_context_menu.classList.add("active"); 

    selected_tab = e.target.dataset.tabName;
    e.target.classList.add("selected")
  }
});

window.addEventListener("click", () => {
    document_context_menu.classList.remove("active")
    tab_context_menu.classList.remove("active")
    const tabButtons = document.getElementsByClassName("document_tab_btn");
    Array.from(tabButtons).forEach((tabButton) => {
        tabButton.classList.remove("selected");
    });
})


document.querySelectorAll(".doc_context_btn").forEach(button => {
    button.addEventListener("click", function() {
        document_context_menu.classList.remove("active");

        switch(this.dataset.func){
            case "bold": document.execCommand("bold"); break;
            case "italics": document.execCommand("italic"); break;
            case "header": document.execCommand("formatBlock", false, "<h1>"); break;
            case "list": document.execCommand("insertUnorderedList"); break;
            case "underline": document.execCommand("underline"); break;
            case "strike": document.execCommand("strikeThrough"); break;
            case "highlight": highlight(); break;
        }
    });
});

document.querySelectorAll(".tab_context_btn").forEach(button => {
    button.addEventListener("click", function() {
        tab_context_menu.classList.remove("active");

        switch(this.dataset.func){
            case "delete": delete_tab(selected_tab); break;
            case "rename": rename_tab(selected_tab); break;
            case "save": downlaodDocument(selected_tab); break;
        }

        const tabButtons = document.getElementsByClassName("document_tab_btn");
        Array.from(tabButtons).forEach((tabButton) => {
            tabButton.classList.remove("selected");
        });
    });
});


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

function downlaodDocument(tab) {
    saveTab()
    const text = document_info.get(tab)
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
    rename_tab(current_tab)
});

deleteDocumentButton.addEventListener("click", () => {
    delete_tab(current_tab)
});


//#region document tab functions
function rename_tab(tab){
    const newName = prompt("Enter a name for the document")

    if (newName){
        document_info.delete(tab)
        document_info.set(newName, editor.innerHTML)
        
        if (tab == current_tab) current_tab = newName
        
        renderDocument();
    }
}

function delete_tab(tab){
    if (confirm(`Are you sure you want to delete the document "${tab}"?`)) {
        document_info.delete(tab);
        tab = document_info.keys().next().value || "current tab"; // Set to the first available tab or a default name if none exist
        renderDocument();
    }
}

//#endregion

// TODO
// ADD SAVE TAB
// ADD RELOAD INFO
// ADD SAVE LOCAL STORAGE
// ADD LOAD LOCAL STORAGE
// RENAME VARIABLES

saveDocumentButton.addEventListener("click", () => {
    downlaodDocument(current_tab);
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








