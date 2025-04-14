let qrcode;

document.getElementById('generate').addEventListener('click', () => {
  const qrText = document.getElementById('qr-text').value.trim();
  if (!qrText) return alert("Please enter text!");

  // Clear previous QR
  document.getElementById('qrcode').innerHTML = "";

  qrcode = new QRCode(document.getElementById('qrcode'), {
    text: qrText,
    width: 256,
    height: 256,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
  });

  document.getElementById('download').style.display = 'inline-block';
});

document.getElementById('download').addEventListener('click', () => {
  const img = document.querySelector('#qrcode img');
  if (img) {
    const link = document.createElement('a');
    link.href = img.src;
    link.download = 'qrcode.png';
    link.click();
  }
});