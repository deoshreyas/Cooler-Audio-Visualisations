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
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

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
        const sound = input * 1000;
        this.height = sound > 10 ? sound : 10;
    }

    draw(context) {
        context.fillStyle = this.colour;
        context.beginPath();
        const angle = this.index * (Math.PI * 2) / bars.length;
        const innerRadius = 100;
        const outerRadius = innerRadius + this.height; 
        context.arc(this.x, this.y, outerRadius, angle, angle + Math.PI * 2 / bars.length);
        context.arc(this.x, this.y, innerRadius, angle + Math.PI * 2 / bars.length, angle, true);
        context.closePath();
        context.fill();
    }
}

function createBars() {
    bars = [];
    for (let i = 0; i < fftsize_set / 2; i++) {
        let colour = `hsl(${i * 2}, 100%, 50%)`;
        bars.push(new Bar(canvas.width / 2, canvas.height / 2, 1, 20, colour, i)); 
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const samples = getSamples();
    bars.forEach((bar, index) => {
        bar.update(samples[index]);
        bar.draw(ctx);
    });
    setTimeout(() => requestAnimationFrame(animate), 100); // 100ms delay
}

createBars();
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

window.addEventListener('resize', function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
})