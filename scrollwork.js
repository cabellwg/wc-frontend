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


function drawOuterFrame(ctx, inset = 30) {
    if (!typeof ctx === CanvasRenderingContext2D) {
        throw new TypeError(`CanvasRenderingContext2D required, received ${typeof ctx}`);
    }

    
    const outerFrameDim = {
        x: inset,
        y: inset,
        w: RES * document.documentElement.clientWidth - 2 * inset,
        h: RES * document.documentElement.scrollHeight - 2 * inset
    };

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


function drawSpiralByBox(ctx, boundingBox, vorticity, orientation) {
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

    const max_t = Math.ceil((360 / (2 * Math.PI)) * tx);

    ctx.moveTo(delta.x, delta.y);
    ctx.beginPath();
    for (t = 0; t < max_t + 1; t++) {
        angle = (2 * Math.PI * t) / 360;
        const pt = logSpiralTransformed(angle);
        ctx.lineTo(pt.x, pt.y);
    }

    ctx.stroke();

    return delta;
}


function drawSpiralByCenter(ctx, center, maxX, maxY, orientation) {
    ctx.strokeStyle = STROKE_COLOR;

    const b = maxY / maxX;
    const tx = 4 * Math.PI + Math.atan(b);
    const a = Math.sqrt(maxX ** 2 + maxY ** 2) / Math.exp(b * tx);

    console.log(orientation, a, b, tx)

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

    const max_t = Math.ceil((360 / (2 * Math.PI)) * tx);

    ctx.moveTo(center.x, center.y);
    ctx.beginPath();
    for (t = 0; t < max_t + 1; t++) {
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
    const asymmetry = 0.65; // must be greater than or equal to 0.5

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
    let tileW = outerBorder.w / n;
    const [nx, ny] = [n, Math.floor(outerBorder.h / (tileW * aspectRatio))];
    let tileH = outerBorder.h / ny;
    
    if (tileW % innerBorder.w > 0.01 || tileH % innerBorder.h > 0.01) {
        console.warn("Imperfect tiling. Gaps may be visible.")
    }

    ctx.lineWidth = 0.75 * RES;
    ctx.strokeStyle = STROKE_COLOR;

    for (let i = 0; i < nx; i++) {
        for (let j = 0; j < ny; j++) {
            const tileDim = {
                x: outerBorder.x + i * tileW,
                y: outerBorder.x + j * tileH,
                w: tileW,
                h: tileH
            }

            if (
                ((innerBorder.x <= tileDim.x && tileDim.x < innerBorder.x + innerBorder.w)
                || (innerBorder.x < tileDim.x + tileDim.w && tileDim.x + tileDim.w < innerBorder.x + innerBorder.w))
                && ((innerBorder.y <= tileDim.y && tileDim.y < innerBorder.y + innerBorder.h)
                || (innerBorder.y < tileDim.y + tileDim.h && tileDim.y + tileDim.h < innerBorder.y + innerBorder.h))
            ) {
                continue;
            }

            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.translate(tileDim.x + tileW * 0.5, tileDim.y + tileH * 0.5);
            ctx.rotate(((i + j) % 2) * Math.PI)
            drawScroll(ctx, {
                x: -tileW * 0.5,
                y: -tileH * 0.5,
                w: tileDim.w,
                h: tileDim.h
            });
        }
    }
}


function drawScrolls() {
    const canvas = document.getElementById("scrollwork");
    canvas.width = RES * canvas.offsetWidth;
    canvas.height = RES * canvas.offsetHeight;

    if (canvas.getContext) {
        const ctx = canvas.getContext("2d");

        const innerFrameDim = drawInnerFrame(ctx);
        const outerFrameDim = drawOuterFrame(ctx);

        const innerFrameBounds = {
            x: innerFrameDim.x - innerFrameDim.frameWidth,
            y: innerFrameDim.y - innerFrameDim.frameWidth,
            w: innerFrameDim.w + 2 * innerFrameDim.frameWidth,
            h: innerFrameDim.h + 2 * innerFrameDim.frameWidth
        }
        tile(ctx, outerFrameDim, innerFrameBounds, 78);
    }
}

window.onload = drawScrolls;