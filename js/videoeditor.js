$(document).ready(function(){

	var blobs = recordedBlobs;
	var player;
	var trimslider = document.getElementById('trimslider');
	var removeslider = document.getElementById('removeslider');
	var setup = true;
	
	// alert(recordedBlobs);
	
	// Show recorded video
	if (url == "" || url == null) {
		// Show recorded video
    var superBuffer = new Blob(recordedBlobs, {
				type: 'video/webm'
		});
	// console.log("sup", superBuffer);

	
		// Create the src url from the blob. #t=duration is a Chrome bug workaround, as the webm generated through Media Recorder has a N/A duration in its metadata, so you can't seek the video in the player. Using Media Fragments (https://www.w3.org/TR/media-frags/#URIfragment-user-agent) and setting the duration manually in the src url fixes the issue.
		var url = window.URL.createObjectURL(superBuffer);
	}

	$("#video").attr("src", url);
	$("#g-savetodrive").attr("src", url);
	// $("#format-select").html("<select><option value='mp3'>"+'MP3'+"</option></select>");
		
	$("#format-select").niceSelect('update');
	// $("#format_sel").niceSelect();

	if (type == 'audio') {

		// $("#format-select").html("<select><option value='mp3'>"+'MP3'+"</option></select>");
	// Get reference to the select element
	const select = document.getElementById("format-select");

	// Array of options
	const options = [
  	{ value: "mp3", label: "MP3" }
		//   { value: "mp4", label: "mp4" },
		//   { value: "webm", label: "WEBM" },
		];
		// Loop through the options and add them to the select element
		options.forEach((option) => {
		const optionElement = document.createElement("option");

		optionElement.value = option.value;
		optionElement.label = option.label;
		select.appendChild(optionElement);
		});
	} else if (type == 'video') {

			// Get reference to the select element
	const select = document.getElementById("format-select");

	// Array of options
	const options = [
		{ value: "webm", label: "WEBM" },
		{ value: "mp4", label: "MP4" },
  		{ value: "gif", label: "GIF" }
		];
		// Loop through the options and add them to the select element
		options.forEach((option) => {
		const optionElement = document.createElement("option");

		optionElement.value = option.value;
		optionElement.label = option.label;
		select.appendChild(optionElement);
		});
		
	
	} else if (type == 'mp3') {

			// Get reference to the select element
	const select = document.getElementById("format-select");

	// Array of options
	const options = [
  		{ value: "mp3", label: "mp3" }
		];
		// Loop through the options and add them to the select element
		options.forEach((option) => {
		const optionElement = document.createElement("option");

		optionElement.value = option.value;
		optionElement.label = option.label;
		select.appendChild(optionElement);
		});
		
	} else {

	}
	
	
	// Convert seconds to timestamp
	function timestamp(value) {
			var sec_num = value;
			var hours   = Math.floor(sec_num / 3600);
			var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
			var seconds = sec_num - (hours * 3600) - (minutes * 60);

			if (hours   < 10) {hours   = "0"+hours;}
			if (minutes < 10) {minutes = "0"+minutes;}
			if (seconds < 10) {seconds = "0"+seconds;}
			return hours+':'+minutes+':'+seconds;
	}
	
	// Initialize range sliders
	function initRanges() {
			noUiSlider.create(trimslider, {
					start: [blobs.length],
					connect: "upper",
					range: {
							'min': 0,
							'max': blobs.length
					}
			});
			$("#trim-end input").val(timestamp(blobs.length));
			
			noUiSlider.create(removeslider, {
					start: [0, blobs.length],
					connect: true,
					range: {
							'min': 0,
							'max': blobs.length
					}
			});
			$("#remove-end input").val(timestamp(blobs.length));
	}
	
	// Update range values
	function updateRanges(blobs) {
			trimslider.noUiSlider.updateOptions({
				 start: [blobs.length],
					range: {
							'min': 0,
							'max': blobs.length
					}
			});
			$("#trim-start input").val(timestamp(0));
			$("#trim-end input").val(timestamp(blobs.length));
			
			removeslider.noUiSlider.updateOptions({
				 start: [0, blobs.length],
					range: {
							'min': 0,
							'max': blobs.length
					}
			});
			$("#remove-start input").val(timestamp(0));
			$("#remove-end input").val(timestamp(blobs.length));
			window.setTimeout(function(){
					player.currentTime = 0;
			}, 500)
			player.restart();
	}
	
	// Reset video
	function reset() {
			blobs = recordedBlobs;
			var superBuffer = new Blob(blobs, {
					type: 'video/webm'
			});
			var url = window.URL.createObjectURL(superBuffer);
			$("#video").attr("src", url+"#t="+blobs.length);
			updateRanges(blobs);
	}
	
	// Trim video between two values
	function trim(a, b) {
			blobs = blobs.slice(a, b);
			var superBuffer = new Blob(blobs, {
					type: 'video/webm'
			});
			var url = window.URL.createObjectURL(superBuffer);
			$("#video").attr("src", url+"#t="+blobs.length);
			updateRanges(blobs);
	}
	
	// Remove part of the video
	function remove(a, b) {
			var start = blobs.slice(0, a);
			var end = blobs.slice(b, blobs.length);
			blobs = start.concat(end);
			var superBuffer = new Blob(blobs, {
					type: 'video/webm'
			});
			var url = window.URL.createObjectURL(superBuffer);
			$("#video").attr("src", url+"#t="+blobs.length);
			updateRanges(blobs);
	}
	
	// Download video in different formats
	function download() {
			downloaded = true;
			$("#download-label").html(chrome.i18n.getMessage("downloading"))
			if ($("#format-select").val() == "mp4") {
				ysFixWebmDuration(blobs, blobs.length, function(fixedBlob) {
					var superBuffer = new Blob(fixedBlob, {
							type: 'video/mp4'
					});
					var url = window.URL.createObjectURL(superBuffer);
					chrome.downloads.download({
							url: url
					});
					$("#download-label").html(chrome.i18n.getMessage("download"))
				});
			} else if ($("#format-select").val() == "webm") {
				ysFixWebmDuration(blobs, blobs.length, function(fixedBlob) {
					var superBuffer = new Blob(fixedBlob, {
							type: 'video/webm'
					});
					var url = window.URL.createObjectURL(superBuffer);
					chrome.downloads.download({
							url: url
					});
					$("#download-label").html(chrome.i18n.getMessage("download"))
				});//audio format
			}else if ($("#format-select").val() == "mp3") {
				ysFixWebmDuration(blobs, blobs.length, function(fixedBlob) {
					var superBuffer = new Blob(fixedBlob, {
							type: 'audio/mp3'

					});
					var url = window.URL.createObjectURL(superBuffer);
					chrome.downloads.download({
							url: url
					});
					$("#download-label").html(chrome.i18n.getMessage("download"))
				});
			}else if ($("#format-select").val() == "gif") {
					var superBuffer = new Blob(blobs, {
							type: 'video/webm'
					});
					convertStreams(superBuffer, "gif");
			}
	}
	
	// Save on Drive
	function saveDrive() {
			downloaded = true;
			chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
					if (!token) {
						return;
					}
					$("#share span").html(chrome.i18n.getMessage("saving"));
					$("#share").css("pointer-events", "none");
					var metadata = {
							name: 'video.mp4',
							mimeType: 'video/mp4'
					};
					var superBuffer = new Blob(blobs, {
							type: 'video/mp4'
					});
					var form = new FormData();
					form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
					form.append('file', superBuffer);

					// Upload to Drive
					var xhr = new XMLHttpRequest();
					xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');
					xhr.setRequestHeader('Authorization', 'Bearer ' + token);
					xhr.responseType = 'json';
					xhr.onload = () => {
							var fileId = xhr.response.id;
							$("#share span").html("Save to Drive");
							$("#share").css("pointer-events", "all");
							
							// Open file in Drive in a new tab
							chrome.tabs.create({
									 url: "https://drive.google.com/file/d/"+fileId
							});
					};
					xhr.send(form);
			});
	}
	
	// Check when video has been loaded
	$("#video").on("loadedmetadata", function(){

			// Initialize custom video player
			player = new Plyr('#video', {
					// controls: ['play-large', 'play', 'progress', 'current-time', 'duration', 'mute', 'volume', 'fullscreen'],
					controls: [
						'play-large',
						'restart',
						'rewind',
						'play',
						'fast-forward',
						'progress',
						'current-time',
						'mute',
						'volume',
						'captions',
						'settings',
						'pip',
						'airplay',
						'fullscreen',
						'capture'
					],
					setting: ['captions', 'quality', 'speed', 'loop'],
					ratio: '16:9',
					captions: { active: true, language: 'auto', update: true },
					quality : { default: 1080, options: [2160, 1440,1080, 720, 576, 480],
					forced: true
				    // onChange: null
				 },
					thumbnail:{
						enabled:true,
						pic_num: 184,
						width: 178,
						height: 100,
						col: 7,
						row: 7,
						offsetX:0,
						offsetY:0,
						urls: ['https://cdn.plyr.io/static/demo/thumbs/100p-00001.jpg',
						'https://cdn.plyr.io/static/demo/thumbs/100p-00002.jpg',
						'https://cdn.plyr.io/static/demo/thumbs/100p-00003.jpg',
						'https://cdn.plyr.io/static/demo/thumbs/100p-00004.jpg']
					}
	
			});
			
			// Check when player is ready
			player.on("canplay", function(){
					// First time setup
					if (setup) {
							setup = false;
							initRanges();
							player.currentTime = 0;
					}
					
					// Check when trim slider values change
					trimslider.noUiSlider.on('slide', function(values, handle) {
							$("#trim-start input").val(timestamp(0));
							$("#trim-end input").val(timestamp(values[0]));
							player.currentTime = parseFloat(values[handle]);
					});
					
					// Check when remove slider values change
					removeslider.noUiSlider.on('slide', function(values, handle) {
							$("#remove-start input").val(timestamp(values[0]));
							$("#remove-end input").val(timestamp(values[1]));
							player.currentTime = parseFloat(values[handle]);
					});
					
			});
	})
	

	// Applying a trim
	$("#apply-trim").on("click", function(){
			trim(0, parseInt(trimslider.noUiSlider.get()[0]));
	});
	
	// Removing part of the video
	$("#apply-remove").on("click", function(){
			remove(parseInt(removeslider.noUiSlider.get()[0]), parseInt(removeslider.noUiSlider.get()[1]));
	});
	
	// Download video
	$("#download").on("click", function(){
			download();
	});
	
	// Save on Drive
	$("#share").on("click", function(){
			saveDrive();
	});
	
	// Revert changes made to the video
	$("#reset").on("click", function(){
			reset();
	});
	
	// For mobile version
	$("#show-hide").on("click", function(){
			$("#settings").toggleClass("hidepanel");
			$("#export").toggleClass("hidepanel");
	}) ;

	// const onlyAudioDownload = document.querySelector('#onlyaudio');
	// onlyAudioDownload.addEventListener('click', (event) => {
	// 	if (event.target.value === 'micro') {
			
	// 		$("#format-select").hide();
			
	// 	  } else  {
	// 		$("#format-select").show();

	// 	  }
	// });

	
	// Localization (strings in different languages)
	$("#made-with").html(chrome.i18n.getMessage("made_with"));
	$("#by-alyssa").html(chrome.i18n.getMessage("by_alyssa"));
	$("#rate-label").html(chrome.i18n.getMessage("rate_extension"));
	$("#show-hide").html(chrome.i18n.getMessage("show_hide"));
	$("#edit-label").html(chrome.i18n.getMessage("edit_recording"));
	$("h2").html(chrome.i18n.getMessage("edit_recording_desc"));
	$("#format-select-label").html(chrome.i18n.getMessage("format"));
	$("#webm-default").html(chrome.i18n.getMessage("webm"));
	$("#trim-label").html(chrome.i18n.getMessage("trim_video"));
	$(".start-label").html(chrome.i18n.getMessage("start"));
	$(".end-label").html(chrome.i18n.getMessage("end"));
	$("#apply-trim").html(chrome.i18n.getMessage("apply"));
	$("#remove-label").html(chrome.i18n.getMessage("remove_part"));
	$("#format-select-label").html(chrome.i18n.getMessage("format"));
	$("#apply-remove").html(chrome.i18n.getMessage("apply"));
	$("#reset").html(chrome.i18n.getMessage("reset"));
	$("#download-label").html(chrome.i18n.getMessage("download"));
	$("#share span").html(chrome.i18n.getMessage("save_drive"));
	$("#apply-trim").html(chrome.i18n.getMessage("apply"));
	$("#format_sel-label").html(chrome.i18n.getMessage("formatmp3"));
	$("#format_sel").html(chrome.i18n.getMessage("format_sel"));
	$("#mp3-default").html(chrome.i18n.getMessage("mp3"));



});




// let mySelect = document.getElementById("format-select");
// chrome.storage.local.get([myId], function(result) {
// 	console.log('Variable retrieved with ID:', myId, 'value:', result[myId]);

// window.myId(alert);
// alert(myId);

// 	if (myId === "onlyaudio") {
// 		console.log('a');
// 		let option1 = document.createElement("option");
// 		option1.value = "mp3";
// 		option1.text = "MP3";
// 		mySelect.appendChild(option1);
// 	  } else {
// 		console.log('b');

// 		let option2 = document.createElement("option");
// 		option2.value = "mp4";
// 		option2.text = "MP4";
// 		mySelect.appendChild(option2);
	
// 		let option3 = document.createElement("option");
// 		option3.value = "webm";
// 		option3.text = "WebM";
// 		mySelect.appendChild(option3);
// 	  }


	// $("#format-select").html("<select><option value='mp3'>"+'myVariable'+"</option></select>")

	// myVariable = $("#format-select").html("<select><option value='mp3'>"+'MP3'+"</option></select>")

	// if (myId) {
	// 	$("#format-select").html("<select><option value='mp3'>"+'MP3'+"</option></select>");
	// 	// $result[myId]= $("#format-select").html("<select><option value='mp4'>"+'MP4'+"</option></select><select><option value='gif'>"+'gif'+"</option></select>");
	// }else {
	// 	$('#format-select').style.display = 'block';

	// }
//   });



document.addEventListener('DOMContentLoaded', () => {
	const encodeProgress = document.getElementById('encodeProgress');
	const saveButton = document.getElementById('saveCapture');
	const closeButton = document.getElementById('close');
	const review = document.getElementById('review');
	const status = document.getElementById('status');
	let format;
	let encoding = false;
	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		// console.log(request);
	  if(request.type == "audio") {
		format = request.format;

		// alert(format);
		// console.log(format);
		let startID = request.startID;
		//alert(startID);
		// status.innerHTML = "Please wait..."
		// closeButton.onclick = () => {
		//   chrome.runtime.sendMessage({cancelEncodeID: startID});
		//   chrome.tabs.getCurrent((tab) => {
		// 	chrome.tabs.remove(tab.id);
		//   });
		// }
  
		//if the encoding completed before the page has loaded
		if(request) {
		// 	alert("hello");
		//   alert(request.url)
		format = request.format;
		type = request.type;
		url = '../html/videoeditor.html';
		blobs = request;
		//alert(blobs);

		//  encodeProgress.style.width = '100%';
		//   status.innerHTML = "File is ready!"
		const video = document.getElementById('video');
		video.src = request.url;
		video.style.width = '90%';
		video.style.height = '600px';
		video.style.backgroundColor = '#000';
		video.style.padding = '20px';
		video.style.margin = '20px';
		video.style.radius = '5px';
		// video.classList.add('mp3-player');
		video.classList.add('progress-bar');
		// video.classList.add('volume-controls');

		const select = document.getElementById("format-select");

	// Array of options
	const options = [	
  	{ value: "mp3", label: "MP3" }
		//   { value: "mp4", label: "mp4" },
		//   { value: "webm", label: "WEBM" },
		];
		// Loop through the options and add them to the select element
		options.forEach((option) => {
		const optionElement = document.createElement("option");

		optionElement.value = option.value;
		optionElement.label = option.label;
		select.appendChild(optionElement);
		});

		// $('#share').hide(); 

		if ($('#download').click(function(){
			chrome.downloads.download({
				url: request.url
		});
		$("#download-label").html(chrome.i18n.getMessage("download"))

		}));   
		
	
		
		//  generateSave(url, blobs);
		} else {
		  encoding = true;
		}
	  }
  
	  //when encoding completes
	//   if(request.type === "encodingComplete" && encoding) {
	// 	encoding = false;
	// 	// status.innerHTML = "File is ready!";
	// 	encodeProgress.style.width = '100%';
	// 	generateSave(request.url);
	//   }
	  //updates encoding process bar upon messages
	//   if(request.type === "encodingProgress" && encoding) {
	// 	encodeProgress.style.width = `${request.progress * 100}%`;
	//   }
	  function generateSave(url, blobs) { //creates the save button
		newwindow.url = url;
        newwindow.request = blobs;
        newwindow.format = format;
		newwindow.type = 'audio';

		// const currentDate = new Date(Date.now()).toDateString();
		// saveButton.onclick = () => {
		//   chrome.downloads.download({url: url, filename: `${currentDate}.${format}`, saveAs: true});
		// };
		// saveButton.style.display = "inline-block";
	  }
	});
	// review.onclick = () => {
	//   chrome.tabs.create({url: "https://chrome.google.com/webstore/detail/chrome-audio-capture/kfokdmfpdnokpmpbjhjbcabgligoelgp/reviews"});
	// }
  

	var newwindow = null;
	var recordedBlobs = [];
    function saveRecordingAudio(url, blobs) {
        newwindow = window.open('../html/videoeditor.html');
        newwindow.url = url;
        newwindow.recordedBlobs = blobs;
        newwindow.type = 'audio';


    }
  
  })
  
  
  