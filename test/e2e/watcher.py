#!/usr/bin/env python3
"""
Kouma live diagnostic watcher.
Reads live.ndjson, deduplicates, filters noise, prints meaningful events.
Each stdout line = one notification to Claude.
"""
import json, sys, time, os
from datetime import datetime

LOG = '/tmp/kouma-live.ndjson'

# Modules/actions to always skip (pure noise)
SKIP_ACTIONS = {'Mode diagnostic actif'}
SKIP_MODULES_INFO = {'Supabase'}  # Skip routine Supabase INFO — keep ERROR/WARN

# Deduplicate: skip if same (level, module, action) within N seconds
DEDUP_WINDOW = 3
last_seen = {}  # key -> timestamp

def fmt(entry):
    ts = datetime.fromtimestamp(entry['ts'] / 1000).strftime('%H:%M:%S')
    level = entry.get('level', '?').upper()
    module = entry.get('module', '?')
    action = entry.get('action', '?')
    error = entry.get('error', '')
    table = entry.get('table', '')
    detail = entry.get('detail', {})

    parts = [f"[{ts}][{level}][{module}] {action}"]
    if error:
        parts.append(f"ERR: {error}")
    if table and table not in action:
        parts.append(f"table:{table}")
    # Include HTTP status for Supabase calls
    if 'status' in detail and detail['status'] >= 400:
        parts.append(f"HTTP {detail['status']}")
    if 'duration_ms' in detail and detail['duration_ms'] > 1000:
        parts.append(f"{detail['duration_ms']}ms ⚠")
    return ' | '.join(parts)

def should_show(entry):
    level = entry.get('level', 'info')
    module = entry.get('module', '')
    action = entry.get('action', '')

    # Always skip noise
    if action in SKIP_ACTIONS:
        return False

    # Always show errors and warnings
    if level in ('error', 'warn'):
        return True

    # Show auth events always
    if module == 'AuthService':
        return True

    # Show navigation, clicks, forms, JS errors
    if module in ('Navigation', 'Click', 'Form', 'ReactCrash', 'JSError', 'Console', 'UnhandledRejection'):
        return True

    # Show Supabase INSERT/RPC/auth calls (not routine SELECTs)
    if module == 'Supabase':
        if any(k in action for k in ('INSERT', 'UPDATE', 'DELETE', 'RPC', 'token', 'signup')):
            return True
        return False

    return False

def dedup_key(entry):
    return (entry.get('level'), entry.get('module'), entry.get('action', '')[:80])

def watch():
    print(f"[WATCHER] Surveillance de {LOG}", flush=True)
    with open(LOG, 'r') as f:
        f.seek(0, 2)  # Seek to end
        while True:
            line = f.readline()
            if not line:
                time.sleep(0.1)
                continue
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue

            if not should_show(entry):
                continue

            key = dedup_key(entry)
            now = time.time()
            if key in last_seen and now - last_seen[key] < DEDUP_WINDOW:
                continue
            last_seen[key] = now

            print(fmt(entry), flush=True)

if __name__ == '__main__':
    # Wait for log file to exist
    while not os.path.exists(LOG):
        time.sleep(0.5)
    try:
        watch()
    except KeyboardInterrupt:
        pass
