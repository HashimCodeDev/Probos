/**
 * Demo Script for Probos Presentation
 * Shows how trust scores change in real-time based on sensor anomalies
 */

const API_URL = 'http://localhost:5000';

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(text) {
    console.log('\n' + '='.repeat(60));
    log(text, 'bright');
    console.log('='.repeat(60) + '\n');
}

async function wait(seconds) {
    log(`⏳ Waiting ${seconds} seconds...`, 'cyan');
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function getSensorStatus(sensorId) {
    try {
        const response = await fetch(`${API_URL}/api/sensors/${sensorId}/trust-history`);
        const data = await response.json();

        if (data.success && data.data.length > 0) {
            const latest = data.data[0];
            const scoreColor = latest.score >= 80 ? 'green' : latest.score >= 60 ? 'yellow' : 'red';
            log(`   Trust Score: ${latest.score}/100 (${latest.status})`, scoreColor);

            if (latest.lowVariance) log('   ⚠️  Low variance detected', 'yellow');
            if (latest.spikeDetected) log('   ⚠️  Spike detected', 'yellow');
            if (latest.zoneAnomaly) log('   ⚠️  Zone anomaly detected', 'yellow');

            return latest;
        }
    } catch (error) {
        log(`   ✗ Could not fetch status: ${error.message}`, 'red');
    }
    return null;
}

async function sendReading(sensorId, moisture, description) {
    try {
        const reading = {
            sensorId,
            moisture: parseFloat(moisture.toFixed(1)),
            temperature: 22 + Math.random() * 3,
            ec: 1.2 + Math.random() * 0.3,
        };

        const response = await fetch(`${API_URL}/api/readings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reading),
        });

        const data = await response.json();
        if (data.success) {
            log(`✓ ${description}: moisture=${reading.moisture}%`, 'green');
            return true;
        } else {
            log(`✗ Failed: ${data.error}`, 'red');
            return false;
        }
    } catch (error) {
        log(`✗ Failed to send reading: ${error.message}`, 'red');
        return false;
    }
}

async function demonstrateStuckSensor() {
    header('DEMO 1: Stuck Sensor Detection (Low Variance)');

    log('Scenario: A sensor gets stuck and reports the same value repeatedly', 'blue');
    log('Expected: Trust score drops by 15 points for low variance\n', 'blue');

    const sensorId = 'SENSOR-001';
    const stuckValue = 45.0;

    // Send 5 identical readings
    log('Sending 5 identical readings...', 'cyan');
    for (let i = 1; i <= 5; i++) {
        await sendReading(sensorId, stuckValue, `Reading ${i}/5 (stuck at ${stuckValue}%)`);
        await wait(1);
    }

    console.log();
    log('Checking trust score...', 'cyan');
    await getSensorStatus(sensorId);
}

async function demonstrateSpike() {
    header('DEMO 2: Sudden Spike Detection');

    log('Scenario: A sensor reports a sudden dramatic change in moisture', 'blue');
    log('Expected: Trust score drops by 20 points for spike detection\n', 'blue');

    const sensorId = 'SENSOR-002';

    // Send normal readings first
    log('Step 1: Establishing normal baseline...', 'cyan');
    for (let i = 1; i <= 3; i++) {
        await sendReading(sensorId, 35 + Math.random() * 5, 'Normal reading');
        await wait(1);
    }

    console.log();
    log('Step 2: Sending spike reading...', 'cyan');
    await sendReading(sensorId, 90.0, '🔥 SPIKE! (sudden jump to 90%)');
    await wait(2);

    console.log();
    log('Checking trust score...', 'cyan');
    await getSensorStatus(sensorId);
}

async function demonstrateZoneAnomaly() {
    header('DEMO 3: Zone Anomaly Detection');

    log('Scenario: One sensor in a zone reports values very different from neighbors', 'blue');
    log('Expected: Trust score drops by 25 points for zone anomaly\n', 'blue');

    // First, establish normal zone readings
    log('Step 1: Establishing zone baseline with normal sensors...', 'cyan');
    for (let i = 3; i <= 6; i++) {
        const sensorId = `SENSOR-${String(i).padStart(3, '0')}`;
        await sendReading(sensorId, 40 + Math.random() * 10, `Zone sensor ${i} (normal zone)`);
    }
    await wait(2);

    console.log();
    log('Step 2: Sending anomalous reading from test sensor...', 'cyan');
    const testSensor = 'SENSOR-007';
    await sendReading(testSensor, 95.0, '⚡ Anomalous value (way above zone average)');
    await wait(2);

    console.log();
    log('Checking trust score...', 'cyan');
    await getSensorStatus(testSensor);
}

async function demonstrateRecovery() {
    header('DEMO 4: Trust Score Recovery');

    log('Scenario: A sensor returns to normal behavior after an anomaly', 'blue');
    log('Note: Trust scores are historical - you can see the recovery in the trust history\n', 'blue');

    const sensorId = 'SENSOR-008';

    // Create an anomaly first
    log('Step 1: Creating anomaly (stuck sensor)...', 'cyan');
    for (let i = 1; i <= 5; i++) {
        await sendReading(sensorId, 50.0, 'Stuck reading');
        await wait(0.5);
    }

    console.log();
    log('Checking degraded trust score...', 'cyan');
    await getSensorStatus(sensorId);

    console.log();
    log('Step 2: Sending normal varying readings to show recovery...', 'cyan');
    for (let i = 1; i <= 5; i++) {
        const normalValue = 45 + Math.random() * 15;
        await sendReading(sensorId, normalValue, `Normal reading ${i}/5`);
        await wait(0.5);
    }

    console.log();
    log('Checking recovered trust score...', 'cyan');
    await getSensorStatus(sensorId);
}

async function showDashboardSummary() {
    header('System Dashboard Summary');

    try {
        const response = await fetch(`${API_URL}/api/dashboard/summary`);
        const data = await response.json();

        if (data.success) {
            log('Overall System Health:', 'bright');
            console.log(`  📊 Total Sensors: ${data.data.sensors.total}`);

            log(`  ✅ Healthy: ${data.data.sensors.healthy}`, 'green');
            log(`  ⚠️  Warning: ${data.data.sensors.warning}`, 'yellow');
            log(`  ❌ Anomalous: ${data.data.sensors.anomalous}`, 'red');

            console.log(`\n  🎫 Open Tickets: ${data.data.tickets.open}`);
            console.log(`  ✓ Resolved Tickets: ${data.data.tickets.resolved}`);
        }
    } catch (error) {
        log(`Failed to fetch dashboard: ${error.message}`, 'red');
    }
}

async function main() {
    log('\n🌱 Probos Trust Score Demo - Interactive Presentation\n', 'bright');

    log('This script demonstrates how the trust engine detects anomalies', 'cyan');
    log('and adjusts trust scores in real-time.\n', 'cyan');

    const demos = [
        { name: 'Stuck Sensor', func: demonstrateStuckSensor },
        { name: 'Spike Detection', func: demonstrateSpike },
        { name: 'Zone Anomaly', func: demonstrateZoneAnomaly },
        { name: 'Recovery', func: demonstrateRecovery },
    ];

    // Check if specific demo requested
    const demoArg = process.argv[2];

    if (demoArg) {
        const demoIndex = parseInt(demoArg) - 1;
        if (demoIndex >= 0 && demoIndex < demos.length) {
            await demos[demoIndex].func();
        } else {
            log('Invalid demo number. Use: node demo.js [1-4]', 'red');
            console.log('\nAvailable demos:');
            demos.forEach((demo, i) => {
                console.log(`  ${i + 1}. ${demo.name}`);
            });
            process.exit(1);
        }
    } else {
        // Run all demos sequentially
        for (const demo of demos) {
            await demo.func();
            await wait(2);
        }
    }

    await wait(1);
    await showDashboardSummary();

    log('\n✅ Demo complete! Check your dashboard at http://localhost:3000\n', 'green');
}

main().catch(error => {
    log(`\n❌ Demo failed: ${error.message}`, 'red');
    process.exit(1);
});
