const editor = document.getElementById("editor")



//#region EDITOR
const shortcuts = {
  'b': () => document.execCommand('bold'),
  'i': () => document.execCommand('italic'),
  'u': () => document.execCommand('underline'),
  'h': () => document.execCommand('formatBlock', false, '<h1>'),
  '8': () => document.execCommand('insertUnorderedList'),
  's': () => saveFolderLocal(),
  'f': () => highlight(),
  'z': () => undo(),
  '7': () => insertTodoItem(),
}


//#region UNDO AND REDO
let document_history = []
let history_index = -1  

// let cursor_history = []

function undo(){
    history_index -= 1
    if (history_index < 0) return
    editor.innerHTML = document_history[history_index]

    console.log('undo')
}

function redo(){

}

// Snapshop functions
export function createSnapshot(){
    history_index += 1
    document_history[history_index] = editor.innerHTML;
    // cursor_history[history_index] = 
}


export function clearSnapshot(){
    document_history = []
    // cursor_history = []
    history_index = -1  
}


// Create Snapshop 
editor.addEventListener('keydown', (e) => {
    if (e.ctrlKey && shortcuts[e.key]) {
        e.preventDefault();
        shortcuts[e.key]();
    }

    if (e.key == "Enter" || e.key === " " || e.key == "Return" || e.key === "Delete" || e.key === "Backspace") createSnapshot();
})
//#endregion

export function highlight(){
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

editor.addEventListener('click', (e) => {
    if (e.target.classList.contains('todo-checkbox')){
        const list = e.target.closest('.todo-item')
        list.classList.toggle('completed');
        // Basic usage
        if (!list.classList.contains("completed")){
            return
        }
        const jsConfetti = new JSConfetti()

        // Trigger colorful confetti
        jsConfetti.addConfetti({
        confettiColors: ['#ff0a54', '#474dff', '#94ff70'],
        confettiNumber: 100
        })
    }
});


function createTodoItem() {
    // const list = document.createElement('ul');
    // list.classList.add('todolist');
    
    const checkboxItem = document.createElement('div');
    checkboxItem.classList.add('todo-item');
    const checkbox = document.createElement('span');
    checkbox.classList.add('todo-checkbox');
    checkbox.contentEditable = "false";
    const label = document.createElement('span');
    label.classList.add('todo-text');
    

    checkboxItem.appendChild(checkbox);
    checkboxItem.appendChild(label);
    
    return checkboxItem;
}

function insertTodoItem() {
    const selection = window.getSelection();

    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    const selectedText = selection.toString();

    range.deleteContents();

    const list = document.createElement('div');
    list.classList.add('todo-list');

    const checkboxItem = createTodoItem();
    checkboxItem.querySelector('.todo-text').textContent = selectedText;

    list.appendChild(checkboxItem);

    range.insertNode(list);

    // Put the cursor at the end of the new todo
    const label = checkboxItem.querySelector('.todo-text');

    const newRange = document.createRange();
    newRange.selectNodeContents(label);
    newRange.collapse(false);

    selection.removeAllRanges();
    selection.addRange(newRange);
}

editor.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {

        const selection = window.getSelection();
        const node = selection.anchorNode;

        const element = node.nodeType === Node.TEXT_NODE
            ? node.parentElement
            : node;

        const todoItem = element.closest(".todo-item");

        if (todoItem) {
            console.log("Cursor is inside a todo item");

            e.preventDefault();

            const oldLabel = todoItem.querySelector('.todo-text');

            if (oldLabel.textContent.trim() === "") {
                const list = todoItem.closest(".todo-list");

                const paragraph = document.createElement("p");
                paragraph.innerHTML = "<br>";

                list.after(paragraph);

                todoItem.remove();

                const range = document.createRange();
                range.setStart(paragraph, 0);
                range.collapse(true);

                selection.removeAllRanges();
                selection.addRange(range);

                return;
            }

            const cursorPosition = selection.anchorOffset;

            const textBefore = oldLabel.textContent.slice(0, cursorPosition);
            const textAfter = oldLabel.textContent.slice(cursorPosition);

            oldLabel.textContent = textBefore;

            const checkboxItem = createTodoItem();

            const label = checkboxItem.querySelector('.todo-text');
            label.textContent = " " + textAfter;

            todoItem.after(checkboxItem);

            const range = document.createRange();
            range.setStart(label, 0);
            range.collapse(true);

            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
});

//#region Context Menu
const editorContextMenu = document.getElementsByClassName("editor_context_menu")[0];
const tabContextMenu = document.getElementsByClassName("tab_context_menu")[0]
const docContextMenu = document.getElementsByClassName("document_context_menu")[0]

var selected_tab = ""
var selected_document = ""

document.addEventListener("contextmenu", (e) => {
    tabContextMenu.classList.remove("active");
    editorContextMenu.classList.remove("active");
    docContextMenu.classList.remove("active");

    const tabButtons = document.getElementsByClassName("document_tab_btn");

    Array.from(tabButtons).forEach((tabButton) => {
        tabButton.classList.remove("selected");
    });

    const docButtons = document.getElementsByClassName("document_btn");

    Array.from(docButtons).forEach((docButton) => {
        docButton.classList.remove("selected");
    });


    if (editor.contains(e.target)) {
        e.preventDefault();

        editorContextMenu.style.left = `${e.clientX}px`;
        editorContextMenu.style.top = `${e.clientY}px`;
        editorContextMenu.classList.add("active");

        return;
    }

    const tabButton = e.target.closest(".document_tab_btn");

    if (tabButton) {
        e.preventDefault();

        tabContextMenu.style.left = "200px";
        tabContextMenu.style.top = `${e.clientY}px`;
        tabContextMenu.classList.add("active");

        selected_tab = tabButton.dataset.tabName;
        tabButton.classList.add("selected");
    }

    const docButton = e.target.closest(".document_btn");

    if (docButton) {
        e.preventDefault();

        docContextMenu.style.left = "200px";
        docContextMenu.style.top = `${e.clientY}px`;
        docContextMenu.classList.add("active");

        selected_document = docButton.dataset.docName;
        docButton.classList.add("selected");
    }
});

window.addEventListener("click", () => {
    editorContextMenu.classList.remove("active")
    tabContextMenu.classList.remove("active")
    docContextMenu.classList.remove("active")
    const tabButtons = document.getElementsByClassName("document_tab_btn");
    Array.from(tabButtons).forEach((tabButton) => {
        tabButton.classList.remove("selected");
    });

    const docButtons = document.getElementsByClassName("document_btn");
    Array.from(docButtons).forEach((docButton) => {
        docButton.classList.remove("selected");
    });
})


document.querySelectorAll(".editor_context_btn").forEach(button => {
    button.addEventListener("click", function() {
        editorContextMenu.classList.remove("active");

        switch(this.dataset.func){
            case "bold": document.execCommand("bold"); break;
            case "italics": document.execCommand("italic"); break;
            case "header": document.execCommand("formatBlock", false, "<h1>"); break;
            case "list": document.execCommand("insertUnorderedList"); break;
            case "un-line": document.execCommand("underline"); break;
            case "strike": document.execCommand("strikeThrough"); break;
            case "highlight": highlight(); break;
            case "todolist": insertTodoItem(); break;
        }
    });
});

document.querySelectorAll(".tab_context_btn").forEach(button => {
    button.addEventListener("click", function() {
        tabContextMenu.classList.remove("active");

        switch(this.dataset.func){
            case "create": createTabPrompt(); break;
            case "delete": deleteTabPrompt(selected_tab); break;
            case "rename": renameTabPrompt(selected_tab); break;
            case "save": downloadTab(selected_tab); break;
        }

        const tabButtons = document.getElementsByClassName("document_tab_btn");
        Array.from(tabButtons).forEach((tabButton) => {
            tabButton.classList.remove("selected");
        });
    });
});

document.querySelectorAll(".document_context_btn").forEach(button => {
    button.addEventListener("click", function() {
        docContextMenu.classList.remove("active");

        switch(this.dataset.func){ 
            case "create": createDocumentPrompt(); break;
            case "delete": deleteDocumentPrompt(selected_document); break;
            case "rename": renameDocumentPrompt(selected_document); break;
        }

        const docButtons = document.getElementsByClassName("document_btn");
        Array.from(docButtons).forEach((docButton) => {
            docButton.classList.remove("selected");
        });
    });
});


//#endregion
//#endregion


let document_save_point = new Map();


let folder_info = {
    documents: []
}

let document_info = null;
let current_document = null;

let current_tab = null;

// 📦 folder (Object)
// │    
// └── 📋 documents (Array)
//      |
//      │   name
//      └── 📦 document (Object)
//           |
//           │   name
//           └── 📋 tabs (Array)
//                │
//                └── 📦 tab (Object)
//                     │
//                     └── "content" (String)


//

//#region LOCAL SCAVE FOLDER
function saveFolderLocal(){
    localStorage.setItem("data", JSON.stringify(folder_info))
}

function loadFolderLocal(){
    const savedData = localStorage.getItem("data");

    if (savedData) {
        folder_info = JSON.parse(savedData);
    }
}
//#endregion

//#region DOCUMENT FUNCTIONS
function getDocument(document_name){
    let doc = folder_info.documents.find(doc => doc.name == document_name) 
    return doc;
}

function createDocument(name){
    var doc_info = {
        name: name,
        saved: true,
        tabs: [],
    }

    folder_info.documents.push(doc_info)
    // saveDocumentFolder(doc_info.name, doc_info)
    //FIIXf
    
}

function deleteDocument(name){
    const doc = getDocument(name);

    const index = folder_info.documents.findIndex(
        item => item === doc
    );

    if (index === -1) return;

    folder_info.documents.splice(index, 1);

    if (folder_info.documents.length > 0) {
        loadDocumentFolder(folder_info.documents[0].name);
    } else {
        document_info = null;
        current_document = null;
        current_tab = null;
    }
}

function renameDocument(name, new_name){
    let doc = getDocument(name);
    doc.name = new_name
}

function loadDocumentFolder(document_name) {
    let doc = getDocument(document_name);
    document_info = doc;
    current_document = document_info.name
    
    if (document_info.tabs.length > 0) {
        current_tab = document_info.tabs[0].name;
    }
}

//#endregion

//#region TAB FUNCTIONS
function getTab(document_name, tab_name){
    let doc = getDocument(document_name);
    const tab = doc.tabs.find(t => t.name == tab_name);
    return tab;
}

function createTab(document_name, name){
    let doc = getDocument(document_name);

    const tab = {
        name: name,
        innerHTML: "",
        saved: true,
    }

    
    doc.tabs.push(tab)

    // saveTabDocument()
     
}

function getTabIndex(tab_name){
    return document_info.tabs.findIndex(tab => tab.name === tab_name);
}

function renameTabDocument(document_name, name, new_name){
    let doc = getDocument(document_name);
    let tab = getTab(document_name, name)
    tab.name = new_name 
}

function deleteTabDocument(document_name, name){
    let doc = getDocument(document_name);
    const index = doc.tabs.findIndex(
        t => t.name === name
    );


    
    doc.tabs.splice(index, 1)
}

function saveTabDocument(tab_name = current_tab){
    if (document_info.tabs.length <= 0) {
        return
    }
    
    const tab = getTab(current_document, tab_name)

    if (!tab) {
        return
    }


    tab.innerHTML = editor.innerHTML
}


//#endregion

//#region RENDER

const TabList = document.getElementsByClassName("tab_list")[0];

const emptyDocState = document.getElementById("empty_document_state")
const emptyFolderState = document.getElementById("empty_folder_state")
function render(){

    //FOR NOW
    TabList.innerHTML = '<button data-action="create-tab"><i class="bx bxs-file-plus"></i><span>New</span></button>'
    documentList.innerHTML = '<button data-action="create-document"><i class="bx bxs-file-plus"></i><span>New</span></button>'

    editor.classList.add("deactive")

    
    if (!folder_info.documents || folder_info.documents.length == 0){
        emptyFolderState.classList.remove("deactive")
        return
    }
    emptyFolderState.classList.add("deactive")
    renderDocumentList()

    if (!document_info.tabs || document_info.tabs.length == 0){
        emptyDocState.classList.remove("deactive")
        return
    }
    emptyDocState.classList.add("deactive")
    renderTabList()
    
    
    editor.classList.remove("deactive")
    renderTab(current_document, current_tab)
}

function renderTab(document_name, tab_name){
    
    editor.innerHTML = ""
    let doc = getDocument(document_name)
    const tab = getTab(document_name, tab_name)
    if(!tab) return
    editor.innerHTML = tab.innerHTML
}


function renderTabList(){
    TabList.innerHTML = ""

    
    for (const tab of document_info.tabs) {

        //Create the tab button
        const TabButton = document.createElement("button");
        TabButton.classList.add("document_tab_btn");
        TabButton.dataset.tabName = tab.name;
        
        const icon = document.createElement("i");
        icon.classList.add("bx", "bxs-file-doc");

        const name = document.createElement("span");
        name.textContent = tab.name;

        TabButton.appendChild(icon);
        TabButton.appendChild(name);
        
        TabList.appendChild(TabButton);
        
        // ADD THE ACTIVE CLASS
        if (tab.name === current_tab) TabButton.classList.add("current");

        TabButton.addEventListener('click', function() {
            saveTabDocument();
            current_tab = this.dataset.tabName;
            render()

            clearSnapshot();
            createSnapshot();
        });
    }


    // TabList.innerHTML += '<button data-action="create-tab"><i class="bx bxs-file-plus"></i><span>New</span></button>'
}

let documentList = document.getElementsByClassName("document_list")[0];
function renderDocumentList(){
    documentList.innerHTML = ""
    
    for (let doc of folder_info.documents) {
        let docBtn = document.createElement("button");
        docBtn.classList.add("document_btn");
        docBtn.dataset.docName = doc.name;
        
        const icon = document.createElement("i");
        icon.classList.add("bx", "bxs-file-doc");

        const name = document.createElement("span");
        name.textContent = doc.name;

        docBtn.appendChild(icon);
        docBtn.appendChild(name);
        
        documentList.appendChild(docBtn);

        if (doc.name === current_document) docBtn.classList.add("current");


        //FIIIIX NOWWWWW FIX NOWW
        docBtn.addEventListener('click', function() {
            saveTabDocument()
            current_document = this.dataset.docName
            loadDocumentFolder(current_document);
            
            render();
        });
    }

    // documentList.innerHTML += '<button data-action="create-document"><i class="bx bxs-file-plus"></i><span>New</span></button>'
}

//#endregion

const tabElement = document.createElement("button");
// const createTab = document.getElementById("createTab");

const sidebar = document.getElementsByClassName("sidebar")[0];
const sidebarCollapseBtn = document.querySelector(".sidebar_collapse")

sidebarCollapseBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed")
})

// createTab.addEventListener("click", () => {
//     editor.innerHTML = "";
//     // create a new tab
//     const newTab = editor.cloneNode(true);
// }



function downloadTab(tab) {
    saveTabDocument(tab);
    const text = document_info.get(tab)
    const blob = new Blob([text], {type : "text/plain"})
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `${current_tab}.txt`
    link.click()
    URL.revokeObjectURL(link.href)
}

//#endregion

//#region browser events
window.onbeforeunload = function(){
   saveFolderLocal();
}

window.onload = function exampleFunction(){
    folder_info = {
        documents: []
    }
    // localStorage.clear()
    loadFolderLocal();

    if (folder_info.documents.length > 0) {
        loadDocumentFolder(folder_info.documents[0].name);
    }
    

    // current_document = folder_info.documents[0].name
    // document_info = folder_info.documents[0]

    // current_tab = document_info.tabs[0].name
    render()
}

let intervalId = setInterval(function() {
  saveFolderLocal();
}, 25000);

//#endregion




const saveTabButton = document.querySelector(".save_tab_btn");
const loadTabButton = document.querySelector(".load_tab_btn");
document.addEventListener("click", (e) => {
    const button = e.target.closest("[data-action]");
    if (!button) return;

    const action = button.dataset.action;

    switch (action) {
        case "create-tab":
            createTabPrompt();
            break;

        case "rename-tab":
            renameTabPrompt(current_tab);
            break;
        
        case "delete-tab":
            deleteTabPrompt(current_tab);
            break;
        
        case "create-document":
            createDocumentPrompt();
            break;
        
        case "rename-document":
            renameDocumentPrompt(current_document);
            break;
        
        case "delete-document":
            deleteDocumentPrompt(current_document);
            break;

        case "download-document":
            downloadDocument(current_document);
            break;
        
        case "load-document":
            fileInput.click();
            break;
        
        case "close-document":
            saveTabDocument(current_tab);
            downloadDocument(current_document);
            deleteDocument(current_document);
            render();
            break;


        case "create-save-point":
            PromptSavePoint();
            break;
    }
})

//#region tab Prompt functions
function createTabPrompt(){
    const newTabName = prompt("Enter a name for the new document:");

    if (newTabName) {

        
        var add_text = ""
        var add_index = 1
        while (document_info.tabs.some(tab => tab.name === newTabName + add_text)) {
            add_index += 1
            add_text = ` (${add_index})`
        }

        saveTabDocument(current_tab)
        document_info.tabs.push({
            name: newTabName + add_text,
            innerHTML: "",
            saved: true,
        })
        current_tab = newTabName + add_text;

        render()
    }
};

function renameTabPrompt(tab){
    const newName = prompt("Enter a name for the tab")

    if (!newName){
        return
    }
    if(document_info.tabs.some(tab => tab.name === newName)){
        alert("A tab with that name already exists.");
        return;
    }

    if (tab == current_tab) current_tab = newName
    renameTabDocument(current_document, tab, newName)
    
    render()
}

function deleteTabPrompt(tab){
    if (confirm(`Are you sure you want to delete the tab "${tab}"?`)) {
        deleteTabDocument(current_document, tab)
        
        if (tab === current_tab) {
            current_tab = document_info.tabs.length > 0
                ? document_info.tabs[0].name
                : null;
        }

        render()
    }
}
//#endregion

// TODO
// ADD SAVE TAB
// ADD RELOAD INFO
// ADD SAVE LOCAL STORAGE
// ADD LOAD LOCAL STORAGE
// RENAME VARIABLES

saveTabButton.addEventListener("click", () => {
    downloadTab(current_tab);
});


//FIX NOW BROKEn
// const fileInput = document.getElementById("fileInput");

// loadTabButton.addEventListener("click", () => {
//     fileInput.click();
// });

// fileInput.addEventListener("change", (event) => {
//     const file = event.target.files[0];
//     if (!file) return;

//     const reader = new FileReader();
//     reader.onload = () => {
//         const file_name = file.name.replace(/\.[^/.]+$/, "");
//         document_info.tabs.push({
//             name: file_name,
//             innerHTML: reader.result,
//             saved: true,
//         });
//         current_tab = file_name;
//         render()
//     }
//     reader.readAsText(file);

//     clearSnapshot();
//     createSnapshot();
// });

//#region Document Prompt Functions
// Opens the browser file picker and remembers where the current document is saved.
async function PromptSavePoint(){
    try {
    const handle = await window.showSaveFilePicker({types: [
            {
                description: "JSON file",
                accept: {
                    "application/json": [".json"]
                }
            }
        ]});
    
    document_save_point.set(current_document, handle);
    
    } catch (error) {
        // User cancelled
    }
}


function createDocumentPrompt(){
    const newDocumentName = prompt("Enter a name for the new document:");

    if (newDocumentName) {
        var documentNameSuffix = ""
        var documentNameNumber = 1
        // Add a number so that document names remain unique.
        while(folder_info.documents.some(doc => doc.name === newDocumentName + documentNameSuffix)){
            documentNameNumber += 1
            documentNameSuffix = ` (${documentNameNumber})`
        }

        if(folder_info.documents.length > 0)
        {
            saveTabDocument(); 
        }

        createDocument(newDocumentName + documentNameSuffix)
        loadDocumentFolder(newDocumentName + documentNameSuffix)

        render();
    }
};

function renameDocumentPrompt(documentName){
    const newName = prompt("Enter a name for the DOCUMENT");

    if (! newName){
        return
    }
    if(folder_info.documents.some(doc => doc.name === newName)){
        alert("A document with that name already exists.");
        return;
    }

    if (documentName == current_document) current_document = newName
    renameDocument(documentName, newName)
    
    render()
}

function deleteDocumentPrompt(documentName){
    if (confirm(`Are you sure you want to delete the DOCUMENT "${documentName}"?`)) {
        deleteDocument(documentName)
        
        render()
    }
}

function downloadDocument(documentName) {
    saveTabDocument(current_tab);
    let documentData = getDocument(documentName);

    documentData.type = "txtdoc";

    const documentJson = JSON.stringify(documentData)

    const blob = new Blob([documentJson], {
        type: "application/json"
    })

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${documentData.name}.json`;
    link.click();
    URL.revokeObjectURL(link.href)
}
//#endregion Document Prompt Functions

// Import a document previously exported as a JSON file.
const fileInput = document.getElementById("fileInput");
fileInput.addEventListener("change", (event) => {

    const file = event.target.files[0];

    if (!file) return;

    const fileExtension = file.name.split(".").pop().toLowerCase();

    if (fileExtension !== "json") {
        alert("Invalid file type. Please select a JSON document.");
        fileInput.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {

        try {
            const documentData = JSON.parse(reader.result);
            //documentData.type !== "txtdoc" ||
            if (typeof documentData.name !== "string" ||
                !Array.isArray(documentData.tabs)) {

                alert("Invalid document format. Please select a valid document created by this program.");
                fileInput.value = "";
                return;
            }

            folder_info.documents.push(documentData);

            current_document = documentData.name;

            loadDocumentFolder(current_document);

            render();

            clearSnapshot();
            createSnapshot();

        } catch (error) {
            alert("Invalid file. The selected file is not valid JSON.");
            fileInput.value = "";
        }
    };

    reader.readAsText(file);
});




// const ctrl_kbd = document.getElementById("ctrl_kbd");

// const kbd_elements = document.getElementsByClassName("kbd");

// const normalizeKey = (key) => {
//     const normalizedKey = key.trim().toLowerCase();
//     const aliases = {
//         control: "ctrl",
//         spacebar: "space",
//         " ": "space",
//         esc: "escape",
//         del: "delete",
//         arrowup: "up",
//         arrowdown: "down",
//         arrowleft: "left",
//         arrowright: "right"
//     };
//     return aliases[normalizedKey] || normalizedKey;
// };

// const updateKeyboardIndicator = (key, active) => {
//     const normalizedKey = normalizeKey(key);

//     if (normalizedKey === "ctrl") {
//         ctrl_kbd?.classList.toggle("active", active);
//     }

//     for (const kbd_element of kbd_elements) {
//         const displayedKey = normalizeKey(kbd_element.textContent);
//         if (displayedKey === normalizedKey || displayedKey.split(/\s*\+\s*/).includes(normalizedKey)) {
//             kbd_element.classList.toggle("active", active);
//         }
//     }
// };

// window.addEventListener("keyup", (e) => {
//     updateKeyboardIndicator(e.key, false);
// });

// window.addEventListener("keydown", (e) => {
//     updateKeyboardIndicator(e.key, true);
// });

// window.addEventListener("blur", () => {
//     for (const kbd_element of kbd_elements) {
//         kbd_element.classList.remove("active");
//     }
//     ctrl_kbd?.classList.remove("active");
// });