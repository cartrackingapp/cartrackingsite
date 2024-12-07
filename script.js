const API_KEY = 'AIzaSyDREdLnNXJPerFLQEnb1wGgY6w-nQUtjro';
const SPREADSHEET_ID = '1t72XJ_xk3ckyvb0aBGhlpDPCSmUxi6dGOp7rgXa0yv8';
const SHEET_NAME = 'Sheet1';

let googleSheetsInitialized = false;

// Initialize Google Sheets API
async function initializeGoogleSheets() {
    console.log("Initializing Google Sheets API...");
    try {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
        });
        googleSheetsInitialized = true;
        console.log("Google Sheets API initialized successfully.");
    } catch (error) {
        console.error("Error initializing Google Sheets API:", error);
    }
}

// Load the gapi client and initialize Google Sheets API
function loadGoogleAPI() {
    console.log("Loading Google API client...");
    if (typeof gapi === 'undefined') {
        console.error("Google API client library not loaded.");
        setTimeout(loadGoogleAPI, 1000); // Retry loading the library after 1 second
        return;
    }

    gapi.load('client', async () => {
        await initializeGoogleSheets();
    });
}

// Start Initialization on Page Load
window.onload = () => {
    loadGoogleAPI();
};

// Write Data to Google Sheets
async function writeSheetData(data) {
    if (!googleSheetsInitialized) {
        console.error("Google Sheets API client not loaded. Please wait...");
        return;
    }

    console.log("Writing data to Google Sheets:", data);

    try {
        const response = await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A1`,
            valueInputOption: 'RAW',
            resource: {
                values: [data],
            },
        });

        console.log("Data successfully written to sheet:", response);
    } catch (error) {
        console.error("Error writing data to Google Sheets:", error);
    }
}

// Handle Mileage Form Submission
document.getElementById("mileage-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const currentMileage = parseFloat(document.getElementById("current-mileage").value);
    const endMileage = parseFloat(document.getElementById("end-mileage").value);

    if (currentMileage && endMileage) {
        const totalDistance = endMileage - currentMileage;
        document.getElementById("mileage-output").textContent = `Total Distance: ${totalDistance} km`;

        // Auto-update current mileage for Service Reminder
        document.getElementById("current-mileage-service").value = endMileage;

        // Write data to Google Sheets
        writeSheetData([currentMileage, endMileage, totalDistance]);
    }
});

// Handle Odometer Form Submission
document.getElementById("odometer-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const lastOdometer = parseFloat(document.getElementById("last-odometer").value);
    const currentOdometer = parseFloat(document.getElementById("current-odometer").value);
    const fuelAmount = parseFloat(document.getElementById("fuel-amount").value);
    const fuelPrice = parseFloat(document.getElementById("fuel-price").value);

    if (lastOdometer && currentOdometer && fuelAmount && fuelPrice) {
        const distance = currentOdometer - lastOdometer;
        const costPerKm = fuelPrice / distance;
        const kmPerLiter = distance / fuelAmount;

        document.getElementById("odometer-output").innerHTML = `
            <p>Distance Covered: ${distance} km</p>
            <p>Fuel Efficiency: ${kmPerLiter.toFixed(2)} km/l</p>
            <p>Cost Per Km: $${costPerKm.toFixed(2)}</p>
        `;

        // Write data to Google Sheets
        writeSheetData([lastOdometer, currentOdometer, distance, kmPerLiter.toFixed(2), costPerKm.toFixed(2)]);
    }
});

// Handle Service Reminder Form Submission
document.getElementById("service-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const serviceMileage = parseFloat(document.getElementById("service-mileage").value);
    const currentMileage = parseFloat(document.getElementById("current-mileage-service").value);

    if (serviceMileage > currentMileage) {
        const remainingKm = serviceMileage - currentMileage;
        let reminder = "";

        if (remainingKm <= 25) {
            reminder = "Urgent: Only 25 km left for your next service!";
        } else if (remainingKm <= 50) {
            reminder = "Reminder: Only 50 km left for your next service.";
        } else if (remainingKm <= 100) {
            reminder = "Upcoming: 100 km left for your next service.";
        }

        document.getElementById("service-output").textContent = `
            Next Service at: ${serviceMileage} km
            ${reminder ? `Reminder: ${reminder}` : ""}
        `;
    } else {
        document.getElementById("service-output").textContent = `Error: Service mileage must be greater than the current mileage (${currentMileage} km).`;
    }
});

// Handle Report Generation (Placeholder for now)
document.getElementById("generate-reports").addEventListener("click", function () {
    document.getElementById("reports-output").textContent = "Reports functionality coming soon!";
});
