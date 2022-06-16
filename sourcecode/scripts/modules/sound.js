export default class Sound {
    constructor(parent) {
        this.parent = parent;
        this.sounds = [];
        this.muted = true;
    }

    create(src, id, loop = false) {
        let audio = document.createElement("audio");
        audio.src = src;
        audio.id = id;
        audio.muted = true;
        this.sounds.push(audio);
        this.parent.append(audio);

        if (loop) {
            audio.setAttribute("loop", "")
        }

        return audio;
    }

    soundSettings() {
        let soundItems = document.getElementsByClassName("sound-item");
        for (let soundItem of soundItems) {
            soundItem.addEventListener("click", (e) => {
                this.muteToggle();
            });
        }
    }

    muteToggle() {
        if (!this.muted) {
            for (let sound of this.sounds) {
                sound.muted = true;
            }
            document.getElementById("sound-speaker").innerHTML = "\u{1F507}";
            //document.getElementById("sound-description").setAttribute("data-i18n-key") = "sound-description-off";
            this.muted = true;
        } else {
            for (let sound of this.sounds) {
                sound.muted = false;
            }
            document.getElementById("sound-speaker").innerHTML = "\u{1F509}";
            //document.getElementById("sound-description").setAttribute("data-i18n-key") = "sound-description-on";
            this.muted = false;
        }
    }

    pause() {
        for (let sound of this.sounds) {
            sound.pause();
        }
    }

    play() {
        for (let sound of this.sounds) {
            sound.play();
        }
    }
}