/**
 * Sample Data Seeder for Probos
 * Run this to populate the database with test sensors and readings
 */

const API_URL = 'http://localhost:5000';

// Sample zones and sensors
const zones = ['Field-A', 'Field-B', 'Field-C'];
const sensorTypes = ['soil_moisture', 'temperature', 'ec'];

async function registerSensors() {
    console.log('📡 Registering sensors...');

    for (let i = 1; i <= 15; i++) {
        const zone = zones[Math.floor(Math.random() * zones.length)];
        const type = sensorTypes[0]; // All moisture sensors for simplicity

        const sensor = {
            sensorId: `SENSOR-${String(i).padStart(3, '0')}`,
            zone,
            type,
            latitude: 37.7749 + (Math.random() - 0.5) * 0.1,
            longitude: -122.4194 + (Math.random() - 0.5) * 0.1,
        };

        try {
            const response = await fetch(`${API_URL}/api/sensors`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sensor),
            });

            const data = await response.json();
            if (data.success) {
                console.log(`✓ Registered ${sensor.sensorId} in ${zone}`);
            }
        } catch (error) {
            console.error(`✗ Failed to register ${sensor.sensorId}:`, error.message);
        }
    }
}

async function sendReadings() {
    console.log('\n📊 Sending sensor readings...');

    // Generate readings for each sensor
    for (let i = 1; i <= 15; i++) {
        const sensorId = `SENSOR-${String(i).padStart(3, '0')}`;

        // Determine sensor behavior
        const behavior = i % 5;
        let moisture;

        switch (behavior) {
            case 0:
                // Stuck sensor (will have low variance)
                moisture = 45.0;
                break;
            case 1:
                // Spike sensor (sudden jump)
                moisture = 80.0;
                break;
            case 2:
                // Zone anomaly (deviates from zone)
                moisture = 10.0;
                break;
            default:
                // Healthy sensor (normal variation)
                moisture = 30 + Math.random() * 30;
        }

        const reading = {
            sensorId,
            moisture: parseFloat(moisture.toFixed(1)),
            temperature: 20 + Math.random() * 10,
            ec: 1.0 + Math.random() * 0.5,
        };

        try {
            const response = await fetch(`${API_URL}/api/readings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reading),
            });

            const data = await response.json();
            if (data.success) {
                console.log(`✓ Reading from ${sensorId}: moisture=${reading.moisture}%`);
            }
        } catch (error) {
            console.error(`✗ Failed to send reading for ${sensorId}:`, error.message);
        }
    }
}

async function sendMultipleReadings() {
    console.log('\n🔄 Sending multiple readings to establish patterns...');

    for (let round = 1; round <= 3; round++) {
        console.log(`\n   Round ${round}/3`);

        for (let i = 1; i <= 15; i++) {
            const sensorId = `SENSOR-${String(i).padStart(3, '0')}`;
            const behavior = i % 5;
            let moisture;

            switch (behavior) {
                case 0:
                    moisture = 45.0; // Stuck
                    break;
                case 1:
                    moisture = 40 + (round * 30); // Spike in round 2
                    break;
                case 2:
                    moisture = 10.0; // Anomaly
                    break;
                default:
                    moisture = 35 + Math.random() * 20;
            }

            const reading = {
                sensorId,
                moisture: parseFloat(moisture.toFixed(1)),
                temperature: 20 + Math.random() * 10,
                ec: 1.0 + Math.random() * 0.5,
            };

            try {
                await fetch(`${API_URL}/api/readings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reading),
                });
            } catch (error) {
                // Silent fail for multiple readings
            }
        }

        // Wait between rounds
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('✓ Multiple readings sent');
}

async function checkStatus() {
    console.log('\n📈 Checking system status...\n');

    try {
        const response = await fetch(`${API_URL}/api/dashboard/summary`);
        const data = await response.json();

        if (data.success) {
            console.log('System Summary:');
            console.log(`  Total Sensors: ${data.data.sensors.total}`);
            console.log(`  Healthy: ${data.data.sensors.healthy}`);
            console.log(`  Warning: ${data.data.sensors.warning}`);
            console.log(`  Anomalous: ${data.data.sensors.anomalous}`);
            console.log(`  Open Tickets: ${data.data.tickets.open}`);
        }
    } catch (error) {
        console.error('Failed to fetch summary:', error.message);
    }
}

async function main() {
    console.log('🌱 Probos Sample Data Seeder\n');

    try {
        await registerSensors();
        await new Promise(resolve => setTimeout(resolve, 2000));

        await sendReadings();
        await new Promise(resolve => setTimeout(resolve, 2000));

        await sendMultipleReadings();
        await new Promise(resolve => setTimeout(resolve, 2000));

        await checkStatus();

        console.log('\n✅ Seeding complete! Visit http://localhost:3000 to view the dashboard.\n');
    } catch (error) {
        console.error('Seeding failed:', error);
    }
}

main();
