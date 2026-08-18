"use strict";

const imageInput = document.getElementById("imageInput");
const browseBtn = document.getElementById("browseBtn");
const dropZone = document.getElementById("dropZone");

const quality = document.getElementById("quality");
const qualityValue = document.getElementById("qualityValue");
const format = document.getElementById("format");

const widthInput = document.getElementById("width");
const heightInput = document.getElementById("height");
const aspectLock = document.getElementById("aspectLock");
const originalDimensions = document.getElementById("originalDimensions");

const compressBtn = document.getElementById("compressBtn");
const clearBtn = document.getElementById("clearBtn");

let resultCard = document.getElementById("resultCard");

if (!resultCard) {
  resultCard = document.createElement("section");

  resultCard.id = "resultCard";
  resultCard.className = "result-card";

  resultCard.innerHTML = `
    <div class="result-header">
      <div>
        <h2>Your compressed images</h2>
      </div>
    </div>

    <div class="preview-wrapper" id="resultPreviewWrapper">
      <!-- Compressed images preview will go here -->
    </div>

    <div class="stats">
      <div class="stat">
        <span>Original size (Total)</span>
        <strong id="originalSize">—</strong>
      </div>

      <div class="stat">
        <span>Compressed size (Total)</span>
        <strong id="compressedSize">—</strong>
      </div>

      <div class="stat highlight">
        <span>Saved</span>
        <strong id="savedPercent">—</strong>
      </div>
    </div>

    <button id="downloadBtn" class="download-btn">
      <span>Download All files</span>
      <span>↓</span>
    </button>
  `;

  compressBtn.closest(".panel").insertAdjacentElement("afterend", resultCard);
}

const resultPreviewWrapper = document.getElementById("resultPreviewWrapper");
const originalSize = document.getElementById("originalSize");
const compressedSize = document.getElementById("compressedSize");
const savedPercent = document.getElementById("savedPercent");
const downloadBtn = document.getElementById("downloadBtn");

let selectedFiles = [];
let compressedResults = [];

let originalWidth = 0;
let originalHeight = 0;
let aspectRatio = 1;
let keepAspectRatio = true;

resultCard.style.display = "none";

browseBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  imageInput.click();
});

dropZone.addEventListener("click", (event) => {
  if (
    event.target.closest(".browse-btn") ||
    event.target.closest(".clear-btn")
  ) {
    return;
  }
  imageInput.click();
});

imageInput.addEventListener("change", (event) => {
  const files = event.target.files;
  handleFiles(files);
  imageInput.value = "";
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", (event) => {
  if (!dropZone.contains(event.relatedTarget)) {
    dropZone.classList.remove("dragover");
  }
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("dragover");
  const files = event.dataTransfer.files;
  handleFiles(files);
});

clearBtn.addEventListener("click", (event) => {
  event.stopPropagation();

  selectedFiles = [];
  compressedResults = [];
  imageInput.value = "";

  document.getElementById("uploadPreviews").innerHTML = "";
  clearBtn.style.display = "none";
  resultCard.style.display = "none";

  widthInput.value = "";
  heightInput.value = "";
  originalDimensions.textContent = "Original: —";

  const title = dropZone.querySelector("h2");
  const description = dropZone.querySelector("p");
  if (title) title.textContent = "Drop your images here";
  if (description) {
    description.innerHTML = `or <button class="browse-btn" id="browseBtn">browse files</button>`;

    document.getElementById("browseBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      imageInput.click();
    });
  }
});

function handleFiles(files) {
  if (!files || files.length === 0) return;

  const validFiles = Array.from(files).filter((file) =>
    file.type.startsWith("image/"),
  );

  if (validFiles.length === 0) {
    alert("Please select valid image files.");
    return;
  }

  const maxFileSize = 50 * 1024 * 1024;
  selectedFiles = validFiles.filter((file) => file.size <= maxFileSize);

  if (selectedFiles.length < validFiles.length) {
    alert("Some images were skipped because they exceed the 50MB limit.");
  }

  if (selectedFiles.length === 0) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      originalWidth = img.naturalWidth;
      originalHeight = img.naturalHeight;

      if (originalWidth && originalHeight) {
        aspectRatio = originalWidth / originalHeight;
        widthInput.value = originalWidth;
        heightInput.value = originalHeight;
        originalDimensions.textContent =
          selectedFiles.length > 1
            ? `Reference (File 1): ${originalWidth} × ${originalHeight}`
            : `Original: ${originalWidth} × ${originalHeight}`;
      }
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(selectedFiles[0]);

  const title = dropZone.querySelector("h2");
  const description = dropZone.querySelector("p");

  if (title) {
    title.textContent = `${selectedFiles.length} file(s) selected`;
  }

  if (description) {
    const totalSize = selectedFiles.reduce((acc, file) => acc + file.size, 0);
    description.innerHTML = `<strong>${formatBytes(totalSize)}</strong> total`;
  }

  const previewContainer = document.getElementById("uploadPreviews");
  previewContainer.innerHTML = "";

  selectedFiles.forEach((file) => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.className = "small-preview";
    img.onload = () => URL.revokeObjectURL(img.src);
    previewContainer.appendChild(img);
  });

  clearBtn.style.display = "inline-flex";
  resultCard.style.display = "none";
}

quality.addEventListener("input", () => {
  qualityValue.textContent = quality.value;
});

widthInput.addEventListener("input", () => {
  if (!keepAspectRatio) return;
  const width = Number(widthInput.value);
  if (!width || width <= 0) return;
  heightInput.value = Math.round(width / aspectRatio);
});

heightInput.addEventListener("input", () => {
  if (!keepAspectRatio) return;
  const height = Number(heightInput.value);
  if (!height || height <= 0) return;
  widthInput.value = Math.round(height * aspectRatio);
});

aspectLock.addEventListener("click", () => {
  keepAspectRatio = !keepAspectRatio;
  aspectLock.classList.toggle("active", keepAspectRatio);

  if (keepAspectRatio) {
    const width = Number(widthInput.value);
    if (width > 0 && aspectRatio > 0) {
      heightInput.value = Math.round(width / aspectRatio);
    }
  }
});

const presetButtons = document.querySelectorAll(".resize-presets button");
presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const newWidth = Number(button.dataset.width);
    if (!newWidth) return;
    const finalWidth =
      originalWidth > 0 ? Math.min(newWidth, originalWidth) : newWidth;
    widthInput.value = finalWidth;

    if (keepAspectRatio) {
      heightInput.value = Math.round(finalWidth / aspectRatio);
    }
  });
});

compressBtn.addEventListener("click", async () => {
  if (selectedFiles.length === 0) {
    alert("Please select images first.");
    return;
  }

  const targetWidth = Number(widthInput.value);
  const targetHeight = Number(heightInput.value);

  if (
    !Number.isFinite(targetWidth) ||
    !Number.isFinite(targetHeight) ||
    targetWidth <= 0 ||
    targetHeight <= 0
  ) {
    alert("Please enter valid dimensions.");
    return;
  }

  setCompressingState(true);
  compressedResults = [];
  resultPreviewWrapper.innerHTML = "";

  let totalOriginalSize = 0;
  let totalCompressedSize = 0;

  try {
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const imageURL = URL.createObjectURL(file);
      const img = await loadImage(imageURL);
      URL.revokeObjectURL(imageURL);

      let w = targetWidth;
      let h = targetHeight;

      if (targetWidth === originalWidth && targetHeight === originalHeight) {
        w = img.naturalWidth;
        h = img.naturalHeight;
      } else {
        if (keepAspectRatio) {
          const imgRatio = img.naturalWidth / img.naturalHeight;
          h = Math.round(w / imgRatio);
        }
        if (w > img.naturalWidth) {
          w = img.naturalWidth;
          h = img.naturalHeight;
        }
      }

      const blob = await compressImageBlob(img, w, h);

      compressedResults.push({
        blob: blob,
        name: `compressed-${file.name.split(".")[0]}.${getExtension()}`,
      });

      totalOriginalSize += file.size;
      totalCompressedSize += blob.size;

      const previewImg = document.createElement("img");
      previewImg.src = URL.createObjectURL(blob);
      previewImg.className = "result-small-preview";
      resultPreviewWrapper.appendChild(previewImg);
    }

    originalSize.textContent = formatBytes(totalOriginalSize);
    compressedSize.textContent = formatBytes(totalCompressedSize);
    const savings =
      ((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100;
    savedPercent.textContent = `${Math.max(0, savings).toFixed(1)}%`;

    resultCard.style.display = "block";

    setTimeout(() => {
      resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  } catch (error) {
    console.error("Compression error:", error);
    alert(
      error.message || "Something went wrong while compressing the images.",
    );
  } finally {
    setCompressingState(false);
  }
});

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the selected image."));
    img.src = src;
  });
}

function compressImageBlob(img, width, height) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Your browser does not support canvas."));
      return;
    }

    canvas.width = width;
    canvas.height = height;

    if (format.value === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, width, height);

    const compressionQuality = Number(quality.value) / 100;
    const selectedFormat = format.value;

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Compression failed."));
          return;
        }
        resolve(blob);
      },
      selectedFormat,
      compressionQuality,
    );
  });
}

downloadBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (compressedResults.length === 0) return;

  compressedResults.forEach((result, index) => {
    setTimeout(() => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(result.blob);
      a.download = result.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }, index * 300);
  });
});

function setCompressingState(isCompressing) {
  compressBtn.disabled = isCompressing;
  const buttonText = compressBtn.querySelector("span:first-child");
  const buttonArrow = compressBtn.querySelector("span:last-child");

  if (isCompressing) {
    buttonText.textContent = "Compressing...";
    buttonArrow.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  } else {
    buttonText.textContent = "Resize & compress All";
    buttonArrow.textContent = "→";
  }
}

function getExtension() {
  if (format.value === "image/webp") return "webp";
  return "jpg";
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 Bytes";
  const units = ["Bytes", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return (
    (bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 2) +
    " " +
    units[index]
  );
}
