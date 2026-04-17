# Hardware GPS Integration Guide (Smart Mine)

This guide provides step-by-step instructions on how to use, configure, and benefit from the new Multi-Tenant Hardware Tracker Integration. 

With this upgrade, you can now track vehicles using **Driver's Phone Check-ins** AND **Physical GPS Trackers (Teltonika, Concox, etc.)** simultaneously on the same map.

---

## 1. Initial Setup Checklist

Before seeing trackers on the map, ensure you complete the foundational architecture setup:

1. **Run the Database Migrations** 
   Open your Supabase SQL Editor and run the file located at: 
   `database/full_production_schema.sql` (Note: The schema has been completely updated to automatically create the tracker tables).

2. **Restart Development Server**
   Ensure your Next.js frontend has restarted to detect the API Route changes (`app/api/fleet/tracker-data/route.ts`).

---

## 2. Using the System (The Workflow)

### Step A: Registering a Vehicle
When an administrator registers a vehicle in the **Fleet Registry**, they will see **Section 5: Telemetry & Tracking**.

- **Tracking Method:** Select either "Driver Phone GPS (Basic)" or "Hardware GPS Tracker (Pro)".
- **Tracker IMEI / Serial (If Hardware):** Enter the 15-digit IMEI of the Teltonika/Concox device.
- **Protocol:** Select the manufacturer protocol.

### Step B: The Live Map & Command Center
- The map (`/map`) now automatically listens to the `unified_locations_rt` realtime channel.
- If a vehicle moves using the phone app, it updates via the `vehicle_locations` table.
- If a vehicle moves using a physical tracker, it updates via the `hardware_locations` table and dynamically syncs its **Fuel Level** in real-time.

---

## 3. Integrating Real Trackers (Server Setup)

Physical hardware trackers (Teltonika, Concox) communicate over raw TCP/UDP hex data. To convert this into JSON that Smart Mine can read, you need a "Middleware" service. You have two options:

### Option A: The Easy Managed Way (Flespi / Wialon) - Recommended
If you do not want to manage a server, you can use a 3rd party managed cloud service like **Flespi (flespi.com)**.
1. Create a free account on Flespi.
2. Tell Flespi what tracker you are using (e.g., Teltonika FMB120). It will give you a specific IP and Port.
3. Configure your physical tracker via SMS or PC Cable to send data to Flespi's IP and Port.
4. Go to **Flespi Streams** -> Create an HTTP stream.
5. Point the HTTP stream to your Smart Mine endpoint: `https://your-smart-mine.com/api/fleet/tracker-data`
6. Flespi will automatically parse the hard TCP data into beautiful JSON and send it straight to your Database. You don't host anything!

### Option B: The Self-Hosted Free Way (Traccar)
If you want 100% control and zero recurring fees, you can host your own middleware.
*(Note: We can write an automated installation script for you if you eventually choose this, so you just run one command).*
1. Buy a basic $5 Linux VPS (e.g., DigitalOcean).
2. Install Traccar:
   ```bash
   wget https://www.traccar.org/download/traccar-linux-64-latest.zip
   unzip traccar-linux-64-latest.zip
   sudo ./traccar.run
   ```
3. Open the configs (`/opt/traccar/conf/traccar.xml`) and add:
   ```xml
   <entry key='forward.enable'>true</entry>
   <entry key='forward.url'>https://your-smart-mine-domain.com/api/fleet/tracker-data</entry>
   <entry key='forward.json'>true</entry>
   ```
4. Configure your physical trackers to point to your new VPS IP address (e.g., Port 5013 for Teltonika). Traccar intercepts it, converts to JSON, and forwards it to Smart Mine.

---

## 4. Mobile Driver App Setup (Fallback)
Instruct your mobile app developers to read the `tracking_method` parameter on the vehicle prior to activating tracking.

**Pseudocode for Mobile App:**
```javascript
const vehicle = await getVehicleData(id);

if (vehicle.tracking_method === 'HARDWARE_TRACKER') {
    // CRITICAL: Battery Saving Logic!
    // Turn off background location services on the phone because 
    // the hardware tracker is doing the heavy lifting.
    LocationService.stopBackgroundTracking();
} else {
    // Post GPS location to `vehicle_locations` table as usual.
    LocationService.startBackgroundTracking(); 
}
```

---

## 5. Next Level Value: Fuel Calibration (Pro Tier)
In `lib/fleet/fuel-logic.ts`, you have access to a Fuel Calibration Engine. 
Since hardware trackers measure raw volts/ohms, you can use the `calculateFuelLiters` function to convert analog readings (e.g., 0V - 10V) into physical Liters based on the tank dimensions. This feeds directly into the "Fuel Theft Alerts" on the dashboard.
