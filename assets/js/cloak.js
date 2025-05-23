document.addEventListener("keydown", function (event) {
    if (event.key === ".") {
        let choice = prompt("CLOAK OPTIONS: ALEKS (a), Clever (c), Cool Math Games (cl), Desmos (d), Edpuzzle (e), Google (gl), Google Drive (g), Google Classroom (gc), Google Docs (gd), Google Slides (gs), IXL (i), i-Ready Reading (ir), i-Ready Math (im), Khan Academy (k), Naviance (n), PowerSchool (p), Schoology (s),");

        const options = {
            g: { title: "My Drive - Google Drive", icon: "/assets/img/drive.ico" },
            gc: { title: "Google Classroom", icon: "/assets/img/classroom.ico" },
            c: { title: "Clever | Portal", icon: "/assets/img/clever.ico" },
            p: { title: "Student and Parent Sign In", icon: "/assets/img/powerschool.ico" },
            k: { title: "Khan Academy", icon: "/assets/img/khan.ico" },
            gd: { title: "Google Docs", icon: "/assets/img/docs.ico" },
            s: { title: "Schoology", icon: "/assets/img/schoology.ico" },
            d: { title: "Desmos | Scientific Calculator", icon: "/assets/img/desmos.ico" },
            cl: { title: "Cool Math Games - Free Online Games for Learning and Fun", icon: "/assets/img/coolmathgames.ico" },
            i: { title: "IXL | Math, Language Arts, Science, Social Studies, and Spanish", icon: "/assets/img/ixl.ico" },
            im: { title: "Math To Do, i-Ready", icon: "/assets/img/iready.ico" },
            ir: { title: "Reading To Do, i-Ready", icon: "/assets/img/iready.ico" },
            gl: { title: "google classroom - Google Search", icon: "/assets/img/google.ico" },
            gs: { title: "Google Slides", icon: "/assets/img/slides.ico" },
            a: { title: "ALEKS - Home", icon: "/assets/img/aleks.ico" },
            e: { title: "Edpuzzle", icon: "/assets/img/edpuzzle.ico" },
            n: { title: "Naviance Student", icon: "/assets/img/naviance.ico" },
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
