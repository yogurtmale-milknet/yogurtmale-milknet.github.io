"use strict";

let staticImg;
let videoCanvas = document.createElement("canvas");
let videoCanvasContext = videoCanvas.getContext("2d");
let renderer;
let paramsNoUI = 0;
let hashStringProperties = {};

/* define variables for settings.js */
let widescreen = false;
let prompt = false;
let unevenFlashRatio = false;
let autoPowerOffTime = 30;
let defaultHashString = "";

window.addEventListener('load', init, false);

let hashString;
window.addEventListener("hashchange", hashStringChanged, false); /* listener for hash changes */

function hashStringChanged(){
    if (window.location.hash.substring(1) != hashString)
        window.location.reload(); // hashstring changed out of our control
}

function init(){
    let vars = window.location.search.substring(1).split("&");
    for (let i=0;i<vars.length;i++) {
        let pair = vars[i].split("=");
        switch (pair[0]){
            case "noUI":
                paramsNoUI = parseInt(pair[1]);
                break;
            case "widescreen":
                widescreen=parseInt(pair[1]);
                break;
        }
    }
    
    if (window.location.hash.length == 0 && defaultHashString)
    {
        hashString = defaultHashString.replace(/^#/, '');
        window.location.hash = hashString;
    }
    
    if (window.location.hash.length > 1)
    {
        let hashParts = window.location.hash.substring(1).split(":", -1);
        for (let i = 0; i < hashParts.length; i++){
            let keyPair = hashParts[i];
            let delimOffset = keyPair.search("=");
            if (delimOffset > 0){
                hashStringProperties[keyPair.slice(0,delimOffset)] = keyPair.slice(delimOffset+1);
            } else {
                console.log("invalid keypair ",keyPair);
            }
        }
    }
    
    videoCanvas.width = widescreen?1024:768;
    videoCanvas.height = 576;
    
    renderer = new TeletextRenderer(document.getElementById("teletextCanvas"), videoCanvas, document.getElementById("screen"));
    
    renderer.setTeletextOpacity(0); // hide teletext
    renderer.setWidescreen(widescreen);
    
    renderer.setUnevenFlashRatio(unevenFlashRatio);
    
    staticImg = document.getElementById("static");
    
    videoCanvasContext.rect(0, 0, widescreen?1024:768, 576);
    videoCanvasContext.fillStyle = "black";
    videoCanvasContext.fill(); // blank image
    
    if (paramsNoUI){
        if (typeof customNoUI !== "undefined"){
            customNoUI();
        } else {
            document.getElementById("header").style.display = "none";
        }
    }
    
    if (prompt && hashStringProperties.id){
        let startImage = document.getElementById("start");
        let iw = startImage.width;
        let ih = startImage.height;
        let is;
        if ((iw / ih) > (4/3))
            is = (widescreen?1024:768) / iw;
        else
            is = 576 / ih;
        let w = iw * is;
        let h = ih * is;
        let cx = (widescreen?1024:768) / 2;
        videoCanvasContext.drawImage(startImage,cx - (w / 2),288 - (h / 2),w,h);
        document.body.onclick=function(){
            document.body.onclick="";
            videoCanvasContext.fillStyle = "black";
            videoCanvasContext.fill(); // blank image
            initTV();
            initRemote(document.getElementById("remote"));
            initRemote(document.getElementById("remote2"));
        }
    } else {
        initTV();
        initRemote(document.getElementById("remote"));
        initRemote(document.getElementById("remote2"));
    }
    
    displayRemote();
    window.addEventListener("orientationchange", displayRemote);
    window.addEventListener("resize", displayRemote);
}

function updateHashstring(){
    hashString = ""
    let num = Object.keys(hashStringProperties).length
    for (let i = 0; i < num; i++){
        hashString += Object.keys(hashStringProperties)[i]+"="+Object.values(hashStringProperties)[i]
        if (i < num - 1)
            hashString += ":"
    }
    window.location.hash = hashString;
}

function displayRemote(){
    if (typeof customDisplayRemote !== "undefined"){
        // customDisplayRemote is an optional function to set css appropriately for custom UIs
        customDisplayRemote();
    } else {
        if (paramsNoUI){
            document.getElementById("right").style.display = "none";
            document.getElementById("below").style.display = "none";
        } else {
            if ((window.innerWidth > (widescreen?1024:768)) || (window.innerHeight <= window.innerWidth)){
                document.getElementById("right").style.display = "block";
                document.getElementById("below").style.display = "none";
            } else {
                document.getElementById("right").style.display = "none";
                document.getElementById("below").style.display = "block";
            }
        }
        
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
}

function blank1handler(){
    if (typeof customBlank1Handler !== "undefined"){
        // override secret button with custom handler
        customBlank1Handler();
    } else {
        let element = document.getElementById("viewer");
        
        if (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement){
            if (document.exitFullscreen)
                document.exitFullscreen();
            else if (document.mozCancelFullScreen)
                document.mozCancelFullScreen();
            else if (document.webkitExitFullscreen)
                document.webkitExitFullscreen();
        } else {
            if (element.requestFullscreen)
                element.requestFullscreen();
            else if (element.mozRequestFullScreen)
                element.mozRequestFullScreen();
            else if (element.webkitRequestFullscreen)
                element.webkitRequestFullscreen();
        }
        
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
}
