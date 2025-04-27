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
        "I am steve aggressive phonk gaming remix wait wrong tab"
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    const messageElement = document.getElementById("random-message");

    messageElement.textContent = randomMessage;
    messageElement.style.opacity = 0;
    messageElement.style.transform = "translateY(20px)";
    messageElement.style.transition = "opacity 1.5s ease, transform 1.5s ease";

    setTimeout(() => {
        messageElement.style.opacity = 1;
        messageElement.style.transform = "translateY(0)";
    }, 100);
});