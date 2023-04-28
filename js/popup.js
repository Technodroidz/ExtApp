// let myVariable = "mp3";
// var myId ='#onlyaudio';

// chrome.storage.local.set({[myId]: myVariable}, function() {
//   console.log('Variable stored with ID:', myId);
// });    

// chrome.runtime.sendMessage(
//     {message : "I am a content script"},
//     (response) => {
//         console.log(response.message);
//     }
// );


$(document).ready(function () {
    var recording = false;

    // Set up custom dropdowns
    $("#camera-select").niceSelect();
    $("#mic-select").niceSelect();
    // $('#onlyaudio').niceSelect();
    // $('.selectAll').niceSelect();

    // Get default settings (set by the user)
    chrome.storage.sync.get(null, function (result) {
        if (!result.toolbar) {
            $("#persistent").prop("checked", true);
        }
        if (result.flip) {
            $("#flip").prop("checked", true);
        }
        if (result.pushtotalk) {
            $("#push").prop("checked", true);
        }
        if (result.countdown) {
            $("#countdown").prop("checked", true);
        }
        //only for audio
        // if (result.onlyaudio) {
        //     $("#onlyaudio").prop("checked", false);  
        // }
        if (result.countdown_time != 3) {
            $("#countdown-time").html(result.countdown_time + " ");
        }
        if (result.quality == "max") {
            $("#quality").html(chrome.i18n.getMessage("smaller_file_size"));
        } else {
            $("#quality").html(chrome.i18n.getMessage("highest_quality"))
        }
        if (result.fps == "60") {
            $("#fps").html("30FPS video");
        } else {
            $("#fps").html("60FPS video")
        } //format-select = mp3
        // if (result.format-select == "mp3") {
        //     $("#format-select").val(result.mp3).select('update');
        // } 

        if ($(".type-active").attr("id") == "tab-only") {
            $(".type-active").find("img").attr("src", chrome.extension.getURL('./assets/images/popup/tab-only.svg'));
        } else if ($(".type-active").attr("id") == "desktop") {
            $(".type-active").find("img").attr("src", chrome.extension.getURL('./assets/images/popup/desktop.svg'));
        } else if ($(".type-active").attr("id") == "camera-only") {
            $(".type-active").find("img").attr("src", chrome.extension.getURL('./assets/images/popup/camera-only.svg'));
        }
        $(".type-active").removeClass("type-active");
        $("#" + result.type).addClass("type-active");
        if ($("#" + result.type).attr("id") == "tab-only") {
            $("#" + result.type).find("img").attr("src", chrome.extension.getURL('./assets/images/popup/tab-only-active.svg'));
        } else if ($("#" + result.type).attr("id") == "desktop") {
            $("#" + result.type).find("img").attr("src", chrome.extension.getURL('./assets/images/popup/desktop-active.svg'));
        } else if ($("#" + result.type).attr("id") == "camera-only") {
            $("#" + result.type).find("img").attr("src", chrome.extension.getURL('./assets/images/popup/camera-only-active.svg'));
        }
    });

    // Start recording
    function record() {
        if (!recording) {
            chrome.runtime.sendMessage({ type: "record" });
            $("#record").html(chrome.i18n.getMessage("starting_recording"));
        } else {
            recording = false;
            $("#record").html(chrome.i18n.getMessage("start_recording"));
            chrome.runtime.sendMessage({ type: "stop-save" });
            window.close();
        }
    }

    // Request extension audio access if website denies it (for background)
    function audioRequest() {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
            var audiodevices = [];
            navigator.mediaDevices.enumerateDevices().then(function (devices) {
                devices.forEach(function (device) {
                    if (device.kind == "audioinput") {
                        audiodevices.push({ label: device.label, id: device.deviceId });
                    }
                });
                getAudio(audiodevices);
            });
        }).catch(function (error) {
            $("#mic-select").html("<option value='disabled'>" + chrome.i18n.getMessage("disabled_allow_access") + "</option>");
        });
    }


    // Get available audio devices
    function getAudio(audio) {
        $("#mic-select").html("<option value='disabled'>" + chrome.i18n.getMessage("disabled") + "</option>");
        audio.forEach(function (device) {
            if (device.label == "Disabled") {
                $("#mic-select").append("<option value='" + device.id + "'>" + chrome.i18n.getMessage("disabled") + "</option>");
            } else {
                $("#mic-select").append("<option value='" + device.id + "'>" + device.label + "</option>");
            }
        });
        $("#mic-select").niceSelect('update');
        chrome.storage.sync.get(['mic'], function (result) {
            if (result.mic != 0) {
                $('#mic-select').val(result.mic).niceSelect('update');
            } else {
                $('#mic-select').val($("#mic-select option:nth-child(2)").val()).niceSelect('update');
                chrome.runtime.sendMessage({ type: "update-mic", id: $("#mic-select").val() });
            }
        });

        $("#mic-select2").html("<option value='disabled'>" + chrome.i18n.getMessage("disabled") + "</option>");
        audio.forEach(function (device) {
            if (device.label == "Disabled") {
                $("#mic-select2").append("<option value='" + device.id + "'>" + chrome.i18n.getMessage("disabled") + "</option>");
            } else {
                $("#mic-select2").append("<option value='" + device.id + "'>" + device.label + "</option>");
            }
        });
        $("#mic-select2").niceSelect('update');
        chrome.storage.sync.get(['mic'], function (result) {
            if (result.mic != 0) {
                $('#mic-select2').val(result.mic).niceSelect('update');
            } else {
                $('#mic-select2').val($("#mic-select2 option:nth-child(2)").val()).niceSelect('update');
                chrome.runtime.sendMessage({ type: "update-mic", id: $("#mic-select2").val() });
            }
        });
    }

    // Get available camera devices
    function getCamera(camera) {
        $("#camera-select").html("<option value='disabled'>" + chrome.i18n.getMessage("disabled") + "</option>");
        camera.forEach(function (device) {
            if (device.label == "Disabled") {
                $("#camera-select").append("<option value='" + device.id + "'>" + chrome.i18n.getMessage("disabled") + "</option>");
            } else {
                $("#camera-select").append("<option value='" + device.id + "'>" + device.label + "</option>");
            }
        });
        $("#camera-select").niceSelect('update');
        chrome.storage.sync.get(['camera'], function (result) {
            if (result.camera != 0 && result.camera != "disabled-access") {
                $('#camera-select').val(result.camera).niceSelect('update');
                if ($(".type-active").attr("id") == "camera-only" && $("#camera-select").val() == "disabled") {
                    $("#record").addClass("record-disabled");
                } else {
                    $("#record").removeClass("record-disabled");
                }
            } else {
                $('#camera-select').val($("#camera-select option:nth-child(2)").val()).niceSelect('update');
                chrome.runtime.sendMessage({ type: "update-camera", id: $("#camera-select").val() });
            }
        });
    }

    // Get available camera devices
    chrome.tabs.getSelected(null, function (tab) {
        chrome.tabs.sendMessage(tab.id, {
            type: "camera-request"
        });
    });

    // Check if recording is ongoing
    chrome.runtime.sendMessage({ type: "record-request" }, function (response) {
        recording = response.recording;
        if (response.recording) {
            $("#record").html(chrome.i18n.getMessage("stop_recording"));
            $("#record").addClass("record-stop");
        }
    });

    // Check if current tab is unable to be recorded
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
        if (tabs[0].url.includes("chrome://") || tabs[0].url.includes("chrome-extension://") || tabs[0].url.includes("chrome.com") || tabs[0].url.includes("chrome.google.com")) {
            $("#record").addClass("record-disabled");
            $("#record").html(chrome.i18n.getMessage("cannot_record"));
        }
    });

    // Modify settings
    $("#flip").on("change", function () {
        chrome.storage.sync.set({ flip: this.checked });
        chrome.runtime.sendMessage({ type: "flip-camera", enabled: this.checked });
    });
    $("#push").on("change", function () {
        chrome.storage.sync.set({ pushtotalk: this.checked });
        chrome.runtime.sendMessage({ type: "push-to-talk", enabled: this.checked });
    });
    $("#countdown").on("change", function () {
        chrome.storage.sync.set({ countdown: this.checked });
    });
    $("#persistent").on("change", function () {
        chrome.storage.sync.set({ toolbar: !this.checked });
        chrome.runtime.sendMessage({ type: "switch-toolbar", enabled: !this.checked });
    });
    //write code for audio only
    // $("#onlyaudio").on("change", function(){
    //     chrome.storage.sync.set({onlyaudio: this.checked});
    //     chrome.runtime.sendMessage({type: "only-audio", enabled:this.checked});
    // });
    $("#camera-select").on("change", function () {
        chrome.runtime.sendMessage({ type: "update-camera", id: $("#camera-select").val() });
        if ($(".type-active").attr("id") == "camera-only" && ($("#camera-select").val() == "disabled" || $("#camera-select").val() == "disabled-access")) {
            $("#record").addClass("record-disabled");
        } else {
            $("#record").removeClass("record-disabled");
        }
    });
    $("#mic-select").on("change", function () {
        chrome.runtime.sendMessage({ type: "update-mic", id: $("#mic-select").val() });
    });

    // Change recording area
    $(document).on("click", ".type:not(.type-active)", function () {
        if ($(".type-active").attr("id") == "tab-only") {
            $(".type-active").find("img").attr("src", chrome.extension.getURL('./assets/images/popup/tab-only.svg'));
        } else if ($(".type-active").attr("id") == "desktop") {
            $(".type-active").find("img").attr("src", chrome.extension.getURL('./assets/images/popup/desktop.svg'));
        } else if ($(".type-active").attr("id") == "camera-only") {
            $(".type-active").find("img").attr("src", chrome.extension.getURL('./assets/images/popup/camera-only.svg'));
        }
        $(".type-active").removeClass("type-active");
        $(this).addClass("type-active");
        if ($(".type-active").attr("id") == "camera-only" && ($("#camera-select").val() == "disabled" || $("#camera-select").val() == "disabled-access")) {
            $("#record").addClass("record-disabled");
        } else {
            $("#record").removeClass("record-disabled");
        }
        if ($(this).attr("id") == "tab-only") {
            $(this).find("img").attr("src", chrome.extension.getURL('./assets/images/popup/tab-only-active.svg'));
        } else if ($(this).attr("id") == "desktop") {
            $(this).find("img").attr("src", chrome.extension.getURL('./assets/images/popup/desktop-active.svg'));
        } else if ($(this).attr("id") == "camera-only") {
            $(this).find("img").attr("src", chrome.extension.getURL('./assets/images/popup/camera-only-active.svg'));
        }
        chrome.runtime.sendMessage({ type: "recording-type", recording: $(".type-active").attr("id") });
        chrome.storage.sync.set({ type: $(".type-active").attr("id") });
    });

    // Start recording
    $("#record").on("click", function () {
        record();
    });

    // Show more dropdown
    $("#more").on("click", function (e) {
        if ($("#more-select").hasClass("countactive")) {
            $("#more-select").removeClass("countactive");
        } else {
            $("#more-select").addClass("countactive");
        }
    });

    // Show awards overlay (temporary event)
    $("#awards").on("click", function (e) {
        if ($("#awards-open").hasClass("countactive")) {
            $("#awards-open").removeClass("countactive");
        } else {
            $("#awards-open").addClass("countactive");
        }
    });

    // Show countdown dropdown
    $("#count-select").on("click", function (e) {
        e.preventDefault();
        if ($("#countdown-select").hasClass("countactive")) {
            $("#countdown-select").removeClass("countactive");
        } else {
            $("#countdown-select").addClass("countactive");
        }
    });

    // Change countdown time
    $(".countdown").on("click", function () {
        $("#count-select").html($(this).html().slice(0, -1));
        chrome.storage.sync.set({ countdown_time: parseInt($(this).html().slice(0, -1)) });
        $("#countdown-select").removeClass("countactive");
    })

    // Hide countdown dropdown when clicking anywhere but the dropdown
    $(document).on("click", function (e) {
        if (!$("#countdown-select").is(e.target) && $("#countdown-select").has(e.target).length === 0 && !$("#count-select").is(e.target) && $("#count-select").has(e.target).length === 0) {
            $("#countdown-select").removeClass("countactive");
        }
        if (!$("#more-select").is(e.target) && $("#more-select").has(e.target).length === 0 && !$("#more").is(e.target) && $("#more").has(e.target).length === 0) {
            $("#more-select").removeClass("countactive");
        }
        if (!$("#awards-open").is(e.target) && $("#awards-open").has(e.target).length === 0 && !$("#awards").is(e.target) && $("#awards").has(e.target).length === 0) {
            $("#awards-open").removeClass("countactive");
        }
    })

    // Go to the shortcuts page in Chrome (workaround, chrome:// links are a local resource so they can't be triggered via a normal link)
    $("#shortcuts").on("click", function (e) {
        chrome.tabs.create({
            url: "chrome://extensions/shortcuts"
        });
    })

    // Higher quality or smaller file size for the recording
    $("#quality").on("click", function (e) {
        chrome.storage.sync.get(['quality'], function (result) {
            if (result.quality == "max") {
                chrome.storage.sync.set({
                    quality: "min"
                });
                $("#quality").html(chrome.i18n.getMessage("highest_quality"));
            } else {
                chrome.storage.sync.set({
                    quality: "max"
                });
                $("#quality").html(chrome.i18n.getMessage("smaller_file_size"));
            }
        });
    });

    // Higher or lower FPS for the recording
    $("#fps").on("click", function (e) {
        chrome.storage.sync.get(['fps'], function (result) {
            if (result.fps == "60") {
                chrome.storage.sync.set({
                    fps: "30"
                });
                $("#fps").html("60FPS video");
            } else {
                chrome.storage.sync.set({
                    fps: "60"
                });
                $("#fps").html("30FPS video");
            }
        });
    });


    var newwindow = null;
    function saveRecordingAudio(url, blobs) {
        newwindow = window.open('../html/videoeditor.html');
        newwindow.url = url;
        newwindow.recordedBlobs = blobs;
        newwindow.type = 'audio';


    }

    document.addEventListener('DOMContentLoaded', function () {
        var enableButton = document.getElementById('enable-extension');
        enableButton.addEventListener('click', function () {
            var thisButton = this;
            var disable = thisButton.innerText == "Disable" ? true : false;
            thisButton.innerText = disable ? 'Enable' : 'Disable';
            chrome.storage.sync.set({ disabled: disable });
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { disabled: disable });
            });
        });
    });


    // format-select-onlyaudio
    // function formatonlyaudio() {

    //     chrome.runtime.sendMessage({ type: "format" }, function (result) {
    //         var format;
    //         format = result.format;
    //         if (result.format) {
    //             $("#format_sel").html(chrome.i18n.getMessage("mp3"));
    //         }
    //         console.log('format', format)

    //     });
    // }

    // chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    //     var myTabId = tabs[0].id;
    //     chrome.tabs.sendMessage(myTabId, {text: "hi"}, function(result) {
    //         alert('fine alert',myTabId);
    //     });
    // });









    // $("#onlyaudio").on('change', function () {
    // $(document).ready(function () {
        // $('#update').click(function(){
        // $('#onlyaudio').niceSelect();
        const selectAudio = document.querySelector('#onlyaudio');
        const startCapture = document.querySelector('#start');

        const audiobtnrecord1 = document.querySelector('#audiorecording');
        const audiobtnrecord = document.querySelector('#audiobtnrecord');
        const recordbtnstop2 = document.querySelector('#recordbtnstop');
        const tabaudiodiv = document.querySelector('#tabaudiodiv');

        const hidevideoalltab = document.querySelector('#hidevideotab');
        const showvideoalltab = document.querySelector('#showvideotab');
        const tab1 = document.querySelector('.hideOnAudio');
        const hidebodyab = document.querySelector('.hidebody');



        let timerRunning = false;
        let counter = 0;
        let timerInt;

        const timer = document.getElementById('timerNew');
        const timeRem = document.getElementById('timeRem');


        // hidevideoalltab.addEventListener("click", function() {
        //     $("#mic-label2").show();
        //     $('#audiorecording').show();
        //     $("#onlyaudio").show();
        //     // $("#start").hide(); 
        //     // stopTimer();
        //     // $("#timerNew").hide();

            



        //     // Check if the value of the select element is equal to "micro"
        //     if (selectAudio.value == "micro") {
        //         alert("a");
        //       // Display the additional div
        //       $("#mic-label2").show();
        //         $('#audiorecording').show();
        //         $("#start").hide(); 


        //     }else if (selectAudio.value === "tabaudio") {

        //         alert("b");

        //         $("#start").show(); 

        //     }
        //     const selectedValue = selectAudio.value;
        //     const selectedDiv = document.getElementById(selectedValue + "Div");
        //     selectedDiv.style.display = "block";
        //   });

        if (selectAudio) {
            selectAudio.addEventListener("change", (event) => {
            
            if (event.target.value == 'micro') {
                
                $("#mic-label2").show();
                audiobtnrecord.addEventListener('click', function () {
                $("#audiobtnrecord").show();
                    startTimer();
                    $("#timerNew").show();
                    $("#micRecCancel").show();

                    timeRem.style.display = "none";
                    // $("#timeRem").hide();


                });
            } else if (event.target.value === 'tabaudio') {
                stopTimer();
                $("#timerNew").hide();
               



            }
        });
    }


        function startTimer() {
            if (!timerRunning) {
                timerRunning = true;
                timerInt = setInterval(function () {
                    counter++;
                    timer.innerText = `Timer: ${counter} seconds`;
                }, 1000);
            }
        }

        function stopTimer() {
            if (timerRunning) {
                timerRunning = false;
                clearInterval(timerInt);
                counter = 0;
                timer.innerText = '';
            }
        }

        if (hidevideoalltab) {
                    hidevideoalltab.addEventListener('click', () => {
            
            // showselected();

             // tab1.style.display = 'none'; 
            $(tab1).hide(1000);
            // $("#mic-label2").style.display = "block"; //not working
            hidebodyab.style.display = 'none';
            $("#more").hide();

            // $("#camera-select-label").style.display = 'none';          
            // $("#camera-select").style.display = 'none';      
            // $("#flip-label").style.display = 'none';          
            // $("#push").style.display = 'none';   
            // $("#push-label").style.display = 'none';         
        });

         }
         if (showvideoalltab) { 
            showvideoalltab.addEventListener('click', () => {
                // tab1.style.display = 'inline-block';
                $(tab1).show(1000);
                $("#more").show();

                hidebodyab.style.display = 'block';
            });
         }


       
         var audioTab = document.getElementById("hidevideotab");
         if (audioTab) {
         audioTab.addEventListener("click", function() {
         var micLabel2Div = document.getElementById("mic-label2");
         if (micLabel2Div) {
             micLabel2Div.style.display = "block";
            }

         var recordDiv = document.getElementById("audiorecording");
         recordDiv.style.display = "block";

          

        // $("#audiobtnrecord").show();  
        var startRecord = document.getElementById("audiobtnrecord");   
        startRecord.addEventListener('click', async () => {

            
            var saveDiv = document.getElementById("recordbtnstop");
            saveDiv.style.display = "block";
    
                startTimer();
                $("#timerNew").show();
                $("#micRecCancel").show();
               // $("#stopbtnwidth").show();

                timeRem.style.display = "none";
                // $("#timeRem").hide();

                const cancelButton = document.getElementById('cancel');
                var btnStart = document.querySelector('button[name="record"]');
                var btnStop = document.querySelector('button[name="stop"]');
                var btnCancel = document.querySelector('button[name="micRecCancel"]');
                var audio = document.querySelector('#audio');
                const audioCtx = new AudioContext();
                const destination = audioCtx.createMediaStreamDestination();  
                    

                // btnStart.addEventListener('click', async () => {
                    await navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(function (stream) {
                        var audiodevices = [];
                        navigator.mediaDevices.enumerateDevices().then(function (devices) {
                            devices.forEach(function (device) {
                                if (device.kind == "audioinput") {
                                    audiodevices.push({ label: device.label, id: device.deviceId });
                                    console.log(audiodevices);
                                }
                                chrome.runtime.sendMessage({ type: "audio-done", devices: audiodevices });
                                // chrome.runtime.sendMessage({type: "format_sel"});
                                // $("#format_sel").html("<select><option value='mp4'>"+'MP4'+"</option></select>");

                            });
                            getAudio(audiodevices);
                        });


                        output = new MediaStream();
                        syssource = audioCtx.createMediaStreamSource(stream);
                        console.log('syssource', syssource);
                        // output.addTrack(destination.stream.getAudioTracks()[0]);

                        // output.addTrack(stream.getVideoTracks()[0]);



                        let mediaRecorder = new MediaRecorder(stream);
                        mediaRecorder.start();
                        timerRunning = true;
                        var recordedBlobs = [];
                        mediaRecorder.ondataavailable = (e) => {
                            recordedBlobs.push(e.data);
                            console.log("chunks", recordedBlobs);
                            console.log("e-daata", e.data);

                        }

                        // btnStart.textContent = 'Stop Record';



                        $("#audioplayer").hide();
                        $("#audiorecording").hide();
                        $("#recordbtnstop").show();





                        //function to catch error
                        mediaRecorder.onerror = (e) => {
                            alert(e.error);
                        }

                        mediaRecorder.onstop = (e) => {

                            let blob = new Blob(recordedBlobs, { mimeType: "audio/mp3" });


                            //create url for audio
                            let url = URL.createObjectURL(blob);
                            //pass url into audio tag
                            audio.src = url;
                            console.log("blod size", blob);
                            // console.log("blod size", audio.src);
                            //  let size = blob.size;   
                        }
                        btnStop.addEventListener('click', () => {

                            mediaRecorder.stop();
                            stopTimer();
                            // $("#audioplayer").show();
                            $("#recordbtnstop").hide();

                            saveRecordingAudio("file://" + '../html/videoeditor.html', recordedBlobs);

                        });

                        btnCancel.addEventListener("click", () => {
                            // mediaRecorder.stop();
                            stopTimer();
                            $("#timerNew").hide();
                        })



                    }).catch(function (error) {
                        $("#mic-select").html("<option value='disabled'>" + chrome.i18n.getMessage("disabled_allow_access") + "</option>");
                    });

                // })


            });
             
           
         });

        }
        
        if (selectAudio) {
            
        selectAudio.addEventListener('change', (event) => {

            if (event.target.value === 'micro') {

                // alert($(this).find('option:selected').attr('value'));
                //  $(".hideOnAudio").hide();
                //  $("#timer").show();

                $("#audiobtnrecord").show();
                audiobtnrecord1.style.display = 'block';
                recordbtnstop2.style.display = 'none';
                tabaudiodiv.style.display = 'none';
                $(timeRem).hide();


                const cancelButton = document.getElementById('cancel');
                var btnStart = document.querySelector('button[name="record"]');
                var btnStop = document.querySelector('button[name="stop"]');
                var btnCancel = document.querySelector('button[name="micRecCancel"]');
                var audio = document.querySelector('#audio');
                const audioCtx = new AudioContext();
                const destination = audioCtx.createMediaStreamDestination();

                // $("micRecCancel").addEventListener("click", () => {
                // $("#audiobtnrecord").show();
                // btnStop.hide();
                // $("#micRecCancel").hide();

                // });


                btnStart.addEventListener('click', async () => {
                    await navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(function (stream) {
                        var audiodevices = [];
                        navigator.mediaDevices.enumerateDevices().then(function (devices) {
                            devices.forEach(function (device) {
                                if (device.kind == "audioinput") {
                                    audiodevices.push({ label: device.label, id: device.deviceId });
                                    console.log(audiodevices);
                                }
                                chrome.runtime.sendMessage({ type: "audio-done", devices: audiodevices });
                                // chrome.runtime.sendMessage({type: "format_sel"});
                                // $("#format_sel").html("<select><option value='mp4'>"+'MP4'+"</option></select>");

                            });
                            getAudio(audiodevices);
                        });


                        output = new MediaStream();
                        syssource = audioCtx.createMediaStreamSource(stream);
                        console.log('syssource', syssource);
                        // output.addTrack(destination.stream.getAudioTracks()[0]);

                        // output.addTrack(stream.getVideoTracks()[0]);



                        let mediaRecorder = new MediaRecorder(stream);
                        mediaRecorder.start();
                        timerRunning = true;
                        var recordedBlobs = [];
                        mediaRecorder.ondataavailable = (e) => {
                            recordedBlobs.push(e.data);
                            console.log("chunks", recordedBlobs);
                            console.log("e-daata", e.data);

                        }

                        // btnStart.textContent = 'Stop Record';



                        $("#audioplayer").hide();
                        $("#audiorecording").hide();
                        $("#recordbtnstop").show();





                        //function to catch error
                        mediaRecorder.onerror = (e) => {
                            alert(e.error);
                        }

                        mediaRecorder.onstop = (e) => {

                            let blob = new Blob(recordedBlobs, { mimeType: "audio/mp3" });


                            //create url for audio
                            let url = URL.createObjectURL(blob);
                            //pass url into audio tag
                            audio.src = url;
                            console.log("blod size", blob);
                            // console.log("blod size", audio.src);
                            //  let size = blob.size;   
                        }
                        btnStop.addEventListener('click', () => {

                            mediaRecorder.stop();
                            // $("#audioplayer").show();
                            $("#recordbtnstop").hide();

                            saveRecordingAudio("file://" + '../html/videoeditor.html', recordedBlobs);

                        });

                        btnCancel.addEventListener("click", () => {
                            // mediaRecorder.stop();
                            stopTimer();
                            $("#timerNew").hide();
                        })



                    }).catch(function (error) {
                        $("#mic-select").html("<option value='disabled'>" + chrome.i18n.getMessage("disabled_allow_access") + "</option>");
                    });

                })

            } else if (event.target.value === 'tabaudio') {  //select element brackt

                audiobtnrecord1.style.display = 'none';
                recordbtnstop2.style.display = 'none';
                $("#mic-label2").hide();
                $("#micRecCancel").hide();
                // tabaudiodiv.style.display = 'block';
                // timerMicro.style.display = 'none';
                // $("#timer").hide()

                $("#tabaudiodiv").show();
                timeRem.style.display = 'none';

                startCapture.addEventListener('click', function () {

                    $(timeRem).show();
                    $(startCapture).show();


                });
                $("#cancel").onclick, (function () {
                    // $(timeRem).hide(1000);
                    timeRem.style.display = 'none';
                    tabaudiodiv.style.display = 'none';
                    startCapture.style.display = "block";
                    // $(timeRem).hide();



                    // $(tabaudiodiv).hide(1000);

                });

            } else if (event.target.value === 'tabaudio' && event.target.value === 'micro') {  //select element brackt
                audiobtnrecord1.style.display = 'none';
                recordbtnstop2.style.display = 'none';
                tabaudiodiv.style.display = 'none';



            } else {

            }

        });
    }


    // });

        // const tabmicrophone = document.getElementById('tabmicrophone');
        const startButtontab = document.getElementById('startButtontab');
        const stopButtontab = document.getElementById('stopButtontab');
        var audio = document.querySelector('#audio');



    function saveRecordingCanvas(url, blobs) {
        newwindow = window.open('../html/videoeditor.html');
        newwindow.url = url;
        newwindow.recordedBlobs = blobs;
        newwindow.type = 'video';


    }


// const canvasRecord = document.querySelector('#startRecordingss');
// const stopcanvasRecord = document.querySelector('#stopRecordingss');

// Define variables to store the selected area
// let x, y, width, height;
// let isDragging = false;
// let startX = 0;
// let startY = 0;
// let endX = 0;
// let endY = 0;

// Add event listener to Select Area button
// document.getElementById('select-area').addEventListener('click', function() {
//       // Show custom area selection tool
//   let canvas = document.createElement('canvas');
// 		canvas.id = "myCanvas";
// 		document.body.appendChild(canvas);
//   canvas.style.position = 'fixed';
//   canvas.style.top = '0';
//   canvas.style.left = '0';
//   canvas.style.width = '100%';
//   canvas.style.height = '100%';
//   canvas.style.zIndex = '9999';
//   document.body.appendChild(canvas);

//   let context = canvas.getContext('2d');
//   context.fillStyle = 'white';
//   context.fillRect(0, 0, canvas.width, canvas.height);

// //   let startX, startY;

//   canvas.addEventListener('mousedown', function(event) {
    
//     console.log("mousedown", event);
//     startX = event.clientX;
//     startY = event.clientY;
//     isDragging = true;
//     startRecordingTab(x, y, width, height);

//   });

//   canvas.addEventListener('mousemove', (event) => {
//     if (isDragging) {
//       endX = event.clientX;
//       endY = event.clientY;
  
//       // Clear the canvas
//       context.clearRect(0, 0, canvas.width, canvas.height);
  
//       // Draw the video frames onto the canvas
//     //   context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
//       // Draw the rectangle
//       const width = endX - startX;
//       const height = endY - startY;
//       context.strokeStyle = 'red';
//       context.strokeRect(startX, startY, width, height);
//     }
//   });

// //   canvas.addEventListener('mouseup', function(event) {
// //     console.log("mouseup", event);
// //     let endX = event.clientX;
// //     let endY = event.clientY;
// //     x = Math.min(startX, endX);
// //     y = Math.min(startY, endY);
// //     width = Math.abs(startX - endX);
// //     height = Math.abs(startY - endY);
// //     canvas.parentNode.removeChild(canvas);
// //     startRecordingCanvas();
// //   });

// canvas.addEventListener('mouseup', () => {
//     isDragging = false;
//     x = Math.min(startX, endX);
//     y = Math.min(startY, endY);
//     width = Math.abs(startX - endX);
//     height = Math.abs(startY - endY);
//     canvas.parentNode.removeChild(canvas);
//     // startRecordingCanvas();

//   });

//   document.body.appendChild(canvas);

// });


  
  
  
  
  





// canvasRecord.addEventListener('click', function() {
    function startRecordingCanvas__() {

    // Get the display media (screen or tab or window)
    //       displaySurface: "application",
navigator.mediaDevices.getDisplayMedia({video:true, audio:true, resizeMode: "crop-and-scale",cursor: "always"}).then(stream => {

    // Create a new MediaRecorder object
    let mediaRecorder = new MediaRecorder(stream);
  
    // Create a list to store the recorded chunks
    let recordedBlobs = [];
  
    // Start recording
    mediaRecorder.start();
  
    // Listen for dataavailable event
    mediaRecorder.addEventListener('dataavailable', event => {
        recordedBlobs.push(event.data);
      console.log("chunks", recordedBlobs);
    });
  
    // Stop recording after 10 seconds
    setTimeout(() => {
      mediaRecorder.stop();
      stream.getVideoTracks()[0].stop();
    }, 10000);
  
    // Listen for stop event (when recording is finished)
    mediaRecorder.addEventListener('stop', () => {
  
      // Create a new blob from the recorded chunks
      let blob = new Blob(recordedBlobs, { type: 'video/webm' });
  
      // Create a URL for the blob
      let url = URL.createObjectURL(blob);
  
      // Create a video element and set its source to the recorded video
      let video = document.createElement('video');
      video.src = url;
      video.onloadedmetadata = () => {
          // Set the canvas size to the video size
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

         // Draw the video frames onto the canvas
  setInterval(() => {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
    }, 16);
      };
      video.play();
    //   saveRecordingCanvas("file://" + '../html/videoeditor.html', recordedBlobs);

  
      // Append the video element to the document body
    //   document.body.appendChild(video);
      stopcanvasRecord.addEventListener('click',function(){
        saveRecordingCanvas("file://" + '../html/videoeditor.html', recordedBlobs);

      });
    });
  
  }).catch(error => {
    console.error(error);
  });
  
  };
  
  















    // Receive messages
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.type == "loaded") {
            window.close();
        } else if (request.type == "sources") {
            getCamera(request.devices);

            // Allow user to start recording
            if (!recording) {
                $("#record").html(chrome.i18n.getMessage("start_recording"));
            }
            $("#record").removeClass("record-disabled");
        } else if (request.type == "sources-audio") {
            getAudio(request.devices);

            // Allow user to start recording
            if (!recording) {
                $("#record").html(chrome.i18n.getMessage("start_recording"));
            }
            $("#record").removeClass("record-disabled");
        } else if (request.type == "sources-noaccess") {
            $("#camera-select").html("<option value='disabled-access'>" + chrome.i18n.getMessage("disabled_allow_access") + "</option>");
            $("#camera-select").niceSelect('update');
            chrome.storage.sync.set({
                camera: "disabled-access"
            });

            // Allow user to start recording
            if (!recording) {
                $("#record").html(chrome.i18n.getMessage("start_recording"));
            }
            if ($(".type-active").attr("id") != "camera-only") {
                $("#record").removeClass("record-disabled");
            }
        } else if (request.type == "sources-loaded") {
            chrome.tabs.getSelected(null, function (tab) {
                chrome.tabs.sendMessage(tab.id, {
                    type: "camera-request"
                });
            });
        } else if (request.type == "sources-audio-noaccess") {
            audioRequest();
        }
        //  else if (request.type == "format") {
        //     $("#format_sel").html(chrome.i18n.getMessage("mp3"));

        // }
    });

    // Localization (strings in different languages)
    $("#camera-select").html("<option value='disabled'>" + chrome.i18n.getMessage("disabled") + "</option>");
    $("#mic-select").html("<option value='disabled'>" + chrome.i18n.getMessage("disabled") + "</option>");
    $("#mic-select").niceSelect('update');
    $("#mic-select2").html("<option value='disabled'>" + chrome.i18n.getMessage("disabled") + "</option>");
    $("#mic-select2").niceSelect('update');
    $("#camera-select").niceSelect('update');
    $("#shortcuts").html(chrome.i18n.getMessage("keyboard_shortcuts"));
    $("#quality").html(chrome.i18n.getMessage("smaller_file_size"));
    $("#rateextension").html(chrome.i18n.getMessage("rate_extension"));
    $("#madeby").html(chrome.i18n.getMessage("made_by_curateit"));
    $("#tab-only p").html(chrome.i18n.getMessage("tab_only"));
    $("#desktop p").html(chrome.i18n.getMessage("desktop"));
    $("#camera-only p").html(chrome.i18n.getMessage("camera_only"));
    $("#camera-select-label").html(chrome.i18n.getMessage("camera"));
    $("#flip-label").html(chrome.i18n.getMessage("flip_camera"));
    $("#mic-label").html(chrome.i18n.getMessage("microphone"));
    $("#push-label").html(chrome.i18n.getMessage("push_to_talk"));
    $("#second-label").html(chrome.i18n.getMessage("second"));
    $(".seconds-label").html(chrome.i18n.getMessage("seconds"));
    $("#countdown-label").html(chrome.i18n.getMessage("countdown"));
    $("#hover-label").html(chrome.i18n.getMessage("only_on_hover"));
    $("#record").html(chrome.i18n.getMessage("loading"));
    $("#madeby1").html(chrome.i18n.getMessage("made_by_Curateit1"));
    $("#onlyaudio-label").html(chrome.i18n.getMessage("microphoneonlymic"));
    // $("#format_sel").html(chrome.i18n.getMessage("mp3"));







});






let interval;
let timeLeft;
const displayStatus = function () { //function to handle the display of time and buttons
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const status = document.getElementById("status");
        const timeRem = document.getElementById("timeRem");
        const startButton = document.getElementById('start');
        const finishButton = document.getElementById('finish');
        const cancelButton = document.getElementById('cancel');
        //CODE TO BLOCK CAPTURE ON YOUTUBE, DO NOT DELETE
        // if(tabs[0].url.toLowerCase().includes("youtube")) {
        //   status.innerHTML = "Capture is disabled on this site due to copyright";
        // } else {
        chrome.runtime.sendMessage({ currentTab: tabs[0].id }, (response) => {
            if (response) {
                chrome.storage.sync.get({
                    maxTime: 1200000,
                    limitRemoved: false
                }, (options) => {
                    if (options.maxTime > 1200000) {
                        chrome.storage.sync.set({
                            maxTime: 1200000
                        });
                        timeLeft = 1200000 - (Date.now() - response)
                    } else {
                        timeLeft = options.maxTime - (Date.now() - response)
                    }
                    status.innerHTML = " ";
                    if (options.limitRemoved) {

                        timeRem.innerHTML = `${parseTime(Date.now() - response)}`;
                        interval = setInterval(() => {
                            timeRem.innerHTML = `${parseTime(Date.now() - response)}`;
                        });
                    } else {
                        timeRem.innerHTML = `${parseTime(timeLeft)} remaining`;
                        interval = setInterval(() => {
                            timeLeft = timeLeft - 1000;
                            timeRem.innerHTML = `${parseTime(timeLeft)} remaining`;
                        }, 1000);
                    }
                });
                if (finishButton) {
                    finishButton.style.display = "block";
                }
                if (cancelButton) {
                    cancelButton.style.display = "block";
                }
            } else {
                if (startButton) {
                startButton.style.display = "block";
                }
            }
        });
        // }
    });
}

const parseTime = function (time) { //function to display time remaining or time elapsed
    let minutes = Math.floor((time / 1000) / 60);
    let seconds = Math.floor((time / 1000) % 60);
    if (minutes < 10 && minutes >= 0) {
        minutes = '0' + minutes;
    } else if (minutes < 0) {
        minutes = '00';
    }
    if (seconds < 10 && seconds >= 0) {
        seconds = '0' + seconds;
    } else if (seconds < 0) {
        seconds = '00';
    }
    return `${minutes}:${seconds}`
}

//manipulation of the displayed buttons upon message from background
chrome.runtime.onMessage.addListener((request, sender) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const status = document.getElementById("status");
        const timeRem = document.getElementById("timeRem");
        const buttons = document.getElementById("buttons");
        const startButton = document.getElementById('start');
        const finishButton = document.getElementById('finish');
        const cancelButton = document.getElementById('cancel');
        if (request.captureStarted && request.captureStarted === tabs[0].id) {
            chrome.storage.sync.get({
                maxTime: 1200000,
                limitRemoved: false
            }, (options) => {
                if (options.maxTime > 1200000) {
                    chrome.storage.sync.set({
                        maxTime: 1200000
                    });
                    timeLeft = 1200000 - (Date.now() - request.startTime)
                } else {
                    timeLeft = options.maxTime - (Date.now() - request.startTime)
                }
                // status.innerHTML = "Tab is currently being captured";
                status.innerHTML = "";
                if (options.limitRemoved) {
                    timeRem.innerHTML = `${parseTime(Date.now() - request.startTime)}`;
                    interval = setInterval(() => {
                        timeRem.innerHTML = `${parseTime(Date.now() - request.startTime)}`
                    }, 1000);
                } else {
                    timeRem.innerHTML = `${parseTime(timeLeft)} remaining`;
                    interval = setInterval(() => {
                        timeLeft = timeLeft - 1000;
                        timeRem.innerHTML = `${parseTime(timeLeft)} remaining`;
                    }, 1000);
                }
            });
            if (finishButton) {
            finishButton.style.display = "block";
            }
            if (cancelButton) {
            cancelButton.style.display = "block";
            }
            if (startButton) {
            startButton.style.display = "none";
            }
        } else if (request.captureStopped && request.captureStopped === tabs[0].id) {
            status.innerHTML = "";
            finishButton.style.display = "none";
            cancelButton.style.display = "none";
            startButton.style.display = "block";
            timeRem.innerHTML = "";
            clearInterval(interval);
        }
    });
});


//initial display for popup menu when opened
document.addEventListener('DOMContentLoaded', function () {
    displayStatus();
    const startKey = document.getElementById("startKey");
    const endKey = document.getElementById("endKey");
    const startButton = document.getElementById('start');
    const finishButton = document.getElementById('finish');
    const cancelButton = document.getElementById('cancel');
    if (startButton) {
    startButton.onclick = () => { chrome.runtime.sendMessage("startCapture") };
    }
    if (finishButton) {
    finishButton.onclick = () => { chrome.runtime.sendMessage("stopCapture") };
    }
    if (cancelButton) {
    cancelButton.onclick = () => { chrome.runtime.sendMessage("cancelCapture") };
    }
    chrome.runtime.getPlatformInfo((info) => {
        if (info.os === "mac") {
            // startKey.innerHTML = "Command + Shift + U to start capture on current tab";
            // endKey.innerHTML = "Command + Shift + X to stop capture on current tab";
        } else {
            // startKey.innerHTML = "Ctrl + Shift + S to start capture on current tab";
            // endKey.innerHTML = "Ctrl + Shift + X to stop capture on current tab";
        }
    })
    //   const options = document.getElementById("options");
    //   options.onclick = () => {chrome.runtime.openOptionsPage()};
    //   const git = document.getElementById("GitHub");
    //   git.onclick = () => {chrome.tabs.create({url: "https://github.com/arblast/Chrome-Audio-Capturer"})};

});