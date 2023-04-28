const audioCtx = new AudioContext();
const destination = audioCtx.createMediaStreamDestination();
var output = new MediaStream();
var micsource;
var syssource;
var mediaRecorder = ''; 
var mediaConstraints;
var micstream;
var audiodevices = [];
var cancel = false;
var recording = false;
var tabid = 0;
var maintabs = [];
var camtabs = [];
var recording_type = "tab-only";
var pushtotalk;
var newwindow = null;
var micable = true;
var width = 1920;
var height = 1080;
var quality = "max";
var fps = 60;
var camerasize = "small-size";
var camerapos = { x: "10px", y: "10px" };
var isMac = navigator.userAgentData.platform.toUpperCase().indexOf('MAC') >= 0;
const streamSaver = window.streamSaver;


// Get list of available audio devices
getDeviceId();

chrome.runtime.onInstalled.addListener(function () {
    // Set defaults when the extension is installed
    chrome.storage.sync.set({
        toolbar: true,
        countdown: true,
        countdown_time: 3,
        flip: true,
        pushtotalk: false,
        camera: 0,
        mic: 0,
        type: "tab-only",
        quality: "max",
        fps: 60,
        start: 0,
        total: 0,
    });

    // Inject content scripts in existing tabs
    chrome.tabs.query({ currentWindow: true }, function gotTabs(tabs) {
        for (let index = 0; index < tabs.length; index++) {
            if (!tabs[index].url.includes("chrome://") && !tabs[index].url.includes("chrome.com")) {
                chrome.tabs.executeScript(tabs[index].id, {
                    file: './js/detect.js'
                })
            }
        }
    });
});

// Set up recording
function newRecording(stream) {
    // Show recording icon
    chrome.browserAction.setIcon({ path: "../assets/extension-icons/logo-32-rec.png" });

    // Start Media Recorder
    if (quality == "max") {
        mediaConstraints = {
            mimeType: 'video/webm;codecs=vp8,vp9,opus'
        }
    } else {
        mediaConstraints = {
            mimeType: 'video/webm;codecs=vp8,vp9,opus',
            bitsPerSecond: 1000
        }
    }
    mediaRecorder = new MediaRecorder(stream, mediaConstraints);
    injectContent(true);
}

// Save recording
var recordedBlobs = []
function saveRecording(url, blobs) {
    newwindow = window.open('../html/videoeditor.html');
    newwindow.url = url;
    newwindow.recordedBlobs = blobs;
    newwindow.type = 'video';

}

// Stop recording
function endRecording(stream, writer, recordedBlobs) {

    // Get video duration
    chrome.storage.sync.get(['start', 'total'], function (result) {
        chrome.storage.sync.set({
            total: Date.now() - result.start + result.total
        });
    });

    // Show default icon
    chrome.browserAction.setIcon({ path: "../assets/extension-icons/logo-32.png" });

    // Hide injected content
    recording = false;
    chrome.tabs.getSelected(null, function (tab) {
        chrome.tabs.sendMessage(tab.id, {
            type: "end"
        });
    });

    // Stop tab and microphone streams
    stream.getTracks().forEach(function (track) {
        track.stop();
    });
    if (micable) {
        micstream.getTracks().forEach(function (track) {
            track.stop();
        });
    }

    // Show download shelf again
    chrome.downloads.setShelfEnabled(true);

    setTimeout(() => {

        writer.close();
        chrome.downloads.search({ limit: 1 }, function (data) {
            // Save recording if requested
            if (!cancel) {
                saveRecording("file://" + data[0].filename, recordedBlobs);

            } else {
                chrome.downloads.removeFile(data[0].id);
            }
        });
    }, 1000)
}

// Start recording the entire desktop / specific application
function getDesktop() {
    var constraints = {
        audio: true,
        video: true,
        maxframeRate: fps
    };
    navigator.mediaDevices.getDisplayMedia(constraints).then(function (stream) {
        output = new MediaStream();
        if (stream.getAudioTracks().length == 0) {
            // Get microphone audio (system audio is unreliable & doesn't work on Mac)
            if (micable) {
                micsource.connect(destination);
                output.addTrack(destination.stream.getAudioTracks()[0]);
            }
        } else {
            syssource = audioCtx.createMediaStreamSource(stream);
            if (micable) {
                micsource.connect(destination);
            }
            syssource.connect(destination);
            output.addTrack(destination.stream.getAudioTracks()[0]);
        }
        output.addTrack(stream.getVideoTracks()[0]);

        // Set up media recorder & inject content
        newRecording(output);

        // Hide the downloads shelf
        chrome.downloads.setShelfEnabled(false);

        // This will write the stream to the filesystem asynchronously
        const { readable, writable } = new TransformStream({
            transform: (chunk, ctrl) => chunk.arrayBuffer().then(b => ctrl.enqueue(new Uint8Array(b)))
        })
        const writer = writable.getWriter()
        readable.pipeTo(streamSaver.createWriteStream('curateit.webm'));

        // Record tab stream
        var recordedBlobs = [];
        mediaRecorder.ondataavailable = event => {
            if (event.data && event.data.size > 0) {
                writer.write(event.data);
                recordedBlobs.push(event.data);
            }
        };

        // When the recording is stopped
        mediaRecorder.onstop = () => {
            endRecording(stream, writer, recordedBlobs);
        }

        // Stop recording if stream is ended via Chrome UI or another method
        stream.getVideoTracks()[0].onended = function () {
            cancel = false;
            mediaRecorder.stop();
        }
    })
}

// Start recording the current tab
function getTab() {
    chrome.tabs.getSelected(null, function (tab) {
        chrome.tabCapture.capture({
            video: true,
            audio: true,
            videoConstraints: {
                mandatory: {
                    chromeMediaSource: 'tab',
                    minWidth: width,
                    minHeight: height,
                    maxWidth: width,
                    maxHeight: height,
                    maxFrameRate: fps
                },
            },
        }, function (stream) {
            // Combine tab and microphone audio
            output = new MediaStream();
            syssource = audioCtx.createMediaStreamSource(stream);
            if (micable) {
                micsource.connect(destination);
            }
            syssource.connect(destination);
            output.addTrack(destination.stream.getAudioTracks()[0]);
            output.addTrack(stream.getVideoTracks()[0]);

            // Keep playing tab audio
            this.context = new AudioContext();
            this.stream = this.context.createMediaStreamSource(stream);
            this.stream.connect(this.context.destination);

            // Set up media recorder & inject content
            newRecording(output)

            // Hide the downloads shelf
            chrome.downloads.setShelfEnabled(false);

            // This will write the stream to the filesystem asynchronously
            const { readable, writable } = new TransformStream({
                transform: (chunk, ctrl) => chunk.arrayBuffer().then(b => ctrl.enqueue(new Uint8Array(b)))
            })
            const writer = writable.getWriter()
            readable.pipeTo(streamSaver.createWriteStream('screenity.webm'));

            // Record tab stream
            var recordedBlobs = [];
            mediaRecorder.ondataavailable = event => {
                if (event.data && event.data.size > 0) {
                    writer.write(event.data);
                    recordedBlobs.push(event.data);
                }
            };

            // When the recording is stopped
            mediaRecorder.onstop = () => {
                endRecording(stream, writer, recordedBlobs);
            }

            // Stop recording if stream is ended when tab is closed
            stream.getVideoTracks()[0].onended = function () {
                mediaRecorder.stop();
            }
        });
    });
}

// Inject content scripts to start recording
function startRecording() {
    chrome.storage.sync.set({
        start: Date.now()
    });
    if (recording_type == "camera-only") {
        injectContent(true);
        recording = true;
    }
    getDeviceId();
    record();
}

// Get microphone audio and start recording video
function record() {
    // Get window dimensions to record
    chrome.windows.getCurrent(function (window) {
        width = window.innerWidth;
        height = window.innerHeight;
    })

    var constraints;
    chrome.storage.sync.get(['fps'], function (result) {
        fps = result.fps;
        chrome.storage.sync.get(['quality'], function (result) {
            quality = result.quality;
            chrome.storage.sync.get(['mic'], function (result) {
                // Set microphone constraints
                constraints = {
                    audio: {
                        deviceId: result.mic
                    }
                }

                // Start microphone stream
                navigator.mediaDevices.getUserMedia(constraints).then(function (mic) {
                    micable = true;
                    micstream = mic;
                    micsource = audioCtx.createMediaStreamSource(mic);

                    // Check recording type
                    if (recording_type == "desktop") {
                        getDesktop();
                    } else if (recording_type == "tab-only") {
                        getTab();
                    }
                }).catch(function (error) {
                    micable = false;

                    // Check recording type
                    if (recording_type == "desktop") {
                        getDesktop();
                    } else if (recording_type == "tab-only") {
                        getTab();
                    }
                });
            });
        });
    });
}

// Inject content script
function injectContent(start) {
    chrome.storage.sync.get(['countdown'], function (result) {
        chrome.tabs.getSelected(null, function (tab) {
            if (maintabs.indexOf(tab.id) == -1 && recording_type != "camera-only") {
                // Inject content if it's not a camera recording and the script hasn't been injected before in this tab
                tabid = tab.id;
                chrome.tabs.executeScript(tab.id, {
                    file: './js/libraries/jquery-3.5.1.min.js'
                });
                chrome.tabs.executeScript(tab.id, {
                    file: './js/libraries/fabric.min.js'
                });
                chrome.tabs.executeScript(tab.id, {
                    file: './js/libraries/pickr.min.js'
                });
                chrome.tabs.executeScript(tab.id, {
                    file: './js/libraries/arrow.js'
                });

                // Check if it's a new or ongoing recording
                if (start) {
                    chrome.tabs.executeScript(tab.id, {
                        code: 'window.countdownactive = ' + result.countdown + ';window.camerasize = "' + camerasize + '";window.camerapos = {x:"' + camerapos.x + '",y:"' + camerapos.y + '"};'
                    }, function () {
                        chrome.tabs.executeScript(tab.id, {
                            file: './js/content.js'
                        });
                    });
                } else {
                    chrome.tabs.executeScript(tab.id, {
                        code: 'window.countdownactive = false;window.camerasize = "' + camerasize + '";window.camerapos = {x:"' + camerapos.x + '",y:"' + camerapos.y + '"};'
                    }, function () {
                        chrome.tabs.executeScript(tab.id, {
                            file: './js/content.js'
                        });
                    });
                }

                chrome.tabs.insertCSS(tab.id, {
                    file: './css/content.css'
                })
                chrome.tabs.insertCSS(tab.id, {
                    file: './css/libraries/pickr.css'
                })
                maintabs.push(tab.id);
            } else if (camtabs.indexOf(tab.id) == -1 && recording_type == "camera-only") {
                // Inject content for camera recording if the script hasn't been injected before in this tab
                tabid = tab.id;
                chrome.tabs.executeScript(tab.id, {
                    file: './js/libraries/jquery-3.5.1.min.js'
                });

                // Check if it's a new or ongoing recording
                if (start) {
                    chrome.tabs.executeScript(tab.id, {
                        code: 'window.countdownactive = ' + result.countdown
                    }, function () {
                        chrome.tabs.executeScript(tab.id, {
                            file: './js/cameracontent.js'
                        });
                    });
                } else {
                    chrome.tabs.executeScript(tab.id, {
                        code: 'window.countdownactive = false;'
                    }, function () {
                        chrome.tabs.executeScript(tab.id, {
                            file: './js/cameracontent.js'
                        });
                    });
                }

                chrome.tabs.insertCSS(tab.id, {
                    file: './css/cameracontent.css'
                })
                camtabs.push(tab.id);
            } else {
                // If the current tab already has the script injected
                if (recording_type == "camera-only") {
                    if (start) {
                        chrome.tabs.sendMessage(tab.id, {
                            type: "restart-cam",
                            countdown: result.countdown
                        });
                    } else {
                        chrome.tabs.sendMessage(tab.id, {
                            type: "restart-cam",
                            countdown: false,
                        });
                    }
                } else {
                    if (start) {
                        chrome.tabs.sendMessage(tab.id, {
                            type: "restart",
                            countdown: result.countdown
                        });
                    } else {
                        chrome.tabs.sendMessage(tab.id, {
                            type: "restart",
                            countdown: false,
                            camerapos: camerapos,
                            camerasize: camerasize
                        });
                    }
                }
            }
        })
    })
}

// Switch microphone input
function updateMicrophone(id, request) {
    // Save user preference for microphone device
    chrome.storage.sync.set({
        mic: request.id
    });
    // Check recording type
    if (recording) {
        if (recording_type == "camera-only") {
            // Send microphone device ID to the camera content script
            chrome.tabs.sendMessage(tab.id, {
                type: "update-mic",
                mic: request.id
            });
        } else {
            // Stop current microphone stream
            micstream.getTracks().forEach(function (track) {
                track.stop();
            });

            // Start a new microphone stream using the provided device ID
            chrome.tabs.getSelected(null, function (tab) {
                navigator.mediaDevices.getUserMedia({
                    audio: {
                        deviceId: id
                    }
                }).then(function (mic) {
                    micstream = mic;
                    micsource = audioCtx.createMediaStreamSource(mic);
                    micsource.connect(destination);
                }).catch(function (error) {
                    chrome.tabs.sendMessage(tab.id, {
                        type: "no-mic-access"
                    });
                });
            });
        }
    }
}

// Recording controls
function pauseRecording() {
    mediaRecorder.pause();

    // Get video duration so far
    chrome.storage.sync.get(['start'], function (result) {
        chrome.storage.sync.set({
            total: Date.now() - result.start
        });
    });
}

function resumeRecording() {
    mediaRecorder.resume();

    // New start time
    chrome.storage.sync.set({
        start: Date.now()
    });
}

function stopRecording(save) {
    tabid = 0;

    // Show default icon
    chrome.browserAction.setIcon({ path: "../assets/extension-icons/logo-32.png" });

    chrome.tabs.getSelected(null, function (tab) {
        // Check if recording has to be saved or discarded
        if (save == "stop" || save == "stop-save") {
            cancel = false;
        } else {
            cancel = true;
        }

        // Check if it's a desktop or tab recording (recording done in background script)
        if (recording_type != "camera-only") {
            mediaRecorder.stop();
        } else {
            recording = false;
            if (cancel) {
                chrome.tabs.sendMessage(tab.id, {
                    type: "stop-cancel"
                });
            } else {
                chrome.tabs.sendMessage(tab.id, {
                    type: "stop-save"
                });
            }
        }

        // Remove injected content
        chrome.tabs.sendMessage(tab.id, {
            type: "end"
        });
    });
}

// Get a list of the available audio devices
function getDeviceId() {
    audiodevices = [];
    navigator.mediaDevices.enumerateDevices().then(function (devices) {
        devices.forEach(function (device) {
            if (device.kind == "audioinput") {
                audiodevices.push({
                    label: device.label,
                    id: device.deviceId
                });
            }
        });
        chrome.runtime.sendMessage({ type: "audio-done", devices: audiodevices });
    });
}

// Mute/unmute microphone and system audio
function audioSwitch(source, enable) {
    if (recording_type != "camera-only") {
        // Start a new microphone stream if one doesn't exist already
        if (!micable) {
            chrome.tabs.getSelected(null, function (tab) {
                navigator.mediaDevices.getUserMedia({
                    audio: true
                }).then(function (mic) {
                    micable = true;
                    micstream = mic;
                    micsource = audioCtx.createMediaStreamSource(mic);
                    micsource.connect(destination);
                }).catch(function (error) {
                    chrome.tabs.sendMessage(tab.id, {
                        type: "no-mic-access"
                    });
                });
            });
        }
        if (source == "mic" && !enable && micable) {
            micsource.disconnect(destination);
        } else if (source == "mic" && enable && micable) {
            micsource.connect(destination);
        } else if (source == "tab" && !enable) {
            syssource.disconnect(destination);
        } else {
            syssource.connect(destination);
        }
    } else {
        chrome.tabs.getSelected(null, function (tab) {
            chrome.tabs.sendMessage(tab.id, {
                type: "mic-switch",
                enable: enable
            });
        });
    }
}

// Update camera device
function updateCamera(request) {
    chrome.tabs.getSelected(null, function (tab) {
        // Save user preference
        chrome.storage.sync.set({
            camera: request.id
        });

        // Send user preference to content script
        chrome.tabs.sendMessage(tab.id, {
            type: request.type,
            id: request.id
        });
    });
}

// Toggle push to talk
function pushToTalk(request, id) {
    chrome.tabs.getSelected(null, function (tab) {
        pushtotalk = request.enabled;

        // Send user preference to content script
        chrome.tabs.sendMessage(tab.id, {
            type: request.type,
            enabled: request.enabled
        });
    });
}



// Countdown is over / recording can start
function countdownOver() {
    if (recording_type == "camera-only") {

        if ($('#countdown').attr('checked')) {
            alert("Check box in Checked");
    
          } else {
            alert("Check box in unChecked");
    
          }

        chrome.tabs.getSelected(null, function (tab) {
            chrome.tabs.sendMessage(tab.id, {
                type: "camera-record"
            });
        });
    } else {
        if (!recording) {
            mediaRecorder.start(1000);
            recording = true;
        }
    }
}

// Inject content when tab redirects while recording
function pageUpdated(sender) {
    chrome.tabs.getSelected(null, function (tab) {
        if (sender.tab.id == tab.id) {
            if (recording && tab.id == tabid && recording_type == "tab-only") {
                injectContent(false)
                getDeviceId();
                tabid = 0;
            } else if (recording && recording_type == "desktop") {
                injectContent(false)
                getDeviceId();
                tabid = 0;
            }
            maintabs.splice(maintabs.indexOf(tabid), 1);
        }
    });
}

// Changed tab selection
chrome.tabs.onActivated.addListener(function (tabId, changeInfo, tab) {
    if (!recording) {
        // Hide injected content if the recording is already over
        chrome.tabs.getSelected(null, function (tab) {
            if (tab && tab.id) {
                chrome.tabs.sendMessage(tab.id, {
                    type: "end"
                });
            }
        
        });
    } else if (recording && recording_type == "desktop" && maintabs.indexOf(tabId) == -1) {
        // Inject content for entire desktop recordings (content should be on any tab)
        injectContent(false);
    }
});

chrome.tabs.onRemoved.addListener(function (tabid, removed) {
    // Stop recording if tab is closed in a camera only recording
    if (tabid == tabid && recording && recording_type == "camera-only") {
        recording = false;

        // Show default icon
        chrome.browserAction.setIcon({ path: "../assets/extension-icons/logo-32.png" });
        tabid = 0;
    }
})

// Keyboard shortcuts
chrome.commands.onCommand.addListener(function (command) {
    if (recording) {
        if (command == "stop") {
            stopRecording(command);
        } else if (command == "pause/resume") {
            chrome.tabs.getSelected(null, function (tab) {
                chrome.tabs.sendMessage(tab.id, {
                    type: "pause/resume"
                });
            });
        } else if (command == "cancel") {
            stopRecording(command);
        } else if (command == "mute/unmute" && !pushtotalk) {
            chrome.tabs.getSelected(null, function (tab) {
                chrome.tabs.sendMessage(tab.id, {
                    type: "mute/unmute"
                });
            });
        }
    }
});

// Listen for messages from content / popup
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.type == "record") {
            startRecording();
        } else if (request.type == "resume") {
        } else if (request.type == "pause") {
            pauseRecording();
            sendResponse({ success: true });
        } else if (request.type == "resume") {
            resumeRecording();
            sendResponse({ success: true });
        } else if (request.type == "stop-save") {
            if(recording_type == "tab-only" || recording_type == "desktop" ){
            stopRecording(request.type);
            } 
            else if (recording_type == "camera-only") {
            alert("Save");

            stopRecording(request.type);
            // saveRecording("file://" + '../html/videoeditor.html', recordedBlobs);

            }
        } else if (request.type == "stop-cancel") {
            stopRecording(request.type);
        } else if (request.type == "audio-request") {
            sendResponse({ devices: audiodevices });
        } else if (request.type == "update-mic") {
            updateMicrophone(request.id, request);
        } else if (request.type == "update-camera") {
            updateCamera(request);
        } else if (request.type == "audio-switch") {
            audioSwitch(request.source, request.enable);
        } else if (request.type == "camera-list") {
            chrome.tabs.getSelected(null, function (tab) {
                chrome.tabs.sendMessage(tab.id, {
                    type: request.type,
                    devices: request.devices,
                    audio: request.audio
                });
            });
        } else if (request.type == "flip-camera") {
            chrome.tabs.getSelected(null, function (tab) {
                chrome.tabs.sendMessage(tab.id, {
                    type: request.type,
                    enabled: request.enabled
                });
            });
        } else if (request.type == "push-to-talk") {
            pushtotalk(request);
        } else if (request.type == "switch-toolbar") {
            chrome.tabs.getSelected(null, function (tab) {
                chrome.tabs.sendMessage(tab.id, {
                    type: request.type,
                    enabled: request.enabled
                });
            });
        } else if (request.type == "countdown") {
            countdownOver();
        } else if (request.type == "recording-type") {
            recording_type = request.recording;
        } else if (request.type == "record-request") {
            sendResponse({ recording: recording });
        } else if (request.type == "pause-camera") {
            console.log(request.type);
        // alert("stream pause", request.type);

            chrome.tabs.getSelected(null, function (tab) {
                chrome.tabs.sendMessage(tab.id, {
                    type: "pause-camera"
                });
                
            });
            
        } else if (request.type == "resume-camera") {

            chrome.tabs.getSelected(null, function (tab) {
                chrome.tabs.sendMessage(tab.id, {
                    type: "resume-record"
                });
            });
        } else if (request.type == "no-camera-access") {
            chrome.tabs.getSelected(null, function (tab) {
                chrome.tabs.sendMessage(tab.id, {
                    type: "no-camera-access"
                });
            });
        } else if (request.type == "audio-check") {
            getDeviceId();
        } else if (request.type == "end-camera-recording") {
            recording = false;
            chrome.tabs.getSelected(null, function (tab) {
                chrome.tabs.sendMessage(tab.id, {
                    type: "end-recording"
                });
            });
            if (!request.cancel) {
                saveRecording("", request.blobs);
                // saveRecording("file://" + '../html/videoeditor.html', request.blobs);


            }
        } else if (request.type == "sources-loaded") {
            pageUpdated(sender);
        } else if (request.type == "camera-size") {
            camerasize = request.size;
        } else if (request.type == "camera-pos") {
            camerapos.x = request.x;
            camerapos.y = request.y;
        } else if (request.type == "test") {
            chrome.tabs.getSelected(null, function (tab) {
                chrome.tabs.sendMessage(tab.id, {
                    type: "hello"
                });
            });
        }
    }
);








//chrome Audio Capture Master

const extend = function() { //helper function to merge objects
    let target = arguments[0],
        sources = [].slice.call(arguments, 1);
    for (let i = 0; i < sources.length; ++i) {
      let src = sources[i];
      for (key in src) {
        let val = src[key];
        target[key] = typeof val === "object"
          ? extend(typeof target[key] === "object" ? target[key] : {}, val)
          : val;
      }
    }
    return target;
  };
  
  const WORKER_FILE = {
    wav: "WavWorker.js",
    mp3: "Mp3Worker.js"
  };
  
  // default configs
  const CONFIGS = {
    workerDir: "../workers/",     // worker scripts dir (end with /)
    numChannels: 2,     // number of channels
    encoding: "wav",    // encoding (can be changed at runtime)
  
    // runtime options
    options: {
      timeLimit: 1200,           // recording time limit (sec)
      encodeAfterRecord: true, // process encoding after recording
      progressInterval: 1000,   // encoding progress report interval (millisec)
      bufferSize: undefined,    // buffer size (use browser default)
  
      // encoding-specific options
      wav: {
        mimeType: "audio/wav"
      },
      mp3: {
        mimeType: "audio/mpeg",
        bitRate: 192            // (CBR only): bit rate = [64 .. 320]
      }
    }
  };
  
  class Recorder {
  
    constructor(source, configs) { //creates audio context from the source and connects it to the worker
      extend(this, CONFIGS, configs || {});
      this.context = source.context;
      if (this.context.createScriptProcessor == null)
        this.context.createScriptProcessor = this.context.createJavaScriptNode;
      this.input = this.context.createGain();
      source.connect(this.input);
      this.buffer = [];
      this.initWorker();
    }
  
    isRecording() {
      return this.processor != null;
    }
  
    setEncoding(encoding) {
      if(!this.isRecording() && this.encoding !== encoding) {
          this.encoding = encoding;
          this.initWorker();
      }
    }
  
    setOptions(options) {
      if (!this.isRecording()) {
        extend(this.options, options);
        this.worker.postMessage({ command: "options", options: this.options});
      }
    }
  
    startRecordingAudioOnly() {
      if(!this.isRecording()) {
        let numChannels = this.numChannels;
        let buffer = this.buffer;
        let worker = this.worker;
        this.processor = this.context.createScriptProcessor(
          this.options.bufferSize,
          this.numChannels, this.numChannels);
        this.input.connect(this.processor);
        this.processor.connect(this.context.destination);
        this.processor.onaudioprocess = function(event) {
          for (var ch = 0; ch < numChannels; ++ch)
            buffer[ch] = event.inputBuffer.getChannelData(ch);
          worker.postMessage({ command: "record", buffer: buffer });
        };
        this.worker.postMessage({
          command: "start",
          bufferSize: this.processor.bufferSize
        });
        this.startTime = Date.now();
      }
    }
  
    cancelRecording() {
      if(this.isRecording()) {
        this.input.disconnect();
        this.processor.disconnect();
        delete this.processor;
        this.worker.postMessage({ command: "cancel" });
      }
    }
  
    finishRecording() {
      if (this.isRecording()) {
        this.input.disconnect();
        this.processor.disconnect();
        delete this.processor;
        this.worker.postMessage({ command: "finish" });
      }
    }
  
    cancelEncoding() {
      if (this.options.encodeAfterRecord)
        if (!this.isRecording()) {
          this.onEncodingCanceled(this);
          this.initWorker();
        }
    }
  
    initWorker() {
      if (this.worker != null)
        this.worker.terminate();
      this.onEncoderLoading(this, this.encoding);
      this.worker = new Worker(this.workerDir + WORKER_FILE[this.encoding]);
      let _this = this;
      this.worker.onmessage = function(event) {
        let data = event.data;
        switch (data.command) {
          case "loaded":
            _this.onEncoderLoaded(_this, _this.encoding);
            break;
          case "timeout":
            _this.onTimeout(_this);
            break;
          case "progress":
            _this.onEncodingProgress(_this, data.progress);
            break;
          case "complete":
            _this.onComplete(_this, data.blob);
        }
      }
      this.worker.postMessage({
        command: "init",
        config: {
          sampleRate: this.context.sampleRate,
          numChannels: this.numChannels
        },
        options: this.options
      });
    }
  
    onEncoderLoading(recorder, encoding) {}
    onEncoderLoaded(recorder, encoding) {}
    onTimeout(recorder) {}
    onEncodingProgress(recorder, progress) {}
    onEncodingCanceled(recorder) {}
    onComplete(recorder, blob) {}
  
  }
  
  const audioCapture = (timeLimit, muteTab, format, quality, limitRemoved) => {
    chrome.tabCapture.capture({audio: true}, (stream) => { // sets up stream for capture
      let startTabId; //tab when the capture is started
      let timeout;
      let completeTabID; //tab when the capture is stopped
      let url = null; //resulting object when encoding is completed
      chrome.tabs.query({active:true, currentWindow: true}, (tabs) => startTabId = tabs[0].id) //saves start tab
      const liveStream = stream;
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      let mediaRecorder = new Recorder(source); //initiates the recorder based on the current stream
      mediaRecorder.setEncoding(format); //sets encoding based on options
      if(limitRemoved) { //removes time limit
        mediaRecorder.setOptions({timeLimit: 10800});
      } else {
        mediaRecorder.setOptions({timeLimit: timeLimit/1000});
      }
      if(format === "mp3") {
        mediaRecorder.setOptions({mp3: {bitRate: quality}});
      }
    mediaRecorder.startRecordingAudioOnly();
  
      function onStopCommand(command) { //keypress
        if (command === "stop") {
          stopCapture();
        }
      }
      function onStopClick(request) { //click on popup
        if(request === "stopCapture") {
          stopCapture();
        } else if (request === "cancelCapture") {
          cancelCapture();
        } else if (request.cancelEncodeID) {
          if(request.cancelEncodeID === startTabId && mediaRecorder) {
            mediaRecorder.cancelEncoding();
          }
        }
      }
      chrome.commands.onCommand.addListener(onStopCommand);
      chrome.runtime.onMessage.addListener(onStopClick);
      mediaRecorder.onComplete = (recorder, blob) => {
        url = window.URL.createObjectURL(blob);
        if(completeTabID) {
          chrome.tabs.sendMessage(completeTabID, {type: "encodingComplete", url});
        }
        mediaRecorder = null;
      }
      mediaRecorder.onEncodingProgress = (recorder, progress) => {
        if(completeTabID) {
          chrome.tabs.sendMessage(completeTabID, {type: "encodingProgress", progress: progress});
        }
      }
  
      const stopCapture = function() {
        let endTabId;
        //check to make sure the current tab is the tab being captured
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
          endTabId = tabs[0].id;
          if(mediaRecorder && startTabId === endTabId){
            mediaRecorder.finishRecording();
            chrome.tabs.create({url: "../html/videoeditor.html"}, (tab) => {
              completeTabID = tab.id;
              alert("saving...");
              let completeCallback = () => {
                chrome.tabs.sendMessage(tab.id, {type: "audio", format: format, url, startID: startTabId});
              }
              setTimeout(completeCallback, 500);
            });
            closeStream(endTabId);
          }
        })
      }
  
      const cancelCapture = function() {
        let endTabId;
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
          endTabId = tabs[0].id;
          if(mediaRecorder && startTabId === endTabId){
            mediaRecorder.cancelRecording();
            closeStream(endTabId);
          }
        })
      }
  
  //removes the audio context and closes recorder to save memory
      const closeStream = function(endTabId) {
        chrome.commands.onCommand.removeListener(onStopCommand);
        chrome.runtime.onMessage.removeListener(onStopClick);
        mediaRecorder.onTimeout = () => {};
        audioCtx.close();
        liveStream.getAudioTracks()[0].stop();
        sessionStorage.removeItem(endTabId);
        chrome.runtime.sendMessage({captureStopped: endTabId});
      }
  
      mediaRecorder.onTimeout = stopCapture;
  
      if(!muteTab) {
        let audio = new Audio();
        audio.srcObject = liveStream;
        audio.play();
      }
    });
  }
  
  
  
  //sends reponses to and from the popup menu
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.currentTab && sessionStorage.getItem(request.currentTab)) {
      sendResponse(sessionStorage.getItem(request.currentTab));
    } else if (request.currentTab){
      sendResponse(false);
    } else if (request === "startCapture") {
      startCapture();
    }
  });
  
  const startCapture = function() {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      // CODE TO BLOCK CAPTURE ON YOUTUBE, DO NOT REMOVE
      // if(tabs[0].url.toLowerCase().includes("youtube")) {
      //   chrome.tabs.create({url: "error.html"});
      // } else {
        if(!sessionStorage.getItem(tabs[0].id)) {
          sessionStorage.setItem(tabs[0].id, Date.now());
          chrome.storage.sync.get({
            maxTime: 1200000,
            muteTab: false,
            format: "mp3",
            quality: 192,
            limitRemoved: false
          }, (options) => {
            let time = options.maxTime;
            if(time > 1200000) {
              time = 1200000
            }
            audioCapture(time, options.muteTab, options.format, options.quality, options.limitRemoved);
          });
          chrome.runtime.sendMessage({captureStarted: tabs[0].id, startTime: Date.now()});
        }
      // }
    });
  };
  
  
  chrome.commands.onCommand.addListener((command) => {
    if (command === "start") {
      startCapture();
    }
  });
  
