/*!
 * EasyBook Jekyll Theme Javascript
 * 
 * http://laobubu.github.io/jekyll-theme-EasyBook
 * https://github.com/laobubu/jekyll-theme-EasyBook
 *
 * This is just a extension for my theme.
 */

var id2item = [];

function TOCize(toc, content, matchHeightTo) {
    if (!(toc && content && matchHeightTo)) return false

    var cnt = 0; // 记录标题的个数

    var make = function (tag) {
        return document.createElement(tag)
    }

    var aniscroll = {

        // 转移到top
        to: function (top) {
            aniscroll.setTop(top)
        },

        // 得到 文档从顶部开始滚动过的像素值
        getTop: function () {

            // 文档从顶部开始滚动过的像素值/前者的别名/前者的别名
            return window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
        },

        // 滚到该坐标value
        setTop: function (value) {

            // 滚到文档中的某一个坐标
            (window['scrollTo'] && window.scrollTo(window.scrollX, value))
        },
    }

    function scrollToHeader(header, hash, ev) {
        var y = header.getBoundingClientRect().top + aniscroll.getTop();
        if (window.history['pushState']) {
            window.history.pushState({}, header.textContent, "#" + hash);
            aniscroll.to(y);
            ev.preventDefault();
        } else {
            var y2 = aniscroll.getTop();
            setTimeout(function () {
                aniscroll.setTop(y2);
                aniscroll.to(y);
            }, 0);
        }
    }

    // 生成链接，传入的参数 h 代表要生成链接的标题对象
    var generateLink = function (h) {
        var link = make('a'); // 创建一个链接 
        cnt++; // 保持hash值不冲突
        var hash = h.getAttribute('id'); // 根据id生成哈希
        if (!hash) { // 若没有id，则根据自定义规则生成哈希
            hash = ('generated-hash-' + cnt);
            h.setAttribute('id', hash);
        }
        link.textContent = h.textContent; // 链接的文字内容为标题的文字内容
        link.setAttribute('href', '#' + hash); // 设置链接
        // link.addEventListener('click', scrollToHeader.bind(this, h, hash), false);
        return link;
    };

    function compare_and_set(h1, h2) {
        function level(hi) {
            return +hi.tagName.substr(1);
        }
        h2.level = 1;
        h2.father = null;
        if (level(h1) < level(h2)) {
            h2.level = h1.level + 1;
            h2.father = h1;
        } else if (level(h1) == level(h2)) {
            h2.level = h1.level;
            h2.father = h1.father;
        } else {
            if (h1.father) // for things like [h3, h2, ...]
                compare_and_set(h1.father, h2);
        }
    }

    // 对于选中的每一个标题进行操作，结果为生成一个 uls，其中放置结构已完全定义的无序列表，作为右侧的目录
    var headers = content.querySelectorAll('h1, h2, h3, h4');
    var uls = [make('ul')];
    var prev_level = 1;
    for (var i = 0; i < headers.length; i++) {
        var hi = headers[i];
        var ti = make('li');
        if (i == 0) { // The first heading
            hi.level = 1;
            hi.father = null;
        } else {
            compare_and_set(headers[i - 1], hi);
            prev_level = headers[i - 1].level;
        }
        ti.appendChild(generateLink(hi));
        if (prev_level < hi.level) {
            uls.push(make('ul'));
            uls[uls.length - 2].appendChild(uls[uls.length - 1]);
        } else if (prev_level > hi.level) {
            do {
                uls.pop();
            } while (--prev_level > hi.level);
        }
        uls[uls.length - 1].appendChild(ti);
    }

    // 针对没有第一级标题，直接写了多级题之后的情况。举个例子，当只有二级标题时，uls = [ul, ul, li]，这种情况需要去掉多余的 ul。
    while (true) {
        // chs是list类型，用来保存这个无序列表所有的孩子元素
        var chs = uls[0].children;
        if (chs.length == 1 && chs[0].tagName == 'UL')

            // 移除uls的第一个元素
            uls.shift();
        else
            break;
    }

    if (!cnt) return false;

    // 构建思维导图所用数据
    function recursiveConstruct(last, item, isNextUL, mindmapItem) {
        // using last to identify name when item is an UL

        function replace(str) {
            str = str.replaceAll("&nbsp;", " ");
            str = str.replaceAll("&gt;", " > ");
            str = str.replaceAll("&lt;", " < ");
            return str.replaceAll("&amp;", " & ");
        }

        if (item.tagName == 'UL') {
            id2item.push(mindmapItem)
            mindmapItem["name"] = last
            mindmapItem["children"] = []
            for (var i = 0; i < item.children.length; i++) {
                if (i == item.children.length - 1 || item.children[i + 1].tagName == 'LI') {
                    isNextUL = false
                } else {
                    isNextUL = true
                }

                let objConstructed = recursiveConstruct(last, item.children[i], isNextUL, {})
                if (objConstructed) {
                    mindmapItem["children"].push(objConstructed)
                }
                if (item.children[i].tagName == 'LI') {
                    last = replace(item.children[i].getElementsByTagName("a")[0].innerHTML)
                }
            }
        } else if (item.tagName == "LI") {
            if (isNextUL) {
                return null
            }
            mindmapItem["name"] = replace(item.getElementsByTagName("a")[0].innerHTML)
            mindmapItem["size"] = 1000
            id2item.push(mindmapItem)
        }
        return mindmapItem
    }

    var title = document.querySelector(".post-title").innerHTML
    var mindmapData = recursiveConstruct(title, uls[0], false, {})

    var scrolldummy = document.querySelector(".scroll-dummy");
    toc.appendChild(uls[0]);
    toc.style.display = 'block';

    // 这部分保持sidebar能够也能够移动到特定的位置
    var maxHeightTOC = '';
    // var ppc = document.querySelector('.col-main');
    var header_placeholder = document.querySelector('.header-placeholder');
    var s1 = function () {

        // getBoundingClientRect用于获得页面中某个元素的左，上，右和下分别相对浏览器视窗的位置。
        // offsetHeight 返回该元素的像素高度
        var dummyClientTop = scrolldummy.getBoundingClientRect().top - header_placeholder.offsetHeight,
            margin = 10,
            c, d; // c = dummyHeight, d = TOC.maxHeight (+'px') scrollTop = aniscroll.getTop(), 

        // c = -dummyClientTop + margin使其保持相对的静止
        if ((c = -dummyClientTop + margin) < 0) c = 0;
        if (c) {
            // 返回窗口的文档显示区的高度。
            var wh = window.innerHeight ||
                document.documentElement.clientHeight ||
                document.body.clientHeight;

            // col_main
            var cbox = matchHeightTo.getBoundingClientRect();

            // vq的出现是防止滑动到最底下的情况
            var vq = cbox.bottom - dummyClientTop - uls[0].offsetHeight;
            if (c > vq) c = vq;
            d = (wh - (margin << 1)) + 'px';
        } else {
            d = "";
        }
        if (d != maxHeightTOC) { //status lock.
            maxHeightTOC = d;
            if (d) {
                uls[0].setAttribute('style', 'max-height:' + d + '; width:' + (toc.offsetWidth - 20) + "px");
            } else {
                uls[0].setAttribute("style", "");
            }
        }

        // 设置该DIV的高度，scrolldummy是toc和items之间的一个空白块，用来填充
        scrolldummy.style.height = (c + 'px');
    };

    window.addEventListener('scroll', s1, false);
    window.addEventListener('resize', s1, false);

    return mindmapData
}


// 处理和Sidebar相关的函数与过程，Palm表示手掌、使用移动设备
function PalmSidebar() {
    var ww = 0; // window width
    var pcw = document.querySelector('.page-content .wrapper');
    var header = document.querySelector('.header');
    var header_placeholder = document.querySelector('.header-placeholder'); // 此元素用来表示当在手机上浏览时，点击展开按钮header变高的区域

    var is_palm_mode = false; // 展开为true，合并为false

    // 不支持旧有浏览器!
    if (typeof window['getComputedStyle'] !== 'function') return;

    // toggle后留出空白
    function s1() {
        ww = window.innerWidth ||
            document.documentElement.clientWidth ||
            document.body.clientWidth;
        var h = header.getBoundingClientRect(); // 得到相对于左上角的各个距离
        is_palm_mode = getComputedStyle(header).position !== 'static';
        header_placeholder.style.height = is_palm_mode ? (h.bottom - h.top + 'px') : '0px' // 设置为header的高度或者为0
    }

    // 展开和收回sidebar
    function toggleSidebar(e) {
        if (/expand-sidebar/.test(pcw.className)) { // 前者包含后者
            pcw.className = pcw.className.replace(/\s*expand-sidebar\s*/, ' ');
            header.className = header.className.replace(/\s*expand-sidebar\s*/, ' ');
        } else { // 前者不包含后者
            pcw.className += " expand-sidebar";
            header.className += " expand-sidebar";
        }
        setTimeout(s1, 200);
    }

    s1();
    document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar, false);
    window.addEventListener('resize', s1, false);
}


// 给代码添加双击复制的功能
function SelectAllize(selector, tips) {
    if (!window.getSelection) return null;

    var obj = document.querySelectorAll(selector);
    var selection = window.getSelection();
    var z = document.createElement("div");
    z.className = "util-notify1";
    z.textContent = tips;
    document.body.appendChild(z)

    function hide() {
        z.classList.add('hidden')
        z.style.top = '-200px'
    }

    hide();
    z.addEventListener('mouseover', hide, false);

    function clickHandler(e) {
        if (!selection.isCollapsed) return;

        var tt = e.pageY - z.offsetHeight - 15;
        z.setAttribute('style', 'left:' + (e.pageX - z.offsetWidth / 2) + 'px;top:' + (tt + 10) + 'px');
        z.classList.remove('hidden');
        setTimeout(hide, 1000);
    }

    function dblClickHandler(e) {
        selection.selectAllChildren(this);
        hide();
    }

    for (var i = obj.length; i--;) {
        var oi = obj[i];
        oi.addEventListener('click', clickHandler, false);
        oi.addEventListener('dblclick', dblClickHandler, false);
    }

    return true;
}



function RealLoad() {

    PalmSidebar();

    // 此部分用来给代码添加高亮及双击全选的功能
    SelectAllize("pre.highlight", "Double click to select all");

    // 此部分用来处理图片相关操作
    var imgs = document.querySelectorAll('.post-content > p > img');
    for (var i = imgs.length; i--;) {
        if (imgs[i].parentElement.childNodes.length === 1) {
            imgs[i].classList.add('middle-image');
        }
    }

    imgs.forEach((img) => {
        if (img.src.includes("excalidraw")) {
            const regex = /.*(\d{4}\/\d{2}\/\d{2}\/)(.*)/;
            const match = img.src.match(regex);

            img.addEventListener('click', () => {
                window.location.href = 'obsidian://advanced-uri?vault=tristone13th.github.io&openmode=true&filepath=' + match[2]
            });
            img.src = window.location.protocol + "//" + window.location.hostname + "/img/" + match[2] + ".png"
        }
    });
}


function loadMindmap() {
    var isMobile = navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/);
    if (isMobile) {
        return
    }

    // 给思维导图中的每一个节点加上内容
    var tags = document.querySelectorAll(".post-content > *");
    var headlineSet = new Set(["H1", "H2", "H3", "H4"])
    var aggTags = [];
    var curId = 0
    for (var i = 0; i < tags.length; i++) {
        var tag = tags[i]
        if (headlineSet.has(tag.tagName)) {
            var item = id2item[curId]
            curId = curId + 1
            item.content = aggTags
            aggTags = []
        } else {
            var newTag = document.createElement(tag.tagName);
            newTag.innerHTML = tag.innerHTML
            aggTags.push(newTag)
        }
    }
    var item = id2item[curId]
    item.content = aggTags

    // display button
    const map = document.querySelector("#show-map");
    map.style.display = "inline";
    map.onclick = (evt) => {
        window.open("/mindmap.html")
    };
}

// mindmapData only contains headers, not contents
var mindmapData = TOCize(
    document.querySelector('.post-toc'),
    document.querySelector('.post-content'),
    document.querySelector('.col-main')
);

// Make headings clickable to edit in Obsidian
var filepath = document.querySelector('#file-path').getAttribute("data-path").replace("_posts/", "")
const headings = document.querySelectorAll('h1:not(.page-heading), h2:not(.category), h3, h4, h5, h6');
headings.forEach((heading) => {
    heading.addEventListener('click', () => {
        const url = 'obsidian://advanced-uri?vault=tristone13th.github.io&openmode=true&filepath=' + encodeURIComponent(filepath) + '&heading=' + encodeURIComponent(heading.textContent)
        console.log(url)
        window.location.href = url
    });
});

RealLoad();

document.addEventListener("DOMContentLoaded", function () {
    renderMathInElement(document.body, {
        delimiters: [
            { left: "\\(", right: "\\)", display: true },
            { left: "\\[", right: "\\]", display: true },
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
        ],
        throwOnError: false,
        ignoredTags: ["blockquote"] // we do not need to render in quote
    });

    if (mindmapData) {
        loadMindmap();
    }
});
