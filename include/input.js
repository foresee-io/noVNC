/*
 * noVNC: HTML5 VNC client
 * Copyright (C) 2012 Joel Martin
 * Licensed under MPL 2.0 or any later version (see LICENSE.txt)
 */

/*jslint browser: true, white: false, bitwise: false */
/*global window, Util */


//
// Keyboard event handler
//

function Keyboard(defaults) {
"use strict";

var that           = {},  // Public API methods
    conf           = {},  // Configuration attributes

    keyDownList    = [];         // List of depressed keys 
                                 // (even if they are happy)

// Configuration attributes
Util.conf_defaults(conf, that, defaults, [
    ['target',      'wo', 'dom',  document, 'DOM element that captures keyboard input'],
    ['focused',     'rw', 'bool', true, 'Capture and send key events'],

    ['onKeyPress',  'rw', 'func', null, 'Handler for key press/release']
    ]);


// 
// Private functions
//

// From the event keyCode return the keysym value for keys that need
// to be suppressed otherwise they may trigger unintended browser
// actions
function getKeysymSpecial(evt) {
    var keysym = null;

    switch ( evt.keyCode ) {
        // These generate a keyDown and keyPress in Firefox and Opera
        case 8         : keysym = 0xFF08; break; // BACKSPACE
        case 13        : keysym = 0xFF0D; break; // ENTER

        // This generates a keyDown and keyPress in Opera
        case 9         : keysym = 0xFF09; break; // TAB
        default        :                  break;
    }

    if (evt.type === 'keydown') {
        switch ( evt.keyCode ) {
            case 27        : keysym = 0xFF1B; break; // ESCAPE
            case 46        : keysym = 0xFFFF; break; // DELETE

            case 36        : keysym = 0xFF50; break; // HOME
            case 35        : keysym = 0xFF57; break; // END
            case 33        : keysym = 0xFF55; break; // PAGE_UP
            case 34        : keysym = 0xFF56; break; // PAGE_DOWN
            case 45        : keysym = 0xFF63; break; // INSERT
                                                     // '-' during keyPress
            case 37        : keysym = 0xFF51; break; // LEFT
            case 38        : keysym = 0xFF52; break; // UP
            case 39        : keysym = 0xFF53; break; // RIGHT
            case 40        : keysym = 0xFF54; break; // DOWN
            case 16        : keysym = 0xFFE1; break; // SHIFT
            case 17        : keysym = 0xFFE3; break; // CONTROL
            //case 18        : keysym = 0xFFE7; break; // Left Meta (Mac Option)
            case 18        : keysym = 0xFFE9; break; // Left ALT (Mac Command)

            case 112       : keysym = 0xFFBE; break; // F1
            case 113       : keysym = 0xFFBF; break; // F2
            case 114       : keysym = 0xFFC0; break; // F3
            case 115       : keysym = 0xFFC1; break; // F4
            case 116       : keysym = 0xFFC2; break; // F5
            case 117       : keysym = 0xFFC3; break; // F6
            case 118       : keysym = 0xFFC4; break; // F7
            case 119       : keysym = 0xFFC5; break; // F8
            case 120       : keysym = 0xFFC6; break; // F9
            case 121       : keysym = 0xFFC7; break; // F10
            case 122       : keysym = 0xFFC8; break; // F11
            case 123       : keysym = 0xFFC9; break; // F12

            case 225       : keysym = 0xFE03; break; // AltGr
            case 91       : keysym = 0xFFEC; break; // Super_R (Win Key)
            case 93       : keysym = 0xFF67; break; // Menu (Win Menu)

            default        :                  break;
        }
    }

    if ((!keysym) && (evt.ctrlKey || evt.altKey)) {
        if ((typeof(evt.which) !== "undefined") && (evt.which > 0)) {
            keysym = evt.which;
        } else {
            // IE9 always
            // Firefox and Opera when ctrl/alt + special
            Util.Warn("which not set, using keyCode");
            keysym = evt.keyCode;
        }

        /* Remap symbols */
        switch (keysym) {
            case 186       : keysym = 59; break; // ;  (IE)
            case 187       : keysym = 61; break; // =  (IE)
            case 188       : keysym = 44; break; // ,  (Mozilla, IE)
            case 109       :                     // -  (Mozilla, Opera)
                if (Util.Engine.gecko || Util.Engine.presto) {
                            keysym = 45; }
                                        break;
            case 173       :                     // -  (Mozilla)
                if (Util.Engine.gecko) {
                            keysym = 45; }
                                        break;
            case 189       : keysym = 45; break; // -  (IE)
            case 190       : keysym = 46; break; // .  (Mozilla, IE)
            case 191       : keysym = 47; break; // /  (Mozilla, IE)
            case 192       : keysym = 96; break; // `  (Mozilla, IE)
            case 219       : keysym = 91; break; // [  (Mozilla, IE)
            case 220       : keysym = 92; break; // \  (Mozilla, IE)
            case 221       : keysym = 93; break; // ]  (Mozilla, IE)
            case 222       : keysym = 39; break; // '  (Mozilla, IE)
        }
        
        /* Remap shifted and unshifted keys */
        if (!!evt.shiftKey) {
            switch (keysym) {
                case 48        : keysym = 41 ; break; // )  (shifted 0)
                case 49        : keysym = 33 ; break; // !  (shifted 1)
                case 50        : keysym = 64 ; break; // @  (shifted 2)
                case 51        : keysym = 35 ; break; // #  (shifted 3)
                case 52        : keysym = 36 ; break; // $  (shifted 4)
                case 53        : keysym = 37 ; break; // %  (shifted 5)
                case 54        : keysym = 94 ; break; // ^  (shifted 6)
                case 55        : keysym = 38 ; break; // &  (shifted 7)
                case 56        : keysym = 42 ; break; // *  (shifted 8)
                case 57        : keysym = 40 ; break; // (  (shifted 9)

                case 59        : keysym = 58 ; break; // :  (shifted `)
                case 61        : keysym = 43 ; break; // +  (shifted ;)
                case 44        : keysym = 60 ; break; // <  (shifted ,)
                case 45        : keysym = 95 ; break; // _  (shifted -)
                case 46        : keysym = 62 ; break; // >  (shifted .)
                case 47        : keysym = 63 ; break; // ?  (shifted /)
                case 96        : keysym = 126; break; // ~  (shifted `)
                case 91        : keysym = 123; break; // {  (shifted [)
                case 92        : keysym = 124; break; // |  (shifted \)
                case 93        : keysym = 125; break; // }  (shifted ])
                case 39        : keysym = 34 ; break; // "  (shifted ')
            }
        } else if ((keysym >= 65) && (keysym <=90)) {
            /* Remap unshifted A-Z */
            keysym += 32;
        } else if (evt.keyLocation === 3) {
            // numpad keys
            switch (keysym) {
                case 96 : keysym = 48; break; // 0
                case 97 : keysym = 49; break; // 1
                case 98 : keysym = 50; break; // 2
                case 99 : keysym = 51; break; // 3
                case 100: keysym = 52; break; // 4
                case 101: keysym = 53; break; // 5
                case 102: keysym = 54; break; // 6
                case 103: keysym = 55; break; // 7
                case 104: keysym = 56; break; // 8
                case 105: keysym = 57; break; // 9
                case 109: keysym = 45; break; // -
                case 110: keysym = 46; break; // .
                case 111: keysym = 47; break; // /
            }
        }
    }

    return keysym;
}

/* Translate DOM keyPress event to keysym value */
function getKeysym(evt) {
    var keysym, msg;

    if (typeof(evt.which) !== "undefined") {
        // WebKit, Firefox, Opera
        keysym = evt.which;
    } else {
        // IE9
        Util.Warn("which not set, using keyCode");
        keysym = evt.keyCode;
    }

    if ((keysym > 255) && (keysym < 0xFF00)) {
        msg = "Mapping character code " + keysym;
        // Map Unicode outside Latin 1 to X11 keysyms
        keysym = unicodeTable[keysym];
        if (typeof(keysym) === 'undefined') {
           keysym = 0; 
        }
        Util.Debug(msg + " to " + keysym);
    }

    return keysym;
}

function show_keyDownList(kind) {
    var c;
    var msg = "keyDownList (" + kind + "):\n";
    for (c = 0; c < keyDownList.length; c++) {
        msg = msg + "    " + c + " - keyCode: " + keyDownList[c].keyCode +
              " - which: " + keyDownList[c].which + "\n";
    }
    Util.Debug(msg);
}

function copyKeyEvent(evt) {
    var members = ['type', 'keyCode', 'charCode', 'which',
                   'altKey', 'ctrlKey', 'shiftKey',
                   'keyLocation', 'keyIdentifier'], i, obj = {};
    for (i = 0; i < members.length; i++) {
        if (typeof(evt[members[i]]) !== "undefined") {
            obj[members[i]] = evt[members[i]];
        }
    }
    return obj;
}

function pushKeyEvent(fevt) {
    keyDownList.push(fevt);
}

function getKeyEvent(keyCode, pop) {
    var i, fevt = null;
    for (i = keyDownList.length-1; i >= 0; i--) {
        if (keyDownList[i].keyCode === keyCode) {
            if ((typeof(pop) !== "undefined") && (pop)) {
                fevt = keyDownList.splice(i, 1)[0];
            } else {
                fevt = keyDownList[i];
            }
            break;
        }
    }
    return fevt;
}

function ignoreKeyEvent(evt) {
    // Blarg. Some keys have a different keyCode on keyDown vs keyUp
    if (evt.keyCode === 229) {
        // French AZERTY keyboard dead key.
        // Lame thing is that the respective keyUp is 219 so we can't
        // properly ignore the keyUp event
        return true;
    }
    return false;
}


//
// Key Event Handling:
//
// There are several challenges when dealing with key events:
//   - The meaning and use of keyCode, charCode and which depends on
//     both the browser and the event type (keyDown/Up vs keyPress).
//   - We cannot automatically determine the keyboard layout
//   - The keyDown and keyUp events have a keyCode value that has not
//     been translated by modifier keys.
//   - The keyPress event has a translated (for layout and modifiers)
//     character code but the attribute containing it differs. keyCode
//     contains the translated value in WebKit (Chrome/Safari), Opera
//     11 and IE9. charCode contains the value in WebKit and Firefox.
//     The which attribute contains the value on WebKit, Firefox and
//     Opera 11.
//   - The keyDown/Up keyCode value indicates (sort of) the physical
//     key was pressed but only for standard US layout. On a US
//     keyboard, the '-' and '_' characters are on the same key and
//     generate a keyCode value of 189. But on an AZERTY keyboard even
//     though they are different physical keys they both still
//     generate a keyCode of 189!
//   - To prevent a key event from propagating to the browser and
//     causing unwanted default actions (such as closing a tab,
//     opening a menu, shifting focus, etc) we must suppress this
//     event in both keyDown and keyPress because not all key strokes
//     generate on a keyPress event. Also, in WebKit and IE9
//     suppressing the keyDown prevents a keyPress but other browsers
//     still generated a keyPress even if keyDown is suppressed.
//
// For safe key events, we wait until the keyPress event before
// reporting a key down event. For unsafe key events, we report a key
// down event when the keyDown event fires and we suppress any further
// actions (including keyPress).
//
// In order to report a key up event that matches what we reported
// for the key down event, we keep a list of keys that are currently
// down. When the keyDown event happens, we add the key event to the
// list. If it is a safe key event, then we update the which attribute
// in the most recent item on the list when we received a keyPress
// event (keyPress should immediately follow keyDown). When we
// received a keyUp event we search for the event on the list with
// a matching keyCode and we report the character code using the value
// in the 'which' attribute that was stored with that key.
//

function onKeyDown(e) {
    if (! conf.focused) {
        return true;
    }
    var fevt = null, evt = (e ? e : window.event),
        keysym = null, suppress = false;
    //Util.Debug("onKeyDown kC:" + evt.keyCode + " cC:" + evt.charCode + " w:" + evt.which);

    fevt = copyKeyEvent(evt);

    keysym = getKeysymSpecial(evt);
    // Save keysym decoding for use in keyUp
    fevt.keysym = keysym;
    if (keysym) {
        // If it is a key or key combination that might trigger
        // browser behaviors or it has no corresponding keyPress
        // event, then send it immediately
        if (conf.onKeyPress && !ignoreKeyEvent(evt)) {
            Util.Debug("onKeyPress down, keysym: " + keysym +
                   " (onKeyDown key: " + evt.keyCode +
                   ", which: " + evt.which + ")");
            conf.onKeyPress(keysym, 1, evt);
        }
        suppress = true;
    }

    if (! ignoreKeyEvent(evt)) {
        // Add it to the list of depressed keys
        pushKeyEvent(fevt);
        //show_keyDownList('down');
    }

    if (suppress) {
        // Suppress bubbling/default actions
        Util.stopEvent(e);
        return false;
    } else {
        // Allow the event to bubble and become a keyPress event which
        // will have the character code translated
        return true;
    }
}

function onKeyPress(e) {
    if (! conf.focused) {
        return true;
    }
    var evt = (e ? e : window.event),
        kdlen = keyDownList.length, keysym = null;
    //Util.Debug("onKeyPress kC:" + evt.keyCode + " cC:" + evt.charCode + " w:" + evt.which);
    
    if (((evt.which !== "undefined") && (evt.which === 0)) ||
        (getKeysymSpecial(evt))) {
        // Firefox and Opera generate a keyPress event even if keyDown
        // is suppressed. But the keys we want to suppress will have
        // either:
        //     - the which attribute set to 0
        //     - getKeysymSpecial() will identify it
        Util.Debug("Ignoring special key in keyPress");
        Util.stopEvent(e);
        return false;
    }

    keysym = getKeysym(evt);

    // Modify the the which attribute in the depressed keys list so
    // that the keyUp event will be able to have the character code
    // translation available.
    if (kdlen > 0) {
        keyDownList[kdlen-1].keysym = keysym;
    } else {
        Util.Warn("keyDownList empty when keyPress triggered");
    }

    //show_keyDownList('press');
    
    // Send the translated keysym
    if (conf.onKeyPress && (keysym > 0)) {
        Util.Debug("onKeyPress down, keysym: " + keysym +
                   " (onKeyPress key: " + evt.keyCode +
                   ", which: " + evt.which + ")");
        conf.onKeyPress(keysym, 1, evt);
    }

    // Stop keypress events just in case
    Util.stopEvent(e);
    return false;
}

function onKeyUp(e) {
    if (! conf.focused) {
        return true;
    }
    var fevt = null, evt = (e ? e : window.event), keysym;
    //Util.Debug("onKeyUp   kC:" + evt.keyCode + " cC:" + evt.charCode + " w:" + evt.which);

    fevt = getKeyEvent(evt.keyCode, true);
    
    if (fevt) {
        keysym = fevt.keysym;
    } else {
        Util.Warn("Key event (keyCode = " + evt.keyCode +
                ") not found on keyDownList");
        keysym = 0;
    }

    //show_keyDownList('up');

    if (conf.onKeyPress && (keysym > 0)) {
        //Util.Debug("keyPress up,   keysym: " + keysym +
        //        " (key: " + evt.keyCode + ", which: " + evt.which + ")");
        Util.Debug("onKeyPress up, keysym: " + keysym +
                   " (onKeyPress key: " + evt.keyCode +
                   ", which: " + evt.which + ")");
        conf.onKeyPress(keysym, 0, evt);
    }
    Util.stopEvent(e);
    return false;
}

function allKeysUp() {
    Util.Debug(">> Keyboard.allKeysUp");
    if (keyDownList.length > 0) {
        Util.Info("Releasing pressed/down keys");
    }
    var i, keysym, fevt = null;
    for (i = keyDownList.length-1; i >= 0; i--) {
        fevt = keyDownList.splice(i, 1)[0];
        keysym = fevt.keysym;
        if (conf.onKeyPress && (keysym > 0)) {
            Util.Debug("allKeysUp, keysym: " + keysym +
                    " (keyCode: " + fevt.keyCode +
                    ", which: " + fevt.which + ")");
            conf.onKeyPress(keysym, 0, fevt);
        }
    }
    Util.Debug("<< Keyboard.allKeysUp");
    return;
}

//
// Public API interface functions
//

that.grab = function() {
    //Util.Debug(">> Keyboard.grab");
    var c = conf.target;

    Util.addEvent(c, 'keydown', onKeyDown);
    Util.addEvent(c, 'keyup', onKeyUp);
    Util.addEvent(c, 'keypress', onKeyPress);

    // Release (key up) if window loses focus
    Util.addEvent(window, 'blur', allKeysUp);

    //Util.Debug("<< Keyboard.grab");
};

that.ungrab = function() {
    //Util.Debug(">> Keyboard.ungrab");
    var c = conf.target;

    Util.removeEvent(c, 'keydown', onKeyDown);
    Util.removeEvent(c, 'keyup', onKeyUp);
    Util.removeEvent(c, 'keypress', onKeyPress);
    Util.removeEvent(window, 'blur', allKeysUp);

    // Release (key up) all keys that are in a down state
    allKeysUp();

    //Util.Debug(">> Keyboard.ungrab");
};

return that;  // Return the public API interface

}  // End of Keyboard()


//
// Mouse event handler
//

function Mouse(defaults) {
"use strict";

var that           = {},  // Public API methods
    conf           = {};  // Configuration attributes

// Configuration attributes
Util.conf_defaults(conf, that, defaults, [
    ['target',         'ro', 'dom',  document, 'DOM element that captures mouse input'],
    ['focused',        'rw', 'bool', true, 'Capture and send mouse clicks/movement'],
    ['scale',          'rw', 'float', 1.0, 'Viewport scale factor 0.0 - 1.0'],

    ['onMouseButton',  'rw', 'func', null, 'Handler for mouse button click/release'],
    ['onMouseMove',    'rw', 'func', null, 'Handler for mouse movement'],
    ['touchButton',    'rw', 'int', 1, 'Button mask (1, 2, 4) for touch devices (0 means ignore clicks)']
    ]);


// 
// Private functions
//

function onMouseButton(e, down) {
    var evt, pos, bmask;
    if (! conf.focused) {
        return true;
    }
    evt = (e ? e : window.event);
    pos = Util.getEventPosition(e, conf.target, conf.scale);
    if (e.touches || e.changedTouches) {
        // Touch device
        bmask = conf.touchButton;
        // If bmask is set
    } else if (evt.which) {
        /* everything except IE */
        bmask = 1 << evt.button;
    } else {
        /* IE including 9 */
        bmask = (evt.button & 0x1) +      // Left
                (evt.button & 0x2) * 2 +  // Right
                (evt.button & 0x4) / 2;   // Middle
    }
    //Util.Debug("mouse " + pos.x + "," + pos.y + " down: " + down +
    //           " bmask: " + bmask + "(evt.button: " + evt.button + ")");
    if (bmask > 0 && conf.onMouseButton) {
        Util.Debug("onMouseButton " + (down ? "down" : "up") +
                   ", x: " + pos.x + ", y: " + pos.y + ", bmask: " + bmask);
        conf.onMouseButton(pos.x, pos.y, down, bmask);
    }
    Util.stopEvent(e);
    return false;
}

function onMouseDown(e) {
    onMouseButton(e, 1);
}

function onMouseUp(e) {
    onMouseButton(e, 0);
}

function onMouseWheel(e) {
    var evt, pos, bmask, wheelData;
    if (! conf.focused) {
        return true;
    }
    evt = (e ? e : window.event);
    pos = Util.getEventPosition(e, conf.target, conf.scale);
    wheelData = evt.detail ? evt.detail * -1 : evt.wheelDelta / 40;
    if (wheelData > 0) {
        bmask = 1 << 3;
    } else {
        bmask = 1 << 4;
    }
    //Util.Debug('mouse scroll by ' + wheelData + ':' + pos.x + "," + pos.y);
    if (conf.onMouseButton) {
        conf.onMouseButton(pos.x, pos.y, 1, bmask);
        conf.onMouseButton(pos.x, pos.y, 0, bmask);
    }
    Util.stopEvent(e);
    return false;
}

function onMouseMove(e) {
    var evt, pos;
    if (! conf.focused) {
        return true;
    }
    evt = (e ? e : window.event);
    pos = Util.getEventPosition(e, conf.target, conf.scale);
    //Util.Debug('mouse ' + evt.which + '/' + evt.button + ' up:' + pos.x + "," + pos.y);
    if (conf.onMouseMove) {
        conf.onMouseMove(pos.x, pos.y);
    }
    Util.stopEvent(e);
    return false;
}

function onMouseDisable(e) {
    var evt, pos;
    if (! conf.focused) {
        return true;
    }
    evt = (e ? e : window.event);
    pos = Util.getEventPosition(e, conf.target, conf.scale);
    /* Stop propagation if inside canvas area */
    if ((pos.x >= 0) && (pos.y >= 0) &&
        (pos.x < conf.target.offsetWidth) &&
        (pos.y < conf.target.offsetHeight)) {
        //Util.Debug("mouse event disabled");
        Util.stopEvent(e);
        return false;
    }
    //Util.Debug("mouse event not disabled");
    return true;
}

//
// Public API interface functions
//

that.grab = function() {
    //Util.Debug(">> Mouse.grab");
    var c = conf.target;

    if ('ontouchstart' in document.documentElement) {
        Util.addEvent(c, 'touchstart', onMouseDown);
        Util.addEvent(window, 'touchend', onMouseUp);
        Util.addEvent(c, 'touchmove', onMouseMove);
    } else {
        Util.addEvent(c, 'mousedown', onMouseDown);
        Util.addEvent(window, 'mouseup', onMouseUp);
        Util.addEvent(c, 'mousemove', onMouseMove);
        Util.addEvent(c, 'mouseout', onMouseMove);
        Util.addEvent(c, (Util.Engine.gecko) ? 'DOMMouseScroll' : 'mousewheel',
                onMouseWheel);
    }

    /* Work around right and middle click browser behaviors */
    Util.addEvent(document, 'click', onMouseDisable);
    Util.addEvent(document.body, 'contextmenu', onMouseDisable);

    //Util.Debug("<< Mouse.grab");
};

that.ungrab = function() {
    //Util.Debug(">> Mouse.ungrab");
    var c = conf.target;

    if ('ontouchstart' in document.documentElement) {
        Util.removeEvent(c, 'touchstart', onMouseDown);
        Util.removeEvent(window, 'touchend', onMouseUp);
        Util.removeEvent(c, 'touchmove', onMouseMove);
    } else {
        Util.removeEvent(c, 'mousedown', onMouseDown);
        Util.removeEvent(window, 'mouseup', onMouseUp);
        Util.removeEvent(c, 'mousemove', onMouseMove);
        Util.removeEvent(c, 'mouseout', onMouseUp);
        Util.removeEvent(c, (Util.Engine.gecko) ? 'DOMMouseScroll' : 'mousewheel',
                onMouseWheel);
    }

    /* Work around right and middle click browser behaviors */
    Util.removeEvent(document, 'click', onMouseDisable);
    Util.removeEvent(document.body, 'contextmenu', onMouseDisable);

    //Util.Debug(">> Mouse.ungrab");
};

return that;  // Return the public API interface

}  // End of Mouse()


/*
 * Browser keypress to X11 keysym for Unicode characters > U+00FF
 */
unicodeTable = {
    0x0104 : 0x01a1,
    0x02D8 : 0x01a2,
    0x0141 : 0x01a3,
    0x013D : 0x01a5,
    0x015A : 0x01a6,
    0x0160 : 0x01a9,
    0x015E : 0x01aa,
    0x0164 : 0x01ab,
    0x0179 : 0x01ac,
    0x017D : 0x01ae,
    0x017B : 0x01af,
    0x0105 : 0x01b1,
    0x02DB : 0x01b2,
    0x0142 : 0x01b3,
    0x013E : 0x01b5,
    0x015B : 0x01b6,
    0x02C7 : 0x01b7,
    0x0161 : 0x01b9,
    0x015F : 0x01ba,
    0x0165 : 0x01bb,
    0x017A : 0x01bc,
    0x02DD : 0x01bd,
    0x017E : 0x01be,
    0x017C : 0x01bf,
    0x0154 : 0x01c0,
    0x0102 : 0x01c3,
    0x0139 : 0x01c5,
    0x0106 : 0x01c6,
    0x010C : 0x01c8,
    0x0118 : 0x01ca,
    0x011A : 0x01cc,
    0x010E : 0x01cf,
    0x0110 : 0x01d0,
    0x0143 : 0x01d1,
    0x0147 : 0x01d2,
    0x0150 : 0x01d5,
    0x0158 : 0x01d8,
    0x016E : 0x01d9,
    0x0170 : 0x01db,
    0x0162 : 0x01de,
    0x0155 : 0x01e0,
    0x0103 : 0x01e3,
    0x013A : 0x01e5,
    0x0107 : 0x01e6,
    0x010D : 0x01e8,
    0x0119 : 0x01ea,
    0x011B : 0x01ec,
    0x010F : 0x01ef,
    0x0111 : 0x01f0,
    0x0144 : 0x01f1,
    0x0148 : 0x01f2,
    0x0151 : 0x01f5,
    0x0171 : 0x01fb,
    0x0159 : 0x01f8,
    0x016F : 0x01f9,
    0x0163 : 0x01fe,
    0x02D9 : 0x01ff,
    0x0126 : 0x02a1,
    0x0124 : 0x02a6,
    0x0130 : 0x02a9,
    0x011E : 0x02ab,
    0x0134 : 0x02ac,
    0x0127 : 0x02b1,
    0x0125 : 0x02b6,
    0x0131 : 0x02b9,
    0x011F : 0x02bb,
    0x0135 : 0x02bc,
    0x010A : 0x02c5,
    0x0108 : 0x02c6,
    0x0120 : 0x02d5,
    0x011C : 0x02d8,
    0x016C : 0x02dd,
    0x015C : 0x02de,
    0x010B : 0x02e5,
    0x0109 : 0x02e6,
    0x0121 : 0x02f5,
    0x011D : 0x02f8,
    0x016D : 0x02fd,
    0x015D : 0x02fe,
    0x0138 : 0x03a2,
    0x0156 : 0x03a3,
    0x0128 : 0x03a5,
    0x013B : 0x03a6,
    0x0112 : 0x03aa,
    0x0122 : 0x03ab,
    0x0166 : 0x03ac,
    0x0157 : 0x03b3,
    0x0129 : 0x03b5,
    0x013C : 0x03b6,
    0x0113 : 0x03ba,
    0x0123 : 0x03bb,
    0x0167 : 0x03bc,
    0x014A : 0x03bd,
    0x014B : 0x03bf,
    0x0100 : 0x03c0,
    0x012E : 0x03c7,
    0x0116 : 0x03cc,
    0x012A : 0x03cf,
    0x0145 : 0x03d1,
    0x014C : 0x03d2,
    0x0136 : 0x03d3,
    0x0172 : 0x03d9,
    0x0168 : 0x03dd,
    0x016A : 0x03de,
    0x0101 : 0x03e0,
    0x012F : 0x03e7,
    0x0117 : 0x03ec,
    0x012B : 0x03ef,
    0x0146 : 0x03f1,
    0x014D : 0x03f2,
    0x0137 : 0x03f3,
    0x0173 : 0x03f9,
    0x0169 : 0x03fd,
    0x016B : 0x03fe,
    0x1E02 : 0x1001e02,
    0x1E03 : 0x1001e03,
    0x1E0A : 0x1001e0a,
    0x1E80 : 0x1001e80,
    0x1E82 : 0x1001e82,
    0x1E0B : 0x1001e0b,
    0x1EF2 : 0x1001ef2,
    0x1E1E : 0x1001e1e,
    0x1E1F : 0x1001e1f,
    0x1E40 : 0x1001e40,
    0x1E41 : 0x1001e41,
    0x1E56 : 0x1001e56,
    0x1E81 : 0x1001e81,
    0x1E57 : 0x1001e57,
    0x1E83 : 0x1001e83,
    0x1E60 : 0x1001e60,
    0x1EF3 : 0x1001ef3,
    0x1E84 : 0x1001e84,
    0x1E85 : 0x1001e85,
    0x1E61 : 0x1001e61,
    0x0174 : 0x1000174,
    0x1E6A : 0x1001e6a,
    0x0176 : 0x1000176,
    0x0175 : 0x1000175,
    0x1E6B : 0x1001e6b,
    0x0177 : 0x1000177,
    0x0152 : 0x13bc,
    0x0153 : 0x13bd,
    0x0178 : 0x13be,
    0x203E : 0x047e,
    0x3002 : 0x04a1,
    0x300C : 0x04a2,
    0x300D : 0x04a3,
    0x3001 : 0x04a4,
    0x30FB : 0x04a5,
    0x30F2 : 0x04a6,
    0x30A1 : 0x04a7,
    0x30A3 : 0x04a8,
    0x30A5 : 0x04a9,
    0x30A7 : 0x04aa,
    0x30A9 : 0x04ab,
    0x30E3 : 0x04ac,
    0x30E5 : 0x04ad,
    0x30E7 : 0x04ae,
    0x30C3 : 0x04af,
    0x30FC : 0x04b0,
    0x30A2 : 0x04b1,
    0x30A4 : 0x04b2,
    0x30A6 : 0x04b3,
    0x30A8 : 0x04b4,
    0x30AA : 0x04b5,
    0x30AB : 0x04b6,
    0x30AD : 0x04b7,
    0x30AF : 0x04b8,
    0x30B1 : 0x04b9,
    0x30B3 : 0x04ba,
    0x30B5 : 0x04bb,
    0x30B7 : 0x04bc,
    0x30B9 : 0x04bd,
    0x30BB : 0x04be,
    0x30BD : 0x04bf,
    0x30BF : 0x04c0,
    0x30C1 : 0x04c1,
    0x30C4 : 0x04c2,
    0x30C6 : 0x04c3,
    0x30C8 : 0x04c4,
    0x30CA : 0x04c5,
    0x30CB : 0x04c6,
    0x30CC : 0x04c7,
    0x30CD : 0x04c8,
    0x30CE : 0x04c9,
    0x30CF : 0x04ca,
    0x30D2 : 0x04cb,
    0x30D5 : 0x04cc,
    0x30D8 : 0x04cd,
    0x30DB : 0x04ce,
    0x30DE : 0x04cf,
    0x30DF : 0x04d0,
    0x30E0 : 0x04d1,
    0x30E1 : 0x04d2,
    0x30E2 : 0x04d3,
    0x30E4 : 0x04d4,
    0x30E6 : 0x04d5,
    0x30E8 : 0x04d6,
    0x30E9 : 0x04d7,
    0x30EA : 0x04d8,
    0x30EB : 0x04d9,
    0x30EC : 0x04da,
    0x30ED : 0x04db,
    0x30EF : 0x04dc,
    0x30F3 : 0x04dd,
    0x309B : 0x04de,
    0x309C : 0x04df,
    0x06F0 : 0x10006f0,
    0x06F1 : 0x10006f1,
    0x06F2 : 0x10006f2,
    0x06F3 : 0x10006f3,
    0x06F4 : 0x10006f4,
    0x06F5 : 0x10006f5,
    0x06F6 : 0x10006f6,
    0x06F7 : 0x10006f7,
    0x06F8 : 0x10006f8,
    0x06F9 : 0x10006f9,
    0x066A : 0x100066a,
    0x0670 : 0x1000670,
    0x0679 : 0x1000679,
    0x067E : 0x100067e,
    0x0686 : 0x1000686,
    0x0688 : 0x1000688,
    0x0691 : 0x1000691,
    0x060C : 0x05ac,
    0x06D4 : 0x10006d4,
    0x0660 : 0x1000660,
    0x0661 : 0x1000661,
    0x0662 : 0x1000662,
    0x0663 : 0x1000663,
    0x0664 : 0x1000664,
    0x0665 : 0x1000665,
    0x0666 : 0x1000666,
    0x0667 : 0x1000667,
    0x0668 : 0x1000668,
    0x0669 : 0x1000669,
    0x061B : 0x05bb,
    0x061F : 0x05bf,
    0x0621 : 0x05c1,
    0x0622 : 0x05c2,
    0x0623 : 0x05c3,
    0x0624 : 0x05c4,
    0x0625 : 0x05c5,
    0x0626 : 0x05c6,
    0x0627 : 0x05c7,
    0x0628 : 0x05c8,
    0x0629 : 0x05c9,
    0x062A : 0x05ca,
    0x062B : 0x05cb,
    0x062C : 0x05cc,
    0x062D : 0x05cd,
    0x062E : 0x05ce,
    0x062F : 0x05cf,
    0x0630 : 0x05d0,
    0x0631 : 0x05d1,
    0x0632 : 0x05d2,
    0x0633 : 0x05d3,
    0x0634 : 0x05d4,
    0x0635 : 0x05d5,
    0x0636 : 0x05d6,
    0x0637 : 0x05d7,
    0x0638 : 0x05d8,
    0x0639 : 0x05d9,
    0x063A : 0x05da,
    0x0640 : 0x05e0,
    0x0641 : 0x05e1,
    0x0642 : 0x05e2,
    0x0643 : 0x05e3,
    0x0644 : 0x05e4,
    0x0645 : 0x05e5,
    0x0646 : 0x05e6,
    0x0647 : 0x05e7,
    0x0648 : 0x05e8,
    0x0649 : 0x05e9,
    0x064A : 0x05ea,
    0x064B : 0x05eb,
    0x064C : 0x05ec,
    0x064D : 0x05ed,
    0x064E : 0x05ee,
    0x064F : 0x05ef,
    0x0650 : 0x05f0,
    0x0651 : 0x05f1,
    0x0652 : 0x05f2,
    0x0653 : 0x1000653,
    0x0654 : 0x1000654,
    0x0655 : 0x1000655,
    0x0698 : 0x1000698,
    0x06A4 : 0x10006a4,
    0x06A9 : 0x10006a9,
    0x06AF : 0x10006af,
    0x06BA : 0x10006ba,
    0x06BE : 0x10006be,
    0x06CC : 0x10006cc,
    0x06D2 : 0x10006d2,
    0x06C1 : 0x10006c1,
    0x0492 : 0x1000492,
    0x0493 : 0x1000493,
    0x0496 : 0x1000496,
    0x0497 : 0x1000497,
    0x049A : 0x100049a,
    0x049B : 0x100049b,
    0x049C : 0x100049c,
    0x049D : 0x100049d,
    0x04A2 : 0x10004a2,
    0x04A3 : 0x10004a3,
    0x04AE : 0x10004ae,
    0x04AF : 0x10004af,
    0x04B0 : 0x10004b0,
    0x04B1 : 0x10004b1,
    0x04B2 : 0x10004b2,
    0x04B3 : 0x10004b3,
    0x04B6 : 0x10004b6,
    0x04B7 : 0x10004b7,
    0x04B8 : 0x10004b8,
    0x04B9 : 0x10004b9,
    0x04BA : 0x10004ba,
    0x04BB : 0x10004bb,
    0x04D8 : 0x10004d8,
    0x04D9 : 0x10004d9,
    0x04E2 : 0x10004e2,
    0x04E3 : 0x10004e3,
    0x04E8 : 0x10004e8,
    0x04E9 : 0x10004e9,
    0x04EE : 0x10004ee,
    0x04EF : 0x10004ef,
    0x0452 : 0x06a1,
    0x0453 : 0x06a2,
    0x0451 : 0x06a3,
    0x0454 : 0x06a4,
    0x0455 : 0x06a5,
    0x0456 : 0x06a6,
    0x0457 : 0x06a7,
    0x0458 : 0x06a8,
    0x0459 : 0x06a9,
    0x045A : 0x06aa,
    0x045B : 0x06ab,
    0x045C : 0x06ac,
    0x0491 : 0x06ad,
    0x045E : 0x06ae,
    0x045F : 0x06af,
    0x2116 : 0x06b0,
    0x0402 : 0x06b1,
    0x0403 : 0x06b2,
    0x0401 : 0x06b3,
    0x0404 : 0x06b4,
    0x0405 : 0x06b5,
    0x0406 : 0x06b6,
    0x0407 : 0x06b7,
    0x0408 : 0x06b8,
    0x0409 : 0x06b9,
    0x040A : 0x06ba,
    0x040B : 0x06bb,
    0x040C : 0x06bc,
    0x0490 : 0x06bd,
    0x040E : 0x06be,
    0x040F : 0x06bf,
    0x044E : 0x06c0,
    0x0430 : 0x06c1,
    0x0431 : 0x06c2,
    0x0446 : 0x06c3,
    0x0434 : 0x06c4,
    0x0435 : 0x06c5,
    0x0444 : 0x06c6,
    0x0433 : 0x06c7,
    0x0445 : 0x06c8,
    0x0438 : 0x06c9,
    0x0439 : 0x06ca,
    0x043A : 0x06cb,
    0x043B : 0x06cc,
    0x043C : 0x06cd,
    0x043D : 0x06ce,
    0x043E : 0x06cf,
    0x043F : 0x06d0,
    0x044F : 0x06d1,
    0x0440 : 0x06d2,
    0x0441 : 0x06d3,
    0x0442 : 0x06d4,
    0x0443 : 0x06d5,
    0x0436 : 0x06d6,
    0x0432 : 0x06d7,
    0x044C : 0x06d8,
    0x044B : 0x06d9,
    0x0437 : 0x06da,
    0x0448 : 0x06db,
    0x044D : 0x06dc,
    0x0449 : 0x06dd,
    0x0447 : 0x06de,
    0x044A : 0x06df,
    0x042E : 0x06e0,
    0x0410 : 0x06e1,
    0x0411 : 0x06e2,
    0x0426 : 0x06e3,
    0x0414 : 0x06e4,
    0x0415 : 0x06e5,
    0x0424 : 0x06e6,
    0x0413 : 0x06e7,
    0x0425 : 0x06e8,
    0x0418 : 0x06e9,
    0x0419 : 0x06ea,
    0x041A : 0x06eb,
    0x041B : 0x06ec,
    0x041C : 0x06ed,
    0x041D : 0x06ee,
    0x041E : 0x06ef,
    0x041F : 0x06f0,
    0x042F : 0x06f1,
    0x0420 : 0x06f2,
    0x0421 : 0x06f3,
    0x0422 : 0x06f4,
    0x0423 : 0x06f5,
    0x0416 : 0x06f6,
    0x0412 : 0x06f7,
    0x042C : 0x06f8,
    0x042B : 0x06f9,
    0x0417 : 0x06fa,
    0x0428 : 0x06fb,
    0x042D : 0x06fc,
    0x0429 : 0x06fd,
    0x0427 : 0x06fe,
    0x042A : 0x06ff,
    0x0386 : 0x07a1,
    0x0388 : 0x07a2,
    0x0389 : 0x07a3,
    0x038A : 0x07a4,
    0x03AA : 0x07a5,
    0x038C : 0x07a7,
    0x038E : 0x07a8,
    0x03AB : 0x07a9,
    0x038F : 0x07ab,
    0x0385 : 0x07ae,
    0x2015 : 0x07af,
    0x03AC : 0x07b1,
    0x03AD : 0x07b2,
    0x03AE : 0x07b3,
    0x03AF : 0x07b4,
    0x03CA : 0x07b5,
    0x0390 : 0x07b6,
    0x03CC : 0x07b7,
    0x03CD : 0x07b8,
    0x03CB : 0x07b9,
    0x03B0 : 0x07ba,
    0x03CE : 0x07bb,
    0x0391 : 0x07c1,
    0x0392 : 0x07c2,
    0x0393 : 0x07c3,
    0x0394 : 0x07c4,
    0x0395 : 0x07c5,
    0x0396 : 0x07c6,
    0x0397 : 0x07c7,
    0x0398 : 0x07c8,
    0x0399 : 0x07c9,
    0x039A : 0x07ca,
    0x039B : 0x07cb,
    0x039C : 0x07cc,
    0x039D : 0x07cd,
    0x039E : 0x07ce,
    0x039F : 0x07cf,
    0x03A0 : 0x07d0,
    0x03A1 : 0x07d1,
    0x03A3 : 0x07d2,
    0x03A4 : 0x07d4,
    0x03A5 : 0x07d5,
    0x03A6 : 0x07d6,
    0x03A7 : 0x07d7,
    0x03A8 : 0x07d8,
    0x03A9 : 0x07d9,
    0x03B1 : 0x07e1,
    0x03B2 : 0x07e2,
    0x03B3 : 0x07e3,
    0x03B4 : 0x07e4,
    0x03B5 : 0x07e5,
    0x03B6 : 0x07e6,
    0x03B7 : 0x07e7,
    0x03B8 : 0x07e8,
    0x03B9 : 0x07e9,
    0x03BA : 0x07ea,
    0x03BB : 0x07eb,
    0x03BC : 0x07ec,
    0x03BD : 0x07ed,
    0x03BE : 0x07ee,
    0x03BF : 0x07ef,
    0x03C0 : 0x07f0,
    0x03C1 : 0x07f1,
    0x03C3 : 0x07f2,
    0x03C2 : 0x07f3,
    0x03C4 : 0x07f4,
    0x03C5 : 0x07f5,
    0x03C6 : 0x07f6,
    0x03C7 : 0x07f7,
    0x03C8 : 0x07f8,
    0x03C9 : 0x07f9,
    0x23B7 : 0x08a1,
    0x2320 : 0x08a4,
    0x2321 : 0x08a5,
    0x23A1 : 0x08a7,
    0x23A3 : 0x08a8,
    0x23A4 : 0x08a9,
    0x23A6 : 0x08aa,
    0x239B : 0x08ab,
    0x239D : 0x08ac,
    0x239E : 0x08ad,
    0x23A0 : 0x08ae,
    0x23A8 : 0x08af,
    0x23AC : 0x08b0,
    0x2264 : 0x08bc,
    0x2260 : 0x08bd,
    0x2265 : 0x08be,
    0x222B : 0x08bf,
    0x2234 : 0x08c0,
    0x221D : 0x08c1,
    0x221E : 0x08c2,
    0x2207 : 0x08c5,
    0x223C : 0x08c8,
    0x2243 : 0x08c9,
    0x21D4 : 0x08cd,
    0x21D2 : 0x08ce,
    0x2261 : 0x08cf,
    //0x221A : 0x08d6,
    0x2282 : 0x08da,
    0x2283 : 0x08db,
    0x2229 : 0x08dc,
    0x222A : 0x08dd,
    0x2227 : 0x08de,
    0x2228 : 0x08df,
    //0x2202 : 0x08ef,
    0x0192 : 0x08f6,
    0x2190 : 0x08fb,
    0x2191 : 0x08fc,
    0x2192 : 0x08fd,
    0x2193 : 0x08fe,
    0x25C6 : 0x09e0,
    0x2592 : 0x09e1,
    0x2409 : 0x09e2,
    0x240C : 0x09e3,
    0x240D : 0x09e4,
    0x240A : 0x09e5,
    0x2424 : 0x09e8,
    0x240B : 0x09e9,
    0x2518 : 0x09ea,
    0x2510 : 0x09eb,
    0x250C : 0x09ec,
    0x2514 : 0x09ed,
    0x253C : 0x09ee,
    0x23BA : 0x09ef,
    0x23BB : 0x09f0,
    0x2500 : 0x09f1,
    0x23BC : 0x09f2,
    0x23BD : 0x09f3,
    0x251C : 0x09f4,
    0x2524 : 0x09f5,
    0x2534 : 0x09f6,
    0x252C : 0x09f7,
    0x2502 : 0x09f8,
    0x2003 : 0x0aa1,
    0x2002 : 0x0aa2,
    0x2004 : 0x0aa3,
    0x2005 : 0x0aa4,
    0x2007 : 0x0aa5,
    0x2008 : 0x0aa6,
    0x2009 : 0x0aa7,
    0x200A : 0x0aa8,
    0x2014 : 0x0aa9,
    0x2013 : 0x0aaa,
    0x2026 : 0x0aae,
    0x2025 : 0x0aaf,
    0x2153 : 0x0ab0,
    0x2154 : 0x0ab1,
    0x2155 : 0x0ab2,
    0x2156 : 0x0ab3,
    0x2157 : 0x0ab4,
    0x2158 : 0x0ab5,
    0x2159 : 0x0ab6,
    0x215A : 0x0ab7,
    0x2105 : 0x0ab8,
    0x2012 : 0x0abb,
    0x215B : 0x0ac3,
    0x215C : 0x0ac4,
    0x215D : 0x0ac5,
    0x215E : 0x0ac6,
    0x2122 : 0x0ac9,
    0x2018 : 0x0ad0,
    0x2019 : 0x0ad1,
    0x201C : 0x0ad2,
    0x201D : 0x0ad3,
    0x211E : 0x0ad4,
    0x2032 : 0x0ad6,
    0x2033 : 0x0ad7,
    0x271D : 0x0ad9,
    0x2663 : 0x0aec,
    0x2666 : 0x0aed,
    0x2665 : 0x0aee,
    0x2720 : 0x0af0,
    0x2020 : 0x0af1,
    0x2021 : 0x0af2,
    0x2713 : 0x0af3,
    0x2717 : 0x0af4,
    0x266F : 0x0af5,
    0x266D : 0x0af6,
    0x2642 : 0x0af7,
    0x2640 : 0x0af8,
    0x260E : 0x0af9,
    0x2315 : 0x0afa,
    0x2117 : 0x0afb,
    0x2038 : 0x0afc,
    0x201A : 0x0afd,
    0x201E : 0x0afe,
    0x22A4 : 0x0bc2,
    0x230A : 0x0bc4,
    0x2218 : 0x0bca,
    0x2395 : 0x0bcc,
    0x22A5 : 0x0bce,
    0x25CB : 0x0bcf,
    0x2308 : 0x0bd3,
    0x22A3 : 0x0bdc,
    0x22A2 : 0x0bfc,
    0x2017 : 0x0cdf,
    0x05D0 : 0x0ce0,
    0x05D1 : 0x0ce1,
    0x05D2 : 0x0ce2,
    0x05D3 : 0x0ce3,
    0x05D4 : 0x0ce4,
    0x05D5 : 0x0ce5,
    0x05D6 : 0x0ce6,
    0x05D7 : 0x0ce7,
    0x05D8 : 0x0ce8,
    0x05D9 : 0x0ce9,
    0x05DA : 0x0cea,
    0x05DB : 0x0ceb,
    0x05DC : 0x0cec,
    0x05DD : 0x0ced,
    0x05DE : 0x0cee,
    0x05DF : 0x0cef,
    0x05E0 : 0x0cf0,
    0x05E1 : 0x0cf1,
    0x05E2 : 0x0cf2,
    0x05E3 : 0x0cf3,
    0x05E4 : 0x0cf4,
    0x05E5 : 0x0cf5,
    0x05E6 : 0x0cf6,
    0x05E7 : 0x0cf7,
    0x05E8 : 0x0cf8,
    0x05E9 : 0x0cf9,
    0x05EA : 0x0cfa,
    0x0E01 : 0x0da1,
    0x0E02 : 0x0da2,
    0x0E03 : 0x0da3,
    0x0E04 : 0x0da4,
    0x0E05 : 0x0da5,
    0x0E06 : 0x0da6,
    0x0E07 : 0x0da7,
    0x0E08 : 0x0da8,
    0x0E09 : 0x0da9,
    0x0E0A : 0x0daa,
    0x0E0B : 0x0dab,
    0x0E0C : 0x0dac,
    0x0E0D : 0x0dad,
    0x0E0E : 0x0dae,
    0x0E0F : 0x0daf,
    0x0E10 : 0x0db0,
    0x0E11 : 0x0db1,
    0x0E12 : 0x0db2,
    0x0E13 : 0x0db3,
    0x0E14 : 0x0db4,
    0x0E15 : 0x0db5,
    0x0E16 : 0x0db6,
    0x0E17 : 0x0db7,
    0x0E18 : 0x0db8,
    0x0E19 : 0x0db9,
    0x0E1A : 0x0dba,
    0x0E1B : 0x0dbb,
    0x0E1C : 0x0dbc,
    0x0E1D : 0x0dbd,
    0x0E1E : 0x0dbe,
    0x0E1F : 0x0dbf,
    0x0E20 : 0x0dc0,
    0x0E21 : 0x0dc1,
    0x0E22 : 0x0dc2,
    0x0E23 : 0x0dc3,
    0x0E24 : 0x0dc4,
    0x0E25 : 0x0dc5,
    0x0E26 : 0x0dc6,
    0x0E27 : 0x0dc7,
    0x0E28 : 0x0dc8,
    0x0E29 : 0x0dc9,
    0x0E2A : 0x0dca,
    0x0E2B : 0x0dcb,
    0x0E2C : 0x0dcc,
    0x0E2D : 0x0dcd,
    0x0E2E : 0x0dce,
    0x0E2F : 0x0dcf,
    0x0E30 : 0x0dd0,
    0x0E31 : 0x0dd1,
    0x0E32 : 0x0dd2,
    0x0E33 : 0x0dd3,
    0x0E34 : 0x0dd4,
    0x0E35 : 0x0dd5,
    0x0E36 : 0x0dd6,
    0x0E37 : 0x0dd7,
    0x0E38 : 0x0dd8,
    0x0E39 : 0x0dd9,
    0x0E3A : 0x0dda,
    0x0E3F : 0x0ddf,
    0x0E40 : 0x0de0,
    0x0E41 : 0x0de1,
    0x0E42 : 0x0de2,
    0x0E43 : 0x0de3,
    0x0E44 : 0x0de4,
    0x0E45 : 0x0de5,
    0x0E46 : 0x0de6,
    0x0E47 : 0x0de7,
    0x0E48 : 0x0de8,
    0x0E49 : 0x0de9,
    0x0E4A : 0x0dea,
    0x0E4B : 0x0deb,
    0x0E4C : 0x0dec,
    0x0E4D : 0x0ded,
    0x0E50 : 0x0df0,
    0x0E51 : 0x0df1,
    0x0E52 : 0x0df2,
    0x0E53 : 0x0df3,
    0x0E54 : 0x0df4,
    0x0E55 : 0x0df5,
    0x0E56 : 0x0df6,
    0x0E57 : 0x0df7,
    0x0E58 : 0x0df8,
    0x0E59 : 0x0df9,
    0x0587 : 0x1000587,
    0x0589 : 0x1000589,
    0x055D : 0x100055d,
    0x058A : 0x100058a,
    0x055C : 0x100055c,
    0x055B : 0x100055b,
    0x055E : 0x100055e,
    0x0531 : 0x1000531,
    0x0561 : 0x1000561,
    0x0532 : 0x1000532,
    0x0562 : 0x1000562,
    0x0533 : 0x1000533,
    0x0563 : 0x1000563,
    0x0534 : 0x1000534,
    0x0564 : 0x1000564,
    0x0535 : 0x1000535,
    0x0565 : 0x1000565,
    0x0536 : 0x1000536,
    0x0566 : 0x1000566,
    0x0537 : 0x1000537,
    0x0567 : 0x1000567,
    0x0538 : 0x1000538,
    0x0568 : 0x1000568,
    0x0539 : 0x1000539,
    0x0569 : 0x1000569,
    0x053A : 0x100053a,
    0x056A : 0x100056a,
    0x053B : 0x100053b,
    0x056B : 0x100056b,
    0x053C : 0x100053c,
    0x056C : 0x100056c,
    0x053D : 0x100053d,
    0x056D : 0x100056d,
    0x053E : 0x100053e,
    0x056E : 0x100056e,
    0x053F : 0x100053f,
    0x056F : 0x100056f,
    0x0540 : 0x1000540,
    0x0570 : 0x1000570,
    0x0541 : 0x1000541,
    0x0571 : 0x1000571,
    0x0542 : 0x1000542,
    0x0572 : 0x1000572,
    0x0543 : 0x1000543,
    0x0573 : 0x1000573,
    0x0544 : 0x1000544,
    0x0574 : 0x1000574,
    0x0545 : 0x1000545,
    0x0575 : 0x1000575,
    0x0546 : 0x1000546,
    0x0576 : 0x1000576,
    0x0547 : 0x1000547,
    0x0577 : 0x1000577,
    0x0548 : 0x1000548,
    0x0578 : 0x1000578,
    0x0549 : 0x1000549,
    0x0579 : 0x1000579,
    0x054A : 0x100054a,
    0x057A : 0x100057a,
    0x054B : 0x100054b,
    0x057B : 0x100057b,
    0x054C : 0x100054c,
    0x057C : 0x100057c,
    0x054D : 0x100054d,
    0x057D : 0x100057d,
    0x054E : 0x100054e,
    0x057E : 0x100057e,
    0x054F : 0x100054f,
    0x057F : 0x100057f,
    0x0550 : 0x1000550,
    0x0580 : 0x1000580,
    0x0551 : 0x1000551,
    0x0581 : 0x1000581,
    0x0552 : 0x1000552,
    0x0582 : 0x1000582,
    0x0553 : 0x1000553,
    0x0583 : 0x1000583,
    0x0554 : 0x1000554,
    0x0584 : 0x1000584,
    0x0555 : 0x1000555,
    0x0585 : 0x1000585,
    0x0556 : 0x1000556,
    0x0586 : 0x1000586,
    0x055A : 0x100055a,
    0x10D0 : 0x10010d0,
    0x10D1 : 0x10010d1,
    0x10D2 : 0x10010d2,
    0x10D3 : 0x10010d3,
    0x10D4 : 0x10010d4,
    0x10D5 : 0x10010d5,
    0x10D6 : 0x10010d6,
    0x10D7 : 0x10010d7,
    0x10D8 : 0x10010d8,
    0x10D9 : 0x10010d9,
    0x10DA : 0x10010da,
    0x10DB : 0x10010db,
    0x10DC : 0x10010dc,
    0x10DD : 0x10010dd,
    0x10DE : 0x10010de,
    0x10DF : 0x10010df,
    0x10E0 : 0x10010e0,
    0x10E1 : 0x10010e1,
    0x10E2 : 0x10010e2,
    0x10E3 : 0x10010e3,
    0x10E4 : 0x10010e4,
    0x10E5 : 0x10010e5,
    0x10E6 : 0x10010e6,
    0x10E7 : 0x10010e7,
    0x10E8 : 0x10010e8,
    0x10E9 : 0x10010e9,
    0x10EA : 0x10010ea,
    0x10EB : 0x10010eb,
    0x10EC : 0x10010ec,
    0x10ED : 0x10010ed,
    0x10EE : 0x10010ee,
    0x10EF : 0x10010ef,
    0x10F0 : 0x10010f0,
    0x10F1 : 0x10010f1,
    0x10F2 : 0x10010f2,
    0x10F3 : 0x10010f3,
    0x10F4 : 0x10010f4,
    0x10F5 : 0x10010f5,
    0x10F6 : 0x10010f6,
    0x1E8A : 0x1001e8a,
    0x012C : 0x100012c,
    0x01B5 : 0x10001b5,
    0x01E6 : 0x10001e6,
    0x01D2 : 0x10001d1,
    0x019F : 0x100019f,
    0x1E8B : 0x1001e8b,
    0x012D : 0x100012d,
    0x01B6 : 0x10001b6,
    0x01E7 : 0x10001e7,
    //0x01D2 : 0x10001d2,
    0x0275 : 0x1000275,
    0x018F : 0x100018f,
    0x0259 : 0x1000259,
    0x1E36 : 0x1001e36,
    0x1E37 : 0x1001e37,
    0x1EA0 : 0x1001ea0,
    0x1EA1 : 0x1001ea1,
    0x1EA2 : 0x1001ea2,
    0x1EA3 : 0x1001ea3,
    0x1EA4 : 0x1001ea4,
    0x1EA5 : 0x1001ea5,
    0x1EA6 : 0x1001ea6,
    0x1EA7 : 0x1001ea7,
    0x1EA8 : 0x1001ea8,
    0x1EA9 : 0x1001ea9,
    0x1EAA : 0x1001eaa,
    0x1EAB : 0x1001eab,
    0x1EAC : 0x1001eac,
    0x1EAD : 0x1001ead,
    0x1EAE : 0x1001eae,
    0x1EAF : 0x1001eaf,
    0x1EB0 : 0x1001eb0,
    0x1EB1 : 0x1001eb1,
    0x1EB2 : 0x1001eb2,
    0x1EB3 : 0x1001eb3,
    0x1EB4 : 0x1001eb4,
    0x1EB5 : 0x1001eb5,
    0x1EB6 : 0x1001eb6,
    0x1EB7 : 0x1001eb7,
    0x1EB8 : 0x1001eb8,
    0x1EB9 : 0x1001eb9,
    0x1EBA : 0x1001eba,
    0x1EBB : 0x1001ebb,
    0x1EBC : 0x1001ebc,
    0x1EBD : 0x1001ebd,
    0x1EBE : 0x1001ebe,
    0x1EBF : 0x1001ebf,
    0x1EC0 : 0x1001ec0,
    0x1EC1 : 0x1001ec1,
    0x1EC2 : 0x1001ec2,
    0x1EC3 : 0x1001ec3,
    0x1EC4 : 0x1001ec4,
    0x1EC5 : 0x1001ec5,
    0x1EC6 : 0x1001ec6,
    0x1EC7 : 0x1001ec7,
    0x1EC8 : 0x1001ec8,
    0x1EC9 : 0x1001ec9,
    0x1ECA : 0x1001eca,
    0x1ECB : 0x1001ecb,
    0x1ECC : 0x1001ecc,
    0x1ECD : 0x1001ecd,
    0x1ECE : 0x1001ece,
    0x1ECF : 0x1001ecf,
    0x1ED0 : 0x1001ed0,
    0x1ED1 : 0x1001ed1,
    0x1ED2 : 0x1001ed2,
    0x1ED3 : 0x1001ed3,
    0x1ED4 : 0x1001ed4,
    0x1ED5 : 0x1001ed5,
    0x1ED6 : 0x1001ed6,
    0x1ED7 : 0x1001ed7,
    0x1ED8 : 0x1001ed8,
    0x1ED9 : 0x1001ed9,
    0x1EDA : 0x1001eda,
    0x1EDB : 0x1001edb,
    0x1EDC : 0x1001edc,
    0x1EDD : 0x1001edd,
    0x1EDE : 0x1001ede,
    0x1EDF : 0x1001edf,
    0x1EE0 : 0x1001ee0,
    0x1EE1 : 0x1001ee1,
    0x1EE2 : 0x1001ee2,
    0x1EE3 : 0x1001ee3,
    0x1EE4 : 0x1001ee4,
    0x1EE5 : 0x1001ee5,
    0x1EE6 : 0x1001ee6,
    0x1EE7 : 0x1001ee7,
    0x1EE8 : 0x1001ee8,
    0x1EE9 : 0x1001ee9,
    0x1EEA : 0x1001eea,
    0x1EEB : 0x1001eeb,
    0x1EEC : 0x1001eec,
    0x1EED : 0x1001eed,
    0x1EEE : 0x1001eee,
    0x1EEF : 0x1001eef,
    0x1EF0 : 0x1001ef0,
    0x1EF1 : 0x1001ef1,
    0x1EF4 : 0x1001ef4,
    0x1EF5 : 0x1001ef5,
    0x1EF6 : 0x1001ef6,
    0x1EF7 : 0x1001ef7,
    0x1EF8 : 0x1001ef8,
    0x1EF9 : 0x1001ef9,
    0x01A0 : 0x10001a0,
    0x01A1 : 0x10001a1,
    0x01AF : 0x10001af,
    0x01B0 : 0x10001b0,
    0x20A0 : 0x10020a0,
    0x20A1 : 0x10020a1,
    0x20A2 : 0x10020a2,
    0x20A3 : 0x10020a3,
    0x20A4 : 0x10020a4,
    0x20A5 : 0x10020a5,
    0x20A6 : 0x10020a6,
    0x20A7 : 0x10020a7,
    0x20A8 : 0x10020a8,
    0x20A9 : 0x10020a9,
    0x20AA : 0x10020aa,
    0x20AB : 0x10020ab,
    0x20AC : 0x20ac,
    0x2070 : 0x1002070,
    0x2074 : 0x1002074,
    0x2075 : 0x1002075,
    0x2076 : 0x1002076,
    0x2077 : 0x1002077,
    0x2078 : 0x1002078,
    0x2079 : 0x1002079,
    0x2080 : 0x1002080,
    0x2081 : 0x1002081,
    0x2082 : 0x1002082,
    0x2083 : 0x1002083,
    0x2084 : 0x1002084,
    0x2085 : 0x1002085,
    0x2086 : 0x1002086,
    0x2087 : 0x1002087,
    0x2088 : 0x1002088,
    0x2089 : 0x1002089,
    0x2202 : 0x1002202,
    0x2205 : 0x1002205,
    0x2208 : 0x1002208,
    0x2209 : 0x1002209,
    0x220B : 0x100220B,
    0x221A : 0x100221A,
    0x221B : 0x100221B,
    0x221C : 0x100221C,
    0x222C : 0x100222C,
    0x222D : 0x100222D,
    0x2235 : 0x1002235,
    0x2245 : 0x1002248,
    0x2247 : 0x1002247,
    0x2262 : 0x1002262,
    0x2263 : 0x1002263,
    0x2800 : 0x1002800,
    0x2801 : 0x1002801,
    0x2802 : 0x1002802,
    0x2803 : 0x1002803,
    0x2804 : 0x1002804,
    0x2805 : 0x1002805,
    0x2806 : 0x1002806,
    0x2807 : 0x1002807,
    0x2808 : 0x1002808,
    0x2809 : 0x1002809,
    0x280a : 0x100280a,
    0x280b : 0x100280b,
    0x280c : 0x100280c,
    0x280d : 0x100280d,
    0x280e : 0x100280e,
    0x280f : 0x100280f,
    0x2810 : 0x1002810,
    0x2811 : 0x1002811,
    0x2812 : 0x1002812,
    0x2813 : 0x1002813,
    0x2814 : 0x1002814,
    0x2815 : 0x1002815,
    0x2816 : 0x1002816,
    0x2817 : 0x1002817,
    0x2818 : 0x1002818,
    0x2819 : 0x1002819,
    0x281a : 0x100281a,
    0x281b : 0x100281b,
    0x281c : 0x100281c,
    0x281d : 0x100281d,
    0x281e : 0x100281e,
    0x281f : 0x100281f,
    0x2820 : 0x1002820,
    0x2821 : 0x1002821,
    0x2822 : 0x1002822,
    0x2823 : 0x1002823,
    0x2824 : 0x1002824,
    0x2825 : 0x1002825,
    0x2826 : 0x1002826,
    0x2827 : 0x1002827,
    0x2828 : 0x1002828,
    0x2829 : 0x1002829,
    0x282a : 0x100282a,
    0x282b : 0x100282b,
    0x282c : 0x100282c,
    0x282d : 0x100282d,
    0x282e : 0x100282e,
    0x282f : 0x100282f,
    0x2830 : 0x1002830,
    0x2831 : 0x1002831,
    0x2832 : 0x1002832,
    0x2833 : 0x1002833,
    0x2834 : 0x1002834,
    0x2835 : 0x1002835,
    0x2836 : 0x1002836,
    0x2837 : 0x1002837,
    0x2838 : 0x1002838,
    0x2839 : 0x1002839,
    0x283a : 0x100283a,
    0x283b : 0x100283b,
    0x283c : 0x100283c,
    0x283d : 0x100283d,
    0x283e : 0x100283e,
    0x283f : 0x100283f,
    0x2840 : 0x1002840,
    0x2841 : 0x1002841,
    0x2842 : 0x1002842,
    0x2843 : 0x1002843,
    0x2844 : 0x1002844,
    0x2845 : 0x1002845,
    0x2846 : 0x1002846,
    0x2847 : 0x1002847,
    0x2848 : 0x1002848,
    0x2849 : 0x1002849,
    0x284a : 0x100284a,
    0x284b : 0x100284b,
    0x284c : 0x100284c,
    0x284d : 0x100284d,
    0x284e : 0x100284e,
    0x284f : 0x100284f,
    0x2850 : 0x1002850,
    0x2851 : 0x1002851,
    0x2852 : 0x1002852,
    0x2853 : 0x1002853,
    0x2854 : 0x1002854,
    0x2855 : 0x1002855,
    0x2856 : 0x1002856,
    0x2857 : 0x1002857,
    0x2858 : 0x1002858,
    0x2859 : 0x1002859,
    0x285a : 0x100285a,
    0x285b : 0x100285b,
    0x285c : 0x100285c,
    0x285d : 0x100285d,
    0x285e : 0x100285e,
    0x285f : 0x100285f,
    0x2860 : 0x1002860,
    0x2861 : 0x1002861,
    0x2862 : 0x1002862,
    0x2863 : 0x1002863,
    0x2864 : 0x1002864,
    0x2865 : 0x1002865,
    0x2866 : 0x1002866,
    0x2867 : 0x1002867,
    0x2868 : 0x1002868,
    0x2869 : 0x1002869,
    0x286a : 0x100286a,
    0x286b : 0x100286b,
    0x286c : 0x100286c,
    0x286d : 0x100286d,
    0x286e : 0x100286e,
    0x286f : 0x100286f,
    0x2870 : 0x1002870,
    0x2871 : 0x1002871,
    0x2872 : 0x1002872,
    0x2873 : 0x1002873,
    0x2874 : 0x1002874,
    0x2875 : 0x1002875,
    0x2876 : 0x1002876,
    0x2877 : 0x1002877,
    0x2878 : 0x1002878,
    0x2879 : 0x1002879,
    0x287a : 0x100287a,
    0x287b : 0x100287b,
    0x287c : 0x100287c,
    0x287d : 0x100287d,
    0x287e : 0x100287e,
    0x287f : 0x100287f,
    0x2880 : 0x1002880,
    0x2881 : 0x1002881,
    0x2882 : 0x1002882,
    0x2883 : 0x1002883,
    0x2884 : 0x1002884,
    0x2885 : 0x1002885,
    0x2886 : 0x1002886,
    0x2887 : 0x1002887,
    0x2888 : 0x1002888,
    0x2889 : 0x1002889,
    0x288a : 0x100288a,
    0x288b : 0x100288b,
    0x288c : 0x100288c,
    0x288d : 0x100288d,
    0x288e : 0x100288e,
    0x288f : 0x100288f,
    0x2890 : 0x1002890,
    0x2891 : 0x1002891,
    0x2892 : 0x1002892,
    0x2893 : 0x1002893,
    0x2894 : 0x1002894,
    0x2895 : 0x1002895,
    0x2896 : 0x1002896,
    0x2897 : 0x1002897,
    0x2898 : 0x1002898,
    0x2899 : 0x1002899,
    0x289a : 0x100289a,
    0x289b : 0x100289b,
    0x289c : 0x100289c,
    0x289d : 0x100289d,
    0x289e : 0x100289e,
    0x289f : 0x100289f,
    0x28a0 : 0x10028a0,
    0x28a1 : 0x10028a1,
    0x28a2 : 0x10028a2,
    0x28a3 : 0x10028a3,
    0x28a4 : 0x10028a4,
    0x28a5 : 0x10028a5,
    0x28a6 : 0x10028a6,
    0x28a7 : 0x10028a7,
    0x28a8 : 0x10028a8,
    0x28a9 : 0x10028a9,
    0x28aa : 0x10028aa,
    0x28ab : 0x10028ab,
    0x28ac : 0x10028ac,
    0x28ad : 0x10028ad,
    0x28ae : 0x10028ae,
    0x28af : 0x10028af,
    0x28b0 : 0x10028b0,
    0x28b1 : 0x10028b1,
    0x28b2 : 0x10028b2,
    0x28b3 : 0x10028b3,
    0x28b4 : 0x10028b4,
    0x28b5 : 0x10028b5,
    0x28b6 : 0x10028b6,
    0x28b7 : 0x10028b7,
    0x28b8 : 0x10028b8,
    0x28b9 : 0x10028b9,
    0x28ba : 0x10028ba,
    0x28bb : 0x10028bb,
    0x28bc : 0x10028bc,
    0x28bd : 0x10028bd,
    0x28be : 0x10028be,
    0x28bf : 0x10028bf,
    0x28c0 : 0x10028c0,
    0x28c1 : 0x10028c1,
    0x28c2 : 0x10028c2,
    0x28c3 : 0x10028c3,
    0x28c4 : 0x10028c4,
    0x28c5 : 0x10028c5,
    0x28c6 : 0x10028c6,
    0x28c7 : 0x10028c7,
    0x28c8 : 0x10028c8,
    0x28c9 : 0x10028c9,
    0x28ca : 0x10028ca,
    0x28cb : 0x10028cb,
    0x28cc : 0x10028cc,
    0x28cd : 0x10028cd,
    0x28ce : 0x10028ce,
    0x28cf : 0x10028cf,
    0x28d0 : 0x10028d0,
    0x28d1 : 0x10028d1,
    0x28d2 : 0x10028d2,
    0x28d3 : 0x10028d3,
    0x28d4 : 0x10028d4,
    0x28d5 : 0x10028d5,
    0x28d6 : 0x10028d6,
    0x28d7 : 0x10028d7,
    0x28d8 : 0x10028d8,
    0x28d9 : 0x10028d9,
    0x28da : 0x10028da,
    0x28db : 0x10028db,
    0x28dc : 0x10028dc,
    0x28dd : 0x10028dd,
    0x28de : 0x10028de,
    0x28df : 0x10028df,
    0x28e0 : 0x10028e0,
    0x28e1 : 0x10028e1,
    0x28e2 : 0x10028e2,
    0x28e3 : 0x10028e3, 
    0x28e4 : 0x10028e4,
    0x28e5 : 0x10028e5,
    0x28e6 : 0x10028e6,
    0x28e7 : 0x10028e7,
    0x28e8 : 0x10028e8,
    0x28e9 : 0x10028e9,
    0x28ea : 0x10028ea,
    0x28eb : 0x10028eb,
    0x28ec : 0x10028ec,
    0x28ed : 0x10028ed,
    0x28ee : 0x10028ee,
    0x28ef : 0x10028ef,
    0x28f0 : 0x10028f0,
    0x28f1 : 0x10028f1,
    0x28f2 : 0x10028f2,
    0x28f3 : 0x10028f3,
    0x28f4 : 0x10028f4,
    0x28f5 : 0x10028f5,
    0x28f6 : 0x10028f6,
    0x28f7 : 0x10028f7,
    0x28f8 : 0x10028f8,
    0x28f9 : 0x10028f9,
    0x28fa : 0x10028fa,
    0x28fb : 0x10028fb,
    0x28fc : 0x10028fc,
    0x28fd : 0x10028fd,
    0x28fe : 0x10028fe,
    0x28ff : 0x10028ff
};
