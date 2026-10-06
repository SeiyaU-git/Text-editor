const editor = document.getElementById("editor")
const miniEditor = document.querySelector(".mini_editor")


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

//   'escape': () => {
//     const selection = window.getSelection();
//     selection.removeAllRanges();
//   }

//#region UNDO AND REDO
let documentHistory = []
let historyIndex = -1  

// let cursor_history = []

function undo(){
    historyIndex -= 1
    if (historyIndex < 0) return
    editor.innerHTML = documentHistory[historyIndex]

    console.log('undo')
}

function redo(){

}

// Snapshop functions
export function createSnapshot(){
    historyIndex += 1
    documentHistory[historyIndex] = editor.innerHTML;
    // cursor_history[history_index] = 
    isSaved = false 
    renderSaveStatus()

    renderMiniEditor()
}


export function clearSnapshot(){
    documentHistory = []
    // cursor_history = []
    historyIndex = -1  
}


let isSaved = false
const saveStatus = document.querySelector(".save_status")
function renderSaveStatus(){
    if (isSaved) saveStatus.classList.add("saved")
        else saveStatus.classList.remove("saved") 

    console.log(isSaved)
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

let selectedTab = ""
let selectedDocument = ""

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

        selectedTab = tabButton.dataset.tabName;
        tabButton.classList.add("selected");
    }

    const docButton = e.target.closest(".document_btn");

    if (docButton) {
        e.preventDefault();

        docContextMenu.style.left = "200px";
        docContextMenu.style.top = `${e.clientY}px`;
        docContextMenu.classList.add("active");

        selectedDocument = docButton.dataset.docName;
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
            case "delete": deleteTabPrompt(selectedTab); break;
            case "rename": renameTabPrompt(selectedTab); break;
            case "save": downloadTab(selectedTab); break;
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
            case "delete": deleteDocumentPrompt(selectedDocument); break;
            case "rename": renameDocumentPrompt(selectedDocument); break;
        }

        const docButtons = document.getElementsByClassName("document_btn");
        Array.from(docButtons).forEach((docButton) => {
            docButton.classList.remove("selected");
        });
    });
});


//#endregion
//#endregion


let documentSavePoint = new Map();


let folderInfo = {
    documents: []
}

let documentInfo = null;
let currentDocument = null;

let currentTab = null;

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
    if(renderState === VIEW.EDITOR) saveTabDocument();

    localStorage.setItem("data", JSON.stringify(folderInfo))
    isSaved = true
    renderSaveStatus()
}

function loadFolderLocal(){
    const savedData = localStorage.getItem("data");

    if (savedData) {
        folderInfo = JSON.parse(savedData);
    }
}
//#endregion

//#region DOCUMENT FUNCTIONS
function getDocument(document_name){
    const doc = folderInfo.documents.find(doc => doc.name === document_name);
    return doc;
}

function createDocument(name){
    const doc_info = {
        name: name,
        saved: true,
        tabs: [],
    };

    folderInfo.documents.push(doc_info);
    // saveDocumentFolder(doc_info.name, doc_info)
    //FIIXf
}

function deleteDocument(name){
    const doc = getDocument(name);

    const index = folderInfo.documents.findIndex(
        item => item === doc
    );

    if (index === -1) return;

    folderInfo.documents.splice(index, 1);

    if (folderInfo.documents.length > 0) {
        loadDocumentFolder(folderInfo.documents[0].name);
    } else {
        documentInfo = null;
        currentDocument = null;
        currentTab = null;
    }
}

function renameDocument(name, new_name){
    const doc = getDocument(name);
    doc.name = new_name;
}

function loadDocumentFolder(document_name) {
    let doc = getDocument(document_name);
    documentInfo = doc;
    currentDocument = documentInfo.name
    
    if (documentInfo.tabs.length > 0) {
        currentTab = documentInfo.tabs[0].name;
    }
}

//#endregion

//#region TAB FUNCTIONS
function getTab(document_name, tab_name){
    const doc = getDocument(document_name);

    if (!doc) {
        return null;
    }

    const tab = doc.tabs.find(t => t.name === tab_name);

    return tab || null;
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
    return documentInfo.tabs.findIndex(tab => tab.name === tab_name);
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

function saveTabDocument(tab_name = currentTab, doc_name = currentDocument){
    if (!doc_name || !tab_name) return;
    
    const doc = getDocument(doc_name);
    if (!doc || doc.tabs.length <= 0) {
        return
    }
    
    const tab = getTab(doc_name, tab_name)

    if (!tab) {
        return
    }

    // Don't accidentally erase a tab
    if (editor.innerHTML === "" && tab.innerHTML !== "") {
        console.warn("Blocked accidental empty tab save");
        return;
    }

    tab.innerHTML = editor.innerHTML;
}


//#endregion

//#region RENDER

const TabList = document.querySelector(".tab_list");

const emptyDocState = document.getElementById("empty_document_state")
const emptyFolderState = document.getElementById("empty_folder_state")


document.addEventListener('keydown', (e) => {
    if (e.key == "Escape"){
        e.preventDefault();
        switch(renderState){
            case VIEW.EDITOR:
                saveTabDocument();
                renderState = VIEW.DOCUMENTS;
                break;
            
            case VIEW.DOCUMENTS:
                renderState = VIEW.FOLDER;
                break;
            
            // case RENDER_FOLDERMENU:
            //     render_state = RENDER_DOCMENU;
            //     break;
        }
        render()
    }
});

const VIEW = {
    EDITOR: 0,
    DOCUMENTS: 1,
    FOLDER: 2
};

let renderState = VIEW.FOLDER

function render(){
    switch (renderState) {
        case VIEW.EDITOR:
            renderEditor();
            break;
        case VIEW.DOCUMENTS:
            renderDocumentMenu();
            break;
        case VIEW.FOLDER:
            renderFolderMenu();
            break;
    }


    // tab rendering
    TabList.innerHTML = '<button data-action="create-tab"><i class="bx bxs-file-plus"></i><span>New</span></button>'
    documentList.innerHTML = '<button data-action="create-document"><i class="bx bxs-file-plus"></i><span>New</span></button>'

    //FOR NOW
    if (!folderInfo.documents || folderInfo.documents.length == 0){
        return
    }

    renderDocumentList()

    if (!documentInfo.tabs || documentInfo.tabs.length == 0){
        return
    }
    
    renderTabList()
}

function renderDocumentMenu(){
    emptyDocState.classList.remove("deactive")
    editor.classList.add("deactive")
    emptyFolderState.classList.add("deactive")


    const menuContainer = emptyDocState.querySelectorAll(".big_container")[1]
    menuContainer.innerHTML = ""//"<button data-action='create-tab'><i class='bx bxs-file-plus'></i><span>Create New Tab</span></button>"

    for (const tab of documentInfo.tabs) {
        const TabButton = document.createElement("button");
        TabButton.classList.add("document_tab_btn");
        TabButton.dataset.tabName = tab.name;
        TabButton.dataset.action = "tab_btn"

        const icon = document.createElement("i");
        icon.classList.add("bx", "bxs-file-doc");

        const name = document.createElement("span");
        name.textContent = tab.name;
        

        TabButton.appendChild(icon);
        TabButton.appendChild(name);
        
        menuContainer.appendChild(TabButton);

        if (tab.name === currentTab) TabButton.classList.add("current");
    }
}

function renderFolderMenu(){
    emptyFolderState.classList.remove("deactive")
    editor.classList.add("deactive")
    emptyDocState.classList.add("deactive")

    
    const menuContainer = emptyFolderState.querySelectorAll(".big_container")[1]
    // menuContainer.innerHTML = "<button data-action='create-tab'><i class='bx bxs-file-plus'></i><span>Create New Tab</span></button>"

    menuContainer.innerHTML = ""//"<button data-action='create-document'><i class='bx bx-plus'></i><span>Create New Document</span></button><button data-action='load-document'><i class='bx bxs-file-import'></i><span>Load Document</span></button>"
    

    for (let doc of folderInfo.documents) {
        let docBtn = document.createElement("button");
        docBtn.classList.add("document_btn");
        docBtn.dataset.docName = doc.name;
        docBtn.dataset.action = "document_tab_btn"

        const icon = document.createElement("i");
        icon.classList.add("bx", "bxs-file-doc");

        const name = document.createElement("span");
        name.textContent = doc.name;

        docBtn.appendChild(icon);
        docBtn.appendChild(name);
        
        menuContainer.appendChild(docBtn);

        if (doc.name === currentDocument) docBtn.classList.add("current");
    }
}

function renderEditor(){
    editor.classList.add("deactive")

    emptyFolderState.classList.add("deactive")
    emptyDocState.classList.add("deactive")
    if (!folderInfo.documents || folderInfo.documents.length == 0){
        emptyFolderState.classList.remove("deactive")
        return
    }
    
    if (!documentInfo || !documentInfo.tabs || documentInfo.tabs.length == 0){
        emptyDocState.classList.remove("deactive")
        return
    }
    
    
    editor.classList.remove("deactive")
    renderTab(currentDocument, currentTab)
}

function renderTab(document_name, tab_name){
    
    // editor.innerHTML = ""
    let doc = getDocument(document_name)
    const tab = getTab(document_name, tab_name)
    if(!tab) return
    editor.innerHTML = tab.innerHTML
}

function renderMiniEditor(){
    miniEditor.classList.add("deactive")
    if (!folderInfo.documents || folderInfo.documents.length == 0){
        return
    }
    miniEditor.classList.remove("deactive")
    miniEditor.innerHTML = editor.innerHTML
}


function renderTabList(){
    TabList.innerHTML = ""

    
    for (const tab of documentInfo.tabs) {

        //Create the tab button
        const TabButton = document.createElement("button");
        TabButton.classList.add("document_tab_btn");
        TabButton.dataset.tabName = tab.name;
        TabButton.dataset.action = "tab_btn"

        const icon = document.createElement("i");
        icon.classList.add("bx", "bxs-file-doc");

        const name = document.createElement("span");
        name.textContent = tab.name;
        

        TabButton.appendChild(icon);
        TabButton.appendChild(name);
        
        TabList.appendChild(TabButton);
        
        // ADD THE ACTIVE CLASS
        if (tab.name === currentTab) TabButton.classList.add("current");
    }


    // TabList.innerHTML += '<button data-action="create-tab"><i class="bx bxs-file-plus"></i><span>New</span></button>'
}

let documentList = document.querySelector(".document_list");
function renderDocumentList(){
    documentList.innerHTML = ""
    
    for (let doc of folderInfo.documents) {
        let docBtn = document.createElement("button");
        docBtn.classList.add("document_btn");
        docBtn.dataset.docName = doc.name;
        docBtn.dataset.action = "document_tab_btn"

        const icon = document.createElement("i");
        icon.classList.add("bx", "bxs-file-doc");

        const name = document.createElement("span");
        name.textContent = doc.name;

        docBtn.appendChild(icon);
        docBtn.appendChild(name);
        
        documentList.appendChild(docBtn);

        if (doc.name === currentDocument) docBtn.classList.add("current");

    }

    // documentList.innerHTML += '<button data-action="create-document"><i class="bx bxs-file-plus"></i><span>New</span></button>'
}

//#endregion



//#region scrolling


window.addEventListener("scroll", () => {
    const scrollAmount = window.scrollY;
    miniEditor.style.top = `${scrollAmount / -5 + 60}px`;
});

let dragging = false;
let targetScroll = window.scrollY;

function getScrollFromMouse(e) {
    const rect = miniEditor.getBoundingClientRect();

    const y = e.clientY - rect.top;
    const percentage = Math.max(0, Math.min(1, y / rect.height));

    const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;

    return percentage * maxScroll;
}


// CLICK / START DRAG
miniEditor.addEventListener("mousedown", (e) => {
    dragging = true;

    // Immediately jump to where they clicked
    targetScroll = getScrollFromMouse(e);
    window.scrollTo(0, targetScroll);
});


// DRAG
miniEditor.addEventListener("mousemove", (e) => {
    if (!dragging) return;

    // Set the destination
    targetScroll = getScrollFromMouse(e);
});


// STOP DRAG
window.addEventListener("mouseup", () => {
    dragging = false;
});


// SMOOTH DRAGGING
function smoothScroll() {
    if (dragging) {
        const current = window.scrollY;

        const difference = targetScroll - current;

        window.scrollTo(
            0,
            current + difference * 0.2
        );
    }

    requestAnimationFrame(smoothScroll);
}

smoothScroll();

//#endregion

const tabElement = document.createElement("button");
// const createTab = document.getElementById("createTab");

const sidebar = document.querySelector(".sidebar");
const sidebarCollapseBtn = document.querySelector(".sidebar_collapse")

sidebarCollapseBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed")
})

// createTab.addEventListener("click", () => {
//     editor.innerHTML = "";
//     // create a new tab
//     const newTab = editor.cloneNode(true);
// }



function downloadTab(tabName = currentTab) {
    if (!currentDocument || !tabName) return;

    saveTabDocument(tabName, currentDocument);
    const tab = getTab(currentDocument, tabName);
    const text = tab ? tab.innerHTML : "";
    const blob = new Blob([text], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${tabName}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
}

//#endregion

//#region browser events
window.onbeforeunload = function(){
   saveFolderLocal();
}

window.onload = function exampleFunction(){
    folderInfo = {
        documents: []
    }
    // localStorage.clear()
    loadFolderLocal();

    console.log("LOADED FROM LOCAL STORAGE:", folderInfo);

    if (folderInfo.documents.length > 0) {
        loadDocumentFolder(folderInfo.documents[0].name);
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



//#region DATA ACTION
document.addEventListener("click", (e) => {
    const button = e.target.closest("[data-action]");
    if (!button) return;

    const action = button.dataset.action;

    let oldDocument = ""
    let oldTab = ""

    switch (action) {
        case "create-tab":
            createTabPrompt();
            break;

        case "rename-tab":
            renameTabPrompt(currentTab);
            break;
        
        case "delete-tab":
            deleteTabPrompt(currentTab);
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
            downloadDocument(currentDocument);
            break;
        
        case "load-document":
            fileInput.click();
            break;
        
        case "close-document":
            saveTabDocument(currentTab, currentDocument);
            downloadDocument(currentDocument);
            deleteDocument(currentDocument);
            render();
            break;


        case "create-save-point":
            PromptSavePoint();
            break;
        
        case "savelocal":
            saveFolderLocal();
            break;

        case "tab_btn":
            oldDocument = currentDocument;
            oldTab = currentTab;    

            if(renderState == VIEW.EDITOR) saveTabDocument(oldTab, oldDocument)
                
            currentTab = button.dataset.tabName;
            renderState = VIEW.EDITOR;
            render()

            clearSnapshot();
            createSnapshot();
            break;
        
        
        case "document_tab_btn":
            oldDocument = currentDocument;
            oldTab = currentTab;

            //FIIIIX NOWWWWW FIX NOWW
            if(renderState == VIEW.EDITOR) saveTabDocument(oldTab, oldDocument)
            
            currentDocument = button.dataset.docName
            loadDocumentFolder(currentDocument);
            
            renderState = VIEW.DOCUMENTS;
            render();
            break;
        
    }
})
//#endregion

//#region tab Prompt functions
function createTabPrompt(){
    if (!documentInfo) return;

    const newTabName = prompt("Enter a name for the new document:");

    if (newTabName) {
        let addText = "";
        let addIndex = 1;
        while (documentInfo.tabs.some(tab => tab.name === newTabName + addText)) {
            addIndex += 1;
            addText = ` (${addIndex})`;
        }

        saveTabDocument(currentTab, currentDocument);
        documentInfo.tabs.push({
            name: newTabName + addText,
            innerHTML: "",
            saved: true,
        });
        currentTab = newTabName + addText;

        renderState = VIEW.EDITOR;
        render();
    }
};

function renameTabPrompt(tab){
    const newName = prompt("Enter a name for the tab")

    if (!newName){
        return
    }
    if(documentInfo.tabs.some(tab => tab.name === newName)){
        alert("A tab with that name already exists.");
        return;
    }

    if (tab == currentTab) currentTab = newName
    renameTabDocument(currentDocument, tab, newName)
    
    render()
}

function deleteTabPrompt(tab){
    if (confirm(`Are you sure you want to delete the tab "${tab}"?`)) {
        deleteTabDocument(currentDocument, tab)
        
        if (tab === currentTab) {
            currentTab = documentInfo.tabs.length > 0
                ? documentInfo.tabs[0].name
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
async function promptSavePoint(){
    try {
    const handle = await window.showSaveFilePicker({types: [
            {
                description: "JSON file",
                accept: {
                    "application/json": [".json"]
                }
            }
        ]});
    
    documentSavePoint.set(currentDocument, handle);
    
    } catch (error) {
        // User cancelled
    }
}


function createDocumentPrompt(){
    const newDocumentName = prompt("Enter a name for the new document:");

    if (newDocumentName) {
        let documentNameSuffix = ""
        let documentNameNumber = 1
        // Add a number so that document names remain unique.
        while(folderInfo.documents.some(doc => doc.name === newDocumentName + documentNameSuffix)){
            documentNameNumber += 1
            documentNameSuffix = ` (${documentNameNumber})`
        }

        if(folderInfo.documents.length > 0 && renderState == VIEW.EDITOR)
        {
            saveTabDocument(); 
        }

        createDocument(newDocumentName + documentNameSuffix)
        loadDocumentFolder(newDocumentName + documentNameSuffix)

        renderState = VIEW.DOCUMENTS;
        render();
    }
};

function renameDocumentPrompt(documentName){
    const newName = prompt("Enter a name for the DOCUMENT");

    if (! newName){
        return
    }
    if(folderInfo.documents.some(doc => doc.name === newName)){
        alert("A document with that name already exists.");
        return;
    }

    if (documentName == currentDocument) currentDocument = newName
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
    if (!documentName) return;

    saveTabDocument(currentTab, currentDocument);
    let documentData = getDocument(documentName);
    if (!documentData) return;

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

                    folderInfo.documents.push(documentData);

            currentDocument = documentData.name;

            loadDocumentFolder(currentDocument);

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