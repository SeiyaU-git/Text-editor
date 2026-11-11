const CONFETTI_COUNT = 100;
const CONTEXT_MENU_LEFT_POSITION = "200px";
const MINI_EDITOR_SCROLL_DIVISOR = -5;
const MINI_EDITOR_SCROLL_OFFSET = 60;
const SCROLL_SMOOTHING_FACTOR = 0.2;
const AUTOSAVE_INTERVAL_MS = 25000;

const editor = document.getElementById("editor")
const miniEditor = document.querySelector(".mini_editor")


//#region EDITOR
// Keyboard shortcuts share the same commands as the editor's formatting controls.
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
// Each entry stores the editor HTML for a point in the editing history.
let editorHistory = []
let historyIndex = -1  

// let cursor_history = []

function undo() {
    if (historyIndex <= 0) return;

    historyIndex -= 1;
    editor.innerHTML = editorHistory[historyIndex];
    renderMiniEditor();
    isSaved = false;
    renderSaveStatus();
}

function redo(){
    if (historyIndex >= editorHistory.length - 1) return;
    historyIndex += 1;
    editor.innerHTML = editorHistory[historyIndex];
    renderMiniEditor();
    isSaved = false;
    renderSaveStatus();
}

// Capture the editor's current HTML so it can be restored by undo.
export function createSnapshot(){
    const html = editor.innerHTML;
    if (editorHistory[historyIndex] === html) return;
    editorHistory = editorHistory.slice(0, historyIndex + 1);
    editorHistory.push(html);
    historyIndex = editorHistory.length - 1;
    isSaved = false 
    renderSaveStatus()

    renderMiniEditor()
}


export function clearSnapshot(){
    editorHistory = [];
    historyIndex = -1  
}


let isSaved = false
const saveStatus = document.querySelector(".save_status")
// Keep the save indicator's styling in sync with the current save state.
function renderSaveStatus(){
    if (isSaved) saveStatus.classList.add("saved")
        else saveStatus.classList.remove("saved") 

    console.log(isSaved)
}



// Intercept supported Ctrl-key shortcuts. The resulting input event records formatting edits.
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

// A todo checkbox toggles completion; confetti is shown only when completing it.
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
        confettiNumber: CONFETTI_COUNT
        })
    }
});


function createTodoItem() {
    // Build one editable todo row, keeping its checkbox separate from its label.
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

    // Replace any selected text with a todo row containing that text.
    range.deleteContents();

    const list = document.createElement('div');
    list.classList.add('todo-list');

    const checkboxItem = createTodoItem();
    checkboxItem.querySelector('.todo-text').textContent = selectedText;

    list.appendChild(checkboxItem);

    range.insertNode(list);

    // Place the caret at the end of the label so typing can continue immediately.
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

            // Enter on an empty row exits the list; otherwise split its text into a new row.
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
// These menus are positioned on demand and remember the tab or project being acted on.
const editorContextMenu = document.getElementsByClassName("editor_context_menu")[0];
const tabContextMenu = document.getElementsByClassName("tab_context_menu")[0]
const projectContextMenu = document.querySelector(".project_context_menu, .document_context_menu")

let selectedTab = ""
let selectedProject = ""

document.addEventListener("contextmenu", (e) => {
    // Close old menus and clear their previous selection before handling this click.
    tabContextMenu.classList.remove("active");
    editorContextMenu.classList.remove("active");
    projectContextMenu.classList.remove("active");

    const tabButtons = document.querySelectorAll(".tab_btn, .document_tab_btn");

    Array.from(tabButtons).forEach((tabButton) => {
        tabButton.classList.remove("selected");
    });

    const projectButtons = document.querySelectorAll(".project_btn, .document_btn");

    Array.from(projectButtons).forEach((projectButton) => {
        projectButton.classList.remove("selected");
    });


    if (editor.contains(e.target)) {
        e.preventDefault();

        editorContextMenu.style.left = `${e.clientX}px`;
        editorContextMenu.style.top = `${e.clientY}px`;
        editorContextMenu.classList.add("active");

        return;
    }

    const tabButton = e.target.closest(".tab_btn, .document_tab_btn");

    if (tabButton) {
        e.preventDefault();

        tabContextMenu.style.left = CONTEXT_MENU_LEFT_POSITION;
        tabContextMenu.style.top = `${e.clientY}px`;
        tabContextMenu.classList.add("active");

        selectedTab = tabButton.dataset.tabName;
        tabButton.classList.add("selected");
    }

    const projectButton = e.target.closest(".project_btn, .document_btn");

    if (projectButton) {
        e.preventDefault();

        projectContextMenu.style.left = CONTEXT_MENU_LEFT_POSITION;
        projectContextMenu.style.top = `${e.clientY}px`;
        projectContextMenu.classList.add("active");

        selectedProject = projectButton.dataset.projectName || projectButton.dataset.docName;
        projectButton.classList.add("selected");
    }
});

window.addEventListener("click", () => {
    editorContextMenu.classList.remove("active")
    tabContextMenu.classList.remove("active")
    projectContextMenu.classList.remove("active")
    const tabButtons = document.querySelectorAll(".tab_btn, .document_tab_btn");
    Array.from(tabButtons).forEach((tabButton) => {
        tabButton.classList.remove("selected");
    });

    const projectButtons = document.querySelectorAll(".project_btn, .document_btn");
    Array.from(projectButtons).forEach((projectButton) => {
        projectButton.classList.remove("selected");
    });
})

1 


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

document.querySelectorAll(".project_context_btn, .document_context_btn").forEach(button => {
    button.addEventListener("click", function() {
        projectContextMenu.classList.remove("active");

        switch(this.dataset.func){ 
            case "create": createProjectPrompt(); break;
            case "delete": deleteProjectPrompt(selectedProject); break;
            case "rename": renameProjectPrompt(selectedProject); break;
        }

        const projectButtons = document.querySelectorAll(".project_btn, .document_btn");
        Array.from(projectButtons).forEach((projectButton) => {
            projectButton.classList.remove("selected");
        });
    });
});


//#endregion
//#endregion


// Save-point handles are kept per project for file-picker operations.
let projectSavePoint = new Map();


// Folder data is the in-memory model persisted to local storage and exported projects.
let folderInfo = {
    projects: []
}

let projectInfo = null;
let currentProject = null;

let currentTab = null;

// 📦 folder (Object)
// │    
// └── 📋 projects (Array)
//      |
//      │   name
//      └── 📦 project (Object)
//           |
//           │   name
//           └── 📋 tabs (Array)
//                │
//                └── 📦 tab (Object)
//                     │
//                     └── "content" (String)


//

//#region LOCAL SCAVE FOLDER
// Persist the folder model, first copying the active editor contents into its tab.
function saveFolderLocal(){
    if(renderState === VIEW.EDITOR) saveTab();

    localStorage.setItem("data", JSON.stringify(folderInfo))
    isSaved = true
    renderSaveStatus()
}

function loadFolderLocal(){
    const savedData = localStorage.getItem("data");

    if (savedData) {
        let savedFolder;
        try {
            savedFolder = JSON.parse(savedData);
        } catch (error) {
            console.warn("Saved project data is invalid JSON; keeping the current folder data.");
            return;
        }
        if (!savedFolder || typeof savedFolder !== "object") return;

        const projects = Array.isArray(savedFolder.projects) ? savedFolder.projects : [];
        const legacyProjects = Array.isArray(savedFolder.documents) ? savedFolder.documents : [];
        // Merge legacy entries without replacing current project data or losing tabs.
        for (const legacyProject of legacyProjects) {
            if (!legacyProject || typeof legacyProject.name !== "string") continue;
            if (!projects.some(project => project && project.name === legacyProject.name)) {
                projects.push(legacyProject);
            }
        }
        folderInfo = { ...savedFolder, projects };
        delete folderInfo.documents;
    }
}
//#endregion

//#region PROJECT FUNCTIONS
// Project helpers operate on folderInfo and keep the currently selected model in sync.
function getProject(projectName){
    const project = folderInfo.projects.find(project => project && project.name === projectName);
    return project;
}

function createProject(name){
    const projectInfo = {
        name: name,
        saved: true,
        tabs: [],
    };

    folderInfo.projects.push(projectInfo);
}

function deleteProject(name){
    const project = getProject(name);
    const wasSelected = currentProject === name;

    const index = folderInfo.projects.findIndex(
        item => item === project
    );

    if (index === -1) return;

    folderInfo.projects.splice(index, 1);

    if (wasSelected && folderInfo.projects.length > 0) {
        loadProject(folderInfo.projects[0].name);
    } else if (wasSelected) {
        projectInfo = null;
        currentProject = null;
        currentTab = null;
    }
}

function renameProject(name, newName){
    const project = getProject(name);
    if (!project) return false;
    project.name = newName;
    return true;
}

function loadProject(projectName) {
    projectInfo = getProject(projectName);
    if (!projectInfo) return;
    currentProject = projectInfo.name
    
    currentTab = projectInfo.tabs.length > 0 ? projectInfo.tabs[0].name : null;
}

//#endregion

//#region TAB FUNCTIONS
// Tab helpers locate and update the named tab within its parent project.
function getTab(projectName, tabName){
    const project = getProject(projectName);

    if (!project) {
        return null;
    }

    const tab = project.tabs.find(t => t.name === tabName);

    return tab || null;
}

function createTab(projectName, name){
    let project = getProject(projectName);
    if (!project) return false;

    const tab = {
        name: name,
        innerHTML: "",
        saved: true,
    }

    
    project.tabs.push(tab)
    return true;

    // saveTabDocument()
     
}

function getTabIndex(tab_name){
    return projectInfo && Array.isArray(projectInfo.tabs)
        ? projectInfo.tabs.findIndex(tab => tab.name === tab_name)
        : -1;
}

function renameTab(projectName, name, newName){
    let tab = getTab(projectName, name)
    if (!tab) return false;
    tab.name = newName 
    return true;
}

function deleteTab(projectName, name){
    let project = getProject(projectName);
    if (!project) return false;
    const index = project.tabs.findIndex(
        t => t.name === name
    );


    
    if (index === -1) return false;
    project.tabs.splice(index, 1)
    if (projectName === currentProject && currentTab === name) {
        currentTab = project.tabs.length ? project.tabs[Math.min(index, project.tabs.length - 1)].name : null;
    }
    return true;
}

function saveTab(tabName = currentTab, projectName = currentProject){
    if (!projectName || !tabName) return;
    
    const project = getProject(projectName);
    if (!project || project.tabs.length <= 0) {
        return
    }
    
    const tab = getTab(projectName, tabName)

    if (!tab) {
        return
    }

    tab.innerHTML = editor.innerHTML;
}


//#endregion

//#region RENDER

const tabList = document.querySelector(".tab_list");

const emptyProjectState = document.getElementById("empty_project_state") || document.getElementById("empty_document_state")
const emptyFolderState = document.getElementById("empty_folder_state")


// Escape moves one level out of the editor views, saving the active tab before leaving it.
document.addEventListener('keydown', (e) => {
    if (e.key == "Escape"){
        e.preventDefault();
        switch(renderState){
            case VIEW.EDITOR:
                saveTab();
                renderState = VIEW.PROJECTS;
                break;
            
            case VIEW.PROJECTS:
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
    PROJECTS: 1,
    FOLDER: 2
};

let renderState = VIEW.FOLDER

// Render the selected view, then refresh navigation lists from the current folder model.
function render(){
    switch (renderState) {
        case VIEW.EDITOR:
            renderEditor();
            break;
        case VIEW.PROJECTS:
            renderProjectMenu();
            break;
        case VIEW.FOLDER:
            renderFolderMenu();
            break;
    }


    // tab rendering
    renderProjectList()
    renderTabList()
}

function renderProjectMenu(){
    emptyProjectState.classList.remove("deactive")
    editor.classList.add("deactive")
    emptyFolderState.classList.add("deactive")


    const menuContainer = emptyProjectState.querySelectorAll(".big_container")[1]
    menuContainer.innerHTML = ""//"<button data-action='create-tab'><i class='bx bxs-file-plus'></i><span>Create New Tab</span></button>"

    for (const tab of (projectInfo?.tabs || [])) {
        const tabButton = document.createElement("button");
        tabButton.classList.add("tab_btn");
        tabButton.dataset.tabName = tab.name;
        tabButton.dataset.action = "tab_btn"

        const icon = document.createElement("i");
        icon.classList.add("bx", "bxs-file-doc");

        const name = document.createElement("span");
        name.textContent = tab.name;
        

        tabButton.appendChild(icon);
        tabButton.appendChild(name);
        
        menuContainer.appendChild(tabButton);

        if (tab.name === currentTab) tabButton.classList.add("current");
    }
}

function renderFolderMenu(){
    emptyFolderState.classList.remove("deactive")
    editor.classList.add("deactive")
    emptyProjectState.classList.add("deactive")

    
    const menuContainer = emptyFolderState.querySelectorAll(".big_container")[1]
    // menuContainer.innerHTML = "<button data-action='create-tab'><i class='bx bxs-file-plus'></i><span>Create New Tab</span></button>"

    menuContainer.innerHTML = ""//"<button data-action='create-document'><i class='bx bx-plus'></i><span>Create New Document</span></button><button data-action='load-document'><i class='bx bxs-file-import'></i><span>Load Document</span></button>"
    

    for (const project of folderInfo.projects) {
        const projectButton = document.createElement("button");
        projectButton.classList.add("project_btn");
        projectButton.dataset.projectName = project.name;
        projectButton.dataset.action = "project_btn"

        const icon = document.createElement("i");
        icon.classList.add("bx", "bxs-file-doc");

        const name = document.createElement("span");
        name.textContent = project.name;

        projectButton.appendChild(icon);
        projectButton.appendChild(name);
        
        menuContainer.appendChild(projectButton);

        if (project.name === currentProject) projectButton.classList.add("current");
    }
}

function renderEditor(){
    editor.classList.add("deactive")

    emptyFolderState.classList.add("deactive")
    emptyProjectState.classList.add("deactive")
    if (!folderInfo.projects || folderInfo.projects.length === 0){
        emptyFolderState.classList.remove("deactive")
        return
    }
    
    if (!projectInfo || !projectInfo.tabs || projectInfo.tabs.length === 0){
        emptyProjectState.classList.remove("deactive")
        return
    }
    
    
    editor.classList.remove("deactive")
    renderTab(currentProject, currentTab)
}

function renderTab(projectName, tabName){
    
    // editor.innerHTML = ""
    const tab = getTab(projectName, tabName)
    if(!tab) return
    editor.innerHTML = tab.innerHTML
    clearSnapshot();
    createSnapshot();
}

function renderMiniEditor(){
    miniEditor.classList.add("deactive")
    if (!folderInfo.projects || folderInfo.projects.length === 0){
        return
    }
    miniEditor.classList.remove("deactive")
    miniEditor.innerHTML = editor.innerHTML
}


function renderTabList(){
    const createButton = tabList.querySelector('[data-action="create-tab"]');
    tabList.innerHTML = "";
    if (createButton) tabList.appendChild(createButton);

    
    for (const tab of (projectInfo?.tabs || [])) {

        //Create the tab button
        const tabButton = document.createElement("button");
        tabButton.classList.add("tab_btn");
        tabButton.dataset.tabName = tab.name;
        tabButton.dataset.action = "tab_btn"

        const icon = document.createElement("i");
        icon.classList.add("bx", "bxs-file-doc");

        const name = document.createElement("span");
        name.textContent = tab.name;
        

        tabButton.appendChild(icon);
        tabButton.appendChild(name);
        
        tabList.appendChild(tabButton);
        
        // ADD THE ACTIVE CLASS
        if (tab.name === currentTab) tabButton.classList.add("current");
    }


    // tabList.innerHTML += '<button data-action="create-tab"><i class="bx bxs-file-plus"></i><span>New</span></button>'
}

let projectList = document.querySelector(".project_list, .document_list");
function renderProjectList(){
    const createButton = projectList.querySelector('[data-action="create-project"]');
    projectList.innerHTML = "";
    if (createButton) projectList.appendChild(createButton);
    
    for (const project of folderInfo.projects) {
        const projectButton = document.createElement("button");
        projectButton.classList.add("project_btn");
        projectButton.dataset.projectName = project.name;
        projectButton.dataset.action = "project_btn"

        const icon = document.createElement("i");
        icon.classList.add("bx", "bxs-file-doc");

        const name = document.createElement("span");
        name.textContent = project.name;

        projectButton.appendChild(icon);
        projectButton.appendChild(name);
        
        projectList.appendChild(projectButton);

        if (project.name === currentProject) projectButton.classList.add("current");

    }

    // documentList.innerHTML += '<button data-action="create-document"><i class="bx bxs-file-plus"></i><span>New</span></button>'
}

//#endregion



//#region scrolling


// Keep the minimap aligned with the page as the main document scrolls.
window.addEventListener("scroll", () => {
    const scrollAmount = window.scrollY;
    miniEditor.style.top = `${scrollAmount / MINI_EDITOR_SCROLL_DIVISOR + MINI_EDITOR_SCROLL_OFFSET}px`;
});

let dragging = false;
let targetScroll = window.scrollY;

function getScrollFromMouse(e) {
    const rect = miniEditor.getBoundingClientRect();

    const y = e.clientY - rect.top;
    // Clamp the pointer position so dragging beyond the minimap stays within page bounds.
    const percentage = Math.max(0, Math.min(1, y / rect.height));

    const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;

    return percentage * maxScroll;
}


// Clicking the minimap jumps to the corresponding position and begins dragging.
miniEditor.addEventListener("mousedown", (e) => {
    dragging = true;

    // Immediately jump to where they clicked
    targetScroll = getScrollFromMouse(e);
    window.scrollTo(0, targetScroll);
});


// During a drag, update the destination; smoothScroll performs the actual movement.
miniEditor.addEventListener("mousemove", (e) => {
    if (!dragging) return;

    // Set the destination
    targetScroll = getScrollFromMouse(e);
});


// Stop following the pointer once the mouse button is released anywhere on the page.
window.addEventListener("mouseup", () => {
    dragging = false;
});


// Ease toward the target instead of making each pointer movement a sudden jump.
function smoothScroll() {
    if (dragging) {
        const current = window.scrollY;

        const difference = targetScroll - current;

        window.scrollTo(
            0,
            current + difference * SCROLL_SMOOTHING_FACTOR
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

// The CSS collapsed class controls the sidebar's compact presentation.
sidebarCollapseBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed")
})




function downloadTab(tabName = currentTab) {
    if (!currentProject || !tabName) return;

    saveTab(tabName, currentProject);
    const tab = getTab(currentProject, tabName);
    const text = tab ? tab.innerHTML : "";
    // Export the tab's stored HTML as a downloadable text file.
    const blob = new Blob([text], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${tabName}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
}

//#endregion

//#region browser events
// Save before the browser closes or navigates away from the editor.
window.onbeforeunload = function(){
   saveFolderLocal();
}

// Load saved folder data, select its first project when available, and show the initial view.
window.onload = function initializeEditor(){
    folderInfo = {
        projects: []
    }
    // localStorage.clear()
    loadFolderLocal();

    console.log("LOADED FROM LOCAL STORAGE:", folderInfo);

    if (folderInfo.projects.length > 0) {
        loadProject(folderInfo.projects[0].name);
    }
    

    // current_document = folder_info.documents[0].name
    // document_info = folder_info.documents[0]

    // current_tab = document_info.tabs[0].name
    render()
}

let intervalId = setInterval(function() {
  saveFolderLocal();
}, AUTOSAVE_INTERVAL_MS);

//#endregion



//#region DATA ACTION
// Delegate clicks from dynamically rendered controls using their data-action attribute.
document.addEventListener("click", (e) => {
    const button = e.target.closest("[data-action]");
    if (!button) return;

    const action = button.dataset.action;

    let oldProject = ""
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
        
        case "create-project":
            createProjectPrompt();
            break;
        
        case "rename-project":
            renameProjectPrompt(currentProject);
            break;
        
        case "delete-project":
            deleteProjectPrompt(currentProject);
            break;

        case "download-project":
            downloadProject(currentProject);
            break;
        
        case "load-project":
            fileInput.click();
            break;
        
        case "close-project":
            saveTab(currentTab, currentProject);
            downloadProject(currentProject);
            deleteProject(currentProject);
            render();
            break;


        case "create-save-point":
            PromptSavePoint();
            break;
        
        case "savelocal":
            saveFolderLocal();
            break;

        case "tab_btn":
            oldProject = currentProject;
            oldTab = currentTab;    

            if(renderState == VIEW.EDITOR) saveTab(oldTab, oldProject)
                
            currentTab = button.dataset.tabName;
            renderState = VIEW.EDITOR;
            render()
            break;
        
        
        case "project_btn":
            oldProject = currentProject;
            oldTab = currentTab;

            if(renderState == VIEW.EDITOR) saveTab(oldTab, oldProject)
            
            currentProject = button.dataset.projectName
            loadProject(currentProject);
            
            renderState = VIEW.PROJECTS;
            render();
            clearSnapshot();
            break;
        
    }
})
//#endregion

//#region tab Prompt functions
// Prompt helpers validate names, update the model, and refresh the relevant view.
function createTabPrompt(){
    if (!projectInfo) return;

    const newTabName = prompt("Enter a name for the new tab:");

    if (!checkNameValidation(newTabName)) return;
    if (projectInfo.tabs.some(tab => tab.name === newTabName.trim())) {
        alert("A tab with that name already exists.");
        return;
    }
    {
        const name = newTabName.trim();
        saveTab(currentTab, currentProject);
        createTab(currentProject, name);
        currentTab = name;

        renderState = VIEW.EDITOR;
        render();
    }
};

function renameTabPrompt(tab){
    if (!projectInfo || !getTab(currentProject, tab)) return;
    const newName = prompt("Enter a name for the tab")

    if (!checkNameValidation(newName)){
        return
    }
    const trimmedName = newName.trim();
    if(projectInfo.tabs.some(existingTab => existingTab.name === trimmedName)){
        alert("A tab with that name already exists.");
        return;
    }

    if (!renameTab(currentProject, tab, trimmedName)) return;
    if (tab === currentTab) currentTab = trimmedName
    
    render()
}

function deleteTabPrompt(tab){
    if (!projectInfo || !getTab(currentProject, tab)) return;
    if (confirm(`Are you sure you want to delete the tab "${tab}"?`)) {
        if (!deleteTab(currentProject, tab)) return;
        
        if (projectInfo.tabs.length === 0) renderState = VIEW.PROJECTS;
        render()
    }
}
//#endregion


function checkNameValidation(name) {
    if (!name || name.trim() === "") {
        alert("Name cannot be empty.");
        return false;
    }
    
    if (!name){
        return false;
    }
    return true;
}

//#region Project Prompt Functions
// Opens the browser file picker and remembers where the current project is saved.
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
    
    projectSavePoint.set(currentProject, handle);
    
    } catch (error) {
        // User cancelled
    }
}


function createProjectPrompt(){
    const newProjectName = prompt("Enter a name for the new project:");

    if (!checkNameValidation(newProjectName)){
        return
    }

    const projectName = newProjectName.trim();
    if (folderInfo.projects.some(project => project.name === projectName)) {
        alert("A project with that name already exists.");
        return;
    }

    if(renderState === VIEW.EDITOR) saveTab();
    createProject(projectName);
    loadProject(projectName);
    currentTab = null;

    renderState = VIEW.PROJECTS;
    render();
};

function renameProjectPrompt(projectName){
    if (!getProject(projectName)) return;
    const newName = prompt("Enter a name for the project");

    if (!checkNameValidation(newName)){
        return
    }
    const trimmedName = newName.trim();
    if(folderInfo.projects.some(project => project.name === trimmedName && project.name !== projectName)){
        alert("A project with that name already exists.");
        return;
    }

    if (!renameProject(projectName, trimmedName)) return;
    if (projectName === currentProject) currentProject = trimmedName;
    
    render()
}

function deleteProjectPrompt(projectName){
    if (!getProject(projectName)) return;
    if (confirm(`Are you sure you want to delete the project "${projectName}"?`)) {
        if (renderState === VIEW.EDITOR && projectName === currentProject) saveTab();
        deleteProject(projectName)
        if (projectName === currentProject || !currentProject) {
            renderState = folderInfo.projects.length ? VIEW.PROJECTS : VIEW.FOLDER;
        }
        
        render()
    }
}

function downloadProject(projectName) {
    if (!projectName) return;

    saveTab(currentTab, currentProject);
    const projectData = getProject(projectName);
    if (!projectData) return;

    const exportData = { ...projectData, tabs: projectData.tabs.map(tab => ({ ...tab })) };
    exportData.type = "txtproject";

    const projectJson = JSON.stringify(exportData)

    const blob = new Blob([projectJson], {
        type: "application/json"
    })

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${projectData.name}.json`;
    link.click();
    URL.revokeObjectURL(link.href)
}
//#endregion Project Prompt Functions

// Import a project previously exported as JSON, checking its structure before use.
const fileInput = document.getElementById("fileInput");
fileInput.addEventListener("change", (event) => {

    const file = event.target.files[0];

    if (!file) return;

    const fileExtension = file.name.split(".").pop().toLowerCase();

    if (fileExtension !== "json") {
        alert("Invalid file type. Please select a JSON project.");
        fileInput.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {

        try {
            const projectData = JSON.parse(reader.result);
            if (!projectData || typeof projectData.name !== "string" ||
                !projectData.name.trim() || !Array.isArray(projectData.tabs) ||
                projectData.tabs.some(tab => !tab || typeof tab.name !== "string" || typeof tab.innerHTML !== "string")) {

                alert("Invalid project format. Please select a valid project created by this program.");
                fileInput.value = "";
                return;
            }

            const importedProject = { ...projectData, name: projectData.name.trim() };
            delete importedProject.type;
            const duplicate = folderInfo.projects.some(project => project.name === importedProject.name);
            if (duplicate) importedProject.name = `${importedProject.name} (imported)`;
            if (folderInfo.projects.some(project => project.name === importedProject.name)) {
                alert("A project with that name already exists.");
                fileInput.value = "";
                return;
            }
            folderInfo.projects.push(importedProject);
            loadProject(importedProject.name);

            renderState = importedProject.tabs.length ? VIEW.EDITOR : VIEW.PROJECTS;
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