import {
    INPUT_FEEDBACK_DURATION_MS,
    KEY_CODES
} from "./constants.js";

function showPressedImage(feedback) {
    if (!feedback?.element) {
        return;
    }

    feedback.element.src = feedback.pressedSrc;
    setTimeout(() => {
        feedback.element.src = feedback.releasedSrc;
    }, INPUT_FEEDBACK_DURATION_MS);
}

export function createKeyHandler({
    isPlaying,
    onMoveLeft,
    onMoveRight,
    onMoveDown,
    onRotate,
    onDrop,
    onHold,
    feedback = {}
}) {
    return (event) => {
        if (!isPlaying()) {
            return;
        }

        if (event.keyCode === KEY_CODES.DOWN) {
            onMoveDown();
            showPressedImage(feedback.down);
        } else if (event.keyCode === KEY_CODES.LEFT) {
            onMoveLeft();
            showPressedImage(feedback.left);
        } else if (event.keyCode === KEY_CODES.RIGHT) {
            onMoveRight();
            showPressedImage(feedback.right);
        } else if (event.keyCode === KEY_CODES.UP) {
            onRotate();
            showPressedImage(feedback.up);
        } else if (event.key === " ") {
            onDrop();
            showPressedImage(feedback.space);
        } else if (event.keyCode === KEY_CODES.SHIFT) {
            onHold();
            showPressedImage(feedback.shift);
        }
    };
}

export function arrowKeysHandler(event, isPlaying) {
    const movementKeys = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Space"
    ];

    if (isPlaying && movementKeys.includes(event.code)) {
        event.preventDefault();
    } else if (!isPlaying && event.code === "Space") {
        event.preventDefault();
    }
}
