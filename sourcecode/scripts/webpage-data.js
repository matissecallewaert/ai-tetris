fetch("./content-text/uitleg.txt")
    .then(data => data.text())
    .then(data => {
        document.getElementById("uitleg-content").textContent = data;
    })
    .catch(error => console.log(error))