let qrcode;

const input = document.getElementById('qr-text');
const generateBtn = document.getElementById('generate');
const downloadBtn = document.getElementById('download');
const qrContainer = document.getElementById('qrcode');

function generateQR() {
  const qrText = input.value.trim();
  if (!qrText) return alert("Please enter text!");

  qrContainer.innerHTML = "";
  qrContainer.classList.remove('fade-in');

  // Generate QR
  qrcode = new QRCode(qrContainer, {
    text: qrText,
    width: 256,
    height: 256,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
  });

  // Wait for QR code to render
  setTimeout(() => {
    qrContainer.classList.add('fade-in');
  }, 50);

  downloadBtn.style.display = 'inline-block';
}

// Click event
generateBtn.addEventListener('click', generateQR);

// Keydown event on input (Enter)
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault(); // prevent form submit/reload if inside a form
    generateQR();
  }
});

// Download QR
downloadBtn.addEventListener('click', () => {
  const img = qrContainer.querySelector('img');
  if (img) {
    const link = document.createElement('a');
    link.href = img.src;
    link.download = 'qrcode.png';
    link.click();
  }
});