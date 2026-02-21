# Realtime Data Cron Job - Usage Guide

## Overview
The `realtimeCron.js` script simulates real-time sensor data ingestion by periodically inserting readings from the Dataset/Realtime folder into the database.

## Features
- ✅ Incremental data insertion (tracks position in dataset)
- ✅ Two modes: Single run (for cron) or Continuous
- ✅ Configurable batch size and interval
- ✅ Maintains state between runs
- ✅ Automatically creates sensors and trust scores

## Usage

### 1. Single Run Mode (For Cron Jobs)
Inserts one batch of readings and exits:
```bash
node realtimeCron.js
```

This is ideal for setting up with system cron jobs.

### 2. Continuous Mode
Runs continuously, inserting batches at regular intervals:
```bash
# Default interval: 60 seconds (60000ms)
node realtimeCron.js --continuous

# Custom interval: 30 seconds
node realtimeCron.js --continuous --interval=30000

# Custom interval: 5 minutes
node realtimeCron.js --continuous --interval=300000
```

### 3. Reset State
Clear tracking state and start from the beginning:
```bash
node realtimeCron.js --reset
```

## Configuration

Edit these constants in `realtimeCron.js`:

- **BATCH_SIZE**: Number of readings to insert per run (default: 10)
- **INTERVAL_MS**: Default interval for continuous mode (default: 60000ms = 1 minute)

## Setting Up as Cron Job

### Linux/Mac Cron
Edit your crontab:
```bash
crontab -e
```

Add an entry (example: run every 5 minutes):
```cron
*/5 * * * * cd /path/to/backend && node realtimeCron.js >> /tmp/realtime-cron.log 2>&1
```

### systemd Timer (Linux)
Create `/etc/systemd/system/probos-realtime.service`:
```ini
[Unit]
Description=Probos Realtime Data Ingestion
After=network.target

[Service]
Type=oneshot
User=your-username
WorkingDirectory=/path/to/backend
ExecStart=/usr/bin/node realtimeCron.js
```

Create `/etc/systemd/system/probos-realtime.timer`:
```ini
[Unit]
Description=Run Probos Realtime Data Ingestion every 5 minutes

[Timer]
OnBootSec=1min
OnUnitActiveSec=5min

[Install]
WantedBy=timers.target
```

Enable and start:
```bash
sudo systemctl enable probos-realtime.timer
sudo systemctl start probos-realtime.timer
```

## Running as Background Service

For continuous mode as a background service:

### Using PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start the service
pm2 start realtimeCron.js --name "probos-realtime" -- --continuous --interval=60000

# View logs
pm2 logs probos-realtime

# Stop
pm2 stop probos-realtime

# Restart
pm2 restart probos-realtime

# Auto-start on system boot
pm2 startup
pm2 save
```

### Using nohup
```bash
nohup node realtimeCron.js --continuous --interval=60000 > realtime.log 2>&1 &
```

## State Tracking

The script maintains state in `.realtime-cron-state.json`:
- Tracks reading position for each sensor in each file
- Prevents duplicate insertions
- Allows resuming from last position

**Note**: Don't delete this file unless you want to start ingestion from the beginning.

## Example Workflow

1. **Initial Setup**: Upload historical data
   ```bash
   node uploadDataset.js
   ```

2. **Start Realtime Ingestion**: Run continuous mode
   ```bash
   node realtimeCron.js --continuous --interval=30000
   ```

3. **Monitor**: Check logs and database
   ```bash
   # Check database
   node verifyData.js
   ```

4. **Reset if needed**
   ```bash
   node realtimeCron.js --reset
   ```

## Troubleshooting

### No data being inserted
- Check if realtime files exist in `Dataset/Realtime/`
- Check state file - might have reached end of dataset
- Reset state with `--reset` flag

### Duplicate data
- This shouldn't happen due to state tracking
- If it does, check for multiple instances running

### Performance issues
- Reduce BATCH_SIZE in the script
- Increase interval time
- Check database connection

## Output Example

```
╔════════════════════════════════════════╗
║   Probos Realtime Data Cron Job       ║
╚════════════════════════════════════════╝

📅 Running single batch insert

📊 Realtime Data Ingestion - 2026-02-21T10:30:00.000Z
  ✓ SENSOR_001: Inserted 10 readings (100/500)
  ✓ SENSOR_002: Inserted 10 readings (50/500)
  ✓ SENSOR_003: Inserted 10 readings (200/500)

✅ Batch complete: 30 readings from 3 sensors
📈 Total readings in database: 15430
```
