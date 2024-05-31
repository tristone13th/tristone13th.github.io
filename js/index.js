window.onload = function () {
    var es = document.querySelectorAll(".post-excerpt")
    for (var i = 0; i < es.length; i++) {
        var excerpt = es[i]
        while (excerpt.children.length > 3) {
            var last = excerpt.lastElementChild;
            last.remove();
        }
        excerpt.style.display = "block"
    } 
}