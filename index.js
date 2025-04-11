document.addEventListener("DOMContentLoaded", function() {
    let savedLink = localStorage.getItem("savedLink");

    document.addEventListener("keydown", function(event) {
        if (event.key === ",") {
            if (!savedLink) {
                savedLink = prompt("Escape to: https://YOURLINK.tld");
                if (savedLink) {
                    localStorage.setItem("savedLink", savedLink);
                }
            } else {
                window.open(savedLink, "_blank");
            }
        }
    });
});

document.addEventListener("keydown", function (event) {
    if (event.key === ".") {
        let choice = prompt("CLOAK OPTIONS: Google Drive (enter g), Google Classroom (enter gc), Google Docs (enter gd), Clever (enter c), PowerSchool (enter p), Khan Academy (enter k), Desmos (enter d), Schoology (enter s), Cool Math Games (enter cmg)");

        const options = {
            g: { title: "My Drive - Google Drive", icon: "/assets/img/drive.ico" },
            gc: { title: "Google Classroom", icon: "/assets/img/classroom.ico" },
            c: { title: "Clever | Portal", icon: "/assets/img/clever.ico" },
            p: { title: "Student and Parent Sign In", icon: "/assets/img/powerschool.ico" },
            k: { title: "Khan Academy", icon: "/assets/img/khan.ico" },
            gd: { title: "Google Docs", icon: "/assets/img/docs.ico" },
            s: { title: "Schoology", icon: "/assets/img/schoology.ico" },
            d: { title: "Desmos | Scientific Calculator", icon: "/assets/img/desmos.ico" },
            cmg: { title: "Cool Math Games - Free Online Games for Learning and Fun", icon: "/assets/img/coolmathgames.ico" },
            i: { title: "IXL | Math, Language Arts, Science, Social Studies, and Spanish", icon: "/assets/img/ixl.ico" },
        };

        if (options[choice]) {
            document.title = options[choice].title;
            changeFavicon(options[choice].icon);
        }
    }
});

function changeFavicon(src) {
    let link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = "image/x-icon";
    link.rel = "shortcut icon";
    link.href = src;
    document.getElementsByTagName("head")[0].appendChild(link);
}
