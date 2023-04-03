var wsUri = "ws://" + location.host + "/d/ws/issue";
var websocket;
var commsup = 0;

var workqueue = [];
var workarray = {};
var lastitem;

var SystemMessageTimeout = null;

function IssueSystemMessage(msg) {
    var elem = $("#SystemMessage");
    elem.hide();
    elem.html("<font size=+2>" + msg + "</font>");
    elem.slideToggle('fast');
    if (SystemMessageTimeout != null) clearTimeout(SystemMessageTimeout);
    SystemMessageTimeout = setTimeout(function () {
        SystemMessageTimeout = null;
        $("#SystemMessage").fadeOut('slow')
    }, 3000);
}

function QueueOperation(command, callback) {
    if (workarray[command] == 1)
        return;

    workarray[command] = 1;
    var vp = new Object();
    vp.callback = callback;
    vp.request = command;
    workqueue.push(vp);
}

function init() {
    console.log("Load complete.\n");
    Ticker();
}

window.addEventListener("load", init, false);

function StartWebSocket() {
    if (websocket) websocket.close();
    workarray = {};
    workqueue = [];
    lastitem = null;
    websocket = new WebSocket(wsUri);
    websocket.onopen = function (evt) {
        onOpen(evt)
    };
    websocket.onclose = function (evt) {
        onClose(evt)
    };
    websocket.onmessage = function (evt) {
        onMessage(evt)
    };
    websocket.onerror = function (evt) {
        onError(evt)
    };
}

function onOpen(evt) {
    doSend('e');
}

function onClose(evt) {
    $('#SystemStatusClicker').css("color", "red");
    commsup = 0;
}

function onMessage(evt) {
    msg++;
    if (commsup != 1) {
        commsup = 1;
        $('#SystemStatusClicker').css("color", "green");
        IssueSystemMessage("Comms Established.");
    }
    if (lastitem) {
        if (lastitem.callback) {
            lastitem.callback(lastitem, evt.data);
            lastitem = null;
        }
    }
    if (workqueue.length) {
        var elem = workqueue.shift();
        delete workarray[elem.request];

        if (elem.request) {
            doSend(elem.request);
            lastitem = elem;
            return;
        }
    }
    doSend('e'); // echo
}

function onError(evt) {
    $('#SystemStatusClicker').css("color", "red");
    commsup = 0;
}

function doSend(message) {
    websocket.send(message);
}

var msg = 0;
var tickmessage = 0;
var time_since_hz = 10; //Make it realize it was disconnected to begin with.

function Ticker() {
    setTimeout(Ticker, 1000);

    lasthz = (msg - tickmessage);
    tickmessage = msg;
    if (lasthz == 0) {
        time_since_hz++;
        if (time_since_hz > 3) {
            $('#SystemStatusClicker').css("color", "red");
            $('#SystemStatusClicker').html("System Offline");
            if (commsup != 0) IssueSystemMessage("Comms Lost.");
            commsup = 0;
            StartWebSocket();
        } else
            $('#SystemStatusClicker').html("System " + 0 + "Hz");
    } else {
        time_since_hz = 0;
        $('#SystemStatusClicker').html("System " + lasthz + "Hz");
    }
}