class CanvasDrive {

	constructor(context, width, height) {
		this.context = context;
		this.width = width;
		this.height = height;

		this.frameBuffer = this.context.createImageData(this.width, this.height);
		this.buffer = new ArrayBuffer(this.frameBuffer.data.length);
		this.buffer8 = new Uint8ClampedArray(this.buffer);
		this.buffer32 = new Uint32Array(this.buffer);

		this.zBuffer = new Uint32Array(this.frameBuffer.data.length);

		this.clearColor = [1, 1, 1];
		this.clearDepthBuffer = 0;
	}

	setClearColor(color) {
		this.clearColor = color;
	}

	clear(clearColor, clearDepth) {
		if (clearColor && clearDepth) {
			const color = this.clearColor;
			const depth = this.clearDepthBuffer;
			for (let h = 0, l = this.height; h < l; h++) {
				for (let w = 0, j = this.width; w < j; w++) {
					const index = this.getIndex(w, h);
					this.setPixelColor(index, color);
					this.zBuffer[index] = depth;
				}
			}
		}
	}

	setPixelColor(index, color) {
		const c = (color[0] & 255) | ((color[1] & 255) << 8) | ((color[2] & 255) << 16);
		this.buffer32[index] = c;
	}

	getIndex(pixel_x, pixel_y) {
		return pixel_y * this.width + pixel_x;
	}

	draw() {
		this.frameBuffer.data.set(this.buffer8);
		this.context.putImageData(this.frameBuffer, 0, 0);
	}

}

export {
	CanvasDrive
}