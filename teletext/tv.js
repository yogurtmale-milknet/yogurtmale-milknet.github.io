"use strict";

let channelMedia;
let videoVideo;
let videoAudio;
let videoInterval;

function initTV(){
    powerOnFlag = false;
    renderer.enable(false);
    teletextOnFlag = false;
    channelNumber = getLocalStorage("channelNumber");
    channelNumber = (channelNumber == null)?1:parseInt(channelNumber); /* default to 1 */
    renderLevel = 2;
    
    document.addEventListener("visibilitychange", function() {
        if (document.hidden){
            hiddenTimeout = setTimeout(websocketDisconnect, 60000); // allow to go to background for 60 seconds before dropping connection
        } else {
            clearTimeout(hiddenTimeout);
            if (powerOnFlag){
                if (websocket && websocket.readyState > 1){
                    websocketConnect();
                }
            }
        }
    });
    
    channelMedia = false;
    
    videoImage = new Image();
    videoImage.setAttribute(channelMedia, null);
    videoImage.addEventListener("load", imageLoaded);
    
    videoVideo = document.createElement('video');
    videoVideo.setAttribute(channelMedia, null);
    videoVideo.addEventListener("loadeddata", videoLoaded);
    
    videoAudio = document.createElement('audio');
    videoAudio.setAttribute(channelMedia, null);
    videoAudio.addEventListener("loadeddata", audioLoaded);
    
    let vol = getLocalStorage("videoVolume");
    if (vol === null)
        vol = 0.5;
    videoVideo.volume = vol;
    videoAudio.volume = vol;
    videoVideo.muted = getLocalStorage("videoMuted");
    videoAudio.muted = getLocalStorage("videoMuted");
    
    videoAudio.addEventListener("ended", audioLoaded);
    videoVideo.loop = true;
    videoVideo.addEventListener("play", function(){
        staticEffect(false);
        clearInterval(videoInterval);
        videoInterval = setInterval(blitVideo,40); // update at 25 fps
    });
    
    if (hashStringProperties.id){
        noChannel = true; // inhibit channel number on next channel change
        channelID = hashStringProperties.id
        powerbuttonhandler();
    }
    
    window.onbeforeunload = function(){if (powerOnFlag) powerbuttonhandler();};
}

let poweroffTimeout;
let reconnectCount = 0;

function resetPowerOffTimeout()
{
    clearTimeout(poweroffTimeout);
    reconnectCount = 0; /* reset bouncing connection trap */
    if (autoPowerOffTime > 0)
        poweroffTimeout = setTimeout(function(){if (powerOnFlag){powerbuttonhandler();}}, autoPowerOffTime * 60000);
}

let websocketFailedFlag;
let nextWebSocketFailedFlag;
let connectingTimeout;

function websocketConnect(){
    clearTimeout(reconnectTimeout);
    let id
    try {
        id = JSON.parse(atob(channelID))
    } catch {
        console.log("bad channel ID "+channelID);
        return;
    }
    
    try {
        websocket = new WebSocket("wss://"+id[1]+id[2]);
    } catch (e){
        console.log("failed to create websocket connection ",e);
    }
    connectingTimeout = setTimeout(function(){websocketFailedFlag = true; failPage();}, 2000); // workaround for firefox slowing repeated reconnect attempts
    websocket.binaryType = 'arraybuffer';
    websocket.onopen = function() {
        clearTimeout(connectingTimeout);
        reconnectCount++;
        
        settingReceived = false; // clear flag to detect new server response
        websocket.send(["service", channelID]);
        
        websocket.send(["ttx", teletextOnFlag]);
        
        if (teletextOnFlag){
            websocket.send(["pagesearch", 0, slots[0].m, slots[0].p, slots[0].s, pagesearch, pagehold, false]);
            
            for (let i=1; i<slots.length; i++){
                websocket.send(["pagesearch", i, slots[i].m, slots[i].p, slots[i].s, false, false, slots[i].e]);
            }
        }
        
        failPageNumber = 0x8ff;
        failTextString = loadEditorHash(defaultFailTextData);
        nextWebsocketFailedFlag = false;
        
        keepaliveInterval = setInterval(function(){websocketSend(["keepalive"])},5000); // send keepalive every 5 seconds
    }
    websocket.onmessage = self.socketrecv;
    websocket.onclose = function(){
        clearTimeout(activityTimeout);
        clearInterval(keepaliveInterval);
        websocketFailedFlag = true;
        failPage();
        let timeoutDuration = 10000; /* wait 10 seconds to attempt to reconnect*/
        reconnectTimeout = setTimeout(function(){
            websocketDisconnect();
            if (reconnectCount < 5)
                websocketConnect();
            else if (powerOnFlag)
                powerbuttonhandler(); /* power off clients that are bouncing on and off with no user input */
        }, timeoutDuration);
    };
}

let activityTimeout;

function resetInactivityTimeout(){
    clearTimeout(activityTimeout);
    activityTimeout = setTimeout(function(){console.log("teletext activity timed out (no clock for 5 seconds)"); websocketFailedFlag = true; failPage(); websocket.close();}, 5000); // kill connection after 5 seconds inactivity
}

let keepaliveInterval;

let nextWebsocketFailedFlag = false;

function failPage(){
    let message = {};
    
    nextWebsocketFailedFlag = true;
    
    slots[0] = {m:magazine,p:page,s:subcode,e:false};
    
    if (failPageNumber == 0x8FF || (failPageNumber == (magazine<<8|page))){
        message.data = (JSON.stringify(["header",0,btoa(failTextString.slice(0,40)), true, ERASE, 1, 0]));
        socketrecv(message);
        for (let i = 1; i<24; i++){
            message.data = JSON.stringify(["row",0,1,i,btoa(failTextString.slice(40*i,40*i+40))]);
            socketrecv(message);
        }
    }
    message.data = (JSON.stringify(["header",0,btoa(failTextString.slice(0,40)), false, 0, 1, 0]));
    socketrecv(message);
}

function websocketDisconnect(){
    if (websocket){
        clearTimeout(reconnectTimeout);
        clearTimeout(activityTimeout);
        clearInterval(keepaliveInterval);
        websocket.onclose = null;
        websocket.close();
    }
}

function websocketSend(message){
    if (websocket)
        if (websocket.readyState == 1)
            websocket.send(message);
    else if (teletextOnFlag && websocketFailedFlag)
        failPage();
}

let failTextString;
let failPageNumber;

function changeChannelByNumber(number){
    channelNumber = number;
    setLocalStorage("channelNumber",channelNumber);
    changeChannelByID(getLocalStorage("channelID"+channelNumber));
}

function changeChannelByID(id){
    clearInterval(imageRefreshTimeout);
    clearInterval(videoInterval);
    websocketDisconnect();
    channelID = id;
    websocketFailedFlag = false;
    channelMedia = crypto.randomUUID();
    videoVideo.pause();
    videoAudio.pause();
    
    videoCanvasContext.drawImage(staticImg,0,0);
    staticEffect(true);
    
    if (id == null){
        hashStringProperties.id = "_none"; // set an invalid id for detuned channels
    } else {
        failTextString = "";
        
        // make sure variables are valid
        pagehold = false;
        pagesearch = false;
        magazine = 8;
        page = 0xff;
        subcode = 0x3f7f;
        localCOPG0andG2 = 0;
        localCOPG0andNOS = 0x7F;
        websocketConnect();
        
        hashStringProperties.id = id;
    }
    
    clearOverlay();
    renderer.setRenderLevel(3);
    renderer.setStretchMode(0);
    renderer.setMixMode(true);
    renderer.hideTeletext(false);
    renderer.numberEntry(false);
    renderer.setDisplayRow24(true);
    renderer.resetPageSettings();
    renderer.enableSidePanels(widescreen);
    if (noChannel){ // inhibit the channel number when loading from a hash link
        noChannel = false; // clear flag
    } else {
        if (widescreen){
            overlayCharacter(0,64,0x30+channelNumber,2,0,0,true,true);
        } else {
            overlayCharacter(0,0,0x30+channelNumber,2,0,0,true,true);
        }
    }
    overlayActive = true;
    renderer.redrawScreen();
    renderer.setTeletextOpacity(1); // show teletext
    clearTimeout(overlayTimeout); /* clear any previous timeout */
    overlayTimeout = setTimeout(clearOverlay, 3000); /* clear the overlay after 3 seconds */
    
    initialmagazine = 1;
    initialpage = 0;
    initialsubcode = 0x3F7F;
    
    if (hashStringProperties.id && hashStringProperties.page){
        clearOverlay();
        clearTimeout(overlayTimeout);
        let hashpage = parseInt(hashStringProperties.page, 16);
        if ((hashpage < 0x100) || (hashpage > 0x8FF) || ((hashpage & 0xFF) == 0xFF) || isNaN(hashpage)){
            delete hashStringProperties.page;
        } else {
            initialmagazine = (hashpage&0x700) >> 8;
            initialpage = hashpage&0xFF;
            startTeletext();
        }
    }
    
    updateHashstring();
}

function loadChannelImage(imgURL, imgRefresh){
    clearInterval(imageRefreshTimeout);
    let cm = channelMedia;
    const u = new URL(imgURL);
    if (u.href.startsWith("data:image/")){
        // allow data urls
        videoImage.channelMedia = cm;
        videoImage.src = imgURL;
    } else if (u.hostname.endsWith(new URL(websocket.url).hostname)){
        // allow requests to service host and subdomains only
        fetch(imgURL, {redirect:"error"}) // require allow CORS, refuse any redirects
        .then((response) => response.blob())
        .then((blob) => {
            videoImage.channelMedia = cm;
            videoImage.src = URL.createObjectURL(blob);
        });
        if (imgRefresh){
            if (imgRefresh < 10)
                imgRefresh = 10; // make minimum refresh interval 10 seconds
            imageRefreshTimeout = setInterval(refreshImage, imgRefresh * 1000);
        }
    } else {
        console.log("loading image from "+imgURL+" disallowed.")
    }
}

function refreshImage(){
    videoImage.src = videoImage.src.split("?")[0]+"?"+new Date().getTime();
}

function loadChannelVideo(vidURL){
    let cm = channelMedia;
    const u = new URL(vidURL);
    if (u.hostname.endsWith(new URL(websocket.url).hostname)){
        // allow requests to service host and subdomains only
        fetch(vidURL, {redirect:"error"}) // require allow CORS, refuse any redirects
        .then((response) => response.blob())
        .then((blob) => {
            videoVideo.channelMedia = cm;
            videoVideo.src = URL.createObjectURL(blob);
        });
    } else {
        console.log("loading video from "+vidURL+" disallowed.")
    }
}

function loadChannelAudio(audURL){
    let cm = channelMedia;
    const u = new URL(audURL);
    if (u.hostname.endsWith(new URL(websocket.url).hostname)){
        // allow requests to service host and subdomains only
        fetch(audURL, {redirect:"error"}) // require allow CORS, refuse any redirects
        .then((response) => response.blob())
        .then((blob) => {
            videoAudio.channelMedia = cm;
            videoAudio.src = URL.createObjectURL(blob);
        });
    } else {
        console.log("loading audio from "+vidURL+" disallowed.")
    }
}

function imageLoaded(){
    if (channelMedia == videoImage.channelMedia){
        staticEffect(false);
        videoCanvasContext.fillStyle = "#000000";
        videoCanvasContext.fill();
        let iw = videoImage.width;
        let ih = videoImage.height;
        let is;
        if ((iw / ih) > (4/3))
            is = (widescreen?1024:768) / iw;
        else
            is = 576 / ih;
        let w = iw * is;
        let h = ih * is;
        let cx = (widescreen?1024:768) / 2;
        videoCanvasContext.drawImage(videoImage,cx - (w / 2),288 - (h / 2),w,h);
    }
}

function videoLoaded(){
    if (channelMedia == videoVideo.channelMedia){
        videoCanvasContext.fillStyle = "#000000";
        videoCanvasContext.fill();
        videoVideo.currentTime = (new Date() / 1000) % Math.floor(videoVideo.duration);
        videoVideo.play();
    }
}

function audioLoaded(){
    if (channelMedia == videoAudio.channelMedia){
        videoAudio.currentTime = (new Date() / 1000) % Math.floor(videoAudio.duration);
        videoAudio.play();
    }
}

let settingReceived = false;

function channelSettings(data){
    settingReceived = true;
    
    staticEffect(false);
    videoCanvasContext.fillStyle = "#4d4dff";
    videoCanvasContext.fill();
    
    // apply received channel settings
    const channelHostname = new URL(websocket.url).hostname
    
    if (data.image){
        let u = new URL(data.image.url)
        loadChannelImage(data.image.url, data.image.refresh);
    } else {
        clearInterval(imageRefreshTimeout);
    }
    
    if (data.video){
        loadChannelVideo(data.video.url);
    } else {
        clearInterval(videoInterval);
        videoVideo.pause();
    }
    
    if (data.audio){
        loadChannelAudio(data.audio.url);
    } else {
        videoAudio.pause();
    }
    
    if (data.failtext){
        failTextString = loadEditorHash(data.failtext.data);
        let hashpage = parseInt(data.failtext.page, 16)
        if ((hashpage < 0x100) || (hashpage > 0x8FF) || ((hashpage & 0xFF) == 0xFF) || isNaN(hashpage))
            failPageNumber = 0x8ff;
        else
            failPageNumber = hashpage;
    }
    
    if (data.localCOP){
        if (data.localCOP.G0andG2)
            localCOPG0andG2 = parseInt(data.localCOP.G0andG2,16);
        if (data.localCOP.G0andNOS)
            localCOPG0andNOS = parseInt(data.localCOP.G0andNOS,16);
    }
}

let base64dictionary = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function loadEditorHash(hashString){
    let pageText = "";
    /* this code is essentially identical to the code in edit.tf because it implements the same decoding algorithm */
    let charcode = 0;
    for (let strpos = 0; strpos < hashString.length; strpos++){
        let base64Digit = base64dictionary.indexOf(hashString.charAt(strpos));
        for (let hashBit = 0; hashBit < 6; hashBit++){
            let charBit = (strpos * 6 + hashBit) % 7
            let bitValue = base64Digit >> (5 - hashBit) & 0x01;
            charcode |= bitValue << 6 - charBit;
            if (charBit == 6){
                let character = [Math.floor((strpos * 6 + hashBit - charBit) / 7)];
                
                let row = Math.floor(character / 40);
                let column = character % 40;
                
                if (row > 22 && (charcode == 0x0D || charcode == 0x0F)) // strip out double height/size on rows 23 and 24
                charcode = 0x20;
                if (column > 37 && (charcode == 0x0E || charcode == 0x0F)) // strip out double width/size on columns 38 and 38
                    charcode = 0x20;
                
                pageText += String.fromCharCode(charcode);
                
                charcode = 0;
            }
        }
    }
    return pageText;
}

function blitVideo(){
    let iw = videoVideo.videoWidth;
    let ih = videoVideo.videoHeight;
    let is
    if ((iw / ih) == (5/4)){ // correct aspect ratio
        iw = ih * (4/3);
    }
    if ((iw / ih) > (4/3))
        is = (widescreen?1024:768) / iw;
    else
        is = 576 / ih;
    let w = iw * is;
    let h = ih * is;
    let cx = (widescreen?1024:768) / 2;
    videoCanvasContext.drawImage(videoVideo,cx - (w / 2),288 - (h / 2),w,h);
}

function overlayCharacter(y,x,charcode,colour,charset,nos,dh,dw){
    renderer.screenAttributesArray[y][x] = {switchG0:false, mosaics:false, dh:dh, dw:dw, br:0, rh:0, flash:0, charcode:charcode, charSet:charset, NOS:nos, foreColour:colour, backColour:0x20, diacritic:0, boxed:false, conceal:false, separated:false, underline:false, invert:false, bold:false, italic:false, proportional:false}
    if (dw){
        renderer.screenAttributesArray[y][x+1] = {switchG0:false, mosaics:false, dh:dh, dw:dw, br:0, rh:1, flash:0, charcode:charcode, charSet:charset, NOS:nos, foreColour:colour, backColour:0x20, diacritic:0, boxed:false, conceal:false, separated:false, underline:false, invert:false, bold:false, italic:false, proportional:false}
    }
    if (dh){
        renderer.screenAttributesArray[y+1][x] = {switchG0:false, mosaics:false, dh:dh, dw:dw, br:1, rh:0, flash:0, charcode:charcode, charSet:charset, NOS:nos, foreColour:colour, backColour:0x20, diacritic:0, boxed:false, conceal:false, separated:false, underline:false, invert:false, bold:false, italic:false, proportional:false}
        if (dw){
            renderer.screenAttributesArray[y+1][x+1] = {switchG0:false, mosaics:false, dh:dh, dw:dw, br:1, rh:1, flash:0, charcode:charcode, charSet:charset, NOS:nos, foreColour:colour, backColour:0x20, diacritic:0, boxed:false, conceal:false, separated:false, underline:false, invert:false, bold:false, italic:false, proportional:false}
        }
    }
}

function clearOverlay(){
    overlayActive = false;
    renderer.setTeletextOpacity(0); // hide teletext
    renderer.initializeLevel1PageArray();
    renderer.packetX26TripletArray.length = 0;
    renderer.resetPresentationData();
    renderer.decodePage();
}

function volumebuttonhandler(val){
    if (powerOnFlag){
        resetPowerOffTimeout();
        let curvol = videoVideo.volume;
        let newvol = curvol;
        let muted = videoVideo.muted;
        
        if (val == "mute"){
            videoVideo.muted = !videoVideo.muted;
            videoAudio.muted = videoVideo.muted;
        } else {
            videoVideo.muted = false;
            videoAudio.muted = false;
        }
        
        if (val == "up") {
            newvol = curvol + 0.025;
        } else if (val == "down")
            newvol = curvol - 0.025;
        
        if (newvol > 1) newvol = 1;
        else if (newvol < 0) newvol = 0;
        
        videoVideo.volume = newvol;
        videoAudio.volume = newvol;
        setLocalStorage("videoMuted",videoVideo.muted);
        setLocalStorage("videoVolume",videoVideo.volume);
        
        if (!teletextOnFlag){
            clearOverlay();
            renderer.setRenderLevel(3);
            renderer.setStretchMode(0);
            renderer.setMixMode(true);
            renderer.hideTeletext(false);
            renderer.numberEntry(false);
            renderer.setDisplayRow24(true);
            renderer.resetPageSettings();
            renderer.enableSidePanels(widescreen);
            for (let i=0; i<40; i++){
                overlayCharacter(22,i,0x2D,2,0,0,true,false);
            }
            overlayCharacter(22,Math.floor(39 * newvol),0x7C,2,0,0,true,false);
            
            let str = "    ";
            if (videoVideo.muted){
                str = "Mute";
            }
            
            let o = widescreen?40:32;
            for (let i = 0; i < 4; i++)
                overlayCharacter(0,2*i+o,str.charCodeAt(i),2,0,0,true,true);
            
            overlayActive = true;
            renderer.redrawScreen();
            renderer.setTeletextOpacity(1); // show teletext
            clearTimeout(overlayTimeout); /* clear any previous timeout */
            overlayTimeout = setTimeout(clearOverlay, 3000); /* clear the overlay after 3 seconds */
        }
    }
}

function channelbuttonhandler(val){
    resetPowerOffTimeout();
    if (powerOnFlag){
        if (!teletextOnFlag){
            if (val == "up"){
                if (channelNumber < 9)
                    changeChannelByNumber(channelNumber + 1);
                else
                    changeChannelByNumber(0);
            } else if (val == "down"){
                if (channelNumber <= 0)
                    changeChannelByNumber(9);
                else
                    changeChannelByNumber(channelNumber - 1);
            }
        } else {
            teletextPageUpDown(val);
        }
    }
    else
    {
        powerOnFlag = true;
        changeChannelByNumber(channelNumber);
        videoCanvasContext.drawImage(staticImg,0,0);
        staticEffect(true);
        renderer.enable(true);
    }
}

function teletextPageUpDown(val){
    /* teletext page up/down */
    let curpage = magazine << 8 | page;
    let existpage;
    
    if (val == "up"){
        existpage = pageExists.find(element => element > curpage);
        if (!existpage)
            existpage = pageExists[0];
        
        if (!existpage){
            /* no pageExists data */
            existpage = curpage + 1;
            if ((existpage & 0xF) > 9)
                existpage = (existpage & 0x7F0) + 0x10;
            if ((existpage & 0xF0) > 0x90)
                existpage = (existpage & 0x70F) + 0x100;
            if (existpage >= 0x800)
                existpage = 0x0;
        }
    } else if (val == "down"){
        existpage = revPageExists.find(element => element < curpage);
        if (!existpage)
            existpage = revPageExists[0];
        
        if (!existpage){
            /* no pageExists data */
            existpage = curpage - 1;
            if (existpage < 0)
                existpage = 0x799;
            if ((existpage & 0xF0) > 0x90)
                existpage = (existpage & 0x70F) | 0x90;
            if ((existpage & 0xF) > 9)
                existpage = (existpage & 0x7F0) | 0x9;
        }
    } else {
        return;
    }
    
    magazine = existpage >> 8;
    page = existpage & 0xFF;
    subcode = 0x3F7F;
    level1PageArray[0][7] = tvsearchcolour; /* set hardware colour */
    pagesearch = true;
    pagehold = false;
    numberentry = false;
    slots[0] = {m:magazine,p:page,s:subcode,e:false};
    websocketSend(["pagesearch", 0, magazine, page, subcode, true, false]); /* send desired number to server with search slot zero */
    resetnumber();
    redrawPage();
}

function powerbuttonhandler(){
    if (!powerOnFlag){
        resetPowerOffTimeout();
        powerOnFlag = true;
        if (!noChannel)
            changeChannelByNumber(channelNumber)
        else
            changeChannelByID(channelID);
        videoCanvasContext.drawImage(staticImg,0,0);
        staticEffect(true);
        renderer.enable(true);
    } else {
        powerOnFlag = false;
        staticEffect(false);
        videoCanvasContext.rect(0, 0, 768, 576);
        videoCanvasContext.fillStyle = "black";
        videoCanvasContext.fill(); // blank image
        clearOverlay();
        if (teletextOnFlag)
            stopTeletext();
        videoVideo.pause();
        videoAudio.pause();
        clearInterval(videoInterval);
        websocketDisconnect();
        renderer.enable(false);
    }
}

function textbuttonhandler(){
    if (powerOnFlag){
        resetPowerOffTimeout();
        if (!teletextOnFlag){
            clearOverlay();
            clearTimeout(overlayTimeout);
            startTeletext();
        } else if (teletextOnFlag && cancel) {
            /* teletext is on but hidden - unhide */
            pageentrytimedout(); /* interrupt page entry */
            cancel = false;
            resetnumber();
            redrawPage();
        } else {
            stopTeletext();
        }
    }
}

function numberButtonHandler(number){
    resetPowerOffTimeout();
    if (powerOnFlag){
        if (teletextOnFlag)
            teletextnumberbuttonhandler(number);
        else {
            changeChannelByNumber(number);
        }
    }
    else
    {
        powerOnFlag = true;
        changeChannelByNumber(number);
        videoCanvasContext.drawImage(staticImg,0,0);
        staticEffect(true);
        renderer.enable(true);
    }
}

function mixbuttonhandler(){
    if (teletextOnFlag){
        resetPowerOffTimeout();
        mix = !mix;
        renderer.setMixMode(mix);
    }
}

function sizebuttonhandler(){
    if (teletextOnFlag){
        resetPowerOffTimeout();
        size = (size + 1) % 3;
        renderer.setStretchMode(size);
    }
}

function revealbuttonhandler(){
    if (teletextOnFlag){
        resetPowerOffTimeout();
        reveal = !reveal;
        renderer.setReveal(reveal);
        renderer.decodePage();
        renderer.redrawScreen();
    }
}

function cancelbuttonhandler() {
    /* hide button */
    if (teletextOnFlag){
        resetPowerOffTimeout();
        pageentrytimedout(); /* interrupt page entry */
        if (cancel){
            /* teletext is hidden - unhide */
            cancel = false;
        } else {
            /* teletext is visible - hide */
            cancel = true;
        }
        resetnumber();
        redrawPage();
    }
}

function stopbuttonhandler(){
    /* hold button */
    if (teletextOnFlag){
        resetPowerOffTimeout();
        clearTimeout(numberentrytimer);
        if(pagehold) {
            pagehold = false;
            if (pagesearch){
                level1PageArray[0][7] = tvsearchcolour;
            } else {
                level1PageArray[0][7] = 0x07;
            }
        } else {
            pagehold = true;
            level1PageArray[0][7] = 0x07; // white header
        }
        websocketSend(["hold",pagehold]);
        timeentry = false;
        resetnumber();
        redrawPage();
    }
}

function linkbuttonhandler(link){
    let ch;
    let linksubcodeandmags;
    if (teletextOnFlag){
        resetPowerOffTimeout();
        if (linksFLOFMode){
            let linkpacketmagazine = linksArray[12];
            let linkpage = linksArray[link*2];
            linksubcodeandmags = linksArray[link*2+1];
            if (!((linkpage == 0xFF) && (linksubcodeandmags & 0x3F7F == 0x3F7F)))
            {
                /* link is not FF:3F7F */
                /* get magazine */
                let m1 = (linksubcodeandmags & 0x0080) >> 7;
                let m2 = (linksubcodeandmags & 0x4000) >> 14;
                let m3 = (linksubcodeandmags & 0x8000) >> 15;
                magazine = linkpacketmagazine ^ ((m3<<2)+(m2<<1)+m1);

                subcode = linksubcodeandmags & 0x3F7F;
                page = linkpage;
                
                level1PageArray[0][7] = tvsearchcolour; /* set hardware colour */
                pagesearch = true;
                pagehold = false;
                slots[0] = {m:magazine,p:page,s:subcode,e:false};
                websocketSend(["pagesearch", 0, magazine, page, subcode, true, false]); /* send desired number to server with search slot zero */
                resetnumber();
                redrawPage();
            }
        } else if (linksTOPMode){
            // TODO TOP
        } else {
            // TODO "Cycle trace table"
            if (link == 0)
                teletextPageUpDown("down");
            else if (link == 1)
                teletextPageUpDown("up");
        }
    }
}



function timetextbuttonhandler(){
    if (teletextOnFlag){
        resetPowerOffTimeout();
        cancel = false;
        if (!timeentry){
            timeentry = true;
            resetnumber();
            numberentrytimer = setTimeout(pageentrytimedout, 6000); /* wait 6 seconds */
        } else {
            pageentrytimedout();
        }
    }
}

function teletextnumberbuttonhandler(num){
    if (teletextOnFlag){
        if (timeentry){
            switch (enterdigit){
                case 0:
                    if (num < 3){
                        clearTimeout(numberentrytimer);
                        level1PageArray[0][1] = num + 0x30;
                        numberentry = true;
                        nextsubcode = num << 12;
                        enterdigit++;
                        numberentrytimer = setTimeout(pageentrytimedout, 6000); /* wait 6 seconds */
                        redrawPage();
                    }
                    break;
                case 1:
                    clearTimeout(numberentrytimer);
                    level1PageArray[0][2] = num + 0x30;
                    nextsubcode = nextsubcode | (num << 8);
                    enterdigit++;
                    numberentrytimer = setTimeout(pageentrytimedout, 6000); /* wait 6 seconds */
                    redrawPage();
                    break;
                case 2:
                    if (num < 8){
                        clearTimeout(numberentrytimer);
                        level1PageArray[0][3] = num + 0x30;
                        nextsubcode = nextsubcode | (num << 4);
                        enterdigit++;
                        numberentrytimer = setTimeout(pageentrytimedout, 6000); /* wait 6 seconds */
                        redrawPage();
                    }
                    break;
                case 3:
                    clearTimeout(numberentrytimer);
                    level1PageArray[0][4] = num + 0x30;
                    enterdigit = 0;
                    subcode = nextsubcode | num;
                    level1PageArray[0][7] = tvsearchcolour; /* set hardware colour */
                    pagesearch = true;
                    numberentry = false;
                    timeentry = false;
                    slots[0] = {m:magazine,p:page,s:subcode,e:false};
                    websocketSend(["pagesearch", 0, magazine, page, subcode, true, false]); /* send desired number to server with search slot zero */
                    pagehold = false;
                    redrawPage();
                    break;
            }
        } else {
            switch (enterdigit){
                case 0:
                    cancel = false;
                    if ((num > 0) & (num < 9)){
                        level1PageArray[0][1] = 0x50;
                        clearTimeout(numberentrytimer);
                        level1PageArray[0][2] = num + 0x30;
                        level1PageArray[0][3] = 0x2D;
                        level1PageArray[0][4] = 0x2D;
                        numberentry = true;
                        nextmagazine = num & 7;
                        enterdigit++;
                        numberentrytimer = setTimeout(pageentrytimedout, 6000); /* wait 6 seconds */
                        redrawPage();
                    }
                    break;
                case 1: 
                    clearTimeout(numberentrytimer);
                    level1PageArray[0][3] = num + 0x30;
                    nextpage = num << 4;
                    enterdigit++;
                    numberentrytimer = setTimeout(pageentrytimedout, 6000); /* wait 6 seconds */
                    redrawPage();
                    break;
                case 2:
                    clearTimeout(numberentrytimer);
                    level1PageArray[0][4] = num + 0x30;
                    enterdigit = 0;
                    magazine = nextmagazine;
                    page = nextpage + num;
                    subcode = 0x3F7F;
                    level1PageArray[0][7] = tvsearchcolour; /* set hardware colour */
                    pagesearch = true;
                    numberentry = false;
                    slots[0] = {m:magazine,p:page,s:subcode,e:false};
                    websocketSend(["pagesearch", 0, magazine, page, subcode, true, false]); /* send desired number to server with search slot zero */
                    pagehold = false;
                    redrawPage();
                    break;
            }
        }
    }
}

function resetnumber(){
    if (teletextOnFlag){
        enterdigit = 0;
        if(timeentry){
            level1PageArray[0].splice(1, 4, 0x2A, 0x2A, 0x2A, 0x2A ); /* change page number to **** */
        } else if(pagehold){
            level1PageArray[0].splice(1, 4, 0x53, 0x54, 0x4F, 0x50 ); /* change page number to STOP */
        } else if (cancel && pagesearch){
            level1PageArray[0][1] = 0x08;
            level1PageArray[0][2] = 0x2A;
            level1PageArray[0][3] = 0x2A;
            level1PageArray[0][4] = 0x09;
        } else if (subcode == 0x3F7F){
            level1PageArray[0][1] = 0x50;
            if (!magazine)
                level1PageArray[0][2] = 0x38;
            else
                level1PageArray[0][2] = magazine + 0x30;
            
            let ch=page>>4; // page tens 
            level1PageArray[0][3]=ch+(ch>9?0x37:0x30);
            ch=page%0x10; // page units
            level1PageArray[0][4]=ch+(ch>9?0x37:0x30);
        } else {
            let ch=(subcode>>12)&0xF;
            level1PageArray[0][1] = ch+(ch>9?0x37:0x30);
            ch=(subcode>>8)&0xF;
            level1PageArray[0][2] = ch+(ch>9?0x37:0x30);
            ch=(subcode>>4)&0xF;
            level1PageArray[0][3] = ch+(ch>9?0x37:0x30);
            ch=subcode&0xF;
            level1PageArray[0][4] = ch+(ch>9?0x37:0x30);
        }
        renderer.numberEntry(numberentry);
    }
}

function pageentrytimedout(){
    clearTimeout(numberentrytimer); /* clear timeout if this function gets called directly */
    if (teletextOnFlag){
        numberentry = false;
        timeentry = false;
        resetnumber();
        redrawPage();
    }
}

function resetPagePresentationData(presentationData){
    presentationData.defaultG0andG2 = localCOPG0andG2;
    presentationData.secondG0andNOS = localCOPG0andNOS;
    presentationData.lsp = false;
    presentationData.rsp = false;
    presentationData.spsf = true;
    presentationData.cols = 0;
    presentationData.dsc = 0;
    presentationData.drc = 0;
    presentationData.bbcs = false;
    presentationData.ctm = 0;
    presentationData.clut = [];
    for (let i=0;i<0x20;i++)
        presentationData.clut[i] = renderer.getDefaultCLUTEntry(i);
}

function resetMagazinePresentationData(){
    for (let mag=0; mag<8; mag++){
        magazinePresentationData[mag] = {};
        magazineHasX290[mag] = false;
        resetPagePresentationData(magazinePresentationData[mag]);
    }
}

function initializeMOTPageArray(){
    for (let mag=0; mag<8; mag++){
        MOTPageArray[mag] = {lastpacket:0,packets:[],pages:[],pop2:[],drcs2:[],pop3:[],drcs3:[]};
        let m = MOTPageArray[mag]; 
        for (let p = 0; p < 0x100; p++){
            m.pages[p] = {gpop:0,pop:0,gdrcs:0,drcs:0};
        }
        for (let i=0; i<8; i++){
            m.pop2[i] = {lf:false, m:0, p:0xff, s:0, ff:1, dof:0, do1:0, do2:0};
            m.pop3[i] = {lf:false, m:0, p:0xff, s:0, ff:1, dof:0, do1:0, do2:0};
            m.drcs2[i] = {lf:false, m:0, p:0xff, s:0};
            m.drcs3[i] = {lf:false, m:0, p:0xff, s:0};
        }
    }
}

function clearLinkArray(mag){
    for (let i = 0; i < 5; i++)
    {
        linksArray[2*i] = 0xff;
        linksArray[2*i+1] = 0x3f7f;
    }
    linksArray[10] = initialpage;
    let magbits = (mag ^ initialmagazine);
    linksArray[11] = 0x3F7F | ((magbits & 1) << 7) | ((magbits & 6) << 13);
    linksArray[12] = mag;
}

function startTeletext(){
    renderer.setRenderLevel(renderLevel);
    renderer.setStretchMode(0);
    renderer.setMixMode(false);
    cancel = false;
    mix = false;
    size = 0;
    reveal = false;
    pagehold = false;
    numberentry = false;
    timeentry = false;
    renderer.numberEntry(numberentry);
    enterdigit = 0;
    magazine = initialmagazine;
    page = initialpage;
    subcode = initialsubcode;
    nextcontrolbits = 0;
    renderer.initializeLevel1PageArray();
    renderer.resetPresentationData();
    renderer.packetX26TripletArray.length = 0;
    for (let r=0;r<26;r++){
        level1PageArray[r] = [];
        for (let c=0;c<40;c++){
            level1PageArray[r][c] = 0x20;
        }
    }
    let CCTlabel = "\x01\x1d\x00\- \x02\x1d\x00+  \x1c"
    for (let c=0; c<12; c++){
        level1PageArray[24][c] = CCTlabel.charCodeAt(c);
    }
    packetX26TripletArray.length = 0;
    resetPagePresentationData(pagePresentationData);
    resetMagazinePresentationData();
    clearLinkArray(initialmagazine);
    linksFLOFMode = false;
    linksTOPMode = false;
    initializeMOTPageArray();
    enhancementPageCache.length = 0;
    pageExists.length = 0;
    revPageExists.length = 0;
    level1PageArray[0].splice(0, 7, tvnumbercolour, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20 ); /* white page number */
    level1PageArray[0][7] = tvsearchcolour;
    teletextOnFlag = true;
    resetnumber();
    slots.length = 0; // clear slots
    if (websocketFailedFlag){
        failPage();
    } else {
        websocketSend(["ttx", true]); // turn on
        websocketSend(["pagesearch",0,magazine,page,subcode,true,false,false]); /* send desired number to server with search slot zero */
        slots[0] = {m:magazine,p:page,s:subcode,e:false};
        for (let i=1; i<=8; i++){
            slots[i] = {m:i,p:0xFE,s:0,e:true}; // MOT searchslots (1-8)
        }
        slots[9] = {m:1,p:0xF0,s:0x3F7F,e:false}; // Basic TOP table (searchslot 9)
        slots[10] = {m:1,p:0xF1,s:0,e:false}; // TOP multiplage table (searchslot 10)
        slots[11] = {m:1,p:0xF2,s:0,e:false}; // TOP additional information table 1 
        slots[12] = {m:1,p:0xF3,s:0,e:false}; // TOP additional information table 2 
        for (let i=1; i<slots.length; i++){
            websocketSend(["pagesearch",i,slots[i].m,slots[i].p,slots[i].s,false,false,slots[i].e]);
        }
    }
    
    pagesearch = true;
    redrawPage();
    renderer.setTeletextOpacity(1); // show teletext
    if (websocket)
        websocket.onmessage = socketrecv;
}

function stopTeletext(){
    teletextOnFlag = false;
    websocketSend(["ttx",false]); // turn ttx off
    renderer.initializeLevel1PageArray();
    renderer.packetX26TripletArray.length = 0;
    renderer.decodePage();
    renderer.redrawScreen();
    renderer.setTeletextOpacity(0); // hide teletext
    renderer.setStretchMode(0);
    renderer.setMixMode(false);
    renderer.hideTeletext(false);
    renderer.numberEntry(false);
    
    delete hashStringProperties.page;
    updateHashstring();
}

function redrawPage() {
    needRedrawFlag = false;
    controlbits = nextcontrolbits;
    renderer.pageSettings.newsflash = Boolean(controlbits & NEWSFLASH);
    renderer.pageSettings.subtitle = Boolean(controlbits & SUBTITLE);
    renderer.pageSettings.suppressHeader = Boolean(controlbits & SUPPRESS_HEADER);
    renderer.pageSettings.inhibitDisplay = Boolean(controlbits & INHIBIT_DISPLAY);
    let NOSbits = (controlbits & NATIONAL_OPTION) >> 12;
    renderer.pagePresentationData.G0andG2 = (pagePresentationData.defaultG0andG2 & 0x78) | ((NOSbits & 1) << 2) | (NOSbits & 2) | ((NOSbits & 4) >> 2);
    renderer.pagePresentationData.G0andNOS = pagePresentationData.secondG0andNOS;
    renderer.pagePresentationData.lsp = pagePresentationData.lsp;
    renderer.pagePresentationData.rsp = pagePresentationData.rsp;
    renderer.pagePresentationData.spsf = pagePresentationData.spsf;
    renderer.pagePresentationData.cols = pagePresentationData.cols;
    renderer.pagePresentationData.dsc = pagePresentationData.dsc;
    renderer.pagePresentationData.drc = pagePresentationData.drc;
    renderer.pagePresentationData.bbcs = pagePresentationData.bbcs;
    renderer.pagePresentationData.ctm = pagePresentationData.ctm;
    renderer.pagePresentationData.clut = pagePresentationData.clut.slice();
    
    for (let r=0;r<26;r++){
        for (let c=0;c<40;c++){
            renderer.level1PageArray[r][c] = level1PageArray[r][c];
        }
    }
    renderer.packetX26TripletArray.length = 0;
    for (let i=0; i<packetX26TripletArray.length; i++){
        renderer.packetX26TripletArray.push(packetX26TripletArray[i]); 
    }
    
    renderer.hideTeletext(cancel);
    renderer.numberEntry(numberentry);
    renderer.pageSearch(pagesearch);
    
    renderer.decodePage();
    renderer.redrawScreen();
}

let redrawInterval = setInterval(function(){
        if (needRedrawFlag){
            redrawPage();
        }
    },40); // only redraw at a maximum of 25Hz

let needRedrawFlag = false;

function socketrecv(data) {
    let message = JSON.parse(data.data)
    let command = message[0];
    let searchslot = message[1];
    switch (command){
        case "wrongname":
            // server is for a different service to the channelID
            websocketDisconnect(); // don't try again
            break
        case "channelSettings":
            channelSettings(message[1]);
            break;
        case "secondTick":
            resetInactivityTimeout();
            break;
        case "clock":
            resetInactivityTimeout();
            if (teletextOnFlag){
                /* received header */
                let string = atob(message[2]);
                
                for (let i=0; i<8; i++){
                    level1PageArray[0][32+i] = string.charCodeAt(i) & 0x7f;
                }
                
                needRedrawFlag = true;
            }
            break;
        case "header":
            if (teletextOnFlag){
                let string = atob(message[2]);
                let pagematched = message[3];
                let controlcodes = message[4];
                let packetMagazine = message[5];
                let packetSubcode = message[6];
                let packetPage = message[7];
                
                if ((packetMagazine == slots[searchslot].m) && (packetPage == slots[searchslot].p) && (slots[searchslot].s == 0x3F7F || packetSubcode == slots[searchslot].s))
                    pagematched == true;
                else
                    pagematched = false;
                
                if (searchslot == 0) // default slot
                {
                    if (!pagematched && (controlcodes & INTERRUPTED_SEQUENCE)){
                        for (let i=32; i<40; i++){ // only show clock for out of sequence headers
                            level1PageArray[0][i] = string.charCodeAt(i) & 0x7f;
                        }
                    } else {
                        for (let i=8; i<40; i++){
                            level1PageArray[0][i] = string.charCodeAt(i) & 0x7f;
                        }
                    }
                    
                    if (pagematched)
                    {
                        /* header is for the page we selected */
                        
                        hashStringProperties.page = (((packetMagazine==0?8:packetMagazine) << 8) | packetPage).toString(16);
                        updateHashstring();
                        
                        nextcontrolbits = controlcodes;
                        let erasepage = pagesearch || websocketFailedFlag; // erase if coming from page search
                        
                        renderer.pageSearch(false);
                        level1PageArray[0][7] = 0x07; /* white hardware header colour byte */
                        
                        if (cancel && (pagesearch || nextcontrolbits & UPDATE)){
                            cancel = false;
                            resetnumber();
                        }
                        
                        if (pagesearch || (nextcontrolbits & ERASE))
                        {
                            /* clear out link data */
                            clearLinkArray(packetMagazine);
                            linksFLOFMode = false;
                        }
                        
                        pagesearch = false; /* no longer searching for page */
                        
                        firstRowFlag = true;
                        
                        /* clear enhancement packets */
                        packetX26TripletArray.length = 0;
                        nextX26DC = 0;
                        haveX280 = false;
                        pageFunction = 0;
                        pageCoding = 0;
                        
                        pagePresentationData.defaultG0andG2 = magazinePresentationData[packetMagazine].defaultG0andG2;
                        pagePresentationData.secondG0andNOS = magazinePresentationData[packetMagazine].secondG0andNOS;
                        pagePresentationData.lsp = magazinePresentationData[packetMagazine].lsp;
                        pagePresentationData.rsp = magazinePresentationData[packetMagazine].rsp;
                        pagePresentationData.spsf = magazinePresentationData[packetMagazine].spsf;
                        pagePresentationData.cols = magazinePresentationData[packetMagazine].cols;
                        pagePresentationData.dsc = magazinePresentationData[packetMagazine].dsc;
                        pagePresentationData.drc = magazinePresentationData[packetMagazine].drc;
                        pagePresentationData.bbcs = magazinePresentationData[packetMagazine].bbcs;
                        pagePresentationData.ctm = magazinePresentationData[packetMagazine].ctm;
                        pagePresentationData.clut = magazinePresentationData[packetMagazine].clut.slice();
                        
                        reveal = false;
                        renderer.setReveal(reveal);
                        
                        if (erasepage || (nextcontrolbits & ERASE)){
                            /* clear out all data for this page */
                            for (let r=1; r<26; r++){
                                for (let c=0; c<40; c++){
                                    level1PageArray[r][c] = 0x20;
                                }
                            }
                        }
                        
                        websocketFailedFlag = nextWebsocketFailedFlag;
                        
                        renderer.numberEntry(numberentry);
                        
                        // check MOT
                        let gpop = MOTPageArray[packetMagazine].pages[page].gpop;
                        let pop = MOTPageArray[packetMagazine].pages[page].pop;
                        let gdrcs = MOTPageArray[packetMagazine].pages[page].gdrcs;
                        let drcs = MOTPageArray[packetMagazine].pages[page].drcs;
                        
                        let gpopLink = MOTPageArray[packetMagazine].pop2[0];
                        let popLink = pop?MOTPageArray[packetMagazine].pop2[pop]:{lf:false, m:0, p:0xff, s:0, ff:1, dof:0, do1:0, do2:0};
                        let gdrcsLink = MOTPageArray[packetMagazine].drcs2[0];
                        let drcsLink = drcs?MOTPageArray[packetMagazine].drcs2[drcs]:{lf:false, m:0, p:0xff, s:0};
                        
                        if (renderLevel == 3 && MOTPageArray[packetMagazine].lastpacket >= 24){
                                gpopLink = MOTPageArray[packetMagazine].pop3[0];
                                popLink = MOTPageArray[packetMagazine].pop3[pop];
                                gdrcsLink = MOTPageArray[packetMagazine].drcs3[0];
                                drcsLink = MOTPageArray[packetMagazine].drcs3[drcs];
                        }
                        
                        renderer.resetDRCSArrays();
                        renderer.resetPOPArrays();
                        
                        if (gpop)
                        {
                            renderer.defaultObjects[0].flag = gpopLink.dof & 0x3;
                            renderer.defaultObjects[0].subpage = gpopLink.d01 & 0xf;
                            renderer.defaultObjects[0].object = gpopLink.d01 & 0xf;
                            
                            renderer.defaultObjects[1].flag = (gpopLink.dof>>2) & 0x3;
                            renderer.defaultObjects[1].subpage = (gpopLink.do1>>4) & 0xf;
                            renderer.defaultObjects[1].object = (gpopLink.do2>>4) & 0xf;
                            
                            let cache = needEnhancementPage(0, gpopLink.m, gpopLink.p, 0x3f7f, gpopLink.s);
                            popLoadFromCache(cache, true);
                        }
                        if (pop)
                        {
                            renderer.defaultObjects[2].flag = popLink.dof & 0x3;
                            renderer.defaultObjects[2].subpage = popLink.d01 & 0xf;
                            renderer.defaultObjects[2].object = popLink.d01 & 0xf;
                            
                            renderer.defaultObjects[3].flag = (popLink.dof>>2) & 0x3;
                            renderer.defaultObjects[3].subpage = (popLink.do1>>4) & 0xf;
                            renderer.defaultObjects[3].object = (popLink.do2>>4) & 0xf;
                            
                            let cache = needEnhancementPage(1, popLink.m, popLink.p, 0x3f7f,popLink.s);
                            popLoadFromCache(cache, false);
                        }
                        if (gdrcs){
                            let cache = needEnhancementPage(2, gdrcsLink.m, gdrcsLink.p, 0x3f7f, gdrcsLink.s);
                            drcsLoadFromCache(cache, true);
                        }
                        if (drcs){
                            let cache = needEnhancementPage(3, drcsLink.m, drcsLink.p, 0x3f7f, drcsLink.s);
                            drcsLoadFromCache(cache, false);
                        }
                    } else {
                        needRedrawFlag = true;
                    }
                    
                } else {
                    if (slots[searchslot].p == 0xFE){
                        // MOT pages
                        MOTPageArray[packetMagazine].lastpacket = (packetSubcode & 0x3f00) >> 8;
                        
                        // TODO: proper implementation of Annex B.7
                        if (controlbits & ERASE)
                            MOTPageArray[packetMagazine].packets.length = 0; // clear old packets
                    } else if (slots[searchslot].e){
                        // other enhancement page
                        if (!(enhancementPageCache[(slots[searchslot].m << 8) | slots[searchslot].p])){
                            enhancementPageCache[(slots[searchslot].m << 8) | slots[searchslot].p] = {s:[]};
                        }
                        slots[searchslot].ps = packetSubcode & 0xF;
                        // TODO: proper implementation of Annex B.7
                        if (controlbits & ERASE)
                            enhancementPageCache[(slots[searchslot].m << 8) | slots[searchslot].p].s[slots[searchslot].ps] = {r:[]}; // clear rows
                    } else if (searchslot == 9){
                        // Basic TOP Table slot
                        console.log("header received for basic TOP table "+(((slots[searchslot].m)<<8) | slots[searchslot].p).toString(16));
                        websocketSend(["hold",true,searchslot]); // TODO: should keep checking this for updates but freeze it until implemented
                    } else if (searchslot >= 10 && searchslot <= 12){
                        // other TOP tables
                        console.log("header received for TOP page "+(((slots[searchslot].m)<<8) | slots[searchslot].p).toString(16));
                        websocketSend(["hold",true,searchslot]); // freeze acquisition of this page until Basic TOP table is changed
                        // TODO should really do this once the page has been received and decoded correctly
                    } else {
                        console.log("header received for page "+(((slots[searchslot].m)<<8) | slots[searchslot].p).toString(16))+" on search slot "+searchslot;
                    }
                }
            }
            break;
        case "row":
            let packetMagazine = message[2];
            let packetnumber = message[3];
            let packetstring = atob(message[4]);
            let packet = [];
            for (let i=0; i<packetstring.length; i++){
                packet.push(packetstring.charCodeAt(i));
            }
            
            if (teletextOnFlag){
                if (searchslot == 0) // default slot
                {
                    if (packetnumber < 26){
                        if (packetnumber != 24 || linksFLOFMode){
                            for (let i=0; i<40; i++){
                                level1PageArray[packetnumber][i] = packet[i] & 0x7f;
                            }
                        }
                        
                        if (firstRowFlag){
                            if (!linksFLOFMode){
                                // TODO proper TOP and CTT navigation
                                let CCTlabel = "\x01\x1d\x00\- \x02\x1d\x00+  \x1c"
                                for (let c=0; c<12; c++){
                                    level1PageArray[24][c] = CCTlabel.charCodeAt(c);
                                }
                                for (let c=12; c<40; c++){
                                    level1PageArray[24][c] = 0x20;
                                }
                            }
                            firstRowFlag = false;
                        }
                        
                        needRedrawFlag = true;
                    } else if (packetnumber == 26 && renderLevel > 0){
                        // TODO: switch this to storing in same array as 0-25 for object pages
                        let decoded = decodeEnhancementPacket(packet);
                        
                        if (decoded[0] == nextX26DC){
                            nextX26DC++;
                            for (let i=0;i<13;i++){
                                packetX26TripletArray.push(decoded[1+i]);
                            }
                        } else {
                            packetX26TripletArray.length = 0;
                            nextX26DC = 0;
                        }
                    } else if (packetnumber == 27){
                        let dc = hamming_8_4_decode(packet[0]);
                        if (dc == 0){
                            // X/27/0 packet
                            
                            for (let i=0;i<6;i++){
                                let l1 = hamming_8_4_decode(packet[6*i+1])&0xF;
                                let l2 = hamming_8_4_decode(packet[6*i+2])&0xF;
                                let l3 = hamming_8_4_decode(packet[6*i+3])&0xF;
                                let l4 = hamming_8_4_decode(packet[6*i+4])&0xF;
                                let l5 = hamming_8_4_decode(packet[6*i+5])&0xF;
                                let l6 = hamming_8_4_decode(packet[6*i+6])&0xF;
                                linksArray[2*i] = l2*0x10 + l1; //page number
                                linksArray[2*i+1] = (l3 | (l4 << 4) | (l5 << 8) | (l6 << 12)); // subcode and mag bits
                            }
                            linksArray[12] = packetMagazine;
                            linksFLOFMode = true;
                            
                            renderer.setDisplayRow24((hamming_8_4_decode(packet[37]) & 0x8) >> 3);
                        } else if (dc == 4 || dc == 5){
                            let decoded = decodeEnhancementPacket(packet);
                            // X/27/4 or X/27/5 packet
                            let lf,pv,pu,pt,sf,valid;
                            for (let i=0; i<((dc==4)?6:2); i++){
                                lf = (decoded[0]==4 && i<4)?i:(decoded[2*i+1] & 3);
                                pv = (decoded[2*i+1] >> 2) & 3;
                                pu = (decoded[2*i+1] >> 6) & 0xf;
                                mag = packetMagazine ^ ((decoded[2*i+1] >> 11) & 7);
                                pt = (decoded[2*i+1] >> 14) & 0xf;
                                sf = decoded[2*i+2] >> 2;
                                
                                if (renderLevel==2){
                                    if (i>4 || dc==5){
                                        valid = false;
                                    } else {
                                        valid = Boolean(pv & 1);
                                    }
                                } else if (renderLevel==3){
                                    valid = Boolean(pv & 2);
                                }
                                
                                if (valid){
                                    for (let i=0;i<16;i++){
                                        if (sf & (1<<i)){
                                            let cache = needEnhancementPage(lf,mag,(pt<<4)|pu,i,1)
                                            if (lf&2){
                                                drcsLoadFromCache(cache, !(lf&1));
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } else if (packetnumber == 28 && renderLevel > 1){
                        let decoded = decodeEnhancementPacket(packet);
                        
                        if (decoded[0] == 0){
                            decodePacket28(decoded);
                            haveX280 = true;
                        } else if (decoded[0] == 4){
                            decodePacket28(decoded);
                        }
                    } else if (packetnumber == 29 && renderLevel > 1){
                        let decoded = decodeEnhancementPacket(packet);
                        if (decoded[0] == 0){
                            decodePacket29(decoded, packetMagazine);
                            magazineHasX290[packetMagazine] = true;
                        } else if (decoded[0] == 4){
                            decodePacket29(decoded, packetMagazine);
                        }
                    } else {
                        console.log(message);
                    }
                } else if (slots[searchslot].p == 0xFE){
                    // MOT pages
                    if (packetnumber < 25){
                        let motpacket = {n:packetnumber,d:[]};
                        for (let i=0;i<40;i++){
                            motpacket.d[i] = hamming_8_4_decode(packet[i]);
                        }
                        MOTPageArray[packetMagazine].packets.push(motpacket);
                    }
                    if (packetnumber == MOTPageArray[packetMagazine].lastpacket){
                        // clear page association array to defaults
                        for (let p = 0; p < 0x100; p++){
                            MOTPageArray[packetMagazine].pages[p] = {gpop:0,pop:0,gdrcs:0,drcs:0};
                        }
                        
                        // decode packets into page association array
                        for (let p = 0; p < MOTPageArray[packetMagazine].packets.length; p++){
                            let packets = MOTPageArray[packetMagazine].packets[p];
                            let n = MOTPageArray[packetMagazine].packets[p].n;
                            if (n < 9){
                                // groups of decimal units (00-19 .. E0-F9)
                                for (let i=0;i<2;i++){
                                    for (let j=0;j<10;j++){
                                        let pop = packets.d[(i*20)+(j*2)];
                                        let drcs = packets.d[(i*20)+(j*2)+1];
                                        let pg = ((n-1)*0x20)+(i*0x10)+j;
                                        MOTPageArray[packetMagazine].pages[pg].gpop = (pop >> 3) & 1;
                                        MOTPageArray[packetMagazine].pages[pg].pop = pop & 7;
                                        MOTPageArray[packetMagazine].pages[pg].gdrcs = (drcs >> 3) & 1;
                                        MOTPageArray[packetMagazine].pages[pg].drcs = drcs & 7;
                                    }
                                }
                            } else if (n < 15){
                                // groups of hex units (0A-2F ... FA-FF)
                                for (let i=0;i<((n==14)?1:3);i++){
                                    for (let j=0;j<6;j++){
                                        let pop = packets.d[(i*12)+(j*2)];
                                        let drcs = packets.d[(i*12)+(j*2)+1];
                                        let pg = ((n-9)*0x30)+(i*0x10)+0x0A+j;
                                        MOTPageArray[packetMagazine].pages[pg].gpop = (pop >> 3) & 1;
                                        MOTPageArray[packetMagazine].pages[pg].pop = pop & 7;
                                        MOTPageArray[packetMagazine].pages[pg].gdrcs = (drcs >> 3) & 1;
                                        MOTPageArray[packetMagazine].pages[pg].drcs = drcs & 7;
                                    }
                                }
                            } else if (n >= 19 && n <= 24){
                                if (n != 21 && n != 24){
                                    for (let i=0; i<4; i++){
                                        let popObj = (n<22)?MOTPageArray[packetMagazine].pop2[(n==20)?i+4:i]:MOTPageArray[packetMagazine].pop3[(n==23)?i+4:i];
                                        popObj.lf=Boolean(packets.d[i*10]&8);
                                        popObj.m=packets.d[i*10]&7;
                                        popObj.p=((packets.d[i*10+1]&0xf) << 4) | (packets.d[i*10+2]&0xf);
                                        popObj.s=packets.d[i*10+3]&0xf;
                                        popObj.ff=(packets.d[i*10+4]&0xf);
                                        popObj.dof=(packets.d[i*10+5]&0xf);
                                        popObj.do1=((packets.d[i*10+6]&0xf) << 4) | (packets.d[i*10+7]&0xf);
                                        popObj.do2=((packets.d[i*10+8]&0xf) << 4) | (packets.d[i*10+9]&0xf);
                                    }
                                } else {
                                    for (let i=0; i<8; i++){
                                        let drcsObj = (n==21)?MOTPageArray[packetMagazine].drcs2[i]:MOTPageArray[packetMagazine].drcs3[i];
                                        drcsObj.lf=Boolean(packets.d[i*4]&8);
                                        drcsObj.m=packets.d[i*4]&7;
                                        drcsObj.p=((packets.d[i*4+1]&0xf) << 4) | (packets.d[i*4+2]&0xf);
                                        drcsObj.s=packets.d[i*4+3]&0xf;
                                    }
                                    // TODO: number of enhancement pages
                                }
                            }
                        }
                        
                        MOTPageArray[packetMagazine].packets.length = 0; // clear old packets for next time
                        // TODO: implement Annex B.6 properly
                        
                        let popArray, drcsArray;
                        
                        if ((renderLevel == 3) && (MOTPageArray[packetMagazine].lastpacket == 24)){
                            popArray = MOTPageArray[packetMagazine].pop3;
                            drcsArray = MOTPageArray[packetMagazine].drcs3;
                        } else {
                            popArray = MOTPageArray[packetMagazine].pop2;
                            drcsArray = MOTPageArray[packetMagazine].drcs2;
                        }
                        
                        for (let i=0; i<8; i++){
                            if (popArray[i].p != 0xff)
                                needEnhancementPage((i?1:0),popArray[i].m,popArray[i].p,0x3F7F,popArray[i].c);
                            if (drcsArray[i].p != 0xff)
                                needEnhancementPage((i?3:2),drcsArray[i].m,drcsArray[i].p,0x3F7F,drcsArray[i].c);
                        }
                    }
                } else if (slots[searchslot].e){
                    // searchslots for downloading enhancement pages
                    let epage = enhancementPageCache[(slots[searchslot].m << 8) | slots[searchslot].p];
                    let esubcode = slots[searchslot].ps;
                    if (!epage.s[esubcode])
                        epage.s[esubcode] = {r:[]};
                    if (packetnumber < 26){
                        epage.s[esubcode].r[packetnumber - 1] = packet;
                    } else if (packetnumber == 26){
                        let dc = hamming_8_4_decode(packet[0]);
                        if (dc != 0xff){
                            epage.s[esubcode].r[25 + dc] = packet;
                        }
                    }
                } else {
                    // something else
                }
            }
            break;
        case "initialpage":
            if (!settingReceived) // got bdsp initial page before channel settings, means old server
                channelSettings({}); // set some default channel settings
            
            initialmagazine = message[2];
            initialpage = message[3];
            initialsubcode = message[4];
            if (overlayActive){
                let statusDisplay = atob(message[5]);
                renderer.enableSidePanels(widescreen);
                if (widescreen){
                    for (let c = 0; c < 4; c++){
                        overlayCharacter(2,64 + 2*c,statusDisplay.charCodeAt(c) & 0x7f,2,0,0,true,true);
                    }
                    for (let c = 0; c < 16; c++){
                        overlayCharacter(2,2*c,statusDisplay.charCodeAt(c+4) & 0x7f,2,0,0,true,true);
                    }
                } else {
                    for (let c = 0; c < 20; c++){
                        overlayCharacter(2,2*c,statusDisplay.charCodeAt(c) & 0x7f,2,0,0,true,true);
                    }
                }
                renderer.redrawScreen();
            }
            break;
        case "pageExists":
            pageExists.push((message[2] << 8) | message[3]);
            pageExists.sort(function(a, b){return a-b});
            revPageExists = pageExists.slice().reverse();
            break;
    }
}

function needEnhancementPage(type, mag, page, subcode, count){
    // type 0-3 is gpop,pop,gdrcs,drcs
    // subcode is specific subpage to search for or 3F7F
    // count is number of subpages pages to cache
    
    // debug
    let string = ["gpop","pop","gdrcs","drcs"]
    console.log(string[type]+" required "+((mag<<8)|page).toString(16).toUpperCase()+"/"+("000"+subcode.toString(16).toUpperCase()).slice(-4));
    
    let searching = false;
    for (let i=1; i<slots.length; i++){
        if (slots[i].m == mag && slots[i].p == page && slots[i].e){
            if (slots[i].s == subcode || slots[i].s == 0x3F7F){
                searching = true; // already searching for this subpage, or all subpages
            } else {
                /* we want a different subpage to the one being searched for (or all subpages). */
                /* rather than try to keep track of multiple slots for different individual subpages, just be lazy and switch the slot to searching for all subpages, we can afford the memory */
                slots[i].s = 0x3F7F;
                websocketSend(["pagesearch", i, mag, page, 0x3F7F, false, false, true]);
                searching = true;
            }
        }
    }
    
    if (!searching){
        let slot = slots.push({m:mag,p:page,s:subcode,e:true,t:type,c:count}) - 1;
        websocketSend(["pagesearch", slot, mag, page, subcode, false, false, true]);
        return null;
    } else {
        if (enhancementPageCache[(mag<<8)|page]){
            if (enhancementPageCache[(mag<<8)|page]){
                // subpage is cached, return it
                return enhancementPageCache[(mag<<8)|page];
            }
        }
    }
}

function drcsLoadFromCache(cache, gdrcs){
    if (cache){
        for (let i=0; i<16; i++){
            if (cache.s[i]){
                for (let j=0; j<48; j++){
                    let data = importPTU(cache.s[i], j);
                    if (data){
                        if (gdrcs)
                            renderer.gdrcsArray[(48*i)+j] = {mode:0,data:data};
                        else
                            renderer.drcsArray[(48*i)+j] = {mode:0,data:data};
                    }
                    
                    // TODO: other modes
                }
            }
        }
    }
}

function importPTU(subtable, ptu){
    let row = ptu >> 1;
    if (subtable.r[row]){
        let data = [];
        for (let i=0; i<20; i++){
            let six = (subtable.r[row][(20*(ptu&1)) + i]) & 0x3F;
            for (let j=0; j<6; j++){
                data[i*6+j] = (six & (0x20>>j))?1:0;
            }
        }
        return data;
    } else {
        return null;
    }
}

function popLoadFromCache(cache, gpop){
    if (cache){
        for (let i=0; i<16; i++){
            if (cache.s[i]){
                for (let j=0; j<32; j++){
                    let active = importObject(cache.s[i],j,0);
                    let adaptive = importObject(cache.s[i],j,1);
                    let passive = importObject(cache.s[i],j,2);
                    if (active || adaptive || passive){
                        if (gpop)
                            renderer.gpopArray[(32*i)+j] = {active:active,adaptive:adaptive,passive:passive};
                        else
                            renderer.popArray[(32*i)+j] = {active:active,adaptive:adaptive,passive:passive};
                    }
                }
            }
        }
    }
}

function importObject(subpage, object, type)
{
    /* type: 0=active, 1=adaptive, 2=passive */
    if (object > 31){
        console.log("importObject: invalid object number");
        return null;
    }
    let row = (object >> 3);
    if (subpage.r[row]){
        let triplets = decodeEnhancementPacket(subpage.r[row])
        if (triplets[0] & 1){ // check if this is pointer data
            let triplet = triplets[2 + (((object>>1)&3) * 3) + type];
            let pointer = (object&1)?(triplet>>9):(triplet&0x1FF);
            if (pointer != 0x1FF && pointer <= 506){
                return getObjectData(subpage,pointer);
            } else {
                return null; // unused pointer
            }
        } else {
            return null; // not a pointer row
        }
    } else {
        return null; // row not present
    }
}

function getObjectData(subpage,pointer){
    let row = 2 + Math.floor(pointer / 13);
    if (subpage.r[row]){
        let triplets = decodeEnhancementPacket(subpage.r[row])
        if ((row < 4) && (triplets[0]&1)){
            console.log("getObjectData: pointer to pointer table row");
            return null; 
        } else {
            let triplet = (pointer % 13)
            let objectData = [];
            do{
                objectData.push(triplets[triplet+1]);
                if ((objectData[objectData.length - 1]&0x7FF) == 0x7FF)
                    return objectData; // hit a object terminator
                triplet++;
                if (triplet > 12)
                {
                    triplet = 0;
                    row++;
                    if (!(subpage.r[row]))
                    {
                        console.log("getObjectData: object data row missing");
                        return null;
                    }
                    triplets = decodeEnhancementPacket(subpage.r[row])
                    if ((row < 4) && (triplets[0]&1)){
                        console.log("getObjectData: pointer table in row data");
                        return null; 
                    }
                }
            }while(1);
        }
    } else {
        console.log("getObjectData: object data row missing");
        return null;
    }
}

function decodePacket28(data){
    decodeEnhancementCLUT(data, pagePresentationData);
    
    if (data[0] == 4 && haveX280)
        return; // if X280 exists ignore rest of X284
    
    pageFunction = data[1] & 0xF;
    pageCoding = (data[1] >> 4) & 0x7;
    
    decodeEnhancement(data, pagePresentationData);
}

function decodePacket29(data, magazine){
    decodeEnhancementCLUT(data, magazinePresentationData[magazine]);
    
    if (data[0] == 4 && magazineHasX290[magazine])
        return; // if X290 exists ignore rest of X294
    
    if (data[1] & 0x7F)
        return; // only packet function 0 valid
    
    decodeEnhancement(data, magazinePresentationData[magazine]);
}

function decodeEnhancementCLUT(data, presentationData){
    let offset = (data[0] == 4)?0:0x10;
    
    for (let c = 0; c < 0x10; c++){
        let rtr = Math.floor(((c * 12) + 28) / 18)+1;
        let rsh = Math.floor(((c * 12) + 28) % 18);
        let r = (data[rtr] >> rsh) & 0xF;
        if (rsh == 16)
            r |= (data[rtr+1] & 3) << 2;
        
        let gtr = Math.floor(((c * 12) + 32) / 18)+1;
        let gsh = Math.floor(((c * 12) + 32) % 18);
        let g = (data[gtr] >> gsh) & 0xF;
        if (gsh == 16)
            g |= (data[gtr+1] & 3) << 2;
        
        let btr = Math.floor(((c * 12) + 36) / 18)+1;
        let bsh = Math.floor(((c * 12) + 36) % 18);
        let b = (data[btr] >> bsh) & 0xF;
        if (bsh == 16)
            b |= (data[btr+1] & 3) << 2;
        
        presentationData.clut[offset + c] = (r << 8) | (g << 4) | b;
    }
}

function decodeEnhancement(data, presentationData){
    presentationData.defaultG0andG2 = (data[1] >> 7) & 0x7F;
    presentationData.secondG0andNOS = ((data[1] >> 14) & 0xF) | ((data[2] & 0x7) << 4);
    presentationData.lsp = (data[2] >> 3) & 1;
    presentationData.rsp = (data[2] >> 4) & 1;
    presentationData.spsf = (data[2] >> 5) & 1;
    presentationData.cols = (data[2] >> 6) & 0xF;
    presentationData.dsc = (data[13] >> 4) & 0x1F;
    presentationData.drc = (data[13] >> 9) & 0x1F;
    presentationData.bbcs = (data[13] >> 14) & 1;
    presentationData.ctm = (data[13] >> 15) & 7;
}

/* wrappers around localstorage getItem and setItem */
function getLocalStorage(key){
    try {
        return localStorage.getItem("teletextViewer:"+key);
    }
    catch(e) {
        console.log("Error: failed to get "+key+" from local storage");
        return null;
    }
}

function setLocalStorage(key, value){
    /* use "1" and "0" for true and false */
    if (value == false){
        localStorage.removeItem("teletextViewer:"+key,value); // remove keys when false
    } else {
        if (value == true)
            value = "1";
        try {
            localStorage.setItem("teletextViewer:"+key,value);
        } 
        catch(e) {
            console.log("Error: failed to set "+key+" in local storage");
            return;
        }
    }
}

function updateStatic(){
    // magic numbers tweaked to make noise appear random-ish without either obvious periodic repeats or glitches from close random numbers
    pseudoRandomXShift = (pseudoRandomXShift + 150 + ((60 * Math.random())|0)) % 422;
    pseudoRandomYShift = (pseudoRandomYShift + 130 + ((60 * Math.random())|0)) % 576;
    videoCanvasContext.drawImage(staticImg,pseudoRandomXShift,pseudoRandomYShift,768,576,0,0,widescreen?1024:768,576);
}

function staticEffect(state){
    if (!state){
        clearInterval(staticTimer);
        staticTimer = 0;
    } else if (!staticTimer){
        staticTimer = window.setInterval( updateStatic, 40);
    }
}

/* all the global variables and arrays */

let level1PageArray = [];
let packetX26TripletArray = [];
let pagePresentationData = {};
let linksFLOFMode;
let linksTOPMode;
let firstRowFlag;
let linksArray = []; /* somewhere to store link data */
let magazinePresentationData = [];
let magazineHasX290 = [];
let MOTPageArray = [];
let enhancementPageCache = [];
let slots = []; // 0-8 are reserved
let pageExists = [];
let revPageExists = [];

let powerOnFlag;
let paramsPage;
let teletextOnFlag;
let renderLevel;
let channelNumber;
let noChannel = false;
let channelID;
let mix;
let size;
let reveal;
let cancel;
let pagehold;
let magazine;
let page;
let subcode;
let controlbits;
let initialmagazine;
let initialpage;
let initialsubcode;
let numberentry;
let timeentry;
let numberentrytimer;
let enterdigit;
let nextmagazine;
let nextpage;
let nextsubcode;
let pagesearch;
let overlayActive;
let websocket = null;
let reconnectTimeout;
let staticTimer;
let pseudoRandomXShift = 0;
let pseudoRandomYShift = 0;
let nextcontrolbits;
let nextX26DC;
let haveX280;
let pageFunction;
let pageCoding;
let redrawOnNextHeader = false;
let hiddenTimeout;
let overlayTimeout;
let imageRefreshTimeout;
let videoImage;
let tvnumbercolour = 0x07; /* colour of page number */
let tvsearchcolour = 0x02; /* hardware set colour when searching for page */
let localCOPG0andG2;
let localCOPG0andNOS;

let defaultFailTextData = "QIECBAgQIKmXZl6ZfHRBzy8u2Xkg35s2zTuyoECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIAI2pFmRakWxUQVKUGdTmyadOTPnIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECAksWLFixYsWLFixYsWLFixYsWLFixYsWLFiyhBjxQTBgtcuUCBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgI04tKtJhxQ8mdUi0qVWhUkz5yBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIEFfKgw8N-zfn088qDNv5IOmjTzQad3TLy5deHTTv3IOm9AgQdNGVBu38tuHYgk7s2_ltw9NO_cgp5eXbTjyoECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIA1TRp5hemXn0QdOWHdz26efPTv3Bu-nZsQY9-7pp3dcqBAgDdd3TTsQdNGVBm67NiDnl5dtOPKgx4dyDFlQcsvPpv5Zci5AgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIEBdujRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNqgGl2qAIdBoBipUqQIEA2pFp1EFCDHijECBAqVKkA1AgOF2qBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIEBdqgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBqgQF2qBAgQIEBoqsWLFixYsWLFixYsWLFixYsMl0CBAgQIGqBAXaoECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgaoEBf____zxP____y3____kv____K____-R____8p____5dqgQF_____PE_____Lf___-S____8r____5H____yn____l2qBAX____88T____8t____5L____yv____kf____Kf___-XaoEBdGjRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNGjRo0aNCgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECA";
