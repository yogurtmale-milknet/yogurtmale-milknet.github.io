/*
Teletext rendering engine broken out of editor code in an attempt to make it more general purpose.
See "public functions and variables" section for general purpose rendering hooks.
*/

"use strict";

let createCanvas;
let chardataImage;

if (typeof window === 'undefined') {
    // node.js module specific code
    const Canvas = require('canvas');
    createCanvas = Canvas.createCanvas;
    
    chardataImage = new Canvas.Image();
    
    module.exports = { TeletextRenderer };
    
    setTimeout = function(){};
    setInterval = function(){};
}
else
{
    // browser specific code
    createCanvas = function (width, height) {
        return Object.assign(document.createElement('canvas'), { width: width, height: height })
    }
    
    chardataImage = new Image();
}

/* teletextCanvas scales up to fill optional screenDiv */
function TeletextRenderer(teletextCanvas, backgroundCanvas, screenDiv={}){
    /* page data arrays */
    let level1PageArray = []; // packets 0 to 24
    let packetX26TripletArray = []; // array of 18 bit enhancement functions
    
    let screenAttributesArray = [];
    // at each screen coordinate (y,x) object has the following properties:
    // switchG0: false = default G0, true = second G0.
    // mosaics: false = alpha, true = mosaics. Only set from spacing attributes!
    // dh: double height, dw: double width, br: bottom row, rh: right half
    // flash: bits 0 and 1 are flash mode, bits 2 and 3 are rate and phase
    // charcode: character code
    // charSet: character set data
    // NOS: National option subset 0 = none
    // foreColour: foreground colour number
    // backColour: background colour number
    // diacritic: G2 diacritic between 0 and 15
    // boxed, conceal, invert
    // separated: separated/underline
    // bold, italic, proportional
    
    let CLUT = []; // 32 colour look up table
    
    /* default CLUT and CLUT mappings from teletext spec */
    let defaultCLUT = [ 0x000,0xF00,0x0F0,0xFF0,0x00F,0xF0F,0x0FF,0xFFF,
                        0x000,0x700,0x070,0x770,0x007,0x707,0x077,0x777,
                        0xF05,0xF70,0x0F7,0xFFB,0x0CA,0x500,0x652,0xC77,
                        0x333,0xF77,0x7F7,0xFF7,0x77F,0xF7F,0x7FF,0xDDD ];
    let foregroundMapping = [0,0,0,1,1,2,2,2];
    let backgroundMapping = [0,1,2,1,2,1,2,3];
    
    let pagePresentationData = {};
    
    let pageSettings = {newsflash:false, subtitle:false, suppressHeader:false, inhibitDisplay:false};
    
    let leftSidePanel;
    let rightSidePanel;
    let sidePanelStatusFlag;
    let sidePanelColumns;
    let fullScreenColour;
    let fullRowColour = [];
    let blackBackgroundColourSubstitution;
    let colourMapping;

    let defaultG0Set;
    let defaultNOS;
    let defaultG2Set;
    let secondG0Set;
    let secondNOS;
    let defaultScreenColour;
    let defaultRowColour;
    
    let showCursor = false;
    let cursorPosition = [];
    
    let displayRow24 = true;
    let displayRow25 = false;
    
    let firstRow = 1;
    let firstColumn = 0;
    let lastRow = 24;
    let lastColumn = 39;
    
    let visibleControlChars = false;
    let showGrid = false;
    let reveal = false;
    let widescreen = false;
    let mixMode = false;
    let stretchMode = 0;
    let renderLevel = 0; // 0 = L1, 1 = L1.5, 2 = L2.5, 3 = L3.5
    
    let newsflash;
    let subtitle;
    let suppressHeader;
    let inhibitDisplay;
    
    let hideTeletext;
    let numberEntry;
    let pageSearch;
    
    /* charset stuff */
    let charsetCanvas;
    let charsetCanvasContext;
    let controlCodesImageData = [];
    let charsetImageData = [];
    let NOSImageData = [];
    let extraCharsData = []; // ISO 6937 diacritics
    let ISO6937LUT1 = []; // look up table for diacritics
    let ISO6937LUT2 = []; // look up table for diacritics
    let gdrcsArray = []; // array of gdrcs data
    let drcsArray = []; // array of drcs data
    let gpopArray = []; // array of global public objects
    let popArray = []; // array of public objects
    let defaultObjects = []; // array of default (G)POP objects
    // 0-1 are GPOP 1 and 2, 2-3 are POP 1 and 2
    // each has a flag, subpage, and object value.
    
    let bufferToImageDataArray = function(buffer,offset,characters){
        let imageDataArray = [];
        for (let character = 0; character < characters; character++){
            let data = [];
            for (let y = 0; y < 10; y++){
                for (let x = 0; x < 12; x++){
                    data[(y*12+x)] = buffer[(character * 120) + ((offset + y) * 12) + x] & 1;
                }
            }
            imageDataArray[character] = data;
        }
        return imageDataArray;
    }
    
    let initCharsetData = function(){
        /* initialise charsets */
        charsetCanvas = createCanvas(12, 17000);
        charsetCanvasContext = charsetCanvas.getContext("2d");

        charsetCanvasContext.imageSmoothingEnabled = false;
        charsetCanvasContext.msImageSmoothingEnabled = false;
        charsetCanvasContext.drawImage(chardataImage,0,0);
        
        let imageData = charsetCanvasContext.getImageData(0,0,12,17000);
        let buffer = new Uint32Array(imageData.data.buffer);
        
        for (let i = 0; i < 14; i++){
            charsetImageData.push(bufferToImageDataArray(buffer, i*960, 0x60));
            /* charsets pushed to array: latinG0, cyrillicG01, cyrillicG02, cyrillicG03, greekG0, arabicG0, hebrewG0, latinG2, cyrillicG2, greekG2, arabicG2, contiguousG1, separatedG1, G3 */
        }
        
        controlCodesImageData = bufferToImageDataArray(buffer, 13440, 0x20);
        
        /* create an array of image data for the national option subsets */
        for (let i=0; i<13; i++){
            NOSImageData[i] = bufferToImageDataArray(buffer, 13760+(130*i), 13);
        }
        
        extraCharsData = bufferToImageDataArray(buffer, 15450, 155);
        
        // no diacritic, Grave, Acute, Circumflex, Tilde, Macron, Breve, Dot, Umlaut/diÃ¦resis, Bottom dot not in ISO6937, Ring, Cedilla, Underscore not in ISO6937, Double acute, Ogonek, Caron
        ISO6937LUT1 = ["","AEIOUaeiou","ACEILNORSUYZacegilnorsuyz","ACEGHIJOSUWYaceghijosuwy","AINOUainou","AEIOUaeiou","AGUagu","CEGIZcegz","AEIOUYaeiouy","","AUau","CGKLNRSTcklnrst","","OUou","AEIUaeiu","CDELNRSTZcdelnrstz"];
        
        // offset to start of diacritic
        ISO6937LUT2 = [0, 0, 10, 35, 59, 69, 79, 85, 94,, 106, 110,, 125, 129, 137];
    }
    
    let setCharacterSets = function(defaultG0andG2, secondG0andNOS){
        switch(defaultG0andG2){
            default: // use English if an invalid value is recieved
            case 0x00:
            case 0x10:
                defaultG0Set = 0;
                defaultNOS = 2; // English
                defaultG2Set = 0;
                break;
            case 0x01:
            case 0x09:
            case 0x11:
            case 0x21:
                defaultG0Set = 0;
                defaultNOS = 5; // German
                defaultG2Set = 0;
                break;
            case 0x02:
            case 0x0A:
            case 0x12:
                defaultG0Set = 0;
                defaultNOS = 12; // Swedish/Finnish/Hungarian
                defaultG2Set = 0;
                break;
            case 0x03:
            case 0x0B:
            case 0x13:
                defaultG0Set = 0;
                defaultNOS = 6; // Italian
                defaultG2Set = 0;
                break;
            case 0x04:
            case 0x0C:
            case 0x14:
                defaultG0Set = 0;
                defaultNOS = 4; // French
                defaultG2Set = 0;
                break;
            case 0x05:
            case 0x15:
                defaultG0Set = 0;
                defaultNOS = 9; // Portuguese/Spanish
                defaultG2Set = 0;
                break;
            case 0x06:
            case 0x0E:
            case 0x26:
                defaultG0Set = 0;
                defaultNOS = 1; // Czech/Slovak
                defaultG2Set = 0;
                break;
            case 0x08:
                defaultG0Set = 0;
                defaultNOS = 8; // Polish
                defaultG2Set = 0;
                break;
            case 0x16:
            case 0x36:
                defaultG0Set = 0;
                defaultNOS = 13; // Turkish
                defaultG2Set = 0;
                break;
            case 0x1D:
                defaultG0Set = 0;
                defaultNOS = 11; // Serbian/Croatian/Slovenian
                defaultG2Set = 0;
                break;
            case 0x1F:
                defaultG0Set = 0;
                defaultNOS = 10; // Rumanian
                defaultG2Set = 0;
                break;
            case 0x20:
                defaultG0Set = 1; // Serbian/Croatian
                defaultNOS = 0;
                defaultG2Set = 1;
                break;
            case 0x22:
                defaultG0Set = 0;
                defaultNOS = 3; // Estonian
                defaultG2Set = 0;
                break;
            case 0x23:
                defaultG0Set = 0;
                defaultNOS = 7; // Lettish/Lithuanian
                defaultG2Set = 0;
                break;
            case 0x24:
                defaultG0Set = 2; // Russian/Bulgarian
                defaultNOS = 0;
                defaultG2Set = 1; // Cyrillic G2
                break;
            case 0x25:
                defaultG0Set = 3; // Ukrainian
                defaultNOS = 0;
                defaultG2Set = 1; // Cyrillic G2
                break;
            case 0x37:
                defaultG0Set = 4; // Greek
                defaultNOS = 0;
                defaultG2Set = 2; // Greek G2
                break;
            case 0x40:
                defaultG0Set = 0;
                defaultNOS = 2; // English
                defaultG2Set = 3; // Arabic G2
                break;
            case 0x44:
                defaultG0Set = 0;
                defaultNOS = 4; // French
                defaultG2Set = 3; // Arabic G2
                break;
            case 0x47:
            case 0x57:
                defaultG0Set = 5; // Arabic G0
                defaultNOS = 0;
                defaultG2Set = 3; // Arabic G2
                break;
            case 0x55:
                defaultG0Set = 6; // Hebrew G0
                defaultNOS = 0;
                defaultG2Set = 3; // Arabic G2
                break;
        }
        switch(secondG0andNOS){
            case 0x00:
            case 0x10:
            case 0x40:
                secondG0Set = 0;
                secondNOS = 2; // English
                break;
            case 0x01:
            case 0x09:
            case 0x11:
            case 0x21:
                secondG0Set = 0;
                secondNOS = 5; // German
                break;
            case 0x02:
            case 0x0A:
            case 0x12:
                secondG0Set = 0;
                secondNOS = 12; // Swedish/Finnish/Hungarian
                break;
            case 0x03:
            case 0x0B:
            case 0x13:
                secondG0Set = 0;
                secondNOS = 6; // Italian
                break;
            case 0x04:
            case 0x0C:
            case 0x14:
            case 0x44:
                secondG0Set = 0;
                secondNOS = 4; // French
                break;
            case 0x05:
            case 0x15:
                secondG0Set = 0;
                secondNOS = 9; // Portuguese/Spanish
                break;
            case 0x06:
            case 0x0E:
            case 0x26:
                secondG0Set = 0;
                secondNOS = 1; // Czech/Slovak
                break;
            case 0x08:
                secondG0Set = 0;
                secondNOS = 8; // Polish
                break;
            case 0x16:
            case 0x36:
                secondG0Set = 0;
                secondNOS = 13; // Turkish
                break;
            case 0x1D:
                secondG0Set = 0;
                secondNOS = 11; // Serbian/Croatian/Slovenian
                break;
            case 0x1F:
                secondG0Set = 0;
                secondNOS = 10; // Rumanian
                break;
            case 0x20:
                secondG0Set = 1; // Serbian/Croatian
                secondNOS = 0;
                break;
            case 0x22:
                secondG0Set = 0;
                secondNOS = 3; // Estonian
                break;
            case 0x23:
                secondG0Set = 0;
                secondNOS = 7; // Lettish/Lithuanian
                break;
            case 0x24:
                secondG0Set = 2; // Russian/Bulgarian
                secondNOS = 0;
                break;
            case 0x25:
                secondG0Set = 3; // Ukrainian
                secondNOS = 0;
                break;
            case 0x37:
                secondG0Set = 4; // Greek
                secondNOS = 0;
                break;
            case 0x47:
            case 0x57:
                secondG0Set = 5; // Arabic G0
                secondNOS = 0;
                break;
            case 0x55:
                secondG0Set = 6; // Hebrew G0
                secondNOS = 0;
                break;
            case 0x7F:
                secondG0Set = defaultG0Set;
                secondNOS = defaultNOS;
        }
    }
    
    let initializeLevel1PageArray = function(){
        for (let r = 0; r < 26; r++){
            level1PageArray[r] = [];
            for (let c = 0; c < 40; c++){
                level1PageArray[r][c] = 0x20; // fill with spaces
            }
        }
    }
    
    let resetDRCSArrays = function(){
        gdrcsArray.length = 0;
        drcsArray.length = 0;
    }
    
    let resetPOPArrays = function(){
        gpopArray.length = 0;
        popArray.length = 0;
        for (let i=0; i<4; i++)
        {
            defaultObjects[i] = {flag:0,subpage:0,object:0};
        }
    }
    
    let resetPresentationData = function(){
        pagePresentationData.G0andG2 = 0x00;
        pagePresentationData.G0andNOS = 0x7f;
        pagePresentationData.lsp = false;
        pagePresentationData.rsp = false;
        pagePresentationData.spsf = true;
        pagePresentationData.cols = 0;
        pagePresentationData.clut = defaultCLUT.slice();
        pagePresentationData.dsc = 0;
        pagePresentationData.drc = 0;
        pagePresentationData.bbcs = false;
        pagePresentationData.ctm = 0;
    }
    
    /* flash stuff */
    let flashEnabled;
    let flashphase = 0x01;
    
    function flashinterval(){
        updateFlash();
        
        flashphase <<= 1;
        if (flashphase > 0x20)
            flashphase = 0x01;
    }
    
    let flashPhasesLUT = [0x38, 0x36, 0x2D, 0x1B]; // slow rate, fast phase 1, fast phase 2, fast phase 3
    let flash;
    
    let updateFlash = function(){
        characterArrayCanvasContext.imageSmoothingEnabled = false;
        characterArrayCanvasContext.msImageSmoothingEnabled = false;
        characterArrayCanvasContext.putImageData(steadyPixelData,0,0);
        
        flashOnCanvasContext.imageSmoothingEnabled = false;
        flashOnCanvasContext.msImageSmoothingEnabled = false;
        flashOnCanvasContext.putImageData(flashPixelData,0,0); /* update flash canvas */
        
        for (let r = 0; r < 26; r++){
            for (let c = 0; c < 72; c++){
                let row = (screenAttributesArray[r][c].br)?r-1:r;
                let col = (screenAttributesArray[row][c].dw && screenAttributesArray[row][c].rh)?c-1:c;
                flash = screenAttributesArray[row][col].flash;
                if (flash & 0x03){
                    /* not steady */
                    if (flashPhasesLUT[flash >> 2] & flashphase){
                        characterArrayCanvasContext.clearRect(c*12,r*10,12,10);
                        characterArrayCanvasContext.drawImage(flashOnCanvas,c*12,r*10,12,10,c*12,r*10,12,10);
                    }
                }
            }
        }
    }
    
    let moveCursor = function(direction, row, column, cursorRTL, insertMode){
        // map forwards and backwards
        if (cursorRTL){
            if (direction == 4){ // backwards 
                direction = 2;
            } else if (direction == 5){ // forwards
                direction = 0;
            }
        } else {
            if (direction == 4){ // backwards
                direction = 0;
            } else if (direction == 5){ // forwards
                direction = 2;
            }
        }
        
        let previousCursorX = cursorPosition[0];
        let previousCursorY = cursorPosition[1];
        
        switch (direction){
            case 0: // left
                cursorPosition[1]--;
                if (cursorPosition[1] > -1){
                    let attrs = screenAttributesArray[cursorPosition[0]][cursorPosition[1]];
                    if ((cursorRTL || insertMode) && attrs.dw && attrs.rh)
                        cursorPosition[1]--; /* double step cursor in double width text */
                }
                if (cursorPosition[1] < firstColumn){
                    if (cursorRTL ){ // right-to-left language
                        cursorPosition[1] = lastColumn; // cursor to other end of line
                        if (cursorPosition[0] < lastRow){
                            cursorPosition[0]++; // cursor down to next row
                        } else {
                            cursorPosition[0] = firstRow; // loop page
                        }
                    } else { // left-to-right language
                        cursorPosition[1] = lastColumn; // cursor to other end of line
                        if (cursorPosition[0] > firstRow) {
                            cursorPosition[0]--; // cursor up to previous row
                        } else {
                            cursorPosition[0] = lastRow; // loop page
                        }
                    }
                }
                break;
            case 1: // up
                if (cursorPosition[0] > firstRow){
                    cursorPosition[0]--;
                } else {
                    cursorPosition[0] = lastRow;
                }
                break;
            case 2: // right
                cursorPosition[1]++;
                let attrs = screenAttributesArray[cursorPosition[0]][cursorPosition[1]];
                if ((!cursorRTL || insertMode) && attrs.dw && attrs.rh)
                    cursorPosition[1]++; /* double step cursor in double width text */
                if (cursorPosition[1] > lastColumn){
                    if (cursorRTL){ // right-to-left language
                        cursorPosition[1] = firstColumn; // cursor to other end of line
                        if (cursorPosition[0] > firstRow){
                            cursorPosition[0]--; // cursor up to next row
                        } else {
                            cursorPosition[0] = lastRow;
                        }
                    } else { // left-to-right language
                        cursorPosition[1] = firstColumn; // cursor to other end of line
                        if (cursorPosition[0] < lastRow){
                            cursorPosition[0]++; // cursor down to previous row
                        } else {
                            cursorPosition[0] = firstRow;
                        }
                    }
                }
                break;
            case 3: // down
                if (cursorPosition[0] < lastRow){
                    cursorPosition[0]++;
                } else {
                    cursorPosition[0] = firstRow;
                }
                break;
            case 6: // home
                if (cursorRTL ){ // right-to-left language
                    cursorPosition[1] = lastColumn;
                } else {
                    cursorPosition[1] = firstColumn;
                }
                break;
            case 7: // end
                if (cursorRTL ){ // right-to-left language
                    cursorPosition[1] = firstColumn;
                } else {
                    cursorPosition[1] = lastColumn;
                }
                break;
            case 8: // top
                cursorPosition[0] = firstRow;
                break;
            case 9: // bottom
                cursorPosition[0] = lastRow;
                break;
            case 10: // mouse
                /* move cursor to designated coordinates */
                cursorPosition[0] = row;
                cursorPosition[1] = column;
                break;
        }
        
        let prevCellAttributes = screenAttributesArray[previousCursorX][previousCursorY];
        renderCharacter(previousCursorX, previousCursorY); // undraw the old cursor position
        if (prevCellAttributes.dw && !prevCellAttributes.rh){ // left column of double width
            renderCharacter(previousCursorX, previousCursorY+1); // undraw the cursor to the right
        }
        if (prevCellAttributes.dh){ // top of double height
            renderCharacter(previousCursorX+1,previousCursorY); // undraw the new cursor position
            if (prevCellAttributes.dw && !prevCellAttributes.rh){ // left column of double width
                renderCharacter(previousCursorX+1, previousCursorY+1); // undraw the cursor to the right
            }
        }

        
        let cellAttributes = screenAttributesArray[cursorPosition[0]][cursorPosition[1]];
        renderCharacter(cursorPosition[0], cursorPosition[1]); // draw the new cursor position
        if (cellAttributes.dw && !cellAttributes.rh){ // left column of double width
            renderCharacter(cursorPosition[0], cursorPosition[1]+1); // draw the cursor to the right
        }
        if (cellAttributes.dh){ // top of double height
            renderCharacter(cursorPosition[0]+1, cursorPosition[1]); // draw the new cursor position
            if (cellAttributes.dw && !cellAttributes.rh){ // left column of double width
                renderCharacter(cursorPosition[0]+1, cursorPosition[1]+1); // draw the cursor to the right
            }
        }
    }
    
    // colour stuff
    let getColour = function(colour, row, boxed, pickerFlag){
        // overload options with pickerFlag to allow colour picker to get colour directly from CLUT
        let RGBA = [];
        let value;
        
        if (pickerFlag){
            value = CLUT[colour & 0x1F];
        } else {
            let table = (renderLevel < 3 && colour < 16)?defaultCLUT:CLUT;
            
            if ((colour & 0x20) && mixMode){
                RGBA[3] = 0x00; // default background as video in mix mode
            } else {
                if ((colour & 0x1F) != 0x08){ // F/B colour
                    if ((newsflash || subtitle) && !boxed){
                        value = CLUT[0x08]; // video
                        RGBA[3] = 0x00;
                    } else {
                        value = table[colour & 0x1F]; // F/B colour
                        RGBA[3] = 0xFF;
                    }
                } else { // CLUT1:0
                    if ((!(newsflash || subtitle || boxed)) || ((newsflash || subtitle) && boxed)){
                        let rowColour = fullRowColour[row];
                        table = (renderLevel < 3 && rowColour < 16)?defaultCLUT:CLUT;
                        value = table[rowColour]; // row colour
                        if (fullRowColour[row] == 0x08)
                            RGBA[3] = 0x00;
                        else
                            RGBA[3] = 0xFF;
                    } else {
                        value = CLUT[0x08]; // video
                        RGBA[3] = 0x00;
                    }
                }
            }
        }
        
        RGBA[0] = ((value >> 8) & 0xF) * 0x11;
        RGBA[1] = ((value >> 4) & 0xF) * 0x11;
        RGBA[2] = (value & 0xF) * 0x11;
        
        return RGBA;
    }
    
    let getColourHTML = function(colour){
        let table = (renderLevel < 3 && colour < 16)?defaultCLUT:CLUT;
        let paddedvalue = (table[colour] & 0xFFF).toString(16);
        while (paddedvalue.length < 3) paddedvalue = "0" + paddedvalue;
        
        return "#"+paddedvalue;
    }
    
    let isColourDark = function(R,G,B){
        /* use the "HSP" colour model - http://alienryderflex.com/hsp.html */
        
        let P = Math.sqrt((R * R * 0.299) + (G * G * 0.587) + (B * B * 0.114));
        
        if (P < 130)
            return true;
        else
            return false;
    }
    
    let parsePacket26Triplets = function(){
        // process contents of packetX26TripletArray
        
        // initialise active position to before the first row
        let activePositionX = -1;
        let activePositionY = -1;
        
        let originOffsetX = 0;
        let originOffsetY = 0;
        
        let G0andG2 = pagePresentationData.G0andG2;
        let modifiedG0andG2 = -1;
        let gdrcsTable = 0;
        let drcsTable = 0;
        let gdrcsLocked = false;
        let drcsLocked = false;
        
        let enhancementSizeArray = [];
        for (let r = 0; r < 25; r++){
            enhancementSizeArray[r] = [];
            for (let c = 0; c < 40; c++){
                enhancementSizeArray[r][c] = 0; // no attribute
            }
        }
        
        for (let i=0; i<packetX26TripletArray.length; i++){
            let address = packetX26TripletArray[i] & 0x3F;
            let mode = (packetX26TripletArray[i] >> 6) & 0x1F;
            let data = (packetX26TripletArray[i] >> 11) & 0x7F;
            
            if (address >= 40){
                // row address group
                let row = address - 40;
                if (row == 0)
                    row = 24;
                switch(mode){
                    case 0x00: // full screen colour
                        if (renderLevel >= 2 && (data & 0x60) == 0 && activePositionX < 0 && activePositionY < 0){
                            fullScreenColour = data;
                            activePositionY = 0; // move on to first row
                            for (let j=0; j<25; j++)
                                fullRowColour[j] = data; // all rows to fullScreenColour as per Annex A.5
                        }
                        break;
                    case 0x01: // full row colour
                        if (renderLevel >= 2 && activePositionY < row){
                            fullRowColour[row] = data & 0x1F;
                            if ((data & 0x60) == 0x60){
                                for (let j=row+1; j<25; j++){
                                    fullRowColour[j] = data & 0x1F;
                                }
                            }
                            activePositionY = row;
                            activePositionX = 0; // move on to first character of row
                            G0andG2 = pagePresentationData.G0andG2;
                        }
                        break;
                    case 0x04: // set active position
                        if (activePositionY <= row){
                            if (activePositionY < row)
                                G0andG2 = pagePresentationData.G0andG2;
                            activePositionY = row;
                            if (renderLevel >= 2 && data < 40)
                                activePositionX = data;
                            else
                                activePositionX = -1;
                        }
                        break;
                    case 0x07: // address display row 0
                        if (address == 0x3F && activePositionX < 0){
                            activePositionY = 0;
                            activePositionX = 8; // move to 0,8. should be 0,0 but this prevents enhancements being addressed to columns < 8
                            G0andG2 = pagePresentationData.G0andG2;
                            
                            if (renderLevel >= 2){
                                fullRowColour[0] = data & 0x1F;
                                if ((data & 0x60) == 0x60){
                                    for (let j=1; j<25; j++){
                                        fullRowColour[j] = data & 0x1F;
                                    }
                                }
                            }
                        }
                        break;
                    case 0x10: // origin modifier
                        if (renderLevel >= 2 && data < 72){
                            originOffsetY = address - 40;
                            originOffsetX = data;
                        }
                        break;
                    case 0x11:
                    case 0x12:
                    case 0x13:
                        // object invocation
                        originOffsetY = 0;
                        originOffsetX = 0;
                        let objectSource = ((address>>3)&3);
                        let objectType = (mode&3);
                        let objectAddress = (data|((address&3)<<7));
                        if (objectSource == 0){
                            console.log("Illegal object "+address+" "+mode+" "+data);
                            break;
                        }
                        let objectData = [];
                        let objectArrays = (objectSource&1)?gpopArray[objectAddress]:popArray[objectAddress];
                        if (objectSource == 1){
                            // local object
                            for (let i=objectAddress;i<packetX26TripletArray.length;i++)
                            {
                                // copy enhancement data up to terminator
                                objectData.push(packetX26TripletArray[i]);
                                if ((packetX26TripletArray[i]&0x7ff) == 0x7ff)
                                    break;
                            }
                            console.log("Local "+(["active  ","adaptive","passive "][objectType-1])+" object invocation from packet "+(objectAddress>>4)+" triplet "+(objectAddress&0xf), objectData);
                        }
                        else if (objectArrays) // skip if objects aren't loaded
                        {
                            switch (objectType){
                                case 1:
                                    objectData = objectArrays.active;
                                    break;
                                case 2:
                                    objectData = objectArrays.adaptive;
                                    break;
                                case 3:
                                    objectData = objectArrays.passive;
                                    break;
                            }
                            console.log(((objectSource&1)?"GPOP  ":"POP   ")+(["active  ","adaptive","passive "][objectType-1])+" object invocation from subpage "+(objectAddress&0xf)+" packet "+(((objectAddress>>7)&3)+1)+" triplet "+((((objectAddress>>5)&3)*3)+objectType)+" bits "+((objectAddress&0x10)?"1 to 9":"10 to 18"), objectData);
                        }
                        break;
                    case 0x15:
                    case 0x16:
                    case 0x17:
                        // object definition
                        break;
                    case 0x18: // DRCS mode
                        if ((renderLevel == 2 && (data & 0x10)) || (renderLevel == 3 && (data & 0x20))){
                            if (data & 0x40 && !gdrcsLocked){
                                gdrcsTable = data & 0xF;
                                if (renderLevel == 2){
                                    gdrcsLocked = true;
                                    console.log("Error: tried to designate more than one gdrcs sub-table at level 2.5");
                                }
                            } else if (!drcsLocked){
                                drcsTable = data & 0xF;
                                if (renderLevel == 2){
                                    drcsLocked = true;
                                    console.log("Error: tried to designate more than one drcs sub-table at level 2.5");
                                }
                            }
                        }
                        break;
                    case 0x1F: // termination marker
                        if (address == 63){
                            i = packetX26TripletArray.length; // break out of loop
                        }
                        break;
                }
            } else {
                // column address group
                switch(mode){
                    case 0x00: // foreground colour
                        if (renderLevel >= 2 && (data & 0x60) == 0 && activePositionX <= address){
                            activePositionY = (activePositionY < 0)?0:activePositionY;
                            activePositionX = address;
                            for (let j=activePositionX; j<40; j++){
                                screenAttributesArray[activePositionY][j].foreColour = data;
                                if (!screenAttributesArray[activePositionY][j].br){
                                    let next = level1PageArray[activePositionY][j]
                                    if (next < 0x08 || (next >= 0x10 && next < 0x18))
                                        break; // stop at spacing colour attribute
                                }
                            }
                        }
                        break;
                    case 0x01: // G1 mosaic character
                        if (renderLevel >= 2 && activePositionX <= address){
                            activePositionY = (activePositionY < 0)?0:activePositionY;
                            activePositionX = address;
                            if (data >= 0x20){
                                screenAttributesArray[activePositionY][activePositionX].charcode = data;
                                screenAttributesArray[activePositionY][activePositionX].mosaics = true;
                                if (renderLevel >= 2 && activePositionY)
                                    if (!(screenAttributesArray[activePositionY-1][activePositionX].dh))
                                        screenAttributesArray[activePositionY][activePositionX].br = false;
                            }
                        }
                        break;
                    case 0x02: // G3 mosaic character at L1.5
                        if (activePositionX <= address){
                            activePositionY = (activePositionY < 0)?0:activePositionY;
                            activePositionX = address;
                            if (data >= 0x20){
                                screenAttributesArray[activePositionY][activePositionX].charcode = data;
                                screenAttributesArray[activePositionY][activePositionX].charSet = 13;
                                if (renderLevel >= 2 && activePositionY)
                                    if (!(screenAttributesArray[activePositionY-1][activePositionX].dh))
                                        screenAttributesArray[activePositionY][activePositionX].br = false;
                            }
                        }
                        break;
                    case 0x03: // background colour
                        if (renderLevel >= 2 && (data & 0x60) == 0 && activePositionX <= address){
                            activePositionY = (activePositionY < 0)?0:activePositionY;
                            activePositionX = address;
                            for (let j=activePositionX; j<40; j++){
                                screenAttributesArray[activePositionY][j].backColour = data;
                                if (!screenAttributesArray[activePositionY][j].br){
                                    let next = level1PageArray[activePositionY][j+1]
                                    if (next == 0x1C || next == 0x1D)
                                        break; // stop at spacing background colour attribute
                                }
                            }
                        }
                        break;
                    case 0x07: // flash functions
                        if (renderLevel >= 2 && (data & 0x60) == 0 && activePositionX <= address){
                            activePositionY = (activePositionY < 0)?0:activePositionY;
                            activePositionX = address;
                            let phase = 1;
                            if (data & 0x10){
                                if (data & 8)
                                    break; // reserved rate and phases
                            } else {
                                phase = (data & 0xC) >> 2;
                            }
                            for (let j=activePositionX; j<40; j++){
                                screenAttributesArray[activePositionY][j].flash = (data & 3) | (phase << 2);
                                if (data & 0x10){
                                    if (data & 0x4){
                                        phase--;
                                        if (phase < 1)
                                            phase = 3;
                                    } else {
                                        phase++;
                                        if (phase > 3)
                                            phase = 1;
                                    }
                                }
                                // overwrite whole line, erasing any subsequent level 1 flash - I don't know if this is correct!
                            }
                        }
                        break;
                    case 0x08: // modified G0 and G2 designation
                        if (renderLevel >= 2 && activePositionX <= address){
                            activePositionY = (activePositionY < 0)?0:activePositionY;
                            activePositionX = address;

                            if (data == pagePresentationData.G0andG2){
                                // selected default charsets
                                G0andG2 = data;
                            } else if (renderLevel >= 3 || data == modifiedG0andG2 || modifiedG0andG2 < 0){
                                // selected another charset
                                modifiedG0andG2 = data;
                                G0andG2 = data;
                            }
                        }
                        break;
                    case 0x09: // G0 character
                        if (renderLevel >= 2 && activePositionX <= address){
                            activePositionY = (activePositionY < 0)?0:activePositionY;
                            activePositionX = address;
                            if (data >= 0x20){
                                setCharacterSets(G0andG2,pagePresentationData.G0andNOS);
                                screenAttributesArray[activePositionY][activePositionX].charcode = data;
                                screenAttributesArray[activePositionY][activePositionX].charSet = defaultG0Set;
                                screenAttributesArray[activePositionY][activePositionX].NOS = 0;
                                screenAttributesArray[activePositionY][activePositionX].mosaics = false;
                                if (renderLevel >= 2 && activePositionY)
                                    if (!(screenAttributesArray[activePositionY-1][activePositionX].dh))
                                        screenAttributesArray[activePositionY][activePositionX].br = false;
                            }
                        }
                        break;
                    case 0x0B: // G3 mosaic character at L2.5 and 3.5
                        if (renderLevel >= 2 && activePositionX <= address){
                            activePositionY = (activePositionY < 0)?0:activePositionY;
                            activePositionX = address;
                            if (data >= 0x20){
                                screenAttributesArray[activePositionY][activePositionX].charcode = data;
                                screenAttributesArray[activePositionY][activePositionX].charSet = 13;
                                if (renderLevel >= 2 && activePositionY)
                                    if (!(screenAttributesArray[activePositionY-1][activePositionX].dh))
                                        screenAttributesArray[activePositionY][activePositionX].br = false;
                            }
                        }
                        break;
                    case 0x0C: // display attributes
                        if (renderLevel >= 2 && activePositionX <= address){
                            activePositionY = (activePositionY < 0)?0:activePositionY;
                            activePositionX = address;
                            for (let j=activePositionX; j<40; j++){ // boxing/window
                                screenAttributesArray[activePositionY][j].boxed = Boolean(data&2);
                                if (!screenAttributesArray[activePositionY][j].br){
                                    if ((data&2 && level1PageArray[activePositionY][j] == 0x0A && level1PageArray[activePositionY][j+1] == 0x0A) || (!(data&2) && level1PageArray[activePositionY][j] == 0x0B && level1PageArray[activePositionY][j+1] == 0x0B))
                                        break;
                                }
                            }
                            for (let j=activePositionX; j<40; j++){ // conceal
                                screenAttributesArray[activePositionY][j].conceal = Boolean(data&4);
                                if (!screenAttributesArray[activePositionY][j].br){
                                    if ((level1PageArray[activePositionY][j] < 0x20) && ((data&4) && (level1PageArray[activePositionY][j]&0xF) < 8) || (!(data&4) && level1PageArray[activePositionY][j+1] == 0x18))
                                        break;
                                }
                            }
                            for (let j=activePositionX; j<40; j++){ // invert
                                screenAttributesArray[activePositionY][j].invert = Boolean(data&0x10);
                            }
                            for (let j=activePositionX; j<40; j++){ // underline/separated
                                screenAttributesArray[activePositionY][j].separated = Boolean(data&0x20);
                                screenAttributesArray[activePositionY][j].heldmode = Boolean(data&0x20);
                                screenAttributesArray[activePositionY][j].underline = Boolean(data&0x20);
                                
                                if (!screenAttributesArray[activePositionY][j].br){
                                    if (!(data&0x20) && level1PageArray[activePositionY][j] == 0x1A)
                                        break; // cancel separated state invoked by a previous spacing attribute
                                }
                                // pretty sure this is wrong. All these enhancements should probably be written to a shadow attribute array and applied in the same way as the double size stuff below
                            }
                            let dh = Boolean(data&1);
                            let dw = Boolean(data&0x40);
                            for (let j=activePositionX; j<40; j++){ // double size
                                let sizeAttr = 0;
                                if (dw){
                                    sizeAttr |= dw?1:0;
                                } else if (!dw){
                                    sizeAttr |= 0x10; // normal width
                                }
                                if (!dh)
                                    sizeAttr |= 8; // normal height
                                else if (dh && activePositionY < 23 && activePositionY > 0)
                                    sizeAttr |= dh?4:0; // double height
                                
                                enhancementSizeArray[activePositionY][j] = sizeAttr;
                                
                                if (!screenAttributesArray[activePositionY][j].br){
                                    let next = level1PageArray[activePositionY][j];
                                    if (j>activePositionX){
                                        if(next == 0x0C || next == 0x0D || next == 0x0E || next == 0x0F)
                                            break; // stop at spacing size change
                                    }
                                }
                            }
                        }
                        break;
                    case 0x0D: // DRCS invocation
                        if (renderLevel >= 2 && activePositionX <= address){
                            activePositionY = (activePositionY < 0)?0:activePositionY;
                            activePositionX = address;
                            // TODO
                            if ((data & 0x3F) < 48){
                                if (!(data & 0x40)){
                                    if (gdrcsArray[(gdrcsTable*48)+(data & 0x3F)]){
                                        if (gdrcsArray[(gdrcsTable*48)+(data & 0x3F)].mode > 3){
                                            console.log("gdrcs error");
                                            break;
                                        }
                                        if (renderLevel == 2){
                                            gdrcsLocked = true;
                                        }
                                        screenAttributesArray[activePositionY][activePositionX].gdrcs = true;
                                        screenAttributesArray[activePositionY][activePositionX].drcsTable = gdrcsTable;
                                        if (renderLevel >= 2 && activePositionY)
                                            if (!(screenAttributesArray[activePositionY-1][activePositionX].dh))
                                                screenAttributesArray[activePositionY][activePositionX].br = false;
                                    } else {
                                        console.log("gdrcs error");
                                        break;
                                    }
                                } else {
                                    if (drcsArray[(drcsTable*48)+(data & 0x3F)]){
                                        if (drcsArray[(drcsTable*48)+(data & 0x3F)].mode > 3){
                                            console.log("drcs error");
                                            break;
                                        }
                                        if (renderLevel == 2){
                                            gdrcsLocked = true;
                                        }
                                        screenAttributesArray[activePositionY][activePositionX].drcs = true;
                                        screenAttributesArray[activePositionY][activePositionX].drcsTable = drcsTable;
                                        if (renderLevel >= 2 && activePositionY)
                                            if (!(screenAttributesArray[activePositionY-1][activePositionX].dh))
                                                screenAttributesArray[activePositionY][activePositionX].br = false;
                                    } else {
                                        console.log("drcs error");
                                        break;
                                    }
                                }
                                screenAttributesArray[activePositionY][activePositionX].charcode = data & 0x3F;
                            }
                        }
                        break;
                    case 0x0E: // font style
                        if (renderLevel >= 3 && activePositionX <= address){
                            activePositionY = (activePositionY < 0)?0:activePositionY;
                            activePositionX = address;
                            for (let r=0; r<((data >> 4)&7)+1; r++){
                                if (activePositionY+r > 24)
                                    break;
                                for (let c=activePositionX; c<40; c++){
                                    screenAttributesArray[activePositionY+r][c].proportional = Boolean(data&1);
                                    screenAttributesArray[activePositionY+r][c].bold = Boolean(data&2);
                                    screenAttributesArray[activePositionY+r][c].italic = Boolean(data&4);
                                }
                            }
                        }
                        break;
                    case 0x0F: // G2 character
                        if (activePositionX <= address){
                            activePositionY = (activePositionY < 0)?0:activePositionY;
                            activePositionX = address;
                            if (data >= 0x20){
                                setCharacterSets(G0andG2,pagePresentationData.G0andNOS);
                                screenAttributesArray[activePositionY][activePositionX].charcode = data;
                                screenAttributesArray[activePositionY][activePositionX].charSet = 7 + defaultG2Set;
                                screenAttributesArray[activePositionY][activePositionX].mosaics = false;
                                if (renderLevel >= 2 && activePositionY)
                                    if (!(screenAttributesArray[activePositionY-1][activePositionX].dh))
                                        screenAttributesArray[activePositionY][activePositionX].br = false;
                            }
                        }
                        break;
                    case 0x10:
                        if (data == 0x2A){
                         /* special case to handle specification change in EN 300 706 V1.2.1 
                            The @ symbol replaces the * symbol at position 2/A when the table is accessed via a packet X/26 Column Address triplet with Mode Description = 10000 and Data = 0101010. */
                            if (activePositionX <= address){
                                activePositionY = (activePositionY < 0)?0:activePositionY;
                                activePositionX = address;
                                screenAttributesArray[activePositionY][activePositionX].charcode = 0x40; // real position of @ symbol
                                screenAttributesArray[activePositionY][activePositionX].charSet = 0; // force latin G0
                                screenAttributesArray[activePositionY][activePositionX].NOS = 0;
                                screenAttributesArray[activePositionY][activePositionX].diacritic = 0;
                                screenAttributesArray[activePositionY][activePositionX].mosaics = false;
                                if (renderLevel >= 2 && activePositionY)
                                    if (!(screenAttributesArray[activePositionY-1][activePositionX].dh))
                                        screenAttributesArray[activePositionY][activePositionX].br = false;
                            }
                            break;
                        }
                    case 0x11:
                    case 0x12:
                    case 0x13:
                    case 0x14:
                    case 0x15:
                    case 0x16:
                    case 0x17:
                    case 0x18:
                    case 0x19:
                    case 0x1A:
                    case 0x1B:
                    case 0x1C:
                    case 0x1D:
                    case 0x1E:
                    case 0x1F:
                        // characters including diacritical marks
                        if (activePositionX <= address){
                            activePositionY = (activePositionY < 0)?0:activePositionY;
                            activePositionX = address;
                            if (data >= 0x20){
                                setCharacterSets(G0andG2,pagePresentationData.G0andNOS);
                                screenAttributesArray[activePositionY][activePositionX].charcode = data;
                                screenAttributesArray[activePositionY][activePositionX].charSet = defaultG0Set;
                                screenAttributesArray[activePositionY][activePositionX].NOS = 0;
                                screenAttributesArray[activePositionY][activePositionX].diacritic = mode & 0xF;
                                screenAttributesArray[activePositionY][activePositionX].mosaics = false;
                                if (renderLevel >= 2 && activePositionY)
                                    if (!(screenAttributesArray[activePositionY-1][activePositionX].dh))
                                        screenAttributesArray[activePositionY][activePositionX].br = false;
                            }
                        }
                        break;
                }
            }
        }
        
        /* Attempt to implement double height as per the spec:
        "Where only Double Height or Double Size is invoked anywhere on a row by a non-spacing attribute the row below is not suppressed. All characters and attributes in that row continue to have their normal effect outside the area of the lower parts of the double height characters, including any characters or attributes for that row defined in the Level one page."
        "Where a row contains a mixture of spacing and non-spacing Double Height or Double Size attributes, and a spacing one is encountered before a non-spacing one, the suppression of the lower row that would normally accompany the spacing attribute only applies from the start of the row up to the first non-spacing Double Height or Double Size attribute." */
        
        for (let r = 0; r < 25; r++){
            let level1Double = false;
            let noSuppressBottom = false;
            for (let c = 0; c < 40; c++){
                if (!screenAttributesArray[r][c].br){
                    let attr = enhancementSizeArray[r][c];
                    if (level1PageArray[r][c-1] == 0x0D || level1PageArray[r][c-1] == 0x0F)
                        level1Double = true;
                    if (level1Double && (attr&0x0C))
                        noSuppressBottom = true;
                    if (attr&1)
                        screenAttributesArray[r][c].dw = true;
                    if (attr&4){
                        screenAttributesArray[r][c].dh = true; // set double height
                        screenAttributesArray[r+1][c].br = true;
                    }
                    if (attr&8)
                        screenAttributesArray[r][c].dh = false; // set normal height
                    if (attr&0x10){
                        screenAttributesArray[r][c].dw = false; // set normal width
                        screenAttributesArray[r][c].rh = false;
                    }
                    if (!(screenAttributesArray[r][c].dh) && noSuppressBottom){
                        screenAttributesArray[r+1][c].br = false;
                    }
                }
            }
        }
    }
    
    // render stuff
    let decodePage = function(){
        /* set page settings */
        newsflash = pageSettings.newsflash;
        subtitle = pageSettings.subtitle;
        suppressHeader = pageSettings.suppressHeader;
        inhibitDisplay = pageSettings.inhibitDisplay;
        
        /* set page presentation options here */
        setCharacterSets(pagePresentationData.G0andG2,pagePresentationData.G0andNOS);
        leftSidePanel = pagePresentationData.lsp;
        rightSidePanel = pagePresentationData.rsp;
        sidePanelStatusFlag = pagePresentationData.spsf;
        sidePanelColumns = pagePresentationData.cols;
        defaultScreenColour = pagePresentationData.dsc;
        defaultRowColour = pagePresentationData.drc;
        blackBackgroundColourSubstitution = pagePresentationData.bbcs;
        colourMapping = pagePresentationData.ctm;
        CLUT = pagePresentationData.clut;
        
        fullScreenColour = (renderLevel >= 2)?defaultScreenColour:0;
        
        for (let i=0; i<25; i++){
            fullRowColour[i] = (renderLevel >= 2)?defaultRowColour:0;
        }
        
        /* initialise attributes array */
        for (let r = 0; r < 26; r++){
            screenAttributesArray[r] = [];
            for (let c = 0; c < 72; c++){
                screenAttributesArray[r][c] = {switchG0:false, mosaics:false, dh:false, dw:false, br:false, rh:false, flash:0, charcode:0x20, charSet:defaultG0Set, NOS:defaultNOS, foreColour:0x07, backColour:0x20, diacritic:0, boxed:false, conceal:false, separated:false, underline:false, invert:false, bold:false, italic:false, proportional:false, drcs:false, gdrcs:false, drcsTable:0};
                // backColour 0x20 uses full row background
            }
        }
        
        /* read packets from level1PageArray and set screen attributes */
        let bottomrow = false;
        for (let r = 0; r < 26; r++){
            if (r > 0 && inhibitDisplay)
                break; // skip page rows
            if (r == 24 && !displayRow24 && !displayRow25)
                break; // don't display packet 24.
            if (r == 25 && !displayRow25)
                break; // don't display packet 25.
            /* start of row defaults go here */
            let nextforeColour = 0x07;
            let nextbackcolour;
            let backcolour = 0x20; // special black
            let nextconceal = false;
            let nextflash = 0; /* steady */
            let boxed = false;
            let startbox = 0;
            let endbox = 0;
            let nextCharsetToggle = false;
            let nextmosaics = false;
            let nextseparated = false;
            let nextdoubleheight = false;
            let nextdoublewidth = false;
            let nextdoublewidthright = false;
            let nexthold = false;
            let nextheldchar = 0x20;
            let nextheldmode = false;
            let rowhasdoubleheight = false; // reset flag
            for (let c = 0; c < 40; c++){
                let cellAttributes = screenAttributesArray[r][c];
                
                if (!bottomrow)
                {
                    let G0Set;
                    let NOS;
                    let foreColour = nextforeColour;
                    let flash = nextflash;
                    let mosaics = nextmosaics;
                    let separated = nextseparated;
                    let conceal = nextconceal;
                    let doubleheight = nextdoubleheight;
                    let doublewidth = nextdoublewidth;
                    startbox >>= 1;
                    endbox >>= 1;
                    let hold = nexthold;
                    let heldchar = nextheldchar;
                    let heldmode = nextheldmode;
                    let charsetToggle = nextCharsetToggle;
                    let charcode;
                    if (r == 0 && suppressHeader && !(pageSearch || (numberEntry && c < 6))){
                        charcode = 0x20;
                    } else {
                        charcode = level1PageArray[r][c];
                    }
                    
                    if (charcode < 0x20){
                        switch (charcode){
                            case 0x00:
                                if (renderLevel < 2)
                                    break;
                            case 0x01:
                            case 0x02:
                            case 0x03:
                            case 0x04:
                            case 0x05:
                            case 0x06:
                            case 0x07:
                                /* alphanumeric colour codes */
                                nextforeColour = charcode;
                                nextmosaics = false; /* switch off mosaics */
                                nextheldchar = 0x20; /* clear held mosaic */
                                nextheldmode = false;
                                nextconceal = false; /* switch off conceal */
                                break;
                            
                            case 0x08:
                                /* flash */
                                nextflash = 1; /* normal flash, slow rate */
                                break;
                            
                            case 0x09:
                                /* steady */
                                nextflash = 0; /* steady */
                                flash = nextflash; /* set-at */
                                break;
                            
                            case 0x0A:
                                /* end box */
                                if (endbox == 1)
                                    boxed = false;
                                endbox = 2;
                                break;
                            
                            case 0x0B:
                                /* start box */
                                if (startbox == 1)
                                    boxed = true;
                                startbox = 2;
                                break;
                            
                            case 0x0C:
                                /* normal size */
                                if (doubleheight || doublewidth){ /* size change */
                                    nextheldchar = 0x20;
                                    nextheldmode = false;
                                    heldchar = nextheldchar;
                                    heldmode = nextheldmode;
                                }
                                nextdoubleheight = false;
                                nextdoublewidth = false;
                                break;
                            
                            case 0x0D:
                                /* double height */
                                if (!doubleheight || (renderLevel >= 2 && doublewidth)){ /* size change */
                                    nextheldchar = 0x20;
                                    nextheldmode = false;
                                }
                                nextdoubleheight = true;
                                nextdoublewidth = false;
                                rowhasdoubleheight = true; // set flag for row
                                break;
                                
                            case 0x0E:
                                /* double width */
                                if (renderLevel >= 2){
                                    if (!doublewidth || doubleheight){ /* size change */
                                        nextheldchar = 0x20;
                                        nextheldmode = false;
                                    }
                                    nextdoublewidth = true;
                                    nextdoubleheight = false;
                                }
                                break;
                                
                            case 0x0F:
                                /* double size */
                                if (renderLevel >= 2){
                                    if (!doubleheight || !doublewidth){ /* size change */
                                        nextheldchar = 0x20;
                                        nextheldmode = false;
                                    }
                                    nextdoublewidth = true;
                                    nextdoubleheight = true;
                                    rowhasdoubleheight = true; // set flag for row
                                }
                                break;
                                
                            case 0x10:
                                if (renderLevel < 2)
                                    break;
                            case 0x11:
                            case 0x12:
                            case 0x13:
                            case 0x14:
                            case 0x15:
                            case 0x16:
                            case 0x17:
                                /* mosaic colour codes */
                                nextforeColour = charcode & 0x07;
                                nextmosaics = true; /* switch on mosaics */
                                nextconceal = false; /* switch off conceal */
                                break;
                                
                            case 0x18:
                                /* Conceal */
                                nextconceal = true;
                                conceal = nextconceal; // set-at
                                break;
                                
                            case 0x19:
                                /* contiguous mosaics */
                                nextseparated = false;
                                separated = nextseparated; // set-at
                                break;
                                
                            case 0x1A:
                                /* separated mosaics */
                                nextseparated = true;
                                separated = nextseparated; // set-at
                                break;
                            
                            case 0x1B:
                                /* ESC/Switch */
                                nextCharsetToggle = !nextCharsetToggle; /* toggle */
                                break;
                            
                            case 0x1C:
                                /* black background */
                                nextbackcolour = 0x20;
                                backcolour = 0x20; /* set-at */
                                break;
                            
                            case 0x1D:
                                /* new background */
                                nextbackcolour = foreColour;
                                backcolour = nextbackcolour; /* set-at */
                                break;
                                
                            case 0x1E:
                                /* hold mosaics */
                                nexthold = true;
                                hold = true; /* set-at */
                                break;
                            
                            case 0x1F:
                                /* release mosaics */
                                nexthold = false;
                                break;
                        }
                        
                        if (visibleControlChars){
                            heldchar = charcode;
                            heldmode = false; // don't underline visible control codes.
                        } else if (!hold){
                            heldchar = 0x20;
                        }
                        
                    } else if (mosaics){ /* mosaics active */
                        if (charcode & 0x20){ /* bit 6 set */
                            nextheldchar = charcode;
                            heldchar = nextheldchar;
                            nextheldmode = separated; /* save separated-ness */
                            heldmode = nextheldmode;
                        } else {
                            separated = false; // don't underline blast through 
                        }
                    } else {
                        separated = false; // don't underline alphanumerics 
                    }
                    
                    
                    if (!charsetToggle){
                        G0Set = defaultG0Set;
                        NOS = defaultNOS;
                    } else {
                        G0Set = secondG0Set;
                        NOS = secondNOS;
                    }
                
                    cellAttributes.charcode = charcode; /* copy charcode into character array */
                    cellAttributes.heldchar = heldchar;
                    cellAttributes.heldmode = heldmode;
                    cellAttributes.foreColour = (renderLevel >= 2)?foreColour+(foregroundMapping[colourMapping]*8):foreColour;
                    cellAttributes.backColour = (renderLevel >= 2)?backcolour+(backgroundMapping[colourMapping]*8):backcolour;
                    cellAttributes.mosaics = mosaics;
                    cellAttributes.switchG0 = charsetToggle;
                    cellAttributes.dh = doubleheight;
                    cellAttributes.dw = doublewidth;
                    cellAttributes.rh = false; /* this is set later when rendering */
                    cellAttributes.flash = flash;
                    cellAttributes.charSet = G0Set;
                    cellAttributes.NOS = NOS;
                    cellAttributes.boxed = boxed;
                    cellAttributes.conceal = conceal;
                    cellAttributes.separated = separated;
                }
                
                cellAttributes.br = bottomrow;
            }
            
            bottomrow = rowhasdoubleheight; // next row is a bottom row.
        }
        
        if (renderLevel >= 1){
            if (packetX26TripletArray.length){
                parsePacket26Triplets();
            }
            else if (defaultObjects[0].flag || defaultObjects[1].flag || defaultObjects[2].flag || defaultObjects[3].flag)
            {
                // TODO: apply default objects if no local enhancements
                console.log("default object present");
            }
        }
    }
    
    let redrawScreen = function(){
        for (let row = 0; row < 26; row++){
            renderRow(row);
        }
    }
    
    let renderRow = function(row){
        for (let column=0; column<72; column++){
            renderCharacter(row, column);
        }
    }
    
    let renderCharacter = function(row, column){
        let charImageData;
        let cellAttributesRowColumn = screenAttributesArray[row][column];
        let cursor;
        let r = row;
        let c = column;
        let italic = false;
        let bold = false;
        let br = cellAttributesRowColumn.br;
        
        if (c)
            if (br && screenAttributesArray[r][c].rh && !screenAttributesArray[r][c-1].br){
                screenAttributesArray[r][c].br = false;
                br = false;
                if (screenAttributesArray[r][c-1].dh){
                    screenAttributesArray[r][c].dh = true;
                    screenAttributesArray[r+1][c].br = true;
                }
            }
        
        if (br) /* bottom row of double height */
            r = row - 1;
        
        let dh = screenAttributesArray[r][column].dh;
        let dw = screenAttributesArray[r][column].dw;
        let rh = screenAttributesArray[r][column].rh;
        
        let boxed = screenAttributesArray[r][column].boxed;
        
        if (dw)
            if (rh) /* right column of double width */
                c = column - 1;
            else if (column < 39){
                screenAttributesArray[r][column+1].rh = true;
                screenAttributesArray[r][column+1].dw = true;
            }
        
        if (dw && !rh && column == 39){
            dw = false;
        }
        
        let cellAttributesRC = screenAttributesArray[r][c];
        let separated = cellAttributesRC.separated;
        let underline = cellAttributesRC.underline;
        let drcs = cellAttributesRC.drcs;
        let gdrcs = cellAttributesRC.gdrcs;
        let drcsTable = cellAttributesRC.drcsTable;

        let character = cellAttributesRC.charcode;
        let mosaicMode = cellAttributesRC.mosaics;
        
        if (gdrcs && gdrcsArray[(drcsTable*48)+character]){
            charImageData = new Uint8Array(gdrcsArray[(drcsTable*48)+character].data); // copy of character data
        } else if (drcs && drcsArray[(drcsTable*48)+character]){
            charImageData = new Uint8Array(drcsArray[(drcsTable*48)+character].data);
        } else {
            if (character < 0x20){
                character = cellAttributesRC.heldchar;
                if (character > 0x20){
                    mosaicMode = true;
                    separated = cellAttributesRC.heldmode;
                } else {
                    mosaicMode = false;
                }
            }
            
            if (!reveal && cellAttributesRC.conceal && character > 0x20){
                character = 0x20; // display spaces for concealed characters when reveal mode is not active
            }
            
            if (br && !dh){
                character = 0x20;
                underline = false;
            }
            
            let chardatay = (character & 0x0f) * 10;
            let chardatax = (character >> 4) * 12;
            let charImage;
            
            if (character < 0x20){
                if (rh){
                    charImage = charsetImageData[0][0]; // render space
                } else {
                    charImage = controlCodesImageData[character];
                    dw = false; /* don't be double width */
                }
                underline = false;
            } else {
                chardatax -= 24; /* first 32 characters not present in bitmaps */
                let charSet = cellAttributesRC.charSet;
                let NOS = cellAttributesRC.NOS;
                if (charSet < 13 && mosaicMode && (character < 0x40 || character >= 0x60)){
                    if(separated) // if mosaics and separated
                        charSet = 12; // use separated mosaics character set
                    else
                        charSet = 11; // contiguous
                }
                
                charImage = charsetImageData[charSet][character-0x20];
                if ((charSet == 0) && NOS){
                    switch (character){
                        case 0x23:
                            chardatax = 0;
                            chardatay = 0; // recalculate coordinates
                            charImage = NOSImageData[NOS-1][0];
                            break;
                        case 0x24:
                            chardatax = 0;
                            chardatay = 10;
                            charImage = NOSImageData[NOS-1][1];
                            break;
                        case 0x40:
                            chardatax = 0;
                            chardatay = 20;
                            charImage = NOSImageData[NOS-1][2];
                            break;
                        case 0x5B:
                            chardatax = 0;
                            chardatay = 30;
                            charImage = NOSImageData[NOS-1][3];
                            break;
                        case 0x5C:
                            chardatax = 0;
                            chardatay = 40;
                            charImage = NOSImageData[NOS-1][4];
                            break;
                        case 0x5D:
                            chardatax = 0;
                            chardatay = 50;
                            charImage = NOSImageData[NOS-1][5];
                            break;
                        case 0x5E:
                            chardatax = 0;
                            chardatay = 60;
                            charImage = NOSImageData[NOS-1][6];
                            break;
                        case 0x5F:
                            chardatax = 0;
                            chardatay = 70;
                            charImage = NOSImageData[NOS-1][7];
                            break;
                        case 0x60:
                            chardatax = 0;
                            chardatay = 80;
                            charImage = NOSImageData[NOS-1][8];
                            break;
                        case 0x7B:
                            chardatax = 0;
                            chardatay = 90;
                            charImage = NOSImageData[NOS-1][9];
                            break;
                        case 0x7C:
                            chardatax = 0;
                            chardatay = 100;
                            charImage = NOSImageData[NOS-1][10];
                            break;
                        case 0x7D:
                            chardatax = 0;
                            chardatay = 110;
                            charImage = NOSImageData[NOS-1][11];
                            break;
                        case 0x7E:
                            chardatax = 0;
                            chardatay = 120;
                            charImage = NOSImageData[NOS-1][12];
                            break;
                    }
                }
                    
                if (charSet > 10){
                    underline = false; // don't underline G1, G3 or DRCS characters
                } else {
                    italic = cellAttributesRC.italic;
                    bold = cellAttributesRC.bold;
                }
                
                if (cellAttributesRC.diacritic && charSet == 0 && mosaicMode == 0 && defaultG2Set == 0){
                    /* look up diacriticImageData */
                    let offset = ISO6937LUT1[cellAttributesRC.diacritic].indexOf(String.fromCharCode(character))
                    
                    if (offset > -1){
                        charImage = extraCharsData[offset + ISO6937LUT2[cellAttributesRC.diacritic]];
                    }
                }
            }

            charImageData = new Uint8Array(charImage); // copy of character data
            
            if (underline){ // extra bit for underline from non spacing attributes
                for (let i = 108; i < 120; i++){
                    charImageData[i] = 255; // add underline
                }
            }
            
            if (bold){
                let charImageDataTemp = new Uint8Array(charImageData); // copy of character data
                
                for (let py = 0; py < 10; py++){
                    for (let i = 0; i < 11; i++){
                        charImageData[py * 12 + i] = charImageData[py * 12 + i] | charImageDataTemp[py * 12 + i + 1];
                    }
                }
            }
            
            if (italic){
                for (let py = 0; py < 3; py++){
                    for (let i = 11; i >= 1; i--){
                        charImageData[py * 12 + i] = charImageData[py * 12 + i - 1];
                    }
                    charImageData[py * 12] = 0;
                }
                for (let py = 6; py < 10; py++){
                    for (let i = 0; i < 11; i++){
                        charImageData[py * 12 + i] = charImageData[py * 12 + i + 1];
                    }
                    charImageData[py * 12 + 11] = 0;
                }
            }
        }
        
        if (cursorPosition[0] == row && cursorPosition[1] == column && showCursor)
            cursor = true;
        else if (cursorPosition[0] == r && cursorPosition[1] == c && showCursor && (cellAttributesRC.dh || (cellAttributesRC.dw && !br)))
            cursor = true;
        else
            cursor = false;
        
        if ((newsflash || subtitle) && row == 0 && (pageSearch || (numberEntry && column < 6))){
            boxed = true;
        }
        
        // if bit 5 of back colour is set, this is default background
        if (cellAttributesRowColumn.backColour & 0x20 && !mixMode){
            if (blackBackgroundColourSubstitution || column > 39){
                // if background substitution on, or cell is in side panel, change colour to the fullRowColour
                cellAttributesRowColumn.backColour = fullRowColour[row];
            }
        }
        
        let foreColourNumber;
        let backColourNumber;
        
        if (cellAttributesRC.invert){ // invert colour
            foreColourNumber = cellAttributesRC.backColour;
            backColourNumber = cellAttributesRC.foreColour;
        } else {
            foreColourNumber = cellAttributesRC.foreColour;
            backColourNumber = cellAttributesRC.backColour;
        }
        
        let shiftright = 0;
        let shiftdown = 0;
        let width = 1;
        let height = 1;
        if (dw){
            width = 2;
            if (rh) /* right hand side */
                shiftright = 6;
        }
        if (dh){
            height = 2;
            if (br)
                shiftdown = 5;
        }
        
        let foreColour;
        let backColour;
        let flashforeColour;
        let flashBackColour;
        
        switch (cellAttributesRC.flash & 3){
            case 0: // steady
                foreColour = getColour(foreColourNumber, row, boxed, false);
                backColour = getColour(backColourNumber, row, boxed, false);
                flashforeColour = foreColour;
                flashBackColour = backColour;
                break;
            case 1: // normal flash to background
                foreColour = getColour(foreColourNumber, row, boxed, false);
                backColour = getColour(backColourNumber, row, boxed, false);
                flashforeColour = backColour;
                flashBackColour = backColour;
                break;
            case 2: // invert phase of flash to background colour
                flashforeColour = getColour(foreColourNumber, row, boxed, false);
                flashBackColour = getColour(backColourNumber, row, boxed, false);
                foreColour = flashBackColour;
                backColour = flashBackColour;
                break;
            case 3: // flash to corresponding colour in adjacent CLUT
                foreColour = getColour(foreColourNumber, row, boxed, false);
                backColour = getColour(backColourNumber, row, boxed, false);
                flashforeColour = getColour(foreColourNumber ^ 8, row, boxed, false);
                flashBackColour = backColour;
                break;
        }
        
        if (hideTeletext && (row || column > 5)){
            // force page transparent except number entry
            foreColour = [0,0,0,0];
            backColour = [0,0,0,0];
            flashforeColour = foreColour;
            flashBackColour = backColour;
        }
        
        
        
        let screenaddr = (row * 34560) + (column * 48); // (((row * 10) * 864) *4) + ((column * 12) * 4)
        let pr,pg,pb,pa,fr,fg,fb,fa;
        for (let py=0; py<10; py++){
            for (let px=0; px<12; px++){
                if (charImageData[((Math.floor(py / height)) + shiftdown) * 12 + Math.floor(px / width)+shiftright]){
                    pr = foreColour[0];
                    pg = foreColour[1];
                    pb = foreColour[2];
                    pa = foreColour[3];
                    fr = flashforeColour[0];
                    fg = flashforeColour[1];
                    fb = flashforeColour[2];
                    fa = flashforeColour[3];
                    if (character < 0x20 && visibleControlChars && !gdrcs && !drcs){
                        if (isColourDark(backColour[0],backColour[1],backColour[2])){
                            pr = 0xFF;
                            pb = 0xFF;
                            pg = 0xFF;
                        } else {
                            pr = 0x00;
                            pg = 0x00;
                            pb = 0x00;
                        }
                        if (isColourDark(flashBackColour[0],flashBackColour[1],flashBackColour[2])){
                            fr = 0xFF;
                            fb = 0xFF;
                            fg = 0xFF;
                        } else {
                            fr = 0x00;
                            fg = 0x00;
                            fb = 0x00;
                        }
                        pa |= 0xff;
                        fa |= 0xff;
                    }
                } else {
                    pr = backColour[0];
                    pg = backColour[1];
                    pb = backColour[2];
                    pa = backColour[3];
                    fr = flashBackColour[0];
                    fg = flashBackColour[1];
                    fb = flashBackColour[2];
                    fa = flashBackColour[3];
                }
                
                let renderGrid = showGrid && row >= firstRow && column >= firstColumn && row <= lastRow && column <= lastColumn;
                
                if (cursor || (renderGrid && (py == 0 || py == 9 || px == 0 || px == 11))){
                    if (isColourDark(pr,pg,pb)){
                        pr += 0x40;
                        pg += 0x40;
                        pb += 0x40;
                    } else {
                        pr -= 0x40;
                        pb -= 0x40;
                        pg -= 0x40;
                    }
                    
                    if (isColourDark(fr,fg,fb)){
                        fr += 0x40;
                        fb += 0x40;
                        fg += 0x40;
                    } else {
                        fr -= 0x40;
                        fg -= 0x40;
                        fb -= 0x40;
                    }
                    
                    pa = 0xff;
                    fa = 0xff;
                }
                
                flashPixelDataData[screenaddr] = fr;
                steadyPixelDataData[screenaddr++] = pr;
                flashPixelDataData[screenaddr] = fg;
                steadyPixelDataData[screenaddr++] = pg;
                flashPixelDataData[screenaddr] = fb;
                steadyPixelDataData[screenaddr++] = pb;
                flashPixelDataData[screenaddr] = fa;
                steadyPixelDataData[screenaddr++] = pa;
            }
            screenaddr += 3408; // ((864-12)*4)
        }
    }
    
    let xOffset; /* gets updated by blitScreen() */
    let scaleFactor;
    let yScaleFactor;
    let oldScaleFactor = 0;
    let oldWidth = 0;
    
    let backbufferCanvas = createCanvas();
    let backbufferCanvasContext = backbufferCanvas.getContext("2d");
    let teletextOpacity = 1;
    
    let renderSidePanels;
    let canvasWidth;
    let rightSidePanelWidth;
    let leftSidePanelWidth
    let leftBorder;
    let rightBorder;
    let rowCounter;
    
    let lastFlashTimestamp;
    let lastFrameTimestamp;
    
    let start = Date.now();
    let foo = 0;
    
    let animate = function(){
        requestAnimationFrame(animate);
        
        let now = Date.now();
        
        if (flashEnabled){
            let elapsed = (now - lastFlashTimestamp);
            if (elapsed >= (1000/6)){
                lastFlashTimestamp = now - (elapsed % (1000/6));
                flashinterval();
            }
        }
        
        if (blitScreenEnabled){
            // limit the framerate to 25fps
            let elapsed = (now - lastFrameTimestamp);
            if (elapsed >= 40){
                lastFrameTimestamp = now - (elapsed % 40);
                
                blitScreen();
            }
        }
    }
    
    function blitScreen(){
        updateFlash();
        if ((renderLevel < 2) || ((renderLevel < 3) && !sidePanelStatusFlag)){
            renderSidePanels = false;
        } else {
            renderSidePanels = leftSidePanel || rightSidePanel;
        }
        
        rightSidePanelWidth = (16 - sidePanelColumns) * 12;
        leftSidePanelWidth = (leftSidePanel && !rightSidePanel && sidePanelColumns == 0 ? 16 : sidePanelColumns) * 12;
        
        if (widescreen){
            canvasWidth = (1024 / 1.2);
        } else if ((leftSidePanel|rightSidePanel) && renderSidePanels){
            if ((leftSidePanel ? leftSidePanelWidth : 0) + (rightSidePanel ? rightSidePanelWidth : 0) + 480 > (688 / 1.2)){
                // maintain the caption safe border
                canvasWidth = ((leftSidePanel ? leftSidePanelWidth : 0) + (rightSidePanel ? rightSidePanelWidth : 0) + 480) * 768 / 688;
            } else {
                canvasWidth = (768 / 1.2);
            }
        } else {
            canvasWidth = (768 / 1.2);
        }
        
        if (renderSidePanels){
            if (leftSidePanel && rightSidePanel) {
                xOffset = Math.ceil((canvasWidth - (480 + (leftSidePanel ? leftSidePanelWidth : 0) + (rightSidePanel ? rightSidePanelWidth : 0))) / 2 + leftSidePanelWidth);
            } else if (rightSidePanel){
                xOffset = Math.ceil((canvasWidth - (480 + rightSidePanelWidth)) / 2);
            } else {
                xOffset = Math.ceil((canvasWidth - (480 + leftSidePanelWidth)) / 2 + leftSidePanelWidth);
            }
        } else {
            xOffset = Math.ceil((canvasWidth - 480) / 2);
        }
        
        leftBorder = xOffset;
        rightBorder = xOffset+480;
        
        backbufferCanvas.width = canvasWidth;
        backbufferCanvas.height = 576;
        
        backbufferCanvasContext.imageSmoothingEnabled = false; // don't smooth drawing teletext pixels
        backbufferCanvasContext.msImageSmoothingEnabled = false;
        backbufferCanvasContext.globalAlpha = teletextOpacity;
        
        if (!(newsflash || subtitle || fullScreenColour == 8 || mixMode || hideTeletext)){
            backbufferCanvasContext.fillStyle = getColourHTML(fullScreenColour);
            backbufferCanvasContext.fillRect(0,0,(1024 / 1.2),38);
            backbufferCanvasContext.fillRect(0,538,(1024 / 1.2),38);
        }
        
        if (!hideTeletext){
            for (let rowCounter=0;rowCounter<25;rowCounter++){
                if (!(newsflash || subtitle || mixMode)){
                    if (fullRowColour[rowCounter] == 8){
                        /* TODO: figure out if this code should be here
                        if (fullScreenColour != 8){
                            backbufferCanvasContext.fillStyle = getColourHTML(fullScreenColour);
                            backbufferCanvasContext.fillRect(0,rowCounter*20 + 38,leftBorder,20);
                            backbufferCanvasContext.fillRect(rightBorder,rowCounter*20 + 38,canvasWidth-rightBorder,20);
                        }*/
                    } else {
                        backbufferCanvasContext.fillStyle = getColourHTML(fullRowColour[rowCounter]);
                        backbufferCanvasContext.fillRect(0,rowCounter*20 + 38,leftBorder,20);
                        backbufferCanvasContext.fillRect(rightBorder,rowCounter*20 + 38,canvasWidth-rightBorder,20);
                    }
                }
            }
            
            switch (stretchMode){
                case 1:
                    backbufferCanvasContext.drawImage(backbufferCanvas,0,38,canvasWidth,240,0,38,canvasWidth,480);
                    break;
                case 2:
                    backbufferCanvasContext.drawImage(backbufferCanvas,0,278,canvasWidth,240,0,38,canvasWidth,480);
                    break;
            }
        }
        
        switch (stretchMode){
            default:
                backbufferCanvasContext.drawImage(characterArrayCanvas,0,0,480,240,xOffset,38,480,480);
                break;
            case 1:
                backbufferCanvasContext.drawImage(characterArrayCanvas,0,0,480,120,xOffset,38,480,480);
                break;
            case 2:
                backbufferCanvasContext.drawImage(characterArrayCanvas,0,120,480,120,xOffset,38,480,480);
        }
        backbufferCanvasContext.drawImage(characterArrayCanvas,0,240,480,10,xOffset,518,480,20);
        if (displayRow25)
            backbufferCanvasContext.drawImage(characterArrayCanvas,0,250,480,10,xOffset,538,480,20);
        
        if (renderSidePanels){
            if (leftSidePanel && leftSidePanelWidth > 0){
                /* draw left side panel */
                switch (stretchMode){
                    default:
                        backbufferCanvasContext.drawImage(characterArrayCanvas,864-leftSidePanelWidth,0,leftSidePanelWidth,240,xOffset-leftSidePanelWidth,38,leftSidePanelWidth,480);
                        break;
                    case 1:
                        backbufferCanvasContext.drawImage(characterArrayCanvas,864-leftSidePanelWidth,0,leftSidePanelWidth,120,xOffset-leftSidePanelWidth,38,leftSidePanelWidth,480);
                        break;
                    case 2:
                        backbufferCanvasContext.drawImage(characterArrayCanvas,864-leftSidePanelWidth,120,leftSidePanelWidth,120,xOffset-leftSidePanelWidth,38,leftSidePanelWidth,480);
                }
                
                leftBorder -= leftSidePanelWidth;
                backbufferCanvasContext.drawImage(characterArrayCanvas,864-leftSidePanelWidth,240,leftSidePanelWidth,10,xOffset-leftSidePanelWidth,518,leftSidePanelWidth,20);
            }
            
            if (rightSidePanel && rightSidePanelWidth > 0){
                /* draw right side panel */
                switch (stretchMode){
                    default:
                        backbufferCanvasContext.drawImage(characterArrayCanvas,480,0,rightSidePanelWidth,240,xOffset+480,38,rightSidePanelWidth,480);
                        break;
                    case 1:
                        backbufferCanvasContext.drawImage(characterArrayCanvas,480,0,rightSidePanelWidth,120,xOffset+480,38,rightSidePanelWidth,480);
                        break;
                    case 2:
                        backbufferCanvasContext.drawImage(characterArrayCanvas,480,120,rightSidePanelWidth,120,xOffset+480,38,rightSidePanelWidth,480);
                }
                backbufferCanvasContext.drawImage(characterArrayCanvas,480,240,rightSidePanelWidth,10,xOffset+480,518,rightSidePanelWidth,20);
                rightBorder += rightSidePanelWidth;
            }
        }
        
        if (screenDiv.clientHeight > 586)
            scaleFactor = Math.ceil(screenDiv.clientHeight / 586);
        else
            scaleFactor = 1;
        yScaleFactor = (widescreen?1024:768) / canvasWidth;
        
        if (scaleFactor != oldScaleFactor || oldWidth != canvasWidth){
            // only change canvas size if it is actually required
            teletextCanvas.width = yScaleFactor * scaleFactor * canvasWidth;
            teletextCanvas.height = 576 * scaleFactor;
            teletextCanvasContext.scale(yScaleFactor * scaleFactor, scaleFactor);
            oldWidth = canvasWidth;
            oldScaleFactor = scaleFactor
        }
        
        teletextCanvasContext.imageSmoothingEnabled = true; // smooth the final write to the canvas
        teletextCanvasContext.msImageSmoothingEnabled = true;
        teletextCanvasContext.drawImage(backgroundCanvas,0,0,backgroundCanvas.width,backgroundCanvas.height,0,0,canvasWidth,576);
        teletextCanvasContext.drawImage(backbufferCanvas,0,0,canvasWidth,576);
        
        if(disableBlitScreen)
            blitScreenEnabled = false;
    }
    
    /* ------------------- initialise renderer ----------------------- */
    let teletextCanvasContext = teletextCanvas.getContext("2d");
    teletextCanvasContext.scale(2,2);
    
    initCharsetData();
    
    initializeLevel1PageArray();
    resetPresentationData();
    resetPOPArrays();
    resetDRCSArrays();
    
    cursorPosition[0] = 0;
    cursorPosition[1] = 0;
    
    /* create backbuffer canvas */
    let characterArrayCanvas = createCanvas(864,260);
    let characterArrayCanvasContext = characterArrayCanvas.getContext("2d");
    
    /* backbuffer for flashing */
    let flashOnCanvas = createCanvas(864,260);
    let flashOnCanvasContext = flashOnCanvas.getContext("2d");

    let steadyPixelData = characterArrayCanvasContext.createImageData(864, 260);
    let steadyPixelDataData = steadyPixelData.data;
    let flashPixelData = flashOnCanvasContext.createImageData(864, 260);
    let flashPixelDataData = flashPixelData.data;
    
    hideTeletext = false;
    numberEntry = false;
    pageSearch = false;
    
    decodePage(); // must call decodePage to set the page presentation variables before any functions try to access them!
    redrawScreen();
    
    let blitScreenEnabled = true;
    let disableBlitScreen = false;
    
    flashEnabled = true;
    
    // initialise timers
    lastFrameTimestamp = Date.now();
    lastFlashTimestamp = Date.now();
    
    if (typeof requestAnimationFrame !== 'undefined')
        requestAnimationFrame(animate); // start updating display (not in nodejs)
    
    /* ---------------------- public functions and variables ------------------ */
    this.level1PageArray = level1PageArray;
    this.packetX26TripletArray = packetX26TripletArray;
    this.pagePresentationData = pagePresentationData;
    this.pageSettings = pageSettings;
    this.gdrcsArray = gdrcsArray;
    this.drcsArray = drcsArray;
    this.gpopArray = gpopArray;
    this.popArray = popArray;
    this.defaultObjects = defaultObjects;
    
    this.initializeLevel1PageArray = initializeLevel1PageArray;
    this.resetPresentationData = resetPresentationData;
    this.resetDRCSArrays = resetDRCSArrays;
    this.resetPOPArrays = resetPOPArrays;
    this.decodePage = decodePage;
    this.redrawScreen = redrawScreen;
    
    this.enable = function(val){
        if (val === true){
            blitScreenEnabled = true;
            disableBlitScreen = false;
        } else {
            disableBlitScreen = true;
        }
    }
    
    this.setWidescreen = function(val){widescreen = val;}
    this.setRenderLevel = function(val){renderLevel = val;}
    this.setReveal = function(val){reveal = val;}
    this.setMixMode = function(val){if (mixMode != val){mixMode = val; decodePage(); redrawScreen();};}
    this.setStretchMode = function(val){stretchMode = val;}
    
    /* make 1Hz flash rate have 2:1 ratio instead of 50% duty cycle */
    this.setUnevenFlashRatio = function(val){flashPhasesLUT[0] = (val)?0x30:0x38; };
    
    this.setDisplayRow24 = function(val){displayRow24 = val;}
    this.setDisplayRow25 = function(val){displayRow25 = val;}
    
    this.getDefaultCLUTEntry = function(i){return defaultCLUT[i];}
    
    /* ----------- deep hooks into renderer internals for page editor --------- */
    this.getSwitch = function(r,c){return screenAttributesArray[r][c].switchG0;}
    this.getMosaics = function(r,c){return screenAttributesArray[r][c].mosaics;}
    this.getDoubleSize = function(r,c){let obj = screenAttributesArray[r][c]; return obj.dh?1:0|obj.dw?2:0|obj.br?4:0|obj.rh?8:0; }
    this.getTeletextCanvas = function(){return teletextCanvas;}
    this.getBackbufferCanvas = function(){return backbufferCanvas;}
    this.getCharacterArrayCanvas = function(){return characterArrayCanvas;}
    this.setTeletextOpacity = function(val){teletextOpacity = val};
    this.getYScaleFactor = function(){return yScaleFactor;}
    this.getScaleFactor = function(){return scaleFactor;}
    this.getXOffset = function(){return xOffset;}
    this.getDefaultG0Set = function(){ return defaultG0Set; }
    this.getDefaultNOS = function(){ return defaultNOS; }
    this.getSecondG0Set = function(){ return secondG0Set; }
    this.getSecondNOS = function(){ return secondNOS; }
    this.getColour = getColour;
    this.getColourHTML = getColourHTML;
    this.isColourDark = isColourDark;
    this.getForegroundMapping = function(i){return foregroundMapping[i];}
    this.getBackgroundMapping = function(i){return backgroundMapping[i];}
    this.setBounds = function(a,b,c,d){firstRow = a; firstColumn = b; lastRow = c; lastColumn = d;}
    this.setShowGrid = function(val){showGrid = val;}
    this.setShowCursor = function(val){showCursor = val;}
    this.setVisibleControlChars = function(val){visibleControlChars = val;}
    this.moveCursor = moveCursor;
    this.getCursorX = function(){return cursorPosition[1];}
    this.getCursorY = function(){return cursorPosition[0];}
    this.setCursorX = function(val){cursorPosition[1] = val;}
    this.setCursorY = function(val){cursorPosition[0] = val;}
    this.blitScreen = blitScreen;
    this.updateFlash = updateFlash;
    this.setFlashOn = function(val){flashEnabled = val;}
    this.setFlashphase = function(val){flashphase = val;}
    this.renderRow = renderRow;
    this.immediateWriteSteadyPixelData = function(){characterArrayCanvasContext.putImageData(steadyPixelData,0,0);}
    
    /* for teletext viewer/tv emulator */
    this.screenAttributesArray = screenAttributesArray; // raw access to the screen array
    this.enableSidePanels = function(val){leftSidePanel = val; rightSidePanel = val; sidePanelColumns = 8} // enable or disable equal side panels
    this.hideTeletext = function(val){hideTeletext = val; redrawScreen();}
    this.numberEntry = function(val){numberEntry = val;}
    this.pageSearch = function(val){pageSearch = val;}
    this.resetPageSettings = function(){newsflash = false; subtitle = false; suppressHeader = false; inhibitDisplay = false;}
}

/* embed chardata.png data */
chardataImage.src = "data:image/png;base64,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"
