const shortcuts = {
  'b': () => document.execCommand('bold'),
  'i': () => document.execCommand('italic'),
  'u': () => document.execCommand('underline'),
  'h': () => document.execCommand('formatBlock', false, '<h1>'),
  '8': () => document.execCommand('insertUnorderedList'),
}

const editor = document.getElementById("editor")

editor.addEventListener('keydown', (e) => {
    if (e.ctrlKey && shortcuts[e.key]) {
        e.preventDefault();
        shortcuts[e.key]();
    }
})

window.onbeforeunload = function(){
   localStorage.setItem("text", editor.innerHTML)
   
}

window.onload = function exampleFunction(){
    var text_content = localStorage.getItem("text")
    editor.innerHTML = text_content
}