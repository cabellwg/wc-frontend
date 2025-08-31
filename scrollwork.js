const STROKE_COLOR = document.documentElement.style.color;
const BACKGROUND_COLOR = document.documentElement.style.backgroundColor;
const RES = 4;


function getElementDimensions(el) {
    if (!typeof el === HTMLElement) {
        throw new TypeError(`Expected HTMLElement, received ${typeof el}`)
    }

    const style = window.getComputedStyle(el);

    const x = Math.ceil(el.offsetLeft
        - parseFloat(style['marginLeft'])
    );
    const y = Math.ceil(el.offsetTop
        - parseFloat(style['marginTop'])
    );
    const w = Math.ceil(el.offsetWidth
        + parseFloat(style['marginLeft'])
        + parseFloat(style['marginRight']));
    const h = Math.ceil(el.offsetHeight
        + parseFloat(style['marginTop'])
        + parseFloat(style['marginBottom']));

    return { x: x, y: y, w: w, h: h };
}


function getTextBoxDimensions() {
    const textEl = document.getElementById("text");
    const footerEl = document.getElementById("footer")

    const textDim = getElementDimensions(textEl);
    const footerDim = getElementDimensions(footerEl);
    
    const x = RES * Math.min(textDim.x, footerDim.x);
    const y = RES * textDim.y;
    const w = RES * Math.max(textDim.w, footerDim.x)
    const h = RES * (textDim.h + footerDim.h);
    return { x: x, y: y, w: w, h: h };
}


function drawFrames(ctx, frames, frameDimensions) {
    ctx.strokeStyle = STROKE_COLOR;

    let totalOffset = 0;
    frames.forEach(frame => {
        let w = RES * frame.width;
        let o = RES * frame.offset;
        let workingOffset = totalOffset + o + Math.ceil(w / 2);
        ctx.lineWidth = w;
        
        ctx.strokeRect(
            frameDimensions.x - workingOffset,
            frameDimensions.y - workingOffset,
            frameDimensions.w + 2 * workingOffset,
            frameDimensions.h + 2 * workingOffset);

        totalOffset += o + w;
    });

    return totalOffset;
}


function drawInnerFrame(ctx) {
    if (!typeof ctx === CanvasRenderingContext2D) {
        throw new TypeError(`CanvasRenderingContext2D required, received ${typeof ctx}`);
    }

    const innerFrameDim = getTextBoxDimensions();
    const frames = [
        {
            offset: 0,
            width: 1
        },
        {
            offset: 2,
            width: 2
        },
        {
            offset: 1,
            width: 1
        }
    ];

    drawFrames(ctx, frames, innerFrameDim);

    const frameWidth = drawFrames(ctx, frames, innerFrameDim);

    return {
        ...innerFrameDim,
        frameWidth: frameWidth
    };
}


function getOuterFrameBounds(inset = 30) {
    return {
        x: inset,
        y: inset,
        w: RES * document.documentElement.clientWidth - 2 * inset,
        h: RES * document.documentElement.scrollHeight - 2 * inset
    };
}


function getMobileFrameBounds(height = 100, inset = 100) {
    return {
        x: inset,
        y: inset,
        w: RES * document.documentElement.clientWidth - 2 * inset,
        h: RES * height - 2 * inset
    };
}


function drawOuterFrame(ctx, outerFrameDim) {
    if (!typeof ctx === CanvasRenderingContext2D) {
        throw new TypeError(`CanvasRenderingContext2D required, received ${typeof ctx}`);
    }
    

    const frames = [
        {
            offset: 0,
            width: 1
        },
        {
            offset: 1,
            width: 2
        },
        {
            offset: 2,
            width: 1
        }
    ];

    const frameWidth = drawFrames(ctx, frames, outerFrameDim);

    return {
        ...outerFrameDim,
        frameWidth: frameWidth
    };
}


function drawSpiralByBox(ctx, boundingBox, vorticity, orientation, resolution = 10) {
    ctx.strokeStyle = STROKE_COLOR;

    const b = vorticity;
    const tx = 4 * Math.PI + Math.atan(b)
    const a = boundingBox.w / (
        (Math.exp(b * tx) * Math.cos(tx)) - (Math.exp(b * (tx - Math.PI)) * Math.cos(tx - Math.PI)));

    const logSpiral = t => {
        x = (a * Math.exp(b * t) * Math.cos(t));
        y = orientation * (a * Math.exp(b * t) * Math.sin(t));
        return { x: x, y: y }
    }
    
    const offset = logSpiral(tx);
    const delta = {
        x: boundingBox.x + boundingBox.w - offset.x,
        y: orientation === 1 ? boundingBox.y + boundingBox.h - offset.y : boundingBox.y - offset.y
    }
    
    logSpiralTransformed = t => {
        const r = logSpiral(t);
        return {
            x: delta.x + r.x,
            y: delta.y + r.y
        }
    }    

    const max_t = Math.ceil((360 / (2 * Math.PI)) * tx) + (resolution / 2);

    ctx.moveTo(delta.x, delta.y);
    ctx.beginPath();
    for (t = 0; t < max_t + 1; t += resolution) {
        angle = (2 * Math.PI * t) / 360;
        const pt = logSpiralTransformed(angle);
        ctx.lineTo(pt.x, pt.y);
    }

    ctx.stroke();

    return delta;
}


function drawSpiralByCenter(ctx, center, maxX, maxY, orientation, resolution = 10) {
    ctx.strokeStyle = STROKE_COLOR;

    const b = maxY / maxX;
    const tx = 4 * Math.PI + Math.atan(b);
    const a = Math.sqrt(maxX ** 2 + maxY ** 2) / Math.exp(b * tx);

    const logSpiral = t => {
        x = (a * Math.exp(b * t) * Math.cos(t));
        y = orientation * (a * Math.exp(b * t) * Math.sin(t));
        return { x: x, y: y }
    }
    
    logSpiralTransformed = t => {
        const r = logSpiral(t);
        return {
            x: center.x + r.x,
            y: center.y + r.y
        }
    }    

    const max_t = Math.ceil((360 / (2 * Math.PI)) * tx) + (resolution / 2);

    ctx.moveTo(center.x, center.y);
    ctx.beginPath();
    for (t = 0; t < max_t + 1; t += resolution) {
        angle = (2 * Math.PI * t) / 360;
        const pt = logSpiralTransformed(angle);
        ctx.lineTo(pt.x, pt.y);
    }

    ctx.stroke();

    return center;
}


function drawLeaf(ctx, boundingBox, vorticity, stemWidth, orientation) {
    // ctx.strokeRect(
    //             boundingBox.x,
    //             boundingBox.y,
    //             boundingBox.w,
    //             boundingBox.h);

    const primaryCenter = drawSpiralByBox(ctx, boundingBox, vorticity, orientation);
    let maxY = 0;
    if (orientation === 1) {
        maxY = boundingBox.h - (primaryCenter.y - boundingBox.y)
    } else {
        maxY = primaryCenter.y - boundingBox.y
    }
    drawSpiralByCenter(
        ctx,
        primaryCenter,
        boundingBox.w - (primaryCenter.x - boundingBox.x) - stemWidth,
        maxY,
        orientation
        );
}


function drawScroll(ctx, boundingBox) {
    const stemWidth = 0.1 * boundingBox.w;
    const asymmetry = 0.65 + 0.02 * Math.random(); // must be greater than or equal to 0.5

    // ctx.strokeRect(
    //     boundingBox.x,
    //     boundingBox.y,
    //     boundingBox.w,
    //     boundingBox.h);

    const topBounds = {
        x: boundingBox.x,
        y: boundingBox.y,
        w: boundingBox.w,
        h: boundingBox.h * asymmetry
    };
    const bottomBounds = {
        x: boundingBox.x + (boundingBox.w - topBounds.w / topBounds.h * boundingBox.h * (1 - asymmetry)),
        y: boundingBox.y + topBounds.h,
        w: topBounds.w / topBounds.h * boundingBox.h * (1 - asymmetry),
        h: boundingBox.h * (1 - asymmetry)
    }

    drawLeaf(ctx, topBounds, 0.25, stemWidth, 1);
    drawLeaf(ctx, bottomBounds, 0.25 * asymmetry / 0.5, stemWidth, -1);
}


function tile(ctx, outerBorder, innerBorder, n, aspectRatio = 1) {
    let tileW = innerBorder.w / n;
    let tileH = innerBorder.h / Math.floor(innerBorder.h / (tileW * aspectRatio));
    const [nx, ny] = [Math.floor(outerBorder.w / tileW) - 1, Math.floor(outerBorder.h / tileH) - 1];
    
    const tilingBounds = {
        x: innerBorder.x - Math.floor((innerBorder.x - outerBorder.x) / tileW) * tileW,
        y: innerBorder.y - Math.floor((innerBorder.y - outerBorder.y) / tileH) * tileH,
        w: tileW * nx,
        h: tileH * ny
    };

    ctx.lineWidth = 0.5 * RES;
    ctx.strokeStyle = STROKE_COLOR;

    for (let i = 0; i < nx; i++) {
        for (let j = 0; j < ny; j++) {
            const tileDim = {
                x: tilingBounds.x + i * tileW,
                y: tilingBounds.y + j * tileH,
                w: tileW,
                h: tileH
            }

            if (
                (((innerBorder.x <= tileDim.x - 0.5 && tileDim.x < innerBorder.x + innerBorder.w - 0.5)
                || (innerBorder.x < tileDim.x + tileDim.w - 0.5 && tileDim.x + tileDim.w < innerBorder.x + innerBorder.w - 0.5))
                && ((innerBorder.y <= tileDim.y - 0.5 && tileDim.y < innerBorder.y + innerBorder.h - 0.5)
                || (innerBorder.y < tileDim.y + tileDim.h - 0.5 && tileDim.y + tileDim.h < innerBorder.y + innerBorder.h - 0.5)))
            ) {
                continue;
            }

            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.translate(tileDim.x + tileW * 0.5, tileDim.y + tileH * 0.5);
            ctx.rotate(((i + j) % 2) * Math.PI)
            drawScroll(ctx, {
                x: -tileW * 0.5 + (1.01 * Math.random() - 0.505),
                y: -tileH * 0.5 + (1.01 * Math.random() - 0.505),
                w: tileDim.w + (1.01 * Math.random() - 0.505),
                h: tileDim.h + (1.01 * Math.random() - 0.505)
            });
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
    }

    return tilingBounds;
}

function simpleTile(ctx, outerBorder, n, aspectRatio = 1) {
    let tileW = outerBorder.w / n;
    let tileH = outerBorder.h / Math.floor(outerBorder.h / (tileW * aspectRatio));
    const [nx, ny] = [Math.floor(outerBorder.w / tileW), Math.floor(outerBorder.h / tileH)];
    
    const tilingBounds = {
        x: outerBorder.x,
        y: outerBorder.y,
        w: tileW * nx,
        h: tileH * ny
    };

    ctx.lineWidth = 0.5 * RES;
    ctx.strokeStyle = STROKE_COLOR;

    for (let i = 0; i < nx; i++) {
        for (let j = 0; j < ny; j++) {
            const tileDim = {
                x: tilingBounds.x + i * tileW,
                y: tilingBounds.y + j * tileH,
                w: tileW,
                h: tileH
            }

            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.translate(tileDim.x + tileW * 0.5, tileDim.y + tileH * 0.5);
            ctx.rotate(((i + j) % 2) * Math.PI)
            drawScroll(ctx, {
                x: -tileW * 0.5 + (1.01 * Math.random() - 0.505),
                y: -tileH * 0.5 + (1.01 * Math.random() - 0.505),
                w: tileDim.w + (1.01 * Math.random() - 0.505),
                h: tileDim.h + (1.01 * Math.random() - 0.505)
            });
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
    }

    return tilingBounds;
}


function drawScrolls() {
    const canvas = document.getElementById("scrollwork");
    canvas.width = RES * canvas.offsetWidth;
    canvas.height = RES * canvas.offsetHeight;

    if (canvas.getContext) {
        const ctx = canvas.getContext("2d");

        const innerFrameDim = drawInnerFrame(ctx);
        const outerBounds = getOuterFrameBounds();

        const innerBounds = {
            x: innerFrameDim.x - innerFrameDim.frameWidth,
            y: innerFrameDim.y - innerFrameDim.frameWidth,
            w: innerFrameDim.w + 2 * innerFrameDim.frameWidth,
            h: innerFrameDim.h + 2 * innerFrameDim.frameWidth
        }
        const tilingBounds = tile(ctx, outerBounds, innerBounds, 50);
        drawOuterFrame(ctx, tilingBounds);
    }
}

function drawMobileScrolls() {
    const canvas = document.getElementById("mobile-scrollwork");
    canvas.width = RES * canvas.offsetWidth;
    canvas.height = RES * canvas.offsetHeight;

    if (canvas.getContext) {
        const ctx = canvas.getContext("2d");

        const outerBounds = getMobileFrameBounds();
        const tilingBounds = simpleTile(ctx, outerBounds, 22);
        drawOuterFrame(ctx, tilingBounds);
    }
}

function drawAllScrolls() {
    drawScrolls();
    drawMobileScrolls();
}


window.onload = drawAllScrolls;

// Debounced redraw on resize
let timeout = false;
const delay = 100;

window.addEventListener('resize', function() {
  clearTimeout(timeout);
  timeout = setTimeout(drawAllScrolls, delay);
});