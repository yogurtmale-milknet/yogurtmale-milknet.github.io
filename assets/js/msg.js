document.addEventListener("DOMContentLoaded", function () {
    const messages = [
        "The Interstellar devs tried to sell my cousin fent",
        "What if Cool Math Games was called Cool Meth Games",
        "Every time you refresh = one Latvian orphanage bombed",
        "unforgettable.dk/42.zip <-- Securly bypass here",
        "Steven loves femboys",
        "Ok that's enough go outside",
        "NEVER GOON",
        "5,000 visits and I drop my Adobe Enterprise login",
        "I'm Tim Cheese, and I killed John Pork. And this is my story. That day. The day I snuck up behind John. You all think you know the story. You don't",
        "Shoutout to everypizza.im for being british",
        "Voxel is eating a chicken sandwich come back later",
        "The Ultraviolet devs tried to sell my cousin vitamin gummies",
        "https://youtu.be/76p9buRtpL4"
    ];

    const messageElement = document.getElementById("random-message");

    function updateMessage() {
        messageElement.style.opacity = 0;
        messageElement.style.transform = "translateY(20px)";
        
        setTimeout(() => {
            const newMessage = messages[Math.floor(Math.random() * messages.length)];
            messageElement.textContent = newMessage;
            messageElement.style.opacity = 1;
            messageElement.style.transform = "translateY(0)";
        }, 1500);
    }

    updateMessage();

    setInterval(updateMessage, 6000);
});
