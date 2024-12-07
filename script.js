const SPREADSHEET_ID = '1t72XJ_xk3ckyvb0aBGhlpDPCSmUxi6dGOp7rgXa0yv8';
const SHEET_NAME = 'Sheet1';

let tokenClient;
let gapiInited = false;
let gisInited = false;

// Load the GAPI library
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

// Initialize GAPI client with the Google Sheets API
async function initializeGapiClient() {
    console.log("Initializing GAPI client...");
    try {
        await gapi.client.init({
            discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
        });
        gapiInited = true;
        console.log("GAPI client initialized successfully.");
        maybeEnableButtons();
    } catch (error) {
        console.error("Error initializing GAPI client:", error);
    }
}

// Load the Google Identity Services (GIS) library
function gisLoaded() {
    console.log("Loading GIS client...");
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: '569373168648-45r8nv2rbkbsajirmp3113u2rhpn28ro.apps.googleusercontent.com', // Replace with your OAuth 2.0 Client ID
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        callback: '', // Will be set dynamically on auth click
    });
    gisInited = true;
    maybeEnableButtons();
}

// Enable buttons once both GAPI and GIS are initialized
function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        document.getElementById('authorize-button').disabled = false;
    }
}

// Handle user authentication
function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw resp;
        }
        console.log("Access token acquired.");
    };

    if (gapi.client.getToken() === null) {
        // Request an access token
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        // Refresh the token silently
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

// Write data to Google Sheets
async function writeSheetData(data) {
    try {
        const response = await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A1`,
            valueInputOption: 'RAW',
            resource: {
                values: [data],
            },
        });
        console.log("Data written successfully:", response);
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
