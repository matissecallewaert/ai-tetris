function getMatrix(shape) {
    return Array.isArray(shape) ? shape : Object.values(shape)[0];
}

export function clearCanvas(context, width, height) {
    context.clearRect(0, 0, width, height);
}

export function drawShape(
    context,
    shapeState,
    colors,
    fillColor,
    yOffset = 0
) {
    const matrix = getMatrix(shapeState.shape);

    for (let y = 0; y < matrix.length; y += 1) {
        for (let x = 0; x < matrix[y].length; x += 1) {
            const value = matrix[y][x];
            if (value !== 0) {
                context.fillStyle = fillColor ?? colors[value];
                context.fillRect(
                    x + shapeState.x,
                    y + shapeState.y + yOffset,
                    1,
                    1
                );
            }
        }
    }
}

export function drawGridSnapshot(context, grid, colors) {
    for (let y = 0; y < grid.length; y += 1) {
        for (let x = 0; x < grid[y].length; x += 1) {
            const value = grid[y][x];
            if (value > 0) {
                context.fillStyle = colors[value];
                context.fillRect(x, y, 1, 1);
            }
        }
    }
}

export function createScaledContext(canvasId, width, height, blockSize) {
    const context = document.getElementById(canvasId).getContext("2d");
    context.canvas.width = width * blockSize;
    context.canvas.height = height * blockSize;
    context.scale(blockSize, blockSize);
    return context;
}

export function drawGridLines(context, cols, rows, blockSize) {
    context.beginPath();

    for (let x = 1; x < cols; x += 1) {
        context.moveTo(x * blockSize, 0);
        context.lineTo(x * blockSize, rows * blockSize);
        context.stroke();
    }

    for (let y = 1; y < rows; y += 1) {
        context.moveTo(0, y * blockSize);
        context.lineTo(cols * blockSize, y * blockSize);
        context.stroke();
    }
}
