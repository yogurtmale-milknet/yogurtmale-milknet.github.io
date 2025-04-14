"use strict";

function initRemote(element){
    /* set up event listener for remote control buttons */
    let svgDoc = element.contentDocument;
    
    if (svgDoc)
        svgLoaded(svgDoc)
    else
        element.addEventListener("load", function(){svgLoaded(this.contentDocument);});
    
    element.style.display = "block";
}

function svgLoaded(svgDoc){
    let buttonArray = ["powerbutton", "1button", "2button", "3button", "4button", "5button", "6button", "7button", "8button", "9button", "0button", "redbutton", "greenbutton", "yellowbutton", "bluebutton", "textbutton", "cancelbutton", "stretchbutton", "indexbutton", "stopbutton", "revealbutton", "mixbutton", "timetextbutton", "modebutton", "blank1", "pupbutton", "pdownbutton", "mutebutton"];
    
    /* create listeners for each element in buttonarray */
    for (let index = 0, len = buttonArray.length; index < len; ++index) {
        addListenerForSVGButton(svgDoc.getElementById(buttonArray[index]), false);
    }
    
    /* create listeners with key repeat */
    addListenerForSVGButton(svgDoc.getElementById("vupbutton"), true);
    addListenerForSVGButton(svgDoc.getElementById("vdownbutton"), true);
    
    svgDoc.getElementById("body").addEventListener("touchend",function(e){e.preventDefault();},false); // ignore touching remote
}

function buttonPush(event, buttonID, repeat){
    if (event)
        event.preventDefault();
    let bbox = buttonID.getBBox();
    let cx = bbox.x + bbox.width/2;
    let cy = bbox.y + bbox.height/2;
    buttonID.setAttribute("transform","translate(" + cx*0.1 + " " + cy*0.1 + ") scale(0.9)");
    if (repeat)
        buttonID.repeatInterval = setInterval(function(){buttonPush(false,buttonID)}, 200);
    if (!(buttonID.debounce))
        buttonPressHandler(buttonID.id);
}

function buttonUnpush(buttonID){
    if (!(buttonID.debounce)){
        clearInterval(buttonID.debounceInterval);
        buttonID.debounceInterval = setInterval(function(){buttonID.debounce = false;}, 20);
        buttonID.debounce = true;
    }
}

function addListenerForSVGButton(buttonID, repeat){
    buttonID.addEventListener("touchstart",function(e){
        if (navigator.vibrate)
            window.navigator.vibrate(10);
        e.preventDefault();
        buttonPush(e, buttonID, repeat);
    },false);
    buttonID.addEventListener("touchend",function(){
        buttonID.removeAttribute("transform");
        clearInterval(buttonID.repeatInterval);
        buttonUnpush(buttonID);
    },false);
    /* on mousedown scale button to 90% to indicate button press */
    buttonID.addEventListener("mousedown",function(e){buttonPush(e, buttonID, repeat)}, false);
    /* on mouseup or mouseleave remove transformations (return button to original size) */
    buttonID.addEventListener("mouseup",function(){buttonID.removeAttribute("transform"); clearInterval(buttonID.repeatInterval);},false);
    buttonID.addEventListener("mouseleave",function(){buttonID.removeAttribute("transform"); clearInterval(buttonID.repeatInterval);},false);
}

window.addEventListener("keydown", handleKeydown);

function handleKeydown(event){
    if (event.repeat)
        return;
    
    switch (event.key){
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
            buttonPressHandler(event.key + "button");
            break;
        case "p":
        case "P":
            buttonPressHandler("powerbutton");
            break;
        case "t":
        case "T":
            buttonPressHandler("textbutton");
            break;
        case "c":
        case "C":
            buttonPressHandler("cancelbutton");
            break;
        case "s":
        case "S":
            buttonPressHandler("stretchbutton");
            break;
        case "m":
            buttonPressHandler("mixbutton");
            break;
        case "?":
            buttonPressHandler("revealbutton");
            break;
        case "h":
        case "H":
            buttonPressHandler("stopbutton");
            break;
        case "i":
        case "I":
            buttonPressHandler("indexbutton");
            break;
        case "r":
        case "R":
            buttonPressHandler("redbutton");
            break;
        case "g":
        case "G":
            buttonPressHandler("greenbutton");
            break;
        case "y":
        case "Y":
            buttonPressHandler("yellowbutton");
            break;
        case "b":
        case "B":
            buttonPressHandler("bluebutton");
            break;
        case "M":
            buttonPressHandler("mutebutton");
            break;
        case "+":
            buttonPressHandler("vupbutton");
            break;
        case "-":
            buttonPressHandler("vdownbutton");
            break;
        case "ArrowUp":
            event.preventDefault();
            buttonPressHandler("pupbutton");
            break;
        case "ArrowDown":
            event.preventDefault();
            buttonPressHandler("pdownbutton");
            break;
    }
}

/* determine which button was pressed from the id passed by the listener and call appropriate handler function */
function buttonPressHandler(buttonID){
    switch(buttonID) {
        case "powerbutton":
            powerbuttonhandler();
            break;
        case "textbutton":
            textbuttonhandler();
            break;
        case "cancelbutton":
            cancelbuttonhandler();
            break;
        case "stretchbutton":
            sizebuttonhandler();
            break;
        case "mixbutton":
            mixbuttonhandler();
            break;
        case "timetextbutton":
            timetextbuttonhandler();
            break;
        case "revealbutton":
            revealbuttonhandler();
            break;
        case "modebutton":
            break;
        /* match any of the number buttons */
        case "1button":
        case "2button":
        case "3button":
        case "4button":
        case "5button":
        case "6button":
        case "7button":
        case "8button":
        case "9button":
        case "0button":
            numberButtonHandler(parseInt(buttonID.substring(0,1)));
            break;
        case "blank1":
            blank1handler();
            break;
        case "vupbutton":
            volumebuttonhandler("up");
            break;
        case "vdownbutton":
            volumebuttonhandler("down");
            break;
        case "mutebutton":
            volumebuttonhandler("mute");
            break;
        case "pupbutton":
            channelbuttonhandler("up");
            break;
        case "pdownbutton":
            channelbuttonhandler("down");
            break;
        case "redbutton":
            linkbuttonhandler(0);
            break;
        case "greenbutton":
            linkbuttonhandler(1);
            break;
        case "yellowbutton":
            linkbuttonhandler(2);
            break;
        case "bluebutton":
            linkbuttonhandler(3);
            break;
        case "indexbutton":
            linkbuttonhandler(5);
            break;
        case "stopbutton":
            stopbuttonhandler();
            break;
    }
}
