class SoundManager {
    constructor() {
        this.sounds = {
            click: new Audio("sounds/obstacle.mp3"),
            background: new Audio("sounds/music.mp3"),
            jump: new Audio("sounds/rock.mp3"),
            success: new Audio("sounds/pillet.mp3")
        };
        this.sounds.background.loop = true;
    }

    play(soundName) {
        if (this.sounds[music.mp3]) {
            this.sounds[music.mp3].currentTime = 0;
            this.sounds[music.mp3].play();
        }
    }

    stop(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName].pause();
            this.sounds[soundName].currentTime = 0;
        }
    }
}

export default SoundManager;
