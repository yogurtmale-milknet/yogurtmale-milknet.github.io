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

    const messageElement = document.getElementById("random-message");

    function showRandomMessage() {
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        messageElement.style.opacity = 0;
        messageElement.style.transform = "translateY(20px)";
        messageElement.style.textShadow = "none"; // reset shadow
        setTimeout(() => {
            messageElement.textContent = randomMessage;
            messageElement.style.opacity = 1;
            messageElement.style.transform = "translateY(0)";
            messageElement.style.textShadow = "0 0 8px white"; // apply glow
            setTimeout(() => {
                messageElement.style.textShadow = "none"; // remove
            }, 600); // glow duration
        }, 200); // fade timing
    }

    messageElement.style.transition = "opacity 0.4s ease, transform 0.4s ease, text-shadow 0.6s ease";
    showRandomMessage();
    setInterval(showRandomMessage, 6000);
});
