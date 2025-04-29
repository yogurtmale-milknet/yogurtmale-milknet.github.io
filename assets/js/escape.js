document.addEventListener("DOMContentLoaded", function() {
    let savedLink = localStorage.getItem("savedLink");

    document.addEventListener("keydown", function(event) {
        if (event.key === ",") {
            if (!savedLink) {
                savedLink = prompt("Escape to:");
                if (savedLink) {
                    localStorage.setItem("savedLink", savedLink);
                }
            } else {
                window.open(savedLink, "_blank");
            }
        }
    });
});