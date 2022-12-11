import { PrimitiveType } from "../../src/Const.js";
import { Rasterizer } from "../../src/Rasterizer.js";
import { CanvasDrive } from "../../src/CanvasDrive.js";

const getViewMatrix = (eyePosition) => {
	const view = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		-eyePosition[0], -eyePosition[1], -eyePosition[2], 1
	];

	return view;
}

const getModelMatrix = (angle) => {
	const model = glMatrix.mat4.fromZRotation([], angle * Math.PI / 180);
	return model;
}

const getProjectionMatrix = (eyeFov, aspectRatio, zNear, zFar) => {
	// Students will implement this function

	// TODO: Implement this function
	// Create the projection matrix for the given parameters.
	// Then return it.

	// For test const projection = [2.4442348709207398, 0, 0, 0, 0, 2.414213562373095, 0, 0, 0, 0, -1.002002002002002, -1, 0, 0, -0.20020020020020018, 0];

	const projection = [
		1 / Math.tan(eyeFov * Math.PI / 180 / 2) * aspectRatio, 0, 0, 0,
		0, 1 / Math.tan(eyeFov * Math.PI / 180 / 2), 0, 0,
		0, 0, (zNear + zFar) / (zNear - zFar), -1,
		0, 0, -2 * zFar * zNear / (zNear - zFar), 0
	];

	// glMatrix.mat4.perspective(projection, eyeFov / 180 * Math.PI, aspectRatio, zNear, zFar);

	return projection;
}

const renderer = () => {
	let angle = 0, eye_pos = [0, 0, 5];
	let rasterizer = null;
	let posId, indId, colId;

	const canvas = document.createElement('canvas');
	document.body.appendChild(canvas);

	return {
		setAngle: (a) => {
			angle = a;
		},
		setEye: (eye) => {
			eye_pos = eye;
		},
		init: (width = 512, height = 512) => {
			canvas.width = width;
			canvas.height = height;
			const context = canvas.getContext('2d');
			const drive = new CanvasDrive(context, width, height);
			rasterizer = new Rasterizer(drive);

			const positions = [
				[2, 0, -2],
				[0, 2, -2],
				[-2, 0, -2],

				[3.5, -1, -5],
				[2.5, 1.5, -5],
				[-1, 0.5, -5]
			];
			const indices = [
				[0, 1, 2],

				[3, 4, 5]
			];
			const colors = [
				[217.0, 238.0, 185.0],
				[217.0, 238.0, 185.0],
				[217.0, 238.0, 185.0],

				[185.0, 217.0, 238.0],
				[185.0, 217.0, 238.0],
				[185.0, 217.0, 238.0]
			];

			posId = rasterizer.setPositions(positions);
			indId = rasterizer.setIndices(indices);
			colId = rasterizer.setColors(colors);
		},
		setCearColor: (color = [255, 0, 0, 255]) => {
			rasterizer.drive.setClearColor(color);
		},
		render: () => {
			rasterizer.drive.clear();

			rasterizer.setModel(getModelMatrix(angle));
			rasterizer.setView(getViewMatrix(eye_pos));
			rasterizer.setProjection(getProjectionMatrix(45, 1, 0.1, 50));

			rasterizer.draw(posId, indId, colId, PrimitiveType.Triangle);
		}
	}
}

export {
	renderer
}