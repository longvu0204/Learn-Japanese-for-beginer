// Nén ảnh về kích thước nhỏ và chuyển thành chuỗi Base64, không cần Firebase Storage
export function compressImageToBase64(file, maxWidth = 600, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        // Tính tỷ lệ thu nhỏ, giữ đúng tỷ lệ khung hình gốc
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Xuất ra dạng JPEG với mức nén (quality) để giảm dung lượng
        const base64 = canvas.toDataURL("image/jpeg", quality);
        resolve(base64);
      };

      img.onerror = () => reject(new Error("Không đọc được ảnh"));
      img.src = event.target.result;
    };

    reader.onerror = () => reject(new Error("Không đọc được file"));
    reader.readAsDataURL(file);
  });
}

// Ước lượng dung lượng thật (bytes) của 1 chuỗi Base64, để cảnh báo nếu vẫn còn quá lớn
export function estimateBase64Size(base64String) {
  const withoutPrefix = base64String.split(",")[1] || "";
  return Math.round((withoutPrefix.length * 3) / 4);
}
