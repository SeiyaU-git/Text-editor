const shortcuts = {
  'b': () => document.execCommand('bold'),
  'i': () => document.execCommand('italic'),
  'u': () => document.execCommand('underline'),
  'h': () => document.execCommand('formatBlock', false, '<h1>'),
  '8': () => document.execCommand('insertUnorderedList'),
  's': () => saveDocument()
}

const tab = document.createElement("button");
const createTab = document.getElementById("createTab");

const document_tab_list = document.getElementsByClassName("document_tab_list")[0];

// createTab.addEventListener("click", () => {
//     editor.innerHTML = "";
//     // create a new tab
//     const newTab = editor.cloneNode(true);
// }



var document_buttons = document.getElementsByClassName('document_tab_btn');
for (var i = 0; i < document_buttons.length; ++i) {
    document_buttons[i].addEventListener('click', function() {
        saveDocument();
        document_tab_name = this.dataset.tabName;
        loadDocument();
    });
}


const createDocumentButton = document.getElementById("create_document_btn");

createDocumentButton.addEventListener("click", () => {
    const newTabName = prompt("Enter a name for the new document:");

    if (newTabName) {
        document_info.set(newTabName, "");
        document_tab_name = newTabName;
        saveDocument();
        loadDocument();
    }
});


const editor = document.getElementById("editor")

var document_info = new Map();
var document_tab_name = "current_tab";


editor.addEventListener('keydown', (e) => {
    if (e.ctrlKey && shortcuts[e.key]) {
        e.preventDefault();
        shortcuts[e.key]();
    }
})

window.onbeforeunload = function(){
   saveDocument()
   
}

window.onload = function exampleFunction(){
    loadDocument()
}

function loadDocument() {
    document_tab_list.innerHTML = "";
    
    for (let i = 0; i < localStorage.length; i++) {
        document_info.set(localStorage.key(i), localStorage.getItem(localStorage.key(i)));

        const newTabButton = document.createElement("button");
        newTabButton.classList.add("document_tab_btn");
        newTabButton.dataset.tabName = localStorage.key(i);
        newTabButton.innerHTML = `<i class='bx bxs-file-doc'></i> ${localStorage.key(i)}`;
        document_tab_list.appendChild(newTabButton);
        
        newTabButton.addEventListener('click', function() {
            saveDocument();
            document_tab_name = this.dataset.tabName;
            loadDocument();
        });
    }

    var text_content = document_info.get(document_tab_name)
    editor.innerHTML = text_content

    
}

function saveDocument() {
    for (let [key, value] of document_info.entries()) {
        localStorage.setItem(key, value);
    }
    localStorage.setItem(document_tab_name, editor.innerHTML);
    console.log("saved");
}
