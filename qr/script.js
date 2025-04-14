let qrcode;

const input = document.getElementById('qr-text');
const generateBtn = document.getElementById('generate');
const downloadBtn = document.getElementById('download');

function generateQR() {
  const qrText = input.value.trim();
  if (!qrText) return alert("Please enter text!");

  document.getElementById('qrcode').innerHTML = "";

  qrcode = new QRCode(document.getElementById('qrcode'), {
    text: qrText,
    width: 256,
    height: 256,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
  });

  downloadBtn.style.display = 'inline-block';
}

generateBtn.addEventListener('click', generateQR);

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    generateQR();
  }
});

downloadBtn.addEventListener('click', () => {
  const img = document.querySelector('#qrcode img');
  if (img) {
    const link = document.createElement('a');
    link.href = img.src;
    link.download = 'qrcode.png';
    link.click();
  }
});