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

    drawFrames(ctx, frames, outerFrameDim);
}


function drawSpiral(ctx) {
    ctx.strokeStyle = STROKE_COLOR;

    var centerx = ctx.canvas.width / 2;
    var centery = ctx.canvas.height / 2;

    let a = 0.5;
    let b = 0.4;

    ctx.moveTo(centerx, centery);
    ctx.beginPath();
    for (i = 0; i < 360; i++) {
        angle = 0.05 * i;
        x = centerx + (a * Math.exp(b * angle) * Math.cos(angle));
        y = centery + (a * Math.exp(b * angle) * Math.sin(angle));

        console.log(x, y)

        ctx.lineTo(x, y);
    }

    ctx.stroke();
}


function drawScrolls() {
    const canvas = document.getElementById("scrollwork");
    canvas.width = RES * canvas.offsetWidth;
    canvas.height = RES * canvas.offsetHeight;

    if (canvas.getContext) {
        const ctx = canvas.getContext("2d");

        drawInnerFrame(ctx);
        drawOuterFrame(ctx);

        drawSpiral(ctx);
    }
}

window.onload = drawScrolls;