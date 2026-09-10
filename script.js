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
}


//#region UNDO AND REDO
let document_history = []
let history_index = -1  

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
}

export function clearSnapshot(){
    document_history = []
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



//#region Context Menu
let documentContextMenu = document.getElementsByClassName("document_context_menu")[0];
const tabContextMenu = document.getElementsByClassName("tab_context_menu")[0]

var selected_tab = ""

document.addEventListener("contextmenu", (e) => {
    tabContextMenu.classList.remove("active");
    documentContextMenu.classList.remove("active");
  const tabButtons = document.getElementsByClassName("document_tab_btn");
  Array.from(tabButtons).forEach((tabButton) => {
    tabButton.classList.remove("selected");
  });

  if (editor.contains(e.target)){
    e.preventDefault();
    documentContextMenu.style.left = `${e.clientX}px`;
    documentContextMenu.style.top = `${e.clientY}px`;
    documentContextMenu.classList.add("active"); 
    
  }else if (e.target.classList.contains("document_tab_btn")){
    e.preventDefault();
    tabContextMenu.style.left = "200px";
    tabContextMenu.style.top = `${e.clientY}px`;
    tabContextMenu.classList.add("active"); 

    selected_tab = e.target.dataset.tabName;
    e.target.classList.add("selected")
  }
});

window.addEventListener("click", () => {
    documentContextMenu.classList.remove("active")
    tabContextMenu.classList.remove("active")
    const tabButtons = document.getElementsByClassName("document_tab_btn");
    Array.from(tabButtons).forEach((tabButton) => {
        tabButton.classList.remove("selected");
    });
})


document.querySelectorAll(".doc_context_btn").forEach(button => {
    button.addEventListener("click", function() {
        documentContextMenu.classList.remove("active");

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
        tabContextMenu.classList.remove("active");

        switch(this.dataset.func){
            case "delete": deleteTab(selected_tab); break;
            case "rename": renameTab(selected_tab); break;
            case "save": downlaodDocument(selected_tab); break;
        }

        const tabButtons = document.getElementsByClassName("document_tab_btn");
        Array.from(tabButtons).forEach((tabButton) => {
            tabButton.classList.remove("selected");
        });
    });
});
//#endregion
//#endregion




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

function deleteDocument(name){ //NOT WORKING YET
    let doc = getDocument(name);

    const index = folder_info.documents.findIndex(
        item => item === doc
    );

    folder_info.documents.splice(index, 1)
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

const emptyDocScreen = document.getElementById("empty_document_screen")
const emptyFolderScreen = document.getElementById("empty_folder_screen")
function render(){

    editor.classList.add("deactive")
    // if (!current_tab && document_info.size > 0) {
    //     current_tab = document_info.keys().next().value;
    // }

    // if (!document_info.has(current_tab)) {
    //     current_tab = document_info.keys().next().value;
    // }
    
    if (!folder_info.documents || folder_info.documents.length == 0){
        emptyFolderScreen.classList.remove("deactive")
        return
    }
    emptyFolderScreen.classList.add("deactive")
    renderDocumentList()

    if (!document_info.tabs || document_info.tabs.length == 0){
        emptyDocScreen.classList.remove("deactive")
        return
    }
    emptyDocScreen.classList.add("deactive")
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
        TabButton.innerHTML = `<i class='bx bxs-file-doc'></i> <span>${tab.name}<span>`;
        TabList.appendChild(TabButton);
        
        // ADD THE ACTIVE CLASS
        if (tab.name === current_tab) TabButton.classList.add("current");

        TabButton.addEventListener('click', function() {
            saveTabDocument();
            current_tab = this.dataset.tabName;
            render()

            clearSnapshot();
            createSnapshot();
            console.log(current_tab);
        });
    }
}

let documentList = document.getElementsByClassName("document_list")[0];
function renderDocumentList(){
    documentList.innerHTML = ""
    for (let doc of folder_info.documents) {
        let docBtn = document.createElement("button");
        docBtn.classList.add("document_btn");
        docBtn.dataset.docName = doc.name;
        docBtn.innerHTML = `<i class='bx bxs-file-doc'></i> <span>${doc.name}<span>`;
        documentList.appendChild(docBtn);

        if (doc.name === current_document) docBtn.classList.add("current");


        //FIIIIX NOWWWWW FIX NOWW
        docBtn.addEventListener('click', function() {
            current_document = this.dataset.docName
            loadDocumentFolder(current_document);
            
            render();
        });
    }
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



function downlaodDocument(tab) {
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

window.onbeforeunload = function(){
   saveFolderLocal();
}

window.onload = function exampleFunction(){
    folder_info = {
        documents: []
    }
    // localStorage.clear()
    loadFolderLocal();

    // folder_info = {
    //     documents: [
    //         {name: "doc", saved: false, tabs: [
    //             {name: "1", innerHTML: "ALOT OF TEXT"},
    //             {name: "2", innerHTML: "ALOT OF h"},
    //             {name: "3", innerHTML: "ALOT OF b"},
    //         ]}
    //     ]
    // }
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



const createTabButton = document.getElementById("create_tab_btn");
const deleteTabButton = document.getElementById("delete_tab_btn");
const saveTabButton = document.getElementById("save_tab_btn");
const loadTabButton = document.getElementById("load_tab_btn");
const renameTabButton = document.getElementById("rename_tab_btn")



createTabButton.addEventListener("click", () => {
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
            innerHTML: "hello a new tab",
            saved: true,
        })
        current_tab = newTabName + add_text;

        render()
    }
});

renameTabButton.addEventListener("click", () => {
    renameTab(current_tab)
});

deleteTabButton.addEventListener("click", () => {
    deleteTab(current_tab)
});


//#region document tab functions
function renameTab(tab){
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

function deleteTab(tab){
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
    downlaodDocument(current_tab);
});

const fileInput = document.getElementById("fileInput");

loadTabButton.addEventListener("click", () => {
    fileInput.click();
});

fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        const file_name = file.name.replace(/\.[^/.]+$/, "");
        document_info.tabs.push({
            name: file_name,
            innerHTML: reader.result,
            saved: true,
        });
        current_tab = file_name;
        render()
    }
    reader.readAsText(file);

    clearSnapshot();
    createSnapshot();
});


const createDocumentButton = document.getElementById("create_document_btn");
const deleteDocumentButton = document.getElementById("delete_document_btn");
const renameDocumentButton = document.getElementById("rename_document_btn");


createDocumentButton.addEventListener("click", () => {
    const NewDocName = prompt("Enter a name for the new document:");

    if (NewDocName) {
        var add_text = ""
        var add_index = 1
        while(folder_info.documents.some(doc => doc.name === NewDocName + add_text)){
            add_index += 1
            add_text = ` (${add_index})`
        }

        if(folder_info.documents.length > 0)
        {
            saveTabDocument(); 
        }

        createDocument(NewDocName + add_text)
        loadDocumentFolder(NewDocName + add_text)
        // document_info = createDocument(NewDocName)


        render();
    }
});

deleteDocumentButton.addEventListener("click", () => {
    deleteDocumentPrompt(current_document)
});

renameDocumentButton.addEventListener("click", () => {
    renameDocumentPrompt(current_document)
});


function renameDocumentPrompt(doc_name){
    const newName = prompt("Enter a name for the DOCUMENT")

    if (! newName){
        return
    }
    if(folder_info.documents.some(doc => doc.name === newName)){
        alert("A document with that name already exists.");
        return;
    }

    if (doc_name == current_document) current_document = newName
    renameDocument(doc_name, newName)
    
    render()
}

function deleteDocumentPrompt(doc_name){
    if (confirm(`Are you sure you want to delete the DOCUMENT "${doc_name}"?`)) {
        deleteDocument(doc_name)
        
        if (doc_name === current_document && folder_info.documents.length > 0) {
            current_document = folder_info.documents[0].name
        }

        render()
    }
}








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