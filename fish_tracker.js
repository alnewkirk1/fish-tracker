document.addEventListener("DOMContentLoaded", () => {
    const fishContainer = document.getElementById("fish-container");
    let donatedFish = JSON.parse(localStorage.getItem("donatedFish")) || [];
    let showOnlyUndonated = false;

    function getCurrentMonth() {
        const date = new Date();
        return new Intl.DateTimeFormat("en-US", { month: "long" }).format(date);
    }

    function getCurrentHour() {
        return new Date().getHours();
    }

    function getShortMonth(fullMonth) {
        const monthMap = {
            "January": "Jan", "February": "Feb", "March": "Mar", "April": "Apr", "May": "May", "June": "Jun",
            "July": "Jul", "August": "Aug", "September": "Sep", "October": "Oct", "November": "Nov", "December": "Dec"
        };
        return monthMap[fullMonth] || fullMonth;
    }

    function isLeavingThisMonth(fish) {
        const currentMonth = getShortMonth(getCurrentMonth());
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthIndex = months.indexOf(currentMonth);
        return fish.months_available.includes(currentMonth) && !fish.months_available.includes(months[monthIndex + 1]);
    }

    function isFishAvailableNow(fish) {
        const currentHour = getCurrentHour();
        if (fish.time === "All day") return true;
        
        const timeRanges = fish.time.split(" & ");
        return timeRanges.some(range => {
            const [start, end] = range.split(" - ").map(t => {
                let hour = parseInt(t.replace(/\D/g, ""), 10);
                if (t.includes("pm") && hour !== 12) hour += 12;
                if (t.includes("am") && hour === 12) hour = 0;
                return hour;
            });
            
            if (start > end) {
                return currentHour >= start || currentHour < end;
            }
            return currentHour >= start && currentHour < end;
        });
    }

    function fetchFishData() {
        fetch("fish_data_complete.json")
            .then(response => response.json())
            .then(fishData => {
                console.log("Fetched Fish Data:", fishData);
                renderFishList(fishData);
            })
            .catch(error => console.error("Error loading fish data:", error));
    }

    function isMobile() {
        return window.innerWidth <= 768;
    }

    function renderFishList(fishData) {
        fishContainer.innerHTML = "";
        const currentMonthFull = getCurrentMonth();
        const currentMonthShort = getShortMonth(currentMonthFull);
        console.log("Current Month (Short):", currentMonthShort);

        const existingTable = document.querySelector("#fish-table");
        if (existingTable) {
            existingTable.remove();
        }

        const table = document.createElement("table");
        table.id = "fish-table";
        const headerRow = document.createElement("tr");
        
        const headers = isMobile() ? ["Fish", "Location", "Donated"] : ["Fish", "Location", "Time", "Availability", "Donated"];
        headers.forEach(header => {
            const th = document.createElement("th");
            th.textContent = header;
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);
        
        fishData.forEach(fish => {
            if (fish.months_available.includes(currentMonthShort) && isFishAvailableNow(fish)) {
                if (showOnlyUndonated && donatedFish.includes(fish.name)) {
                    return;
                }
                const row = document.createElement("tr");
                row.innerHTML = isMobile()
                    ? `
                        <td>${fish.name}</td>
                        <td>${fish.location}</td>
                        <td>
                            <input type="checkbox" id="${fish.name}" ${donatedFish.includes(fish.name) ? "checked" : ""}>
                        </td>
                    `
                    : `
                        <td>${fish.name}</td>
                        <td>${fish.location}</td>
                        <td>${fish.time}</td>
                        <td>${isLeavingThisMonth(fish) ? "Leaving" : "Available"}</td>
                        <td>
                            <input type="checkbox" id="${fish.name}" ${donatedFish.includes(fish.name) ? "checked" : ""}>
                        </td>
                    `;
                
                if (isLeavingThisMonth(fish)) {
                    row.classList.add("leaving-fish");
                }

                row.querySelector("input").addEventListener("change", (event) => {
                    if (event.target.checked) {
                        donatedFish.push(fish.name);
                    } else {
                        const index = donatedFish.indexOf(fish.name);
                        if (index > -1) {
                            donatedFish.splice(index, 1);
                        }
                    }
                    localStorage.setItem("donatedFish", JSON.stringify(donatedFish));
                    renderFishList(fishData);
                });
                table.appendChild(row);
            }
        });
        
        fishContainer.appendChild(table);
    }

    fetchFishData();

    window.addEventListener("resize", () => renderFishList(fishData));
});