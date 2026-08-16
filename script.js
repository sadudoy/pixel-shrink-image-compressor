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

let resultCard = document.getElementById("resultCard");

if (!resultCard) {
  resultCard = document.createElement("section");

  resultCard.id = "resultCard";
  resultCard.className = "result-card";

  resultCard.innerHTML = `
    <div class="result-header">
      <div>
        <h2>Your compressed image</h2>
      </div>
    </div>

    <div class="preview-wrapper">
      <img id="preview" alt="Compressed image preview">
    </div>

    <div class="stats">
      <div class="stat">
        <span>Original size</span>
        <strong id="originalSize">—</strong>
      </div>

      <div class="stat">
        <span>Compressed size</span>
        <strong id="compressedSize">—</strong>
      </div>

      <div class="stat highlight">
        <span>Saved</span>
        <strong id="savedPercent">—</strong>
      </div>
    </div>

    <a
      id="downloadBtn"
      class="download-btn"
      href="#"
      download
    >
      <span>Download compressed image</span>
      <span>↓</span>
    </a>
  `;

  compressBtn.closest(".panel").insertAdjacentElement("afterend", resultCard);
}

const preview = document.getElementById("preview");
const originalSize = document.getElementById("originalSize");
const compressedSize = document.getElementById("compressedSize");
const savedPercent = document.getElementById("savedPercent");
const downloadBtn = document.getElementById("downloadBtn");

let selectedFile = null;

let originalWidth = 0;
let originalHeight = 0;

let aspectRatio = 1;

let keepAspectRatio = true;

let currentObjectURL = null;

resultCard.style.display = "none";

browseBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  imageInput.click();
});

dropZone.addEventListener("click", (event) => {
  if (event.target.closest(".browse-btn")) {
    return;
  }

  imageInput.click();
});

imageInput.addEventListener("change", (event) => {
  const file = event.target.files[0];

  handleFile(file);

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

  const file = event.dataTransfer.files[0];

  handleFile(file);
});

function handleFile(file) {
  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    alert("Please select a valid image file.");

    return;
  }

  const maxFileSize = 50 * 1024 * 1024;

  if (file.size > maxFileSize) {
    alert("Image must be smaller than 50MB.");

    return;
  }

  selectedFile = file;

  const reader = new FileReader();

  reader.onload = (event) => {
    const img = new Image();

    img.onload = () => {
      originalWidth = img.naturalWidth;
      originalHeight = img.naturalHeight;

      if (!originalWidth || !originalHeight) {
        alert("Could not determine image dimensions.");

        return;
      }

      aspectRatio = originalWidth / originalHeight;

      widthInput.value = originalWidth;
      heightInput.value = originalHeight;

      originalDimensions.textContent = `Original: ${originalWidth} × ${originalHeight}`;
    };

    img.onerror = () => {
      alert("This image format could not be processed by your browser.");
    };

    img.src = event.target.result;
  };

  reader.onerror = () => {
    alert("Could not read the selected image.");
  };

  reader.readAsDataURL(file);

  const title = dropZone.querySelector("h2");

  const description = dropZone.querySelector("p");

  if (title) {
    title.textContent = file.name;
  }

  if (description) {
    description.innerHTML = `<strong>${formatBytes(file.size)}</strong> selected`;
  }

  resultCard.style.display = "none";

  revokeCurrentObjectURL();
}

quality.addEventListener("input", () => {
  qualityValue.textContent = quality.value;
});

widthInput.addEventListener("input", () => {
  if (!keepAspectRatio) {
    return;
  }

  const width = Number(widthInput.value);

  if (!width || width <= 0) {
    return;
  }

  const height = Math.round(width / aspectRatio);

  heightInput.value = height;
});

heightInput.addEventListener("input", () => {
  if (!keepAspectRatio) {
    return;
  }

  const height = Number(heightInput.value);

  if (!height || height <= 0) {
    return;
  }

  const width = Math.round(height * aspectRatio);

  widthInput.value = width;
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

    if (!newWidth) {
      return;
    }
    const finalWidth =
      originalWidth > 0 ? Math.min(newWidth, originalWidth) : newWidth;

    widthInput.value = finalWidth;

    if (keepAspectRatio) {
      heightInput.value = Math.round(finalWidth / aspectRatio);
    }
  });
});

compressBtn.addEventListener("click", async () => {
  if (!selectedFile) {
    alert("Please select an image first.");

    return;
  }

  const width = Number(widthInput.value);

  const height = Number(heightInput.value);

  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    alert("Please enter valid dimensions.");

    return;
  }

  const maxPixels = 100000000;

  if (width * height > maxPixels) {
    alert(
      "The selected dimensions are too large. " +
        "Please choose smaller dimensions.",
    );

    return;
  }

  if (width > 32767 || height > 32767) {
    alert("The selected dimensions are too large for your browser.");

    return;
  }

  setCompressingState(true);

  try {
    const imageURL = URL.createObjectURL(selectedFile);

    const img = await loadImage(imageURL);

    URL.revokeObjectURL(imageURL);

    await compressImage(img, width, height);
  } catch (error) {
    console.error("Compression error:", error);

    alert(error.message || "Something went wrong while compressing the image.");
  } finally {
    setCompressingState(false);
  }
});

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve(img);
    };

    img.onerror = () => {
      reject(new Error("Could not load the selected image."));
    };

    img.src = src;
  });
}

function compressImage(img, width, height) {
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
          reject(
            new Error(
              "Compression failed. Your browser may not support this output format.",
            ),
          );

          return;
        }

        revokeCurrentObjectURL();

        currentObjectURL = URL.createObjectURL(blob);

        preview.src = currentObjectURL;

        originalSize.textContent = formatBytes(selectedFile.size);

        compressedSize.textContent = formatBytes(blob.size);

        const savings =
          ((selectedFile.size - blob.size) / selectedFile.size) * 100;

        savedPercent.textContent = `${Math.max(0, savings).toFixed(1)}%`;

        downloadBtn.href = currentObjectURL;

        downloadBtn.download = `compressed-${width}x${height}.${getExtension()}`;

        resultCard.style.display = "block";

        setTimeout(() => {
          resultCard.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);

        resolve(blob);
      },
      selectedFormat,
      compressionQuality,
    );
  });
}

function setCompressingState(isCompressing) {
  compressBtn.disabled = isCompressing;

  const buttonText = compressBtn.querySelector("span:first-child");

  const buttonArrow = compressBtn.querySelector("span:last-child");

  if (isCompressing) {
    buttonText.textContent = "Compressing...";
    buttonArrow.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  } else {
    buttonText.textContent = "Resize & compress";
    buttonArrow.textContent = "→";
  }
}

function getExtension() {
  if (format.value === "image/webp") {
    return "webp";
  }

  if (format.value === "image/png") {
    return "png";
  }

  return "jpg";
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 Bytes";
  }

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

function revokeCurrentObjectURL() {
  if (currentObjectURL) {
    URL.revokeObjectURL(currentObjectURL);

    currentObjectURL = null;
  }
}

window.addEventListener("beforeunload", () => {
  revokeCurrentObjectURL();
});
