export function formatBytes(bytes: number, decimals = 2): string {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${(bytes / k ** i).toFixed(decimals)} ${sizes[i]}`;
}

interface CompressImageParams {
	file: File;
	maxWidth?: number;
	maxHeight?: number;
	quality?: number;
}

function convertToWebp(filename: string): string {
	const lastDotIndex = filename.lastIndexOf('.');
	if (lastDotIndex === -1) {
		return `${filename}.webp`;
	}
	return `${filename.substring(0, lastDotIndex)}.webp`;
}

export function compressImage({
	file,
	maxWidth = Number.POSITIVE_INFINITY,
	maxHeight = Number.POSITIVE_INFINITY,
	quality = 1,
}: CompressImageParams) {
	const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
	if (!allowedTypes.includes(file.type)) {
		throw new Error('Image format	not supported');
	}

	return new Promise<File>((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = event => {
			const compressed = new Image();
			compressed.onload = () => {
				const canvas = document.createElement('canvas');

				let width = compressed.width;
				let height = compressed.height;
				if (width > height) {
					if (width > maxWidth) {
						height *= maxWidth / width;
						width = maxWidth;
					}
				} else {
					if (height > maxHeight) {
						width *= maxHeight / height;
						height = maxHeight;
					}
				}
				canvas.width = width;
				canvas.height = height;
				const context = canvas.getContext('2d');
				if (!context) {
					reject(new Error('Failed to get canvas context'));
					return;
				}
				context.drawImage(compressed, 0, 0, width, height);
				canvas.toBlob(
					blob => {
						if (!blob) {
							reject(new Error('Failed to compress image'));
							return;
						}

						const compressFile = new File(
							[blob],
							convertToWebp(file.name),
							{
								type: 'image/webp',
								lastModified: Date.now(),
							}
						);
						resolve(compressFile);
					},
					'image/webp',
					quality
				);
			};
			compressed.src = event.target?.result as string;
		};
		reader.readAsDataURL(file);
	});
}
