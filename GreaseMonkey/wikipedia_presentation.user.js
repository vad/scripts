// ==UserScript==
// @name           wikipedia presentation
// @namespace      wikipedia
// @include        http://gnuband.org/teach/introduction_to_programming_2008/*
// ==/UserScript==
/*
 * AUTHOR: Name: Davide, Surname: Setti, email: NAME.SURNAME@gmail.com
 * LICENSE: AGPL v3.0 as on http://www.gnu.org/licenses/agpl-3.0.html
 * BASED ON THE WORK OF: dan@phiffer.org (www.phiffer.org)
 */

function loadjscssfile(filename, filetype){
    if (filetype=="js"){ //if filename is a external JavaScript file
        var fileref=document.createElement('script')
        fileref.setAttribute("type","text/javascript")
        fileref.setAttribute("src", filename)
    }
    else if (filetype=="css"){ //if filename is an external CSS file
        var fileref=document.createElement("link")
        fileref.setAttribute("rel", "stylesheet")
        fileref.setAttribute("type", "text/css")
        fileref.setAttribute("href", filename)
    }
    if (typeof fileref!="undefined")
    document.getElementsByTagName("head")[0].appendChild(fileref)
}


//enable console.log
if(unsafeWindow.console){
    var console = unsafeWindow.console;
}

var wikipedia_presentation = {
    setup: function() {
        
        this.sections = [];
        this.pos = 0;
        
        var body = document.getElementsByTagName('body')[0];
        this.orig_markup = body.innerHTML;
        var markup = body.innerHTML;
        var start = 0;
        var end = markup.indexOf('<span class="editsection"');
        while (end != -1) {
            start = markup.indexOf('</span>', end);
            end = markup.indexOf('<span class="editsection"', start);
            if (end == -1) {
                end = markup.indexOf('<div class="printfooter">', start);
                this.sections.push(markup.substr(start, end - start));
                end = -1;
            }
            this.sections.push(markup.substr(start, end - start));
        }
        if (this.sections.length > 0) {
            var div = document.getElementById('bodyContent');
            var link = div.insertBefore(document.createElement('a'), div.firstChild);
            link.innerHTML = 'Start presentation';
            link.setAttribute('href', '#presentation');
            link.addEventListener('click', this.start, false);
        }
        
        document.addEventListener('keypress', wikipedia_presentation.keypressNotStarted, false);
        
        loadjscssfile("http://jqueryjs.googlecode.com/files/jquery-1.2.6.min.js", "js");
    },
    
    start: function() {
        var body = document.getElementsByTagName('body')[0];
        body.innerHTML = '';
        body.style.textAlign = 'center';
        
        var div_controls = body.appendChild(document.createElement('div'));
        div_controls.setAttribute('id', 'slide_controls');

        var prev = div_controls.appendChild(document.createElement('a'));
        prev.innerHTML = '&larr; Prev';
        prev.setAttribute('href', '#prev');
        prev.setAttribute('href', '#prev');
        prev.style.font = '11px verdana, sans-serif';
        prev.addEventListener('click', function() {
           wikipedia_presentation.prev();
        }, false);
        
        div_controls.appendChild(document.createTextNode(' / '));
        
        var stop = div_controls.appendChild(document.createElement('a'));
        stop.innerHTML = 'Exit';
        stop.setAttribute('href', '#exit');
        stop.style.font = '11px verdana, sans-serif';
        stop.addEventListener('click', function() {
           wikipedia_presentation.stop();
        }, false);
        
        div_controls.appendChild(document.createTextNode(' / '));
        
        var next = div_controls.appendChild(document.createElement('a'));
        next.innerHTML = 'Next &rarr;';
        next.setAttribute('href', '#next');
        next.style.font = '11px verdana, sans-serif';
        next.addEventListener('click', function() {
           wikipedia_presentation.next();
        }, false);
        
        var slide = body.appendChild(document.createElement('div'));
        slide.setAttribute('id', 'wikipedia_presentation');
        slide.style.width = '500px';
        slide.style.margin = '0 auto';
        slide.style.textAlign = 'left';
        slide.style.font = '2em Helvetica, Arial';
        
        
        /* CUSTOM STYLES */
        slide.style.color = 'white';
        slide.style.background = '#191919';
        slide.style.border = '2px solid gray';
        slide.style.padding = '20px';
        
        var rollback = {};
        rollback["body.style.background"] = body.style.background;
        body.style.background = 'black';
        
        slide.innerHTML = wikipedia_presentation.sections[0];
        var items = slide.getElementsByTagName('li');
        for (var i = 1; i < items.length; i++) {
            items[i].style.display = 'none';
        }
        
        var style = document.createElement("style");
        style.innerHTML = '#wikipedia_presentation a{color:#6080b4}'+
            '#wikipedia_presentation code{background-color:#333333}'+
            '#wikipedia_presentation blockquote{background-color:#333333;border-width:1px}'+
            '#slide_controls a{color:white} #slide_controls a:visited{color:white} #slide_controls a:hover{color:white}'+
            '#slide_controls{text-align:right;margin:5px 20px 5px 0}'+
            '#wikipedia_presentation span.mw-headline{font-size:150%;border-bottom:0px}'+
            '#wikipedia_presentation p{margin:1em 0}'+
            '#wikipedia_presentation table{color:white}';
        document.getElementsByTagName("head")[0].appendChild(style);
        
        var showLE = document.createElement("script");
        var functions = 'function showListElement(i){ $(i).show("fast", function(){$(this).css({display:""});}) };';
        functions += 'function replaceBlock(i, s){ i.nextText = s; $(i).fadeOut("fast", function(s){ this.innerHTML = this.nextText; var items = this.getElementsByTagName("li"); for (var i = 1; i < items.length; i++) { items[i].style.display = "none"; } $(this).fadeIn("slow"); } )};';
        showLE.innerHTML = functions;
        document.getElementsByTagName("head")[0].appendChild(showLE);

        document.addEventListener('keypress', wikipedia_presentation.keypress, false);
        document.removeEventListener('keypress', wikipedia_presentation.keypressNotStarted, false);

        wikipedia_presentation.rollback = rollback;
        
        //jQuery
        //$ = unsafeWindow.jQuery;
    },
    
    stop: function() {
        var body = document.getElementsByTagName('body')[0];
        body.innerHTML = wikipedia_presentation.orig_markup;
        body.style.textAlign = 'left';
        wikipedia_presentation.setup();
        document.removeEventListener('keypress', wikipedia_presentation.keypress, false);

        //rollback
        body.style.background = wikipedia_presentation.rollback["body.style.background"];
    },

    keypressNotStarted: function(event) {
        if ((event.which == '112') && event.altKey && event.ctrlKey)
            wikipedia_presentation.start();
    },

    keypress: function(event) {
        if (event.keyCode == 39) {
            wikipedia_presentation.next();
        } else if (event.keyCode == 37) {
            wikipedia_presentation.prev();
        } else if (event.keyCode == 27) { //ESC
            wikipedia_presentation.stop();
        }

    },
    
    prev: function() {
        this.pos--;
        if (this.pos == -1) {
            this.pos = this.sections.length - 1;
        }
        var slide = document.getElementById('wikipedia_presentation');
        slide.innerHTML = wikipedia_presentation.sections[this.pos];
    },
    
    next: function() {
        var slide = document.getElementById('wikipedia_presentation');
        var items = slide.getElementsByTagName('li');
        
        //check if there are list items left to show (show them one per slide)
        var hidden = 0;
        for (var i = 0; i < items.length; i++) {
            if (items[i].style.display == 'none') {
                hidden++;
            }
        }
        
        if (hidden > 0) {
            if (unsafeWindow.jQuery){
                //i can't call jQuery from here, because it has problem with timers, i think: animation fails
                unsafeWindow.showListElement(items[items.length - hidden]);
            } else {
                items[items.length - hidden].style.display = 'list-item';
            }
            return;
        }
        //if we're here, we're not in a list (or we finished a list)
        
        //by vad: this prevents glitches when changing page: if the page is at the bottom, FF's toolbars remains there
        //and the page isn't correctly redrawed
        scroll(0,0); 
        
        this.pos++;
        if (this.pos == this.sections.length) {
            this.pos = 0;
        }
        
        //replace slide div content and hide all but first list items
        if (unsafeWindow.jQuery)
            unsafeWindow.replaceBlock(slide, wikipedia_presentation.sections[this.pos]);
        else {
            slide.innerHTML = wikipedia_presentation.sections[this.pos];
            var items = slide.getElementsByTagName('li');
            for (var i = 1; i < items.length; i++) {
                items[i].style.display = 'none';
            }
        }
        
    }
};

wikipedia_presentation.setup();
