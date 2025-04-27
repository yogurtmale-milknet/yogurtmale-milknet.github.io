document.addEventListener("DOMContentLoaded", function() {
    const messages = [
        "The Interstellar devs tried to sell my cousin fent",
        "What if Cool Math Games was called Cool Meth Games",
        "People care about studying for exams. Not us",
        "Every time you refresh = one Latvian orphanage bombed",
        "unforgettable.dk/42.zip <-- Securly bypass here",
        "Steven loves femboys",
        "Ok that's enough go outside",
        "NEVER GOON",
        "5,000 visits and I drop my Adobe Enterprise login",
        "I'm Tim Cheese, and I killed John Pork. And this is my story. That day. The day I snuck up behind John. You all think you know the story. You don't",
        "I am steve aggressive phonk gaming remix wait wrong tab",
        "GeoGebra ToS trick working 2023 those who know",
        "Shoutout to everypizza.im for being british",
        "Voxel is eating a chicken sandwich come back later",
        "The Ultraviolet devs tried to sell my cousin vitamin gummies"
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    const messageElement = document.getElementById("random-message");

    messageElement.textContent = randomMessage;
    messageElement.style.opacity = 0;
    messageElement.style.transform = "translateY(20px)";
    messageElement.style.transition = "opacity 0.6s ease, transform 0.6s ease";

    setTimeout(() => {
        messageElement.style.opacity = 1;
        messageElement.style.transform = "translateY(0)";
    }, 100);
});