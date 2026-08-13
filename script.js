


const editor = document.getElementById("editor")

let document_info = new Map();
let document_tab_name = "current_tab";


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
    if(!document_tab_name){
        return
    }
    document_info.set(document_tab_name, editor.innerHTML);
}

function renderDocument(){

    documentTabList.innerHTML = ""
    for (const [key, value] of document_info) {

        const newTabButton = document.createElement("button");
        newTabButton.classList.add("document_tab_btn");
        newTabButton.dataset.tabName = key;
        newTabButton.innerHTML = `<i class='bx bxs-file-doc'></i> ${key}`;
        documentTabList.appendChild(newTabButton);
        
        newTabButton.addEventListener('click', function() {
            saveTab();
            document_tab_name = this.dataset.tabName;
            renderDocument();
        });
    }

    var text_content = document_info.get(document_tab_name)
    editor.innerHTML = text_content 
}

function downlaodDocument() {
    saveDocument()
    const text = editor.innerHTML
    const blob = new Blob([text], {type : "text/plain"})
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `${document_tab_name}.txt`
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


const fileInput = document.getElementById("fileInput");


createDocumentButton.addEventListener("click", () => {
    const newTabName = prompt("Enter a name for the new document:");

    if (newTabName) {
        saveDocument();
        document_info.set(newTabName, "");
        document_tab_name = newTabName;

        localStorage.setItem("document_info", JSON.stringify(Array.from(document_info.entries())));

        loadDocument();
    }
});

renameDocumentButton.addEventListener("click", () => {
    const newName = prompt("Enter a name for the document")

    if (newName){
        document_info.delete(document_tab_name)
        document_info.set(newName, editor.innerHTML)
        document_tab_name = newName
        
        renderDocument();
    }
});

deleteDocumentButton.addEventListener("click", () => {
    if (confirm(`Are you sure you want to delete the document "${document_tab_name}"?`)) {
        document_info.delete(document_tab_name);
        document_tab_name = document_info.keys().next().value || "Title tab"; // Set to the first available tab or a default name if none exist
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

loadDocumentButton.addEventListener("click", () => {
    fileInput.click();
});

fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        editor.innerHTML = reader.result;
    }
    reader.readAsText(file);
});








