let music = new Audio("music.mp3");
let musicIcon = document.querySelector("#musicIcon");
let animationFrameRequestID;
let music_source = null;

function musicStateChange() {
    // Autoplay bug fix
    if (music_ctx.state === "suspended") {
        music_ctx.resume().then(() => {
            console.log("AudioContext resumed!");
        });
    }

    if (music.paused) {
        music.play();
        musicIcon.classList.remove("fa-play");
        musicIcon.classList.add("fa-pause");
    } else {
        music.pause();
        musicIcon.classList.remove("fa-pause");
        musicIcon.classList.add("fa-play");
    }
}


var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var snail = document.querySelector("#snail");

// Set up audio
const fftsize_set = 512;
const music_ctx = new (window.AudioContext || window.webkitAudioContext)();
music_source = music_ctx.createMediaElementSource(music);
let analyser = music_ctx.createAnalyser();
analyser.fftSize = fftsize_set;
let bufferLength = analyser.frequencyBinCount;
let dataArray = new Uint8Array(bufferLength);
music_source.connect(analyser);
analyser.connect(music_ctx.destination);

function getSamples(){
    analyser.getByteTimeDomainData(dataArray);
    let normSamples = [...dataArray].map(x => x / 128 - 1);
    return normSamples;
}

function getVolume(){
    analyser.getByteFrequencyData(dataArray);
    let normSamples = [...dataArray].map(x => x / 128 - 1);
    let sum = 0;
    for (let i = 0; i < normSamples.length; i++) {
        sum += normSamples[i] * normSamples[i];
    }
    let volume = Math.sqrt(sum/normSamples.length);
    return volume;
}

class Bar {
    constructor(x, y, width, height, colour, index) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.colour = colour;
        this.index = index;
    }

    update(input) {
        this.height = input;
    }

    draw(context, volume) {
        context.fillStyle = this.colour;
        context.fillRect(this.x, this.y, this.width, this.height);
    }
}

let bars = [];
let barWidth = canvas.width/(fftsize_set/2);
function createBars() {
    for (let i = 0; i < fftsize_set/2; i++) {
        bars.push(new Bar(barWidth*i, 200, barWidth, 50, 'red', i));
    }
}
createBars();

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    bars.forEach((bar, index) => {
        bar.draw(ctx, 1);
    });
    requestAnimationFrame(animate);
}
animate();

document.querySelector("#musicInput").addEventListener("change", function() {
    let musicInput = this.files[0]; // Get the selected file
    if (musicInput) {
        let musicURL = URL.createObjectURL(musicInput); // Create a URL for the file
        music.src = musicURL; // Set the music source to the new URL
        music.load(); // Reload the music to apply the new source

        // Only create the MediaElementSourceNode if wasn't created before
        if (!music_source) {
            music_source = music_ctx.createMediaElementSource(music);
            music_source.connect(analyser);
            analyser.fftSize = fftsize_set;
            bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
            analyser.connect(music_ctx.destination);
        }

        // Optionally, restart the animation
        if (window.animationFrameRequestID) {
            cancelAnimationFrame(window.animationFrameRequestID); // Stop loop
        }
        animate(); // Restart
    }
});

function changeMusicSource() {
    document.querySelector("#musicInput").click(); // Trigger the file input
}